import { useEffect, useState, useMemo, useCallback } from "react";
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

export default function DistrictUserManagement() {
  const { levelId } = useParams<{ levelId: string }>();
  const { levelAdminPanels } = useAppSelector((state) => state.auth);

  const [districts, setDistricts] = useState<HierarchyChild[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [districtSearchTerm, setDistrictSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] =
    useState<HierarchyChild | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);
  const [assignedPage, setAssignedPage] = useState(1);
  const [availablePage, setAvailablePage] = useState(1);
  const [availableTotalPages, setAvailableTotalPages] = useState(1);
  const [availableTotalUsers, setAvailableTotalUsers] = useState(0);
  const usersPerPage = 10;
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: number | null;
    userName: string;
    districtId: number | null;
  }>({
    isOpen: false,
    userId: null,
    userName: "",
    districtId: null,
  });

  const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

  // Load districts with users
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

  const loadAvailableUsers = useCallback(async () => {
    const metadata = currentPanel?.metadata;
    if (!metadata?.partyId || !metadata?.stateId) return;

    try {
      setUsersLoading(true);
      const response = await fetchUsersByPartyAndState(
        metadata.partyId,
        metadata.stateId,
        availablePage,
        usersPerPage,
        userSearchTerm.trim()
      );

      if (response.success) {
        const filteredUsers = response.data.filter(
          (user: User) => !user.isSuperAdmin
        );
        setAllUsers(filteredUsers);
        if (response.pagination) {
          setAvailableTotalPages(response.pagination.totalPages || 1);
          setAvailableTotalUsers(
            response.pagination.total || filteredUsers.length
          );
        } else {
          setAvailableTotalPages(1);
          setAvailableTotalUsers(filteredUsers.length);
        }
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, [currentPanel, availablePage, userSearchTerm, usersPerPage]);

  useEffect(() => {
    loadAvailableUsers();
  }, [loadAvailableUsers]);

  // Get assigned user IDs for selected district
  const assignedUserIds = useMemo(() => {
    if (!selectedDistrict) return new Set<number>();
    return new Set(selectedDistrict.users.map((u) => u.user_id));
  }, [selectedDistrict]);

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

  // Filter users in selected district
  const filteredDistrictUsers = useMemo(() => {
    if (!selectedDistrict) return [];
    const q = userSearchTerm.trim().toLowerCase();
    if (!q) return selectedDistrict.users;

    return selectedDistrict.users.filter(
      (user) =>
        user.first_name.toLowerCase().includes(q) ||
        user.last_name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.mobile_number.includes(userSearchTerm)
    );
  }, [selectedDistrict, userSearchTerm]);

  // Paginated district users
  const { paginatedDistrictUsers, totalPagesAssigned, totalUsersAssigned } =
    useMemo(() => {
      const startIndex = (assignedPage - 1) * usersPerPage;
      const endIndex = startIndex + usersPerPage;
      const users = filteredDistrictUsers.slice(startIndex, endIndex);
      const total = filteredDistrictUsers.length;
      return {
        paginatedDistrictUsers: users,
        totalPagesAssigned: Math.ceil(total / usersPerPage),
        totalUsersAssigned: total,
      };
    }, [filteredDistrictUsers, assignedPage, usersPerPage]);

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

  const paginatedUnassignedUsers = filteredUnassignedUsers;
  const totalPagesUnassigned = availableTotalPages;
  const totalUsersUnassigned = availableTotalUsers;

  // Reset page when search changes or district changes
  useEffect(() => {
    setAssignedPage(1);
    setAvailablePage(1);
  }, [userSearchTerm, selectedDistrict, showAssignModal]);

  // Assign user to district
  const handleAssignUser = async (userId: number) => {
    const metadata = currentPanel?.metadata;
    if (!selectedDistrict || !metadata?.stateId) return;

    try {
      setProcessingUserId(userId);
      const response = await assignUserToState(
        userId,
        selectedDistrict.location_id
      );

      if (response.success) {
        toast.success(
          `User assigned to ${selectedDistrict.location_name} successfully`
        );

        // Refresh districts
        const updatedResponse = await fetchHierarchyChildren(metadata.stateId, {
          page: 1,
          limit: 1000,
        });
        if (updatedResponse.success && updatedResponse.data?.children) {
          setDistricts(updatedResponse.data.children);
          const updatedDistrict = updatedResponse.data.children.find(
            (d: any) => d.location_id === selectedDistrict.location_id
          );
          if (updatedDistrict) {
            setSelectedDistrict(updatedDistrict);
          }
        }

        await loadAvailableUsers();
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
    districtId: number
  ) => {
    setConfirmModal({
      isOpen: true,
      userId,
      userName,
      districtId,
    });
  };

  // Close unassign modal
  const closeUnassignModal = () => {
    setConfirmModal({
      isOpen: false,
      userId: null,
      userName: "",
      districtId: null,
    });
  };

  // Unassign user from district
  const handleUnassignUser = async () => {
    const metadata = currentPanel?.metadata;
    if (!confirmModal.userId || !confirmModal.districtId || !metadata?.stateId)
      return;

    try {
      setProcessingUserId(confirmModal.userId);
      const response = await unassignUserFromState(
        confirmModal.userId,
        confirmModal.districtId
      );

      if (response.success) {
        toast.success(`${confirmModal.userName} unassigned successfully`);

        // Refresh districts
        const updatedResponse = await fetchHierarchyChildren(metadata.stateId, {
          page: 1,
          limit: 1000,
        });
        if (updatedResponse.success && updatedResponse.data?.children) {
          setDistricts(updatedResponse.data.children);
          if (selectedDistrict) {
            const updatedDistrict = updatedResponse.data.children.find(
              (d: any) => d.location_id === selectedDistrict.location_id
            );
            if (updatedDistrict) {
              setSelectedDistrict(updatedDistrict);
            }
          }
        }

        await loadAvailableUsers();
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
      <div className="p-1">
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
          <p className="text-red-700">Level admin panel not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 bg-gray-50 min-h-screen">
      <div className="bg-linear-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-3 text-white mb-1">
        <h1 className="text-3xl font-bold">District User Management</h1>
        <p className="text-purple-100 mt-2">
          Manage users for districts in {currentPanel.metadata?.stateName} -{" "}
          {currentPanel.metadata?.partyName}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-purple-600 mx-auto"></div>
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
                      setShowAssignModal(false);
                    }}
                    className={`w-full p-4 text-left border-b border-gray-200 hover:bg-gray-50 transition-colors ${selectedDistrict?.location_id === district.location_id
                      ? "bg-purple-50 border-l-4 border-l-purple-500"
                      : ""
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {district.location_name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {district.total_users} users ({district.active_users}{" "}
                          active)
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Users Management */}
        <div className="lg:col-span-2">
          {!selectedDistrict ? (
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-gray-500">Select a district to manage users</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-gray-800">
                    {selectedDistrict.location_name}
                  </h2>
                  <button
                    onClick={() => setShowAssignModal(!showAssignModal)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                          User Id
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
                      {filteredDistrictUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <p className="text-gray-500">
                              No users assigned to this district
                            </p>
                          </td>
                        </tr>
                      ) : (
                        paginatedDistrictUsers.map((user, index) => (
                          <tr
                            key={user.assignment_id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {(assignedPage - 1) * usersPerPage + index + 1}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {user.user_id}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${user.is_active
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
                                    selectedDistrict.location_id
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
                          setAssignedPage((p) => Math.max(1, p - 1))
                        }
                        disabled={assignedPage === 1}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {assignedPage} of {totalPagesAssigned} (
                        {totalUsersAssigned} users)
                      </span>
                      <button
                        onClick={() =>
                          setAssignedPage((p) =>
                            Math.min(totalPagesAssigned, p + 1)
                          )
                        }
                        disabled={assignedPage === totalPagesAssigned}
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
                          User Id
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
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto"></div>
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
                              {(availablePage - 1) * usersPerPage + index + 1}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {user.user_id}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${user.isActive
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
                          setAvailablePage((p) => Math.max(1, p - 1))
                        }
                        disabled={availablePage === 1}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {availablePage} of {totalPagesUnassigned} (
                        {totalUsersUnassigned} users)
                      </span>
                      <button
                        onClick={() =>
                          setAvailablePage((p) =>
                            Math.min(totalPagesUnassigned, p + 1)
                          )
                        }
                        disabled={availablePage === totalPagesUnassigned}
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
        message={`Are you sure you want to unassign ${confirmModal.userName} from this district?`}
        confirmText="Unassign"
        cancelText="Cancel"
      />
    </div>
  );
}
