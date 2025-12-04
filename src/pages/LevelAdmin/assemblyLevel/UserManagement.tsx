import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import toast from "react-hot-toast";
import ConfirmationModal from "../../../components/ConfirmationModal";
import {
  fetchUsersByPartyAndState,
  assignUserToState,
  unassignUserFromState,
  type User,
} from "../../../services/levelAdminApi";
import { fetchHierarchyChildren } from "../../../services/hierarchyApi";
import type { HierarchyChild } from "../../../types/hierarchy";

export default function AssemblyUserManagement() {
  const { levelId } = useParams<{ levelId: string }>();
  const { levelAdminPanels } = useAppSelector((state) => state.auth);

  const [districts, setDistricts] = useState<HierarchyChild[]>([]);
  const [assemblies, setAssemblies] = useState<HierarchyChild[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [assembliesLoading, setAssembliesLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [districtSearchTerm, setDistrictSearchTerm] = useState("");
  const [assemblySearchTerm, setAssemblySearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] =
    useState<HierarchyChild | null>(null);
  const [selectedAssembly, setSelectedAssembly] =
    useState<HierarchyChild | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: number | null;
    userName: string;
    assemblyId: number | null;
  }>({
    isOpen: false,
    userId: null,
    userName: "",
    assemblyId: null,
  });

  const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

  // Load districts
  useEffect(() => {
    const loadDistricts = async () => {
      const metadata = currentPanel?.metadata;
      if (!metadata?.stateId) return;

      try {
        setLoading(true);
        const response = await fetchHierarchyChildren(metadata.stateId, {
          page: 1,
          limit: 1000,
        });

        if (response.success && response.data?.children) {
          setDistricts(response.data.children);
        }
      } catch {
        toast.error("Failed to load districts");
      } finally {
        setLoading(false);
      }
    };

    loadDistricts();
  }, [currentPanel]);

  // Load assemblies when district is selected
  useEffect(() => {
    const loadAssemblies = async () => {
      if (!selectedDistrict) {
        setAssemblies([]);
        return;
      }

      try {
        setAssembliesLoading(true);
        const response = await fetchHierarchyChildren(
          selectedDistrict.location_id,
          {
            page: 1,
            limit: 1000,
          }
        );

        if (response.success && response.data?.children) {
          setAssemblies(response.data.children);
        }
      } catch {
        toast.error("Failed to load assemblies");
      } finally {
        setAssembliesLoading(false);
      }
    };

    loadAssemblies();
  }, [selectedDistrict]);

  // Load all available users
  useEffect(() => {
    const loadUsers = async () => {
      const metadata = currentPanel?.metadata;
      if (!metadata?.partyId || !metadata?.stateId) return;

      try {
        setUsersLoading(true);
        const response = await fetchUsersByPartyAndState(
          metadata.partyId,
          metadata.stateId,
          1,
          100
        );

        if (response.success) {
          // Filter out super admin users
          const filteredUsers = response.data.filter(
            (user: User) => !user.isSuperAdmin
          );
          setAllUsers(filteredUsers);
        }
      } catch {
        toast.error("Failed to load users");
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, [currentPanel]);

  // Get assigned user IDs for selected assembly
  const assignedUserIds = useMemo(() => {
    if (!selectedAssembly) return new Set<number>();
    return new Set(selectedAssembly.users.map((u) => u.user_id));
  }, [selectedAssembly]);

  // Filter unassigned users
  const unassignedUsers = useMemo(() => {
    return allUsers.filter((user) => !assignedUserIds.has(user.user_id));
  }, [allUsers, assignedUserIds]);

  // Filter districts based on search
  const filteredDistricts = useMemo(() => {
    const q = districtSearchTerm.trim().toLowerCase();
    if (!q) return districts;

    return districts.filter((district) =>
      district.location_name.toLowerCase().includes(q)
    );
  }, [districts, districtSearchTerm]);

  // Filter assemblies based on search
  const filteredAssemblies = useMemo(() => {
    const q = assemblySearchTerm.trim().toLowerCase();
    if (!q) return assemblies;

    return assemblies.filter((assembly) =>
      assembly.location_name.toLowerCase().includes(q)
    );
  }, [assemblies, assemblySearchTerm]);

  // Filter users in selected assembly
  const filteredAssemblyUsers = useMemo(() => {
    if (!selectedAssembly) return [];
    const q = userSearchTerm.trim().toLowerCase();
    if (!q) return selectedAssembly.users;

    return selectedAssembly.users.filter(
      (user) =>
        user.first_name.toLowerCase().includes(q) ||
        user.last_name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.mobile_number.includes(userSearchTerm)
    );
  }, [selectedAssembly, userSearchTerm]);

  // Paginated assembly users
  const { paginatedAssemblyUsers, totalPagesAssigned, totalUsersAssigned } =
    useMemo(() => {
      const startIndex = (currentPage - 1) * usersPerPage;
      const endIndex = startIndex + usersPerPage;
      const users = filteredAssemblyUsers.slice(startIndex, endIndex);
      const total = filteredAssemblyUsers.length;
      return {
        paginatedAssemblyUsers: users,
        totalPagesAssigned: Math.ceil(total / usersPerPage),
        totalUsersAssigned: total,
      };
    }, [filteredAssemblyUsers, currentPage]);

  // Filter unassigned users
  const filteredUnassignedUsers = useMemo(() => {
    const q = userSearchTerm.trim().toLowerCase();
    if (!q) return unassignedUsers;

    return unassignedUsers.filter(
      (user) =>
        user.first_name.toLowerCase().includes(q) ||
        user.last_name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.contact_no.includes(userSearchTerm)
    );
  }, [unassignedUsers, userSearchTerm]);

  // Paginated unassigned users
  const {
    paginatedUnassignedUsers,
    totalPagesUnassigned,
    totalUsersUnassigned,
  } = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const users = filteredUnassignedUsers.slice(startIndex, endIndex);
    const total = filteredUnassignedUsers.length;
    return {
      paginatedUnassignedUsers: users,
      totalPagesUnassigned: Math.ceil(total / usersPerPage),
      totalUsersUnassigned: total,
    };
  }, [filteredUnassignedUsers, currentPage]);

  // Reset page when search changes or assembly changes
  useEffect(() => {
    setCurrentPage(1);
  }, [userSearchTerm, selectedAssembly, showAssignModal]);

  // Refresh assemblies after assignment/unassignment
  const refreshAssemblies = async () => {
    if (!selectedDistrict) return;

    const response = await fetchHierarchyChildren(
      selectedDistrict.location_id,
      {
        page: 1,
        limit: 1000,
      }
    );
    if (response.success && response.data?.children) {
      setAssemblies(response.data.children);
      if (selectedAssembly) {
        const updatedAssembly = response.data.children.find(
          (a) => a.location_id === selectedAssembly.location_id
        );
        if (updatedAssembly) {
          setSelectedAssembly(updatedAssembly);
        }
      }
    }
  };

  // Assign user to assembly
  const handleAssignUser = async (userId: number) => {
    if (!selectedAssembly) return;

    try {
      setProcessingUserId(userId);
      const response = await assignUserToState(
        userId,
        selectedAssembly.location_id
      );

      if (response.success) {
        toast.success(
          `User assigned to ${selectedAssembly.location_name} successfully`
        );
        await refreshAssemblies();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign user"
      );
    } finally {
      setProcessingUserId(null);
    }
  };

  // Open unassign confirmation modal
  const openUnassignModal = (
    userId: number,
    userName: string,
    assemblyId: number
  ) => {
    setConfirmModal({
      isOpen: true,
      userId,
      userName,
      assemblyId,
    });
  };

  // Close unassign modal
  const closeUnassignModal = () => {
    setConfirmModal({
      isOpen: false,
      userId: null,
      userName: "",
      assemblyId: null,
    });
  };

  // Unassign user from assembly
  const handleUnassignUser = async () => {
    if (!confirmModal.userId || !confirmModal.assemblyId) return;

    try {
      setProcessingUserId(confirmModal.userId);
      const response = await unassignUserFromState(
        confirmModal.userId,
        confirmModal.assemblyId
      );

      if (response.success) {
        toast.success(`${confirmModal.userName} unassigned successfully`);
        await refreshAssemblies();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unassign user"
      );
    } finally {
      setProcessingUserId(null);
      closeUnassignModal();
    }
  };

  if (!currentPanel) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
          <p className="text-red-700">Level admin panel not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white mb-1">
        <h1 className="text-3xl font-bold">Assembly User Management</h1>
        <p className="text-indigo-100 mt-2">
          Manage users for assemblies in {currentPanel.metadata?.stateName} -{" "}
          {currentPanel.metadata?.partyName}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Districts List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-3">
                Districts
              </h2>
              {/* District Search */}
              <input
                type="text"
                placeholder="Search districts..."
                value={districtSearchTerm}
                onChange={(e) => setDistrictSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-indigo-600 mx-auto"></div>
                </div>
              ) : filteredDistricts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No districts found
                </div>
              ) : (
                filteredDistricts.map((district) => (
                  <button
                    key={district.location_id}
                    onClick={() => {
                      setSelectedDistrict(district);
                      setSelectedAssembly(null);
                      setShowAssignModal(false);
                    }}
                    className={`w-full p-4 text-left border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                      selectedDistrict?.location_id === district.location_id
                        ? "bg-indigo-50 border-l-4 border-l-indigo-500"
                        : ""
                    }`}
                  >
                    <p className="font-semibold text-gray-900">
                      {district.location_name}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Assemblies List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-3">
                Assemblies
              </h2>
              {/* Assembly Search */}
              {selectedDistrict && (
                <input
                  type="text"
                  placeholder="Search assemblies..."
                  value={assemblySearchTerm}
                  onChange={(e) => setAssemblySearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              )}
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {!selectedDistrict ? (
                <div className="p-6 text-center text-gray-500">
                  Select a district first
                </div>
              ) : assembliesLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-indigo-600 mx-auto"></div>
                </div>
              ) : filteredAssemblies.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No assemblies found
                </div>
              ) : (
                filteredAssemblies.map((assembly) => (
                  <button
                    key={assembly.location_id}
                    onClick={() => {
                      setSelectedAssembly(assembly);
                      setShowAssignModal(false);
                    }}
                    className={`w-full p-4 text-left border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                      selectedAssembly?.location_id === assembly.location_id
                        ? "bg-indigo-50 border-l-4 border-l-indigo-500"
                        : ""
                    }`}
                  >
                    <p className="font-semibold text-gray-900">
                      {assembly.location_name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {assembly.total_users} users
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Users Management */}
        <div className="lg:col-span-2">
          {!selectedAssembly ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="text-gray-500">
                Select an assembly to manage users
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      {selectedAssembly.location_name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedDistrict?.location_name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAssignModal(!showAssignModal)}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    {showAssignModal ? "View Assigned" : "Assign Users"}
                  </button>
                </div>
                {/* User Search */}
                <input
                  type="text"
                  placeholder="Search users by name, email, or phone..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {!showAssignModal ? (
                // Assigned Users
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                          S.No
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                          Mobile
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAssemblyUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <p className="text-gray-500">
                              No users assigned to this assembly
                            </p>
                          </td>
                        </tr>
                      ) : (
                        paginatedAssemblyUsers.map((user, index) => (
                          <tr
                            key={user.assignment_id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {(currentPage - 1) * usersPerPage + index + 1}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {user.mobile_number}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  user.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {user.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() =>
                                  openUnassignModal(
                                    user.user_id,
                                    `${user.first_name} ${user.last_name}`,
                                    selectedAssembly.location_id
                                  )
                                }
                                disabled={processingUserId === user.user_id}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {processingUserId === user.user_id
                                  ? "..."
                                  : "Unassign"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Pagination for Assigned Users */}
                  {totalPagesAssigned > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPagesAssigned} (
                        {totalUsersAssigned} users)
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((p) =>
                            Math.min(totalPagesAssigned, p + 1)
                          )
                        }
                        disabled={currentPage === totalPagesAssigned}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Available Users
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                          S.No
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                          Mobile
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usersLoading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto"></div>
                          </td>
                        </tr>
                      ) : filteredUnassignedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <p className="text-gray-500">
                              No available users found
                            </p>
                          </td>
                        </tr>
                      ) : (
                        paginatedUnassignedUsers.map((user, index) => (
                          <tr key={user.user_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {(currentPage - 1) * usersPerPage + index + 1}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {user.contact_no}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  user.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {user.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() => handleAssignUser(user.user_id)}
                                disabled={processingUserId === user.user_id}
                                className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {processingUserId === user.user_id
                                  ? "..."
                                  : "Assign"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Pagination for Available Users */}
                  {totalPagesUnassigned > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPagesUnassigned} (
                        {totalUsersUnassigned} users)
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((p) =>
                            Math.min(totalPagesUnassigned, p + 1)
                          )
                        }
                        disabled={currentPage === totalPagesUnassigned}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeUnassignModal}
        onConfirm={handleUnassignUser}
        title="Unassign User"
        message={`Are you sure you want to unassign ${confirmModal.userName} from this assembly?`}
        confirmText="Unassign"
        cancelText="Cancel"
      />
    </div>
  );
}
