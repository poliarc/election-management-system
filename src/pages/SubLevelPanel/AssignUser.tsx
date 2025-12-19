import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchUsersByPartyAndState } from "../../services/levelAdminApi";
import {
  assignUserToAfterAssembly,
  fetchAssignedUsersForLevel,
} from "../../services/afterAssemblyApi";
import { useDeleteAssignedLevelsMutation } from "../../store/api/afterAssemblyApi";
import { useAppSelector } from "../../store/hooks";

interface HierarchyUser {
  user_id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  contact_no?: string;
  mobile_number?: string;
  role?: string;
  assigned_at?: string;
  isActive?: number;
  isSuperAdmin?: number | boolean;
}

export default function SubLevelAssignUser() {
  const { levelId } = useParams<{ levelId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, selectedAssignment } = useAppSelector((s) => s.auth);
  const targetId = Number(searchParams.get("targetId")) || 0;
  const targetName = searchParams.get("targetName") || "";

  const [activeTab, setActiveTab] = useState<"assign" | "assigned">("assign");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const [availableUsers, setAvailableUsers] = useState<HierarchyUser[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<HierarchyUser[]>([]);
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotalCount, setUserTotalCount] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [unassigningId, setUnassigningId] = useState<number | null>(null);

  const [deleteAssignedLevels] = useDeleteAssignedLevelsMutation();

  const resolvedLevelId = Number(levelId) || 0;

  const getStateId = () => {
    // First try to get state_id from auth user (most reliable)
    if (user?.state_id) {
      return user.state_id;
    }

    // Fallback: Try to get it from selectedAssignment
    let stateId = selectedAssignment?.stateMasterData_id;

    // If stateMasterData_id is actually an afterAssemblyData_id, we need to find the actual state_id
    // Try to get it from localStorage auth_state as fallback
    if (!stateId) {
      try {
        const authState = localStorage.getItem("auth_state");
        if (authState) {
          const parsed = JSON.parse(authState);
          // Try to get state_id from stateAssignments
          if (parsed.stateAssignments && parsed.stateAssignments.length > 0) {
            const stateAssignment = parsed.stateAssignments.find((a: any) => a.levelType === 'State');
            if (stateAssignment) {
              stateId = stateAssignment.stateMasterData_id;
            }
          }
        }
      } catch (error) {
        console.error("Failed to get state_id:", error);
      }
    }

    return stateId;
  };

  const loadAvailableUsers = async (page: number = 1, search: string = "") => {
    if (!user?.partyId) {
      toast.error("Missing party information");
      return;
    }

    const stateId = getStateId();
    if (!stateId) {
      toast.error("Missing state information");
      return;
    }

    try {
      setLoadingUsers(true);
      const response = await fetchUsersByPartyAndState(
        user.partyId,
        stateId,
        page,
        pageSize,
        search
      );

      if (response.success && response.data) {
        const filteredUsers = response.data.filter(
          (u: any) => !u.isSuperAdmin || u.isSuperAdmin === 0
        );
        setAvailableUsers(filteredUsers);
        setUserTotalPages(response.pagination?.totalPages || 1);
        setUserTotalCount(response.pagination?.total || filteredUsers.length);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAssignedUsers = async () => {
    if (!targetId) return;
    try {
      setLoadingAssigned(true);
      const response = await fetchAssignedUsersForLevel(targetId);
      if (response.success && response.users) {
        setAssignedUsers(response.users);
        const ids = response.users.map((u: any) => u.user_id);
        setAssignedUserIds(ids);
        setSelectedUsers(ids);
      } else {
        setAssignedUsers([]);
        setAssignedUserIds([]);
        setSelectedUsers([]);
      }
    } catch (error) {
      console.error("Failed to load assigned users:", error);
      toast.error("Failed to load assigned users");
    } finally {
      setLoadingAssigned(false);
    }
  };

  useEffect(() => {
    loadAssignedUsers();
  }, [targetId]);

  useEffect(() => {
    loadAvailableUsers(currentPage, searchTerm);
  }, [currentPage]);

  const handleUserToggle = (userId: number, isAlreadyAssigned: boolean) => {
    if (isAlreadyAssigned) return;

    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssign = async () => {
    if (!targetId) {
      toast.error("Target level not found");
      return;
    }

    const newAssignments = selectedUsers.filter(
      (userId) => !assignedUserIds.includes(userId)
    );

    if (newAssignments.length === 0) {
      toast.error("All selected users are already assigned");
      return;
    }

    try {
      setAssigning(true);
      const results = await Promise.allSettled(
        newAssignments.map((userId) =>
          assignUserToAfterAssembly({
            user_id: userId,
            afterAssemblyData_id: targetId,
          })
        )
      );

      const successCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const failedMessages = results
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .map((r) => (r.reason as any)?.data?.message || r.reason?.message)
        .filter(Boolean);

      if (successCount > 0) {
        toast.success(
          `Assigned ${successCount} user(s) to ${targetName || "level"}`
        );
        await loadAssignedUsers();
        setActiveTab("assigned");
      }

      if (failedMessages.length > 0) {
        const duplicateErrors = failedMessages.filter(
          (msg) =>
            typeof msg === "string" &&
            msg.toLowerCase().includes("already assigned")
        );
        if (duplicateErrors.length === failedMessages.length) {
          toast.error("Some selected users were already assigned");
        } else {
          toast.error(failedMessages[0] || "Failed to assign some users");
        }
      }
    } catch (error) {
      console.error("Assign error:", error);
      toast.error("Failed to assign users");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (userId: number, name: string) => {
    if (!targetId) return;
    try {
      setUnassigningId(userId);
      const response = await deleteAssignedLevels({
        user_id: userId,
        afterAssemblyData_ids: [targetId],
      }).unwrap();

      if (response.success && response.summary.success > 0) {
        toast.success(`Unassigned ${name}`);
        setAssignedUsers((prev) => prev.filter((u) => u.user_id !== userId));
        setAssignedUserIds((prev) => prev.filter((id) => id !== userId));
        setSelectedUsers((prev) => prev.filter((id) => id !== userId));
      } else {
        const message = response.errors?.[0]?.error || "Failed to unassign";
        toast.error(message);
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to unassign");
    } finally {
      setUnassigningId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return availableUsers.filter(
      (u) => u.isActive === 1 || u.isActive === undefined
    );
  }, [availableUsers]);

  const paginationTextStart = (currentPage - 1) * pageSize + 1;
  const paginationTextEnd = Math.min(currentPage * pageSize, userTotalCount);

  if (!targetId) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-red-600 font-semibold">Invalid target to assign</p>
          <button
            onClick={() =>
              navigate(`/sublevel/${resolvedLevelId}/child-hierarchy`)
            }
            className="mt-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-1">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-3">
          <div className="mb-3 flex items-center gap-3">
            <button
              onClick={() =>
                navigate(`/sublevel/${resolvedLevelId}/child-hierarchy`)
              }
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Levels"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assign Users</h1>
              <p className="text-sm text-gray-600">
                {targetName || "Level"} | Sub Level
              </p>
            </div>
          </div>

          <div className="mb-1">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("assign")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "assign"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Assign Users
                </button>
                <button
                  onClick={() => setActiveTab("assigned")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "assigned"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Assigned Users ({assignedUsers.length})
                </button>
              </nav>
            </div>
          </div>

          {activeTab === "assign" ? (
            <>
              <div className="mb-1">
                <input
                  type="text"
                  placeholder="Search users by name, email, or contact number..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                    loadAvailableUsers(1, e.target.value);
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {loadingUsers ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p>No users found</p>
                </div>
              ) : (
                <>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {selectedUsers.length} user(s) selected | {userTotalCount}{" "}
                      total users
                    </div>
                    <button
                      onClick={handleAssign}
                      disabled={assigning || selectedUsers.length === 0}
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {assigning ? "Assigning..." : "Assign Selected Users"}
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                    <div className="divide-y divide-gray-200">
                      {filteredUsers.map((u) => {
                        const isSelected = selectedUsers.includes(u.user_id);
                        const isAlreadyAssigned = assignedUserIds.includes(
                          u.user_id
                        );
                        return (
                          <div
                            key={u.user_id}
                            className={`p-4 hover:bg-blue-50 ${
                              isAlreadyAssigned ? "bg-blue-50" : ""
                            }`}
                          >
                            <label
                              className={`flex items-center ${
                                isAlreadyAssigned
                                  ? "cursor-not-allowed opacity-70"
                                  : "cursor-pointer"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isAlreadyAssigned}
                                onChange={() =>
                                  handleUserToggle(u.user_id, isAlreadyAssigned)
                                }
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">
                                    {u.first_name} {u.last_name}
                                  </p>
                                  {isAlreadyAssigned && (
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                      Already Assigned
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {u.email}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {u.role} | {u.contact_no || u.mobile_number}
                                </p>
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {userTotalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing {paginationTextStart} to {paginationTextEnd} of{" "}
                        {userTotalCount} results
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const next = Math.max(currentPage - 1, 1);
                            setCurrentPage(next);
                            loadAvailableUsers(next, searchTerm);
                          }}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {Array.from({
                          length: Math.min(5, userTotalPages),
                        }).map((_, i) => {
                          const pageNum =
                            currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                          if (pageNum > userTotalPages) return null;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => {
                                setCurrentPage(pageNum);
                                loadAvailableUsers(pageNum, searchTerm);
                              }}
                              className={`px-3 py-1 text-sm border rounded-md ${
                                currentPage === pageNum
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => {
                            const next = Math.min(
                              currentPage + 1,
                              userTotalPages
                            );
                            setCurrentPage(next);
                            loadAvailableUsers(next, searchTerm);
                          }}
                          disabled={currentPage === userTotalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleAssign}
                      disabled={assigning || selectedUsers.length === 0}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                    >
                      {assigning ? "Assigning..." : "Assign Selected Users"}
                    </button>
                    <button
                      onClick={() =>
                        navigate(
                          `/sublevel/${resolvedLevelId}/child-hierarchy`
                        )
                      }
                      className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {loadingAssigned ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">
                    Loading assigned users...
                  </p>
                </div>
              ) : assignedUsers.length === 0 ? (
                <div className="text-center py-8">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="mt-2 text-gray-500 font-medium">
                    No users assigned
                  </p>
                  <p className="text-sm text-gray-400">
                    Use the "Assign Users" tab to add users to this level.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    {assignedUsers.length} user(s) currently assigned
                  </div>
                  <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                    <div className="divide-y divide-gray-200">
                      {assignedUsers.map((u) => (
                        <div key={u.user_id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {u.first_name} {u.last_name}
                              </p>
                              <p className="text-sm text-gray-600">{u.email}</p>
                              <p className="text-xs text-gray-500">
                                {u.mobile_number || u.contact_no}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                {u.assigned_at && (
                                  <span className="text-xs text-gray-400">
                                    Assigned:{" "}
                                    {new Date(
                                      u.assigned_at
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                handleUnassign(
                                  u.user_id,
                                  `${u.first_name || ""} ${
                                    u.last_name || ""
                                  }`.trim()
                                )
                              }
                              disabled={unassigningId === u.user_id}
                              className="ml-4 bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                              {unassigningId === u.user_id
                                ? "Unassigning..."
                                : "Unassign"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() =>
                        navigate(
                          `/sublevel/${resolvedLevelId}/child-hierarchy`
                        )
                      }
                      className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Back to Levels
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