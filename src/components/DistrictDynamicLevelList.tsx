import React, { useState, useEffect } from "react";
import { useGetSidebarLevelsQuery } from "../store/api/partyWiseLevelApi";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import InlineUserDisplay from "./InlineUserDisplay";
import { getAssemblyCache, setAssemblyCache, fetchAssemblyNameWithCache } from "../utils/assemblyCache";

interface DistrictDynamicLevelListProps {
  levelName: string;
  displayLevelName: string;
  parentLevelName?: string;
}

// Configuration constants - easily configurable
const CONFIG = {
  PAGINATION_LIMIT: 50,
  ITEMS_PER_PAGE: 20,
  PARENT_INFO_BATCH_SIZE: 5,
  USER_COUNT_BATCH_SIZE: 10,
  DEFAULT_FILTER_SLICE_START: 2, // Skip State and District
  DEFAULT_FILTER_SLICE_END: 6,
};

export default function DistrictDynamicLevelList({
  levelName,
  displayLevelName,
}: DistrictDynamicLevelListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(CONFIG.ITEMS_PER_PAGE);

  // Dynamic filter state - maps level name to selected ID
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, number>
  >({});

  // State for all items of the current level
  const [allLevelItems, setAllLevelItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // State for inline user display
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [itemUsers, setItemUsers] = useState<Record<number, any[]>>({});

  // State for filtering items without users
  const [showItemsWithoutUsers, setShowItemsWithoutUsers] = useState(false);
  // State for filtering items with users
  const [showItemsWithUsers, setShowItemsWithUsers] = useState(false);
  // State for user counts
  const [itemUserCounts, setItemUserCounts] = useState<Record<number, number>>(
    {}
  );

  // State for dynamic hierarchy order - gets updated from API
  const [hierarchyOrder, setHierarchyOrder] = useState<string[]>([
    "State",
    "District",
    "Assembly",
    "Block",
    "Mandal",
    "PollingCenter",
    "Ward",
    "Zone",
    "Sector",
    "Booth",
  ]);

  // Dynamic filter data - maps level name to array of items
  const [dynamicFilterData, setDynamicFilterData] = useState<
    Record<string, any[]>
  >({});

  // State for assembly information cache - Use utility functions for persistence
  const [assemblyInfoCache, setAssemblyInfoCache] = useState<Record<number, { id: number; name: string }>>(() => {
    return getAssemblyCache();
  });

  // Update localStorage whenever cache changes using utility
  useEffect(() => {
    setAssemblyCache(assemblyInfoCache);
  }, [assemblyInfoCache]);

  // Function to fetch assembly information by ID using utility
  const fetchAssemblyInfo = async (assemblyId: number): Promise<string> => {
    // Use utility function for caching
    const assemblyName = await fetchAssemblyNameWithCache(assemblyId, districtInfo.districtId);

    // Update local state cache as well
    if (assemblyName && !assemblyName.startsWith('Assembly ')) {
      setAssemblyInfoCache(prev => ({
        ...prev,
        [assemblyId]: { id: assemblyId, name: assemblyName }
      }));
    }

    return assemblyName;
  };

  // State for parent information
  const [parentInfo, setParentInfo] = useState<Record<number, any>>({});

  // Reset all filters when levelName changes
  useEffect(() => {
    setSearchTerm("");
    setSelectedFilters({});
    setSelectedLevelFilter("");
    setCurrentPage(1);
    setShowItemsWithoutUsers(false);
    setShowItemsWithUsers(false);
    setExpandedItemId(null);
    setItemUsers({});
    setItemUserCounts({});
    setAllLevelItems([]);
  }, [levelName]);

  // // Function to reset all filters manually
  // const resetAllFilters = () => {
  //   setSearchTerm("");
  //   setSelectedFilters({});
  //   setSelectedLevelFilter("");
  //   setCurrentPage(1);
  //   setShowItemsWithoutUsers(false);
  // };

  // Function to fetch parent details using the after-assembly API (which returns parentDetails)
  const fetchParentDetailsFromAPI = async (itemId: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL
        }/api/user-after-assembly-hierarchy/after-assembly/${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "auth_access_token"
            )}`,
          },
        }
      );
      const data = await response.json();

      if (data.success && data.data?.parentDetails) {
        const parentDetails = data.data.parentDetails;
        setParentInfo((prev) => ({
          ...prev,
          [parentDetails.id]: {
            id: parentDetails.id,
            displayName: parentDetails.displayName,
            levelName: parentDetails.levelName,
          },
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
        `${import.meta.env.VITE_API_BASE_URL
        }/api/user-after-assembly-hierarchy/after-assembly/${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "auth_access_token"
            )}`,
          },
        }
      );
      const data = await response.json();

      if (data.success && data.data?.users) {
        // Store parent information from parentDetails if available
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

  const user = useSelector((state: RootState) => state.auth.user);

  const [districtInfo, setDistrictInfo] = useState({
    districtName: "",
    districtId: 0,
    stateName: "",
    stateId: 0,
  });

  // Get party and state info for API call - District context
  const partyId = user?.partyId || 0;
  // For District panel, we need the state ID from the district's parent (which is the state)
  const stateId = selectedAssignment?.parentId || user?.state_id || 0;

  // Fetch dynamic sidebar levels from API
  const { data: sidebarLevels = [] } = useGetSidebarLevelsQuery(
    { partyId, stateId },
    { skip: !partyId || !stateId }
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

  useEffect(() => {
    if (selectedAssignment) {
      setDistrictInfo({
        districtName:
          selectedAssignment.levelName || selectedAssignment.displayName || "",
        districtId: selectedAssignment.stateMasterData_id || 0,
        stateName: selectedAssignment.parentLevelName || "",
        stateId: selectedAssignment.parentId || 0,
      });
    }
  }, [selectedAssignment]);

  // Determine which filters to show based on the current level - District context
  const getVisibleFilters = () => {
    const currentLevelIndex = hierarchyOrder.indexOf(levelName);
    const startIdx = CONFIG.DEFAULT_FILTER_SLICE_START;
    const endIdx = CONFIG.DEFAULT_FILTER_SLICE_END;

    if (currentLevelIndex === -1) return hierarchyOrder.slice(startIdx, endIdx);
    // Show filters from Assembly up to (but not including) the current level
    return hierarchyOrder.slice(startIdx, currentLevelIndex);
  };

  const visibleFilters = getVisibleFilters();

  // Helper function to fetch all pages - same as existing files
  const fetchAllPages = async (url: string) => {
    let allData: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `${url}?page=${page}&limit=${CONFIG.PAGINATION_LIMIT}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "auth_access_token"
            )}`,
          },
        }
      );
      const data = await response.json();

      let currentPageData: any[] = [];

      if (
        data.success &&
        data.data?.children &&
        data.data.children.length > 0
      ) {
        currentPageData = data.data.children;
        allData = allData.concat(currentPageData);
        hasMore = currentPageData.length === CONFIG.PAGINATION_LIMIT;
      } else if (data.success && data.children && data.children.length > 0) {
        currentPageData = data.children;
        allData = allData.concat(currentPageData);
        hasMore = currentPageData.length === CONFIG.PAGINATION_LIMIT;
      } else {
        hasMore = false;
      }

      page++;
    }

    return allData;
  };

  // Fetch assemblies for the current district
  useEffect(() => {
    const fetchAssemblies = async () => {
      if (!districtInfo.districtId) return;
      try {
        const assembliesData = await fetchAllPages(
          `${import.meta.env.VITE_API_BASE_URL
          }/api/user-state-hierarchies/hierarchy/children/${districtInfo.districtId
          }`
        );
        const mappedAssemblies = assembliesData.map((assembly: any) => ({
          id: assembly.location_id || assembly.id,
          displayName: assembly.location_name,
          levelName: "Assembly",
          location_id: assembly.location_id,
        }));

        // Update assembly cache with localStorage persistence
        const newAssemblyCache: Record<number, { id: number; name: string }> = { ...assemblyInfoCache };
        assembliesData.forEach((assembly: any) => {
          const id = assembly.location_id || assembly.id;
          const name = assembly.location_name || assembly.displayName || assembly.name || `Assembly ${id}`;
          newAssemblyCache[id] = { id, name };
        });
        setAssemblyInfoCache(newAssemblyCache);

        setDynamicFilterData((prev) => ({
          ...prev,
          Assembly: mappedAssemblies,
        }));
      } catch (error) {
        console.error("Error fetching assemblies:", error);
      }
    };
    fetchAssemblies();
  }, [districtInfo.districtId]);

  // Update assembly names for existing items when assembly cache is populated
  useEffect(() => {
    if (Object.keys(assemblyInfoCache).length > 0 && allLevelItems.length > 0) {
      const updatedItems = allLevelItems.map(item => {
        if (item.assemblyId && assemblyInfoCache[item.assemblyId] &&
          (!item.assemblyName || item.assemblyName.startsWith('Assembly '))) {
          return {
            ...item,
            assemblyName: assemblyInfoCache[item.assemblyId].name
          };
        }
        return item;
      });

      // Only update if there are actual changes
      const hasChanges = updatedItems.some((item, index) =>
        item.assemblyName !== allLevelItems[index].assemblyName
      );

      if (hasChanges) {
        setAllLevelItems(updatedItems);
      }
    }
  }, [assemblyInfoCache]);

  // Generic function to fetch children for any filter level
  const fetchFilterLevelChildren = async (
    parentId: number,
    parentLevelName: string
  ) => {
    if (!parentId) return [];

    try {
      // Determine which API to use based on parent level
      if (parentLevelName === "Assembly") {
        // Fetch direct children of assembly from after-assembly API (single fetch, no pagination needed)
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL
          }/api/after-assembly-data/assembly/${parentId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "auth_access_token"
              )}`,
            },
          }
        );
        const data = await response.json();
        return data.data || [];
      } else {
        // Fetch children from after-assembly hierarchy API using pagination
        const childrenData = await fetchAllPages(
          `${import.meta.env.VITE_API_BASE_URL
          }/api/user-after-assembly-hierarchy/hierarchy/children/${parentId}`
        );
        return childrenData;
      }
    } catch (error) {
      console.error(
        `Error fetching children for ${parentLevelName} ${parentId}:`,
        error
      );
      return [];
    }
  };

  // Fetch next level data whenever a filter changes
  useEffect(() => {
    const fetchAllLevelData = async () => {
      const visibleFilters = getVisibleFilters();
      if (visibleFilters.length === 0) return;

      // Fetch data for each filter level based on its parent selection
      for (let i = 0; i < visibleFilters.length; i++) {
        const currentLevel = visibleFilters[i];
        const parentLevel = i > 0 ? visibleFilters[i - 1] : null;
        const parentId = parentLevel ? selectedFilters[parentLevel] : null;

        // If parent is selected, fetch children
        if (parentId && parentId > 0 && parentLevel) {
          // Parent level is selected, fetch its children
          const children = await fetchFilterLevelChildren(
            parentId,
            parentLevel
          );
          setDynamicFilterData((prev) => ({
            ...prev,
            [currentLevel]: children,
          }));
        }
      }
    };

    fetchAllLevelData();
  }, [selectedFilters]);

  // Handle filter change - when a filter is changed, reset all filters after it
  const handleFilterChange = (levelName: string, value: number) => {
    const visibleFilters = getVisibleFilters();
    const changedLevelIndex = visibleFilters.indexOf(levelName);

    // Update the selected filter
    const newFilters = { ...selectedFilters };
    newFilters[levelName] = value;

    // Reset all filters after this one
    for (let i = changedLevelIndex + 1; i < visibleFilters.length; i++) {
      newFilters[visibleFilters[i]] = 0;
    }

    setSelectedFilters(newFilters);
    setCurrentPage(1);
  };

  // Get current level items based on filters - District context (fixed to prevent cross-assembly contamination)
  const getCurrentLevelItems = () => {
    let filteredItems = allLevelItems;
    const visibleFilters = getVisibleFilters();

    // Apply filters dynamically based on visible filters
    visibleFilters.forEach((filterLevel) => {
      const selectedIdForFilter = selectedFilters[filterLevel];
      if (selectedIdForFilter && selectedIdForFilter > 0) {
        filteredItems = filteredItems.filter((item) => {
          // For Assembly filter, check assemblyId - strict matching only
          if (filterLevel === "Assembly") {
            return item.assemblyId === selectedIdForFilter ||
              (item.parentChain && item.parentChain["Assembly"] === selectedIdForFilter);
          }

          // For District filter, check districtId - strict matching only
          if (filterLevel === "District") {
            return item.districtId === selectedIdForFilter ||
              (item.parentChain && item.parentChain["District"] === selectedIdForFilter);
          }

          // For other levels, use strict hierarchy checking
          // First check direct parent relationship
          if (item.parentLevelId === selectedIdForFilter) return true;

          // Check parent chain (full hierarchy) - but only for exact matches
          if (item.parentChain && item.parentChain[filterLevel] === selectedIdForFilter) {
            return true;
          }

          // Check if the item has this level's id in specific property names
          const levelKey = filterLevel.toLowerCase();
          if (item[`${levelKey}Id`] === selectedIdForFilter) return true;
          if (item[`${levelKey}_id`] === selectedIdForFilter) return true;

          // For after-assembly levels, ensure we only match items that belong to the correct assembly
          // This prevents cross-assembly contamination
          if (filterLevel !== "Assembly" && filterLevel !== "District") {
            // If we have an assembly filter active, ensure this item belongs to that assembly
            const selectedAssemblyId = selectedFilters["Assembly"];
            if (selectedAssemblyId && item.parentChain && item.parentChain["Assembly"] !== selectedAssemblyId) {
              return false;
            }

            // Check parent hierarchy but only for direct relationships
            if (item.parentLevelType === filterLevel && item.parentLevelId === selectedIdForFilter) {
              return true;
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
  useEffect(() => {
    if (allLevelItems.length > 0) {
      // Reset user counts completely for new level data
      const initialUserCounts: Record<number, number> = {};

      allLevelItems.forEach((item) => {
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
      const itemsNeedingParentInfo = levelItems.filter((item) => {
        const parentId = item.parentId || item.parent_id;
        return parentId && !parentInfo[parentId];
      });

      if (itemsNeedingParentInfo.length === 0) return;

      // Fetch parent details using the after-assembly API in batches
      const batchSize = CONFIG.PARENT_INFO_BATCH_SIZE;
      for (let i = 0; i < itemsNeedingParentInfo.length; i += batchSize) {
        const batch = itemsNeedingParentInfo.slice(i, i + batchSize);
        await Promise.all(
          batch.map((item) => fetchParentDetailsFromAPI(item.id))
        );
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
      const itemsNeedingCounts = levelItems.filter(
        (item) => !(item.id in itemUserCounts)
      );

      if (itemsNeedingCounts.length === 0) return;

      // Fetch user counts in batches to avoid overwhelming the API
      const batchSize = CONFIG.USER_COUNT_BATCH_SIZE;
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
      setItemUserCounts((prevCounts) => ({
        ...prevCounts,
        ...userCounts,
      }));
    };

    fetchAllUserCounts();
  }, [levelItems, levelName]); // Add levelName as dependency to refetch when level changes

  // Fetch all items for the current level - Dynamic and generic approach
  useEffect(() => {
    const fetchAllLevelItems = async () => {
      if (!districtInfo.districtId) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem("auth_access_token");
        let levelItems: any[] = [];

        // Find the position of current level in hierarchy
        const currentLevelIndex = hierarchyOrder.indexOf(levelName);

        if (currentLevelIndex === -1) {
          console.warn(
            `Level "${levelName}" not found in hierarchy:`,
            hierarchyOrder
          );
          setAllLevelItems([]);
          setIsLoading(false);
          return;
        }

        // Generic fetch function for any level
        const fetchLevelItems = async (
          parentIds: number[],
          parentLevelIndex: number,
          parentChain: Record<string, number> = {}
        ): Promise<any[]> => {
          const items: any[] = [];
          const nextLevelIndex = parentLevelIndex + 1;
          const nextLevelName = hierarchyOrder[nextLevelIndex];

          if (!nextLevelName) {
            return items;
          }

          for (const parentId of parentIds) {
            try {
              let childrenData: any[] = [];

              // Determine which API to use based on parent level
              if (parentLevelIndex === 1) {
                // District level
                // Fetch assemblies from state hierarchy API
                const rawAssemblies = await fetchAllPages(
                  `${import.meta.env.VITE_API_BASE_URL
                  }/api/user-state-hierarchies/hierarchy/children/${parentId}`
                );
                // Map state hierarchy response to have levelName property and assembly information
                childrenData = rawAssemblies.map((assembly: any) => ({
                  ...assembly,
                  id: assembly.location_id || assembly.id,
                  displayName: assembly.location_name || assembly.displayName,
                  levelName: "Assembly",
                  assemblyId: assembly.location_id || assembly.id, // Self-reference for assemblies
                  assemblyName: assembly.location_name || assembly.displayName,
                  districtId: parentId,
                  districtName: districtInfo.districtName,
                }));
              } else if (parentLevelIndex === 2) {
                // Assembly level
                // Fetch direct children from after-assembly API
                const response = await fetch(
                  `${import.meta.env.VITE_API_BASE_URL
                  }/api/after-assembly-data/assembly/${parentId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                const data = await response.json();

                // Get assembly name from cache or fetch it
                const assemblyName = await fetchAssemblyInfo(parentId);

                // Ensure each item has proper assembly association
                childrenData = (data.data || []).map((item: any) => ({
                  ...item,
                  assemblyId: parentId,
                  assemblyName: assemblyName,
                  districtId: parentChain["District"] || districtInfo.districtId,
                  districtName: parentChain["District"] ? `District ${parentChain["District"]}` : districtInfo.districtName,
                }));
              } else {
                // All other levels (after-assembly levels)
                // Fetch from after-assembly hierarchy API
                const rawChildren = await fetchAllPages(
                  `${import.meta.env.VITE_API_BASE_URL
                  }/api/user-after-assembly-hierarchy/hierarchy/children/${parentId}`
                );

                // Map response - preserve existing levelName, or detect from data structure
                const childrenDataPromises = rawChildren.map(async (item: any) => {
                  // If API already has levelName, use it. Otherwise detect it.
                  let detectedLevel = item.levelName;

                  // If no levelName in API response, try to infer from the object structure
                  if (!detectedLevel) {
                    // Check common properties that indicate the level type
                    if (item.boothNumber !== undefined) {
                      detectedLevel = "Booth";
                    } else if (item.pollingCenterNumber !== undefined) {
                      detectedLevel = "PollingCenter";
                    } else if (
                      item.mandalId !== undefined &&
                      !item.pollingCenterId
                    ) {
                      detectedLevel = "Mandal";
                    } else {
                      detectedLevel = nextLevelName; // Fallback to expected level
                    }
                  }

                  // Get assembly name from cache or fetch it
                  let assemblyName = item.assemblyName;
                  if (!assemblyName && parentChain["Assembly"]) {
                    const assemblyId = parentChain["Assembly"];
                    assemblyName = await fetchAssemblyInfo(assemblyId);
                  }

                  return {
                    ...item,
                    levelName: detectedLevel,
                    displayName:
                      item.displayName ||
                      item.name ||
                      `${detectedLevel} ${item.id}`,
                    // Inherit assembly information from parent chain
                    assemblyId: item.assemblyId || parentChain["Assembly"],
                    assemblyName: assemblyName,
                    districtId: item.districtId || parentChain["District"] || districtInfo.districtId,
                    districtName: item.districtName || (parentChain["District"] ? `District ${parentChain["District"]}` : districtInfo.districtName),
                  };
                });

                childrenData = await Promise.all(childrenDataPromises);
              }

              // Filter items - flexible approach to handle non-strictly-nested data
              // Look for items at current level, next level, or even skip intermediate levels
              let filteredItems: any[] = [];
              let foundAtLevel = nextLevelName; // Track which level we actually found items at

              // Try matching at the next expected level first
              filteredItems = childrenData.filter(
                (item: any) => item.levelName === nextLevelName
              );

              // If nothing found, look ahead up to 2 levels (handles skipped levels)
              if (filteredItems.length === 0) {
                for (
                  let i = nextLevelIndex + 1;
                  i <= Math.min(nextLevelIndex + 2, hierarchyOrder.length - 1);
                  i++
                ) {
                  const levelToCheck = hierarchyOrder[i];
                  const foundItems = childrenData.filter(
                    (item: any) => item.levelName === levelToCheck
                  );
                  if (foundItems.length > 0) {
                    filteredItems = foundItems;
                    foundAtLevel = levelToCheck;
                    break;
                  }
                }
              }

              // If still nothing found, check parent level (data might be less hierarchical than expected)
              if (filteredItems.length === 0 && nextLevelIndex > 2) {
                const parentLevelName = hierarchyOrder[nextLevelIndex - 1];
                filteredItems = childrenData.filter(
                  (item: any) => item.levelName === parentLevelName
                );
                foundAtLevel = parentLevelName;
              }

              // Build parent chain - include all ancestors
              const currentParentChain = { ...parentChain };
              const parentLevelName = hierarchyOrder[parentLevelIndex];
              if (parentLevelName) {
                currentParentChain[parentLevelName] = parentId;
              }

              const nextLevelItems = filteredItems.map((item: any) => ({
                ...item,
                parentLevelId: parentId,
                parentChain: currentParentChain, // Include full parent hierarchy
              }));

              // Determine if we should continue fetching deeper or return these items
              // Find the index of the level we actually found
              const foundAtIndex = hierarchyOrder.indexOf(foundAtLevel);

              // Only return items if they match the target level exactly
              // OR if they're deeper and we're still traversing (nextLevelIndex < currentLevelIndex)
              if (foundAtIndex === currentLevelIndex) {
                // Found exact level - return these items
                items.push(...nextLevelItems);
              }
              // If this is not the target level, fetch deeper
              else if (nextLevelIndex < currentLevelIndex) {
                const deeperItems = await fetchLevelItems(
                  nextLevelItems.map((i) => i.id),
                  nextLevelIndex,
                  currentParentChain
                );
                items.push(...deeperItems);
              }
              // If foundAtIndex > currentLevelIndex (items are deeper than target), don't return them
            } catch (error) {
              console.error(
                `Error fetching ${nextLevelName} for parent ${parentId}:`,
                error
              );
            }
          }

          return items;
        };

        // Start from district level
        const districtIds = [districtInfo.districtId];
        levelItems = await fetchLevelItems(districtIds, 1);

        setAllLevelItems(levelItems);
      } catch (err) {
        console.error(`Error fetching all ${levelName} items:`, err);
        setAllLevelItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllLevelItems();
  }, [districtInfo.districtId, levelName, hierarchyOrder]);

  // Handle items without users filter
  const handleItemsWithoutUsersClick = () => {
    const itemsWithoutUsersCount = levelItems.filter(
      (item) =>
        (itemUserCounts[item.id] !== undefined
          ? itemUserCounts[item.id]
          : item.user_count || 0) === 0
    ).length;

    if (itemsWithoutUsersCount > 0) {
      setShowItemsWithoutUsers(!showItemsWithoutUsers);
      setShowItemsWithUsers(false); // Disable the other filter
      setCurrentPage(1);
    }
  };

  // Handle items with users filter
  const handleItemsWithUsersClick = () => {
    const itemsWithUsersCount = levelItems.filter(
      (item) =>
        (itemUserCounts[item.id] !== undefined
          ? itemUserCounts[item.id]
          : item.user_count || 0) > 0
    ).length;

    if (itemsWithUsersCount > 0) {
      setShowItemsWithUsers(!showItemsWithUsers);
      setShowItemsWithoutUsers(false); // Disable the other filter
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
        `${import.meta.env.VITE_API_BASE_URL
        }/api/user-after-assembly-hierarchy/after-assembly/${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "auth_access_token"
            )}`,
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
      console.error(`Error fetching users for ${levelName} ${itemId}:`, error);
    }
  };

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
                  District: {districtInfo.districtName} | State:{" "}
                  {districtInfo.stateName}
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
                  {/* Total Users Card - Clickable */}
                  <div
                    onClick={handleItemsWithUsersClick}
                    className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${levelItems.filter(
                      (item) =>
                        (itemUserCounts[item.id] !== undefined
                          ? itemUserCounts[item.id]
                          : item.user_count || 0) > 0
                    ).length > 0
                      ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-green-50"
                      : "cursor-default"
                      } ${showItemsWithUsers
                        ? "ring-2 ring-green-500 bg-green-50"
                        : ""
                      }`}
                    title={
                      levelItems.filter(
                        (item) =>
                          (itemUserCounts[item.id] !== undefined
                            ? itemUserCounts[item.id]
                            : item.user_count || 0) > 0
                      ).length > 0
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
                        {levelItems.reduce(
                          (sum, item) =>
                            sum +
                            (itemUserCounts[item.id] !== undefined
                              ? itemUserCounts[item.id]
                              : item.user_count || 0),
                          0
                        )}
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
                    className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${levelItems.filter(
                      (item) =>
                        (itemUserCounts[item.id] !== undefined
                          ? itemUserCounts[item.id]
                          : item.user_count || 0) === 0
                    ).length > 0
                      ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-red-50"
                      : "cursor-default"
                      } ${showItemsWithoutUsers
                        ? "ring-2 ring-red-500 bg-red-50"
                        : ""
                      }`}
                    title={
                      levelItems.filter(
                        (item) =>
                          (itemUserCounts[item.id] !== undefined
                            ? itemUserCounts[item.id]
                            : item.user_count || 0) === 0
                      ).length > 0
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
                          (item) =>
                            (itemUserCounts[item.id] !== undefined
                              ? itemUserCounts[item.id]
                              : item.user_count || 0) === 0
                        ).length > 0
                          ? "text-red-600"
                          : "text-gray-400"
                          }`}
                      >
                        {
                          levelItems.filter(
                            (item) =>
                              (itemUserCounts[item.id] !== undefined
                                ? itemUserCounts[item.id]
                                : item.user_count || 0) === 0
                          ).length
                        }
                      </p>
                    </div>
                    <div
                      className={`rounded-full p-1.5 ${levelItems.filter(
                        (item) =>
                          (itemUserCounts[item.id] !== undefined
                            ? itemUserCounts[item.id]
                            : item.user_count || 0) === 0
                      ).length > 0
                        ? "bg-red-50"
                        : "bg-gray-50"
                        }`}
                    >
                      {levelItems.filter(
                        (item) =>
                          (itemUserCounts[item.id] !== undefined
                            ? itemUserCounts[item.id]
                            : item.user_count || 0) === 0
                      ).length > 0 ? (
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
          {/* Dynamic Filters - District context (no district filter needed) */}
          <div className="bg-white rounded-xl shadow-md p-3 mb-1">
            <div
              className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-${Math.min(
                visibleFilters.length + 3,
                8
              )} gap-4`}
            >
              {/* District Filter - Always shown and disabled (current context) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District
                </label>
                <input
                  type="text"
                  value={districtInfo.districtName}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Dynamic Filter Dropdowns - Based on hierarchy */}
              {visibleFilters.map((filterLevel, index) => {
                const filterData = dynamicFilterData[filterLevel] || [];
                const selectedId = selectedFilters[filterLevel] || 0;

                // Get the previous level to determine if this filter should be enabled
                const previousLevel =
                  index > 0 ? visibleFilters[index - 1] : null;
                const isPreviousSelected =
                  !previousLevel ||
                  (selectedFilters[previousLevel] &&
                    selectedFilters[previousLevel] > 0);

                return (
                  <div key={filterLevel}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {filterLevel}
                    </label>
                    <select
                      value={selectedId}
                      onChange={(e) =>
                        handleFilterChange(filterLevel, Number(e.target.value))
                      }
                      disabled={!isPreviousSelected}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value={0}>All {filterLevel}s</option>
                      {filterData.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.displayName || item.location_name || item.name}
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
                  disabled={
                    Object.values(selectedFilters).every((v) => v === 0) &&
                    !searchTerm &&
                    !selectedLevelFilter
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
                              // Get the actual parent level name from first item's parent info
                              if (paginatedItems.length > 0) {
                                const firstItem = paginatedItems[0];
                                const parentId =
                                  firstItem.parentId || firstItem.parent_id;
                                const parent = parentId
                                  ? parentInfo[parentId]
                                  : null;

                                if (parent && parent.levelName) {
                                  return parent.levelName;
                                }

                                // Try to get parent level from item's parentLevelType
                                if (firstItem.parentLevelType) {
                                  return firstItem.parentLevelType;
                                }
                              }

                              // Determine parent level based on current level in hierarchy
                              const currentLevelIndex =
                                hierarchyOrder.indexOf(levelName);
                              if (currentLevelIndex > 0) {
                                return hierarchyOrder[currentLevelIndex - 1];
                              }

                              // Fallback to last visible filter
                              return (
                                visibleFilters[visibleFilters.length - 1] ||
                                "Parent"
                              );
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
                                    const parentId =
                                      item.parentId || item.parent_id;
                                    const parent = parentId
                                      ? parentInfo[parentId]
                                      : null;

                                    if (parent) {
                                      return (
                                        parent.displayName ||
                                        parent.levelName ||
                                        "N/A"
                                      );
                                    }

                                    // Try to get parent name from item's parentLevelName first
                                    if (item.parentLevelName) {
                                      return item.parentLevelName;
                                    }

                                    // Determine the correct parent level based on current level position in hierarchy
                                    const currentLevelIndex =
                                      hierarchyOrder.indexOf(levelName);
                                    if (currentLevelIndex > 0) {
                                      const parentLevelName =
                                        hierarchyOrder[currentLevelIndex - 1];
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
                                  {![
                                    "Block",
                                    "Mandal",
                                    "PollingCenter",
                                    "Booth",
                                  ].includes(levelName) && (
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
                                    {item.partyLevelDisplayName ||
                                      displayLevelName}
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
                                  {itemUserCounts[item.id] !== undefined
                                    ? itemUserCounts[item.id]
                                    : item.user_count || 0}
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
                                const parentId =
                                  item.parentId || item.parent_id;
                                const parent = parentId
                                  ? parentInfo[parentId]
                                  : null;

                                if (parent) {
                                  return parent.displayName || parent.levelName;
                                }

                                // Try parentLevelName if available
                                if (item.parentLevelName) {
                                  return item.parentLevelName;
                                }

                                // Fallback to hierarchy-based approach
                                if (visibleFilters.length > 0) {
                                  const parentLevel =
                                    visibleFilters[
                                      visibleFilters.length - 1
                                    ].toLowerCase();
                                  const parentKey = `${parentLevel}Name`;
                                  return item[parentKey];
                                }

                                // Last resort: try common parent fields
                                return (
                                  item.pollingCenterName ||
                                  item.mandalName ||
                                  item.blockName ||
                                  item.wardName ||
                                  item.zoneName ||
                                  "N/A"
                                );
                              })()}
                              parentLocationType={(() => {
                                // Try to get parent type from parentInfo first
                                const parentId =
                                  item.parentId || item.parent_id;
                                const parent = parentId
                                  ? parentInfo[parentId]
                                  : null;

                                if (parent) {
                                  return parent.levelName;
                                }

                                // Try parentLevelType if available
                                if (item.parentLevelType) {
                                  return item.parentLevelType;
                                }

                                // Fallback to hierarchy-based approach
                                if (visibleFilters.length > 0) {
                                  return visibleFilters[
                                    visibleFilters.length - 1
                                  ];
                                }

                                // Last resort: try to determine from available fields
                                if (item.pollingCenterName)
                                  return "PollingCenter";
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
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
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
                            {Math.min(
                              currentPage * itemsPerPage,
                              filteredLevelItems.length
                            )}
                          </span>{" "}
                          of{" "}
                          <span className="font-medium">
                            {filteredLevelItems.length}
                          </span>{" "}
                          results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() =>
                              setCurrentPage(Math.max(1, currentPage - 1))
                            }
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
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
                            }
                          )}
                          <button
                            onClick={() =>
                              setCurrentPage(
                                Math.min(totalPages, currentPage + 1)
                              )
                            }
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
    </>
  );
}
