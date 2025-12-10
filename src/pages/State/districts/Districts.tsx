import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useHierarchyData } from "../../../hooks/useHierarchyData";
import HierarchyTable from "../../../components/HierarchyTable";
import { fetchHierarchyChildren } from "../../../services/hierarchyApi";
import type { HierarchyChild } from "../../../types/hierarchy";

export default function StateDistricts() {
  const navigate = useNavigate();
  const [stateId, setStateId] = useState<number | null>(null);
  const [stateName, setStateName] = useState<string>("");
  const [districts, setDistricts] = useState<HierarchyChild[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [allDistricts, setAllDistricts] = useState<HierarchyChild[]>([]);
  const [localPage, setLocalPage] = useState(1);

  // Get state info from localStorage
  useEffect(() => {
    try {
      const authState = localStorage.getItem("auth_state");
      if (authState) {
        const parsed = JSON.parse(authState);
        const selectedAssignment = parsed.selectedAssignment;

        if (selectedAssignment && selectedAssignment.levelType === "State") {
          setStateId(selectedAssignment.stateMasterData_id);
          setStateName(selectedAssignment.levelName);
        }
      }
    } catch (err) {
      console.error("Error reading state info:", err);
    }
  }, []);

  // Fetch all districts for dropdown and filtering
  useEffect(() => {
    const loadDistricts = async () => {
      if (!stateId) return;

      try {
        const response = await fetchHierarchyChildren(stateId, {
          page: 1,
          limit: 1000, // Get all districts
        });

        if (response.success) {
          setDistricts(response.data.children);
          setAllDistricts(response.data.children);
        }
      } catch (err) {
        console.error("Error fetching districts:", err);
      }
    };

    loadDistricts();
  }, [stateId]);

  const {
    data,
    loading,
    error,
    totalChildren,
    parentName,
    setPage,
    setSearchInput,
    searchInput,
    setSortBy,
    setOrder,
    currentPage,
  } = useHierarchyData(stateId, 10);

  const handleAssignUsers = (districtId: string, districtName: string) => {
    navigate(
      `/state/districts/assign?districtId=${districtId}&districtName=${encodeURIComponent(
        districtName
      )}&stateId=${stateId}`
    );
  };

  // Handle district selection
  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    setLocalPage(1); // Reset to page 1 when filter changes
  };

  const handleSort = (
    sortBy: "location_name" | "total_users" | "active_users",
    order: "asc" | "desc"
  ) => {
    setSortBy(sortBy);
    setOrder(order);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (selectedDistrictId) {
      setLocalPage(page);
    } else {
      setPage(page);
    }
  };

  // Memoized filtered and paginated data
  const { paginatedData, filteredTotal, currentPageToUse } = useMemo(() => {
    if (selectedDistrictId) {
      // When filtering, use all districts and apply client-side pagination
      const filtered = allDistricts.filter((item) =>
        item.location_id.toString() === selectedDistrictId
      );

      const itemsPerPage = 10;
      const startIndex = (localPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginated = filtered.slice(startIndex, endIndex);

      return {
        paginatedData: paginated,
        filteredTotal: filtered.length,
        currentPageToUse: localPage
      };
    } else {
      // When not filtering, use server-side pagination
      return {
        paginatedData: data,
        filteredTotal: totalChildren,
        currentPageToUse: currentPage
      };
    }
  }, [selectedDistrictId, allDistricts, data, totalChildren, localPage, currentPage]);

  // Calculate summary statistics from all districts (not just current page)
  const totalUsers = districts.reduce((sum, district) => sum + district.total_users, 0);
  const districtsWithoutUsers = districts.filter(district => district.total_users === 0).length;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="p-2 bg-gray-50 min-h-screen">
      {/* Header with Stats Cards */}
      <div className="bg-gradient-to-r from-sky-400 to-sky-500 rounded-lg shadow-lg p-4 sm:p-5 text-white mb-1">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="shrink-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">District List</h1>
            <p className="text-sky-100 mt-1 text-xs sm:text-sm">{stateName || parentName}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            {/* Total Districts Card */}
            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Districts</p>
                <p className="text-xl sm:text-2xl font-semibold mt-1">{formatNumber(totalChildren)}</p>
              </div>
              <div className="bg-blue-50 rounded-full p-1.5">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>

            {/* Total Users Card */}
            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Users</p>
                <p className="text-xl sm:text-2xl font-semibold text-green-600 mt-1">{formatNumber(totalUsers)}</p>
              </div>
              <div className="bg-green-50 rounded-full p-1.5">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>

            {/* Districts Without Users Card */}
            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Districts Without Users</p>
                <p className={`text-xl sm:text-2xl font-semibold mt-1 ${districtsWithoutUsers > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {formatNumber(districtsWithoutUsers)}
                </p>
              </div>
              <div className={`rounded-full p-1.5 ${districtsWithoutUsers > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                {districtsWithoutUsers > 0 ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <HierarchyTable
        data={paginatedData}
        loading={loading}
        error={error}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onSort={handleSort}
        onPageChange={handlePageChange}
        currentPage={currentPageToUse}
        totalItems={filteredTotal}
        itemsPerPage={10}
        title="District List"
        emptyMessage="No districts found for this state"
        stateName={stateName || parentName}
        districts={districts}
        selectedDistrict={selectedDistrictId}
        onDistrictChange={handleDistrictChange}
        onAssignUsers={handleAssignUsers}
        showAssignButton={true}
        hideHeader={true}
      />
    </div>
  );
}
