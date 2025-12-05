import { useState, useEffect, useRef } from "react";
import type { HierarchyChild } from "../types/hierarchy";
import UserDetailsModal from "./UserDetailsModal";

interface HierarchyTableProps {
  data: HierarchyChild[];
  loading: boolean;
  error: string | null;
  searchInput: string;
  onSearchChange: (search: string) => void;
  onSort: (
    sortBy: "location_name" | "total_users" | "active_users",
    order: "asc" | "desc"
  ) => void;
  onPageChange: (page: number) => void;
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  title: string;
  emptyMessage?: string;
  stateName?: string;
  districtName?: string;
  parentName?: string;
  districts?: HierarchyChild[];
  selectedDistrict?: string;
  onDistrictChange?: (districtId: string) => void;
  assemblies?: HierarchyChild[];
  selectedAssembly?: string;
  onAssemblyChange?: (assemblyId: string) => void;
  blocks?: HierarchyChild[];
  selectedBlock?: string;
  onBlockChange?: (blockId: string) => void;
  assemblyName?: string;
  blockName?: string;
  onAssignUsers?: (locationId: string, locationName: string) => void;
  showAssignButton?: boolean;
  onUploadVoters?: (assemblyId: number, assemblyName: string) => void;
  showUploadVotersButton?: boolean;
}

export default function HierarchyTable({
  data,
  loading,
  error,
  searchInput,
  onSearchChange,
  onSort,
  onPageChange,
  currentPage,
  totalItems,
  itemsPerPage,
  title,
  emptyMessage = "No data available",
  stateName,
  districtName,
  parentName,
  districts = [],
  selectedDistrict = "",
  onDistrictChange,
  assemblies = [],
  selectedAssembly = "",
  onAssemblyChange,
  blocks = [],
  selectedBlock = "",
  onBlockChange,
  assemblyName = "",
  blockName = "",
  onAssignUsers,
  showAssignButton = false,
  onUploadVoters,
  showUploadVotersButton = false,
}: HierarchyTableProps) {
  const isAssemblyView = title?.toLowerCase().includes("assembly");
  const [sortField, setSortField] = useState<
    "location_name" | "total_users" | "active_users"
  >("location_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedUsers, setSelectedUsers] = useState<{
    users: HierarchyChild["users"];
    locationName: string;
    locationId: number;
    locationType: HierarchyChild["location_type"];
  } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleSort = (field: typeof sortField) => {
    const newOrder =
      sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(newOrder);
    onSort(field, newOrder);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) {
      return (
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
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }
    return sortOrder === "asc" ? (
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
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
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
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
        <div className="flex items-center">
          <svg
            className="w-6 h-6 text-red-500 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-red-800 font-semibold">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-sky-400 to-sky-500 rounded-lg shadow-lg p-4 sm:p-5 text-white">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{title}</h1>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
        <div
          className={`grid grid-cols-1 ${blocks.length > 0 && onBlockChange
            ? "sm:grid-cols-3 lg:grid-cols-5"
            : assemblies.length > 0 && onAssemblyChange
              ? "sm:grid-cols-2 lg:grid-cols-4"
              : districts.length > 0 && onDistrictChange
                ? "sm:grid-cols-2 lg:grid-cols-3"
                : "sm:grid-cols-3"
            } gap-3`}
        >
          {/* State Field (Disabled) */}
          {stateName && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={stateName || parentName || "N/A"}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
          )}

          {/* District Dropdown - Only show if districts array is provided */}
          {districts.length > 0 && onDistrictChange && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isAssemblyView ? "District" : "District"}
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => onDistrictChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">
                  {isAssemblyView ? "Select District" : "Select District"}
                </option>
                {districts.map((district) => (
                  <option
                    key={district.location_id}
                    value={district.location_id}
                  >
                    {district.location_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* District Field (Disabled) - Only show when districtName is provided */}
          {districtName && !(districts.length > 0 && onDistrictChange) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District
              </label>
              <input
                type="text"
                value={districtName || parentName || "N/A"}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
          )}

          {/* Assembly Dropdown - Only show if assemblies are provided */}
          {assemblies.length > 0 && onAssemblyChange && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assembly
              </label>
              <select
                value={selectedAssembly}
                onChange={(e) => onAssemblyChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          )}

          {/* Block Dropdown - Only show if blocks are provided */}
          {blocks.length > 0 && onBlockChange && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Block
              </label>
              <select
                value={selectedBlock}
                onChange={(e) => onBlockChange(e.target.value)}
                disabled={!selectedAssembly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${!selectedAssembly
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                  : "bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  }`}
              >
                <option value="">Select Block</option>
                {blocks.map((block) => (
                  <option key={block.location_id} value={block.location_id}>
                    {block.location_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Bar - Always in the same row */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
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
                placeholder="Search by name..."
                value={searchInput}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-5 w-5"
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  S.No
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {/* Assembly sidebar: replace 'State' with 'District' */}
                  {blockName
                    ? "Assembly / Block"
                    : isAssemblyView && stateName
                      ? "District"
                      : assemblyName
                        ? "Assembly"
                        : stateName
                          ? "State"
                          : districtName
                            ? "District"
                            : "Location"}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("location_name")}
                    className="flex items-center space-x-2 hover:text-blue-600 transition-colors"
                  >
                    <span>
                      {blockName
                        ? "Mandal"
                        : isAssemblyView && stateName
                          ? "Assembly"
                          : assemblyName
                            ? "Block"
                            : stateName
                              ? "District"
                              : districtName
                                ? "Assembly"
                                : "Name"}
                    </span>
                    <SortIcon field="location_name" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("total_users")}
                    className="flex items-center space-x-2 hover:text-blue-600 transition-colors"
                  >
                    <span>Total Users</span>
                    <SortIcon field="total_users" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("active_users")}
                    className="flex items-center space-x-2 hover:text-blue-600 transition-colors"
                  >
                    <span>Active Users</span>
                    <SortIcon field="active_users" />
                  </button>
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
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
                      {emptyMessage}
                    </p>
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr
                    key={item.location_id}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {blockName
                        ? `${assemblyName} / ${blockName}`
                        : assemblyName ||
                        districtName ||
                        (districts.length > 0 && item.parent_id
                          ? districts.find((d) => d.location_id === item.parent_id)?.location_name
                          : null) ||
                        stateName ||
                        parentName ||
                        "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.location_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.location_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (item.users && item.users.length > 0) {
                            setSelectedUsers({
                              users: item.users || [],
                              locationName: item.location_name,
                              locationId: item.location_id,
                              locationType: item.location_type,
                            });
                          }
                        }}
                        disabled={!item.users || item.users.length === 0}
                        className={`flex items-center ${item.users && item.users.length > 0
                          ? "cursor-pointer hover:text-blue-600"
                          : "cursor-default"
                          }`}
                        title={
                          item.users && item.users.length > 0
                            ? "Click to view users"
                            : "No users assigned"
                        }
                      >
                        <svg
                          className="w-4 h-4 text-blue-500 mr-2"
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
                        <span className="text-sm font-medium text-gray-900">
                          {item.total_users}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-green-600">
                          {item.active_users}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="relative inline-block text-left" ref={openMenuId === item.location_id ? menuRef : null}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === item.location_id ? null : item.location_id)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transition-all duration-200 group"
                          title="Actions"
                        >
                          <svg
                            className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>

                        {openMenuId === item.location_id && (
                          <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl shadow-2xl bg-white border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="py-2" role="menu">
                              <button
                                onClick={() => {
                                  setSelectedUsers({
                                    users: item.users || [],
                                    locationName: item.location_name,
                                    locationId: item.location_id,
                                    locationType: item.location_type,
                                  });
                                  setOpenMenuId(null);
                                }}
                                disabled={!item.users || item.users.length === 0}
                                className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-all ${item.users && item.users.length > 0
                                  ? "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700"
                                  : "text-gray-300 cursor-not-allowed bg-gray-50"
                                  }`}
                                role="menuitem"
                              >
                                <div className={`p-2 rounded-lg ${item.users && item.users.length > 0 ? "bg-blue-100" : "bg-gray-200"}`}>
                                  <svg
                                    className={`w-4 h-4 ${item.users && item.users.length > 0 ? "text-blue-600" : "text-gray-400"}`}
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
                                <div className="flex-1">
                                  <div className="font-medium">View Users</div>
                                  {item.users && item.users.length > 0 && (
                                    <div className="text-xs text-gray-500">{item.users.length} assigned</div>
                                  )}
                                </div>
                              </button>
                              {showAssignButton && onAssignUsers && (
                                <button
                                  onClick={() => {
                                    onAssignUsers(String(item.location_id), item.location_name);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:text-green-700 flex items-center gap-3 transition-all"
                                  role="menuitem"
                                >
                                  <div className="p-2 rounded-lg bg-green-100">
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
                                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                      />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium">Assign Users</div>
                                    <div className="text-xs text-gray-500">Add team members</div>
                                  </div>
                                </button>
                              )}
                              {showUploadVotersButton && onUploadVoters && (
                                <button
                                  onClick={() => {
                                    onUploadVoters(item.location_id, item.location_name);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-700 flex items-center gap-3 transition-all"
                                  role="menuitem"
                                >
                                  <div className="p-2 rounded-lg bg-purple-100">
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
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                      />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium">Upload Voters</div>
                                    <div className="text-xs text-gray-500">Import voter data</div>
                                  </div>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="bg-white rounded-lg shadow-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Showing{" "}
              <span className="font-semibold">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{" "}
              of <span className="font-semibold">{totalItems}</span> results
              {totalPages === 1 && (
                <span className="ml-2 text-gray-500">
                  (Page {currentPage} of {totalPages})
                </span>
              )}
            </span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
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
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* User Details Modal */}
      {selectedUsers && (
        <UserDetailsModal
          users={selectedUsers.users}
          locationName={selectedUsers.locationName}
          locationId={selectedUsers.locationId}
          locationType={selectedUsers.locationType}
          isOpen={true}
          onClose={() => setSelectedUsers(null)}
          onUserDeleted={() => {
            // Close modal and let parent component refresh
            setSelectedUsers(null);
            // Trigger a page refresh to reload data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
