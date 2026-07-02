import React, { useState, useEffect } from "react";
import { useGetSidebarLevelsQuery } from "../store/api/partyWiseLevelApi";
import { useGetDynamicLevelDataQuery } from "../store/api/dynamicLevelApi";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import InlineUserDisplay from "./InlineUserDisplay";
import { useTranslation } from "react-i18next";

interface DistrictDynamicLevelListProps {
  levelName: string;
  displayLevelName: string;
  parentLevelName?: string;
}

// Configuration constants - easily configurable
const CONFIG = {
  PAGINATION_LIMIT: 50,
  ITEMS_PER_PAGE: 20,
  DEFAULT_FILTER_SLICE_START: 2, // Start from "Assembly" in hierarchy (skip State, District)
  DEFAULT_FILTER_SLICE_END: 6,   // End at reasonable limit for filter display
};

export default function DistrictDynamicLevelList({
  levelName,
  displayLevelName,
}: DistrictDynamicLevelListProps) {
  const {t} = useTranslation();
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
  // Client-side all items for filtering and search
  const [allItemsForFilter, setAllItemsForFilter] = useState<any[]>([]);
  const [isLoadingAllItems, setIsLoadingAllItems] = useState(false);
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

  const [levelNameDisplayMap, setLevelNameDisplayMap] = useState<Record<string, string>>({
    State: "State",
    District: "District",
    Assembly: "Assembly",
  });

  const getLevelDisplayName = (level: string) =>
    levelNameDisplayMap[level] || level;

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
    setAllItemsForFilter([]);
  }, [levelName]);

  // // Function to reset all filters manually
  // const resetAllFilters = () => {
  //   setSearchTerm("");
  //   setSelectedFilters({});
  //   setSelectedLevelFilter("");
  //   setCurrentPage(1);
  //   setShowItemsWithoutUsers(false);
  // };

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
      const displayMap: Record<string, string> = {
        State: "State",
        District: "District",
        Assembly: "Assembly",
      };

      // Add levels from API response in order
      sidebarLevels.forEach((level: any) => {
        if (level.level_name && !apiHierarchy.includes(level.level_name)) {
          apiHierarchy.push(level.level_name);
        }
        if (level.level_name) {
          displayMap[level.level_name] = level.display_level_name || level.level_name;
        }
      });

      setHierarchyOrder(apiHierarchy);
      setLevelNameDisplayMap(displayMap);
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

  const fetchAllItemsForFilter = async () => {
    if (
      isLoadingAllItems ||
      !partyId ||
      !levelName ||
      !districtInfo.stateId ||
      !districtInfo.districtId
    ) {
      return;
    }

    setIsLoadingAllItems(true);
    try {
      const allItems: any[] = [];
      let page = 1;
      const limit = 5000; // use a large limit to minimize API calls on card click
      let totalPages = 1;
      const baseUrl = `${import.meta.env.VITE_API_BASE_URL}/api/v2/dash/dynamicLevelV2/${districtInfo.stateId || stateId}`;

      while (page <= totalPages) {
        const url = new URL(baseUrl);
        url.searchParams.append("partyId", String(partyId));
        url.searchParams.append("levelName", levelName);
        url.searchParams.append("page", String(page));
        url.searchParams.append("limit", String(limit));

        if (districtInfo.districtId) {
          url.searchParams.append("districtId", String(districtInfo.districtId));
        }
        if (selectedFilters["Assembly"]) {
          url.searchParams.append("assemblyId", String(selectedFilters["Assembly"]));
        }
        if (afterAssemblyIdForQuery) {
          url.searchParams.append("afterAssemblyId", String(afterAssemblyIdForQuery));
        }

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
          },
        });
        const data = await response.json();

        const pageItems =
          data?.data?.items?.filter((item: any) => item.itemLevelType === levelName) || [];

        const mappedPageItems = pageItems.map((item: any) => ({
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
        allItems.push(...mappedPageItems);

        const responseTotalPages =
          data?.pagination?.totalPages || data?.data?.pagination?.totalPages;
        if (responseTotalPages) {
          totalPages = responseTotalPages;
        } else {
          totalPages = page;
        }

        page += 1;
      }

      setAllItemsForFilter(allItems);
    } catch (error) {
      console.error("Error fetching all items for filter:", error);
    } finally {
      setIsLoadingAllItems(false);
    }
  };

  const getCurrentLevelItems = () => {
    const useAllItems =
      showItemsWithoutUsers ||
      showItemsWithUsers ||
      (searchTerm.trim().length > 0 && allItemsForFilter.length > 0);
    let filteredItems = useAllItems ? allItemsForFilter : allLevelItems;

    if (filteredItems.length === 0) {
      return [];
    }

    const hasApiFilters = Object.keys(selectedFilters).some(
      (key) => selectedFilters[key] && selectedFilters[key] > 0
    );

    if (hasApiFilters && !useAllItems) {
      return filteredItems;
    }

    const itemsWithParentInfo = filteredItems.filter(
      (item) => item.assemblyId || item.districtId || item.parentId
    );

    if (itemsWithParentInfo.length === 0) {
      return filteredItems;
    }

    visibleFilters.forEach((filterLevel) => {
      const selectedIdForFilter = selectedFilters[filterLevel];
      if (selectedIdForFilter && selectedIdForFilter > 0) {
        filteredItems = filteredItems.filter((item) => {
          if (filterLevel === "Assembly") {
            return (
              item.assemblyId === selectedIdForFilter ||
              (item.parentChain && item.parentChain["Assembly"] === selectedIdForFilter)
            );
          }

          if (filterLevel === "District") {
            return (
              item.districtId === selectedIdForFilter ||
              (item.parentChain && item.parentChain["District"] === selectedIdForFilter)
            );
          }

          if (item.parentLevelId === selectedIdForFilter) return true;
          if (item.parentChain && item.parentChain[filterLevel] === selectedIdForFilter) {
            return true;
          }

          const levelKey = filterLevel.toLowerCase();
          if (item[`${levelKey}Id`] === selectedIdForFilter) return true;
          if (item[`${levelKey}_id`] === selectedIdForFilter) return true;

          if (filterLevel !== "Assembly" && filterLevel !== "District") {
            const selectedAssemblyId = selectedFilters["Assembly"];
            if (
              selectedAssemblyId &&
              item.parentChain &&
              item.parentChain["Assembly"] !== selectedAssemblyId
            ) {
              return false;
            }

            if (
              item.parentLevelType === filterLevel &&
              item.parentLevelId === selectedIdForFilter
            ) {
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

  // Initialize user counts from API data (userCount already provided by dynamicLevelV2)
  useEffect(() => {
    if (allLevelItems.length > 0) {
      const userCounts: Record<number, number> = {};
      allLevelItems.forEach((item) => {
        userCounts[item.id] = item.user_count || 0;
      });
      setItemUserCounts(userCounts);
    } else {
      setItemUserCounts({});
    }
  }, [allLevelItems]);

  const getAfterAssemblyIdForQuery = () => {
    const assemblyIndex = hierarchyOrder.indexOf("Assembly");
    const currentLevelIndex = hierarchyOrder.indexOf(levelName);
    for (let i = currentLevelIndex - 1; i > assemblyIndex; i--) {
      const filterLevel = hierarchyOrder[i];
      if (selectedFilters[filterLevel] && selectedFilters[filterLevel] > 0) {
        return selectedFilters[filterLevel];
      }
    }
    return undefined;
  };

  const afterAssemblyIdForQuery = getAfterAssemblyIdForQuery();

  const {
    data: dynamicLevelData,
    isLoading: isDynamicLevelLoading,
    isFetching: isDynamicLevelFetching,
  } = useGetDynamicLevelDataQuery(
    {
      stateId: districtInfo.stateId || stateId,
      partyId,
      levelName,
      districtId: districtInfo.districtId,
      assemblyId: selectedFilters["Assembly"],
      afterAssemblyId: afterAssemblyIdForQuery,
      page: currentPage,
      limit: itemsPerPage,
    },
    {
      skip:
        !partyId ||
        !districtInfo.stateId ||
        !districtInfo.districtId ||
        !levelName,
    }
  );

  useEffect(() => {
    setIsLoading(isDynamicLevelLoading || isDynamicLevelFetching);
  }, [isDynamicLevelLoading, isDynamicLevelFetching]);

  useEffect(() => {
    if (!dynamicLevelData) return;

    const newDynamicFilterData: Record<string, any[]> = {};

    if (dynamicLevelData.assemblyList && dynamicLevelData.assemblyList.length > 0) {
      newDynamicFilterData["Assembly"] = dynamicLevelData.assemblyList.map(
        (a) => ({
          id: a.id,
          displayName: a.levelName,
          levelName: "Assembly",
          ParentId: a.ParentId,
        })
      );
    }

    if (dynamicLevelData.districtList && dynamicLevelData.districtList.length > 0) {
      newDynamicFilterData["District"] = dynamicLevelData.districtList.map(
        (d) => ({
          id: d.id,
          displayName: d.levelName,
          levelName: "District",
          ParentId: d.ParentId,
        })
      );
    }

    if (
      dynamicLevelData.hierarchicalList &&
      dynamicLevelData.hierarchicalList.length > 0
    ) {
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

  useEffect(() => {
    if (!dynamicLevelData?.items) {
      setAllLevelItems([]);
      return;
    }

    const currentLevelItems = dynamicLevelData.items.filter(
      (item) => item.itemLevelType === levelName
    );

    const mappedItems = currentLevelItems.map((item) => ({
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

    setAllLevelItems(mappedItems);
  }, [dynamicLevelData, levelName]);

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
      setShowItemsWithUsers(false); // Disable the other filter
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

  const totalItemsCount =
    dynamicLevelData?.pagination?.total ||
    dynamicLevelData?.metaData?.totalItems ||
    levelItems.length;

  const totalUsersCount =
    dynamicLevelData?.metaData?.totalUsers ||
    levelItems.reduce(
      (sum, item) =>
        sum +
        (itemUserCounts[item.id] !== undefined
          ? itemUserCounts[item.id]
          : item.user_count || 0),
      0
    );

  const totalWithoutUsersCount =
    dynamicLevelData?.metaData?.levelWithoutUsers ||
    levelItems.filter(
      (item) =>
        (itemUserCounts[item.id] !== undefined
          ? itemUserCounts[item.id]
          : item.user_count || 0) === 0
    ).length;

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

  const useClientSidePagination =
    showItemsWithoutUsers ||
    showItemsWithUsers ||
    selectedLevelFilter !== "" ||
    (searchTerm.trim().length > 0 && allItemsForFilter.length > 0);

  const totalPages = useClientSidePagination
    ? Math.ceil(filteredLevelItems.length / itemsPerPage)
    : dynamicLevelData?.pagination?.totalPages || Math.ceil(filteredLevelItems.length / itemsPerPage);

  const totalCount = useClientSidePagination
    ? filteredLevelItems.length
    : dynamicLevelData?.pagination?.total || filteredLevelItems.length;

  const paginatedItems = useClientSidePagination
    ? filteredLevelItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : filteredLevelItems;

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
      <div className="min-h-screen bg-gradient-to-br bg-[var(--bg-card)] p-1">
        <div className="w-full mx-auto">
          {/* Header with Stats Cards */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-3 mb-1 text-[var(--text-color)]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="shrink-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  {displayLevelName} {t("DistrictDynamic.List")}
                </h1>
                <p className="text-blue-100 mt-1 text-xs sm:text-sm">
                  {getLevelDisplayName("District")} : {districtInfo.districtName} | {getLevelDisplayName("State")} : {districtInfo.stateName}
                </p>
              </div>

              <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                  {/* Total Items Card */}
                  <div className="bg-[var(--bg-card)] text-[var(--text-color)] rounded-md shadow-md p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[var(--text-secondary)]">
                        {t("DistrictDynamic.Total")} {displayLevelName}s
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
                    className={`bg-[var(--bg-card)] text-[var(--text-color)] rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${
                      totalUsersCount > 0
                        ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-green-50"
                        : "cursor-default"
                    } ${
                      showItemsWithUsers
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
                        {t("DistrictDynamic.Total_Users")}
                        {showItemsWithUsers && (
                          <span className="ml-2 text-green-600 font-semibold">
                            {t("DistrictDynamic.Filtered")}
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
                    className={`bg-[var(--bg-card)] text-[var(--text-color)] rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${
                      totalWithoutUsersCount > 0
                        ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-red-50"
                        : "cursor-default"
                    } ${
                      showItemsWithoutUsers
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
                        {displayLevelName}{t("DistrictDynamic.Without_Users")}
                        {showItemsWithoutUsers && (
                          <span className="ml-2 text-red-600 font-semibold">
                            {t("DistrictDynamic.Filtered")}
                          </span>
                        )}
                      </p>
                      <p
                        className={`text-xl sm:text-2xl font-semibold mt-1 ${
                          totalWithoutUsersCount > 0
                            ? "text-red-600"
                            : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {totalWithoutUsersCount}
                      </p>
                    </div>
                    <div
                      className={`rounded-full p-1.5 ${
                        totalWithoutUsersCount > 0
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
          {/* Dynamic Filters - District context (no district filter needed) */}
          <div className="bg-[var(--bg-card)] rounded-xl shadow-md p-3 mb-1">
            <div
              className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-${Math.min(
                visibleFilters.length + 3,
                8
              )} gap-4`}
            >
              {/* District Filter - Always shown and disabled (current context) */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {getLevelDisplayName("District")}
                </label>
                <input
                  type="text"
                  value={districtInfo.districtName}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-[var(--text-secondary)] cursor-not-allowed"
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
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      {getLevelDisplayName(filterLevel)}
                    </label>
                    <select
                      value={selectedId}
                      onChange={(e) =>
                        handleFilterChange(filterLevel, Number(e.target.value))
                      }
                      disabled={!isPreviousSelected}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value={0}>All {getLevelDisplayName(filterLevel)}s</option>
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
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {t("DistrictDynamic.Filter_by")} {displayLevelName}
                </label>
                <select
                  value={selectedLevelFilter}
                  onChange={(e) => {
                    setSelectedLevelFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t("DistrictDynamic.All")} {displayLevelName}s</option>
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
                  {t("DistrictDynamic.Search")} {displayLevelName}s
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
                  {t("DistrictDynamic.No")} {displayLevelName.toLowerCase()}{t("DistrictDynamic.s_found")}
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
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r text-[var(--text-color)] sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                          {t("DistrictDynamic.S_No")}
                        </th>
                        {/* Dynamic parent level column */}
                        {visibleFilters.length > 0 && (
                          <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
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
                                  return getLevelDisplayName(parent.levelName);
                                }

                                // Try to get parent level from item's parentLevelType
                                if (firstItem.parentLevelType) {
                                  return getLevelDisplayName(
                                    firstItem.parentLevelType
                                  );
                                }
                              }

                              // Determine parent level based on current level in hierarchy
                              const currentLevelIndex =
                                hierarchyOrder.indexOf(levelName);
                              if (currentLevelIndex > 0) {
                                return getLevelDisplayName(
                                  hierarchyOrder[currentLevelIndex - 1]
                                );
                              }

                              // Fallback to last visible filter
                              return getLevelDisplayName(
                                visibleFilters[visibleFilters.length - 1] ||
                                  "Parent"
                              );
                            })()}
                          </th>
                        )}
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                          {t("DistrictDynamic.Level_Type")}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                          {displayLevelName} {t("DistrictDynamic.Name")}
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                          {t("DistrictDynamic.Total_Users")} 
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[var(--bg-card)] divide-y divide-gray-200">
                      {paginatedItems.map((item, index) => (
                        <React.Fragment key={item.id}>
                          <tr className="hover:bg-blue-50 dark:hover:bg-[var(--bg-card)]/5 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
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
                                  <p className="text-sm font-semibold text-[var(--text-color)]">
                                    {item.displayName}
                                  </p>
                                  <p className="text-xs text-[var(--text-secondary)]">
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
                                  className={`inline-flex items-center p-1 rounded-md transition-colors mr-2 ${
                                    expandedItemId === item.id
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
                  <div className="bg-[var(--bg-card)] px-4 py-3 flex items-center justify-between border-t border-[var(--border-color)] sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("DistrictDynamic.Previous")}
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("DistrictDynamic.Next")}
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {t("DistrictDynamic.Showing")}{" "}
                          <span className="font-medium">
                            {(currentPage - 1) * itemsPerPage + 1}
                          </span>{" "}
                          {t("DistrictDynamic.to")}{" "}
                          <span className="font-medium">
                            {Math.min(
                              currentPage * itemsPerPage,
                              totalCount
                            )}
                          </span>{" "}
                          {t("DistrictDynamic.of")}{" "}
                          <span className="font-medium">
                            {totalCount}
                          </span>{" "}
                          {t("DistrictDynamic.results")}
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() =>
                              setCurrentPage(Math.max(1, currentPage - 1))
                            }
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-[var(--bg-card)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t("DistrictDynamic.Previous")}
                          </button>
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              const pageNum = i + 1;
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === pageNum
                                      ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                      : "bg-[var(--bg-card)] border-gray-300 text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5"
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
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-[var(--bg-card)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t("DistrictDynamic.Next")}
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



