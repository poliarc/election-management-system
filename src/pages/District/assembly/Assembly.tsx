import { useEffect, useState, useMemo } from "react";
import { useGetAssemblyLevelDashboardQuery } from "../../../store/api/stateMasterApi";
import type { AssemblyItem } from "../../../store/api/stateMasterApi";
import HierarchyTable from "../../../components/HierarchyTable";
import { useNavigate } from "react-router-dom";
import type { EnhancedHierarchyChild } from "../../../types/hierarchy";

export default function DistrictAssembly() {
  const navigate = useNavigate();
  const [stateId, setStateId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [stateName, setStateName] = useState<string>("");
  const [districtName, setDistrictName] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showAssembliesWithoutUsers, setShowAssembliesWithoutUsers] = useState(false);
  const [showAssignedUsers, setShowAssignedUsers] = useState(false);

  useEffect(() => {
    try {
      const authStateRaw = localStorage.getItem("auth_state");
      if (authStateRaw) {
        const parsed = JSON.parse(authStateRaw);
        const selectedAssignment = parsed?.selectedAssignment;
        if (selectedAssignment && selectedAssignment.levelType === "District") {
          setDistrictId(selectedAssignment.stateMasterData_id);
          setDistrictName(selectedAssignment.levelName);
          setStateId(selectedAssignment.parentId);
          setStateName(selectedAssignment.parentLevelName || "");
        }
      }
    } catch (err) {
      console.error("Error reading district info:", err);
    }
  }, []);

  const shouldFetchAll = showAssembliesWithoutUsers || showAssignedUsers;
  
  const { data: dashboardData, isLoading: loading, error } = useGetAssemblyLevelDashboardQuery(
    {
      state_id: stateId!,
      districtId: districtId || undefined,
      page: shouldFetchAll ? 1 : currentPage,
      limit: shouldFetchAll ? 1000 : 25,
      search: searchInput,
    },
    {
      skip: !stateId || !districtId,
    }
  );

  const metaData = dashboardData?.data?.metaData;
  const pagination = dashboardData?.data?.pagination;
  const assembliesData = dashboardData?.data?.assemblies || [];

  const transformedData: EnhancedHierarchyChild[] = useMemo(() => {
    return assembliesData.map((assembly: AssemblyItem) => ({
      location_id: assembly.assemblyId,
      location_name: assembly.assemblyName,
      location_type: "Assembly" as const,
      parent_id: assembly.districtId,
      total_users: assembly.userCount,
      active_users: assembly.activeUserCount,
      district_id: assembly.districtId,
      district_name: assembly.districtName,
      has_users: assembly.userCount > 0,
      users: assembly.users.map((user) => ({
        districtName: assembly.districtName,
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
        user_district: assembly.districtName,
        party_id: user.party?.party_id || 0,
        is_active: user.is_active,
        assignment_active: user.assignment_active,
        assigned_at: user.assigned_at,
        assignment_updated_at: user.assignment_updated_at,
        user_created_at: user.assigned_at,
        role_name: user.role_name || "",
        user_active: user.user_active,
      })),
    }));
  }, [assembliesData]);

  const filteredData = useMemo(() => {
    let filtered = [...transformedData];
    if (showAssembliesWithoutUsers) {
      filtered = filtered.filter((item) => item.total_users === 0);
    }
    if (showAssignedUsers) {
      filtered = filtered.filter((item) => item.total_users > 0);
    }
    return filtered;
  }, [transformedData, showAssembliesWithoutUsers, showAssignedUsers]);

  const itemsPerPage = 25;
  
  const paginatedData = useMemo(() => {
    if (shouldFetchAll) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredData.slice(startIndex, endIndex);
    }
    return filteredData;
  }, [filteredData, currentPage, itemsPerPage, shouldFetchAll]);
  
  const totalItems = shouldFetchAll ? filteredData.length : (pagination?.total || metaData?.totalAssemblies || 0);
  const currentPageFromAPI = shouldFetchAll ? currentPage : (pagination?.page || currentPage);

  const handleSearchChange = (search: string) => {
    setSearchInput(search);
    setCurrentPage(1);
  };

  const handleAssembliesWithoutUsersClick = () => {
    const assembliesWithoutUsers = metaData?.assembliesWithoutUsers || 0;
    if (assembliesWithoutUsers > 0) {
      const newValue = !showAssembliesWithoutUsers;
      setShowAssembliesWithoutUsers(newValue);
      if (newValue) setShowAssignedUsers(false);
      setCurrentPage(1);
    }
  };

  const handleAssignedUsersClick = () => {
    const totalUsers = metaData?.totalUsers || 0;
    if (totalUsers > 0) {
      const newValue = !showAssignedUsers;
      setShowAssignedUsers(newValue);
      if (newValue) setShowAssembliesWithoutUsers(false);
      setCurrentPage(1);
    }
  };

  const handleSort = (_newSortBy: "location_name" | "total_users" | "active_users", _newOrder: "asc" | "desc") => {
    // Sorting handled by API in future
  };

  const handleAssignUsers = (assemblyId: string, assemblyName: string) => {
    navigate(`/district/assembly/assign?assemblyId=${assemblyId}&assemblyName=${encodeURIComponent(assemblyName)}&stateId=${stateId}`);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const totalAssemblies = metaData?.totalAssemblies || 0;
  const totalUsers = metaData?.totalUsers || 0;
  const assembliesWithoutUsers = metaData?.assembliesWithoutUsers || 0;

  return (
    <div className="p-2 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-sky-400 to-sky-500 rounded-lg shadow-lg p-4 sm:p-5 text-white mb-1">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="shrink-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Assembly List</h1>
            <p className="text-sky-100 mt-1 text-xs sm:text-sm">District: {districtName} | State: {stateName}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Assemblies</p>
                <p className="text-xl sm:text-2xl font-semibold mt-1">{formatNumber(totalAssemblies)}</p>
              </div>
              <div className="bg-blue-50 rounded-full p-1.5">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </div>
            </div>
            <div onClick={handleAssignedUsersClick} className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${totalUsers > 0 ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-green-50" : "cursor-default"} ${showAssignedUsers ? "ring-2 ring-green-500 bg-green-50" : ""}`} title={totalUsers > 0 ? "Click to view assemblies with assigned users" : "No assigned users"}>
              <div>
                <p className="text-xs font-medium text-gray-600">Assigned Users{showAssignedUsers && <span className="ml-2 text-green-600 font-semibold">(Filtered)</span>}</p>
                <p className={`text-xl sm:text-2xl font-semibold mt-1 ${totalUsers > 0 ? "text-green-600" : "text-gray-400"}`}>{formatNumber(totalUsers)}</p>
              </div>
              <div className={`rounded-full p-1.5 ${totalUsers > 0 ? "bg-green-50" : "bg-gray-50"}`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div onClick={handleAssembliesWithoutUsersClick} className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${assembliesWithoutUsers > 0 ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-red-50" : "cursor-default"} ${showAssembliesWithoutUsers ? "ring-2 ring-red-500 bg-red-50" : ""}`} title={assembliesWithoutUsers > 0 ? "Click to view assemblies without users" : "No assemblies without users"}>
              <div>
                <p className="text-xs font-medium text-gray-600">Assemblies Without Users{showAssembliesWithoutUsers && <span className="ml-2 text-red-600 font-semibold">(Filtered)</span>}</p>
                <p className={`text-xl sm:text-2xl font-semibold mt-1 ${assembliesWithoutUsers > 0 ? "text-red-600" : "text-gray-400"}`}>{formatNumber(assembliesWithoutUsers)}</p>
              </div>
              <div className={`rounded-full p-1.5 ${assembliesWithoutUsers > 0 ? "bg-red-50" : "bg-gray-50"}`}>
                {assembliesWithoutUsers > 0 ? (
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
      <HierarchyTable data={paginatedData} loading={loading} error={error ? "Failed to load assemblies" : null} searchInput={searchInput} onSearchChange={handleSearchChange} onSort={handleSort} onPageChange={setCurrentPage} currentPage={currentPageFromAPI} totalItems={totalItems} itemsPerPage={itemsPerPage} title="Assembly List" emptyMessage="No assemblies found" stateName={stateName} districtName={districtName} onAssignUsers={handleAssignUsers} showAssignButton={true} hideHeader={true} hideActiveUsersColumn={true} />
    </div>
  );
}
