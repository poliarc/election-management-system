import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import toast from "react-hot-toast";
import ConfirmationModal from "../../../components/ConfirmationModal";
import {
    fetchUsersByPartyAndState,
    fetchAssignedUsers,
    assignUserToState,
    unassignUserFromState,
    type User,
} from "../../../services/levelAdminApi";

interface AssignedUser {
    assignment_id?: number;
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    contact_no: string;
    mobile_number?: string;
    party_name?: string;
    partyName?: string;
    districtName?: string;
    stateName?: string;
    isActive: number;
    is_active?: boolean;
    assigned_at?: string;
    created_on?: string;
    isSuperAdmin?: number;
}

export default function UserManagement() {
    const { levelId } = useParams<{ levelId: string }>();
    const { levelAdminPanels } = useAppSelector((state) => state.auth);

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignedLoading, setAssignedLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [assignedPage, setAssignedPage] = useState(1);
    const [assignedTotalPages, setAssignedTotalPages] = useState(1);
    const [assignedTotalCount, setAssignedTotalCount] = useState(0);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [processingUserId, setProcessingUserId] = useState<number | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        userId: number | null;
        userName: string;
    }>({
        isOpen: false,
        userId: null,
        userName: "",
    });

    const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

    // Load all users for the party and state
    useEffect(() => {
        const loadUsers = async () => {
            if (!currentPanel?.metadata) return;

            try {
                setLoading(true);
                const response = await fetchUsersByPartyAndState(
                    currentPanel.metadata.partyId,
                    currentPanel.metadata.stateId,
                    currentPage,
                    50
                );

                if (response.success) {
                    setAllUsers(response.data);
                    setTotalPages(response.pagination.totalPages);
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to load users");
            } finally {
                setLoading(false);
            }
        };

        loadUsers();
    }, [currentPanel, currentPage]);

    // Load assigned users
    useEffect(() => {
        const loadAssignedUsers = async () => {
            if (!currentPanel?.metadata) return;

            try {
                setAssignedLoading(true);
                const response = await fetchAssignedUsers(
                    currentPanel.metadata.stateId,
                    assignedPage,
                    10
                );

                if (response.success) {
                    // Handle both response formats: response.data.users or response.data
                    const usersData = response.data?.users || response.data || [];

                    // Filter out super admins
                    const filteredUsers = usersData.filter(
                        (user: AssignedUser) => user.isSuperAdmin !== 1
                    );
                    setAssignedUsers(filteredUsers);

                    if (response.pagination) {
                        setAssignedTotalPages(response.pagination.totalPages);
                        setAssignedTotalCount(response.pagination.total || filteredUsers.length);
                    } else {
                        setAssignedTotalCount(filteredUsers.length);
                    }
                }
            } catch (error) {
                console.error("Failed to load assigned users:", error);
                toast.error("Failed to load assigned users");
            } finally {
                setAssignedLoading(false);
            }
        };

        loadAssignedUsers();
    }, [currentPanel, assignedPage]);

    // Filter unassigned users
    const unassignedUsers = useMemo(() => {
        const assignedUserIds = new Set(assignedUsers.map((u) => u.user_id));
        return allUsers.filter((user) => !assignedUserIds.has(user.user_id));
    }, [allUsers, assignedUsers]);

    // Filter users based on search
    const filteredUnassignedUsers = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return unassignedUsers;

        return unassignedUsers.filter(
            (user) =>
                user.first_name.toLowerCase().includes(q) ||
                user.last_name.toLowerCase().includes(q) ||
                user.email.toLowerCase().includes(q) ||
                user.contact_no.includes(searchTerm)
        );
    }, [unassignedUsers, searchTerm]);

    const filteredAssignedUsers = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return assignedUsers;

        return assignedUsers.filter(
            (user) =>
                user.first_name.toLowerCase().includes(q) ||
                user.last_name.toLowerCase().includes(q) ||
                user.email.toLowerCase().includes(q) ||
                (user.contact_no && user.contact_no.includes(searchTerm)) ||
                (user.mobile_number && user.mobile_number.includes(searchTerm)) ||
                (user.districtName && user.districtName.toLowerCase().includes(q))
        );
    }, [assignedUsers, searchTerm]);

    // Assign user
    const handleAssignUser = async (userId: number) => {
        if (!currentPanel?.metadata) return;

        try {
            setProcessingUserId(userId);
            const response = await assignUserToState(userId, currentPanel.metadata.stateId);

            if (response.success) {
                toast.success(`User assigned to ${currentPanel.metadata.stateName} successfully`);

                // Refresh assigned users
                const updatedResponse = await fetchAssignedUsers(
                    currentPanel.metadata.stateId,
                    assignedPage,
                    10
                );
                if (updatedResponse.success) {
                    const usersData = updatedResponse.data?.users || updatedResponse.data || [];
                    const filteredUsers = usersData.filter(
                        (user: AssignedUser) => user.isSuperAdmin !== 1
                    );
                    setAssignedUsers(filteredUsers);

                    if (updatedResponse.pagination) {
                        setAssignedTotalPages(updatedResponse.pagination.totalPages);
                    }
                }

                // Also refresh the available users list
                setCurrentPage(1);
                const availableResponse = await fetchUsersByPartyAndState(
                    currentPanel.metadata.partyId,
                    currentPanel.metadata.stateId,
                    1,
                    50
                );
                if (availableResponse.success) {
                    setAllUsers(availableResponse.data);
                    setTotalPages(availableResponse.pagination.totalPages);
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to assign user");
        } finally {
            setProcessingUserId(null);
        }
    };

    // Open confirmation modal
    const openUnassignModal = (userId: number, userName: string) => {
        setConfirmModal({
            isOpen: true,
            userId,
            userName,
        });
    };

    // Close confirmation modal
    const closeUnassignModal = () => {
        setConfirmModal({
            isOpen: false,
            userId: null,
            userName: "",
        });
    };

    // Unassign user
    const handleUnassignUser = async () => {
        if (!currentPanel?.metadata || !confirmModal.userId) return;

        try {
            setProcessingUserId(confirmModal.userId);
            const response = await unassignUserFromState(
                confirmModal.userId,
                currentPanel.metadata.stateId
            );

            if (response.success) {
                toast.success(`${confirmModal.userName} unassigned successfully`);

                // Reload assigned users
                const updatedResponse = await fetchAssignedUsers(
                    currentPanel.metadata.stateId,
                    assignedPage,
                    10
                );
                if (updatedResponse.success) {
                    const usersData = updatedResponse.data?.users || updatedResponse.data || [];
                    const filteredUsers = usersData.filter(
                        (user: AssignedUser) => user.isSuperAdmin !== 1
                    );
                    setAssignedUsers(filteredUsers);

                    if (updatedResponse.pagination) {
                        setAssignedTotalPages(updatedResponse.pagination.totalPages);
                        setAssignedTotalCount(updatedResponse.pagination.total || filteredUsers.length);
                    } else {
                        setAssignedTotalCount(filteredUsers.length);
                    }
                }

                // Reload available users
                const availableResponse = await fetchUsersByPartyAndState(
                    currentPanel.metadata.partyId,
                    currentPanel.metadata.stateId,
                    currentPage,
                    50
                );
                if (availableResponse.success) {
                    setAllUsers(availableResponse.data);
                    setTotalPages(availableResponse.pagination.totalPages);
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to unassign user");
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
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-6">
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-purple-100 mt-2">
                    Assign users to {currentPanel.metadata?.stateName} - {currentPanel.metadata?.partyName}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Assigned Users</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">
                                {assignedLoading ? "..." : assignedTotalCount}
                            </p>
                        </div>
                        <div className="bg-green-100 rounded-full p-3">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Available Users</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">
                                {loading ? "..." : unassignedUsers.length}
                            </p>
                        </div>
                        <div className="bg-blue-100 rounded-full p-3">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <input
                    type="text"
                    placeholder="Search users by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md mb-6">
                <div className="border-b border-gray-200">
                    <nav className="flex">
                        <button
                            onClick={() => setShowAssignModal(false)}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${!showAssignModal
                                ? "border-purple-500 text-purple-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Assigned Users ({assignedTotalCount})
                        </button>
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${showAssignModal
                                ? "border-purple-500 text-purple-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Available Users ({unassignedUsers.length})
                        </button>
                    </nav>
                </div>
            </div>

            {/* Content */}
            {!showAssignModal ? (
                // Assigned Users Table
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">S.No</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Mobile</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Assigned Level</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Assigned Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {assignedLoading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : filteredAssignedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <p className="text-gray-500">No assigned users found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAssignedUsers.map((user, index) => (
                                        <tr key={user.assignment_id || user.user_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-900">{(assignedPage - 1) * 10 + index + 1}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {user.first_name} {user.last_name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{user.contact_no || user.mobile_number}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                    {user.districtName || currentPanel.metadata?.stateName || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span
                                                    className={`px-2 py-1 text-xs font-medium rounded-full ${(user.isActive === 1 || user.is_active)
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    {(user.isActive === 1 || user.is_active) ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {user.assigned_at
                                                    ? new Date(user.assigned_at).toLocaleDateString()
                                                    : user.created_on
                                                        ? new Date(user.created_on).toLocaleDateString()
                                                        : "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <button
                                                    onClick={() => openUnassignModal(user.user_id, `${user.first_name} ${user.last_name}`)}
                                                    disabled={processingUserId === user.user_id}
                                                    className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {processingUserId === user.user_id ? "..." : "Unassign"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination for Assigned Users */}
                    {assignedTotalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <button
                                onClick={() => setAssignedPage((p) => Math.max(1, p - 1))}
                                disabled={assignedPage === 1}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {assignedPage} of {assignedTotalPages}
                            </span>
                            <button
                                onClick={() => setAssignedPage((p) => Math.min(assignedTotalPages, p + 1))}
                                disabled={assignedPage === assignedTotalPages}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                // Available Users Table
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">S.No</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Mobile</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">District</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : filteredUnassignedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <p className="text-gray-500">No available users found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUnassignedUsers.map((user, index) => (
                                        <tr key={user.user_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {user.first_name} {user.last_name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{user.contact_no}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{user.districtName || "N/A"}</td>
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
                                                    {processingUserId === user.user_id ? "..." : "Assign"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={closeUnassignModal}
                onConfirm={handleUnassignUser}
                title="Unassign User"
                message={`Are you sure you want to unassign ${confirmModal.userName} from ${currentPanel?.metadata?.stateName}? This action cannot be undone.`}
                confirmText="Unassign"
                cancelText="Cancel"
                isLoading={processingUserId === confirmModal.userId}
            />
        </div>
    );
}
