import { useEffect, useState, useMemo } from "react";
import { useGetAssemblyLevelDashboardQuery } from "../../../store/api/stateMasterApi";
import type { AssemblyItem } from "../../../store/api/stateMasterApi";
import HierarchyTable from "../../../components/HierarchyTable";
import UploadVotersModal from "../../../components/UploadVotersModal";
import UploadDraftVotersModal from "../../../components/UploadDraftVotersModal";
import * as XLSX from "xlsx";
import type { EnhancedHierarchyChild } from "../../../types/hierarchy";

export default function StateAssembly() {
  const [stateId, setStateId] = useState<number | null>(null);
  const [stateName, setStateName] = useState<string>("");
  const [partyId, setPartyId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedAssembly, setSelectedAssembly] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [selectedDraftAssembly, setSelectedDraftAssembly] = useState<{
    id: number;
    name: string;
    districtId: number | null;
    stateId: number;
    districtName?: string;
  } | null>(null);
  const [draftModalOpen, setDraftModalOpen] = useState(false);

  // Filter and pagination state
  const [searchInput, setSearchInput] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showAssembliesWithoutUsers, setShowAssembliesWithoutUsers] =
    useState(false);
  const [showAssignedUsers, setShowAssignedUsers] = useState(false);

  // Get state info from localStorage
  useEffect(() => {
    try {
      const authStateRaw = localStorage.getItem("auth_state");
      const authUserRaw = localStorage.getItem("auth_user");
      const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
      const parsed = authStateRaw ? JSON.parse(authStateRaw) : null;
      const selectedAssignment = parsed?.selectedAssignment;

      if (selectedAssignment && selectedAssignment.levelType === "State") {
        setStateId(selectedAssignment.stateMasterData_id);
        setStateName(selectedAssignment.levelName);
      }

      const partyFromAssignment =
        selectedAssignment?.party_id || selectedAssignment?.partyId;
      const partyFromState =
        parsed?.selectedParty?.party_id || parsed?.party_id;
      const partyFromUser = parsed?.user?.party_id;
      const partyFromAuthUser = authUser?.partyId || authUser?.party_id;

      setPartyId(
        partyFromAssignment ||
          partyFromState ||
          partyFromUser ||
          partyFromAuthUser ||
          null
      );
    } catch (err) {
      console.error("Error reading state info:", err);
    }
  }, []);

  // Fetch assembly data using Redux with server-side pagination
  // When filters are active, fetch all data for client-side filtering
  const shouldFetchAll = showAssembliesWithoutUsers || showAssignedUsers;
  
  const { data: dashboardData, isLoading: loading, error } = useGetAssemblyLevelDashboardQuery(
    {
      state_id: stateId!,
      districtId: selectedDistrictId ? parseInt(selectedDistrictId) : undefined,
      page: shouldFetchAll ? 1 : currentPage,
      limit: shouldFetchAll ? 1000 : 25, // Fetch all when filtering
      search: searchInput,
    },
    {
      skip: !stateId,
    }
  );

  const metaData = dashboardData?.data?.metaData;
  const pagination = dashboardData?.data?.pagination;
  const districts = dashboardData?.data?.districts || [];
  const assembliesData = dashboardData?.data?.assemblies || [];

  // Transform AssemblyItem[] to EnhancedHierarchyChild[]
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

  // Client-side filtering for "without users" and "assigned users" filters only
  const filteredData = useMemo(() => {
    let filtered = [...transformedData];

    // Apply assemblies without users filter
    if (showAssembliesWithoutUsers) {
      filtered = filtered.filter((item) => item.total_users === 0);
    }

    // Apply assigned users filter
    if (showAssignedUsers) {
      filtered = filtered.filter((item) => item.total_users > 0);
    }

    return filtered;
  }, [transformedData, showAssembliesWithoutUsers, showAssignedUsers]);

  // Pagination - use API pagination data or client-side pagination when filtering
  const itemsPerPage = 25;
  
  // When filters are active, use client-side pagination
  const paginatedData = useMemo(() => {
    if (shouldFetchAll) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredData.slice(startIndex, endIndex);
    }
    return filteredData;
  }, [filteredData, currentPage, itemsPerPage, shouldFetchAll]);
  
  const totalItems = shouldFetchAll 
    ? filteredData.length 
    : (pagination?.total || metaData?.totalAssemblies || 0);
  const currentPageFromAPI = shouldFetchAll ? currentPage : (pagination?.page || currentPage);

  // Handle filter changes
  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    setCurrentPage(1);
  };

  const handleSearchChange = (search: string) => {
    setSearchInput(search);
    setCurrentPage(1);
  };

  const handleAssembliesWithoutUsersClick = () => {
    const assembliesWithoutUsers = metaData?.assembliesWithoutUsers || 0;
    if (assembliesWithoutUsers > 0) {
      const newValue = !showAssembliesWithoutUsers;
      setShowAssembliesWithoutUsers(newValue);
      if (newValue) {
        setShowAssignedUsers(false);
      }
      setCurrentPage(1);
    }
  };

  const handleAssignedUsersClick = () => {
    const totalUsers = metaData?.totalUsers || 0;
    if (totalUsers > 0) {
      const newValue = !showAssignedUsers;
      setShowAssignedUsers(newValue);
      if (newValue) {
        setShowAssembliesWithoutUsers(false);
      }
      setCurrentPage(1);
    }
  };

  const handleSort = (
    _newSortBy: "location_name" | "total_users" | "active_users",
    _newOrder: "asc" | "desc"
  ) => {
    // Note: Sorting should be handled by API in future
    // For now, this is a no-op
  };

  const handleUploadVoters = (assemblyId: number, assemblyName: string) => {
    // Use transformedData instead of filteredData to find assembly
    const assembly = transformedData.find((item) => item.location_id === assemblyId);
    
    if (!assembly) {
      alert("Assembly not found. Please try again.");
      return;
    }

    if (!stateId) {
      alert("State ID is missing. Please refresh the page.");
      return;
    }

    setSelectedAssembly({
      id: assemblyId,
      name: assemblyName,
    });
    setUploadModalOpen(true);
  };

  const handleUploadDraftVoters = (
    assemblyId: number,
    assemblyName: string
  ) => {
    // Use transformedData instead of filteredData to find assembly
    const assembly = transformedData.find((item) => item.location_id === assemblyId);

    if (!assembly) {
      alert("Assembly not found. Please try again.");
      return;
    }

    if (!stateId) {
      alert("State ID is missing. Please refresh the page.");
      return;
    }

    if (!partyId) {
      alert("Party ID is missing. Please refresh or select a party.");
      return;
    }

    setSelectedDraftAssembly({
      id: assemblyId,
      name: assemblyName,
      districtId: assembly.district_id,
      stateId: stateId,
      districtName: assembly.district_name,
    });
    setDraftModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
    setSelectedAssembly(null);
  };

  // Excel export function
  const exportToExcel = () => {
    const excelData = filteredData.map((assembly, index) => ({
      "S.No": index + 1,
      "State Name": stateName || "",
      "District Name": assembly.district_name || "",
      "Assembly Name": assembly.location_name || "",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 8 },
      { wch: 20 },
      { wch: 25 },
      { wch: 30 },
    ];
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Assemblies");

    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `Assembly_List_${stateName.replace(
      /\s+/g,
      "_"
    )}_${currentDate}.xlsx`;

    XLSX.writeFile(wb, filename);
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
      {/* Header with Stats Cards */}
      <div className="bg-gradient-to-r from-sky-400 to-sky-500 rounded-lg shadow-lg p-4 sm:p-5 text-white mb-1">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="shrink-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Assembly List
            </h1>
            <p className="text-sky-100 mt-1 text-xs sm:text-sm">
              {stateName}
            </p>
          </div>

          {/* Excel Export Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={exportToExcel}
              disabled={filteredData.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
              title="Export all assemblies to Excel"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export Excel ({filteredData.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            {/* Total Assemblies Card */}
            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Total Assemblies
                </p>
                <p className="text-xl sm:text-2xl font-semibold mt-1">
                  {formatNumber(totalAssemblies)}
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
                    d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                  />
                </svg>
              </div>
            </div>

            {/* Total Users Card - Clickable */}
            <div 
              onClick={handleAssignedUsersClick}
              className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${
                totalUsers > 0
                  ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-green-50"
                  : "cursor-default"
              } ${
                showAssignedUsers
                  ? "ring-2 ring-green-500 bg-green-50"
                  : ""
              }`}
              title={
                totalUsers > 0
                  ? "Click to view assemblies with assigned users"
                  : "No assigned users"
              }
            >
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Assigned Users
                  {showAssignedUsers && (
                    <span className="ml-2 text-green-600 font-semibold">
                      (Filtered)
                    </span>
                  )}
                </p>
                <p className={`text-xl sm:text-2xl font-semibold mt-1 ${
                  totalUsers > 0 ? "text-green-600" : "text-gray-400"
                }`}>
                  {formatNumber(totalUsers)}
                </p>
              </div>
              <div className={`rounded-full p-1.5 ${
                  totalUsers > 0 ? "bg-green-50" : "bg-gray-50"
                }`}>
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

            {/* Assemblies Without Users Card - Clickable */}
            <div
              onClick={handleAssembliesWithoutUsersClick}
              className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${
                assembliesWithoutUsers > 0
                  ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-red-50"
                  : "cursor-default"
              } ${
                showAssembliesWithoutUsers
                  ? "ring-2 ring-red-500 bg-red-50"
                  : ""
              }`}
              title={
                assembliesWithoutUsers > 0
                  ? "Click to view assemblies without users"
                  : "No assemblies without users"
              }
            >
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Assemblies Without Users
                  {showAssembliesWithoutUsers && (
                    <span className="ml-2 text-red-600 font-semibold">
                      (Filtered)
                    </span>
                  )}
                </p>
                <p
                  className={`text-xl sm:text-2xl font-semibold mt-1 ${
                    assembliesWithoutUsers > 0
                      ? "text-red-600"
                      : "text-gray-400"
                  }`}
                >
                  {formatNumber(assembliesWithoutUsers)}
                </p>
              </div>
              <div
                className={`rounded-full p-1.5 ${
                  assembliesWithoutUsers > 0 ? "bg-red-50" : "bg-gray-50"
                }`}
              >
                {assembliesWithoutUsers > 0 ? (
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
      <HierarchyTable
        data={paginatedData}
        loading={loading}
        error={error ? "Failed to load assemblies" : null}
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        onSort={handleSort}
        onPageChange={setCurrentPage}
        currentPage={currentPageFromAPI}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        title="Assembly List"
        emptyMessage="No assemblies found"
        stateName={stateName}
        districts={districts.map((d) => ({
          location_id: d.districtId,
          location_name: d.districtName,
          location_type: "District" as const,
          parent_id: stateId,
          total_users: 0,
          active_users: 0,
          users: [],
        }))}
        selectedDistrict={selectedDistrictId}
        onDistrictChange={handleDistrictChange}
        showUploadVotersButton={true}
        onUploadVoters={handleUploadVoters}
        showUploadDraftVotersButton={true}
        onUploadDraftVoters={handleUploadDraftVoters}
        hideHeader={true}
        showAllDistricts={true}
        hideActiveUsersColumn={true}
      />

      {uploadModalOpen && selectedAssembly && (
        <UploadVotersModal
          isOpen={uploadModalOpen}
          onClose={handleCloseUploadModal}
          stateId={stateId || 0}
          districtId={(() => {
            const assembly = transformedData.find(
              (item) => item.location_id === selectedAssembly.id
            );
            return assembly?.district_id || 0;
          })()}
          assemblyId={selectedAssembly.id}
          assemblyName={selectedAssembly.name}
        />
      )}

      {draftModalOpen && selectedDraftAssembly && (
        <UploadDraftVotersModal
          isOpen={draftModalOpen}
          onClose={() => setDraftModalOpen(false)}
          stateId={selectedDraftAssembly.stateId}
          districtId={selectedDraftAssembly.districtId}
          assemblyId={selectedDraftAssembly.id}
          assemblyName={selectedDraftAssembly.name}
          districtName={selectedDraftAssembly.districtName}
          partyId={partyId || 0}
        />
      )}
    </div>
  );
}
