import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAfterAssemblyChildrenByParent, fetchAssignedUsersForLevel } from "../../services/afterAssemblyApi";
import { useDeleteAssignedLevelsMutation } from "../../store/api/afterAssemblyApi";
import toast from "react-hot-toast";
import InlineUserDisplay from "../../components/InlineUserDisplay";

export default function SubLevelChildHierarchy() {
    const { levelId } = useParams<{ levelId: string }>();
    const navigate = useNavigate();
    const [children, setChildren] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // State for inline user display
    const [expandedLevelId, setExpandedLevelId] = useState<number | null>(null);
    const [levelUsers, setLevelUsers] = useState<Record<number, any[]>>({});

    // Delete states
    const [deleteAssignedLevels] = useDeleteAssignedLevelsMutation();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any | null>(null);

    // User counts for each level
    const [userCounts, setUserCounts] = useState<Record<number, number>>({});



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
                // Load user counts for each child level
                loadUserCounts(response.data);
            }
        } catch (error) {
            console.error("Failed to load child levels:", error);
            toast.error("Failed to load child levels");
        } finally {
            setLoading(false);
        }
    };

    const loadUserCounts = async (childrenData: any[]) => {
        const counts: Record<number, number> = {};

        // Fetch user count for each child level
        for (const child of childrenData) {
            try {
                const response = await fetchAssignedUsersForLevel(child.id);
                if (response.success && response.users) {
                    counts[child.id] = response.users.length;
                } else {
                    counts[child.id] = 0;
                }
            } catch (error) {
                console.error(`Failed to load user count for level ${child.id}:`, error);
                counts[child.id] = 0;
            }
        }

        setUserCounts(counts);
    };

    const handleViewUsers = async (levelId: number) => {
        // If already expanded, collapse it
        if (expandedLevelId === levelId) {
            setExpandedLevelId(null);
            return;
        }

        // If users already loaded, just expand
        if (levelUsers[levelId]) {
            setExpandedLevelId(levelId);
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/after-assembly/${levelId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                    },
                }
            );
            const data = await response.json();
            
            if (data.success && data.data?.users) {
                // Store users data
                setLevelUsers(prev => ({
                    ...prev,
                    [levelId]: data.data.users
                }));
                setExpandedLevelId(levelId);
            } else {
                console.log('Level API Error or No Users:', data);
            }
        } catch (error) {
            console.error(`Error fetching users for level ${levelId}:`, error);
        }
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete || !expandedLevelId) return;

        try {
            setShowConfirmModal(false);

            const response = await deleteAssignedLevels({
                user_id: userToDelete.user_id,
                afterAssemblyData_ids: [expandedLevelId]
            }).unwrap();

            if (response.success) {
                toast.success("User unassigned successfully");
                // Update user count
                setUserCounts(prev => ({
                    ...prev,
                    [expandedLevelId]: Math.max(0, (prev[expandedLevelId] || 0) - 1)
                }));
                // Refresh the expanded level users
                setExpandedLevelId(null);
                setLevelUsers(prev => {
                    const updated = { ...prev };
                    delete updated[expandedLevelId];
                    return updated;
                });
            }
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error("Failed to unassign user");
        } finally {
            setUserToDelete(null);
        }
    };

    const handleAssignUser = (childId: number, childName: string) => {
        navigate(
            `/sublevel/${levelId}/assign-user?targetId=${childId}&targetName=${encodeURIComponent(childName || "")}`
        );
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600"></div>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>

                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Assign</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                            No child levels found
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((child, index) => (
                                        <>
                                            <tr key={child.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {indexOfFirstItem + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-100 text-teal-800">
                                                        {child.levelName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{child.displayName}</div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${child.isActive === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                        }`}>
                                                        {child.isActive === 1 ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleViewUsers(child.id)}
                                                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                                                                expandedLevelId === child.id
                                                                    ? "text-teal-700 bg-teal-100"
                                                                    : "text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                                                            }`}
                                                            title={expandedLevelId === child.id ? "Hide Users" : "View Users"}
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <span className="text-xs text-gray-600 font-medium">
                                                            ({userCounts[child.id] || 0})
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => handleAssignUser(child.id, child.displayName)}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-teal-600 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                                                        title="Assign User"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                            
                                            {/* Inline User Display */}
                                            {expandedLevelId === child.id && levelUsers[child.id] && (
                                                <InlineUserDisplay
                                                    users={levelUsers[child.id]}
                                                    locationName={child.displayName}
                                                    locationId={child.id}
                                                    locationType={child.levelName as 'State' | 'District' | 'Assembly' | 'Block' | 'Mandal' | 'Booth' | 'PollingCenter'}
                                                    
                                                    onUserDeleted={() => {
                                                        // Refresh user counts after deletion
                                                        setExpandedLevelId(null);
                                                        setLevelUsers(prev => {
                                                            const updated = { ...prev };
                                                            delete updated[child.id];
                                                            return updated;
                                                        });
                                                        // Reload user counts
                                                        loadUserCounts([child]);
                                                    }}
                                                    onClose={() => setExpandedLevelId(null)}
                                                    colSpan={6}
                                                />
                                            )}
                                        </>
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
                                            ? 'bg-teal-600 text-white'
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


        </div>
    );
}