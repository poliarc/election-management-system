import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useGetUsersByPartyAndStateQuery,
  useCreateAssemblyAssignmentMutation,
} from "../../../store/api/assemblyApi";
import { useDeleteAssignedLocationsMutation } from "../../../store/api/stateMasterApi";
import toast from "react-hot-toast";
import { API_CONFIG } from "../../../config/api";
import type { HierarchyUser } from "../../../types/hierarchy";
import { useTranslation } from "react-i18next";

export default function AssignAssembly() {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assemblyId = searchParams.get("assemblyId");
  const assemblyName = searchParams.get("assemblyName");
  const stateIdParam = searchParams.get("stateId");

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [partyId, setPartyId] = useState<number | null>(null);
  const stateId = stateIdParam ? Number(stateIdParam) : null;
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'assign' | 'assigned'>('assign');
  const [assignedUsers, setAssignedUsers] = useState<HierarchyUser[]>([]);
  const [loadingAssignedUsers, setLoadingAssignedUsers] = useState(false);
  const [unassigningUserId, setUnassigningUserId] = useState<number | null>(null);

  useEffect(() => {
    const authUser = localStorage.getItem("auth_user");
    if (!authUser) return;
    try {
      const user = JSON.parse(authUser);
      const rawPartyId =
        user?.party_id ??
        user?.partyId ??
        user?.party?.party_id ??
        user?.party?.id;
      const parsed = Number(rawPartyId);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setPartyId(parsed);
      }
    } catch (error) {
      console.error("Error parsing auth_user:", error);
    }
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm !== debouncedSearchTerm) {
        setPage(1); // Reset to page 1 when search changes
        setAllUsers([]); // Clear accumulated users when search changes
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading: loadingUsers } = useGetUsersByPartyAndStateQuery(
    { partyId: partyId!, stateId: stateId!, page, limit: 20, search: debouncedSearchTerm },
    { skip: !partyId || !stateId }
  );

  const users = data?.users || [];
  const pagination = data?.pagination;

  // Accumulate users as we load more pages
  useEffect(() => {
    if (users.length > 0) {
      setAllUsers((prev) => {
        // Avoid duplicates
        const existingIds = new Set(prev.map(u => u.user_id));
        const newUsers = users.filter(u => !existingIds.has(u.user_id));
        return [...prev, ...newUsers];
      });
    }
  }, [users]);

  const [createAssignment, { isLoading: isAssigning }] =
    useCreateAssemblyAssignmentMutation();

  const [deleteAssignedLocations] = useDeleteAssignedLocationsMutation();

  // Fetch already assigned users for this assembly
  const fetchAssignedUsers = async () => {
    if (!assemblyId) return;
    try {
      setLoadingAssigned(true);
      setLoadingAssignedUsers(true);
      const authStateRaw = localStorage.getItem("auth_state");
      const token = authStateRaw
        ? JSON.parse(authStateRaw)?.accessToken
        : null;
      if (!token) return;
      const resp = await fetch(
        `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/location/${assemblyId}/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();

      if (json?.data?.users && Array.isArray(json.data.users)) {
        setAssignedUsers(json.data.users);
        const ids: number[] = json.data.users
          .map((u: any) => Number(u.user_id))
          .filter((n: number) => !Number.isNaN(n));
        setAssignedUserIds(ids);
        // Initialize selection with already assigned users the first time
        setSelectedUsers((prev) => (prev.length ? prev : ids));
      }
    } catch (e) {
      console.error("Error fetching assigned users:", e);
    } finally {
      setLoadingAssigned(false);
      setLoadingAssignedUsers(false);
    }
  };

  useEffect(() => {
    fetchAssignedUsers();
  }, [assemblyId]);

  // Filter only by active status since search is now handled by API
  const filteredUsers = allUsers.filter((user) => user.isActive === 1);

  const hasMore = pagination && pagination.page < pagination.totalPages;

  const handleLoadMore = () => {
    if (hasMore && !loadingUsers) {
      setPage((prev) => prev + 1);
    }
  };

  const assignedSet = useMemo(
    () => new Set(assignedUserIds),
    [assignedUserIds]
  );

  const handleUserToggle = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssign = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    if (!assemblyId) {
      toast.error("Assembly ID not found");
      return;
    }

    try {
      const toAssign = selectedUsers.filter((id) => !assignedSet.has(id));
      if (toAssign.length === 0) {
        toast.success("No new users to assign");
        return;
      }
      const promises = toAssign.map((userId) =>
        createAssignment({
          user_id: userId,
          stateMasterData_id: Number(assemblyId),
        }).unwrap()
      );

      await Promise.all(promises);
      toast.success(
        `Successfully assigned ${toAssign.length} user(s) to assembly`
      );
      // Refresh assigned users list
      fetchAssignedUsers();
      // Switch to assigned tab to show the newly assigned users
      setActiveTab('assigned');
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to assign users");
    }
  };

  const handleUnassign = async (userId: number, userName: string) => {
    if (!assemblyId) {
      toast.error("Assembly ID not found");
      return;
    }

    try {
      setUnassigningUserId(userId);
      const response = await deleteAssignedLocations({
        userId: userId,
        stateMasterData_id: Number(assemblyId)
      }).unwrap();

      if (response.success) {
        toast.success(`Unassigned ${userName} from assembly`);
        // Refresh assigned users list
        fetchAssignedUsers();
      } else {
        toast.error("Failed to unassign user");
      }
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to unassign user");
    } finally {
      setUnassigningUserId(null);
    }
  };

  if (!assemblyId || !assemblyName) {
    return (
      <div className="p-6 bg-[var(--bg-main)] min-h-screen">
        <div className="max-w-4xl mx-auto bg-[var(--bg-card)] rounded-lg shadow-md p-6">
          <p className="text-red-600">Invalid assembly information</p>
          <button
            onClick={() => navigate("/district/assembly")}
            className="mt-4 bg-gray-200 text-[var(--text-secondary)] py-2 px-4 rounded-lg hover:bg-gray-300"
          >
            Back to Assembly List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 bg-[var(--bg-main)] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[var(--bg-card)] rounded-lg shadow-md p-3">
          <div className="mb-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/district/assembly")}
                className="p-2 hover:bg-[var(--text-color)]/5 rounded-lg transition-colors"
                title="Back to Assembly List"
              >
                <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-[var(--text-color)]">
                {t("districtAssembly.Manage_Assembly_Users")}
              </h1>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-2 px-13">
              {t("districtAssembly.Assembly")}: <span className="font-medium">{assemblyName}</span>
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-1">
            <div className="border-b border-[var(--border-color)]">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('assign')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'assign'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:border-gray-300'
                    }`}
                >
                  {t("districtAssembly.Available_Users")}
                </button>
                <button
                  onClick={() => setActiveTab('assigned')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'assigned'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:border-gray-300'
                    }`}
                >
                  {t("districtAssembly.Assigned_Users")} ({assignedUsers.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'assign' ? (
            <>
              <div className="mb-1">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {loadingUsers || loadingAssigned ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-[var(--text-secondary)]">{t("districtAssembly.Loading_users")}</p>
                </div>
              ) : (
                <>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="text-sm text-[var(--text-secondary)]">
                      {selectedUsers.length} {t("districtAssembly.user_selected")}
                    </div>
                    <button
                      onClick={handleAssign}
                      disabled={isAssigning || selectedUsers.length === 0}
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {isAssigning ? "Assigning..." : "Assign Selected Users"}
                    </button>
                  </div>

                  <div className="border border-[var(--border-color)] rounded-lg max-h-96 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-[var(--text-secondary)]">
                        No users found
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {filteredUsers.map((user) => {
                          const isSelected = selectedUsers.includes(user.user_id);
                          const alreadyAssigned = assignedSet.has(user.user_id);

                          return (
                            <div
                              key={user.user_id}
                              className="p-4 hover:bg-[var(--text-color)]/5"
                            >
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleUserToggle(user.user_id)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div className="ml-3 flex-1">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-[var(--text-color)]">
                                        {user.first_name} {user.last_name}
                                      </p>
                                      <p className="text-sm text-[var(--text-secondary)]">
                                        {user.districtName}
                                      </p>
                                      <p className="text-sm text-[var(--text-secondary)]">
                                        {user.email}
                                      </p>
                                      <p className="text-xs text-[var(--text-secondary)]">
                                        {user.role} | {t("districtAssembly.ID")} : {user.user_id}
                                      </p>

                                    </div>
                                    {alreadyAssigned && (
                                      <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                        {t("districtAssembly.Already_assigned")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {hasMore && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingUsers}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {loadingUsers ? "Loading..." : "Load More Users"}
                      </button>
                      <p className="text-sm text-[var(--text-secondary)] mt-2">
                        {t("districtAssembly.Showing")} {allUsers.length} {t("districtAssembly.of")} {pagination?.total || 0} {t("districtAssembly.users")}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleAssign}
                      disabled={isAssigning || selectedUsers.length === 0}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isAssigning ? "Assigning..." : "Assign Selected Users"}
                    </button>
                    <button
                      onClick={() => navigate("/district/assembly")}
                      className="flex-1 bg-gray-200 text-[var(--text-secondary)] py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      {t("districtAssembly.Cancel")}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            /* Assigned Users Tab */
            <>
              {loadingAssignedUsers ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-[var(--text-secondary)]">{t("districtAssembly.Loading_assigned_users")}</p>
                </div>
              ) : assignedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="mt-2 text-[var(--text-secondary)] font-medium">{t("districtAssembly.Desc")}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{t("districtAssembly.Desc2")}</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-[var(--text-secondary)]">
                    {assignedUsers.length} {t("districtAssembly.Desc3")}
                  </div>
                  <div className="border border-[var(--border-color)] rounded-lg max-h-96 overflow-y-auto">
                    <div className="divide-y divide-gray-200">
                      {assignedUsers.map((user) => (
                        <div key={user.user_id} className="p-4 hover:bg-[var(--text-color)]/5">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-[var(--text-color)]">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>

                              <div className="mt-1 flex items-center gap-2">

                                <span className="text-xs text-[var(--text-secondary)]">
                                  {t("districtAssembly.Assigned")}: {new Date(user.assigned_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnassign(user.user_id, `${user.first_name} ${user.last_name}`)}
                              disabled={unassigningUserId === user.user_id}
                              className="ml-4 bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                              {unassigningUserId === user.user_id ? "Unassigning..." : "Unassign"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => navigate("/district/assembly")}
                      className="flex-1 bg-gray-200 text-[var(--text-secondary)] py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      {t("districtAssembly.Back_Assembly_List")}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


