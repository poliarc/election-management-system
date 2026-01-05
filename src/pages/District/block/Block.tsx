import { useState, useEffect } from "react";
import { useGetBlocksByAssemblyQuery } from "../../../store/api/blockApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useHierarchyData } from "../../../hooks/useHierarchyData";
import InlineUserDisplay from "../../../components/InlineUserDisplay";
import type { HierarchyUser } from "../../../types/hierarchy";

export default function DistrictBlock() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const selectedAssignment = useSelector(
    (state: RootState) => state.auth.selectedAssignment
  );

  const [districtInfo, setDistrictInfo] = useState({
    districtName: "",
    stateName: "",
    districtId: 0,
  });

  useEffect(() => {
    if (selectedAssignment) {
      setDistrictInfo({
        districtName: selectedAssignment.levelName,
        stateName: selectedAssignment.parentLevelName || "",
        districtId: selectedAssignment.stateMasterData_id,
      });
    }
  }, [selectedAssignment]);

  // Get assemblies for the district
  const assembliesData = useHierarchyData(districtInfo.districtId, 100);
  const assemblies = assembliesData.data || [];

  // Auto-select first assembly when assemblies load
  useEffect(() => {
    if (assemblies.length > 0 && !selectedAssemblyId) {
      setSelectedAssemblyId(assemblies[0].location_id);
    }
  }, [assemblies, selectedAssemblyId]);

  // Get blocks for selected assembly
  const {
    data: blocks = [],
    isLoading,
    error,
  } = useGetBlocksByAssemblyQuery(selectedAssemblyId!, {
    skip: !selectedAssemblyId,
  });

  // Fetch user counts for all blocks
  const [blockUserCounts, setBlockUserCounts] = useState<
    Record<number, number>
  >({});

  // State for inline user display
  const [expandedBlockId, setExpandedBlockId] = useState<number | null>(null);
  const [blockUsers, setBlockUsers] = useState<Record<number, HierarchyUser[]>>(
    {}
  );

  useEffect(() => {
    const fetchUserCounts = async () => {
      const counts: Record<number, number> = {};
      for (const block of blocks) {
        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_API_BASE_URL
            }/api/user-after-assembly-hierarchy/after-assembly/${block.id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem(
                  "auth_access_token"
                )}`,
              },
            }
          );
          const data = await response.json();
          counts[block.id] =
            data.data?.total_users || data.data?.users?.length || 0;
        } catch (error) {
          console.error(`Error fetching users for block ${block.id}:`, error);
          counts[block.id] = 0;
        }
      }
      setBlockUserCounts(counts);
    };

    if (blocks.length > 0) {
      fetchUserCounts();
    }
  }, [blocks]);

  const handleViewUsers = async (blockId: number) => {
    // If already expanded, collapse it
    if (expandedBlockId === blockId) {
      setExpandedBlockId(null);
      return;
    }

    // If users already loaded, just expand
    if (blockUsers[blockId]) {
      setExpandedBlockId(blockId);
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/user-after-assembly-hierarchy/after-assembly/${blockId}`,
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
        setBlockUsers((prev) => ({
          ...prev,
          [blockId]: data.data.users,
        }));
        setExpandedBlockId(blockId);
      } else {
        console.log("Block API Error or No Users:", data);
      }
    } catch (error) {
      console.error(`Error fetching users for block ${blockId}:`, error);
    }
  };

  const filteredBlocks = blocks.filter((block) =>
    block.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBlocks.length / itemsPerPage);
  const paginatedBlocks = filteredBlocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-1 bg-gray-50 min-h-screen">
      <div className="w-full mx-auto">
        {/* Header with Stats Cards */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-3 mb-3 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="shrink-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                Block List
              </h1>
              <p className="text-blue-100 mt-1 text-xs sm:text-sm">
                District: {districtInfo.districtName} | State:{" "}
                {districtInfo.stateName}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              {/* Total Blocks Card */}
              <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Total Blocks
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold mt-1">
                    {blocks.length}
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
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
                    {Object.values(blockUserCounts).reduce(
                      (sum, count) => sum + count,
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

              {/* Blocks Without Users Card */}
              <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Blocks Without Users
                  </p>
                  <p
                    className={`text-xl sm:text-2xl font-semibold mt-1 ${
                      Object.values(blockUserCounts).filter(
                        (count) => count === 0
                      ).length > 0
                        ? "text-red-600"
                        : "text-gray-400"
                    }`}
                  >
                    {
                      Object.values(blockUserCounts).filter(
                        (count) => count === 0
                      ).length
                    }
                  </p>
                </div>
                <div
                  className={`rounded-full p-1.5 ${
                    Object.values(blockUserCounts).filter(
                      (count) => count === 0
                    ).length > 0
                      ? "bg-red-50"
                      : "bg-gray-50"
                  }`}
                >
                  {Object.values(blockUserCounts).filter((count) => count === 0)
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                Assembly <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAssemblyId || ""}
                onChange={(e) => {
                  setSelectedAssemblyId(Number(e.target.value) || null);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Assembly</option>
                {assemblies.map((assembly) => (
                  <option
                    key={assembly.location_id}
                    value={assembly.location_id}
                  >
                    {assembly.location_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Blocks
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
                  placeholder="Search by block name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={!selectedAssemblyId}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Block List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {!selectedAssemblyId ? (
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
                Please select an assembly to view blocks
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading blocks...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>Error loading blocks</p>
            </div>
          ) : filteredBlocks.length === 0 ? (
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
              <p className="mt-2 text-gray-500 font-medium">No blocks found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Assembly
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Block Name
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Users
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedBlocks.map((block, index) => (
                    <>
                      <tr
                        key={block.id}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {block.assemblyName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {block.displayName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleViewUsers(block.id)}
                              className={`inline-flex items-center p-1 rounded-md transition-colors mr-2 ${
                                expandedBlockId === block.id
                                  ? "text-blue-700 bg-blue-100"
                                  : "text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                              }`}
                              title={
                                expandedBlockId === block.id
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
                            {blockUserCounts[block.id] !== undefined ? (
                              <span className="text-sm font-medium text-gray-900">
                                {blockUserCounts[block.id]}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">
                                Loading...
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Inline User Display */}
                      {expandedBlockId === block.id && blockUsers[block.id] && (
                        <InlineUserDisplay
                          users={blockUsers[block.id]}
                          locationName={block.displayName}
                          locationId={block.id}
                          locationType="Block"
                          parentLocationName={block.assemblyName}
                          parentLocationType="Assembly"
                          onUserDeleted={() => {
                            // Refresh user counts after deletion
                            setExpandedBlockId(null);
                            setBlockUsers((prev) => {
                              const updated = { ...prev };
                              delete updated[block.id];
                              return updated;
                            });
                            window.location.reload();
                          }}
                          onClose={() => setExpandedBlockId(null)}
                          colSpan={4}
                        />
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredBlocks.length > 0 && (
          <div className="bg-white rounded-lg shadow-md px-6 py-4 flex items-center justify-between mt-6">
            <div className="flex items-center text-sm text-gray-700">
              <span>
                Showing{" "}
                <span className="font-semibold">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold">
                  {Math.min(currentPage * itemsPerPage, filteredBlocks.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold">{filteredBlocks.length}</span>{" "}
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
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                  })}
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
        )}
      </div>
    </div>
  );
}
