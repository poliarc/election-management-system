import React, { useState, useEffect } from "react";
import { useGetBlockHierarchyQuery } from "../../../store/api/blockTeamApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import * as XLSX from "xlsx";

import axios from "axios";
import InlineUserDisplay from "../../../components/InlineUserDisplay";

export default function StatePollingCenterList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<number>(0);
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number>(0);
  const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
  const [selectedMandalId, setSelectedMandalId] = useState<number>(0);
  const [selectedPollingCenterFilter, setSelectedPollingCenterFilter] =
    useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Booth states
  const [booths, setBooths] = useState<any[]>([]);
  const [loadingBooths, setLoadingBooths] = useState(false);

  const [districts, setDistricts] = useState<any[]>([]);
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);

  // State for all polling centers in the state
  const [allPollingCenters, setAllPollingCenters] = useState<any[]>([]);

  // State for inline user display
  const [expandedPollingCenterId, setExpandedPollingCenterId] = useState<
    number | null
  >(null);
  const [pollingCenterUsers, setPollingCenterUsers] = useState<
    Record<number, any[]>
  >({});

  // State for filtering polling centers without users
  const [showPollingCentersWithoutUsers, setShowPollingCentersWithoutUsers] =
    useState(false);

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
        // Function to fetch all pages of districts
        const fetchAllDistrictPages = async () => {
          let allDistricts: any[] = [];
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const response = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/api/user-state-hierarchies/hierarchy/children/${stateInfo.stateId}?page=${page}&limit=50`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                },
              }
            );
            const data = await response.json();
            
            if (data.success && data.data?.children && data.data.children.length > 0) {
              allDistricts = allDistricts.concat(data.data.children);
              page++;
              hasMore = data.data.children.length === 50;
            } else {
              hasMore = false;
            }
          }
          return allDistricts;
        };

        const districtsData = await fetchAllDistrictPages();
        const mappedDistricts = districtsData.map((district: any) => ({
          id: district.location_id || district.id,
          displayName: district.location_name,
          levelName: "District",
          location_id: district.location_id,
        }));
        setDistricts(mappedDistricts);
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
        // Function to fetch all pages of assemblies
        const fetchAllAssemblyPages = async () => {
          let allAssemblies: any[] = [];
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const response = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/api/user-state-hierarchies/hierarchy/children/${selectedDistrictId}?page=${page}&limit=50`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                },
              }
            );
            const data = await response.json();
            
            if (data.success && data.data?.children && data.data.children.length > 0) {
              allAssemblies = allAssemblies.concat(data.data.children);
              page++;
              hasMore = data.data.children.length === 50;
            } else {
              hasMore = false;
            }
          }
          return allAssemblies;
        };

        const assembliesData = await fetchAllAssemblyPages();
        const mappedAssemblies = assembliesData.map((assembly: any) => ({
          id: assembly.location_id || assembly.id,
          displayName: assembly.location_name,
          levelName: "Assembly",
          location_id: assembly.location_id,
        }));
        setAssemblies(mappedAssemblies);
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

  // Fetch all polling centers for the state (across all districts/assemblies/blocks/mandals)
  useEffect(() => {
    const fetchAllPollingCenters = async () => {
      if (!stateInfo.stateId) return;
      try {
        const token = localStorage.getItem("auth_access_token");
        
        // Function to fetch all pages of data
        const fetchAllPages = async (url: string) => {
          let allData: any[] = [];
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const response = await fetch(`${url}?page=${page}&limit=50`, {
              headers: { Authorization: `Bearer ${token}` }
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

        // Fetch all districts with pagination
        const districts = await fetchAllPages(
          `${import.meta.env.VITE_API_BASE_URL}/api/user-state-hierarchies/hierarchy/children/${stateInfo.stateId}`
        );

        // Fetch all assemblies for each district
        const assemblies = (
          await Promise.all(
            districts.map(async (district: any) => {
              const assembliesData = await fetchAllPages(
                `${import.meta.env.VITE_API_BASE_URL}/api/user-state-hierarchies/hierarchy/children/${district.location_id || district.id}`
              );
              return assembliesData.map((assembly: any) => ({
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
                `${import.meta.env.VITE_API_BASE_URL}/api/after-assembly-data/assembly/${assembly.location_id || assembly.id}`,
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
              const mandalsData = await fetchAllPages(
                `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${block.id}`
              );
              return mandalsData.map((mandal: any) => ({
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

        // Fetch all polling centers for each mandal
        const pollingCenters = (
          await Promise.all(
            mandals.map(async (mandal: any) => {
              const pollingCentersData = await fetchAllPages(
                `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${mandal.id}`
              );
              // Filter to only include polling centers (exclude booths)
              const filteredChildren = pollingCentersData.filter(
                (item: any) => item.levelName !== "Booth"
              );

              return filteredChildren.map((pc: any) => ({
                ...pc,
                mandalId: mandal.id,
                mandalName: mandal.displayName,
                blockId: mandal.blockId,
                blockName: mandal.blockName,
                assemblyId: mandal.assemblyId,
                assemblyName: mandal.assemblyName,
                districtId: mandal.districtId,
                districtName: mandal.districtName,
              }));
            })
          )
        ).flat();

        setAllPollingCenters(pollingCenters);
      } catch (err) {
        console.error("Error fetching all polling centers:", err);
      }
    };
    fetchAllPollingCenters();
  }, [stateInfo.stateId]);

  // Fetch mandals for selected block
  const { data: mandalHierarchyData } = useGetBlockHierarchyQuery(
    selectedBlockId,
    { skip: !selectedBlockId }
  );

  const mandals = mandalHierarchyData?.children || [];

  // Fetch polling centers for selected mandal
  const {
    data: hierarchyData,
    isLoading: loadingPollingCenters,
    error,
  } = useGetBlockHierarchyQuery(selectedMandalId, { skip: !selectedMandalId });

  // Show all polling centers if no district is selected,
  // or show polling centers from all mandals in all blocks in all assemblies within selected district if district is selected,
  // or show polling centers from all mandals in all blocks in selected assembly if assembly is selected,
  // or show polling centers from all mandals in selected block if block is selected,
  // or show polling centers from specific mandal if mandal is selected
  const pollingCenters = (() => {
    if (selectedMandalId) {
      // Show polling centers from specific mandal
      return (hierarchyData?.children || []).filter(
        (item: any) => item.levelName !== "Booth"
      );
    } else if (selectedBlockId) {
      // Show polling centers from all mandals in selected block
      return allPollingCenters.filter(pc => pc.blockId === selectedBlockId);
    } else if (selectedAssemblyId) {
      // Show polling centers from all mandals in all blocks in selected assembly
      return allPollingCenters.filter(pc => pc.assemblyId === selectedAssemblyId);
    } else if (selectedDistrictId) {
      // Show polling centers from all mandals in all blocks in all assemblies within selected district
      return allPollingCenters.filter(pc => pc.districtId === selectedDistrictId);
    } else {
      // Show all polling centers from all districts
      return allPollingCenters;
    }
  })();

  // Fetch Booths for selected Polling Center
  const fetchBooths = async (pollingCenterId: number) => {
    setLoadingBooths(true);
    try {
      const token = localStorage.getItem("auth_access_token");
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/user-after-assembly-hierarchy/hierarchy/children/${pollingCenterId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        setBooths(response.data.children || []);
      }
    } catch (error) {
      console.error("Error fetching booths:", error);
      setBooths([]);
    } finally {
      setLoadingBooths(false);
    }
  };

  // Handle polling centers without users filter
  const handlePollingCentersWithoutUsersClick = () => {
    const pollingCentersWithoutUsersCount = pollingCenters.filter(
      (pc) => (pc.user_count || 0) === 0
    ).length;

    if (pollingCentersWithoutUsersCount > 0) {
      setShowPollingCentersWithoutUsers(!showPollingCentersWithoutUsers);
      setCurrentPage(1); // Reset to page 1
    }
  };

  const filteredPollingCenters = pollingCenters.filter((pc) => {
    const matchesSearch = pc.displayName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      selectedPollingCenterFilter === "" ||
      pc.id.toString() === selectedPollingCenterFilter;

    // Apply polling centers without users filter
    const matchesWithoutUsersFilter = showPollingCentersWithoutUsers
      ? (pc.user_count || 0) === 0
      : true;

    return matchesSearch && matchesFilter && matchesWithoutUsersFilter;
  });

  const handleViewUsers = async (pollingCenterId: number) => {
    // If already expanded, collapse it
    if (expandedPollingCenterId === pollingCenterId) {
      setExpandedPollingCenterId(null);
      return;
    }

    // If users already loaded, just expand
    if (pollingCenterUsers[pollingCenterId]) {
      setExpandedPollingCenterId(pollingCenterId);
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/user-after-assembly-hierarchy/after-assembly/${pollingCenterId}`,
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
        setPollingCenterUsers((prev) => ({
          ...prev,
          [pollingCenterId]: data.data.users,
        }));
        setExpandedPollingCenterId(pollingCenterId);
      } else {
        // No users found or API error
      }
    } catch (error) {
      console.error(
        `Error fetching users for polling center ${pollingCenterId}:`,
        error
      );
    }
  };

  // Excel export function
  const exportToExcel = () => {
    // Prepare data for Excel export
    const excelData = allPollingCenters.map((pc, index) => ({
      "S.No": index + 1,
      "District Name": pc.districtName || "",
      "Assembly Name": pc.assemblyName || "",
      "Block Name": pc.blockName || "",
      "Mandal Name": pc.mandalName || "",
      "Polling Center Name": pc.displayName || "",
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 8 }, // S.No
      { wch: 20 }, // District Name
      { wch: 20 }, // Assembly Name
      { wch: 20 }, // Block Name
      { wch: 20 }, // Mandal Name
      { wch: 25 }, // Polling Center Name
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Polling Centers");

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `Polling_Center_List_${stateInfo.stateName.replace(
      /\s+/g,
      "_"
    )}_${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  const totalPages = Math.ceil(filteredPollingCenters.length / itemsPerPage);
  const paginatedPollingCenters = filteredPollingCenters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-1">
      <div className="max-w-7xl mx-auto">
        {/* Header with Stats Cards */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-3 mb-1 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="shrink-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                Polling Center List
              </h1>
              <p className="text-blue-100 mt-1 text-xs sm:text-sm">
                State: {stateInfo.stateName}
              </p>
            </div>

            {/* Excel Export Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={exportToExcel}
                disabled={allPollingCenters.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                title="Export all polling centers to Excel"
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
                Export Excel ({allPollingCenters.length})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              {/* Total Polling Centers Card */}
              <div className="bg-white text-gray-900 rounded-md shadow-md p-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Total Polling Centers
                  </p>
                  <p className="text-lg sm:text-xl font-semibold mt-1">
                    {pollingCenters.length}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-full p-1">
                  <svg
                    className="w-4 h-4 text-purple-600"
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
                </div>
              </div>

              {/* Total Users Card */}
              <div className="bg-white text-gray-900 rounded-md shadow-md p-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-lg sm:text-xl font-semibold text-green-600 mt-1">
                    {pollingCenters.reduce(
                      (sum, pc) => sum + (pc.user_count || 0),
                      0
                    )}
                  </p>
                </div>
                <div className="bg-green-50 rounded-full p-1">
                  <svg
                    className="w-4 h-4 text-green-600"
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

              {/* Polling Centers Without Users Card - Clickable */}
              <div
                onClick={handlePollingCentersWithoutUsersClick}
                className={`bg-white text-gray-900 rounded-md shadow-md p-2 flex items-center justify-between transition-all duration-200 ${
                  pollingCenters.filter((pc) => (pc.user_count || 0) === 0)
                    .length > 0
                    ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-red-50"
                    : "cursor-default"
                } ${
                  showPollingCentersWithoutUsers
                    ? "ring-2 ring-red-500 bg-red-50"
                    : ""
                }`}
                title={
                  pollingCenters.filter((pc) => (pc.user_count || 0) === 0)
                    .length > 0
                    ? "Click to view polling centers without users"
                    : "No polling centers without users"
                }
              >
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Polling Centers Without Users
                    {showPollingCentersWithoutUsers && (
                      <span className="ml-2 text-red-600 font-semibold">
                        (Filtered)
                      </span>
                    )}
                  </p>
                  <p
                    className={`text-lg sm:text-xl font-semibold mt-1 ${
                      pollingCenters.filter((pc) => (pc.user_count || 0) === 0)
                        .length > 0
                        ? "text-red-600"
                        : "text-gray-400"
                    }`}
                  >
                    {
                      pollingCenters.filter((pc) => (pc.user_count || 0) === 0)
                        .length
                    }
                  </p>
                </div>
                <div
                  className={`rounded-full p-1 ${
                    pollingCenters.filter((pc) => (pc.user_count || 0) === 0)
                      .length > 0
                      ? "bg-red-50"
                      : "bg-gray-50"
                  }`}
                >
                  {pollingCenters.filter((pc) => (pc.user_count || 0) === 0)
                    .length > 0 ? (
                    <svg
                      className="w-4 h-4 text-red-600"
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
                      className="w-4 h-4 text-gray-400"
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-3 mb-1">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
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
                  setSelectedMandalId(0);
                  setSelectedPollingCenterFilter("");
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
                Assembly
              </label>
              <select
                value={selectedAssemblyId}
                onChange={(e) => {
                  setSelectedAssemblyId(Number(e.target.value));
                  setSelectedBlockId(0);
                  setSelectedMandalId(0);
                  setSelectedPollingCenterFilter("");
                  setCurrentPage(1);
                }}
                disabled={!selectedDistrictId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value={0}>All Assemblies in District</option>
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
                Block
              </label>
              <select
                value={selectedBlockId}
                onChange={(e) => {
                  setSelectedBlockId(Number(e.target.value));
                  setSelectedMandalId(0);
                  setSelectedPollingCenterFilter("");
                  setCurrentPage(1);
                }}
                disabled={!selectedAssemblyId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value={0}>All Blocks in Assembly</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mandal
              </label>
              <select
                value={selectedMandalId}
                onChange={(e) => {
                  setSelectedMandalId(Number(e.target.value));
                  setSelectedPollingCenterFilter("");
                  setCurrentPage(1);
                }}
                disabled={!selectedBlockId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value={0}>All Mandals in Block</option>
                {mandals.map((mandal) => (
                  <option key={mandal.id} value={mandal.id}>
                    {mandal.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Polling Center
              </label>
              <select
                value={selectedPollingCenterFilter}
                onChange={(e) => {
                  setSelectedPollingCenterFilter(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={!selectedMandalId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Polling Centers</option>
                {pollingCenters.map((pc) => (
                  <option key={pc.id} value={pc.id.toString()}>
                    {pc.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
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
                  placeholder="Search by polling center name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Polling Center List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loadingPollingCenters && selectedMandalId ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading polling centers...</p>
            </div>
          ) : error && selectedMandalId ? (
            <div className="text-center py-12 text-red-600">
              <p>Error loading polling centers</p>
            </div>
          ) : filteredPollingCenters.length === 0 ? (
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
                  d="M20 13V6a.2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="mt-2 text-gray-500 font-medium">
                No polling centers found
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        S.No
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Mandal
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Level Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Display Name
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total Users
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedPollingCenters.map((pollingCenter, index) => (
                      <React.Fragment key={pollingCenter.id}>
                        <tr
                          key={pollingCenter.id}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              {pollingCenter.mandalName ||
                                hierarchyData?.parent.displayName}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {pollingCenter.levelName || "Polling Center"}
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
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {pollingCenter.displayName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {pollingCenter.partyLevelDisplayName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() =>
                                  handleViewUsers(pollingCenter.id)
                                }
                                className={`inline-flex items-center p-1 rounded-md transition-colors mr-2 ${
                                  expandedPollingCenterId === pollingCenter.id
                                    ? "text-blue-700 bg-blue-100"
                                    : "text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                }`}
                                title={
                                  expandedPollingCenterId === pollingCenter.id
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
                                {pollingCenter.user_count || 0}
                              </span>
                            </div>
                          </td>
                          {/* <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                pollingCenter.isActive === 1
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {pollingCenter.isActive === 1
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td> */}
                          {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                      {pollingCenter.created_at ? new Date(pollingCenter.created_at).toLocaleDateString() : "N/A"}
                                                  </td> */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="relative inline-block">
                              <button
                                onClick={() =>
                                  setOpenDropdownId(
                                    openDropdownId === pollingCenter.id
                                      ? null
                                      : pollingCenter.id
                                  )
                                }
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <svg
                                  className="w-5 h-5 text-gray-600"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>

                              {openDropdownId === pollingCenter.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenDropdownId(null)}
                                  />
                                  <div
                                    className={`absolute right-0 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 ${
                                      index >=
                                        paginatedPollingCenters.length - 2 &&
                                      paginatedPollingCenters.length >= 5
                                        ? "bottom-full mb-2"
                                        : "top-full mt-2"
                                    }`}
                                    style={{
                                      scrollbarWidth: "thin",
                                      scrollbarColor: "#9ca3af #f3f4f6",
                                    }}
                                  >
                                    <div className="py-1">
                                      <button
                                        onClick={() => {
                                          handleViewUsers(pollingCenter.id);
                                          setOpenDropdownId(null);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition-colors group"
                                      >
                                        <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                          <svg
                                            className="w-4 h-4 text-blue-600"
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
                                        </div>
                                        <span className="font-medium">
                                          View Users
                                        </span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          fetchBooths(pollingCenter.id);
                                          setOpenDropdownId(null);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-3 transition-colors group"
                                      >
                                        <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                          <svg
                                            className="w-4 h-4 text-green-600"
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
                                        </div>
                                        <span className="font-medium">
                                          View Booths
                                        </span>
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Inline User Display */}
                        {expandedPollingCenterId === pollingCenter.id &&
                          pollingCenterUsers[pollingCenter.id] && (
                            <InlineUserDisplay
                              users={pollingCenterUsers[pollingCenter.id]}
                              locationName={pollingCenter.displayName}
                              locationId={pollingCenter.id}
                              locationType="PollingCenter"
                              parentLocationName={
                                pollingCenter.mandalName ||
                                hierarchyData?.parent.displayName
                              }
                              parentLocationType="Mandal"
                              onUserDeleted={() => {
                                // Refresh user counts after deletion
                                setExpandedPollingCenterId(null);
                                setPollingCenterUsers((prev) => {
                                  const updated = { ...prev };
                                  delete updated[pollingCenter.id];
                                  return updated;
                                });
                                window.location.reload();
                              }}
                              onClose={() => setExpandedPollingCenterId(null)}
                              colSpan={9}
                            />
                          )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredPollingCenters.length > 0 && (
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
                            filteredPollingCenters.length
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold">
                          {filteredPollingCenters.length}
                        </span>{" "}
                        results
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-sm font-medium text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Booths Modal */}
      {booths.length > 0 && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Booths</h2>
                  <p className="text-green-100 mt-1">List of all booths</p>
                </div>
                <button
                  onClick={() => setBooths([])}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg
                    className="w-6 h-6"
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
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingBooths ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                  <p className="mt-4 text-gray-600">Loading booths...</p>
                </div>
              ) : booths.length === 0 ? (
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
                  <p className="mt-2 text-gray-500 font-medium">
                    No booths found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          S.No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Display Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Users
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {booths.map((booth, index) => (
                        <tr key={booth.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="bg-green-100 p-2 rounded-lg">
                                <svg
                                  className="w-5 h-5 text-green-600"
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
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {booth.displayName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {booth.partyLevelDisplayName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                              {booth.levelName || "Booth"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {booth.user_count || 0} users
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                booth.isActive === 1
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {booth.isActive === 1 ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {booth.created_at
                              ? new Date(booth.created_at).toLocaleDateString()
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
