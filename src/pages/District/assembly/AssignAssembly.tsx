import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useGetUsersByPartyQuery,
  useCreateAssemblyAssignmentMutation,
} from "../../../store/api/assemblyApi";
import toast from "react-hot-toast";
import { API_CONFIG } from "../../../config/api";

export default function AssignAssembly() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assemblyId = searchParams.get("assemblyId");
  const assemblyName = searchParams.get("assemblyName");

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [partyId, setPartyId] = useState<number | null>(null);
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState<boolean>(false);

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

  const { data: users = [], isLoading: loadingUsers } = useGetUsersByPartyQuery(
    partyId!,
    { skip: !partyId }
  );

  const [createAssignment, { isLoading: isAssigning }] =
    useCreateAssemblyAssignmentMutation();

  // Fetch already assigned users for this assembly
  useEffect(() => {
    const fetchAssigned = async () => {
      if (!assemblyId) return;
      try {
        setLoadingAssigned(true);
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
        const ids: number[] = Array.isArray(json?.data?.users)
          ? json.data.users
              .map((u: any) => Number(u.user_id))
              .filter((n: number) => !Number.isNaN(n))
          : [];
        setAssignedUserIds(ids);
        setSelectedUsers((prev) => (prev.length ? prev : ids));
      } catch {
        // ignore
      } finally {
        setLoadingAssigned(false);
      }
    };
    fetchAssigned();
  }, [assemblyId]);

  const filteredUsers = users
    .filter((user) => (partyId ? user.party_id === partyId : true))
    .filter((u) => {
      const roleName = (u.role || "").toLowerCase().replace(/\s+/g, "");
      const isSuperAdmin = roleName === "superadmin";
      return !isSuperAdmin;
    })
    .filter(
      (user) =>
        user.isActive === 1 &&
        (user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
      navigate("/district/assembly");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to assign users");
    }
  };

  if (!assemblyId || !assemblyName) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <p className="text-red-600">Invalid assembly information</p>
          <button
            onClick={() => navigate("/district/assembly")}
            className="mt-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
          >
            Back to Assembly List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Assign Users to Assembly
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Assembly: <span className="font-medium">{assemblyName}</span>
            </p>
          </div>

          <div className="mb-4">
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
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                {selectedUsers.length} user(s) selected
              </div>

              <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
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
                          className="p-4 hover:bg-gray-50"
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
                                  <p className="font-medium text-gray-900">
                                    {user.first_name} {user.last_name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {user.email}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {user.role} | {user.contact_no}
                                  </p>
                                </div>
                                {alreadyAssigned && (
                                  <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                    Already assigned
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
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
