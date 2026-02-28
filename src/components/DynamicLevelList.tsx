import React, { useState, useEffect } from "react";
import { useGetSidebarLevelsQuery } from "../store/api/partyWiseLevelApi";
import { useGetDynamicLevelDataQuery } from "../store/api/dynamicLevelApi";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import * as XLSX from "xlsx";
import InlineUserDisplay from "./InlineUserDisplay";

interface DynamicLevelListProps {
    levelName: string;
    displayLevelName: string;
    parentLevelName?: string;
}

export default function DynamicLevelList({
    levelName,
    displayLevelName }: DynamicLevelListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    // Dynamic filters instead of hardcoded ones
    const [selectedFilters, setSelectedFilters] = useState<Record<string, number>>({});
    const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // Reset all filters when levelName changes (navigation to different level)
    // Clear both selected filters AND filter options for fresh start
    useEffect(() => {
        setSearchTerm("");
        setSelectedLevelFilter("");
        setCurrentPage(1);
        setShowItemsWithoutUsers(false);
        setShowItemsWithUsers(false);
        setExpandedItemId(null);
        setItemUsers({});
        setAllLevelItems([]);
        setAllItemsForFilter([]); // Clear fetched items for filter
        setParentInfo({});
        setItemUserCounts({});

        // Clear selected filters AND filter options for fresh start on each page
        setSelectedFilters({});
        setDynamicFilterOptions({});
    }, [levelName]);

    // // Function to reset all filters manually
    // const resetAllFilters = () => {
    //     setSearchTerm("");
    //     setSelectedFilters({});
    //     setSelectedLevelFilter("");
    //     setCurrentPage(1);
    //     setShowItemsWithoutUsers(false);
    // };

    // State for filter data - will be populated dynamically
    const [dynamicFilterOptions, setDynamicFilterOptions] = useState<Record<string, any[]>>({});

    // State for all items of the current level
    const [allLevelItems, setAllLevelItems] = useState<any[]>([]);
    
    // State for all items across all pages (used when user filter is active)
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

    // State for dynamic hierarchy order
    const [hierarchyOrder, setHierarchyOrder] = useState<string[]>([
        "State", "District", "Assembly", "Block", "Mandal", "PollingCenter", "Ward", "Zone", "Sector", "Booth"
    ]);

    // State for parent information
    const [parentInfo, setParentInfo] = useState<Record<number, any>>({});

    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );

    const user = useSelector((state: RootState) => state.auth.user);

    const [stateInfo, setStateInfo] = useState({
        stateName: "",
        stateId: 0,
    });

    // Get party and state info for API call
    const partyId = user?.partyId || 0;
    const stateId = selectedAssignment?.stateMasterData_id || 0;

    // Fetch dynamic sidebar levels from API
    const { data: sidebarLevels = [] } = useGetSidebarLevelsQuery(
        { partyId, stateId },
        { skip: !partyId || !stateId }
    );

    // Fetch dynamic level data using Redux API (BLA API) with pagination
    const { 
        data: dynamicLevelData, 
        isLoading: isDynamicLevelLoading,
        isFetching: isDynamicLevelFetching,
    } = useGetDynamicLevelDataQuery(
        { 
            stateId, 
            partyId, 
            levelName,
            districtId: selectedFilters["District"],
            assemblyId: selectedFilters["Assembly"],
            blockId: selectedFilters["Block"],
            mandalId: selectedFilters["Mandal"],
            page: currentPage,
            limit: itemsPerPage,
        },
        { 
            skip: !partyId || !stateId || !levelName 
        }
    );

    // Update hierarchy order based on API response
    useEffect(() => {
        if (sidebarLevels && sidebarLevels.length > 0) {
            // Extract level names from API response and create hierarchy order
            const apiHierarchy = ["State", "District", "Assembly"]; // Always start with these

            // Add levels from API response in order
            sidebarLevels.forEach((level: any) => {
                if (level.level_name && !apiHierarchy.includes(level.level_name)) {
                    apiHierarchy.push(level.level_name);
                }
            });

            setHierarchyOrder(apiHierarchy);
        }
    }, [sidebarLevels]);

    // Populate filter options from Redux API data (BLA API)
    useEffect(() => {
        if (dynamicLevelData) {
            const newFilterOptions: Record<string, any[]> = {};

            // Populate District filter from districtList
            if (dynamicLevelData.districtList && dynamicLevelData.districtList.length > 0) {
                newFilterOptions["District"] = dynamicLevelData.districtList.map((d) => ({
                    id: d.id,
                    displayName: d.levelName,
                    levelName: "District",
                    ParentId: d.ParentId
                }));
            }

            // Populate Assembly filter from assemblyList
            if (dynamicLevelData.assemblyList && dynamicLevelData.assemblyList.length > 0) {
                newFilterOptions["Assembly"] = dynamicLevelData.assemblyList.map((a) => ({
                    id: a.id,
                    displayName: a.levelName,
                    levelName: "Assembly",
                    ParentId: a.ParentId
                }));
            }

            // Populate hierarchical levels (Block, Mandal, etc.) from hierarchicalList
            if (dynamicLevelData.hierarchicalList && dynamicLevelData.hierarchicalList.length > 0) {
                dynamicLevelData.hierarchicalList.forEach((hierarchyLevel) => {
                    if (hierarchyLevel.list && hierarchyLevel.list.length > 0) {
                        newFilterOptions[hierarchyLevel.levelName] = hierarchyLevel.list.map((item) => ({
                            id: item.id,
                            displayName: item.name,
                            levelName: hierarchyLevel.levelName,
                            parentId: item.parentId
                        }));
                    }
                });
            }

            setDynamicFilterOptions(newFilterOptions);
        }
    }, [dynamicLevelData]);

    // Populate allLevelItems from Redux API data (BLA API) - This is the main data source
    useEffect(() => {
        if (dynamicLevelData && dynamicLevelData.items) {
            // Filter items for current level
            const currentLevelItems = dynamicLevelData.items.filter(
                (item) => item.itemLevelType === levelName
            );

            if (currentLevelItems.length > 0) {
                // Map the items to the format expected by the component
                const items = currentLevelItems.map((item) => ({
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
                }));

                setAllLevelItems(items);
            } else {
                setAllLevelItems([]);
            }
        }
    }, [dynamicLevelData, levelName]);
    useEffect(() => {
        if (selectedAssignment) {
            setStateInfo({
                stateName: selectedAssignment.levelName || "",
                stateId: selectedAssignment.stateMasterData_id || 0,
            });
        }
    }, [selectedAssignment]);

    // Determine which filters to show based on the current level
    const getVisibleFilters = () => {
        const currentLevelIndex = hierarchyOrder.indexOf(levelName);
        if (currentLevelIndex === -1) return hierarchyOrder.slice(0, 6); // Default fallback

        // Show filters up to (but not including) the current level, excluding State
        return hierarchyOrder.slice(1, currentLevelIndex); // Start from index 1 to skip "State"
    };

    const visibleFilters = getVisibleFilters();

    // Helper function to get the last selected after-assembly level ID
    // This works for any level after Assembly (Block, Mandal, PollingCenter, Ward, Zone, Sector, Booth, etc.)
    const getAfterAssemblyId = () => {
        // Find the last selected filter that comes after Assembly in hierarchy
        const assemblyIndex = hierarchyOrder.indexOf("Assembly");
        
        // Iterate through visible filters in reverse order to find the last selected after-assembly level
        for (let i = visibleFilters.length - 1; i >= 0; i--) {
            const filterLevel = visibleFilters[i];
            const filterLevelIndex = hierarchyOrder.indexOf(filterLevel);
            
            // Check if this level is after Assembly and has a selected value
            if (filterLevelIndex > assemblyIndex && selectedFilters[filterLevel] && selectedFilters[filterLevel] > 0) {
                return selectedFilters[filterLevel];
            }
        }
        
        return null;
    };

    // Handle dynamic filter change
    const handleFilterChange = (levelName: string, value: number) => {
        // Reset all dependent filters when a filter changes
        const levelIndex = hierarchyOrder.indexOf(levelName);
        const newFilters = { ...selectedFilters };
        const newFilterOptions = { ...dynamicFilterOptions };

        // Remove all filters after the changed one
        visibleFilters.forEach((filter) => {
            if (hierarchyOrder.indexOf(filter) > levelIndex) {
                delete newFilters[filter];
                // Also clear filter options for dependent levels
                delete newFilterOptions[filter];
            }
        });

        // Always set the value (even if 0 for "All")
        newFilters[levelName] = value;

        setSelectedFilters(newFilters);
        setDynamicFilterOptions(newFilterOptions);
        setCurrentPage(1);
    };

    // Auto-select first district when districts are loaded
    // BUT: Don't override if user has manually selected "All Districts" (value = 0)
    useEffect(() => {
        if (dynamicFilterOptions["District"] &&
            dynamicFilterOptions["District"].length > 0 &&
            selectedFilters["District"] === undefined) { // Only auto-select if undefined, not if 0
            // Set to 0 (All) instead of first district to show all items
            setSelectedFilters(prev => ({
                ...prev,
                District: 0
            }));
        }
    }, [dynamicFilterOptions["District"]]);

    // ============================================================================
    // OLD FETCH LOGIC - COMMENTED OUT - NOW USING BLA API DATA FROM REDUX
    // ============================================================================
    
    // // Fetch filter options for each level based on parent selections - OPTIMIZED
    // useEffect(() => {
    //     const populateFilterOptions = async () => {
    //         ... OLD LOGIC REMOVED ...
    //     };
    //     populateFilterOptions();
    // }, [stateInfo.stateId, selectedFilters]);

    // // Fetch all items for the current level - OPTIMIZED for better performance
    // useEffect(() => {
    //     const fetchAllLevelItems = async () => {
    //         ... OLD LOGIC REMOVED ...
    //     };
    //     fetchAllLevelItems();
    // }, [stateInfo.stateId, levelName, selectedFilters["District"], selectedFilters["Assembly"], selectedFilters["Block"], selectedFilters["Mandal"]]);

    // ============================================================================
    // END OF OLD FETCH LOGIC
    // ============================================================================

    // Auto-select first option for each subsequent filter level (Assembly, Block, Mandal, etc.)
    // DISABLED: This was causing items to be filtered out automatically
    // Now filters default to "All" (0) to show all items
    // useEffect(() => {
    //     const newSelections: Record<string, number> = {};
    //     let hasUpdates = false;

    //     visibleFilters.forEach((level, index) => {
    //         const filterOptions = dynamicFilterOptions[level];
    //         const isSelected = selectedFilters[level] !== undefined;
    //         const parentLevel = index > 0 ? visibleFilters[index - 1] : null;
    //         const isParentSelected = !parentLevel || selectedFilters[parentLevel] !== undefined;

    //         if (levelName === "Booth" && level === "PollingCenter") {
    //             return;
    //         }

    //         if (filterOptions && filterOptions.length > 0 && !isSelected && isParentSelected) {
    //             newSelections[level] = filterOptions[0].id;
    //             hasUpdates = true;
    //         }
    //     });

    //     if (hasUpdates) {
    //         setSelectedFilters(prev => ({
    //             ...prev,
    //             ...newSelections
    //         }));
    //     }
    // }, [dynamicFilterOptions, visibleFilters, levelName]);

    // Get current level items based on filters - fixed to prevent cross-assembly contamination
    const getCurrentLevelItems = () => {
        // Use allItemsForFilter when user filter is active, otherwise use allLevelItems
        let filteredItems = (showItemsWithoutUsers || showItemsWithUsers) ? allItemsForFilter : allLevelItems;

        // If no items, return empty array
        if (filteredItems.length === 0) {
            return [];
        }

        // IMPORTANT: If API filters are active (District, Assembly, Block, Mandal),
        // the API has already filtered the data correctly.
        // We should NOT apply client-side filtering on top of API filtering.
        // Only apply client-side filtering when using allItemsForFilter (user filters active)
        const hasApiFilters = Object.keys(selectedFilters).some(key => 
            selectedFilters[key] && selectedFilters[key] > 0
        );
        
        if (hasApiFilters && !showItemsWithoutUsers && !showItemsWithUsers) {
            return filteredItems;
        }

        // Only apply client-side filtering when user filters are active

        // Check if items have parent information (assemblyId, districtId)
        // If most items don't have parent info, skip filtering (they are top-level items)
        const itemsWithParentInfo = filteredItems.filter(item => 
            item.assemblyId || item.districtId || item.parentId
        );
        
        if (itemsWithParentInfo.length === 0) {
            return filteredItems;
        }

        // Apply filters dynamically based on visible filters (only for user filters)
        visibleFilters.forEach((filterLevel) => {
            const selectedIdForFilter = selectedFilters[filterLevel];
            if (selectedIdForFilter && selectedIdForFilter > 0) {
                filteredItems = filteredItems.filter((item) => {
                    // For Assembly filter, check assemblyId - strict matching only
                    if (filterLevel === "Assembly") {
                        return item.assemblyId === selectedIdForFilter;
                    }

                    // For District filter, check districtId - strict matching only
                    if (filterLevel === "District") {
                        return item.districtId === selectedIdForFilter;
                    }

                    // Special handling for PollingCenter when viewing Booths
                    // Include both direct booths under mandal AND booths under the selected polling center
                    if (filterLevel === "PollingCenter" && levelName === "Booth") {
                        // Include booths under this polling center OR direct booths (no pollingCenterId)
                        return item.pollingCenterId === selectedIdForFilter || !item.pollingCenterId;
                    }

                    // For other levels, use strict hierarchy checking
                    // First check direct parent relationship
                    if (item.parentLevelId === selectedIdForFilter || item.parentItemId === selectedIdForFilter) return true;

                    // Check if the item has this level's id in specific property names
                    const levelKey = filterLevel.toLowerCase();
                    if (item[`${levelKey}Id`] === selectedIdForFilter) return true;
                    if (item[`${levelKey}_id`] === selectedIdForFilter) return true;

                    // Check if parent level type matches and parent ID matches
                    if (item.parentItemLevelType === filterLevel && item.parentItemId === selectedIdForFilter) {
                        return true;
                    }
                    if (item.parentLevelType === filterLevel && item.parentLevelId === selectedIdForFilter) {
                        return true;
                    }

                    // For after-assembly levels, ensure we only match items that belong to the correct assembly
                    // This prevents cross-assembly contamination
                    if (filterLevel !== "Assembly" && filterLevel !== "District") {
                        // If we have an assembly filter active, ensure this item belongs to that assembly
                        const selectedAssemblyId = selectedFilters["Assembly"];
                        if (selectedAssemblyId && item.assemblyId !== selectedAssemblyId) {
                            return false;
                        }
                    }

                    return false;
                });
            }
        });

        return filteredItems;
    };

    const levelItems = getCurrentLevelItems();

    // Initialize user counts from API data when allLevelItems is loaded
    // OPTIMIZED: Only extract counts that are already in the API response, don't fetch on page load
    useEffect(() => {
        const initializeUserCounts = () => {
            if (allLevelItems.length === 0) return;

            // Reset user counts - use only counts from API response
            const initialUserCounts: Record<number, number> = {};

            // Extract counts that are already in API response
            allLevelItems.forEach(item => {
                const count = item.user_count ?? item.userCount;
                // Only set if count is explicitly provided in API response
                if (count !== undefined && count !== null) {
                    initialUserCounts[item.id] = count;
                }
            });

            // Set initial counts (don't fetch missing ones - wait for user interaction)
            setItemUserCounts(initialUserCounts);
        };

        initializeUserCounts();
    }, [allLevelItems]);

    // Lazy fetch user counts for items without counts (after initial render)
    useEffect(() => {
        const lazyFetchUserCounts = async () => {
            if (levelItems.length === 0) return;

            // Find items without user counts
            const itemsNeedingCounts = levelItems.filter(
                item => itemUserCounts[item.id] === undefined && item.user_count === undefined
            );

            if (itemsNeedingCounts.length === 0) return;

            // Add a small delay to avoid overwhelming the API on page load
            const timer = setTimeout(async () => {
                // Fetch counts in small batches (max 5 concurrent)
                const batchSize = 5;
                for (let i = 0; i < itemsNeedingCounts.length; i += batchSize) {
                    const batch = itemsNeedingCounts.slice(i, i + batchSize);
                    const countPromises = batch.map(async (item) => {
                        try {
                            const response = await fetch(
                                `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/after-assembly/${item.id}`,
                                {
                                    headers: {
                                        Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                                    },
                                }
                            );
                            const data = await response.json();
                            if (data.success && data.data?.users) {
                                return { id: item.id, count: data.data.users.length };
                            }
                        } catch (error) {
                            // Silent error handling
                        }
                        return { id: item.id, count: 0 };
                    });

                    const results = await Promise.all(countPromises);
                    // Update counts in state
                    setItemUserCounts(prev => {
                        const newCounts = { ...prev };
                        results.forEach(({ id, count }) => {
                            newCounts[id] = count;
                        });
                        return newCounts;
                    });
                }
            }, 800); // Small delay to let page render first

            return () => clearTimeout(timer);
        };

        lazyFetchUserCounts();
    }, [levelItems]);

    // Fetch user counts for all items - DISABLED for performance
    // User counts will be fetched on-demand when user expands an item
    // useEffect(() => {
    //     const fetchAllUserCounts = async () => {
    //         if (levelItems.length === 0) return;

    //         // Reset user counts when filters change - don't preserve old counts
    //         const userCounts: Record<number, number> = {};

    //         // Only fetch counts for items that don't have counts yet
    //         const itemsNeedingCounts = levelItems.filter(item => !(item.id in itemUserCounts));

    //         if (itemsNeedingCounts.length === 0) return;

    //         // Fetch user counts in batches to avoid overwhelming the API
    //         const batchSize = 10;
    //         for (let i = 0; i < itemsNeedingCounts.length; i += batchSize) {
    //             const batch = itemsNeedingCounts.slice(i, i + batchSize);
    //             const promises = batch.map(async (item) => {
    //                 const count = await fetchUserCount(item.id);
    //                 return { id: item.id, count };
    //             });

    //             const results = await Promise.all(promises);
    //             results.forEach(({ id, count }) => {
    //                 userCounts[id] = count;
    //             });
    //         }

    //         setItemUserCounts(userCounts);
    //     };

    //     fetchAllUserCounts();
    // }, [levelItems]); // Remove itemUserCounts from dependency to avoid infinite loop

    // ============================================================================
    // OLD FETCH LOGIC COMPLETELY REMOVED - NOW USING BLA API DATA FROM REDUX
    // All data now comes from dynamicLevelData via Redux API
    // ============================================================================

    // Function to fetch all items across all pages for filtering
    const fetchAllItemsForFilter = async () => {
        if (isLoadingAllItems || allItemsForFilter.length > 0) {
            return; // Already loaded or loading
        }

        setIsLoadingAllItems(true);
        try {
            const totalItems = dynamicLevelData?.pagination?.total || dynamicLevelData?.metaData?.totalItems || 0;
            const limit = 3000;
            const totalPagesNeeded = Math.ceil(totalItems / limit);
            
            const allItems: any[] = [];
            
            for (let page = 1; page <= totalPagesNeeded; page++) {
                // Build query parameters dynamically
                const queryParams: Record<string, string> = {
                    partyId: partyId.toString(),
                    levelName: levelName,
                    page: page.toString(),
                    limit: limit.toString(),
                };
                
                // Add district and assembly filters
                if (selectedFilters["District"] && selectedFilters["District"] > 0) {
                    queryParams.districtId = selectedFilters["District"].toString();
                }
                if (selectedFilters["Assembly"] && selectedFilters["Assembly"] > 0) {
                    queryParams.assemblyId = selectedFilters["Assembly"].toString();
                }
                
                // Add afterAssemblyId for any level after Assembly (dynamic)
                const afterAssemblyId = getAfterAssemblyId();
                if (afterAssemblyId) {
                    queryParams.afterAssemblyId = afterAssemblyId.toString();
                }
                
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/v2/dash/dynamicLevel/${stateId}?` +
                    new URLSearchParams(queryParams),
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                
                const data = await response.json();
                if (data.success && data.data.items) {
                    const pageItems = data.data.items
                        .filter((item: any) => item.itemLevelType === levelName)
                        .map((item: any) => ({
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
                        }));
                    allItems.push(...pageItems);
                }
            }
            
            setAllItemsForFilter(allItems);
        } catch (error) {
            // Silent error handling
        } finally {
            setIsLoadingAllItems(false);
        }
    };

    // Handle items without users filter - fetch all items first
    const handleItemsWithoutUsersClick = async () => {
        if (showItemsWithoutUsers) {
            // Turning off filter
            setShowItemsWithoutUsers(false);
            setCurrentPage(1);
            return;
        }

        // Fetch all items if not already loaded
        if (allItemsForFilter.length === 0) {
            await fetchAllItemsForFilter();
        }

        setShowItemsWithoutUsers(true);
        setShowItemsWithUsers(false);
        setCurrentPage(1);
    };

    // Handle items with users filter - fetch all items first
    const handleItemsWithUsersClick = async () => {
        if (showItemsWithUsers) {
            // Turning off filter
            setShowItemsWithUsers(false);
            setCurrentPage(1);
            return;
        }

        // Fetch all items if not already loaded
        if (allItemsForFilter.length === 0) {
            await fetchAllItemsForFilter();
        }

        setShowItemsWithUsers(true);
        setShowItemsWithoutUsers(false);
        setCurrentPage(1);
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

        const matchesWithUsersFilter = showItemsWithUsers
            ? (itemUserCounts[item.id] !== undefined ? itemUserCounts[item.id] : (item.user_count || 0)) > 0
            : true;

        return matchesSearch && matchesFilter && matchesWithoutUsersFilter && matchesWithUsersFilter;
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
            // Silent error handling
        }
    };

    // Export to Excel function - Fetch all items from all pages
    const handleExportToExcel = async () => {
        try {
            // Show loading state
            const exportButton = document.querySelector('[title*="Export"]') as HTMLButtonElement;
            if (exportButton) {
                exportButton.disabled = true;
                exportButton.textContent = 'Exporting...';
            }

            // Calculate total pages needed with larger limit
            const totalItems = dynamicLevelData?.pagination?.total || dynamicLevelData?.metaData?.totalItems || 0;
            const limit = 3000; // Fetch 3000 items per page for faster export
            const totalPagesNeeded = Math.ceil(totalItems / limit); // Calculate pages based on new limit
            
            // Fetch all pages
            const allItems: any[] = [];
            
            for (let page = 1; page <= totalPagesNeeded; page++) {
                // Build query parameters dynamically
                const queryParams: Record<string, string> = {
                    partyId: partyId.toString(),
                    levelName: levelName,
                    page: page.toString(),
                    limit: limit.toString(),
                };
                
                // Add district and assembly filters
                if (selectedFilters["District"] && selectedFilters["District"] > 0) {
                    queryParams.districtId = selectedFilters["District"].toString();
                }
                if (selectedFilters["Assembly"] && selectedFilters["Assembly"] > 0) {
                    queryParams.assemblyId = selectedFilters["Assembly"].toString();
                }
                
                // Add afterAssemblyId for any level after Assembly (dynamic)
                const afterAssemblyId = getAfterAssemblyId();
                if (afterAssemblyId) {
                    queryParams.afterAssemblyId = afterAssemblyId.toString();
                }
                
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/v2/dash/dynamicLevel/${stateId}?` +
                    new URLSearchParams(queryParams),
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                
                const data = await response.json();
                if (data.success && data.data.items) {
                    // Filter items for current level and map to component format
                    const pageItems = data.data.items
                        .filter((item: any) => item.itemLevelType === levelName)
                        .map((item: any) => ({
                            id: item.itemId,
                            displayName: item.itemName,
                            levelName: item.itemLevelType,
                            parentId: item.parentItemId,
                            parentLevelName: item.parentItemName,
                            districtId: item.districtId,
                            districtName: item.districtName,
                            assemblyId: item.assemblyId,
                            assemblyName: item.assemblyName,
                            blockName: item.parentItemLevelType === 'Block' ? item.parentItemName : '',
                            mandalName: item.parentItemLevelType === 'Mandal' ? item.parentItemName : '',
                        }));
                    allItems.push(...pageItems);
                }
            }

            // Create export data
            const exportData = allItems.map((item, index) => {
                const exportRow: any = {
                    "S.No": index + 1,
                    [`${displayLevelName} Name`]: item.displayName || "N/A",
                };

                // Add hierarchy columns dynamically
                visibleFilters.forEach(filterLevel => {
                    const hierarchyKey = `${filterLevel.toLowerCase()}Name`;
                    exportRow[`${filterLevel} Name`] = item[hierarchyKey] || "N/A";
                });

                return exportRow;
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);

            // Set column widths
            const colWidths = [
                { wch: 8 },  // S.No
                ...visibleFilters.map(() => ({ wch: 25 })), // Hierarchy columns
                { wch: 30 }, // Level Name
            ];
            worksheet["!cols"] = colWidths;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, displayLevelName);

            const timestamp = new Date().toISOString().split("T")[0];
            const filename = `${displayLevelName}_List_${stateInfo.stateName}_${timestamp}.xlsx`;

            XLSX.writeFile(workbook, filename);

            // Reset button state
            if (exportButton) {
                exportButton.disabled = false;
                exportButton.innerHTML = `
                    <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Excel (${allItems.length})
                `;
            }
        } catch (error) {
            alert('Failed to export data. Please try again.');
        }
    };

    // Calculate total pages - prioritize server pagination, but use client-side when filter is active
    const totalPages = (showItemsWithoutUsers || showItemsWithUsers) 
        ? Math.ceil(filteredLevelItems.length / itemsPerPage)
        : (dynamicLevelData?.pagination?.totalPages || Math.ceil(filteredLevelItems.length / itemsPerPage));
    
    // Use items directly from API (already paginated by server)
    // But apply client-side pagination when user filter is active
    const paginatedItems = (showItemsWithoutUsers || showItemsWithUsers)
        ? filteredLevelItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : filteredLevelItems;

    // Determine if we should show pagination
    // Show if server has pagination OR client-side has multiple pages
    const shouldShowPagination = (showItemsWithoutUsers || showItemsWithUsers)
        ? totalPages > 1
        : ((dynamicLevelData?.pagination && dynamicLevelData.pagination.totalPages > 1) || 
           (!dynamicLevelData?.pagination && totalPages > 1));

    useEffect(() => {
        const maxPages = dynamicLevelData?.pagination?.totalPages || totalPages;
        if (currentPage > maxPages && maxPages > 0) {
            setCurrentPage(maxPages);
        }
    }, [totalPages, currentPage, dynamicLevelData?.pagination?.totalPages]);

    if (isDynamicLevelLoading || isDynamicLevelFetching || isLoadingAllItems) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-1">
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-700 text-base font-medium">
                        {isLoadingAllItems ? `Loading all ${displayLevelName}s for filtering...` : `Loading ${displayLevelName} data...`}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">Please wait, fetching data from server</p>
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
                                    State: {stateInfo.stateName}
                                </p>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                                {/* Export Button */}
                                <div className="flex justify-end lg:justify-start">
                                    <button
                                        onClick={handleExportToExcel}
                                        disabled={!dynamicLevelData || (dynamicLevelData.pagination?.total || dynamicLevelData.metaData?.totalItems || 0) === 0}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-md transition-colors duration-200"
                                        title={`Export all ${dynamicLevelData?.pagination?.total || dynamicLevelData?.metaData?.totalItems || allLevelItems.length} ${displayLevelName.toLowerCase()}s to Excel`}
                                    >
                                        <svg
                                            className="w-4 h-4 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        Export Excel ({dynamicLevelData?.pagination?.total || dynamicLevelData?.metaData?.totalItems || allLevelItems.length})
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                                    {/* Total Items Card */}
                                    <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-gray-600">
                                                Total {displayLevelName}s
                                            </p>
                                            <p className="text-xl sm:text-2xl font-semibold mt-1">
                                                {dynamicLevelData?.pagination?.total || dynamicLevelData?.metaData?.totalItems || levelItems.length}
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
                                        className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${levelItems.filter((item) => (itemUserCounts[item.id] !== undefined ? itemUserCounts[item.id] : (item.user_count || 0)) > 0)
                                            .length > 0
                                            ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-green-50"
                                            : "cursor-default"
                                            } ${showItemsWithUsers
                                                ? "ring-2 ring-green-500 bg-green-50"
                                                : ""
                                            }`}
                                        title={
                                            levelItems.filter((item) => (itemUserCounts[item.id] !== undefined ? itemUserCounts[item.id] : (item.user_count || 0)) > 0)
                                                .length > 0
                                                ? `Click to view ${displayLevelName.toLowerCase()}s with users`
                                                : `No ${displayLevelName.toLowerCase()}s with users`
                                        }
                                    >
                                        <div>
                                            <p className="text-xs font-medium text-gray-600">
                                                Total Users
                                                {showItemsWithUsers && (
                                                    <span className="ml-2 text-green-600 font-semibold">
                                                        (Filtered)
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xl sm:text-2xl font-semibold text-green-600 mt-1">
                                                {dynamicLevelData?.metaData?.totalUsers || levelItems.reduce((sum, item) => {
                                                    const count = itemUserCounts[item.id] !== undefined 
                                                        ? itemUserCounts[item.id] 
                                                        : (item.user_count || 0);
                                                    return sum + count;
                                                }, 0)}
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
                                                className={`text-xl sm:text-2xl font-semibold mt-1 ${(dynamicLevelData?.metaData?.levelWithoutUsers || levelItems.filter(
                                                    (item) => (itemUserCounts[item.id] !== undefined ? itemUserCounts[item.id] : (item.user_count || 0)) === 0
                                                ).length) > 0
                                                    ? "text-red-600"
                                                    : "text-gray-400"
                                                    }`}
                                            >
                                                {dynamicLevelData?.metaData?.levelWithoutUsers || 
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
                    {/* Dynamic Filters - Only show relevant filters based on current level */}
                    <div className="bg-white rounded-xl shadow-md p-3 mb-1">
                        <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-${Math.min(visibleFilters.length + 3, 8)} gap-4`}>
                            {/* State Filter - Always shown */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    State
                                </label>
                                <input
                                    type="text"
                                    value={stateInfo.stateName}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                />
                            </div>

                            {/* Dynamic Filters - Render based on hierarchy */}
                            {visibleFilters.map((filterLevel) => {
                                const filterOptions = dynamicFilterOptions[filterLevel] || [];
                                const parentFilterLevel = visibleFilters[visibleFilters.indexOf(filterLevel) - 1];
                                const parentSelected = selectedFilters[parentFilterLevel];
                                const isDisabled = !!(parentFilterLevel && (!parentSelected || parentSelected === 0));

                                return (
                                    <div key={filterLevel}>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {filterLevel}
                                        </label>
                                        <select
                                            value={selectedFilters[filterLevel] || 0}
                                            onChange={(e) => handleFilterChange(filterLevel, Number(e.target.value))}
                                            disabled={isDisabled}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        >
                                            <option value={0}>All {filterLevel}s</option>
                                            {filterOptions.map((option: any) => (
                                                <option
                                                    key={option.id}
                                                    value={option.id}
                                                >
                                                    {option.displayName || option.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })}

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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            {/* <div className="flex items-end">
                                <button
                                    onClick={resetAllFilters}
                                    disabled={Object.keys(selectedFilters).length === 0 && !searchTerm && !selectedLevelFilter}
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
                            </div> */}
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
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    S.No
                                                </th>
                                                {/* Dynamic parent level column */}
                                                {visibleFilters.length > 0 && (
                                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        {(() => {
                                                            // Special handling for Booth - show Mandal or PollingCenter
                                                            if (levelName === "Booth" && paginatedItems.length > 0) {
                                                                const firstItem = paginatedItems[0];
                                                                if (firstItem.pollingCenterName) return "PollingCenter";
                                                                if (firstItem.mandalName) return "Mandal";
                                                            }

                                                            // Get the actual parent level name from first item's parent info
                                                            if (paginatedItems.length > 0) {
                                                                const firstItem = paginatedItems[0];
                                                                const parentId = firstItem.parentId || firstItem.parent_id;
                                                                const parent = parentId ? parentInfo[parentId] : null;

                                                                if (parent && parent.levelName) {
                                                                    return parent.levelName;
                                                                }

                                                                // Try to get parent level from item's parentLevelType
                                                                if (firstItem.parentLevelType) {
                                                                    return firstItem.parentLevelType;
                                                                }
                                                            }

                                                            // Determine parent level based on current level in hierarchy
                                                            const currentLevelIndex = hierarchyOrder.indexOf(levelName);
                                                            if (currentLevelIndex > 0) {
                                                                return hierarchyOrder[currentLevelIndex - 1];
                                                            }

                                                            // Fallback to last visible filter
                                                            return visibleFilters[visibleFilters.length - 1] || "Parent";
                                                        })()}
                                                    </th>
                                                )}
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Level Type
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    {displayLevelName} Name
                                                </th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Total Users
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
                                                        {/* Dynamic parent level display */}
                                                        {visibleFilters.length > 0 && (
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                                                    {(() => {
                                                                        const parentId = item.parentId || item.parent_id;
                                                                        const parent = parentId ? parentInfo[parentId] : null;

                                                                        if (parent) {
                                                                            return parent.displayName || parent.levelName || "N/A";
                                                                        }

                                                                        // Special handling for Booth - show Mandal or PollingCenter based on what's available
                                                                        if (levelName === "Booth") {
                                                                            if (item.pollingCenterName) {
                                                                                return item.pollingCenterName;
                                                                            }
                                                                            if (item.mandalName) {
                                                                                return item.mandalName;
                                                                            }
                                                                        }

                                                                        // Try to get parent name from item's parentLevelName first
                                                                        if (item.parentLevelName) {
                                                                            return item.parentLevelName;
                                                                        }

                                                                        // Determine the correct parent level based on current level position in hierarchy
                                                                        const currentLevelIndex = hierarchyOrder.indexOf(levelName);
                                                                        if (currentLevelIndex > 0) {
                                                                            const parentLevelName = hierarchyOrder[currentLevelIndex - 1];
                                                                            const parentKey = `${parentLevelName.toLowerCase()}Name`;

                                                                            if (item[parentKey]) {
                                                                                return item[parentKey];
                                                                            }
                                                                        }

                                                                        // Try specific parent name fields based on level hierarchy
                                                                        const possibleParentNames = [
                                                                            item.pollingCenterName,
                                                                            item.mandalName,
                                                                            item.blockName,
                                                                            item.wardName,
                                                                            item.zoneName,
                                                                            item.sectorName,
                                                                            item.assemblyName,
                                                                            item.districtName
                                                                        ].filter(Boolean);

                                                                        // Return the most immediate parent (first non-null value)
                                                                        if (possibleParentNames.length > 0) {
                                                                            return possibleParentNames[0];
                                                                        }

                                                                        return "N/A";
                                                                    })()}
                                                                </span>
                                                            </td>
                                                        )}
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
                                                                    {itemUserCounts[item.id] !== undefined ? itemUserCounts[item.id] : (item.userCount || item.user_count || 0)}
                                                                </span>
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
                                                            colSpan={visibleFilters.length > 0 ? 5 : 4}
                                                        />
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination - Show based on server or client pagination */}
                                {shouldShowPagination && (
                                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            <button
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-sm text-gray-700 flex items-center">
                                                Page {currentPage} of {(showItemsWithoutUsers || showItemsWithUsers) ? totalPages : (dynamicLevelData?.pagination?.totalPages || totalPages)}
                                                {(showItemsWithoutUsers || showItemsWithUsers) && (
                                                    <span className="ml-1 text-xs text-gray-500">(filtered)</span>
                                                )}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(Math.min(dynamicLevelData?.pagination?.totalPages || totalPages, currentPage + 1))}
                                                disabled={currentPage === (dynamicLevelData?.pagination?.totalPages || totalPages)}
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
                                                        {(showItemsWithoutUsers || showItemsWithUsers) ? 
                                                            ((currentPage - 1) * itemsPerPage + 1) :
                                                            (dynamicLevelData?.pagination ? 
                                                                ((dynamicLevelData.pagination.page - 1) * dynamicLevelData.pagination.limit + 1) :
                                                                ((currentPage - 1) * itemsPerPage + 1)
                                                            )
                                                        }
                                                    </span>{" "}
                                                    to{" "}
                                                    <span className="font-medium">
                                                        {(showItemsWithoutUsers || showItemsWithUsers) ?
                                                            Math.min(currentPage * itemsPerPage, filteredLevelItems.length) :
                                                            (dynamicLevelData?.pagination ? 
                                                                Math.min(dynamicLevelData.pagination.page * dynamicLevelData.pagination.limit, dynamicLevelData.pagination.total) :
                                                                Math.min(currentPage * itemsPerPage, filteredLevelItems.length)
                                                            )
                                                        }
                                                    </span>{" "}
                                                    of{" "}
                                                    <span className="font-medium">
                                                        {(showItemsWithoutUsers || showItemsWithUsers) ?
                                                            filteredLevelItems.length :
                                                            (dynamicLevelData?.pagination?.total || filteredLevelItems.length)
                                                        }
                                                    </span>{" "}
                                                    results
                                                    {(showItemsWithoutUsers || showItemsWithUsers) && (
                                                        <span className="ml-2 text-xs text-gray-500">(filtered)</span>
                                                    )}
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
                                                    {(() => {
                                                        const maxPages = dynamicLevelData?.pagination?.totalPages || totalPages;
                                                        const pagesToShow = Math.min(5, maxPages);
                                                        
                                                        // Calculate start page for pagination display
                                                        let startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
                                                        const endPage = Math.min(maxPages, startPage + pagesToShow - 1);
                                                        
                                                        // Adjust start page if we're near the end
                                                        if (endPage - startPage + 1 < pagesToShow) {
                                                            startPage = Math.max(1, endPage - pagesToShow + 1);
                                                        }
                                                        
                                                        return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                                                            const pageNum = startPage + i;
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
                                                        });
                                                    })()}
                                                    <button
                                                        onClick={() => setCurrentPage(Math.min(dynamicLevelData?.pagination?.totalPages || totalPages, currentPage + 1))}
                                                        disabled={currentPage === (dynamicLevelData?.pagination?.totalPages || totalPages)}
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
        </>
    );
}