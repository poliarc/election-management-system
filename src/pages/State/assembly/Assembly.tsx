import { useEffect, useState } from "react";
import { useHierarchyData, useAllDistrictsAssemblyData } from "../../../hooks/useHierarchyData";
import HierarchyTable from "../../../components/HierarchyTable";
import UploadVotersModal from "../../../components/UploadVotersModal";
import { fetchHierarchyChildren } from "../../../services/hierarchyApi";
import type { HierarchyChild, EnhancedHierarchyChild } from "../../../types/hierarchy";

export default function StateAssembly() {
  const [stateId, setStateId] = useState<number | null>(null);
  const [stateName, setStateName] = useState<string>("");
  const [districts, setDistricts] = useState<HierarchyChild[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("");
  const [selectedDistrictParentId, setSelectedDistrictParentId] = useState<number | null>(null);
  const [assemblies, setAssemblies] = useState<HierarchyChild[]>([]);
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<string>("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedAssembly, setSelectedAssembly] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // New state variables for enhanced filtering
  const [showAllDistricts, setShowAllDistricts] = useState<boolean>(true);
  const [searchInput, setSearchInput] = useState<string>("");
  const [sortBy, setSortBy] = useState<"location_name" | "total_users" | "active_users">("location_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // State for filtering assemblies without users
  const [showAssembliesWithoutUsers, setShowAssembliesWithoutUsers] = useState(false);

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

  // Fetch districts when state is available
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
        }
      } catch (err) {
        console.error("Error fetching districts:", err);
      }
    };

    loadDistricts();
  }, [stateId]);

  // Don't auto-select first district - start with all districts view
  // This is removed to support the new default behavior of showing all assemblies

  // Fetch assemblies when district is selected
  useEffect(() => {
    const loadAssemblies = async () => {
      if (!selectedDistrictId) {
        setAssemblies([]);
        return;
      }

      try {
        const response = await fetchHierarchyChildren(Number(selectedDistrictId), {
          page: 1,
          limit: 1000, // Get all assemblies
        });

        if (response.success) {
          setAssemblies(response.data.children);
        }
      } catch (err) {
        console.error("Error fetching assemblies:", err);
      }
    };

    loadAssemblies();
  }, [selectedDistrictId]);

  // Enhanced filter handlers
  const handleDistrictChange = (districtId: string) => {
    if (districtId === "") {
      // Show all districts
      setShowAllDistricts(true);
      setSelectedDistrictId("");
      setSelectedDistrictName("");
      setSelectedDistrictParentId(null);
    } else {
      // Show specific district
      setShowAllDistricts(false);
      setSelectedDistrictId(districtId);
      const district = districts.find(
        (d) => d.location_id.toString() === districtId
      );
      setSelectedDistrictName(district?.location_name || "");
      setSelectedDistrictParentId(district?.parent_id || null);
    }
    
    setSelectedAssemblyId(""); // Clear assembly selection when district changes
    setCurrentPage(1); // Reset to page 1 when filter changes

    console.log("District filter changed:", {
      districtId,
      showAllDistricts: districtId === "",
    });
  };

  const handleAssemblyChange = (assemblyId: string) => {
    setSelectedAssemblyId(assemblyId);
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  const handleSearchChange = (search: string) => {
    setSearchInput(search);
    setCurrentPage(1); // Reset to page 1 when search changes
  };

  // Handle assemblies without users filter
  const handleAssembliesWithoutUsersClick = () => {
    if (assembliesWithoutUsers > 0) {
      setShowAssembliesWithoutUsers(!showAssembliesWithoutUsers);
      setCurrentPage(1); // Reset to page 1
    }
  };

  const handleSort = (
    sortBy: "location_name" | "total_users" | "active_users",
    order: "asc" | "desc"
  ) => {
    setSortBy(sortBy);
    setSortOrder(order);
  };

  const handleUploadVoters = (assemblyId: number, assemblyName: string) => {
    // Find the assembly in the data to get its parent_id (which is the district)
    const assembly = data.find((item) => item.location_id === assemblyId);
    
    let districtIdFromAssembly: number;
    let actualStateId: number;

    if (showAllDistricts && 'district_id' in assembly!) {
      // In all-districts mode, use the district_id from enhanced data
      const enhancedAssembly = assembly as EnhancedHierarchyChild;
      districtIdFromAssembly = enhancedAssembly.district_id;
      actualStateId = stateId!;
    } else {
      // In single-district mode, use the existing logic
      districtIdFromAssembly = assembly?.parent_id || Number(selectedDistrictId);
      actualStateId = selectedDistrictParentId || stateId!;
    }

    console.log("Upload Voters clicked:", {
      assemblyId,
      assemblyName,
      stateId,
      actualStateId,
      selectedDistrictId,
      selectedDistrictParentId,
      districtIdFromAssembly,
      showAllDistricts,
    });

    if (!actualStateId) {
      alert("State ID is missing. Please refresh the page.");
      return;
    }

    if (!districtIdFromAssembly) {
      alert("District ID is missing. Please try again.");
      return;
    }

    setSelectedAssembly({
      id: assemblyId,
      name: assemblyName,
    });
    setUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
    setSelectedAssembly(null);
  };

  // Use different hooks based on whether showing all districts or specific district
  const {
    data: singleDistrictData,
    loading: singleDistrictLoading,
    error: singleDistrictError,
    parentName,
  } = useHierarchyData(
    !showAllDistricts && selectedDistrictId ? Number(selectedDistrictId) : null,
    25 // Items per page
  );

  const {
    allAssembliesData,
    loading: allDistrictsLoading,
    error: allDistrictsError,
  } = useAllDistrictsAssemblyData(
    stateId,
    districts,
    searchInput,
    sortBy,
    sortOrder,
    'all'
  );

  // Determine which data to use based on current mode
  const data = showAllDistricts ? allAssembliesData : singleDistrictData;
  const loading = showAllDistricts ? allDistrictsLoading : singleDistrictLoading;
  const error = showAllDistricts ? allDistrictsError : singleDistrictError;

  // Filter data based on selected assembly and apply pagination for single district view
  let filteredData: (HierarchyChild | EnhancedHierarchyChild)[] = data;
  
  if (selectedAssemblyId) {
    filteredData = data.filter((item) => item.location_id.toString() === selectedAssemblyId);
  }

  // Apply search filter for single district view (all districts view handles search in the hook)
  if (!showAllDistricts && searchInput) {
    filteredData = filteredData.filter((item) =>
      item.location_name.toLowerCase().includes(searchInput.toLowerCase())
    );
  }

  // Apply assemblies without users filter
  if (showAssembliesWithoutUsers) {
    filteredData = filteredData.filter((item) => item.total_users === 0);
  }



  // Calculate pagination for filtered data
  const itemsPerPage = 25;
  const totalFilteredItems = filteredData.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Calculate summary statistics based on current data source
  const statsData = showAllDistricts ? allAssembliesData : assemblies;
  const totalUsers = statsData.reduce((sum, assembly) => sum + assembly.total_users, 0);
  const assembliesWithoutUsers = statsData.filter(assembly => assembly.total_users === 0).length;

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
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Assembly List</h1>
            <p className="text-sky-100 mt-1 text-xs sm:text-sm">{selectedDistrictName || stateName || parentName}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            {/* Total Assemblies Card */}
            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Assemblies</p>
                <p className="text-xl sm:text-2xl font-semibold mt-1">{formatNumber(statsData.length)}</p>
              </div>
              <div className="bg-blue-50 rounded-full p-1.5">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
              </div>
            </div>

            {/* Total Users Card */}
            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Assigned Users</p>
                <p className="text-xl sm:text-2xl font-semibold text-green-600 mt-1">{formatNumber(totalUsers)}</p>
              </div>
              <div className="bg-green-50 rounded-full p-1.5">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>

            {/* Assemblies Without Users Card - Clickable */}
            <div 
              onClick={handleAssembliesWithoutUsersClick}
              className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${
                assembliesWithoutUsers > 0 
                  ? 'cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-red-50' 
                  : 'cursor-default'
              } ${
                showAssembliesWithoutUsers 
                  ? 'ring-2 ring-red-500 bg-red-50' 
                  : ''
              }`}
              title={assembliesWithoutUsers > 0 ? "Click to view assemblies without users" : "No assemblies without users"}
            >
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Assemblies Without Users
                  {showAssembliesWithoutUsers && (
                    <span className="ml-2 text-red-600 font-semibold">(Filtered)</span>
                  )}
                </p>
                <p className={`text-xl sm:text-2xl font-semibold mt-1 ${assembliesWithoutUsers > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {formatNumber(assembliesWithoutUsers)}
                </p>
              </div>
              <div className={`rounded-full p-1.5 ${assembliesWithoutUsers > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
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
      <HierarchyTable
        data={paginatedData}
        loading={loading}
        error={error}
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        onSort={handleSort}
        onPageChange={setCurrentPage}
        currentPage={currentPage}
        totalItems={totalFilteredItems}
        itemsPerPage={itemsPerPage}
        title="Assembly List"
        emptyMessage={
          showAllDistricts
            ? "No assemblies found"
            : selectedDistrictId
            ? "No assemblies found for this district"
            : "Please select a district to view assemblies"
        }
        stateName={stateName || parentName}
        districtName={selectedDistrictName}
        districts={districts}
        selectedDistrict={selectedDistrictId}
        onDistrictChange={handleDistrictChange}
        assemblies={assemblies}
        selectedAssembly={selectedAssemblyId}
        onAssemblyChange={handleAssemblyChange}
        showUploadVotersButton={true}
        onUploadVoters={handleUploadVoters}
        hideHeader={true}
        showAllDistricts={showAllDistricts}
        hideActiveUsersColumn={true}
      />

      {uploadModalOpen && selectedAssembly && (
        <UploadVotersModal
          isOpen={uploadModalOpen}
          onClose={handleCloseUploadModal}
          stateId={stateId || 0}
          districtId={(() => {
            const assembly = data.find((item) => item.location_id === selectedAssembly.id);
            if (showAllDistricts && assembly && 'district_id' in assembly) {
              return (assembly as EnhancedHierarchyChild).district_id;
            }
            return Number(selectedDistrictId) || assembly?.parent_id || 0;
          })()}
          assemblyId={selectedAssembly.id}
          assemblyName={selectedAssembly.name}
        />
      )}
    </div>
  );
}
