import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fetchAfterAssemblyChildrenByParent, fetchAssignedUsersForLevel, fetchAssignedUsersForLevelPaginated, assignUserToAfterAssembly } from "../../services/afterAssemblyApi";
import { fetchUsersByPartyAndState } from "../../services/levelAdminApi";
import { useDeleteAssignedLevelsMutation } from "../../store/api/afterAssemblyApi";
import { useAppSelector } from "../../store/hooks";
import toast from "react-hot-toast";

export default function AfterAssemblyChildHierarchy() {
    const { levelId } = useParams<{ levelId: string }>();
    const [children, setChildren] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Modal states
    const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
    const [selectedLevelName, setSelectedLevelName] = useState<string>("");
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // View Users modal pagination and search states
    const [viewUsersSearchTerm, setViewUsersSearchTerm] = useState("");
    const [viewUsersCurrentPage, setViewUsersCurrentPage] = useState(1);
    const [viewUsersItemsPerPage] = useState(10);
    const [viewUsersTotalPages, setViewUsersTotalPages] = useState(1);
    const [viewUsersTotalCount, setViewUsersTotalCount] = useState(0);
    const [isSearching, setIsSearching] = useState(false);

    // Delete states
    const [deleteAssignedLevels] = useDeleteAssignedLevelsMutation();
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any | null>(null);

    // Assign user modal states
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignTargetId, setAssignTargetId] = useState<number | null>(null);
    const [assignTargetName, setAssignTargetName] = useState<string>("");
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [loadingAvailableUsers, setLoadingAvailableUsers] = useState(false);
    const [assigningUserId, setAssigningUserId] = useState<number | null>(null);
    const [userSearchTerm, setUserSearchTerm] = useState("");

    // Pagination states for user modal
    const [userCurrentPage, setUserCurrentPage] = useState(1);
    const [userItemsPerPage] = useState(10);
    const [userTotalPages, setUserTotalPages] = useState(1);
    const [userTotalCount, setUserTotalCount] = useState(0);

    // Get user info from auth state
    const { user, selectedAssignment } = useAppSelector((s) => s.auth);

    useEffect(() => {
        loadChildren();
    }, [levelId]);

    const loadChildren = async () => {
        if (!levelId) return;

        try {
            setLoading(true);
            const response = await fetchAfterAssemblyChildrenByParent(Number(levelId));

            if (response.success && response.data) {
                setChildren(response.data);
            }
        } catch (error) {
            console.error("Failed to load child levels:", error);
            toast.error("Failed to load child levels");
        } finally {
            setLoading(false);
        }
    };

    const loadViewUsers = async (page: number = 1, search: string = "", levelId?: number) => {
        const targetLevelId = levelId || selectedLevelId;
        if (!targetLevelId) return;

        try {
            setLoadingUsers(true);
            const response = await fetchAssignedUsersForLevelPaginated(
                targetLevelId,
                page,
                viewUsersItemsPerPage,
                search
            );

            if (response.success && response.users) {
                setUsers(response.users);
                if (response.pagination) {
                    setViewUsersTotalPages(response.pagination.totalPages);
                    setViewUsersTotalCount(response.pagination.total);
                } else {
                    // Fallback for non-paginated response
                    setViewUsersTotalPages(1);
                    setViewUsersTotalCount(response.users.length);
                }
            } else {
                // Try fallback to non-paginated API if paginated fails
                try {
                    const fallbackResponse = await fetchAssignedUsersForLevel(targetLevelId);
                    if (fallbackResponse.success && fallbackResponse.users) {
                        setUsers(fallbackResponse.users);
                        setViewUsersTotalPages(1);
                        setViewUsersTotalCount(fallbackResponse.users.length);
                    } else {
                        setUsers([]);
                    }
                } catch (fallbackError) {
                    console.error("Fallback API also failed:", fallbackError);
                    setUsers([]);
                }
            }
        } catch (error) {
            console.error("Failed to load users:", error);
            toast.error("Failed to load users");
            setUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleViewUsers = async (childId: number, childName: string) => {

        setSelectedLevelId(childId);
        setSelectedLevelName(childName);
        setViewUsersSearchTerm("");
        setViewUsersCurrentPage(1);
        setUsers([]);

        // Load first page of users
        await loadViewUsers(1, "", childId);
    };

    // Debounced search function
    const debouncedSearch = useCallback(
        (() => {
            let timeoutId: NodeJS.Timeout;
            return (searchValue: string) => {
                clearTimeout(timeoutId);
                setIsSearching(true);
                timeoutId = setTimeout(async () => {
                    setViewUsersCurrentPage(1);
                    await loadViewUsers(1, searchValue, selectedLevelId || undefined);
                    setIsSearching(false);
                }, 300);
            };
        })(),
        [selectedLevelId]
    );

    const handleViewUsersSearch = (searchValue: string) => {
        setViewUsersSearchTerm(searchValue);
        if (searchValue.trim() === "") {
            // If search is cleared, load immediately without debounce
            setIsSearching(true);
            setViewUsersCurrentPage(1);
            loadViewUsers(1, "", selectedLevelId || undefined).finally(() => setIsSearching(false));
        } else {
            debouncedSearch(searchValue);
        }
    };

    const handleViewUsersPageChange = async (page: number) => {
        setViewUsersCurrentPage(page);
        await loadViewUsers(page, viewUsersSearchTerm, selectedLevelId || undefined);
    };

    const handleCloseModal = () => {
        setSelectedLevelId(null);
        setSelectedLevelName("");
        setUsers([]);
        setViewUsersSearchTerm("");
        setViewUsersCurrentPage(1);
        setViewUsersTotalPages(1);
        setViewUsersTotalCount(0);
        setIsSearching(false);
    };

    const handleDeleteClick = (user: any) => {
        setUserToDelete(user);
        setShowConfirmModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete || !selectedLevelId) return;

        try {
            setDeletingUserId(userToDelete.user_id);
            setShowConfirmModal(false);

            const response = await deleteAssignedLevels({
                user_id: userToDelete.user_id,
                afterAssemblyData_ids: [selectedLevelId]
            }).unwrap();

            if (response.success) {
                toast.success("User unassigned successfully");
                // Reload users
                handleViewUsers(selectedLevelId, selectedLevelName);
            }
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error("Failed to unassign user");
        } finally {
            setDeletingUserId(null);
            setUserToDelete(null);
        }
    };

    const getStateId = () => {
        // For AfterAssemblyPanel, we need to get the actual state_id
        // Try to get it from selectedAssignment or fetch from localStorage
        let stateId = selectedAssignment?.stateMasterData_id;

        // If stateMasterData_id is actually an afterAssemblyData_id, we need to find the actual state_id
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
                // Also try to get from assemblyAssignments if available
                if (!stateId && parsed.assemblyAssignments && parsed.assemblyAssignments.length > 0) {
                    const assemblyAssignment = parsed.assemblyAssignments[0];
                    if (assemblyAssignment.stateMasterData_id) {
                        stateId = assemblyAssignment.stateMasterData_id;
                    }
                }
            }
        } catch (error) {
            console.error("Failed to get state_id:", error);
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
            setLoadingAvailableUsers(true);
            const response = await fetchUsersByPartyAndState(
                user.partyId,
                stateId,
                page,
                userItemsPerPage,
                search
            );

            if (response.success && response.data) {
                // Filter out superadmin users
                const filteredUsers = response.data.filter((u: any) => !u.isSuperAdmin || u.isSuperAdmin === 0);
                setAvailableUsers(filteredUsers);
                setUserTotalPages(response.pagination.totalPages);
                setUserTotalCount(response.pagination.total);
            }
        } catch (error) {
            console.error("Failed to load users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoadingAvailableUsers(false);
        }
    };

    const handleAssignUser = async (childId: number, childName: string) => {
        setAssignTargetId(childId);
        setAssignTargetName(childName);
        setShowAssignModal(true);
        setUserSearchTerm("");
        setUserCurrentPage(1);

        // Load first page of users
        await loadAvailableUsers(1, "");
    };

    const handleCloseAssignModal = () => {
        setShowAssignModal(false);
        setAssignTargetId(null);
        setAssignTargetName("");
        setAvailableUsers([]);
        setUserSearchTerm("");
        setUserCurrentPage(1);
        setUserTotalPages(1);
        setUserTotalCount(0);
    };

    const handleConfirmAssign = async (userId: number) => {
        if (!assignTargetId) return;

        try {
            setAssigningUserId(userId);

            const response = await assignUserToAfterAssembly({
                user_id: userId,
                afterAssemblyData_id: assignTargetId,
            });

            if (response.success) {
                toast.success("User assigned successfully");
                handleCloseAssignModal();
            }
        } catch (error: any) {
            console.error("Assign error:", error);
            toast.error(error.message || "Failed to assign user");
        } finally {
            setAssigningUserId(null);
        }
    };

    const handleUserSearch = async (searchValue: string) => {
        setUserSearchTerm(searchValue);
        setUserCurrentPage(1);
        await loadAvailableUsers(1, searchValue);
    };

    const handleUserPageChange = async (page: number) => {
        setUserCurrentPage(page);
        await loadAvailableUsers(page, userSearchTerm);
    };

    const filteredChildren = children.filter((child) => {
        const matchesSearch = child.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            child.levelName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = selectedLevelFilter === "" || child.id.toString() === selectedLevelFilter;
        return matchesSearch && matchesFilter;
    });

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredChildren.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredChildren.length / itemsPerPage);

    return (
        <div className="p-1 bg-gray-50 min-h-screen">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-3 mb-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Level
                        </label>
                        <select
                            value={selectedLevelFilter}
                            onChange={(e) => {
                                setSelectedLevelFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">All Levels</option>
                            {children.map((child) => (
                                <option key={child.id} value={child.id}>
                                    {child.displayName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Levels
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Level</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No child levels found
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((child, index) => (
                                        <tr key={child.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {indexOfFirstItem + index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {child.levelName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{child.displayName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{child.partyLevelName || child.levelName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${child.isActive === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                    }`}>
                                                    {child.isActive === 1 ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewUsers(child.id, child.displayName)}
                                                        className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        View Users
                                                    </button>
                                                    <button
                                                        onClick={() => handleAssignUser(child.id, child.displayName)}
                                                        className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                        </svg>
                                                        Assign User
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg mt-4">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(indexOfLastItem, filteredChildren.length)}</span> of{' '}
                                <span className="font-medium">{filteredChildren.length}</span> results
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium ${currentPage === i + 1
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* View Users Modal */}
            {selectedLevelId && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Level Users</h2>
                                    <p className="text-indigo-100 mt-1">{selectedLevelName}</p>
                                </div>
                                <button onClick={handleCloseModal} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    {isSearching ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                    ) : (
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search users by name, email, or mobile..."
                                    value={viewUsersSearchTerm}
                                    onChange={(e) => handleViewUsersSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingUsers ? (
                                <div className="text-center py-12">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : users.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    {viewUsersSearchTerm ? "No users found matching your search" : "No users assigned"}
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">State Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Date</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map((user, index) => (
                                            <tr key={user.user_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {((viewUsersCurrentPage - 1) * viewUsersItemsPerPage) + index + 1}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {user.first_name} {user.last_name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{user.contact_no || "N/A"}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{user.partyName || "N/A"}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{user.stateName || "N/A"}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {user.assigned_at ? new Date(user.assigned_at).toLocaleDateString() : "N/A"}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleDeleteClick(user)}
                                                        disabled={deletingUserId === user.user_id}
                                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination */}
                        {viewUsersTotalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{((viewUsersCurrentPage - 1) * viewUsersItemsPerPage) + 1}</span> to{' '}
                                    <span className="font-medium">{Math.min(viewUsersCurrentPage * viewUsersItemsPerPage, viewUsersTotalCount)}</span> of{' '}
                                    <span className="font-medium">{viewUsersTotalCount}</span> users
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleViewUsersPageChange(viewUsersCurrentPage - 1)}
                                        disabled={viewUsersCurrentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(Math.min(5, viewUsersTotalPages))].map((_, i) => {
                                        const page = i + 1;
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => handleViewUsersPageChange(page)}
                                                className={`px-3 py-1 rounded text-sm font-medium ${viewUsersCurrentPage === page
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => handleViewUsersPageChange(viewUsersCurrentPage + 1)}
                                        disabled={viewUsersCurrentPage === viewUsersTotalPages}
                                        className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            {showConfirmModal && userToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-lg p-6 max-w-md">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Unassign</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to unassign {userToDelete.first_name} {userToDelete.last_name}?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setUserToDelete(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Unassign
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign User Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Assign User</h2>
                                    <p className="text-indigo-100 mt-1">{assignTargetName}</p>
                                </div>
                                <button onClick={handleCloseAssignModal} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col min-h-0">
                            {/* Search Bar */}
                            <div className="mb-4 flex-shrink-0">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search users by name or email..."
                                        value={userSearchTerm}
                                        onChange={(e) => handleUserSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Users List */}
                            <div className="flex-1 overflow-y-auto min-h-0">
                                {loadingAvailableUsers ? (
                                    <div className="text-center py-12">
                                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                                    </div>
                                ) : availableUsers.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        {userSearchTerm ? "No users found matching your search" : "No users available"}
                                    </div>
                                ) : (
                                    <div className="space-y-2 pb-4">
                                        {availableUsers.map((user) => (
                                            <div key={user.user_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-medium text-gray-900">
                                                                {user.first_name} {user.last_name}
                                                            </h4>
                                                            <p className="text-sm text-gray-500">{user.email}</p>
                                                            <p className="text-xs text-gray-400">
                                                                {user.contact_no} • {user.partyName} • {user.stateName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleConfirmAssign(user.user_id)}
                                                    disabled={assigningUserId === user.user_id}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                                >
                                                    {assigningUserId === user.user_id ? "Assigning..." : "Assign"}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {userTotalPages > 1 && (
                                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 flex-shrink-0">
                                    <div className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{((userCurrentPage - 1) * userItemsPerPage) + 1}</span> to{' '}
                                        <span className="font-medium">{Math.min(userCurrentPage * userItemsPerPage, userTotalCount)}</span> of{' '}
                                        <span className="font-medium">{userTotalCount}</span> users
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleUserPageChange(userCurrentPage - 1)}
                                            disabled={userCurrentPage === 1}
                                            className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        {[...Array(Math.min(5, userTotalPages))].map((_, i) => {
                                            const page = i + 1;
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => handleUserPageChange(page)}
                                                    className={`px-3 py-1 rounded text-sm font-medium ${userCurrentPage === page
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => handleUserPageChange(userCurrentPage + 1)}
                                            disabled={userCurrentPage === userTotalPages}
                                            className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
