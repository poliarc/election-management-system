import { useEffect, useState } from "react";
import { useSelectedDistrictId } from "../../hooks/useHierarchyData";
import type { HierarchyUser } from "../../types/hierarchy";
import { API_CONFIG } from "../../config/api";
import { useToggleUserStatusMutation } from "../../store/api/profileApi";
import { useTranslation } from "react-i18next";


interface DistrictTeamResponse {
  success: boolean;
  message: string;
  data: {
    location: {
      location_id: number;
      location_name: string;
      location_type: string;
      parent_id: number | null;
    };
    total_users: number;
    active_users: number;
    inactive_users: number;
    users: HierarchyUser[];
  };
}

export default function DistrictTeam() {
  const {t} = useTranslation(); 
  const districtId = useSelectedDistrictId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [districtData, setDistrictData] = useState<
    DistrictTeamResponse["data"] | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<number | string | null>(
    null
  );
  const usersPerPage = 10;
  const [toggleUserStatus] = useToggleUserStatusMutation();

  useEffect(() => {
    const fetchDistrictTeam = async () => {
      if (!districtId) {
        setLoading(false);
        setError("No district selected");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const authState = localStorage.getItem("auth_state");
        const token = authState ? JSON.parse(authState).accessToken : null;

        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await fetch(
          `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/location/${districtId}/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: DistrictTeamResponse = await response.json();

        if (data.success) {
          setDistrictData(data.data);
        } else {
          setError(data.message || "Failed to fetch district team");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDistrictTeam();
  }, [districtId]);

  // Filter users based on search and status
  const filteredUsers =
    districtData?.users.filter((user) => {
      const matchesSearch =
        searchTerm === "" ||
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_id.toString().includes(searchTerm);

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && checkActiveStatus(user.is_active)) ||
        (filterStatus === "inactive" && !checkActiveStatus(user.is_active));

      return matchesSearch && matchesStatus;
    }) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const checkActiveStatus = (value: any): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string")
      return ["active", "1", "true"].includes(value.toLowerCase());
    return false;
  };

  const handleToggleStatus = async (
    user: HierarchyUser,
    targetActive: boolean,
    rowKey: number | string
  ) => {
    const wasActive = checkActiveStatus(user.is_active);
    const activeDelta = targetActive
      ? 1 - (wasActive ? 1 : 0)
      : -(wasActive ? 1 : 0);

    try {
      setTogglingUserId(rowKey);
      setOpenMenuId(null);

      const userId =
        (user as any).user_id ?? (user as any).id ?? user.assignment_id;

      // Optimistic UI update
      setDistrictData((prev) => {
        if (!prev) return prev;
        const updatedUsers = prev.users.map((u) => {
          const uId = (u as any).user_id ?? (u as any).id ?? u.assignment_id;
          if (uId === userId) {
            return {
              ...u,
              is_active: targetActive,
              user_active: targetActive ? 1 : 0,
              active: targetActive,
              status: targetActive ? 1 : 0,
            } as HierarchyUser;
          }
          return u;
        });

        return {
          ...prev,
          users: updatedUsers,
          active_users: Math.max(0, prev.active_users + activeDelta),
          inactive_users: Math.max(0, prev.inactive_users - activeDelta),
        };
      });

      await toggleUserStatus({ id: userId, isActive: targetActive }).unwrap();
    } catch (err) {
      setDistrictData((prev) => {
        if (!prev) return prev;
        const userId =
          (user as any).user_id ?? (user as any).id ?? user.assignment_id;

        const revertedUsers = prev.users.map((u) => {
          const uId = (u as any).user_id ?? (u as any).id ?? u.assignment_id;
          if (uId === userId) {
            return {
              ...u,
              is_active: wasActive,
              user_active: wasActive ? 1 : 0,
              active: wasActive,
              status: wasActive ? 1 : 0,
            } as HierarchyUser;
          }
          return u;
        });

        return {
          ...prev,
          users: revertedUsers,
          active_users: Math.max(0, prev.active_users - activeDelta),
          inactive_users: Math.max(0, prev.inactive_users + activeDelta),
        };
      });

      console.error("Toggle status failed", err);
      setError(
        err instanceof Error ? err.message : "Failed to toggle user status"
      );
    } finally {
      setTogglingUserId(null);
    }
  };

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-[var(--text-secondary)] font-medium">
            Loading district team...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
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
      </div>
    );
  }

  if (!districtData) {
    return (
      <div className="p-6">
        <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-6 text-center">
          <p className="text-[var(--text-secondary)]">No district data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 bg-[var(--bg-main)] min-h-screen">
      {/* Header with Stats Cards */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 sm:p-6 text-white mb-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold">{t("districtTeam.Title")}</h1>
            <p className="text-blue-100 mt-1 text-xs sm:text-sm">
              {districtData.location.location_name}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <div className="bg-[var(--bg-card)] text-[var(--text-color)] rounded-md shadow-md p-4 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                  {t("districtTeam.Total_Users")}
                </p>
                <p className="text-2xl sm:text-3xl font-semibold mt-1">
                  {districtData.total_users}
                </p>
              </div>
              <div className="bg-blue-50 rounded-full p-2">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] text-[var(--text-color)] rounded-md shadow-md p-4 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                  {t("districtTeam.Active_Users")}
                </p>
                <p className="text-2xl sm:text-3xl font-semibold text-green-600 mt-1">
                  {districtData.active_users}
                </p>
              </div>
              <div className="bg-green-50 rounded-full p-2">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] text-[var(--text-color)] rounded-md shadow-md p-4 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                  {t("districtTeam.Inactive_Users")}
                </p>
                <p className="text-2xl sm:text-3xl font-semibold text-red-600 mt-1">
                  {districtData.inactive_users}
                </p>
              </div>
              <div className="bg-red-50 rounded-full p-2">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-[var(--bg-card)] rounded-lg shadow-md p-4 sm:p-6 mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">{t("districtTeam.All_Status")}</option>
            <option value="active">{t("districtTeam.Active_Only")}</option>
            <option value="inactive">{t("districtTeam.Inactive_Only")}</option>
          </select>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] whitespace-nowrap sm:ml-auto">
            {t("districtTeam.Showing")}{startIndex + 1}-{Math.min(endIndex, filteredUsers.length)}{" "}
            {t("districtTeam.of")} {filteredUsers.length} {t("districtTeam.users")}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--bg-card)] rounded-lg shadow-md overflow-hidden">
        {/* Mobile scroll hint */}
        {/* <div className="block sm:hidden bg-[var(--bg-main)] px-4 py-2 text-xs text-[var(--text-secondary)] border-b">
          ← Scroll horizontally to view all columns →
        </div> */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[var(--bg-main)]">
              <tr>
                <th className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">
                  {t("districtTeam.S_No")}
                </th>
                <th className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase min-w-[120px]">
                  {t("districtTeam.User_ID")}
                </th>
                <th className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase min-w-[100px]">
                  {t("districtTeam.State_Name")}
                </th>
                <th className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase min-w-[120px]">
                  {t("districtTeam.District_Name")}
                </th>
                <th className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase min-w-[100px]">
                  {t("districtTeam.Designation")}
                </th>
                
                <th className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase hidden md:table-cell min-w-[150px]">
                  {t("districtTeam.Email")}
                </th>
                <th className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase min-w-[80px]">
                  {t("districtTeam.Status")}
                </th>
                <th className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase min-w-[80px]">
                  {t("districtTeam.Action")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-[var(--bg-card)] divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-[var(--text-secondary)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="mt-2 text-[var(--text-secondary)] font-medium">
                      {t("districtTeam.No_users_found")}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => {
                  const rowKey =
                    user.assignment_id || (user as any).user_id || index;

                  const isActive = checkActiveStatus(user.is_active);

                  return (
                    <tr key={rowKey} className="hover:bg-[var(--text-color)]/5">
                      <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-sm text-[var(--text-color)]">
                        {startIndex + index + 1}
                      </td>
                       <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-sm text-[var(--text-secondary)]">
                        {user.user_id}
                      </td>
                      <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-sm text-[var(--text-secondary)]">
                        {user.user_state}
                      </td>
                      <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-sm text-[var(--text-secondary)]">
                        {user.user_district}
                      </td>
                      <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-sm font-medium text-[var(--text-color)]">
                        {user.user_role || "N/A"}
                      </td>
                     
                      <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-sm text-[var(--text-secondary)] hidden md:table-cell">
                        {user.email}
                      </td>

                      <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-sm">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                            }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-sm text-[var(--text-secondary)]">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId((prev) =>
                                prev === rowKey ? null : rowKey
                              )
                            }
                            className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg hover:bg-[var(--text-color)]/5 transition-colors"
                            aria-haspopup="true"
                            aria-expanded={openMenuId === rowKey}
                            title="More actions"
                          >
                            {togglingUserId === rowKey ? (
                              <svg
                                className="animate-spin h-4 w-4 text-[var(--text-secondary)]"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5 text-[var(--text-secondary)]"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            )}
                          </button>

                          {openMenuId === rowKey && (
                            <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg shadow-lg bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
                              <div className="py-1" role="menu">
                                <button
                                  type="button"
                                  disabled={isActive}
                                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${isActive
                                    ? "text-[var(--text-secondary)] cursor-not-allowed"
                                    : "text-green-700 hover:bg-[var(--text-color)]/5"
                                    }`}
                                  onClick={() =>
                                    handleToggleStatus(user, true, rowKey)
                                  }
                                  role="menuitem"
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
                                      strokeWidth="2"
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  {t("districtTeam.Mark_Active")}
                                </button>
                                <button
                                  type="button"
                                  disabled={!isActive}
                                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${!isActive
                                    ? "text-[var(--text-secondary)] cursor-not-allowed"
                                    : "text-orange-700 hover:bg-[var(--text-color)]/5"
                                    }`}
                                  onClick={() =>
                                    handleToggleStatus(user, false, rowKey)
                                  }
                                  role="menuitem"
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
                                      strokeWidth="2"
                                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                                    />
                                  </svg>
                                  {t("districtTeam.Mark_Inactive")}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-between">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 text-[var(--text-secondary)] rounded-lg hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("districtTeam.Previous")}
            </button>
            <span className="text-sm text-[var(--text-secondary)]">
              {t("districtTeam.Page")} {currentPage} {t("districtTeam.of")} {totalPages} ({filteredUsers.length} {t("districtTeam.users")})
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-100 text-[var(--text-secondary)] rounded-lg hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("districtTeam.Next")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



