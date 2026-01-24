import React, { useState, useEffect, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import InlineUserDisplay from "./InlineUserDisplay";
import AssignBoothVotersModal from "./AssignBoothVotersModal";
import ResultAnalysisModal from "./ResultAnalysisModal";
import toast from "react-hot-toast";
import { deleteBoothDeletedVoterFile, bulkDeleteBoothDeletedVoterFiles } from "../services/boothDeletedVoterFilesApi";

interface AssemblyDynamicLevelListProps {
    levelName: string;
    displayLevelName: string;
    parentLevelName?: string;
}

export default function AssemblyDynamicLevelList({
    levelName,
    displayLevelName }: AssemblyDynamicLevelListProps) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
    const [selectedMandalId, setSelectedMandalId] = useState<number>(0);
    const [selectedPollingCenterId, setSelectedPollingCenterId] = useState<number>(0);
    const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

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
        setExpandedItemId(null);
        setItemUsers({});
        setItemUserCounts({}); // Reset user counts when level changes
        setAllLevelItems([]); // Reset all level items
        setDynamicFilters({}); // Reset dynamic filters
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
        setDynamicFilters({});
        setSelectedFilters({});
        setDynamicFilterData({});
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

    // State for inline user display
    const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
    const [itemUsers, setItemUsers] = useState<Record<number, any[]>>({});

    // State for filtering items without users
    const [showItemsWithoutUsers, setShowItemsWithoutUsers] = useState(false);
    // State for user counts
    const [itemUserCounts, setItemUserCounts] = useState<Record<number, number>>({});

    // State for dynamic hierarchy order (actual parent-child chain for current level)
    const [actualHierarchyChain, setActualHierarchyChain] = useState<string[]>([]);

    // Fallback: Infer hierarchy from first item's data structure (FULLY DYNAMIC)
    const inferHierarchyFromData = (items: any[]): string[] => {
        if (items.length === 0) return [];

        const firstItem = items[0];
        const hierarchy: string[] = [];

        console.log(`[Hierarchy Inference] Analyzing first item:`, firstItem);

        // Dynamically detect all properties that end with 'Name' or 'Id' and might be parent levels
        // Build a map of potential parent properties
        const potentialParents: Array<{ key: string; level: string; id?: number }> = [];

        for (const key in firstItem) {
            // Check if property ends with 'Name' and has a corresponding 'Id' property
            if (key.endsWith('Name') && !key.includes('display') && !key.includes('party')) {
                const levelName = key.replace('Name', '');
                const idKey = `${levelName}Id`;
                const altIdKey = `${levelName}_id`;

                // Check if corresponding ID exists
                if (firstItem[idKey] || firstItem[altIdKey]) {
                    const level = levelName.charAt(0).toUpperCase() + levelName.slice(1); // Capitalize
                    potentialParents.push({
                        key: key,
                        level: level,
                        id: firstItem[idKey] || firstItem[altIdKey]
                    });
                }
            }
        }

        console.log(`[Hierarchy Inference] Found potential parents:`, potentialParents.map(p => p.level));

        // Add parents to hierarchy if they're not the current level
        for (const parent of potentialParents) {
            if (firstItem.levelName !== parent.level && firstItem.displayName !== parent.level) {
                hierarchy.push(parent.level);
            }
        }

        // Also check parentChain if available
        if (firstItem.parentChain && typeof firstItem.parentChain === 'object') {
            const chainLevels = Object.keys(firstItem.parentChain);
            console.log(`[Hierarchy Inference] Found parentChain:`, chainLevels);
            for (const level of chainLevels) {
                if (!hierarchy.includes(level) && level !== firstItem.levelName) {
                    hierarchy.push(level);
                }
            }
        }

        // Remove duplicates and sort by common hierarchy order
        const uniqueHierarchy = [...new Set(hierarchy)];

        console.log(`[Hierarchy Inference] Inferred hierarchy:`, uniqueHierarchy);
        return uniqueHierarchy;
    };

    // State for parent information
    const [parentInfo, setParentInfo] = useState<Record<number, any>>({});

    // Function to fetch parent details using the after-assembly API (which returns parentDetails)
    const fetchParentDetailsFromAPI = async (itemId: number) => {
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

            if (data.success && data.data?.parentDetails) {
                const parentDetails = data.data.parentDetails;
                setParentInfo(prev => ({
                    ...prev,
                    [parentDetails.id]: {
                        id: parentDetails.id,
                        displayName: parentDetails.displayName,
                        levelName: parentDetails.levelName,
                    }
                }));
                return parentDetails;
            }
        } catch (error) {
            console.error(`Error fetching parent details for item ${itemId}:`, error);
        }
        return null;
    };

    // Function to fetch user count for an item
    const fetchUserCount = async (itemId: number) => {
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
                // Store parent information from parentDetails if available
                if (data.data.parentDetails) {
                    const parentDetails = data.data.parentDetails;
                    setParentInfo(prev => ({
                        ...prev,
                        [parentDetails.id]: {
                            id: parentDetails.id,
                            displayName: parentDetails.displayName,
                            levelName: parentDetails.levelName,
                        }
                    }));
                }

                return data.data.users.length;
            }
            return 0;
        } catch (error) {
            console.error(`Error fetching user count for item ${itemId}:`, error);
            return 0;
        }
    };

    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );

    const [assemblyInfo, setAssemblyInfo] = useState({
        assemblyName: "",
        districtName: "",
        assemblyId: 0,
        stateId: 0,
        districtId: 0,
    });

    // Fetch actual hierarchy chain for current level from API - SIMPLIFIED APPROACH
    useEffect(() => {
        const fetchActualHierarchy = async () => {
            if (!assemblyInfo.assemblyId || !levelName) return;

            try {
                console.log(`[Hierarchy] ========================================`);
                console.log(`[Hierarchy] Starting hierarchy detection for level: ${levelName}`);

                // Fetch direct children of assembly to understand the hierarchy
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/after-assembly-data/assembly/${assemblyInfo.assemblyId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                        },
                    }
                );
                const data = await response.json();

                if (data.success && data.data && data.data.length > 0) {
                    const allDirectChildren = data.data;
                    console.log(`[Hierarchy] ========================================`);
                    console.log(`[Hierarchy] Target Level: ${levelName}`);
                    console.log(`[Hierarchy] Direct children of Assembly (${allDirectChildren.length}):`, allDirectChildren.map((c: any) => `${c.levelName} (ID: ${c.id})`));

                    // If current level is direct child of assembly
                    const directChild = allDirectChildren.find((item: any) =>
                        item.levelName && item.levelName.toLowerCase() === levelName.toLowerCase()
                    );
                    if (directChild) {
                        // Current level is directly under assembly, no parent filters needed
                        console.log(`[Hierarchy] ✓ ${levelName} is direct child of Assembly (ID: ${directChild.id}), no filters needed`);
                        setActualHierarchyChain([]);
                        return;
                    }

                    console.log(`[Hierarchy] ${levelName} is NOT a direct child, starting BFS to find path...`);

                    // Helper function to fetch ALL children with pagination
                    const fetchAllChildren = async (parentId: number): Promise<any[]> => {
                        let allChildren: any[] = [];
                        let page = 1;
                        let hasMore = true;

                        while (hasMore) {
                            try {
                                const childrenResponse = await fetch(
                                    `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${parentId}?page=${page}&limit=50`,
                                    {
                                        headers: {
                                            Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                                        },
                                    }
                                );
                                const childrenData = await childrenResponse.json();

                                // Handle both response structures
                                let currentPageChildren: any[] = [];
                                if (childrenData.success && childrenData.children && childrenData.children.length > 0) {
                                    currentPageChildren = childrenData.children;
                                } else if (childrenData.success && childrenData.data?.children && childrenData.data.children.length > 0) {
                                    currentPageChildren = childrenData.data.children;
                                }

                                if (currentPageChildren.length > 0) {
                                    allChildren = allChildren.concat(currentPageChildren);
                                    hasMore = currentPageChildren.length === 50; // Continue if we got full page
                                    page++;
                                } else {
                                    hasMore = false;
                                }
                            } catch (err) {
                                console.error(`[Hierarchy] Error fetching page ${page} for parent ${parentId}:`, err);
                                hasMore = false;
                            }
                        }

                        return allChildren;
                    };

                    // BFS to find complete path from assembly to current level
                    const findPathToLevel = async (targetLevel: string): Promise<string[]> => {
                        // Queue: [{ id, levelName, path }]
                        const queue: Array<{ id: number; levelName: string; path: string[] }> = [];

                        // Initialize queue with all direct children of assembly
                        for (const child of allDirectChildren) {
                            queue.push({
                                id: child.id,
                                levelName: child.levelName,
                                path: [child.levelName]
                            });
                        }

                        const visited = new Set<number>();
                        let iterations = 0;
                        const maxIterations = 200; // Increased safety limit

                        while (queue.length > 0 && iterations < maxIterations) {
                            iterations++;
                            const current = queue.shift()!;

                            if (visited.has(current.id)) continue;
                            visited.add(current.id);

                            console.log(`[Hierarchy BFS #${iterations}] Checking ${current.levelName} (ID: ${current.id}), path:`, current.path);

                            // Fetch ALL children with pagination
                            const allChildren = await fetchAllChildren(current.id);
                            console.log(`[Hierarchy BFS #${iterations}] Fetched ${allChildren.length} children for ${current.levelName} (ID: ${current.id})`);

                            if (allChildren.length > 0) {
                                // Get unique level names from children
                                const uniqueLevels = [...new Set(allChildren.map((c: any) => c.levelName))];
                                console.log(`[Hierarchy BFS] Children level types:`, uniqueLevels);
                                console.log(`[Hierarchy BFS] Looking for target level: ${targetLevel}`);

                                // Check if target level is among children (case-insensitive)
                                const targetChild = allChildren.find((c: any) =>
                                    c.levelName && c.levelName.toLowerCase() === targetLevel.toLowerCase()
                                );
                                if (targetChild) {
                                    const fullPath = [...current.path, targetLevel];
                                    const parentLevels = current.path; // Exclude target level
                                    console.log(`[Hierarchy] ✓✓✓ FOUND PATH to ${targetLevel}! ✓✓✓`);
                                    console.log(`[Hierarchy] Full path:`, fullPath);
                                    console.log(`[Hierarchy] Parent levels (filters):`, parentLevels);
                                    return parentLevels;
                                }

                                // Add children to queue - take one representative per level type
                                // This ensures we explore all possible paths without redundancy
                                const seenLevels = new Set<string>();
                                for (const child of allChildren) {
                                    if (!visited.has(child.id) && !seenLevels.has(child.levelName)) {
                                        seenLevels.add(child.levelName);
                                        queue.push({
                                            id: child.id,
                                            levelName: child.levelName,
                                            path: [...current.path, child.levelName]
                                        });
                                    }
                                }
                            }
                        }

                        console.warn(`[Hierarchy] ✗ Path not found for ${targetLevel} after ${iterations} iterations`);
                        return []; // Path not found
                    };

                    const chain = await findPathToLevel(levelName);
                    console.log(`[Hierarchy] ========================================`);
                    console.log(`[Hierarchy] BFS Result for ${levelName}:`, chain);
                    console.log(`[Hierarchy] Chain length:`, chain.length);

                    // If BFS found a path, use it
                    if (chain.length > 0) {
                        console.log(`[Hierarchy] ✓ Using BFS result:`, chain);
                        setActualHierarchyChain(chain);
                        return;
                    }

                    // If BFS failed, try alternative approach: fetch items and build hierarchy from parentId
                    console.warn(`[Hierarchy] ⚠ BFS failed to find path for ${levelName}`);
                    console.log(`[Hierarchy] Trying alternative approach: fetch items and trace parentId chain...`);

                    // Try to fetch items of target level directly
                    try {
                        // Fetch items using the dynamic fetch function
                        const sampleItems = await fetchAllPages(
                            `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${allDirectChildren[0]?.id}`
                        );

                        console.log(`[Hierarchy] Fetched ${sampleItems.length} items from first direct child`);

                        // Look for target level in these items
                        let targetItem = sampleItems.find((item: any) =>
                            item.levelName && item.levelName.toLowerCase() === levelName.toLowerCase()
                        );

                        // If not found in first level, try going deeper
                        if (!targetItem && sampleItems.length > 0) {
                            console.log(`[Hierarchy] Target not found in first level, checking deeper...`);
                            for (const item of sampleItems.slice(0, 3)) { // Check first 3 items
                                const deeperItems = await fetchAllPages(
                                    `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${item.id}`
                                );
                                targetItem = deeperItems.find((child: any) =>
                                    child.levelName && child.levelName.toLowerCase() === levelName.toLowerCase()
                                );
                                if (targetItem) {
                                    console.log(`[Hierarchy] Found target item in deeper level (ID: ${targetItem.id})`);
                                    break;
                                }
                            }
                        }

                        if (targetItem && targetItem.parentId) {
                            console.log(`[Hierarchy] Found sample item, tracing parentId chain from ${targetItem.id}...`);

                            // Build hierarchy by following parentId
                            const hierarchyChain: string[] = [];
                            let currentParentId = targetItem.parentId;
                            const visited = new Set<number>();
                            let iterations = 0;

                            while (currentParentId && iterations < 10) {
                                iterations++;
                                if (visited.has(currentParentId)) break;
                                visited.add(currentParentId);

                                try {
                                    const parentResponse = await fetch(
                                        `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/after-assembly/${currentParentId}`,
                                        {
                                            headers: {
                                                Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                                            },
                                        }
                                    );
                                    const parentData = await parentResponse.json();

                                    if (parentData.success && parentData.data?.afterAssemblyData) {
                                        const parent = parentData.data.afterAssemblyData;
                                        console.log(`[Hierarchy] Parent ${iterations}: ${parent.levelName} (ID: ${parent.id})`);
                                        hierarchyChain.push(parent.levelName);
                                        currentParentId = parent.parentId;

                                        if (!currentParentId) break; // Reached assembly
                                    } else {
                                        break;
                                    }
                                } catch (err) {
                                    console.error(`[Hierarchy] Error fetching parent ${currentParentId}:`, err);
                                    break;
                                }
                            }

                            const reversedChain = hierarchyChain.reverse();
                            console.log(`[Hierarchy] ✓ Built hierarchy from parentId chain:`, reversedChain);
                            setActualHierarchyChain(reversedChain);
                            return;
                        }
                    } catch (err) {
                        console.error(`[Hierarchy] Alternative approach failed:`, err);
                    }

                    // Last resort: set empty chain
                    console.warn(`[Hierarchy] ✗ Could not determine hierarchy, setting empty chain`);
                    setActualHierarchyChain([]);
                }
            } catch (error) {
                console.error("[Hierarchy] Error fetching actual hierarchy:", error);

                // Fallback: Try to infer from existing data
                if (allLevelItems.length > 0) {
                    console.log(`[Hierarchy] Error occurred, attempting to infer from data...`);
                    const inferredChain = inferHierarchyFromData(allLevelItems);
                    if (inferredChain.length > 0) {
                        console.log(`[Hierarchy] ✓ Using inferred hierarchy:`, inferredChain);
                        setActualHierarchyChain(inferredChain);
                        return;
                    }
                }

                setActualHierarchyChain([]);
            }
        };

        fetchActualHierarchy();
    }, [assemblyInfo.assemblyId, levelName, allLevelItems.length]);

    useEffect(() => {
        if (selectedAssignment) {
            setAssemblyInfo({
                assemblyName: selectedAssignment.levelName || selectedAssignment.displayName || "",
                districtName: selectedAssignment.parentLevelName || "",
                assemblyId: selectedAssignment.stateMasterData_id || 0,
                stateId: (selectedAssignment as any).state_id || 0,
                districtId: (selectedAssignment as any).district_id || selectedAssignment.parentId || 0,
            });
        }
    }, [selectedAssignment]);

    // Determine which filters to show based on actual hierarchy chain
    const getVisibleFilters = () => {
        // Return the actual parent chain for current level
        // If empty, means current level is direct child of assembly (no filters needed)
        return actualHierarchyChain;
    };

    const visibleFilters = getVisibleFilters();

    // Helper function to fetch all pages - same as existing files
    const fetchAllPages = async (url: string) => {
        let allData: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const response = await fetch(`${url}?page=${page}&limit=50`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`
                }
            });
            const data = await response.json();

            let currentPageData: any[] = [];

            if (data.success && data.data?.children && data.data.children.length > 0) {
                currentPageData = data.data.children;
                allData = allData.concat(currentPageData);
                hasMore = currentPageData.length === 50;
            } else if (data.success && data.children && data.children.length > 0) {
                currentPageData = data.children;
                allData = allData.concat(currentPageData);
                hasMore = currentPageData.length === 50;
            } else {
                hasMore = false;
            }

            page++;
        }

        return allData;
    };

    // Generic function to fetch children for any filter level (same as District approach)
    const fetchFilterLevelChildren = async (parentId: number, parentLevelName: string) => {
        if (!parentId) return [];

        try {
            // For first level after assembly, use after-assembly-data API
            if (!parentLevelName || parentLevelName === "Assembly") {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/after-assembly-data/assembly/${parentId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                        },
                    }
                );
                const data = await response.json();
                return data.data || [];
            } else {
                // For deeper levels, use hierarchy children API with pagination
                const childrenData = await fetchAllPages(
                    `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${parentId}`
                );
                return childrenData;
            }
        } catch (error) {
            console.error(`Error fetching children for ${parentLevelName} ${parentId}:`, error);
            return [];
        }
    };

    // Fetch first level data (direct children of assembly)
    useEffect(() => {
        const fetchFirstLevelData = async () => {
            if (!assemblyInfo.assemblyId || visibleFilters.length === 0) return;

            try {
                const firstLevel = visibleFilters[0];
                console.log(`[Filter Data] ========================================`);
                console.log(`[Filter Data] Current Level: ${levelName}`);
                console.log(`[Filter Data] Visible Filters (Hierarchy Chain):`, visibleFilters);
                console.log(`[Filter Data] Fetching first filter level: ${firstLevel}`);
                console.log(`[Filter Data] From Assembly ID: ${assemblyInfo.assemblyId}`);

                const children = await fetchFilterLevelChildren(assemblyInfo.assemblyId, "Assembly");
                console.log(`[Filter Data] Received ${children.length} total children from Assembly`);
                console.log(`[Filter Data] Child level types:`, [...new Set(children.map((c: any) => c.levelName))]);

                // Filter by first level name - this should match the first item in hierarchy chain
                const firstLevelItems = children.filter((item: any) => item.levelName === firstLevel);
                console.log(`[Filter Data] ✓ Filtered to ${firstLevelItems.length} items for level ${firstLevel}`);

                if (firstLevelItems.length === 0) {
                    console.warn(`[Filter Data] ⚠ No items found for first level ${firstLevel}!`);
                    console.warn(`[Filter Data] Available levels:`, [...new Set(children.map((c: any) => c.levelName))]);
                }

                setDynamicFilterData((prev) => ({
                    ...prev,
                    [firstLevel]: firstLevelItems,
                }));
            } catch (error) {
                console.error("[Filter Data] Error fetching first level data:", error);
            }
        };

        fetchFirstLevelData();
    }, [assemblyInfo.assemblyId, visibleFilters.join(','), levelName]);;

    // Fetch next level data whenever a filter changes (same as District approach)
    useEffect(() => {
        const fetchAllLevelData = async () => {
            if (visibleFilters.length === 0) return;

            console.log(`[Filter Data] Fetching data for visible filters:`, visibleFilters);
            console.log(`[Filter Data] Current selected filters:`, selectedFilters);

            // Fetch data for each filter level based on its parent selection
            for (let i = 0; i < visibleFilters.length; i++) {
                const currentLevel = visibleFilters[i];
                const parentLevel = i > 0 ? visibleFilters[i - 1] : "Assembly";

                // For first level, parent is Assembly
                if (i === 0) {
                    // First level data is already fetched by fetchFirstLevelData effect
                    console.log(`[Filter Data] Skipping ${currentLevel} (first level, handled separately)`);
                    continue;
                }

                // For subsequent levels, fetch only if parent is selected
                const parentId = selectedFilters[parentLevel];
                console.log(`[Filter Data] Level ${currentLevel}: parent=${parentLevel}, parentId=${parentId}`);

                if (parentId && parentId > 0) {
                    console.log(`[Filter Data] Fetching ${currentLevel} children of ${parentLevel} (ID: ${parentId})`);
                    const children = await fetchFilterLevelChildren(parentId, parentLevel);
                    console.log(`[Filter Data] Received ${children.length} children`);

                    // Filter by current level name
                    const currentLevelItems = children.filter((item: any) => item.levelName === currentLevel);
                    console.log(`[Filter Data] Filtered to ${currentLevelItems.length} items for level ${currentLevel}`);

                    setDynamicFilterData((prev) => ({
                        ...prev,
                        [currentLevel]: currentLevelItems,
                    }));
                } else {
                    // Clear data for this level if parent is not selected
                    console.log(`[Filter Data] Clearing ${currentLevel} (parent not selected)`);
                    setDynamicFilterData((prev) => ({
                        ...prev,
                        [currentLevel]: [],
                    }));
                }
            }
        };

        fetchAllLevelData();
    }, [selectedFilters, visibleFilters.join(','), assemblyInfo.assemblyId]);

    // Handle filter change - when a filter is changed, reset all filters after it (same as District)
    const handleFilterChange = (levelName: string, value: number) => {
        const changedLevelIndex = visibleFilters.indexOf(levelName);

        // Update the selected filter
        const newFilters = { ...selectedFilters };
        newFilters[levelName] = value;

        // Reset all filters after this one
        for (let i = changedLevelIndex + 1; i < visibleFilters.length; i++) {
            newFilters[visibleFilters[i]] = 0;
        }

        setSelectedFilters(newFilters);

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
        let filteredItems = allLevelItems;

        // Apply filters dynamically based on visible filters
        visibleFilters.forEach((filterLevel) => {
            const selectedIdForFilter = selectedFilters[filterLevel];
            if (selectedIdForFilter && selectedIdForFilter > 0) {
                filteredItems = filteredItems.filter((item) => {
                    // Check direct parent relationship
                    if (item.parentLevelId === selectedIdForFilter) return true;

                    // Check parent chain (full hierarchy)
                    if (item.parentChain && item.parentChain[filterLevel] === selectedIdForFilter) return true;

                    // Check if the item has this level's id in various property names
                    const levelKey = filterLevel.toLowerCase();
                    if (item[`${levelKey}Id`] === selectedIdForFilter) return true;
                    if (item[`${levelKey}_id`] === selectedIdForFilter) return true;

                    // Check parent hierarchy
                    if (item.parentLevelType === filterLevel && item.parentLevelId === selectedIdForFilter) return true;
                    if (item.parentHierarchy && item.parentHierarchy.includes(selectedIdForFilter)) return true;

                    return false;
                });
            }
        });

        // Backward compatibility with old filter states
        if (selectedBlockId > 0) {
            filteredItems = filteredItems.filter((item) => {
                if (item.parentLevelId === selectedBlockId || item.blockId === selectedBlockId) return true;
                if (item.id === selectedBlockId) return true;
                if (item.parentLevelType === "Block" && item.parentLevelId === selectedBlockId) return true;
                return item.blockId === selectedBlockId ||
                    item.block_id === selectedBlockId ||
                    (item.parentHierarchy && item.parentHierarchy.includes(selectedBlockId));
            });
        }

        if (selectedMandalId > 0) {
            filteredItems = filteredItems.filter((item) => {
                if (item.parentLevelId === selectedMandalId || item.mandalId === selectedMandalId) return true;
                if (item.id === selectedMandalId) return true;
                if (item.parentLevelType === "Mandal" && item.parentLevelId === selectedMandalId) return true;
                return item.mandalId === selectedMandalId ||
                    item.mandal_id === selectedMandalId ||
                    (item.parentHierarchy && item.parentHierarchy.includes(selectedMandalId));
            });
        }

        if (selectedPollingCenterId > 0) {
            filteredItems = filteredItems.filter((item) => {
                if (item.parentLevelId === selectedPollingCenterId || item.pollingCenterId === selectedPollingCenterId) return true;
                if (item.id === selectedPollingCenterId) return true;
                if (item.parentLevelType === "PollingCenter" && item.parentLevelId === selectedPollingCenterId) return true;
                return item.pollingCenterId === selectedPollingCenterId ||
                    item.polling_center_id === selectedPollingCenterId ||
                    (item.parentHierarchy && item.parentHierarchy.includes(selectedPollingCenterId));
            });
        }

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
    useEffect(() => {
        const fetchAllParentInfo = async () => {
            if (levelItems.length === 0) return;

            // Get items that don't have parent info yet
            const itemsNeedingParentInfo = levelItems.filter(item => {
                const parentId = item.parentId || item.parent_id;
                return parentId && !parentInfo[parentId];
            });

            if (itemsNeedingParentInfo.length === 0) return;

            // Fetch parent details using the after-assembly API in batches
            const batchSize = 5;
            for (let i = 0; i < itemsNeedingParentInfo.length; i += batchSize) {
                const batch = itemsNeedingParentInfo.slice(i, i + batchSize);
                await Promise.all(batch.map(item => fetchParentDetailsFromAPI(item.id)));
            }
        };

        fetchAllParentInfo();
    }, [levelItems]);

    // Fetch user counts for all items
    useEffect(() => {
        const fetchAllUserCounts = async () => {
            if (levelItems.length === 0) return;

            // Start with fresh user counts for current level items
            const userCounts: Record<number, number> = {};

            // Only fetch counts for items that don't have counts yet
            const itemsNeedingCounts = levelItems.filter(item => !(item.id in itemUserCounts));

            if (itemsNeedingCounts.length === 0) return;

            // Fetch user counts in batches to avoid overwhelming the API
            const batchSize = 10;
            for (let i = 0; i < itemsNeedingCounts.length; i += batchSize) {
                const batch = itemsNeedingCounts.slice(i, i + batchSize);
                const promises = batch.map(async (item) => {
                    const count = await fetchUserCount(item.id);
                    return { id: item.id, count };
                });

                const results = await Promise.all(promises);
                results.forEach(({ id, count }) => {
                    userCounts[id] = count;
                });
            }

            // Update user counts by merging with existing counts for current level
            setItemUserCounts(prevCounts => ({
                ...prevCounts,
                ...userCounts
            }));
        };

        fetchAllUserCounts();
    }, [levelItems, levelName]); // Add levelName as dependency to refetch when level changes

    // Fetch all items for the current level - Assembly context
    useEffect(() => {
        const fetchAllLevelItems = async () => {
            if (!assemblyInfo.assemblyId) return;

            setIsLoading(true);
            try {
                const token = localStorage.getItem("auth_access_token");
                let levelItems: any[] = [];

                // Step 1: Fetch all after-assembly levels for the current assembly
                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/after-assembly-data/assembly/${assemblyInfo.assemblyId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const data = await res.json();
                const afterAssemblyLevels = (data.data || []).map((level: any) => ({
                    ...level,
                    assemblyId: assemblyInfo.assemblyId,
                    assemblyName: assemblyInfo.assemblyName,
                    districtId: assemblyInfo.districtId,
                    districtName: assemblyInfo.districtName,
                }));

                // Now fetch items based on the target level
                if (levelName === "Block" || levelName === "Ward" || levelName === "Zone" || levelName === "Sector") {
                    // Check if this level is a direct child of Assembly
                    const directAssemblyChildren = afterAssemblyLevels.filter((level: any) =>
                        level.levelName === levelName &&
                        level.parentAssemblyId &&
                        !level.parentId
                    );

                    if (directAssemblyChildren.length > 0) {
                        levelItems = directAssemblyChildren;
                    } else {
                        // This level might be a child of another after-assembly level
                        // Fetch children of all after-assembly levels and build proper hierarchy
                        levelItems = (
                            await Promise.all(
                                afterAssemblyLevels.map(async (parentLevel: any) => {
                                    const childrenData = await fetchAllPages(
                                        `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${parentLevel.id}`
                                    );
                                    return childrenData
                                        .filter((child: any) => child.levelName === levelName)
                                        .map((child: any) => ({
                                            ...child,
                                            parentLevelId: parentLevel.id,
                                            parentLevelName: parentLevel.displayName,
                                            parentLevelType: parentLevel.levelName,
                                            assemblyId: parentLevel.assemblyId,
                                            assemblyName: parentLevel.assemblyName,
                                            districtId: parentLevel.districtId,
                                            districtName: parentLevel.districtName,
                                            // Add parent hierarchy chain for better filtering
                                            parentHierarchy: [parentLevel.id, ...(parentLevel.parentHierarchy || [])],
                                            // Add all parent level names for proper display
                                            [`${parentLevel.levelName.toLowerCase()}Name`]: parentLevel.displayName,
                                            [`${parentLevel.levelName.toLowerCase()}Id`]: parentLevel.id,
                                        }));
                                })
                            )
                        ).flat();
                    }
                } else if (levelName === "Mandal") {
                    // Step 3: Fetch all mandals for each after-assembly level
                    levelItems = (
                        await Promise.all(
                            afterAssemblyLevels.map(async (parentLevel: any) => {
                                const mandalsData = await fetchAllPages(
                                    `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${parentLevel.id}`
                                );
                                return mandalsData
                                    .filter((mandal: any) => mandal.levelName === "Mandal")
                                    .map((mandal: any) => ({
                                        ...mandal,
                                        // Store the Block/Ward/Zone parent info
                                        parentLevelId: parentLevel.id,
                                        parentLevelName: parentLevel.displayName,
                                        parentLevelType: parentLevel.levelName,
                                        [`${parentLevel.levelName.toLowerCase()}Name`]: parentLevel.displayName,
                                        [`${parentLevel.levelName.toLowerCase()}Id`]: parentLevel.id,
                                        assemblyId: parentLevel.assemblyId,
                                        assemblyName: parentLevel.assemblyName,
                                        districtId: parentLevel.districtId,
                                        districtName: parentLevel.districtName,
                                        // Add parent hierarchy chain for better filtering
                                        parentHierarchy: [parentLevel.id, ...(parentLevel.parentHierarchy || [])],
                                    }));
                            })
                        )
                    ).flat();
                } else if (levelName === "PollingCenter") {
                    // Step 3: Fetch mandals first, then polling centers
                    const mandals = (
                        await Promise.all(
                            afterAssemblyLevels.map(async (parentLevel: any) => {
                                const mandalsData = await fetchAllPages(
                                    `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${parentLevel.id}`
                                );
                                return mandalsData
                                    .filter((mandal: any) => mandal.levelName === "Mandal")
                                    .map((mandal: any) => ({
                                        ...mandal,
                                        // Store the Block/Ward/Zone parent info
                                        parentLevelId: parentLevel.id,
                                        parentLevelName: parentLevel.displayName,
                                        parentLevelType: parentLevel.levelName,
                                        [`${parentLevel.levelName.toLowerCase()}Name`]: parentLevel.displayName,
                                        [`${parentLevel.levelName.toLowerCase()}Id`]: parentLevel.id,
                                        assemblyId: parentLevel.assemblyId,
                                        assemblyName: parentLevel.assemblyName,
                                        districtId: parentLevel.districtId,
                                        districtName: parentLevel.districtName,
                                    }));
                            })
                        )
                    ).flat();

                    // Step 4: Fetch polling centers for each mandal
                    levelItems = (
                        await Promise.all(
                            mandals.map(async (mandal: any) => {
                                const pollingCentersData = await fetchAllPages(
                                    `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${mandal.id}`
                                );
                                const filteredChildren = pollingCentersData.filter(
                                    (item: any) => item.levelName !== "Booth"
                                );

                                return filteredChildren.map((pc: any) => ({
                                    ...pc,
                                    // Propagate Mandal info
                                    mandalId: mandal.id,
                                    mandalName: mandal.displayName,
                                    // Propagate Block/Ward/Zone info from mandal
                                    [`${mandal.parentLevelType.toLowerCase()}Name`]: mandal.parentLevelName,
                                    [`${mandal.parentLevelType.toLowerCase()}Id`]: mandal.parentLevelId,
                                    // Keep original parent info for immediate parent
                                    parentLevelId: mandal.id,
                                    parentLevelName: mandal.displayName,
                                    parentLevelType: mandal.levelName,
                                    // Propagate assembly info
                                    assemblyId: mandal.assemblyId,
                                    assemblyName: mandal.assemblyName,
                                    districtId: mandal.districtId,
                                    districtName: mandal.districtName,
                                }));
                            })
                        )
                    ).flat();
                } else if (levelName === "Booth") {
                    // For booths, we need to go through the full hierarchy
                    const mandals = (
                        await Promise.all(
                            afterAssemblyLevels.map(async (parentLevel: any) => {
                                const mandalsData = await fetchAllPages(
                                    `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${parentLevel.id}`
                                );
                                return mandalsData
                                    .filter((mandal: any) => mandal.levelName === "Mandal")
                                    .map((mandal: any) => ({
                                        ...mandal,
                                        // Store the Block/Ward/Zone parent info
                                        parentLevelId: parentLevel.id,
                                        parentLevelName: parentLevel.displayName,
                                        parentLevelType: parentLevel.levelName,
                                        [`${parentLevel.levelName.toLowerCase()}Name`]: parentLevel.displayName,
                                        [`${parentLevel.levelName.toLowerCase()}Id`]: parentLevel.id,
                                        assemblyId: parentLevel.assemblyId,
                                        assemblyName: parentLevel.assemblyName,
                                        districtId: parentLevel.districtId,
                                        districtName: parentLevel.districtName,
                                    }));
                            })
                        )
                    ).flat();
                    // Get all children of mandals (both polling centers and direct booths)
                    const allMandalChildren = (
                        await Promise.all(
                            mandals.map(async (mandal: any) => {
                                const childrenData = await fetchAllPages(
                                    `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${mandal.id}`
                                );
                                return childrenData.map((child: any) => ({
                                    ...child,
                                    // Propagate Mandal info
                                    mandalId: mandal.id,
                                    mandalName: mandal.displayName,
                                    // Propagate Block/Ward/Zone info from mandal
                                    [`${mandal.parentLevelType.toLowerCase()}Name`]: mandal.parentLevelName,
                                    [`${mandal.parentLevelType.toLowerCase()}Id`]: mandal.parentLevelId,
                                    // Keep original parent info for immediate parent
                                    parentLevelId: mandal.id,
                                    parentLevelName: mandal.displayName,
                                    parentLevelType: mandal.levelName,
                                    // Propagate assembly info
                                    assemblyId: mandal.assemblyId,
                                    assemblyName: mandal.assemblyName,
                                    districtId: mandal.districtId,
                                    districtName: mandal.districtName,
                                }));
                            })
                        )
                    ).flat();

                    // Separate polling centers and direct booths
                    const pollingCenters = allMandalChildren.filter(
                        (item: any) => item.levelName !== "Booth"
                    );
                    const directBooths = allMandalChildren.filter(
                        (item: any) => item.levelName === "Booth"
                    );

                    // Get booths from polling centers
                    const pollingCenterBooths = (
                        await Promise.all(
                            pollingCenters.map(async (pc: any) => {
                                const boothsData = await fetchAllPages(
                                    `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${pc.id}`
                                );
                                return boothsData.map((booth: any) => ({
                                    ...booth,
                                    // Propagate Polling Center info
                                    pollingCenterId: pc.id,
                                    pollingCenterName: pc.displayName,
                                    // Propagate Mandal info from polling center
                                    mandalId: pc.mandalId,
                                    mandalName: pc.mandalName,
                                    // Propagate Block/Ward/Zone info from polling center
                                    ...(pc.blockName && { blockName: pc.blockName, blockId: pc.blockId }),
                                    ...(pc.wardName && { wardName: pc.wardName, wardId: pc.wardId }),
                                    ...(pc.zoneName && { zoneName: pc.zoneName, zoneId: pc.zoneId }),
                                    ...(pc.sectorName && { sectorName: pc.sectorName, sectorId: pc.sectorId }),
                                    // Keep original parent info for immediate parent (polling center)
                                    parentLevelId: pc.id,
                                    parentLevelName: pc.displayName,
                                    parentLevelType: pc.levelName,
                                    // Propagate assembly info
                                    assemblyId: pc.assemblyId,
                                    assemblyName: pc.assemblyName,
                                    districtId: pc.districtId,
                                    districtName: pc.districtName,
                                }));
                            })
                        )
                    ).flat();

                    levelItems = [...directBooths, ...pollingCenterBooths];
                } else {
                    // For other levels - this is handled in the first condition above
                    // All levels after assembly are handled dynamically
                    levelItems = [];
                }

                setAllLevelItems(levelItems);
            } catch (err) {
                console.error(`Error fetching all ${levelName} items:`, err);
                setAllLevelItems([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllLevelItems();
    }, [assemblyInfo.assemblyId, levelName]);

    // Handle items without users filter
    const handleItemsWithoutUsersClick = () => {
        const itemsWithoutUsersCount = levelItems.filter(
            (item) => (itemUserCounts[item.id] !== undefined ? itemUserCounts[item.id] : (item.user_count || 0)) === 0
        ).length;

        if (itemsWithoutUsersCount > 0) {
            setShowItemsWithoutUsers(!showItemsWithoutUsers);
            setCurrentPage(1);
        }
    };

    const filteredLevelItems = levelItems.filter((item) => {
        const matchesSearch = item.displayName
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const matchesFilter =
            selectedLevelFilter === "" ||
            item.id.toString() === selectedLevelFilter;

        const matchesWithoutUsersFilter = showItemsWithoutUsers
            ? (itemUserCounts[item.id] !== undefined ? itemUserCounts[item.id] : (item.user_count || 0)) === 0
            : true;

        return matchesSearch && matchesFilter && matchesWithoutUsersFilter;
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
                // Store user data
                setItemUsers((prev) => ({
                    ...prev,
                    [itemId]: data.data.users,
                }));

                // Update user count with the actual count from the API
                setItemUserCounts((prev) => ({
                    ...prev,
                    [itemId]: data.data.users.length,
                }));

                // Store parent information from parentDetails if available
                if (data.data.parentDetails) {
                    const parentDetails = data.data.parentDetails;
                    setParentInfo(prev => ({
                        ...prev,
                        [parentDetails.id]: {
                            id: parentDetails.id,
                            displayName: parentDetails.displayName,
                            levelName: parentDetails.levelName,
                        }
                    }));
                }

                setExpandedItemId(itemId);
            }
        } catch (error) {
            console.error(`Error fetching users for ${levelName} ${itemId}:`, error);
        }
    };

    // Booth-specific handlers (only used when levelName === "Booth")
    const fetchAllBoothFileCounts = async (booths: any[]) => {
        if (levelName !== "Booth") return;

        const token = localStorage.getItem("auth_access_token");
        const counts: Record<number, number> = {};

        const batchSize = 10;
        for (let i = 0; i < booths.length; i += batchSize) {
            const batch = booths.slice(i, i + batchSize);
            const promises = batch.map(async (booth) => {
                try {
                    const response = await fetch(
                        `${import.meta.env.VITE_API_BASE_URL}/api/booth-deleted-voter-files/booth/${booth.id}?page=1&limit=1`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const data = await response.json();

                    if (response.ok && data?.success && data?.pagination) {
                        return { id: booth.id, count: data.pagination.total || 0 };
                    } else {
                        return { id: booth.id, count: 0 };
                    }
                } catch (error) {
                    console.error(`Error fetching file count for booth ${booth.id}:`, error);
                    return { id: booth.id, count: 0 };
                }
            });

            const results = await Promise.all(promises);
            results.forEach(({ id, count }) => {
                counts[id] = count;
            });
        }

        setBoothFileCounts(counts);
    };

    const getStateDetails = () => {
        const rawUser = localStorage.getItem("auth_user");
        const parsedUser = rawUser ? JSON.parse(rawUser) : {};

        const stateNameFromAssignment =
            (selectedAssignment as any)?.stateName ||
            (selectedAssignment as any)?.state_name ||
            "";

        const stateName =
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

    // Fetch file counts when booths are loaded
    useEffect(() => {
        if (levelName === "Booth" && allLevelItems.length > 0) {
            fetchAllBoothFileCounts(allLevelItems);
        }
    }, [allLevelItems, levelName]);

    const totalPages = Math.ceil(filteredLevelItems.length / itemsPerPage);
    const paginatedItems = filteredLevelItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-1">
                <div className="flex items-center justify-center h-64">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-1">
                <div className="w-full mx-auto">
                    {/* Header with Stats Cards */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-3 mb-1 text-white">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="shrink-0">
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                                    {displayLevelName} List
                                </h1>
                                <p className="text-blue-100 mt-1 text-xs sm:text-sm">
                                    Assembly: {assemblyInfo.assemblyName} | District: {assemblyInfo.districtName}
                                </p>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                                    {/* Total Items Card */}
                                    <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-gray-600">
                                                Total {displayLevelName}s
                                            </p>
                                            <p className="text-xl sm:text-2xl font-semibold mt-1">
                                                {levelItems.length}
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
                                    {/* Total Users Card */}
                                    <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-gray-600">
                                                Total Users
                                            </p>
                                            <p className="text-xl sm:text-2xl font-semibold text-green-600 mt-1">
                                                {Object.values(itemUserCounts).reduce((sum, count) => sum + count, 0) ||
                                                    levelItems.reduce((sum, item) => sum + (item.user_count || 0), 0)}
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
                                        className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${levelItems.filter((item) => (itemUserCounts[item.id] !== undefined ? itemUserCounts[item.id] : (item.user_count || 0)) === 0)
                                            .length > 0
                                            ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-red-50"
                                            : "cursor-default"
                                            } ${showItemsWithoutUsers
                                                ? "ring-2 ring-red-500 bg-red-50"
                                                : ""
                                            }`}
                                        title={
                                            levelItems.filter((item) => (itemUserCounts[item.id] !== undefined ? itemUserCounts[item.id] : (item.user_count || 0)) === 0)
                                                .length > 0
                                                ? `Click to view ${displayLevelName.toLowerCase()}s without users`
                                                : `No ${displayLevelName.toLowerCase()}s without users`
                                        }
                                    >
                                        <div>
                                            <p className="text-xs font-medium text-gray-600">
                                                {displayLevelName}s Without Users
                                                {showItemsWithoutUsers && (
                                                    <span className="ml-2 text-red-600 font-semibold">
                                                        (Filtered)
                                                    </span>
                                                )}
                                            </p>
                                            <p
                                                className={`text-xl sm:text-2xl font-semibold mt-1 ${levelItems.filter(
                                                    (item) => (itemUserCounts[item.id] !== undefined ? itemUserCounts[item.id] : (item.user_count || 0)) === 0
                                                ).length > 0
                                                    ? "text-red-600"
                                                    : "text-gray-400"
                                                    }`}
                                            >
                                                {
                                                    levelItems.filter(
                                                        (item) => (itemUserCounts[item.id] !== undefined ? itemUserCounts[item.id] : (item.user_count || 0)) === 0
                                                    ).length
                                                }
                                            </p>
                                        </div>
                                        <div
                                            className={`rounded-full p-1.5 ${levelItems.filter((item) => (itemUserCounts[item.id] !== undefined ? itemUserCounts[item.id] : (item.user_count || 0)) === 0)
                                                .length > 0
                                                ? "bg-red-50"
                                                : "bg-gray-50"
                                                }`}
                                        >
                                            {levelItems.filter((item) => (itemUserCounts[item.id] !== undefined ? itemUserCounts[item.id] : (item.user_count || 0)) === 0)
                                                .length > 0 ? (
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
                                                    className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
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
                    <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                            {/* Assembly Filter - Always shown and disabled (current context) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Assembly
                                </label>
                                <input
                                    type="text"
                                    value={assemblyInfo.assemblyName}
                                    disabled
                                    className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                />
                            </div>

                            {/* Dynamic Filters - Show filters based on hierarchy */}
                            {visibleFilters.length > 0 ? (
                                visibleFilters.map((filterLevel, index) => {
                                    const filterItems = dynamicFilterData[filterLevel] || [];
                                    const previousFilterLevel = index > 0 ? visibleFilters[index - 1] : null;
                                    const isPreviousSelected = !previousFilterLevel || (selectedFilters[previousFilterLevel] && selectedFilters[previousFilterLevel] > 0);
                                    const isDisabled = index > 0 && !isPreviousSelected;

                                    // Get current selected value for this filter
                                    const currentValue = selectedFilters[filterLevel] || 0;

                                    return (
                                        <div key={filterLevel}>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {filterLevel}
                                            </label>
                                            <select
                                                value={currentValue}
                                                onChange={(e) => handleFilterChange(filterLevel, Number(e.target.value))}
                                                disabled={isDisabled}
                                                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value={0}>All {filterLevel}s</option>
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filter by {displayLevelName}
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search {displayLevelName}s
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg
                                            className="w-5 h-5 text-gray-400"
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
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Level Items List */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        {filteredLevelItems.length === 0 ? (
                            <div className="text-center py-12">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
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
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    No {displayLevelName.toLowerCase()}s found
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
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
                                            <thead className="bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        S.No
                                                    </th>
                                                    {/* Show Assembly column always */}
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Assembly
                                                    </th>
                                                    {/* Dynamic parent level columns - show all levels in hierarchy */}
                                                    {visibleFilters.map((filterLevel) => (
                                                        <th key={filterLevel} className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                            {filterLevel}
                                                        </th>
                                                    ))}
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Level Type
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        {displayLevelName} Name
                                                    </th>
                                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Total Users
                                                    </th>
                                                    {levelName === "Booth" && (
                                                        <>
                                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                Upload Deleted Voters
                                                            </th>
                                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                Uploaded Files
                                                            </th>
                                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                Result Analysis
                                                            </th>
                                                        </>
                                                    )}
                                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {paginatedItems.map((item, index) => (
                                                    <React.Fragment key={item.id}>
                                                        <tr className="hover:bg-blue-50 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                                            </td>
                                                            {/* Assembly column - always shown */}
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                                    {item.assemblyName || assemblyInfo.assemblyName || "N/A"}
                                                                </span>
                                                            </td>
                                                            {/* Dynamic parent level columns - show all hierarchy levels */}
                                                            {visibleFilters.map((filterLevel) => {
                                                                // Helper function to get the display name for a specific level
                                                                const getDisplayNameForLevel = (levelName: string) => {
                                                                    // Try to get from item properties with various naming conventions
                                                                    const levelKey = levelName.toLowerCase();

                                                                    // Try direct property names
                                                                    if (item[`${levelKey}Name`]) return item[`${levelKey}Name`];
                                                                    if (item[`${levelKey}_name`]) return item[`${levelKey}_name`];

                                                                    // Try specific known properties
                                                                    const propertyMap: Record<string, string[]> = {
                                                                        'Block': ['blockName', 'block_name'],
                                                                        'Mandal': ['mandalName', 'mandal_name'],
                                                                        'PollingCenter': ['pollingCenterName', 'polling_center_name'],
                                                                        'Ward': ['wardName', 'ward_name'],
                                                                        'Zone': ['zoneName', 'zone_name'],
                                                                        'Sector': ['sectorName', 'sector_name'],
                                                                    };

                                                                    const possibleProps = propertyMap[levelName] || [];
                                                                    for (const prop of possibleProps) {
                                                                        if (item[prop]) return item[prop];
                                                                    }

                                                                    // If this is the immediate parent level, try parentLevelName
                                                                    if (item.parentLevelType === levelName && item.parentLevelName) {
                                                                        return item.parentLevelName;
                                                                    }

                                                                    // Try to get from parentInfo if this level matches the parent
                                                                    const parentId = item.parentId || item.parent_id;
                                                                    const parent = parentId ? parentInfo[parentId] : null;
                                                                    if (parent && parent.levelName === levelName) {
                                                                        return parent.displayName || parent.levelName;
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
                                                                        <p className="text-sm font-semibold text-gray-900">
                                                                            {item.displayName}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500">
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
                                                                    <span className="text-sm font-medium text-gray-900">
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
                                                                        <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
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
                                                                                className="fixed w-60 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-64 overflow-y-auto"
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
                                                                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-3 transition-colors group"
                                                                                    >
                                                                                        <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                                                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                                                            </svg>
                                                                                        </div>
                                                                                        <span className="font-medium">Assign Users</span>
                                                                                    </button>
                                                                                    <div className="border-t border-gray-100 my-1"></div>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setSelectedItemForVoters({ id: item.id, name: item.displayName });
                                                                                            setShowAssignVotersModal(true);
                                                                                            setOpenDropdownId(null);
                                                                                        }}
                                                                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 flex items-center gap-3 transition-colors group"
                                                                                    >
                                                                                        <div className="p-1.5 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                                                                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                                            </svg>
                                                                                        </div>
                                                                                        <span className="font-medium">Assign Booth Voters</span>
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
                                                                    if (visibleFilters.length > 0) {
                                                                        return visibleFilters[visibleFilters.length - 1];
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
                                                                colSpan={levelName === "Booth" ? (visibleFilters.length > 0 ? 9 : 8) : (visibleFilters.length > 0 ? 6 : 5)}
                                                            />
                                                        )}
                                                        {/* File Display for Booths */}
                                                        {levelName === "Booth" && expandedFilesBoothId === item.id && boothFiles[item.id] && (
                                                            <tr>
                                                                <td colSpan={visibleFilters.length > 0 ? 9 : 8} className="px-6 py-4 bg-purple-50">
                                                                    <div>
                                                                        <h4 className="text-sm font-semibold text-purple-800 mb-2">Uploaded Deleted Voter Files</h4>
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
                                                                                        <span className="text-sm text-gray-700">Select All</span>
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
                                                                                        <li className="text-sm text-gray-600">No files uploaded for this booth yet.</li>
                                                                                    )}
                                                                                    {boothFiles[item.id]?.data.map((file: any) => (
                                                                                        <li key={file.id} className="flex items-center justify-between bg-white p-2 rounded border">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    checked={(selectedFileIds[item.id] || []).includes(file.id)}
                                                                                                    onChange={(e) => handleFileSelection(item.id, file.id, e.target.checked)}
                                                                                                    className="rounded"
                                                                                                />
                                                                                                <span className="text-sm font-medium text-gray-800">
                                                                                                    {file.filePath || file.file_name || "File"}
                                                                                                </span>
                                                                                                <span className="text-xs text-gray-500">
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
                                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            <button
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    Showing{" "}
                                                    <span className="font-medium">
                                                        {(currentPage - 1) * itemsPerPage + 1}
                                                    </span>{" "}
                                                    to{" "}
                                                    <span className="font-medium">
                                                        {Math.min(currentPage * itemsPerPage, filteredLevelItems.length)}
                                                    </span>{" "}
                                                    of{" "}
                                                    <span className="font-medium">{filteredLevelItems.length}</span>{" "}
                                                    results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                    <button
                                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                        disabled={currentPage === 1}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Previous
                                                    </button>
                                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                        const pageNum = i + 1;
                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => setCurrentPage(pageNum)}
                                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                                                    ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                                    }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    })}
                                                    <button
                                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                        disabled={currentPage === totalPages}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Next
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