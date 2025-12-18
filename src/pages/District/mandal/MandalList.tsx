import { useState, useEffect } from "react";
import { useGetBlockHierarchyQuery } from "../../../store/api/blockTeamApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import InlineUserDisplay from "../../../components/InlineUserDisplay";
import type { HierarchyUser } from "../../../types/hierarchy";

export default function DistrictMandalList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number>(0);
  const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
  const [selectedMandalFilter, setSelectedMandalFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  // State for inline user display
  const [expandedMandalId, setExpandedMandalId] = useState<number | null>(null);
  const [mandalUsers, setMandalUsers] = useState<
    Record<number, HierarchyUser[]>
  >({});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [assemblies, setAssemblies] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [blocks, setBlocks] = useState<any[]>([]);

  const selectedAssignment = useSelector(
    (state: RootState) => state.auth.selectedAssignment
  );

  const [districtInfo, setDistrictInfo] = useState({
    districtName: "",
    districtId: 0,
    stateMasterDataId: 0,
  });

  useEffect(() => {
    if (selectedAssignment) {
      setDistrictInfo({
        districtName:
          selectedAssignment.levelName || selectedAssignment.displayName || "",
        districtId: selectedAssignment.level_id || 0,
        stateMasterDataId: selectedAssignment.stateMasterData_id || 0,
      });
    }
  }, [selectedAssignment]);

  // Fetch assemblies for the district using user-state-hierarchies API
  useEffect(() => {
    const fetchAssemblies = async () => {
      if (!districtInfo.stateMasterDataId) {
        setAssemblies([]);
        return;
      }
      try {
        console.log(
          "Fetching assemblies for district stateMasterData ID:",
          districtInfo.stateMasterDataId
        );
        const response = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/user-state-hierarchies/hierarchy/children/${
            districtInfo.stateMasterDataId
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  }, [districtInfo.stateMasterDataId]);

  // Auto-select first assembly when assemblies load
  useEffect(() => {
    if (assemblies.length > 0 && selectedAssemblyId === 0) {
      const firstAssembly = assemblies[0];
      setSelectedAssemblyId(firstAssembly.location_id || firstAssembly.id);
    }
  }, [assemblies, selectedAssemblyId]);

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

  // Auto-select first block when blocks load
  useEffect(() => {
    if (blocks.length > 0 && selectedAssemblyId > 0 && selectedBlockId === 0) {
      setSelectedBlockId(blocks[0].id);
    }
  }, [blocks, selectedAssemblyId, selectedBlockId]);

  // Fetch mandals for selected block
  const {
    data: hierarchyData,
    isLoading: loadingMandals,
    error,
  } = useGetBlockHierarchyQuery(selectedBlockId, { skip: !selectedBlockId });

  const mandals = hierarchyData?.children || [];

  const filteredMandals = mandals.filter((mandal) => {
    const matchesSearch = mandal.displayName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      selectedMandalFilter === "" ||
      mandal.id.toString() === selectedMandalFilter;
    return matchesSearch && matchesFilter;
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

    // Find the mandal to get its users
    const mandal = mandals.find((m) => m.id === mandalId);
    if (mandal && mandal.assigned_users) {
      setMandalUsers((prev) => ({
        ...prev,
        [mandalId]: mandal.assigned_users,
      }));
      setExpandedMandalId(mandalId);
    } else {
      console.log("No users found for mandal:", mandalId);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-1">
      <div className="max-w-7xl mx-auto">
        {/* Header with Stats Cards */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-3 mb-3 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="shrink-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                Mandal List
              </h1>
              <p className="text-blue-100 mt-1 text-xs sm:text-sm">
                District: {districtInfo.districtName}
              </p>
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

              {/* Mandals Without Users Card */}
              <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Mandals Without Users
                  </p>
                  <p
                    className={`text-xl sm:text-2xl font-semibold mt-1 ${
                      mandals.filter((mandal) => (mandal.user_count || 0) === 0)
                        .length > 0
                        ? "text-red-600"
                        : "text-gray-400"
                    }`}
                  >
                    {
                      mandals.filter((mandal) => (mandal.user_count || 0) === 0)
                        .length
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-3 mb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                Select Assembly <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAssemblyId}
                onChange={(e) => {
                  const assemblyId = Number(e.target.value);
                  setSelectedAssemblyId(assemblyId);
                  setSelectedBlockId(0);
                  setSelectedMandalFilter("");
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          {!selectedBlockId ? (
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-2 text-gray-500 font-medium">
                Please select Assembly and Block to view mandals
              </p>
            </div>
          ) : loadingMandals ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading mandals...</p>
            </div>
          ) : error ? (
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
                        Display Name
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
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
                              {hierarchyData?.parent.displayName}
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                mandal.isActive === 1
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {mandal.isActive === 1 ? "Active" : "Inactive"}
                            </span>
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
                                hierarchyData?.parent.displayName
                              }
                              parentLocationType="Block"
                              onUserDeleted={() => {
                                // Refresh user data after deletion
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
                              let pageNum: number;
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
