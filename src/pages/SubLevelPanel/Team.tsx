import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchAssignedUsersForLevel } from "../../services/afterAssemblyApi";
import { useToggleUserStatusMutation } from "../../store/api/profileApi";
import toast from "react-hot-toast";

export default function SubLevelPanelTeam() {
    const { levelId } = useParams<{ levelId: string }>();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const [toggleLoading, setToggleLoading] = useState<number | null>(null);

    // RTK Query hook for toggling user status
    const [toggleUserStatusMutation] = useToggleUserStatusMutation();

    useEffect(() => {
        loadUsers();
    }, [levelId]);

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

    const filteredUsers = users.filter((user) =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_id?.toString().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.dropdown-container')) {
                setOpenDropdown(null);
            }
        };

        if (openDropdown) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openDropdown]);

    // Toggle user status function using RTK Query (same as InlineUserDisplay)
    const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
        setToggleLoading(userId);
        setOpenDropdown(null);

        try {
            const newStatus = !currentStatus;

            // Update local state immediately for instant UI feedback
            setUsers(prevUsers =>
                prevUsers.map(u =>
                    u.user_id === userId
                        ? {
                            ...u,
                            isActive: newStatus ? 1 : 0,
                            is_active: newStatus,
                            user_active: newStatus ? 1 : 0,
                            active: newStatus,
                            status: newStatus ? 1 : 0
                        }
                        : u
                )
            );

            const response = await toggleUserStatusMutation({
                id: userId,
                isActive: newStatus
            }).unwrap();

            if (response.success) {
                toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
                // Refresh the user list to get updated data from server
                loadUsers();
            } else {
                // Revert local state if API call failed
                loadUsers();
                toast.error(response.message || 'Failed to toggle user status');
            }
        } catch (error: any) {
            console.error("Toggle status error:", error);
            // Revert local state if API call failed
            loadUsers();
            toast.error(error?.data?.message || "Failed to toggle user status. Please try again.");
        } finally {
            setToggleLoading(null);
        }
    };

    return (
        <div className="p-1 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-md p-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Team Management</h1>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search team members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600"></div>
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
                                    User ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    State
                                </th>
                                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Assembly Name
                                </th> */}
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
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                        No team members found
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user, index) => (
                                    <tr key={user.user_id || user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {startIndex + index + 1}
                                        </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {user.user_id || "N/A"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{user.stateName || "N/A"}</div>
                                        </td>
                                        {/* <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {user.assemblyName || user.assembly_name || user.parentAssemblyName || user.parentId || "N/A"}
                                            </div>
                                        </td> */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {user.displayName || user.blockName || user.block_name || user.levelName || "N/A"}
                                            </div>
                                        </td>
                                       
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.first_name} {user.last_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {user.role_name || user.designation || user.role || "N/A"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </td>


                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(() => {
                                                // Enhanced status checking with multiple field variations
                                                const checkActiveStatus = (value: any): boolean => {
                                                    if (value === undefined || value === null) return false;
                                                    if (typeof value === 'boolean') return value;
                                                    if (typeof value === 'number') return value === 1;
                                                    if (typeof value === 'string') return value === 'active' || value === '1' || value === 'true';
                                                    return false;
                                                };

                                                let isActive = false;
                                                if (user.is_active !== undefined && user.is_active !== null) {
                                                    isActive = checkActiveStatus(user.is_active);
                                                } else if (user.user_active !== undefined && user.user_active !== null) {
                                                    isActive = checkActiveStatus(user.user_active);
                                                } else if (user.active !== undefined && user.active !== null) {
                                                    isActive = checkActiveStatus(user.active);
                                                } else if (user.status !== undefined && user.status !== null) {
                                                    isActive = checkActiveStatus(user.status);
                                                } else if (user.isActive !== undefined && user.isActive !== null) {
                                                    isActive = checkActiveStatus(user.isActive);
                                                }

                                                return (
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isActive
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                        }`}>
                                                        {isActive ? "Active" : "Inactive"}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="relative dropdown-container">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdown(openDropdown === user.user_id ? null : user.user_id);
                                                    }}
                                                    disabled={toggleLoading === user.user_id}
                                                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                                                >
                                                    {toggleLoading === user.user_id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                        </svg>
                                                    )}
                                                </button>

                                                {openDropdown === user.user_id && (
                                                    <div
                                                        className={`absolute right-0 z-50 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg max-h-32 overflow-y-auto ${index >= paginatedUsers.length - 2 ? 'transform -translate-y-full -mt-2' : ''
                                                            }`}
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Use same robust status checking
                                                                const checkActiveStatus = (value: any): boolean => {
                                                                    if (value === undefined || value === null) return false;
                                                                    if (typeof value === 'boolean') return value;
                                                                    if (typeof value === 'number') return value === 1;
                                                                    if (typeof value === 'string') return value === 'active' || value === '1' || value === 'true';
                                                                    return false;
                                                                };

                                                                let currentStatus = false;
                                                                if (user.is_active !== undefined && user.is_active !== null) {
                                                                    currentStatus = checkActiveStatus(user.is_active);
                                                                } else if (user.user_active !== undefined && user.user_active !== null) {
                                                                    currentStatus = checkActiveStatus(user.user_active);
                                                                } else if (user.active !== undefined && user.active !== null) {
                                                                    currentStatus = checkActiveStatus(user.active);
                                                                } else if (user.status !== undefined && user.status !== null) {
                                                                    currentStatus = checkActiveStatus(user.status);
                                                                } else if (user.isActive !== undefined && user.isActive !== null) {
                                                                    currentStatus = checkActiveStatus(user.isActive);
                                                                }

                                                                toggleUserStatus(user.user_id, currentStatus);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                        >
                                                            {(() => {
                                                                // Use same robust status checking for dropdown display
                                                                const checkActiveStatus = (value: any): boolean => {
                                                                    if (value === undefined || value === null) return false;
                                                                    if (typeof value === 'boolean') return value;
                                                                    if (typeof value === 'number') return value === 1;
                                                                    if (typeof value === 'string') return value === 'active' || value === '1' || value === 'true';
                                                                    return false;
                                                                };

                                                                let isActive = false;
                                                                if (user.is_active !== undefined && user.is_active !== null) {
                                                                    isActive = checkActiveStatus(user.is_active);
                                                                } else if (user.user_active !== undefined && user.user_active !== null) {
                                                                    isActive = checkActiveStatus(user.user_active);
                                                                } else if (user.active !== undefined && user.active !== null) {
                                                                    isActive = checkActiveStatus(user.active);
                                                                } else if (user.status !== undefined && user.status !== null) {
                                                                    isActive = checkActiveStatus(user.status);
                                                                } else if (user.isActive !== undefined && user.isActive !== null) {
                                                                    isActive = checkActiveStatus(user.isActive);
                                                                }

                                                                return isActive ? (
                                                                    <>

                                                                        Inactive
                                                                    </>
                                                                ) : (
                                                                    <>

                                                                        Active
                                                                    </>
                                                                );
                                                            })()}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
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
                                Page {currentPage} of {totalPages} ({filteredUsers.length} users)
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
