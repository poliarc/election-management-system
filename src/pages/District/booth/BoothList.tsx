import { useState, useEffect } from "react";
import { useGetBlockHierarchyQuery } from "../../../store/api/blockTeamApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import InlineUserDisplay from "../../../components/InlineUserDisplay";
import type { HierarchyUser } from "../../../types/hierarchy";

type HierarchyNode = Record<string, any>;
type BlockResult = { assembly: HierarchyNode; blocks: HierarchyNode[] };
type MandalResult = {
  assembly: HierarchyNode;
  block: HierarchyNode;
  mandals: HierarchyNode[];
};

export default function DistrictBoothList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number>(0);
  const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
  const [selectedMandalId, setSelectedMandalId] = useState<number>(0);
  const [selectedPollingCenterId, setSelectedPollingCenterId] =
    useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // State for inline user display
  const [expandedBoothId, setExpandedBoothId] = useState<number | null>(null);
  const [boothUsers, setBoothUsers] = useState<Record<number, HierarchyUser[]>>(
    {}
  );

  // State for all booths (similar to State implementation)
  const [allBooths, setAllBooths] = useState<any[]>([]);
  const [isLoadingAllBooths, setIsLoadingAllBooths] = useState(false);
  const [showBoothsWithoutUsers, setShowBoothsWithoutUsers] = useState(false);

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

  // Function to fetch all booths from the district
  const fetchAllBooths = async () => {
    if (!districtInfo.districtId) return;

    setIsLoadingAllBooths(true);
    const allBoothsData: any[] = [];

    try {
      // Step 1: Fetch all assemblies in the district
      const assembliesResponse = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/user-state-hierarchies/hierarchy/children/${
          districtInfo.districtId
        }?page=1&limit=500`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "auth_access_token"
            )}`,
          },
        }
      );
      const assembliesData = await assembliesResponse.json();

      if (!assembliesData.success || !assembliesData.data?.children) {
        return;
      }

      // Step 2: Fetch all blocks in parallel
      const blockPromises: Promise<BlockResult>[] =
        assembliesData.data.children.map(
          async (assembly: HierarchyNode): Promise<BlockResult> => {
            try {
              const response = await fetch(
                `${
                  import.meta.env.VITE_API_BASE_URL
                }/api/after-assembly-data/assembly/${assembly.location_id}`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem(
                      "auth_access_token"
                    )}`,
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
      const mandalPromises: Promise<MandalResult>[] = [];
      blockResults.forEach(({ assembly, blocks }) => {
        blocks.forEach((block: HierarchyNode) => {
          mandalPromises.push(
            fetch(
              `${
                import.meta.env.VITE_API_BASE_URL
              }/api/user-after-assembly-hierarchy/hierarchy/children/${
                block.id
              }`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                    "auth_access_token"
                  )}`,
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

      const mandalResults = (await Promise.all(
        mandalPromises
      )) as MandalResult[];

      // Step 4: Fetch all booths in parallel
      const boothPromises: Promise<HierarchyNode[]>[] = [];
      mandalResults.forEach(({ assembly, block, mandals }) => {
        (mandals || []).forEach((mandal: HierarchyNode) => {
          boothPromises.push(
            fetch(
              `${
                import.meta.env.VITE_API_BASE_URL
              }/api/user-after-assembly-hierarchy/hierarchy/children/${
                mandal.id
              }`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                    "auth_access_token"
                  )}`,
                },
              }
            )
              .then((response) => response.json())
              .then((data) => {
                const children = (data.children || []) as HierarchyNode[];

                if (data.success && children.length > 0) {
                  const firstChild = children[0];

                  if (firstChild.levelName === "Booth") {
                    // Direct booths under mandal
                    return children.map((booth: HierarchyNode) => ({
                      ...booth,
                      hierarchyPath: `${districtInfo.districtName} → ${assembly.location_name} → ${block.displayName} → ${mandal.displayName}`,
                      sourceLevel: "Mandal",
                      districtName: districtInfo.districtName,
                      assemblyName: assembly.location_name,
                      blockName: block.displayName,
                      mandalName: mandal.displayName,
                    }));
                  }

                  // These are polling centers - fetch booths from each
                  const pollingCenterPromises: Promise<HierarchyNode[]>[] =
                    children.map((pollingCenter: HierarchyNode) =>
                      fetch(
                        `${
                          import.meta.env.VITE_API_BASE_URL
                        }/api/user-after-assembly-hierarchy/hierarchy/children/${
                          pollingCenter.id
                        }`,
                        {
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                              "auth_access_token"
                            )}`,
                          },
                        }
                      )
                        .then((response) => response.json())
                        .then((boothData) => {
                          const boothChildren = (boothData.children ||
                            []) as HierarchyNode[];

                          if (boothData.success && boothChildren.length > 0) {
                            return boothChildren.map(
                              (booth: HierarchyNode) => ({
                                ...booth,
                                hierarchyPath: `${districtInfo.districtName} → ${assembly.location_name} → ${block.displayName} → ${mandal.displayName} → ${pollingCenter.displayName}`,
                                sourceLevel: "Polling Center",
                                districtName: districtInfo.districtName,
                                assemblyName: assembly.location_name,
                                blockName: block.displayName,
                                mandalName: mandal.displayName,
                                pollingCenterName: pollingCenter.displayName,
                              })
                            );
                          }
                          return [];
                        })
                        .catch((error) => {
                          console.error(
                            `Error fetching booths for polling center ${pollingCenter.id}:`,
                            error
                          );
                          return [];
                        })
                    );

                  return Promise.all(pollingCenterPromises).then((results) =>
                    results.flat()
                  );
                }
                return [];
              })
              .catch((error) => {
                console.error(
                  `Error fetching children for mandal ${mandal.id}:`,
                  error
                );
                return [];
              })
          );
        });
      });

      // Wait for all booth requests to complete
      const boothResults = await Promise.all(boothPromises);

      // Flatten all booth results
      const flatBooths = boothResults.flat();
      allBoothsData.push(...flatBooths);

      setAllBooths(allBoothsData);
    } catch (error) {
      console.error("Error fetching all booths:", error);
    } finally {
      setIsLoadingAllBooths(false);
    }
  };

  // Fetch all booths when district info is available
  useEffect(() => {
    if (districtInfo.districtId) {
      fetchAllBooths();
    }
  }, [districtInfo.districtId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch assemblies for the district
  useEffect(() => {
    const fetchAssemblies = async () => {
      if (!districtInfo.districtId) {
        setAssemblies([]);
        return;
      }
      try {
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
        if (data.success && data.data) {
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
        setAssemblies([]);
      }
    };
    fetchAssemblies();
  }, [districtInfo.districtId]);

  // No auto-selection for assemblies - let user choose

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
        setBlocks([]);
      }
    };
    fetchBlocks();
  }, [selectedAssemblyId]);

  // No auto-selection for blocks - let user choose

  // Fetch mandals for selected block
  const { data: mandalHierarchyData } = useGetBlockHierarchyQuery(
    selectedBlockId,
    { skip: !selectedBlockId }
  );

  const mandals = mandalHierarchyData?.children || [];

  // No auto-selection for mandals - let user choose

  // Fetch polling centers for selected mandal
  const { data: pollingCenterHierarchyData } = useGetBlockHierarchyQuery(
    selectedMandalId,
    { skip: !selectedMandalId }
  );

  const pollingCenters = pollingCenterHierarchyData?.children || [];

  // No auto-selection for polling centers - let user choose

  // Legacy booth fetching for selected polling center (kept for backward compatibility)
  useGetBlockHierarchyQuery(selectedPollingCenterId, {
    skip: !selectedPollingCenterId,
  });

  // Use all booths by default, or filtered booths based on selected hierarchy levels
  const booths = (() => {
    // If any filter is selected, filter from allBooths based on hierarchy
    if (
      selectedAssemblyId > 0 ||
      selectedBlockId > 0 ||
      selectedMandalId > 0 ||
      selectedPollingCenterId > 0
    ) {
      return allBooths.filter((booth) => {
        // Check assembly filter using pre-computed name
        if (selectedAssemblyId > 0) {
          const selectedAssembly = assemblies.find(
            (a) =>
              a.id === selectedAssemblyId ||
              a.location_id === selectedAssemblyId
          );
          if (
            !selectedAssembly ||
            booth.assemblyName !== selectedAssembly.displayName
          ) {
            return false;
          }
        }

        // Check block filter using pre-computed name
        if (selectedBlockId > 0) {
          const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
          if (!selectedBlock || booth.blockName !== selectedBlock.displayName) {
            return false;
          }
        }

        // Check mandal filter using pre-computed name
        if (selectedMandalId > 0) {
          const selectedMandal = mandals.find((m) => m.id === selectedMandalId);
          if (
            !selectedMandal ||
            booth.mandalName !== selectedMandal.displayName
          ) {
            return false;
          }
        }

        // Check polling center filter using pre-computed name (if applicable)
        if (selectedPollingCenterId > 0) {
          const selectedPollingCenter = pollingCenters.find(
            (pc) => pc.id === selectedPollingCenterId
          );
          if (
            !selectedPollingCenter ||
            booth.pollingCenterName !== selectedPollingCenter.displayName
          ) {
            return false;
          }
        }

        return true;
      });
    }

    // Return all booths if no filters are selected
    return allBooths;
  })();

  // Handle booths without users filter
  const handleBoothsWithoutUsersClick = () => {
    const boothsWithoutUsersCount = booths.filter(
      (booth) => (booth.user_count || 0) === 0
    ).length;

    if (boothsWithoutUsersCount > 0) {
      setShowBoothsWithoutUsers(!showBoothsWithoutUsers);
      setCurrentPage(1); // Reset to page 1
    }
  };

  const filteredBooths = booths.filter((booth) => {
    const matchesSearch =
      booth.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booth.hierarchyPath &&
        booth.hierarchyPath.toLowerCase().includes(searchTerm.toLowerCase()));

    // Apply booths without users filter
    const matchesWithoutUsersFilter = showBoothsWithoutUsers
      ? (booth.user_count || 0) === 0
      : true;

    return matchesSearch && matchesWithoutUsersFilter;
  });

  const handleViewUsers = async (boothId: number) => {
    // If already expanded, collapse it
    if (expandedBoothId === boothId) {
      setExpandedBoothId(null);
      return;
    }

    // If users already loaded, just expand
    if (boothUsers[boothId]) {
      setExpandedBoothId(boothId);
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/user-after-assembly-hierarchy/after-assembly/${boothId}`,
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
        setBoothUsers((prev) => ({
          ...prev,
          [boothId]: data.data.users,
        }));
        setExpandedBoothId(boothId);
      } else {
        console.log("Booth API Error or No Users:", data);
      }
    } catch (error) {
      console.error(`Error fetching users for booth ${boothId}:`, error);
    }
  };

  const totalPages = Math.ceil(filteredBooths.length / itemsPerPage);
  const paginatedBooths = filteredBooths.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-1">
      <div className="max-w-7xl mx-auto">
        {/* Header with Stats Cards */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-3 sm:p-3 mb-1 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="shrink-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                Booth List
              </h1>
              <p className="text-purple-100 text-xs sm:text-sm mt-1">
                District: {districtInfo.districtName} | State:{" "}
                {districtInfo.stateName}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              {/* Total Booths Card */}
              <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Total Booths
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold mt-1">
                    {booths.length}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-full p-1.5">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600"
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
              </div>

              {/* Total Users Card */}
              <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-green-600 mt-1">
                    {booths.reduce(
                      (sum, booth) => sum + (booth.user_count || 0),
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

              {/* Booths Without Users Card */}
              <div
                className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${
                  booths.filter((booth) => (booth.user_count || 0) === 0)
                    .length > 0
                    ? "cursor-pointer hover:shadow-lg hover:scale-105"
                    : "cursor-default"
                } ${
                  showBoothsWithoutUsers
                    ? "ring-2 ring-orange-500 bg-orange-50"
                    : ""
                }`}
                onClick={handleBoothsWithoutUsersClick}
                title={
                  booths.filter((booth) => (booth.user_count || 0) === 0)
                    .length > 0
                    ? showBoothsWithoutUsers
                      ? "Click to show all booths"
                      : "Click to show only booths without users"
                    : "No booths without users"
                }
              >
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Booths Without Users
                    {showBoothsWithoutUsers && (
                      <span className="ml-2 text-orange-600 font-semibold">
                        (Filtered)
                      </span>
                    )}
                  </p>
                  <p
                    className={`text-xl sm:text-2xl font-semibold mt-1 ${
                      booths.filter((booth) => (booth.user_count || 0) === 0)
                        .length > 0
                        ? showBoothsWithoutUsers
                          ? "text-orange-600"
                          : "text-red-600"
                        : "text-gray-400"
                    }`}
                  >
                    {
                      booths.filter((booth) => (booth.user_count || 0) === 0)
                        .length
                    }
                  </p>
                </div>
                <div
                  className={`rounded-full p-1.5 ${
                    booths.filter((booth) => (booth.user_count || 0) === 0)
                      .length > 0
                      ? showBoothsWithoutUsers
                        ? "bg-orange-50"
                        : "bg-red-50"
                      : "bg-gray-50"
                  }`}
                >
                  {booths.filter((booth) => (booth.user_count || 0) === 0)
                    .length > 0 ? (
                    showBoothsWithoutUsers ? (
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
                State
              </label>
              <input
                type="text"
                value={districtInfo.stateName}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
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
                  setSelectedPollingCenterId(0);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  setSelectedPollingCenterId(0);
                  setCurrentPage(1);
                }}
                disabled={selectedAssemblyId === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  setSelectedPollingCenterId(0);
                  setCurrentPage(1);
                }}
                disabled={selectedBlockId === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                value={selectedPollingCenterId}
                onChange={(e) => {
                  setSelectedPollingCenterId(Number(e.target.value));
                  setCurrentPage(1);
                }}
                disabled={selectedMandalId === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value={0}>All Polling Centers</option>
                {pollingCenters.map((pc) => (
                  <option key={pc.id} value={pc.id}>
                    {pc.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Booths
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
                placeholder="Search by booth name or location..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Active Filter Indicator */}
          {showBoothsWithoutUsers && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
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
                    Showing only booths without users (
                    {
                      booths.filter((booth) => (booth.user_count || 0) === 0)
                        .length
                    }{" "}
                    booths)
                  </span>
                </div>
                <button
                  onClick={handleBoothsWithoutUsersClick}
                  className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Booth List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {isLoadingAllBooths ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading booths...</p>
            </div>
          ) : filteredBooths.length === 0 ? (
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
              <p className="mt-2 text-gray-500 font-medium">No booths found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-purple-50 to-purple-100 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {booths.length > 0 && booths[0].pollingCenterName
                          ? "Polling Center"
                          : booths.length > 0 && booths[0].mandalName
                          ? "Mandal"
                          : "Parent Location"}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Level Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Display Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      {/* <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Created Date
                                            </th>*/}
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedBooths.map((booth, index) => (
                      <>
                        <tr
                          key={booth.id}
                          className="hover:bg-purple-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {booth.pollingCenterName ||
                                booth.mandalName ||
                                "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booth.pollingCenterName
                                ? "Polling Center"
                                : "Mandal"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Booth
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="bg-purple-100 p-2 rounded-lg">
                                <svg
                                  className="w-5 h-5 text-purple-600"
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
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleViewUsers(booth.id)}
                                className={`inline-flex items-center p-1 rounded-md transition-colors mr-2 ${
                                  expandedBoothId === booth.id
                                    ? "text-purple-700 bg-purple-100"
                                    : "text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                                }`}
                                title={
                                  expandedBoothId === booth.id
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
                                {booth.user_count || 0}
                              </span>
                            </div>
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
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleViewUsers(booth.id)}
                              className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
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
                              View
                            </button>
                          </td>
                        </tr>

                        {/* Inline User Display */}
                        {expandedBoothId === booth.id &&
                          boothUsers[booth.id] && (
                            <InlineUserDisplay
                              users={boothUsers[booth.id]}
                              locationName={booth.displayName}
                              locationId={booth.id}
                              locationType="Booth"
                              parentLocationName={
                                booth.pollingCenterName || booth.mandalName
                              }
                              parentLocationType={
                                booth.pollingCenterName
                                  ? "PollingCenter"
                                  : "Mandal"
                              }
                              onUserDeleted={() => {
                                // Refresh user counts after deletion
                                setExpandedBoothId(null);
                                setBoothUsers((prev) => {
                                  const updated = { ...prev };
                                  delete updated[booth.id];
                                  return updated;
                                });
                                window.location.reload();
                              }}
                              onClose={() => setExpandedBoothId(null)}
                              colSpan={7}
                            />
                          )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredBooths.length > 0 && (
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
                            filteredBooths.length
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold">
                          {filteredBooths.length}
                        </span>{" "}
                        results
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-sm font-medium text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
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
    </div>
  );
}
