import { useState, useEffect } from "react";
import { useGetBlockHierarchyQuery } from "../../../store/api/blockTeamApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import axios from "axios";
import InlineUserDisplay from "../../../components/InlineUserDisplay";
import type { HierarchyUser } from "../../../types/hierarchy";

export default function DistrictPollingCenterList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number>(0);
  const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
  const [selectedMandalId, setSelectedMandalId] = useState<number>(0);
  const [selectedPollingCenterFilter, setSelectedPollingCenterFilter] =
    useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // State for inline user display
  const [expandedPollingCenterId, setExpandedPollingCenterId] = useState<
    number | null
  >(null);
  const [pollingCenterUsers, setPollingCenterUsers] = useState<
    Record<number, HierarchyUser[]>
  >({});

  // State for all polling centers in the district
  const [allPollingCenters, setAllPollingCenters] = useState<any[]>([]);
  const [isLoadingAllPollingCenters, setIsLoadingAllPollingCenters] =
    useState(false);

  // State for filtering polling centers without users
  const [showPollingCentersWithoutUsers, setShowPollingCentersWithoutUsers] =
    useState(false);

  // Booth states
  const [booths, setBooths] = useState<any[]>([]);
  const [loadingBooths, setLoadingBooths] = useState(false);

  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);

  const selectedAssignment = useSelector(
    (state: RootState) => state.auth.selectedAssignment
  );

  const [districtInfo, setDistrictInfo] = useState({
    districtName: "",
    districtId: 0,
    stateName: "",
  });

  useEffect(() => {
    if (selectedAssignment) {
      setDistrictInfo({
        districtName: selectedAssignment.levelName || "",
        districtId: selectedAssignment.stateMasterData_id || 0,
        stateName: selectedAssignment.parentLevelName || "",
      });
    }
  }, [selectedAssignment]);

  // Function to fetch all polling centers from the district
  const fetchAllPollingCenters = async () => {
    if (!districtInfo.districtId) return;

    setIsLoadingAllPollingCenters(true);
    const allPollingCentersData: any[] = [];

    try {
      const token = localStorage.getItem("auth_access_token");

      // Step 1: Fetch all assemblies in the district
      const assembliesResponse = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/user-state-hierarchies/hierarchy/children/${
          districtInfo.districtId
        }?page=1&limit=500`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const assembliesData = await assembliesResponse.json();

      if (!assembliesData.success || !assembliesData.data?.children) {
        return;
      }

      // Step 2: Fetch all blocks in parallel
      const blockPromises = assembliesData.data.children.map(
        async (assembly: any) => {
          try {
            const response = await fetch(
              `${
                import.meta.env.VITE_API_BASE_URL
              }/api/after-assembly-data/assembly/${assembly.location_id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const data = await response.json();
            return {
              assembly,
              blocks: data.success ? data.data || [] : [],
            };
          } catch (error) {
            console.error(
              `Error fetching blocks for assembly ${assembly.location_id}:`,
              error
            );
            return { assembly, blocks: [] };
          }
        }
      );

      const blockResults = await Promise.all(blockPromises);

      // Step 3: Fetch all mandals in parallel
      const mandalPromises: Promise<any>[] = [];
      blockResults.forEach(({ assembly, blocks }) => {
        blocks.forEach((block: any) => {
          mandalPromises.push(
            fetch(
              `${
                import.meta.env.VITE_API_BASE_URL
              }/api/user-after-assembly-hierarchy/hierarchy/children/${
                block.id
              }`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )
              .then((response) => response.json())
              .then((data) => ({
                assembly,
                block,
                mandals: data.success ? data.children || [] : [],
              }))
              .catch((error) => {
                console.error(
                  `Error fetching mandals for block ${block.id}:`,
                  error
                );
                return { assembly, block, mandals: [] };
              })
          );
        });
      });

      const mandalResults = await Promise.all(mandalPromises);

      // Step 4: Fetch all polling centers in parallel (simplified approach like State implementation)
      const pollingCenterPromises: Promise<any>[] = [];
      mandalResults.forEach(({ assembly, block, mandals }) => {
        mandals.forEach((mandal: any) => {
          pollingCenterPromises.push(
            fetch(
              `${
                import.meta.env.VITE_API_BASE_URL
              }/api/user-after-assembly-hierarchy/hierarchy/children/${
                mandal.id
              }`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            )
              .then((response) => response.json())
              .then((data) => {
                console.log(`Mandal ${mandal.displayName} children:`, data);
                if (data.success && data.children && data.children.length > 0) {
                  // Simplified approach: treat all children as potential polling centers
                  // Filter out direct booths but include everything else
                  return data.children
                    .filter((child: any) => {
                      // Skip direct booths under mandals
                      return (
                        child.levelName !== "Booth" &&
                        child.levelName !== "booth"
                      );
                    })
                    .map((pollingCenter: unknown) => ({
                      ...pollingCenter,
                      hierarchyPath: `${districtInfo.districtName} → ${assembly.location_name} → ${block.displayName} → ${mandal.displayName}`,
                      districtName: districtInfo.districtName,
                      assemblyName: assembly.location_name,
                      blockName: block.displayName,
                      mandalName: mandal.displayName,
                    }));
                }
                return [];
              })
              .catch((error) => {
                console.error(
                  `Error fetching polling centers for mandal ${mandal.id}:`,
                  error
                );
                return [];
              })
          );
        });
      });

      // Wait for all polling center requests to complete
      const pollingCenterResults = await Promise.all(pollingCenterPromises);

      // Flatten all polling center results
      const flatPollingCenters = pollingCenterResults.flat();
      allPollingCentersData.push(...flatPollingCenters);

      console.log("Total polling centers found:", allPollingCentersData.length);
      console.log("Polling centers data:", allPollingCentersData);

      setAllPollingCenters(allPollingCentersData);
    } catch (error) {
      console.error("Error fetching all polling centers:", error);
    } finally {
      setIsLoadingAllPollingCenters(false);
    }
  };

  // Fetch all polling centers when district info is available
  useEffect(() => {
    if (districtInfo.districtId) {
      fetchAllPollingCenters();
    }
  }, [districtInfo.districtId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch assemblies for the district using user-state-hierarchies API
  useEffect(() => {
    const fetchAssemblies = async () => {
      if (!districtInfo.districtId) {
        setAssemblies([]);
        return;
      }
      try {
        console.log(
          "Fetching assemblies for district ID:",
          districtInfo.districtId
        );
        const response = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/user-state-hierarchies/hierarchy/children/${
            districtInfo.districtId
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
        console.log("Assemblies API response:", data);
        if (data.success && data.data) {
          // Map the response to match expected format
          const mappedAssemblies = data.data.children.map(
            (assembly: unknown) => ({
              id: assembly.location_id || assembly.id,
              displayName: assembly.location_name,
              levelName: "Assembly",
              location_id: assembly.location_id,
            })
          );
          setAssemblies(mappedAssemblies);
        }
      } catch (error) {
        console.error("Error fetching assemblies:", error);
        setAssemblies([]);
      }
    };
    fetchAssemblies();
  }, [districtInfo.districtId]);

  // No auto-selection for assemblies - let user choose

  // Fetch blocks when assembly is selected using after-assembly-data API
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!selectedAssemblyId) {
        setBlocks([]);
        return;
      }
      try {
        console.log("Fetching blocks for assembly ID:", selectedAssemblyId);
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
        console.log("Blocks API response:", data);
        if (data.success && data.data) {
          setBlocks(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching blocks:", error);
        setBlocks([]);
      }
    };
    fetchBlocks();
  }, [selectedAssemblyId]);

  // No auto-selection for blocks - let user choose

  // Fetch mandals for selected block using useGetBlockHierarchyQuery
  const { data: mandalHierarchyData } = useGetBlockHierarchyQuery(
    selectedBlockId,
    { skip: !selectedBlockId }
  );

  const mandals = mandalHierarchyData?.children || [];

  // No auto-selection for mandals - let user choose

  // Legacy polling center fetching for selected mandal (kept for backward compatibility)
  useGetBlockHierarchyQuery(selectedMandalId, { skip: !selectedMandalId });

  // Use all polling centers by default, or filtered polling centers based on selected hierarchy levels
  const pollingCenters = (() => {
    // If any filter is selected, filter from allPollingCenters based on hierarchy
    if (selectedAssemblyId > 0 || selectedBlockId > 0 || selectedMandalId > 0) {
      return allPollingCenters.filter((pc) => {
        // Check assembly filter using pre-computed name
        if (selectedAssemblyId > 0) {
          const selectedAssembly = assemblies.find(
            (a) =>
              a.id === selectedAssemblyId ||
              a.location_id === selectedAssemblyId
          );
          if (
            !selectedAssembly ||
            pc.assemblyName !== selectedAssembly.displayName
          ) {
            return false;
          }
        }

        // Check block filter using pre-computed name
        if (selectedBlockId > 0) {
          const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
          if (!selectedBlock || pc.blockName !== selectedBlock.displayName) {
            return false;
          }
        }

        // Check mandal filter using pre-computed name
        if (selectedMandalId > 0) {
          const selectedMandal = mandals.find((m) => m.id === selectedMandalId);
          if (!selectedMandal || pc.mandalName !== selectedMandal.displayName) {
            return false;
          }
        }

        return true;
      });
    }

    // Return all polling centers if no filters are selected
    return allPollingCenters;
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
    const matchesSearch =
      pc.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pc.hierarchyPath &&
        pc.hierarchyPath.toLowerCase().includes(searchTerm.toLowerCase()));
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
        console.log("Polling Center API Error or No Users:", data);
      }
    } catch (error) {
      console.error(
        `Error fetching users for polling center ${pollingCenterId}:`,
        error
      );
    }
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
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg p-3 sm:p-3 mb-1 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="shrink-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                Polling Center List
              </h1>
              <p className="text-green-100 text-xs sm:text-sm mt-1">
                District: {districtInfo.districtName}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              {/* Total Polling Centers Card */}
              <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Total Polling Centers
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold mt-1">
                    {pollingCenters.length}
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
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
                    {pollingCenters.reduce(
                      (sum, pc) => sum + (pc.user_count || 0),
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

              {/* Polling Centers Without Users Card - Clickable */}
              <div
                onClick={handlePollingCentersWithoutUsersClick}
                className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${
                  pollingCenters.filter((pc) => (pc.user_count || 0) === 0)
                    .length > 0
                    ? "cursor-pointer hover:shadow-lg hover:scale-105"
                    : "cursor-default"
                } ${
                  showPollingCentersWithoutUsers
                    ? "ring-2 ring-orange-500 bg-orange-50"
                    : ""
                }`}
                title={
                  pollingCenters.filter((pc) => (pc.user_count || 0) === 0)
                    .length > 0
                    ? showPollingCentersWithoutUsers
                      ? "Click to show all polling centers"
                      : "Click to show only polling centers without users"
                    : "No polling centers without users"
                }
              >
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Polling Centers Without Users
                    {showPollingCentersWithoutUsers && (
                      <span className="ml-2 text-orange-600 font-semibold">
                        (Filtered)
                      </span>
                    )}
                  </p>
                  <p
                    className={`text-xl sm:text-2xl font-semibold mt-1 ${
                      pollingCenters.filter((pc) => (pc.user_count || 0) === 0)
                        .length > 0
                        ? showPollingCentersWithoutUsers
                          ? "text-orange-600"
                          : "text-red-600"
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
                  className={`rounded-full p-1.5 ${
                    pollingCenters.filter((pc) => (pc.user_count || 0) === 0)
                      .length > 0
                      ? showPollingCentersWithoutUsers
                        ? "bg-orange-50"
                        : "bg-red-50"
                      : "bg-gray-50"
                  }`}
                >
                  {pollingCenters.filter((pc) => (pc.user_count || 0) === 0)
                    .length > 0 ? (
                    showPollingCentersWithoutUsers ? (
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                    ) : (
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
                    )
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-3 mb-1">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Assembly
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={0}>All Assemblies</option>
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
                Select Block
              </label>
              <select
                value={selectedBlockId}
                onChange={(e) => {
                  setSelectedBlockId(Number(e.target.value));
                  setSelectedMandalId(0);
                  setSelectedPollingCenterFilter("");
                  setCurrentPage(1);
                }}
                disabled={selectedAssemblyId === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value={0}>All Blocks</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Mandal
              </label>
              <select
                value={selectedMandalId}
                onChange={(e) => {
                  setSelectedMandalId(Number(e.target.value));
                  setSelectedPollingCenterFilter("");
                  setCurrentPage(1);
                }}
                disabled={selectedBlockId === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value={0}>All Mandals</option>
                {mandals.map((mandal) => (
                  <option key={mandal.id} value={mandal.id}>
                    {mandal.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Polling Center
              </label>
              <select
                value={selectedPollingCenterFilter}
                onChange={(e) => {
                  setSelectedPollingCenterFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                Search Polling Centers
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
                  placeholder="Search by polling center name or location..."
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

        {/* Active Filter Indicator */}
        {showPollingCentersWithoutUsers && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="text-sm font-medium text-orange-800">
                  Showing only polling centers without users (
                  {
                    pollingCenters.filter((pc) => (pc.user_count || 0) === 0)
                      .length
                  }{" "}
                  polling centers)
                </span>
              </div>
              <button
                onClick={handlePollingCentersWithoutUsersClick}
                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
              >
                Clear Filter
              </button>
            </div>
          </div>
        )}

        {/* Polling Center List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {isLoadingAllPollingCenters ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading polling centers...</p>
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="mt-2 text-gray-500 font-medium">
                No polling centers found
              </p>
              <div className="mt-4 text-xs text-gray-400 space-y-1">
                <p>Debug Info:</p>
                <p>Total polling centers: {allPollingCenters.length}</p>
                <p>Filtered polling centers: {pollingCenters.length}</p>
                <p>Search term: "{searchTerm}"</p>
                <p>Selected Assembly: {selectedAssemblyId}</p>
                <p>Selected Block: {selectedBlockId}</p>
                <p>Selected Mandal: {selectedMandalId}</p>
                <p>
                  Without users filter:{" "}
                  {showPollingCentersWithoutUsers ? "ON" : "OFF"}
                </p>
              </div>
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
                        Parent Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Level Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Display Name
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedPollingCenters.map((pollingCenter, index) => (
                      <>
                        <tr
                          key={pollingCenter.id}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {pollingCenter.mandalName}
                            </div>
                            <div className="text-xs text-gray-500">Mandal</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Polling Center
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
                          <td className="px-6 py-4 whitespace-nowrap">
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
                          </td>
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
                                pollingCenter.mandalName || "Unknown Mandal"
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
                              colSpan={7}
                            />
                          )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
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
                              filteredPollingCenters.length
                            )}
                          </span>{" "}
                          of{" "}
                          <span className="font-medium">
                            {filteredPollingCenters.length}
                          </span>{" "}
                          results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Previous</span>
                            <svg
                              className="h-5 w-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i + 1}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === i + 1
                                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                          <button
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(prev + 1, totalPages)
                              )
                            }
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Next</span>
                            <svg
                              className="h-5 w-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </nav>
                      </div>
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
