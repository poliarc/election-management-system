import { useState, useEffect } from "react";
import { useGetBlockHierarchyQuery } from "../../../store/api/blockTeamApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import * as XLSX from "xlsx";

import InlineUserDisplay from "../../../components/InlineUserDisplay";

export default function StateMandalList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<number>(0);
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number>(0);
  const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
  const [selectedMandalFilter, setSelectedMandalFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [districts, setDistricts] = useState<any[]>([]);
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);

  // State for all mandals in the state
  const [allMandals, setAllMandals] = useState<any[]>([]);

  // State for inline user display
  const [expandedMandalId, setExpandedMandalId] = useState<number | null>(null);
  const [mandalUsers, setMandalUsers] = useState<Record<number, any[]>>({});

  // State for filtering mandals without users
  const [showMandalsWithoutUsers, setShowMandalsWithoutUsers] = useState(false);

  const selectedAssignment = useSelector(
    (state: RootState) => state.auth.selectedAssignment
  );

  const [stateInfo, setStateInfo] = useState({
    stateName: "",
    stateId: 0,
  });

  useEffect(() => {
    if (selectedAssignment) {
      setStateInfo({
        stateName: selectedAssignment.levelName || "",
        stateId: selectedAssignment.stateMasterData_id || 0,
      });
    }
  }, [selectedAssignment]);

  // Fetch districts using user-state-hierarchies API
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!stateInfo.stateId) return;
      try {
        console.log("Fetching districts for state ID:", stateInfo.stateId);
        const response = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/user-state-hierarchies/hierarchy/children/${
            stateInfo.stateId
          }?page=1&limit=100`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "auth_access_token"
              )}`,
            },
          }
        );
        const data = await response.json();
        console.log("Districts API response:", data);
        if (data.success && data.data) {
          // Map the response to match expected format
          const mappedDistricts = data.data.children.map((district: any) => ({
            id: district.location_id || district.id,
            displayName: district.location_name,
            levelName: "District",
            location_id: district.location_id,
          }));
          setDistricts(mappedDistricts);
        }
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    };
    fetchDistricts();
  }, [stateInfo.stateId]);

  // Fetch assemblies when district is selected using user-state-hierarchies API
  useEffect(() => {
    const fetchAssemblies = async () => {
      if (!selectedDistrictId) {
        setAssemblies([]);
        return;
      }
      try {
        console.log("Fetching assemblies for district ID:", selectedDistrictId);
        const response = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/user-state-hierarchies/hierarchy/children/${selectedDistrictId}?page=1&limit=100`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "auth_access_token"
              )}`,
            },
          }
        );
        const data = await response.json();
        console.log("Assemblies API response:", data);
        if (data.success && data.data) {
          // Map the response to match expected format
          const mappedAssemblies = data.data.children.map((assembly: any) => ({
            id: assembly.location_id || assembly.id,
            displayName: assembly.location_name,
            levelName: "Assembly",
            location_id: assembly.location_id,
          }));
          setAssemblies(mappedAssemblies);
        }
      } catch (error) {
        console.error("Error fetching assemblies:", error);
      }
    };
    fetchAssemblies();
  }, [selectedDistrictId]);

  // Fetch blocks when assembly is selected
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!selectedAssemblyId) {
        setBlocks([]);
        return;
      }
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/after-assembly-data/assembly/${selectedAssemblyId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "auth_access_token"
              )}`,
            },
          }
        );
        const data = await response.json();
        if (data.success) {
          setBlocks(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching blocks:", error);
      }
    };
    fetchBlocks();
  }, [selectedAssemblyId]);

  // Fetch all mandals for the state (across all districts/assemblies/blocks)
  useEffect(() => {
    const fetchAllMandals = async () => {
      if (!stateInfo.stateId) return;
      try {
        const token = localStorage.getItem("auth_access_token");
        // Fetch all districts
        const districtRes = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/user-state-hierarchies/hierarchy/children/${
            stateInfo.stateId
          }?page=1&limit=100`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const districtData = await districtRes.json();
        const districts = districtData.data?.children || [];

        // Fetch all assemblies for each district
        const assemblies = (
          await Promise.all(
            districts.map(async (district: any) => {
              const res = await fetch(
                `${
                  import.meta.env.VITE_API_BASE_URL
                }/api/user-state-hierarchies/hierarchy/children/${
                  district.location_id || district.id
                }?page=1&limit=100`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const data = await res.json();
              return (data.data?.children || []).map((assembly: any) => ({
                ...assembly,
                districtId: district.location_id || district.id,
                districtName: district.location_name,
              }));
            })
          )
        ).flat();

        // Fetch all blocks for each assembly
        const blocks = (
          await Promise.all(
            assemblies.map(async (assembly: any) => {
              const res = await fetch(
                `${
                  import.meta.env.VITE_API_BASE_URL
                }/api/after-assembly-data/assembly/${
                  assembly.location_id || assembly.id
                }`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const data = await res.json();
              return (data.data || []).map((block: any) => ({
                ...block,
                assemblyId: assembly.location_id || assembly.id,
                assemblyName: assembly.location_name,
                districtId: assembly.districtId,
                districtName: assembly.districtName,
              }));
            })
          )
        ).flat();

        // Fetch all mandals for each block
        const mandals = (
          await Promise.all(
            blocks.map(async (block: any) => {
              const res = await fetch(
                `${
                  import.meta.env.VITE_API_BASE_URL
                }/api/user-after-assembly-hierarchy/hierarchy/children/${
                  block.id
                }`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const data = await res.json();
              return (data.children || []).map((mandal: any) => ({
                ...mandal,
                blockId: block.id,
                blockName: block.displayName,
                assemblyId: block.assemblyId,
                assemblyName: block.assemblyName,
                districtId: block.districtId,
                districtName: block.districtName,
              }));
            })
          )
        ).flat();

        setAllMandals(mandals);
      } catch (err) {
        console.error("Error fetching all mandals:", err);
      }
    };
    fetchAllMandals();
  }, [stateInfo.stateId]);

  // Fetch mandals for selected block
  const {
    data: hierarchyData,
    isLoading: loadingMandals,
    error,
  } = useGetBlockHierarchyQuery(selectedBlockId, { skip: !selectedBlockId });

  // Show all mandals if no block is selected, otherwise show filtered mandals
  const mandals = selectedBlockId ? hierarchyData?.children || [] : allMandals;

  // Handle mandals without users filter
  const handleMandalsWithoutUsersClick = () => {
    const mandalsWithoutUsersCount = mandals.filter(
      (mandal) => (mandal.user_count || 0) === 0
    ).length;

    if (mandalsWithoutUsersCount > 0) {
      setShowMandalsWithoutUsers(!showMandalsWithoutUsers);
      setCurrentPage(1); // Reset to page 1
    }
  };

  const filteredMandals = mandals.filter((mandal) => {
    const matchesSearch = mandal.displayName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      selectedMandalFilter === "" ||
      mandal.id.toString() === selectedMandalFilter;

    // Apply mandals without users filter
    const matchesWithoutUsersFilter = showMandalsWithoutUsers
      ? (mandal.user_count || 0) === 0
      : true;

    return matchesSearch && matchesFilter && matchesWithoutUsersFilter;
  });

  const handleViewUsers = async (mandalId: number) => {
    // If already expanded, collapse it
    if (expandedMandalId === mandalId) {
      setExpandedMandalId(null);
      return;
    }

    // If users already loaded, just expand
    if (mandalUsers[mandalId]) {
      setExpandedMandalId(mandalId);
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/user-after-assembly-hierarchy/after-assembly/${mandalId}`,
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
        // Store users data
        setMandalUsers((prev) => ({
          ...prev,
          [mandalId]: data.data.users,
        }));
        setExpandedMandalId(mandalId);
      } else {
        console.log("Mandal API Error or No Users:", data);
      }
    } catch (error) {
      console.error(`Error fetching users for mandal ${mandalId}:`, error);
    }
  };

  const totalPages = Math.ceil(filteredMandals.length / itemsPerPage);
  const paginatedMandals = filteredMandals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Export to Excel function
  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = allMandals.map((mandal, index) => ({
      "S.No": index + 1,
      "District Name": mandal.districtName || "N/A",
      "Assembly Name": mandal.assemblyName || "N/A",
      "Block Name": mandal.blockName || "N/A",
      "Mandal Name": mandal.displayName || "N/A",
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 8 }, // S.No
      { wch: 25 }, // District Name
      { wch: 25 }, // Assembly Name
      { wch: 25 }, // Block Name
      { wch: 30 }, // Mandal Name
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mandals");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `Mandal_List_${stateInfo.stateName}_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-1">
      <div className="max-w-7xl mx-auto">
        {/* Header with Stats Cards */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-3 mb-1 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="shrink-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                Mandal List
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
                  disabled={allMandals.length === 0}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-md transition-colors duration-200"
                  title={`Export all ${allMandals.length} mandals to Excel`}
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
                  Export Excel ({allMandals.length})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                {/* Total Mandals Card */}
                <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">
                      Total Mandals
                    </p>
                    <p className="text-xl sm:text-2xl font-semibold mt-1">
                      {mandals.length}
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
                      {mandals.reduce(
                        (sum, mandal) => sum + (mandal.user_count || 0),
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

                {/* Mandals Without Users Card - Clickable */}
                <div
                  onClick={handleMandalsWithoutUsersClick}
                  className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${
                    mandals.filter((mandal) => (mandal.user_count || 0) === 0)
                      .length > 0
                      ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-red-50"
                      : "cursor-default"
                  } ${
                    showMandalsWithoutUsers
                      ? "ring-2 ring-red-500 bg-red-50"
                      : ""
                  }`}
                  title={
                    mandals.filter((mandal) => (mandal.user_count || 0) === 0)
                      .length > 0
                      ? "Click to view mandals without users"
                      : "No mandals without users"
                  }
                >
                  <div>
                    <p className="text-xs font-medium text-gray-600">
                      Mandals Without Users
                      {showMandalsWithoutUsers && (
                        <span className="ml-2 text-red-600 font-semibold">
                          (Filtered)
                        </span>
                      )}
                    </p>
                    <p
                      className={`text-xl sm:text-2xl font-semibold mt-1 ${
                        mandals.filter(
                          (mandal) => (mandal.user_count || 0) === 0
                        ).length > 0
                          ? "text-red-600"
                          : "text-gray-400"
                      }`}
                    >
                      {
                        mandals.filter(
                          (mandal) => (mandal.user_count || 0) === 0
                        ).length
                      }
                    </p>
                  </div>
                  <div
                    className={`rounded-full p-1.5 ${
                      mandals.filter((mandal) => (mandal.user_count || 0) === 0)
                        .length > 0
                        ? "bg-red-50"
                        : "bg-gray-50"
                    }`}
                  >
                    {mandals.filter((mandal) => (mandal.user_count || 0) === 0)
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-3 mb-1">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select District <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => {
                  setSelectedDistrictId(Number(e.target.value));
                  setSelectedAssemblyId(0);
                  setSelectedBlockId(0);
                  setSelectedMandalFilter("");
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>Select District</option>
                {districts.map((district) => (
                  <option
                    key={district.location_id || district.id}
                    value={district.location_id || district.id}
                  >
                    {district.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Assembly <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAssemblyId}
                onChange={(e) => {
                  setSelectedAssemblyId(Number(e.target.value));
                  setSelectedBlockId(0);
                  setSelectedMandalFilter("");
                  setCurrentPage(1);
                }}
                disabled={!selectedDistrictId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value={0}>Select Assembly</option>
                {assemblies.map((assembly) => (
                  <option
                    key={assembly.location_id || assembly.id}
                    value={assembly.location_id || assembly.id}
                  >
                    {assembly.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Block <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBlockId}
                onChange={(e) => {
                  setSelectedBlockId(Number(e.target.value));
                  setSelectedMandalFilter("");
                  setCurrentPage(1);
                }}
                disabled={!selectedAssemblyId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value={0}>Select Block</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Mandal
              </label>
              <select
                value={selectedMandalFilter}
                onChange={(e) => {
                  setSelectedMandalFilter(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={!selectedBlockId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Mandals</option>
                {mandals.map((mandal) => (
                  <option key={mandal.id} value={mandal.id}>
                    {mandal.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Mandals
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
                  disabled={!selectedBlockId}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mandal List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loadingMandals && selectedBlockId ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading mandals...</p>
            </div>
          ) : error && selectedBlockId ? (
            <div className="text-center py-12 text-red-600">
              <p>Error loading mandals</p>
            </div>
          ) : filteredMandals.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="mt-2 text-gray-500 font-medium">No mandals found</p>
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

                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Block
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Level Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Mandal Name
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total Users
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedMandals.map((mandal, index) => (
                      <>
                        <tr
                          key={mandal.id}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                              {mandal.blockName ||
                                hierarchyData?.parent.displayName}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {mandal.levelName || "Mandal"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 p-2 rounded-lg">
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
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {mandal.displayName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {mandal.partyLevelDisplayName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleViewUsers(mandal.id)}
                                className={`inline-flex items-center p-1 rounded-md transition-colors mr-2 ${
                                  expandedMandalId === mandal.id
                                    ? "text-blue-700 bg-blue-100"
                                    : "text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                }`}
                                title={
                                  expandedMandalId === mandal.id
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
                                {mandal.user_count || 0}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Inline User Display */}
                        {expandedMandalId === mandal.id &&
                          mandalUsers[mandal.id] && (
                            <InlineUserDisplay
                              users={mandalUsers[mandal.id]}
                              locationName={mandal.displayName}
                              locationId={mandal.id}
                              locationType="Mandal"
                              parentLocationName={
                                mandal.blockName ||
                                hierarchyData?.parent.displayName
                              }
                              parentLocationType="Block"
                              onUserDeleted={() => {
                                // Refresh user counts after deletion
                                setExpandedMandalId(null);
                                setMandalUsers((prev) => {
                                  const updated = { ...prev };
                                  delete updated[mandal.id];
                                  return updated;
                                });
                                window.location.reload();
                              }}
                              onClose={() => setExpandedMandalId(null)}
                              colSpan={6}
                            />
                          )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredMandals.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      <span>
                        Showing{" "}
                        <span className="font-semibold">
                          {(currentPage - 1) * itemsPerPage + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-semibold">
                          {Math.min(
                            currentPage * itemsPerPage,
                            filteredMandals.length
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold">
                          {filteredMandals.length}
                        </span>{" "}
                        results
                      </span>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        <div className="flex items-center space-x-1">
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    currentPage === pageNum
                                      ? "bg-blue-600 text-white"
                                      : "text-gray-700 hover:bg-gray-100"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            }
                          )}
                        </div>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
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
    </div>
  );
}
