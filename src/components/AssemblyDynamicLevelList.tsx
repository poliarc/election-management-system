import React, { useState, useEffect, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import type { SidebarLevel } from "../store/api/partyWiseLevelApi";
import InlineUserDisplay from "./InlineUserDisplay";
import AssignBoothVotersModal from "./AssignBoothVotersModal";
import ResultAnalysisModal from "./ResultAnalysisModal";
import toast from "react-hot-toast";
import { deleteBoothDeletedVoterFile, bulkDeleteBoothDeletedVoterFiles } from "../services/boothDeletedVoterFilesApi";
import { useTranslation } from "react-i18next";
import { useGetDynamicLevelDataQuery } from "../store/api/dynamicLevelApi";

interface AssemblyDynamicLevelListProps {
    levelName: string;
    displayLevelName: string;
    parentLevelName?: string;
    sidebarLevels?: SidebarLevel[];
}

const normalizeLevelName = (value?: string | null) =>
    (value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const buildSidebarHierarchyChain = (
    targetLevel: string,
    levels: SidebarLevel[]
): string[] => {
    if (!targetLevel || levels.length === 0) return [];

    const levelMap = new Map<string, SidebarLevel>();
    levels.forEach((level) => {
        const key = normalizeLevelName(level.level_name);
        if (key) levelMap.set(key, level);
    });

    const normalizedTarget = normalizeLevelName(targetLevel);
    const chain: string[] = [];
    const visited = new Set<string>();
    let current = levelMap.get(normalizedTarget);

    while (current && current.parent_level_name) {
        const parentKey = normalizeLevelName(current.parent_level_name);
        if (!parentKey || parentKey === "assembly" || visited.has(parentKey)) break;

        const parentLevel = levelMap.get(parentKey);
        if (!parentLevel) break;

        chain.unshift(parentLevel.level_name);
        visited.add(parentKey);
        current = parentLevel;
    }

    if (chain.length > 0) {
        return chain;
    }

    // Fallback: use sidebar ordering only after Assembly if parent references are missing
    const assemblyIndex = levels.findIndex((level) => normalizeLevelName(level.level_name) === "assembly");
    const currentIndex = levels.findIndex((level) => normalizeLevelName(level.level_name) === normalizedTarget);

    if (assemblyIndex >= 0 && currentIndex > assemblyIndex) {
        return levels
            .slice(assemblyIndex + 1, currentIndex)
            .map((level) => level.level_name);
    }

    return [];
};

export default function AssemblyDynamicLevelList({
    levelName,
    displayLevelName,
    parentLevelName,
    sidebarLevels,
}: AssemblyDynamicLevelListProps) {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
    const [selectedMandalId, setSelectedMandalId] = useState<number>(0);
    const [selectedPollingCenterId, setSelectedPollingCenterId] = useState<number>(0);
    const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // Sorting state - Default sort by 'id' for proper numerical ordering
    const [sortBy, setSortBy] = useState<string>("id");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    // State for action dropdown and modals
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [showAssignVotersModal, setShowAssignVotersModal] = useState(false);
    const [selectedItemForVoters, setSelectedItemForVoters] = useState<{ id: number; name: string } | null>(null);

    // State for booth-specific features (only used when levelName === "Booth")
    const [uploadingBoothId, setUploadingBoothId] = useState<number | null>(null);
    const [deletingFileId, setDeletingFileId] = useState<number | null>(null);
    const [selectedFileIds, setSelectedFileIds] = useState<Record<number, number[]>>({});
    const [isBulkDeleting, setIsBulkDeleting] = useState<Record<number, boolean>>({});
    const [boothFiles, setBoothFiles] = useState<Record<number, { loading: boolean; error: string | null; data: any[]; fetched: boolean }>>({});
    const [boothFileCounts, setBoothFileCounts] = useState<Record<number, number>>({});
    const [expandedFilesBoothId, setExpandedFilesBoothId] = useState<number | null>(null);
    const [isResultAnalysisModalOpen, setIsResultAnalysisModalOpen] = useState(false);
    const [selectedBoothForAnalysis, setSelectedBoothForAnalysis] = useState<{ boothId: number; assemblyId: number; boothName: string } | null>(null);

    // Reset all filters when levelName changes (navigation to different level)
    useEffect(() => {
        setSearchTerm("");
        setSelectedBlockId(0);
        setSelectedMandalId(0);
        setSelectedPollingCenterId(0);
        setSelectedLevelFilter("");
        setCurrentPage(1);
        setShowItemsWithoutUsers(false);
        setShowItemsWithUsers(false);
        setExpandedItemId(null);
        setItemUsers({});
        setItemUserCounts({});
        setAllLevelItems([]);
        setAllItemsForFilter([]);
        setDynamicFilters({});
        setSelectedFilters({});
        setDynamicFilterData({});
    }, [levelName]);

    // Function to reset all filters manually
    const resetAllFilters = () => {
        setSearchTerm("");
        setSelectedBlockId(0);
        setSelectedMandalId(0);
        setSelectedPollingCenterId(0);
        setSelectedLevelFilter("");
        setCurrentPage(1);
        setShowItemsWithoutUsers(false);
        setShowItemsWithUsers(false);
        setDynamicFilters({});
        setSelectedFilters({});
        setDynamicFilterData({});
        setAllItemsForFilter([]);
        // Don't reset user counts when just clearing filters, only when level changes
    };

    // State for filter data - Assembly context (same as District approach)
    // Dynamic filter state: maps level name to selected ID
    const [selectedFilters, setSelectedFilters] = useState<Record<string, number>>({});

    // Dynamic filter data: maps level name to array of items
    const [dynamicFilterData, setDynamicFilterData] = useState<Record<string, any[]>>({});

    // Keep old state for backward compatibility
    const [dynamicFilters, setDynamicFilters] = useState<Record<string, { id: number; items: any[] }>>({});

    // State for all items of the current level
    const [allLevelItems, setAllLevelItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Client-side all items for card filter (without users / with users)
    const [allItemsForFilter, setAllItemsForFilter] = useState<any[]>([]);
    const [isLoadingAllItems, setIsLoadingAllItems] = useState(false);

    // State for inline user display
    const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
    const [itemUsers, setItemUsers] = useState<Record<number, any[]>>({});

    // State for filtering items without users
    const [showItemsWithoutUsers, setShowItemsWithoutUsers] = useState(false);
    // State for filtering items with users
    const [showItemsWithUsers, setShowItemsWithUsers] = useState(false);
    // State for user counts
    const [itemUserCounts, setItemUserCounts] = useState<Record<number, number>>({});

    // State for dynamic hierarchy order (actual parent-child chain for current level)
    const [actualHierarchyChain, setActualHierarchyChain] = useState<string[]>([]);

    // State for parent information
    const [parentInfo, setParentInfo] = useState<Record<number, any>>({});

    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );

    const user = useSelector((state: RootState) => state.auth.user);
    const partyId = user?.partyId || 0;

    const [assemblyInfo, setAssemblyInfo] = useState({
        assemblyName: "",
        districtName: "",
        assemblyId: 0,
        stateId: 0,
        stateName: "",
        districtId: 0,
    });

    // Fetch actual hierarchy chain for current level - simplified, server data takes priority
    useEffect(() => {
        const fetchActualHierarchy = async () => {
            if (!assemblyInfo.assemblyId || !levelName) return;

            // Priority 1: Use sidebarLevels if available
            if (sidebarLevels && sidebarLevels.length > 0) {
                const targetLevel = sidebarLevels.find(
                    (level) => normalizeLevelName(level.level_name) === normalizeLevelName(levelName)
                );
                if (targetLevel) {
                    const chain = buildSidebarHierarchyChain(levelName, sidebarLevels);
                    if (chain.length > 0) {
                        setActualHierarchyChain(chain);
                        return;
                    }
                }
            }

            // Priority 2: Use parentLevelName prop
            if (parentLevelName) {
                const parentName = parentLevelName.trim();
                if (parentName && normalizeLevelName(parentName) !== normalizeLevelName(levelName)) {
                    setActualHierarchyChain([parentName]);
                    return;
                }
            }

            // Priority 3: Static fallback (server data via effectiveVisibleFilters will override anyway)
            const staticFallback: Record<string, string[]> = {
                "Block": [], "Ward": [], "Zone": [], "Sector": [],
                "Mandal": ["Block"],
                "PollingCenter": ["Block", "Mandal"],
                "Booth": ["Block", "Mandal", "PollingCenter"],
                "Locality": [],
            };
            setActualHierarchyChain(staticFallback[levelName] || []);
        };

        fetchActualHierarchy();
    }, [assemblyInfo.assemblyId, levelName, sidebarLevels]);

    useEffect(() => {
        if (selectedAssignment) {
            setAssemblyInfo({
                assemblyName: selectedAssignment.levelName || selectedAssignment.displayName || "",
                districtName: selectedAssignment.parentLevelName || "",
                assemblyId: selectedAssignment.stateMasterData_id || 0,
                stateId: (selectedAssignment as any).state_id || user?.state_id || 0,
                stateName: (selectedAssignment as any).state_name || selectedAssignment.stateName || "",
                districtId: (selectedAssignment as any).district_id || selectedAssignment.parentId || 0,
            });
        }
    }, [selectedAssignment, user]);

    // Determine which filters to show based on actual hierarchy chain
    const getVisibleFilters = (): string[] => {
        // Return the actual parent chain for current level
        // If empty, means current level is direct child of assembly (no filters needed)
        return actualHierarchyChain.filter(
            (level) => normalizeLevelName(level) !== "assembly"
        );
    };
    // visibleFilters will be overridden after dynamicLevelData is available (see below)
    const visibleFilters = getVisibleFilters();

    // Sorting helpers
    const getSortValue = (item: any, key: string): string | number => {
        if (!item) return "";

        if (key === "id") {
            return item.id || 0;
        }

        if (key === "Assembly") {
            return item.assemblyName || assemblyInfo.assemblyName || "";
        }

        if (key === displayLevelName || key === "Name") {
            // When user clicks the main level name column, sort by unique id (as requested)
            return item.id || 0;
        }

        const normalizedKey = key.toLowerCase();

        const properties = [
            `${normalizedKey}Name`,
            `${normalizedKey}_name`,
            `${normalizedKey}name`,
            `${normalizedKey}_Name`,
        ];

        for (const prop of properties) {
            if (item[prop]) return item[prop];
        }

        if (item.parentLevelType === key && item.parentLevelName) {
            return item.parentLevelName;
        }

        if (item.parentHierarchy && Array.isArray(item.parentHierarchy)) {
            const parentKeyName = Object.keys(item).find((x) => x.toLowerCase().includes(normalizedKey));
            if (parentKeyName && item[parentKeyName]) return item[parentKeyName];
        }

        return "";
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(column);
            setSortDirection("asc");
        }

        setCurrentPage(1);
    };

    // Handle filter change - when a filter is changed, reset all filters after it (same as District)
    const handleFilterChange = (levelName: string, value: number) => {
        const changedLevelIndex = effectiveVisibleFilters.indexOf(levelName);

        // Update the selected filter
        const newFilters = { ...selectedFilters };
        newFilters[levelName] = value;

        // Reset all filters after this one
        for (let i = changedLevelIndex + 1; i < effectiveVisibleFilters.length; i++) {
            newFilters[effectiveVisibleFilters[i]] = 0;
        }

        setSelectedFilters(newFilters);
        setAllItemsForFilter([]); // Reset so card-click re-fetches with new filters
        setShowItemsWithoutUsers(false);
        setShowItemsWithUsers(false);

        // Backward compatibility
        if (levelName === "Block") {
            setSelectedBlockId(value);
            setSelectedMandalId(0);
            setSelectedPollingCenterId(0);
        } else if (levelName === "Mandal") {
            setSelectedMandalId(value);
            setSelectedPollingCenterId(0);
        } else if (levelName === "PollingCenter") {
            setSelectedPollingCenterId(value);
        }

        setCurrentPage(1);
    };

    // Get current level items based on filters - Assembly context (same as District)
    const getCurrentLevelItems = () => {
        const useAllItems =
            showItemsWithoutUsers ||
            showItemsWithUsers ||
            (searchTerm.trim().length > 0 && allItemsForFilter.length > 0);
        let filteredItems = useAllItems ? allItemsForFilter : allLevelItems;

        if (filteredItems.length === 0) return [];

        const hasApiFilters = Object.keys(selectedFilters).some(
            (key) => selectedFilters[key] && selectedFilters[key] > 0
        );

        if (hasApiFilters && !useAllItems) {
            return filteredItems;
        }

        // Filter by all selected filters (use selectedFilters keys directly)
        Object.entries(selectedFilters).forEach(([filterLevel, selectedIdForFilter]) => {
            if (selectedIdForFilter && selectedIdForFilter > 0) {
                filteredItems = filteredItems.filter((item) => {
                    if (item.parentLevelId === selectedIdForFilter) return true;
                    if (item.parentChain && item.parentChain[filterLevel] === selectedIdForFilter) return true;
                    const levelKey = filterLevel.toLowerCase();
                    if (item[`${levelKey}Id`] === selectedIdForFilter) return true;
                    if (item[`${levelKey}_id`] === selectedIdForFilter) return true;
                    if (item.parentLevelType === filterLevel && item.parentLevelId === selectedIdForFilter) return true;
                    return false;
                });
            }
        });

        return filteredItems;
    };

    const levelItems = getCurrentLevelItems();

    // Initialize user counts from API data when allLevelItems is loaded
    useEffect(() => {
        if (allLevelItems.length > 0) {
            // Reset user counts completely for new level data
            const initialUserCounts: Record<number, number> = {};

            allLevelItems.forEach(item => {
                // Set initial count from API data if available
                if (item.user_count !== undefined) {
                    initialUserCounts[item.id] = item.user_count || 0;
                }
            });

            setItemUserCounts(initialUserCounts);
        } else {
            // Clear user counts when no items
            setItemUserCounts({});
        }
    }, [allLevelItems]);

    // Fetch parent information for all items using the after-assembly API
    // Note: parentItemName is now available directly from dynamicLevelV2 API response
    // This effect is kept for backward compatibility when viewing user details

    // Fetch ALL items (large limit) for card-click filters (without users / with users)
    const fetchAllItemsForFilter = async () => {
        if (isLoadingAllItems || !resolvedPartyId || !levelName || !resolvedStateId || !resolvedAssemblyId) return;

        setIsLoadingAllItems(true);
        try {
            const allItems: any[] = [];
            let page = 1;
            const limit = 5000;
            let totalPages = 1;
            const baseUrl = `${import.meta.env.VITE_API_BASE_URL}/api/v2/dash/dynamicLevelV2/${resolvedStateId}`;

            while (page <= totalPages) {
                const url = new URL(baseUrl);
                url.searchParams.append("partyId", String(resolvedPartyId));
                url.searchParams.append("levelName", levelName);
                url.searchParams.append("page", String(page));
                url.searchParams.append("limit", String(limit));
                url.searchParams.append("assemblyId", String(resolvedAssemblyId));
                if (assemblyInfo.districtId) url.searchParams.append("districtId", String(assemblyInfo.districtId));
                if (afterAssemblyIdForQuery) url.searchParams.append("afterAssemblyId", String(afterAssemblyIdForQuery));

                const response = await fetch(url.toString(), {
                    headers: { Authorization: `Bearer ${localStorage.getItem("auth_access_token")}` },
                });
                const data = await response.json();

                const pageItems = (data?.data?.items || []).filter((item: any) => item.itemLevelType === levelName);
                const mappedPageItems = pageItems.map((item: any) => {
                    const ancestorMap: Record<string, string> = {};
                    if (item.ancestors && item.ancestors.length > 0) {
                        item.ancestors.forEach((a: any) => { ancestorMap[a.levelType] = a.name; });
                    }
                    return {
                        id: item.itemId,
                        displayName: item.itemName,
                        levelName: item.itemLevelType,
                        parentId: item.parentItemId,
                        parentLevelId: item.parentItemId,
                        parentLevelName: item.parentItemName,
                        parentLevelType: item.parentItemLevelType,
                        districtId: item.districtId,
                        districtName: item.districtName,
                        assemblyId: item.assemblyId,
                        assemblyName: item.assemblyName,
                        users: item.users || [],
                        user_count: item.userCount || 0,
                        userCount: item.userCount || 0,
                        ancestors: item.ancestors || [],
                        ancestorMap,
                    };
                });
                allItems.push(...mappedPageItems);

                const responseTotalPages = data?.pagination?.totalPages || data?.data?.pagination?.totalPages;
                totalPages = responseTotalPages || page;
                page += 1;
            }

            setAllItemsForFilter(allItems);
        } catch (error) {
            console.error("Error fetching all items for filter:", error);
        } finally {
            setIsLoadingAllItems(false);
        }
    };

    // Handle items without users filter
    const handleItemsWithoutUsersClick = async () => {
        if (totalWithoutUsersCount > 0) {
            if (showItemsWithoutUsers) {
                setShowItemsWithoutUsers(false);
                setCurrentPage(1);
                return;
            }
            if (allItemsForFilter.length === 0) {
                await fetchAllItemsForFilter();
            }
            setShowItemsWithoutUsers(true);
            setShowItemsWithUsers(false);
            setCurrentPage(1);
        }
    };

    // Handle items with users filter
    const handleItemsWithUsersClick = async () => {
        if (totalUsersCount > 0) {
            if (showItemsWithUsers) {
                setShowItemsWithUsers(false);
                setCurrentPage(1);
                return;
            }
            if (allItemsForFilter.length === 0) {
                await fetchAllItemsForFilter();
            }
            setShowItemsWithUsers(true);
            setShowItemsWithoutUsers(false);
            setCurrentPage(1);
        }
    };

    const filteredLevelItems = levelItems.filter((item) => {
        const matchesSearch = item.displayName
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesFilter =
            selectedLevelFilter === "" || item.id.toString() === selectedLevelFilter;

        const matchesWithoutUsersFilter = showItemsWithoutUsers
            ? (itemUserCounts[item.id] !== undefined
                ? itemUserCounts[item.id]
                : item.user_count || 0) === 0
            : true;

        const matchesWithUsersFilter = showItemsWithUsers
            ? (itemUserCounts[item.id] !== undefined
                ? itemUserCounts[item.id]
                : item.user_count || 0) > 0
            : true;

        return (
            matchesSearch &&
            matchesFilter &&
            matchesWithoutUsersFilter &&
            matchesWithUsersFilter
        );
    });

    const sortedLevelItems = [...filteredLevelItems].sort((a, b) => {
        if (!sortBy) return 0;
        const aValue = getSortValue(a, sortBy);
        const bValue = getSortValue(b, sortBy);

        if (typeof aValue === "number" && typeof bValue === "number") {
            return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        return sortDirection === "asc"
            ? String(aValue).localeCompare(String(bValue), undefined, { numeric: true })
            : String(bValue).localeCompare(String(aValue), undefined, { numeric: true });
    });

    const handleViewUsers = async (itemId: number) => {
        if (expandedItemId === itemId) {
            setExpandedItemId(null);
            return;
        }

        if (itemUsers[itemId]) {
            setExpandedItemId(itemId);
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/after-assembly/${itemId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                    },
                }
            );
            const data = await response.json();

            if (data.success && data.data?.users) {
                setItemUsers((prev) => ({
                    ...prev,
                    [itemId]: data.data.users,
                }));

                setItemUserCounts((prev) => ({
                    ...prev,
                    [itemId]: data.data.users.length,
                }));

                if (data.data.parentDetails) {
                    const parentDetails = data.data.parentDetails;
                    setParentInfo((prev) => ({
                        ...prev,
                        [parentDetails.id]: {
                            id: parentDetails.id,
                            displayName: parentDetails.displayName,
                            levelName: parentDetails.levelName,
                        },
                    }));
                }

                setExpandedItemId(itemId);
            }
        } catch (error) {
            console.error(`Error fetching users for item ${itemId}:`, error);
        }
    };

    // Fetch all items for the current level - Assembly context using dynamicLevelV2 API
    // afterAssemblyId = most recently selected filter in the hierarchy chain
    const getAfterAssemblyIdForQuery = () => {
        // Use all selected filters - return the most specific (deepest) one
        const entries = Object.entries(selectedFilters).filter(([, v]) => v && v > 0);
        if (entries.length === 0) return undefined;
        // Return the last selected filter value (most specific)
        return entries[entries.length - 1][1];
    };

    const afterAssemblyIdForQuery = getAfterAssemblyIdForQuery();

    // Resolve stateId from multiple sources - assemblyInfo may not be set yet on first render
    const resolvedStateId = (() => {
        if (assemblyInfo.stateId) return assemblyInfo.stateId;
        if (user?.state_id) return user.state_id;
        try {
            const authState = localStorage.getItem("auth_state");
            if (authState) {
                const parsed = JSON.parse(authState);
                const sid = parsed?.user?.state_id || parsed?.user?.stateId || 0;
                if (sid) return sid;
            }
            const rawUser = localStorage.getItem("auth_user");
            const parsedUser = rawUser ? JSON.parse(rawUser) : {};
            return parsedUser.state_id || parsedUser.stateId || 0;
        } catch {
            return 0;
        }
    })();

    // Resolve assemblyId from selectedAssignment or localStorage
    const resolvedAssemblyId = (() => {
        if (assemblyInfo.assemblyId) return assemblyInfo.assemblyId;
        if (selectedAssignment?.stateMasterData_id) return selectedAssignment.stateMasterData_id;
        try {
            const authState = localStorage.getItem("auth_state");
            if (authState) {
                const parsed = JSON.parse(authState);
                return parsed?.selectedAssignment?.stateMasterData_id || 0;
            }
        } catch {
            return 0;
        }
        return 0;
    })();

    // Resolve partyId from user or localStorage
    const resolvedPartyId = (() => {
        if (partyId) return partyId;
        try {
            const authState = localStorage.getItem("auth_state");
            if (authState) {
                const parsed = JSON.parse(authState);
                return parsed?.user?.partyId || 0;
            }
        } catch {
            return 0;
        }
        return 0;
    })();

    const {
        data: dynamicLevelData,
        isLoading: isDynamicLevelLoading,
        isFetching: isDynamicLevelFetching,
    } = useGetDynamicLevelDataQuery(
        {
            stateId: resolvedStateId,
            partyId: resolvedPartyId,
            levelName,
            districtId: assemblyInfo.districtId,
            assemblyId: resolvedAssemblyId,
            afterAssemblyId: afterAssemblyIdForQuery,
            page: currentPage,
            limit: itemsPerPage,
        },
        {
            skip:
                !resolvedPartyId ||
                !resolvedStateId ||
                !resolvedAssemblyId ||
                !levelName,
        }
    );

    useEffect(() => {
        setIsLoading(isDynamicLevelLoading || isDynamicLevelFetching);
    }, [isDynamicLevelLoading, isDynamicLevelFetching]);

    // Derive visibleFilters from API response - server knows the correct hierarchy
    // Only include levels that have actual data (non-empty list) and are not the current level
    const serverVisibleFilters: string[] = dynamicLevelData?.hierarchicalList
        ? dynamicLevelData.hierarchicalList
            .filter((h) =>
                normalizeLevelName(h.levelName) !== normalizeLevelName(levelName) &&
                h.list && h.list.length > 0
            )
            .map((h) => h.levelName)
        : [];

    // Use server-derived filters if available, otherwise fall back to BFS chain
    const effectiveVisibleFilters = serverVisibleFilters.length > 0 ? serverVisibleFilters : visibleFilters;

    // Populate filter data from API response (hierarchicalList, assemblyList, districtList)
    useEffect(() => {
        if (!dynamicLevelData) return;

        const newDynamicFilterData: Record<string, any[]> = {};

        if (dynamicLevelData.hierarchicalList && dynamicLevelData.hierarchicalList.length > 0) {
            dynamicLevelData.hierarchicalList.forEach((hierarchyLevel) => {
                if (hierarchyLevel.list && hierarchyLevel.list.length > 0) {
                    newDynamicFilterData[hierarchyLevel.levelName] = hierarchyLevel.list.map(
                        (item) => ({
                            id: item.id,
                            displayName: item.name,
                            levelName: hierarchyLevel.levelName,
                            parentId: item.parentId,
                        })
                    );
                }
            });
        }

        setDynamicFilterData(newDynamicFilterData);
    }, [dynamicLevelData]);

    // Map API response items to allLevelItems
    useEffect(() => {
        if (!dynamicLevelData?.items) {
            setAllLevelItems([]);
            return;
        }

        const currentLevelItems = dynamicLevelData.items.filter(
            (item) => item.itemLevelType === levelName
        );

        const mappedItems = currentLevelItems.map((item) => {
            // Build ancestor map: levelType -> name (e.g. "Block" -> "Baitamari BCC")
            const ancestorMap: Record<string, string> = {};
            if (item.ancestors && item.ancestors.length > 0) {
                item.ancestors.forEach((a) => {
                    ancestorMap[a.levelType] = a.name;
                });
            }

            return {
                id: item.itemId,
                displayName: item.itemName,
                levelName: item.itemLevelType,
                parentId: item.parentItemId,
                parentLevelId: item.parentItemId,
                parentLevelName: item.parentItemName,
                parentLevelType: item.parentItemLevelType,
                districtId: item.districtId,
                districtName: item.districtName,
                assemblyId: item.assemblyId,
                assemblyName: item.assemblyName,
                users: item.users || [],
                user_count: item.userCount || 0,
                userCount: item.userCount || 0,
                ancestors: item.ancestors || [],
                ancestorMap,
            };
        });

        setAllLevelItems(mappedItems);
    }, [dynamicLevelData, levelName]);

    const getStateDetails = () => {
        const rawUser = localStorage.getItem("auth_user");
        const parsedUser = rawUser ? JSON.parse(rawUser) : {};

        const stateNameFromAssignment =
            (selectedAssignment as any)?.stateName ||
            (selectedAssignment as any)?.state_name ||
            "";

        const stateName =
            assemblyInfo.stateName ||
            stateNameFromAssignment ||
            parsedUser.state_name ||
            parsedUser.stateName ||
            parsedUser.state?.name ||
            "";

        return {
            stateId:
                assemblyInfo.stateId || parsedUser.state_id || parsedUser.stateId || 0,
            stateName: stateName || "Unknown",
        };
    };

    const handleFileUpload = async (boothId: number, boothName: string, file: File) => {
        const { stateId, stateName } = getStateDetails();

        if (!stateId) {
            toast.error("State ID not found. Please re-login and try again.");
            return;
        }

        const allowedTypes = [
            "application/pdf",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
            "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (
            !allowedTypes.includes(file.type) &&
            !file.name.match(/\.(pdf|csv|xls|xlsx|txt|doc|docx)$/i)
        ) {
            toast.error("Unsupported file type. Use PDF, CSV, XLS, XLSX, TXT, DOC, or DOCX.");
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            toast.error("File too large. Max size is 50MB.");
            return;
        }

        setUploadingBoothId(boothId);

        const formData = new FormData();
        formData.append("voterFile", file);
        formData.append("stateId", String(stateId));
        formData.append("stateName", stateName);
        if (assemblyInfo.districtName)
            formData.append("districtName", assemblyInfo.districtName);
        if (assemblyInfo.assemblyName)
            formData.append("assemblyName", assemblyInfo.assemblyName);
        formData.append("boothId", String(boothId));

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/booth-deleted-voter-files/create`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("auth_access_token") || ""}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok || !data?.success) {
                throw new Error(data?.message || "Failed to upload file");
            }

            toast.success(`File uploaded for ${boothName}`);

            setBoothFileCounts((prev) => ({
                ...prev,
                [boothId]: (prev[boothId] || 0) + 1,
            }));
        } catch (uploadError) {
            console.error("Error uploading deleted voter file:", uploadError);
            toast.error(uploadError instanceof Error ? uploadError.message : "Upload failed");
        } finally {
            setUploadingBoothId(null);
        }
    };

    const handleFileChange = (boothId: number, boothName: string) => (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        handleFileUpload(boothId, boothName, file);
    };

    const handleViewFiles = async (boothId: number) => {
        if (expandedFilesBoothId === boothId) {
            setExpandedFilesBoothId(null);
            return;
        }

        if (boothFiles[boothId]?.fetched) {
            setExpandedFilesBoothId(boothId);
            return;
        }

        setBoothFiles((prev) => ({
            ...prev,
            [boothId]: { loading: true, error: null, data: [], fetched: false },
        }));

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/booth-deleted-voter-files/booth/${boothId}?page=1&limit=20`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                    },
                }
            );
            const data = await response.json();

            if (!response.ok || !data?.success) {
                throw new Error(data?.message || "Failed to fetch files");
            }

            setBoothFiles((prev) => ({
                ...prev,
                [boothId]: {
                    loading: false,
                    error: null,
                    data: data.data || [],
                    fetched: true,
                },
            }));
            setExpandedFilesBoothId(boothId);
        } catch (error) {
            console.error(`Error fetching files for booth ${boothId}:`, error);
            setBoothFiles((prev) => ({
                ...prev,
                [boothId]: {
                    loading: false,
                    error: error instanceof Error ? error.message : "Failed to fetch files",
                    data: [],
                    fetched: true,
                },
            }));
            toast.error(error instanceof Error ? error.message : "Unable to load files");
        }
    };

    const handleDeleteFile = async (fileId: number, boothId: number) => {
        if (!confirm("Are you sure you want to delete this file?")) return;

        setDeletingFileId(fileId);

        try {
            const result = await deleteBoothDeletedVoterFile(fileId);

            if (result.success) {
                toast.success("File deleted successfully");

                setBoothFileCounts((prev) => ({
                    ...prev,
                    [boothId]: Math.max(0, (prev[boothId] || 0) - 1),
                }));

                setBoothFiles((prev) => ({
                    ...prev,
                    [boothId]: { loading: false, error: null, data: [], fetched: false },
                }));

                handleViewFiles(boothId);
            } else {
                throw new Error(result.message || "Failed to delete file");
            }
        } catch (error) {
            console.error("Error deleting file:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete file");
        } finally {
            setDeletingFileId(null);
        }
    };

    const handleFileSelection = (boothId: number, fileId: number, isSelected: boolean) => {
        setSelectedFileIds((prev) => {
            const boothSelections = prev[boothId] || [];
            if (isSelected) {
                return { ...prev, [boothId]: [...boothSelections, fileId] };
            } else {
                return { ...prev, [boothId]: boothSelections.filter((id) => id !== fileId) };
            }
        });
    };

    const handleSelectAllFiles = (boothId: number, fileIds: number[], selectAll: boolean) => {
        setSelectedFileIds((prev) => ({
            ...prev,
            [boothId]: selectAll ? fileIds : [],
        }));
    };

    const handleBulkDelete = async (boothId: number) => {
        const selectedIds = selectedFileIds[boothId] || [];
        if (selectedIds.length === 0) {
            toast.error("Please select files to delete");
            return;
        }

        if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected file(s)?`)) return;

        setIsBulkDeleting((prev) => ({ ...prev, [boothId]: true }));

        try {
            const result = await bulkDeleteBoothDeletedVoterFiles(selectedIds);

            if (result.success) {
                const deletedCount = result.deletedCount || 0;
                if (deletedCount === selectedIds.length) {
                    toast.success(`${deletedCount} file(s) deleted successfully`);
                } else {
                    toast.success(`${deletedCount} out of ${selectedIds.length} file(s) deleted successfully`);
                }

                setSelectedFileIds((prev) => ({ ...prev, [boothId]: [] }));

                setBoothFileCounts((prev) => ({
                    ...prev,
                    [boothId]: Math.max(0, (prev[boothId] || 0) - deletedCount),
                }));

                setBoothFiles((prev) => ({
                    ...prev,
                    [boothId]: { loading: false, error: null, data: [], fetched: false },
                }));

                handleViewFiles(boothId);
            } else {
                throw new Error(result.message || "Failed to delete files");
            }
        } catch (error) {
            console.error("Error bulk deleting files:", error);
            toast.error(error instanceof Error ? error.message : "Failed to delete files");
        } finally {
            setIsBulkDeleting((prev) => ({ ...prev, [boothId]: false }));
        }
    };

    const handleResultAnalysisClick = (booth: any) => {
        setSelectedBoothForAnalysis({
            boothId: booth.id,
            assemblyId: assemblyInfo.assemblyId,
            boothName: booth.displayName,
        });
        setIsResultAnalysisModalOpen(true);
    };

    const fetchAllBoothFileCounts = async (booths: any[]) => {
        const token = localStorage.getItem("auth_access_token");
        if (!token || booths.length === 0) return;

        const counts: Record<number, number> = {};
        const batchSize = 10;

        for (let i = 0; i < booths.length; i += batchSize) {
            const batch = booths.slice(i, i + batchSize);
            const promises = batch.map(async (booth) => {
                try {
                    const response = await fetch(
                        `${import.meta.env.VITE_API_BASE_URL}/api/booth-deleted-voter-files/booth/${booth.id}?page=1&limit=1`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                    const data = await response.json();

                    if (response.ok && data?.success && data?.pagination) {
                        counts[booth.id] = data.pagination.total || 0;
                    } else {
                        counts[booth.id] = 0;
                    }
                } catch (error) {
                    console.error(`Error fetching file count for booth ${booth.id}:`, error);
                    counts[booth.id] = 0;
                }
            });

            await Promise.all(promises);
            setBoothFileCounts((prev) => ({ ...prev, ...counts }));
        }
    };

    // Fetch file counts when booths are loaded
    useEffect(() => {
        if (levelName === "Booth" && allLevelItems.length > 0) {
            fetchAllBoothFileCounts(allLevelItems);
        }
    }, [allLevelItems, levelName]);

    const useClientSidePagination =
        showItemsWithoutUsers ||
        showItemsWithUsers ||
        selectedLevelFilter !== "" ||
        (searchTerm.trim().length > 0 && allItemsForFilter.length > 0);

    const totalPages = useClientSidePagination
        ? Math.ceil(sortedLevelItems.length / itemsPerPage)
        : dynamicLevelData?.pagination?.totalPages || Math.ceil(sortedLevelItems.length / itemsPerPage);

    const paginatedItems = useClientSidePagination
        ? sortedLevelItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : sortedLevelItems;

    const totalItemsCount =
        dynamicLevelData?.pagination?.total ||
        dynamicLevelData?.metaData?.totalItems ||
        levelItems.length;

    const totalUsersCount =
        dynamicLevelData?.metaData?.totalUsers ||
        levelItems.reduce((sum, item) => sum + (item.user_count || 0), 0);

    const totalWithoutUsersCount =
        dynamicLevelData?.metaData?.levelWithoutUsers ||
        levelItems.filter((item) => (item.user_count || 0) === 0).length;

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br bg-[var(--bg-card)] p-1">
                <div className="flex items-center justify-center h-64">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br bg-[var(--bg-card)] p-1">
                <div className="w-full mx-auto">
                    {/* Header with Stats Cards */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-3 mb-1 text-white">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="shrink-0">
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                                    {displayLevelName} {t("AssemblyDynamic.List")}
                                </h1>
                                <p className="text-blue-100 mt-1 text-xs sm:text-sm">
                                    {t("AssemblyDynamic.Assembly")}: {assemblyInfo.assemblyName} | {t("AssemblyDynamic.District")}: {assemblyInfo.districtName}
                                </p>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                                    {/* Total Items Card */}
                                    <div className="bg-[var(--bg-card)] text-[var(--text-color)] rounded-md shadow-md p-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-[var(--text-secondary)]">
                                                {t("AssemblyDynamic.Total")} {displayLevelName}s
                                            </p>
                                            <p className="text-xl sm:text-2xl font-semibold mt-1">
                                                {totalItemsCount}
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 rounded-full p-1.5">
                                            <svg
                                                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 3L3 9l9 6 9-6-9-6zm0 6v12"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    {/* Total Users Card - Clickable */}
                                    <div
                                        onClick={handleItemsWithUsersClick}
                                        className={`bg-[var(--bg-card)] text-[var(--text-color)] rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${totalUsersCount > 0
                                            ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-green-50"
                                            : "cursor-default"
                                            } ${showItemsWithUsers
                                                ? "ring-2 ring-green-500 bg-green-50"
                                                : ""
                                            }`}
                                        title={
                                            totalUsersCount > 0
                                                ? `Click to view ${displayLevelName.toLowerCase()}s with users`
                                                : `No ${displayLevelName.toLowerCase()}s with users`
                                        }
                                    >
                                        <div>
                                            <p className="text-xs font-medium text-[var(--text-secondary)]">
                                                {t("AssemblyDynamic.Total_Users")}
                                                {showItemsWithUsers && (
                                                    <span className="ml-2 text-green-600 font-semibold">
                                                        {t("AssemblyDynamic.Filtered")}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xl sm:text-2xl font-semibold text-green-600 mt-1">
                                                {totalUsersCount}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 rounded-full p-1.5">
                                            <svg
                                                className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                                                />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Items Without Users Card - Clickable */}
                                    <div
                                        onClick={handleItemsWithoutUsersClick}
                                        className={`bg-[var(--bg-card)] text-[var(--text-color)] rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${totalWithoutUsersCount > 0
                                            ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-red-50"
                                            : "cursor-default"
                                            } ${showItemsWithoutUsers
                                                ? "ring-2 ring-red-500 bg-red-50"
                                                : ""
                                            }`}
                                        title={
                                            totalWithoutUsersCount > 0
                                                ? `Click to view ${displayLevelName.toLowerCase()}s without users`
                                                : `No ${displayLevelName.toLowerCase()}s without users`
                                        }
                                    >
                                        <div>
                                            <p className="text-xs font-medium text-[var(--text-secondary)]">
                                                {displayLevelName}{t("AssemblyDynamic.Without_Users")}
                                                {showItemsWithoutUsers && (
                                                    <span className="ml-2 text-red-600 font-semibold">
                                                        {t("AssemblyDynamic.Filtered")}
                                                    </span>
                                                )}
                                            </p>
                                            <p
                                                className={`text-xl sm:text-2xl font-semibold mt-1 ${totalWithoutUsersCount > 0
                                                    ? "text-red-600"
                                                    : "text-[var(--text-secondary)]"
                                                    }`}
                                            >
                                                {totalWithoutUsersCount}
                                            </p>
                                        </div>
                                        <div
                                            className={`rounded-full p-1.5 ${totalWithoutUsersCount > 0
                                                ? "bg-red-50"
                                                : "bg-[var(--bg-main)]"
                                                }`}
                                        >
                                            {totalWithoutUsersCount > 0 ? (
                                                <svg
                                                    className="w-4 h-4 sm:w-5 sm:h-5 text-red-600"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg
                                                    className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-secondary)]"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Dynamic Filters - Assembly context (no assembly filter needed) */}
                    <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-3 sm:p-4 mb-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                            {/* Assembly Filter - Always shown and disabled (current context) */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("AssemblyDynamic.Assembly")}
                                </label>
                                <input
                                    type="text"
                                    value={assemblyInfo.assemblyName}
                                    disabled
                                    className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-[var(--text-secondary)] cursor-not-allowed"
                                />
                            </div>

                            {/* Dynamic Filters - Show filters based on hierarchy */}
                            {effectiveVisibleFilters.length > 0 ? (
                                effectiveVisibleFilters.map((filterLevel, index) => {
                                    const filterItems = dynamicFilterData[filterLevel] || [];
                                    const previousFilterLevel = index > 0 ? effectiveVisibleFilters[index - 1] : null;
                                    const isPreviousSelected = !previousFilterLevel || (selectedFilters[previousFilterLevel] && selectedFilters[previousFilterLevel] > 0);
                                    const isDisabled = index > 0 && !isPreviousSelected;

                                    // Get current selected value for this filter
                                    const currentValue = selectedFilters[filterLevel] || 0;

                                    return (
                                        <div key={filterLevel}>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                                {filterLevel}
                                            </label>
                                            <select
                                                value={currentValue}
                                                onChange={(e) => handleFilterChange(filterLevel, Number(e.target.value))}
                                                disabled={isDisabled}
                                                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value={0}>{t("AssemblyDynamic.All")} {filterLevel}s</option>
                                                {filterItems.map((item: any) => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.displayName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                })
                            ) : null}

                            {/* Current Level Filter */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("AssemblyDynamic.Filter_by")} {displayLevelName}
                                </label>
                                <select
                                    value={selectedLevelFilter}
                                    onChange={(e) => {
                                        setSelectedLevelFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All {displayLevelName}s</option>
                                    {levelItems.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Search Filter */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("AssemblyDynamic.Search")} {displayLevelName}s
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg
                                            className="w-5 h-5 text-[var(--text-secondary)]"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Clear Filters Button */}
                            <div className="flex items-end">
                                <button
                                    onClick={resetAllFilters}
                                    disabled={
                                        !selectedBlockId &&
                                        !selectedMandalId &&
                                        !selectedPollingCenterId &&
                                        !searchTerm &&
                                        !selectedLevelFilter &&
                                        !Object.values(dynamicFilters).some(f => f.id > 0)
                                    }
                                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-md transition-colors duration-200"
                                    title="Clear all filters and reset search"
                                >
                                    <svg
                                        className="w-4 h-4 mr-2 inline"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                    {t("AssemblyDynamic.Clear_Filters")}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Level Items List */}
                    <div className="bg-[var(--bg-card)] rounded-xl shadow-lg overflow-hidden">
                        {filteredLevelItems.length === 0 ? (
                            <div className="text-center py-12">
                                <svg
                                    className="mx-auto h-12 w-12 text-[var(--text-secondary)]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-[var(--text-color)]">
                                    {t("AssemblyDynamic.No")} {displayLevelName.toLowerCase()}{t("AssemblyDynamic.s_found")}
                                </h3>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                    {showItemsWithoutUsers
                                        ? `No ${displayLevelName.toLowerCase()}s without users match your criteria.`
                                        : `No ${displayLevelName.toLowerCase()}s match your search criteria.`}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200">
                                    <div className="max-h-[600px] sm:max-h-[700px] overflow-y-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gradient-to-r bg-[var(--bg-card)] sticky top-0">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                                        {t("AssemblyDynamic.S_No")}
                                                    </th>
                                                    {/* Show Assembly column always */}
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                                        {t("AssemblyDynamic.Assembly")}
                                                    </th>
                                                    {/* Dynamic parent level columns - show all levels in hierarchy */}
                                                    {effectiveVisibleFilters.map((filterLevel) => {
                                                        const sortKey = filterLevel === "PollingCenter" ? "id" : filterLevel;
                                                        const isActiveSort = sortBy === sortKey;
                                                        const sortIcon = isActiveSort
                                                            ? sortDirection === "asc"
                                                                ? "▲"
                                                                : "▼"
                                                            : "";

                                                        return (
                                                            <th
                                                                key={filterLevel}
                                                                onClick={() => handleSort(sortKey)}
                                                                className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer select-none"
                                                            >
                                                                <span className="inline-flex items-center gap-1">
                                                                    {filterLevel}
                                                                    <span>{sortIcon}</span>
                                                                </span>
                                                            </th>
                                                        );
                                                    })}
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                                        {t("AssemblyDynamic.Level_Type")}
                                                    </th>
                                                    <th
                                                        onClick={() => handleSort("id")}
                                                        className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider cursor-pointer select-none"
                                                    >
                                                        <span className="inline-flex items-center gap-1">
                                                            {displayLevelName} {t("AssemblyDynamic.Name")}
                                                            {sortBy === "id" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                                                        </span>
                                                    </th>
                                                    <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                                        {t("AssemblyDynamic.Total_Users")}
                                                    </th>
                                                    {levelName === "Booth" && (
                                                        <>
                                                            <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                                                {t("AssemblyDynamic.Upload_Deleted_Voters")}
                                                            </th>
                                                            <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                                                {t("AssemblyDynamic.Uploaded_Files")}
                                                            </th>
                                                            <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                                                {t("AssemblyDynamic.F20_uploads")}
                                                            </th>
                                                        </>
                                                    )}
                                                    <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                                        {t("AssemblyDynamic.Actions")}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-[var(--bg-card)] divide-y  divide-gray-200">
                                                {paginatedItems.map((item, index) => (
                                                    <React.Fragment key={item.id}>
                                                        <tr className="hover:bg-[var(--text-color)]/5 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                                            </td>
                                                            {/* Assembly column - always shown */}
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                                    {item.assemblyName || assemblyInfo.assemblyName || "N/A"}
                                                                </span>
                                                            </td>
                                                            {/* Dynamic parent level columns - show all hierarchy levels */}
                                                            {effectiveVisibleFilters.map((filterLevel) => {
                                                                // Helper function to get the display name for a specific level
                                                                const getDisplayNameForLevel = (levelName: string) => {
                                                                    // Priority 1: Check ancestorMap (from API ancestors array)
                                                                    if (item.ancestorMap && item.ancestorMap[levelName]) {
                                                                        return item.ancestorMap[levelName];
                                                                    }

                                                                    // Priority 2: If this is the immediate parent level, use parentLevelName
                                                                    if (item.parentLevelType === levelName && item.parentLevelName) {
                                                                        return item.parentLevelName;
                                                                    }

                                                                    // Priority 3: Try direct property names
                                                                    const levelKey = levelName.toLowerCase();
                                                                    if (item[`${levelKey}Name`]) return item[`${levelKey}Name`];
                                                                    if (item[`${levelKey}_name`]) return item[`${levelKey}_name`];

                                                                    // Priority 4: Try specific known properties
                                                                    const propertyMap: Record<string, string[]> = {
                                                                        'Block': ['blockName', 'block_name'],
                                                                        'Mandal': ['mandalName', 'mandal_name'],
                                                                        'PollingCenter': ['pollingCenterName', 'polling_center_name'],
                                                                        'Ward': ['wardName', 'ward_name'],
                                                                        'Zone': ['zoneName', 'zone_name'],
                                                                        'Sector': ['sectorName', 'sector_name'],
                                                                        'Locality': ['localityName', 'locality_name'],
                                                                    };

                                                                    const possibleProps = propertyMap[levelName] || [];
                                                                    for (const prop of possibleProps) {
                                                                        if (item[prop]) return item[prop];
                                                                    }

                                                                    // Priority 5: Use parentNames chain if available
                                                                    if (item.parentNames && Array.isArray(item.parentNames) && effectiveVisibleFilters.length > 0) {
                                                                        const index = effectiveVisibleFilters.indexOf(levelName);
                                                                        if (index !== -1) {
                                                                            const nameIndex = effectiveVisibleFilters.length - 1 - index;
                                                                            if (item.parentNames[nameIndex]) {
                                                                                return item.parentNames[nameIndex];
                                                                            }
                                                                        }
                                                                    }

                                                                    return "N/A";
                                                                };

                                                                return (
                                                                    <td key={filterLevel} className="px-6 py-4 whitespace-nowrap">
                                                                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                                                            {getDisplayNameForLevel(filterLevel)}
                                                                        </span>
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                    {item.levelName || levelName}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="bg-blue-100 p-2 rounded-lg">
                                                                        {levelName === "Block" && (
                                                                            <svg
                                                                                className="w-5 h-5 text-blue-600"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={2}
                                                                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                                                />
                                                                            </svg>
                                                                        )}
                                                                        {levelName === "Mandal" && (
                                                                            <svg
                                                                                className="w-5 h-5 text-blue-600"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={2}
                                                                                    d="M12 3L3 9l9 6 9-6-9-6zm0 6v12"
                                                                                />
                                                                            </svg>
                                                                        )}
                                                                        {levelName === "PollingCenter" && (
                                                                            <svg
                                                                                className="w-5 h-5 text-blue-600"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={2}
                                                                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                                                />
                                                                            </svg>
                                                                        )}
                                                                        {levelName === "Booth" && (
                                                                            <svg
                                                                                className="w-5 h-5 text-blue-600"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={2}
                                                                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                                                                />
                                                                            </svg>
                                                                        )}
                                                                        {!["Block", "Mandal", "PollingCenter", "Booth"].includes(levelName) && (
                                                                            <svg
                                                                                className="w-5 h-5 text-blue-600"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={2}
                                                                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                                                />
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    strokeWidth={2}
                                                                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                                                />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-[var(--text-color)]">
                                                                            {item.displayName}
                                                                        </p>
                                                                        <p className="text-xs text-[var(--text-secondary)]">
                                                                            {item.partyLevelDisplayName || displayLevelName}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                <div className="flex items-center justify-center">
                                                                    <button
                                                                        onClick={() => handleViewUsers(item.id)}
                                                                        className={`inline-flex items-center p-1 rounded-md transition-colors mr-2 ${expandedItemId === item.id
                                                                            ? "text-blue-700 bg-blue-100"
                                                                            : "text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                                            }`}
                                                                        title={
                                                                            expandedItemId === item.id
                                                                                ? "Hide Users"
                                                                                : "View Users"
                                                                        }
                                                                    >
                                                                        <svg
                                                                            className="w-4 h-4"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                            />
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                            />
                                                                        </svg>
                                                                    </button>
                                                                    <span className="text-sm font-medium text-[var(--text-color)]">
                                                                        {itemUserCounts[item.id] !== undefined ? itemUserCounts[item.id] : (item.user_count || 0)}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            {/* Booth-specific columns */}
                                                            {levelName === "Booth" && (
                                                                <>
                                                                    {/* Upload Deleted Voters */}
                                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                        <label
                                                                            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-dashed border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-colors"
                                                                            title="Upload deleted voter PDF/Excel"
                                                                        >
                                                                            <input
                                                                                type="file"
                                                                                accept=".pdf,.xls,.xlsx"
                                                                                className="hidden"
                                                                                onChange={handleFileChange(item.id, item.displayName)}
                                                                                disabled={uploadingBoothId === item.id}
                                                                            />
                                                                            {uploadingBoothId === item.id ? (
                                                                                <svg className="w-5 h-5 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                                </svg>
                                                                            ) : (
                                                                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                                                </svg>
                                                                            )}
                                                                        </label>
                                                                    </td>

                                                                    {/* Uploaded Files */}
                                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                        <button
                                                                            onClick={() => handleViewFiles(item.id)}
                                                                            className={`inline-flex items-center p-2 rounded-lg transition-colors ${expandedFilesBoothId === item.id
                                                                                ? "bg-purple-100 text-purple-700 border-purple-300"
                                                                                : "text-purple-700 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                                                                                }`}
                                                                            title="View uploaded deleted voter files"
                                                                        >
                                                                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                            </svg>
                                                                            <span className="text-sm font-medium">{boothFileCounts[item.id] || 0}</span>
                                                                        </button>
                                                                    </td>

                                                                    {/* Result Analysis */}
                                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                        <button
                                                                            onClick={() => handleResultAnalysisClick(item)}
                                                                            className="inline-flex items-center p-2 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200 hover:text-orange-700 transition-colors"
                                                                            title="Result Analysis"
                                                                        >
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                                            </svg>
                                                                        </button>
                                                                    </td>
                                                                </>
                                                            )}
                                                            {/* Actions Column */}
                                                            <td className="px-6 py-4 whitespace-nowrap text-center relative">
                                                                <div className="relative inline-block">
                                                                    <button
                                                                        onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                                                                        className="p-2 hover:bg-blue-50 rounded-full transition-all duration-200 group"
                                                                        title="More actions"
                                                                    >
                                                                        <svg className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-blue-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                                        </svg>
                                                                    </button>

                                                                    {openDropdownId === item.id && (
                                                                        <>
                                                                            <div
                                                                                className="fixed inset-0 z-40"
                                                                                onClick={() => setOpenDropdownId(null)}
                                                                            />
                                                                            <div
                                                                                className="fixed w-60 bg-[var(--bg-card)] rounded-xl shadow-2xl border border-gray-100 z-50 max-h-64 overflow-y-auto"
                                                                                style={{
                                                                                    scrollbarWidth: 'thin',
                                                                                    scrollbarColor: '#cbd5e1 #f1f5f9',
                                                                                    top: `${(document.activeElement as HTMLElement)?.getBoundingClientRect().bottom + 8}px`,
                                                                                    right: `${window.innerWidth - (document.activeElement as HTMLElement)?.getBoundingClientRect().right}px`
                                                                                }}
                                                                            >
                                                                                <div className="py-2">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            // Navigate to dynamic assign page for all levels
                                                                                            const levelPath = levelName.toLowerCase();
                                                                                            navigate(`/assembly/${levelPath}/assign?levelId=${item.id}&levelName=${encodeURIComponent(item.displayName)}&levelType=${levelName}`);
                                                                                            setOpenDropdownId(null);
                                                                                        }}
                                                                                        className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-green-50 flex items-center gap-3 transition-colors group"
                                                                                    >
                                                                                        <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                                                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                                                            </svg>
                                                                                        </div>
                                                                                        <span className="font-medium">{t("AssemblyDynamic.Assign_Users")}</span>
                                                                                    </button>
                                                                                    <div className="border-t border-gray-100 my-1"></div>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setSelectedItemForVoters({ id: item.id, name: item.displayName });
                                                                                            setShowAssignVotersModal(true);
                                                                                            setOpenDropdownId(null);
                                                                                        }}
                                                                                        className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-indigo-50 flex items-center gap-3 transition-colors group"
                                                                                    >
                                                                                        <div className="p-1.5 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                                                                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                                            </svg>
                                                                                        </div>
                                                                                        <span className="font-medium">{t("AssemblyDynamic.Assign_Booth_Voters")}</span>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {/* Inline User Display */}
                                                        {expandedItemId === item.id && itemUsers[item.id] && (
                                                            <InlineUserDisplay
                                                                users={itemUsers[item.id]}
                                                                locationName={item.displayName}
                                                                locationId={item.id}
                                                                locationType={levelName}
                                                                parentLocationName={(() => {
                                                                    // Try to get parent name from parentInfo first
                                                                    const parentId = item.parentId || item.parent_id;
                                                                    const parent = parentId ? parentInfo[parentId] : null;

                                                                    if (parent) {
                                                                        return parent.displayName || parent.levelName;
                                                                    }

                                                                    // Try parentLevelName if available
                                                                    if (item.parentLevelName) {
                                                                        return item.parentLevelName;
                                                                    }

                                                                    // Fallback to hierarchy-based approach
                                                                    if (visibleFilters.length > 0) {
                                                                        const parentLevel = visibleFilters[visibleFilters.length - 1].toLowerCase();
                                                                        const parentKey = `${parentLevel}Name`;
                                                                        return item[parentKey];
                                                                    }

                                                                    // Last resort: try common parent fields
                                                                    return item.pollingCenterName || item.mandalName || item.blockName || item.wardName || item.zoneName || "N/A";
                                                                })()}
                                                                parentLocationType={(() => {
                                                                    // Try to get parent type from parentInfo first
                                                                    const parentId = item.parentId || item.parent_id;
                                                                    const parent = parentId ? parentInfo[parentId] : null;

                                                                    if (parent) {
                                                                        return parent.levelName;
                                                                    }

                                                                    // Try parentLevelType if available
                                                                    if (item.parentLevelType) {
                                                                        return item.parentLevelType;
                                                                    }

                                                                    // Fallback to hierarchy-based approach
                                                                    if (effectiveVisibleFilters.length > 0) {
                                                                        return effectiveVisibleFilters[effectiveVisibleFilters.length - 1];
                                                                    }

                                                                    // Last resort: try to determine from available fields
                                                                    if (item.pollingCenterName) return "PollingCenter";
                                                                    if (item.mandalName) return "Mandal";
                                                                    if (item.blockName) return "Block";
                                                                    if (item.wardName) return "Ward";
                                                                    if (item.zoneName) return "Zone";
                                                                    return "Unknown";
                                                                })()}
                                                                onUserDeleted={() => {
                                                                    // Refresh user counts after deletion
                                                                    setExpandedItemId(null);
                                                                    setItemUsers((prev) => {
                                                                        const updated = { ...prev };
                                                                        delete updated[item.id];
                                                                        return updated;
                                                                    });
                                                                    window.location.reload();
                                                                }}
                                                                onClose={() => setExpandedItemId(null)}
                                                                colSpan={(() => {
                                                                    // Calculate total columns: S.No + Assembly + effectiveVisibleFilters + Level Type + Name + Total Users + Actions
                                                                    let totalCols = 1 + 1 + effectiveVisibleFilters.length + 1 + 1 + 1 + 1; // 7 base columns
                                                                    
                                                                    // Add booth-specific columns if levelName is "Booth"
                                                                    if (levelName === "Booth") {
                                                                        totalCols += 3; // Upload + Files + F20 columns
                                                                    }
                                                                    
                                                                    return totalCols;
                                                                })()}
                                                            />
                                                        )}
                                                        {/* File Display for Booths */}
                                                        {levelName === "Booth" && expandedFilesBoothId === item.id && boothFiles[item.id] && (
                                                            <tr>
                                                                <td colSpan={(() => {
                                                                    // Calculate total columns: S.No + Assembly + effectiveVisibleFilters + Level Type + Name + Total Users + Upload + Files + F20 + Actions
                                                                    return 1 + 1 + effectiveVisibleFilters.length + 1 + 1 + 1 + 1 + 1 + 1 + 1; // 10 base columns for booth
                                                                })()} className="px-6 py-4 bg-purple-50">
                                                                    <div>
                                                                        <h4 className="text-sm font-semibold text-purple-800 mb-2">{t("AssemblyDynamic.Uploaded_Deleted_Voter_Files")}</h4>
                                                                        {boothFiles[item.id]?.loading && (
                                                                            <div className="text-center py-4">
                                                                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                                                            </div>
                                                                        )}
                                                                        {boothFiles[item.id]?.error && (
                                                                            <div className="text-red-600 text-sm">{boothFiles[item.id].error}</div>
                                                                        )}
                                                                        {!boothFiles[item.id]?.loading && !boothFiles[item.id]?.error && (
                                                                            <div>
                                                                                {boothFiles[item.id]?.data.length > 0 && (
                                                                                    <div className="mb-2 flex items-center gap-2">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={(selectedFileIds[item.id] || []).length === boothFiles[item.id].data.length}
                                                                                            onChange={(e) => handleSelectAllFiles(item.id, boothFiles[item.id].data.map((f: any) => f.id), e.target.checked)}
                                                                                            className="rounded"
                                                                                        />
                                                                                        <span className="text-sm text-[var(--text-secondary)]">{t("AssemblyDynamic.Select_All")}</span>
                                                                                        {(selectedFileIds[item.id] || []).length > 0 && (
                                                                                            <button
                                                                                                onClick={() => handleBulkDelete(item.id)}
                                                                                                disabled={isBulkDeleting[item.id]}
                                                                                                className="ml-auto px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                                                                                            >
                                                                                                {isBulkDeleting[item.id] ? "Deleting..." : `Delete Selected (${selectedFileIds[item.id].length})`}
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                                <ul className="space-y-2">
                                                                                    {boothFiles[item.id]?.data.length === 0 && (
                                                                                        <li className="text-sm text-[var(--text-secondary)]">{t("AssemblyDynamic.Desc")}</li>
                                                                                    )}
                                                                                    {boothFiles[item.id]?.data.map((file: any) => (
                                                                                        <li key={file.id} className="flex items-center justify-between bg-[var(--bg-card)] p-2 rounded border">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    checked={(selectedFileIds[item.id] || []).includes(file.id)}
                                                                                                    onChange={(e) => handleFileSelection(item.id, file.id, e.target.checked)}
                                                                                                    className="rounded"
                                                                                                />
                                                                                                <span className="text-sm font-medium text-[var(--text-color)]">
                                                                                                    {file.filePath || file.file_name || "File"}
                                                                                                </span>
                                                                                                <span className="text-xs text-[var(--text-secondary)]">
                                                                                                    {file.created_at ? new Date(file.created_at).toLocaleString() : (file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : "")}
                                                                                                </span>
                                                                                            </div>
                                                                                            <button
                                                                                                onClick={() => handleDeleteFile(file.id, item.id)}
                                                                                                disabled={deletingFileId === file.id}
                                                                                                className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                                                                                            >
                                                                                                {deletingFileId === file.id ? "Deleting..." : "Delete"}
                                                                                            </button>
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="bg-[var(--bg-card)] px-4 py-3 flex items-center justify-between border-t border-[var(--border-color)] sm:px-6">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            <button
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {t("AssemblyDynamic.Previous")}
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {t("AssemblyDynamic.Next")}
                                            </button>
                                        </div>
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-[var(--text-secondary)]">
                                                    {t("AssemblyDynamic.Showing")}{" "}
                                                    <span className="font-medium">
                                                        {(currentPage - 1) * itemsPerPage + 1}
                                                    </span>{" "}
                                                    {t("AssemblyDynamic.to")}{" "}
                                                    <span className="font-medium">
                                                        {Math.min(currentPage * itemsPerPage, filteredLevelItems.length)}
                                                    </span>{" "}
                                                    {t("AssemblyDynamic.of")}{" "}
                                                    <span className="font-medium">{filteredLevelItems.length}</span>{" "}
                                                    {t("AssemblyDynamic.results")}
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                    <button
                                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                        disabled={currentPage === 1}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-[var(--bg-card)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {t("AssemblyDynamic.Previous")}
                                                    </button>
                                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                        const pageNum = i + 1;
                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => setCurrentPage(pageNum)}
                                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                                                    ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                                                    : "bg-[var(--bg-card)] border-gray-300 text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5"
                                                                    }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    })}
                                                    <button
                                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                        disabled={currentPage === totalPages}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-[var(--bg-card)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {t("AssemblyDynamic.Next")}
                                                    </button>
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
            .scrollbar-thin::-webkit-scrollbar {
                height: 8px;
                width: 8px;
            }
            .scrollbar-thin::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
            }
            .scrollbar-thin::-webkit-scrollbar-thumb {
                background: #3b82f6;
                border-radius: 4px;
            }
            .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                background: #2563eb;
            }
        `}</style>

            {/* Assign Booth Voters Modal */}
            {showAssignVotersModal && selectedItemForVoters && (
                <AssignBoothVotersModal
                    isOpen={showAssignVotersModal}
                    onClose={() => {
                        setShowAssignVotersModal(false);
                        setSelectedItemForVoters(null);
                    }}
                    levelId={selectedItemForVoters.id}
                    levelName={selectedItemForVoters.name}
                    levelType="afterAssembly"
                    assemblyId={assemblyInfo.assemblyId}
                    stateId={assemblyInfo.stateId}
                    districtId={assemblyInfo.districtId}
                />
            )}

            {/* Result Analysis Modal (Booth only) */}
            {levelName === "Booth" && isResultAnalysisModalOpen && selectedBoothForAnalysis && (
                <ResultAnalysisModal
                    isOpen={isResultAnalysisModalOpen}
                    onClose={() => {
                        setIsResultAnalysisModalOpen(false);
                        setSelectedBoothForAnalysis(null);
                    }}
                    boothId={selectedBoothForAnalysis.boothId}
                    assemblyId={selectedBoothForAnalysis.assemblyId}
                    boothName={selectedBoothForAnalysis.boothName}
                />
            )}
        </>
    );
}



