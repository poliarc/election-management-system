import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { fetchAssignedUsersForLevel } from "../../services/afterAssemblyApi";
import { useToggleUserStatusMutation } from "../../store/api/profileApi";

export default function AfterAssemblyPanelTeam() {
  const { levelId } = useParams<{ levelId: string }>();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<number | string | null>(
    null
  );
  const usersPerPage = 10;
  const [toggleUserStatus] = useToggleUserStatusMutation();

  useEffect(() => {
    loadUsers();
  }, [levelId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setOpenMenuId(null);
      }
    };
    
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const loadUsers = async () => {
    if (!levelId) return;

    try {
      setLoading(true);
      const response = await fetchAssignedUsersForLevel(Number(levelId));

      if (response.success && response.users) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const checkActiveStatus = (value: any): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string")
      return ["active", "1", "true"].includes(value.toLowerCase());
    return false;
  };

  const getStatusValue = (user: any) =>
    user?.is_active ??
    user?.isActive ??
    user?.user_active ??
    user?.userActive ??
    user?.is_active_user ??
    user?.isActiveUser ??
    user?.assignment_status ??
    user?.status ??
    user?.active;

  const filteredUsers = users.filter(
    (user) =>
      `${user.first_name} ${user.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handleToggleStatus = async (
    user: any,
    targetActive: boolean,
    rowKey: number | string
  ) => {
    const getUserId = (u: any) =>
      u?.user_id ?? u?.userId ?? u?.user?.id ?? u?.id ?? null;

    const wasActive = checkActiveStatus(getStatusValue(user));

    try {
      setTogglingUserId(rowKey);
      setOpenMenuId(null);

      const userId = getUserId(user);
      if (!userId) {
        throw new Error("Missing user id");
      }

      setUsers((prev) =>
        prev.map((u) => {
          const uId = getUserId(u);
          if (uId === userId) {
            const numericStatus = targetActive ? 1 : 0;
            return {
              ...u,
              is_active: numericStatus,
              isActive: numericStatus,
              user_active: numericStatus,
              active: targetActive,
              status: numericStatus,
            };
          }
          return u;
        })
      );

      await toggleUserStatus({
        id: Number(userId),
        isActive: targetActive,
      }).unwrap();

      toast.success(
        targetActive ? "User marked active" : "User marked inactive"
      );
    } catch (error) {
      setUsers((prev) =>
        prev.map((u) => {
          const uId = getUserId(u);
          if (uId === getUserId(user)) {
            const numericStatus = wasActive ? 1 : 0;
            return {
              ...u,
              is_active: numericStatus,
              isActive: numericStatus,
              user_active: numericStatus,
              active: wasActive,
              status: numericStatus,
            };
          }
          return u;
        })
      );

      console.error("Toggle status failed", error);
      toast.error("Failed to update status");
    } finally {
      setTogglingUserId(null);
    }
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-1 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-6 mb-1">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Team Management
        </h1>

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
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  S.No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assembly Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Display Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No team members found
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => (
                  <tr
                    key={user.user_id || user.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.stateName || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.assemblyName ||
                          user.assembly_name ||
                          user.parentAssemblyName ||
                          user.parentId ||
                          "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.displayName ||
                          user.blockName ||
                          user.block_name ||
                          user.levelName ||
                          "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.role_name ||
                          user.designation ||
                          user.role ||
                          "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {user.contact_no || user.mobile_number || "N/A"}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const isActive = checkActiveStatus(
                          getStatusValue(user)
                        );

                        return (
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden xl:table-cell">
                      {(() => {
                        const rowKey =
                          user.assignment_id ||
                          user.user_id ||
                          user.id ||
                          startIndex + index;
                        const isActive = checkActiveStatus(
                          getStatusValue(user)
                        );

                        return (
                          <div className="relative inline-block text-left dropdown-container">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId((prev) =>
                                  prev === rowKey ? null : rowKey
                                );
                              }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
                              aria-haspopup="true"
                              aria-expanded={openMenuId === rowKey}
                              title="More actions"
                            >
                              {togglingUserId === rowKey ? (
                                <svg
                                  className="animate-spin h-4 w-4 text-gray-500"
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
                                  className="w-5 h-5 text-gray-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              )}
                            </button>

                            {openMenuId === rowKey && (
                              <div 
                                className={`absolute right-0 z-50 mt-2 w-44 rounded-lg shadow-lg bg-white border border-gray-200 overflow-hidden ${
                                  index >= paginatedUsers.length - 2 ? 'transform -translate-y-full -mt-2' : ''
                                }`}
                              >
                                <div className="py-1" role="menu">
                                  <button
                                    type="button"
                                    disabled={isActive}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                                      isActive
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-green-700 hover:bg-gray-50"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleStatus(user, true, rowKey);
                                    }}
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
                                    Mark Active
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!isActive}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                                      !isActive
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-orange-700 hover:bg-gray-50"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleStatus(user, false, rowKey);
                                    }}
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
                                    Mark Inactive
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({filteredUsers.length}{" "}
                users)
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
