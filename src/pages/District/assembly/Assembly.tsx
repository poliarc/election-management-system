import {
  useHierarchyData,
  useSelectedDistrictId,
} from "../../../hooks/useHierarchyData";
import HierarchyTable from "../../../components/HierarchyTable";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DistrictAssembly() {
  const navigate = useNavigate();
  const districtId = useSelectedDistrictId();
  const [districtInfo, setDistrictInfo] = useState<{
    state: string;
    district: string;
  }>({ state: "", district: "" });
  const [showWithoutUsers, setShowWithoutUsers] = useState(false);
  const [showAssignedUsers, setShowAssignedUsers] = useState(false);

  const {
    data,
    loading,
    error,
    totalChildren,
    parentName,
    setPage,
    setSearchInput,
    searchInput,
    setSortBy,
    setOrder,
    currentPage,
    limit,
  } = useHierarchyData(districtId, 10);

  // Get district and state info from localStorage
  useEffect(() => {
    try {
      const authState = localStorage.getItem("auth_state");
      if (authState) {
        const parsed = JSON.parse(authState);
        const selectedAssignment = parsed.selectedAssignment;
        if (selectedAssignment) {
          setDistrictInfo({
            state: selectedAssignment.parentLevelName || "N/A",
            district: selectedAssignment.levelName || "N/A",
          });
        }
      }
    } catch (err) {
      console.error("Error reading district info:", err);
    }
  }, []);

  const handleSort = (
    sortBy: "location_name" | "total_users" | "active_users",
    order: "asc" | "desc"
  ) => {
    setSortBy(sortBy);
    setOrder(order);
  };

  const handleAssignUsers = (assemblyId: string, assemblyName: string) => {
    // Get stateId from localStorage
    let stateId = null;
    try {
      const authState = localStorage.getItem("auth_state");
      if (authState) {
        const parsed = JSON.parse(authState);
        const selectedAssignment = parsed.selectedAssignment;
        if (selectedAssignment?.parentId) {
          stateId = selectedAssignment.parentId;
        }
      }
    } catch (err) {
      console.error("Error reading state info:", err);
    }

    navigate(
      `/district/assembly/assign?assemblyId=${assemblyId}&assemblyName=${encodeURIComponent(
        assemblyName
      )}&stateId=${stateId}`
    );
  };

  // Calculate summary statistics
  const totalUsers = data.reduce(
    (sum, assembly) => sum + assembly.total_users,
    0
  );
  const assembliesWithoutUsers = data.filter(
    (assembly) => assembly.total_users === 0
  ).length;

  const filteredAssemblies = showWithoutUsers
    ? data.filter((assembly) => assembly.total_users === 0)
    : showAssignedUsers
    ? data.filter((assembly) => assembly.total_users > 0)
    : data;

  useEffect(() => {
    setPage(1);
  }, [showWithoutUsers, showAssignedUsers, setPage]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleWithoutUsersClick = () => {
    if (assembliesWithoutUsers === 0) return;
    const newValue = !showWithoutUsers;
    setShowWithoutUsers(newValue);
    if (newValue) {
      setShowAssignedUsers(false);
      setSearchInput("");
    }
    setPage(1);
  };

  const handleAssignedUsersClick = () => {
    if (totalUsers === 0) return;
    const newValue = !showAssignedUsers;
    setShowAssignedUsers(newValue);
    if (newValue) {
      setShowWithoutUsers(false);
      setSearchInput("");
    }
    setPage(1);
  };

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
              District: {districtInfo.district} | State: {districtInfo.state}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            {/* Total Assemblies Card */}
            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Total Assemblies
                </p>
                <p className="text-xl sm:text-2xl font-semibold mt-1">
                  {formatNumber(totalChildren)}
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

            {/* Total Users Card */}
            <div
              onClick={handleAssignedUsersClick}
              className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${
                totalUsers > 0
                  ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-green-50"
                  : "cursor-default"
              } ${
                showAssignedUsers ? "ring-2 ring-green-500 bg-green-50" : ""
              }`}
              title={
                totalUsers > 0
                  ? "Click to view assemblies with assigned users"
                  : "No assigned users"
              }
            >
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Total Users
                  {showAssignedUsers && (
                    <span className="ml-2 text-green-600 font-semibold">
                      (Filtered)
                    </span>
                  )}
                </p>
                <p
                  className={`text-xl sm:text-2xl font-semibold mt-1 ${
                    totalUsers > 0 ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {formatNumber(totalUsers)}
                </p>
              </div>
              <div
                className={`rounded-full p-1.5 ${
                  totalUsers > 0 ? "bg-green-50" : "bg-gray-50"
                }`}
              >
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

            {/* Assemblies Without Users Card */}
            <div
              onClick={handleWithoutUsersClick}
              className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${
                assembliesWithoutUsers > 0
                  ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-red-50"
                  : "cursor-default"
              } ${
                showWithoutUsers ? "ring-2 ring-red-500 bg-red-50" : ""
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
                  {showWithoutUsers && (
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

      {(showWithoutUsers || showAssignedUsers) && (
        <div
          className={`mb-2 flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
            showWithoutUsers
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-green-50 border-green-200 text-green-700"
          }`}
        >
          <span>
            {showWithoutUsers
              ? "Filtering assemblies without users"
              : "Filtering assemblies with assigned users"}
          </span>
          <button
            type="button"
            onClick={() => {
              setShowWithoutUsers(false);
              setShowAssignedUsers(false);
            }}
            className="underline"
          >
            Clear filter
          </button>
        </div>
      )}

      <HierarchyTable
        data={filteredAssemblies}
        loading={loading}
        error={error}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onSort={handleSort}
        onPageChange={setPage}
        currentPage={currentPage}
        totalItems={
          showWithoutUsers ? filteredAssemblies.length : totalChildren
        }
        itemsPerPage={limit}
        title="Assembly List"
        emptyMessage="No assemblies found for this district"
        stateName={districtInfo.state}
        districtName={districtInfo.district}
        parentName={parentName}
        onAssignUsers={handleAssignUsers}
        showAssignButton={true}
        hideHeader={true}
        hideActiveUsersColumn={true}
      />
    </div>
  );
}
