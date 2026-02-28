import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import { useGetStateLevelDashboardQuery } from "../../../store/api/stateMasterApi";
import type { DistrictChild } from "../../../store/api/stateMasterApi";
import HierarchyTable from "../../../components/HierarchyTable";
import type { HierarchyChild, HierarchyUser } from "../../../types/hierarchy";

export default function StateDistricts() {
  const navigate = useNavigate();
  const { user, selectedAssignment } = useAppSelector((s) => s.auth);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<"location_name" | "total_users" | "active_users">("location_name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [showDistrictsWithoutUsers, setShowDistrictsWithoutUsers] = useState(false);
  const [showAssignedUsers, setShowAssignedUsers] = useState(false);

  const stateId = user?.state_id || selectedAssignment?.stateMasterData_id || 0;
  const stateName = selectedAssignment?.levelName || "";

  // Fetch data using Redux
  const { data: dashboardData, isLoading: loading, error } = useGetStateLevelDashboardQuery({
    state_id: stateId,
    districtId: selectedDistrictId ? parseInt(selectedDistrictId) : undefined,
    page: currentPage,
    limit: 10,
    sort_by: sortBy,
    order: order,
    search: searchInput,
  }, {
    skip: !stateId,
  });

  const data = dashboardData?.data?.data?.children || [];
  const allDistricts = dashboardData?.data?.districtList || [];
  const totalChildren = dashboardData?.data?.pagination?.total || 0;
  const parentName = dashboardData?.data?.data?.parent?.location_name || "";
  const totalCount = dashboardData?.data?.totalCount;

  // Transform DistrictChild[] to HierarchyChild[]
  const transformedData: HierarchyChild[] = data.map((district: DistrictChild) => ({
    location_id: district.location_id,
    location_name: district.location_name,
    location_type: district.location_type as HierarchyChild["location_type"],
    parent_id: district.parent_id,
    total_users: district.total_users,
    active_users: district.active_users,
    users: district.users.map((user): HierarchyUser => ({
      districtName: district.location_name,
      assignment_id: user.assignment_id,
      user_id: user.user_id,
      user_name: user.user_name,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      mobile_number: user.mobile_number,
      party: user.party,
      party_name: user.party?.party_name || "",
      user_state: "",
      user_district: district.location_name,
      party_id: user.party?.party_id || 0,
      is_active: user.is_active,
      assignment_active: user.assignment_active,
      assigned_at: user.assigned_at,
      assignment_updated_at: user.assignment_updated_at,
      user_created_at: user.user_created_at,
      role_name: user.role_name || "",
      user_active: user.user_active,
    })),
  }));

  // Handle district selection
  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    setShowDistrictsWithoutUsers(false);
    setShowAssignedUsers(false);
    setCurrentPage(1);
  };

  // Handle districts without users filter
  const handleDistrictsWithoutUsersClick = () => {
    const districtsWithoutUsers = totalCount?.districtWithoutUserCount || 0;
    if (districtsWithoutUsers > 0) {
      const newValue = !showDistrictsWithoutUsers;
      setShowDistrictsWithoutUsers(newValue);
      
      if (newValue) {
        setShowAssignedUsers(false);
        setSelectedDistrictId("");
      }
      
      setCurrentPage(1);
    }
  };

  const handleAssignedUsersClick = () => {
    const totalUsers = totalCount?.userCount || 0;
    if (totalUsers > 0) {
      const newValue = !showAssignedUsers;
      setShowAssignedUsers(newValue);
      
      if (newValue) {
        setShowDistrictsWithoutUsers(false);
        setSelectedDistrictId("");
      }
      
      setCurrentPage(1);
    }
  };

  const handleSort = (
    newSortBy: "location_name" | "total_users" | "active_users",
    newOrder: "asc" | "desc"
  ) => {
    setSortBy(newSortBy);
    setOrder(newOrder);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Memoized filtered data
  const { paginatedData, filteredTotal } = useMemo(() => {
    if (showDistrictsWithoutUsers) {
      const filtered = transformedData.filter((item) => item.total_users === 0);
      return {
        paginatedData: filtered,
        filteredTotal: filtered.length,
      };
    } else if (showAssignedUsers) {
      const filtered = transformedData.filter((item) => item.total_users > 0);
      return {
        paginatedData: filtered,
        filteredTotal: filtered.length,
      };
    } else {
      return {
        paginatedData: transformedData,
        filteredTotal: totalChildren,
      };
    }
  }, [showDistrictsWithoutUsers, showAssignedUsers, transformedData, totalChildren]);

  // Calculate summary statistics
  const totalUsers = totalCount?.userCount || 0;
  const districtsWithoutUsers = totalCount?.districtWithoutUserCount || 0;

  const handleAssignUsers = (districtId: string, districtName: string) => {
    navigate(
      `/state/districts/assign?districtId=${districtId}&districtName=${encodeURIComponent(
        districtName
      )}&stateId=${stateId}`
    );
  };

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

            {/* Total Users Card - Clickable */}
            <div 
              onClick={handleAssignedUsersClick}
              className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${
                totalUsers > 0 
                  ? 'cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-green-50' 
                  : 'cursor-default'
              } ${
                showAssignedUsers 
                  ? 'ring-2 ring-green-500 bg-green-50' 
                  : ''
              }`}
              title={totalUsers > 0 ? "Click to view districts with assigned users" : "No assigned users"}
            >
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Total Users
                  {showAssignedUsers && (
                    <span className="ml-2 text-green-600 font-semibold">(Filtered)</span>
                  )}
                </p>
                <p className={`text-xl sm:text-2xl font-semibold mt-1 ${totalUsers > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {formatNumber(totalUsers)}
                </p>
              </div>
              <div className={`rounded-full p-1.5 ${totalUsers > 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>

            {/* Districts Without Users Card - Clickable */}
            <div 
              onClick={handleDistrictsWithoutUsersClick}
              className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${
                districtsWithoutUsers > 0 
                  ? 'cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-red-50' 
                  : 'cursor-default'
              } ${
                showDistrictsWithoutUsers 
                  ? 'ring-2 ring-red-500 bg-red-50' 
                  : ''
              }`}
              title={districtsWithoutUsers > 0 ? "Click to view districts without users" : "No districts without users"}
            >
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Districts Without Users
                  {showDistrictsWithoutUsers && (
                    <span className="ml-2 text-red-600 font-semibold">(Filtered)</span>
                  )}
                </p>
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
        error={error ? "Failed to load districts" : null}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onSort={handleSort}
        onPageChange={handlePageChange}
        currentPage={currentPage}
        totalItems={filteredTotal}
        itemsPerPage={10}
        title="District List"
        emptyMessage="No districts found for this state"
        stateName={stateName || parentName}
        districts={allDistricts.map((d): HierarchyChild => ({
          location_id: d.id,
          location_name: d.levelName,
          location_type: d.levelType as HierarchyChild["location_type"],
          parent_id: d.ParentId,
          total_users: 0,
          active_users: 0,
          users: []
        }))}
        selectedDistrict={selectedDistrictId}
        onDistrictChange={handleDistrictChange}
        onAssignUsers={handleAssignUsers}
        showAssignButton={true}
        hideHeader={true}
        hideActiveUsersColumn={true}
      />
    </div>
  );
}
