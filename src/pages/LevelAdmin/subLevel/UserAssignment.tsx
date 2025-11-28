import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import toast from "react-hot-toast";
import { fetchHierarchyChildren } from "../../../services/hierarchyApi";
import {
    fetchAfterAssemblyDataByAssembly,
    fetchChildLevelsByParent,
    assignUserToAfterAssembly,
    unassignUserFromAfterAssembly,
    fetchAssignedUsersForLevel,
    type AfterAssemblyData,
} from "../../../services/afterAssemblyApi";
import { fetchUsersByPartyAndState, type User } from "../../../services/levelAdminApi";
import type { HierarchyChild } from "../../../types/hierarchy";
import ConfirmationModal from "../../../components/ConfirmationModal";

export default function UserAssignment() {
    const { levelId } = useParams<{ levelId: string }>();
    const { levelAdminPanels } = useAppSelector((state) => state.auth);

    const [districts, setDistricts] = useState<HierarchyChild[]>([]);
    const [assemblies, setAssemblies] = useState<HierarchyChild[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [assignedUsers, setAssignedUsers] = useState<any[]>([]);

    const [selectedDistrict, setSelectedDistrict] = useState<HierarchyChild | null>(null);
    const [selectedAssembly, setSelectedAssembly] = useState<HierarchyChild | null>(null);

    // Dynamic hierarchy path: array of selected levels from root to current
    const [hierarchyPath, setHierarchyPath] = useState<AfterAssemblyData[]>([]);
    // Available options for each level in the hierarchy
    const [levelOptions, setLevelOptions] = useState<AfterAssemblyData[][]>([]);

    const [loading, setLoading] = useState(true);
    const [assembliesLoading, setAssembliesLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [processingUserId, setProcessingUserId] = useState<number | null>(null);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        userId: number | null;
        userName: string;
        levelId: number | null;
    }>({
        isOpen: false,
        userId: null,
        userName: "",
        levelId: null,
    });

    const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

    // Handle selecting a level in the hierarchy - dynamically load children
    const handleLevelSelect = async (levelIndex: number, selectedLevel: AfterAssemblyData | null) => {
        if (!selectedLevel) {
            // Clear from this level onwards
            setHierarchyPath(prev => prev.slice(0, levelIndex));
            setLevelOptions(prev => prev.slice(0, levelIndex + 1));
            return;
        }

        // Update hierarchy path
        const newPath = [...hierarchyPath.slice(0, levelIndex), selectedLevel];
        setHierarchyPath(newPath);

        // Check if this is the panel's level - if so, don't load children
        if (selectedLevel.levelName === currentPanel?.name) {
            // This is the final level, don't show more options
            setLevelOptions(prev => prev.slice(0, levelIndex + 1));
            return;
        }

        // Load children for the next level using the parent API
        try {
            setDataLoading(true);
            const response = await fetchChildLevelsByParent(selectedLevel.id);

            if (response.success && response.data.length > 0) {
                // Show all children (don't filter yet - let user navigate through hierarchy)
                setLevelOptions(prev => [...prev.slice(0, levelIndex + 1), response.data]);
            } else {
                // No children
                setLevelOptions(prev => prev.slice(0, levelIndex + 1));
            }
        } catch (error) {
            console.error("Failed to load child levels:", error);
            setLevelOptions(prev => prev.slice(0, levelIndex + 1));
        } finally {
            setDataLoading(false);
        }
    };

    // Get the currently selected level (last in hierarchy path)
    const selectedLevel = hierarchyPath.length > 0 ? hierarchyPath[hierarchyPath.length - 1] : null;

    // Load districts
    useEffect(() => {
        const loadDistricts = async () => {
            const metadata = currentPanel?.metadata;
            if (!metadata?.stateId) return;

            try {
                setLoading(true);
                const response = await fetchHierarchyChildren(metadata.stateId, {
                    page: 1,
                    limit: 1000
                });

                if (response.success && response.data?.children) {
                    setDistricts(response.data.children);
                }
            } catch (error) {
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
                const response = await fetchHierarchyChildren(selectedDistrict.location_id, {
                    page: 1,
                    limit: 1000
                });

                if (response.success && response.data?.children) {
                    setAssemblies(response.data.children);
                }
            } catch (error) {
                toast.error("Failed to load assemblies");
            } finally {
                setAssembliesLoading(false);
            }
        };

        loadAssemblies();
    }, [selectedDistrict]);

    // Load initial level data when assembly is selected - direct children of assembly
    useEffect(() => {
        const loadInitialLevelData = async () => {
            if (!selectedAssembly) {
                setLevelOptions([]);
                setHierarchyPath([]);
                return;
            }

            try {
                setDataLoading(true);
                const response = await fetchAfterAssemblyDataByAssembly(selectedAssembly.location_id);

                if (response.success && response.data.length > 0) {
                    // Show all direct children of assembly (not filtered by panel name yet)
                    setLevelOptions([response.data]);
                } else {
                    setLevelOptions([]);
                }
                setHierarchyPath([]);
            } catch (error) {
                toast.error("Failed to load level data");
                setLevelOptions([]);
            } finally {
                setDataLoading(false);
            }
        };

        loadInitialLevelData();
    }, [selectedAssembly]);

    // Load assigned users when hierarchy path changes (when a level is selected)
    useEffect(() => {
        const loadAssignedUsers = async () => {
            const selectedLevel = hierarchyPath.length > 0 ? hierarchyPath[hierarchyPath.length - 1] : null;

            if (!selectedLevel) {
                setAssignedUsers([]);
                return;
            }

            try {
                console.log("Fetching assigned users for level:", selectedLevel.id);
                const response = await fetchAssignedUsersForLevel(selectedLevel.id);
                console.log("Assigned users response:", response);

                if (response.success && response.users) {
                    console.log("Setting assigned users:", response.users);
                    setAssignedUsers(response.users);
                } else {
                    console.log("Response not successful or no users, setting empty array");
                    setAssignedUsers([]);
                }
            } catch (error) {
                console.error("Failed to load assigned users:", error);
                // If API doesn't exist yet, just set empty array
                setAssignedUsers([]);
            }
        };

        loadAssignedUsers();
    }, [hierarchyPath]);

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
                    const filteredUsers = response.data.filter((user: User) => !user.isSuperAdmin);
                    setAllUsers(filteredUsers);
                }
            } catch (error) {
                toast.error("Failed to load users");
            } finally {
                setUsersLoading(false);
            }
        };

        loadUsers();
    }, [currentPanel]);

    const assignedUserIds = useMemo(() => {
        return new Set((assignedUsers || []).map((u) => u.user_id || u.id));
    }, [assignedUsers]);

    const unassignedUsers = useMemo(() => {
        return (allUsers || []).filter((user) => !assignedUserIds.has(user.user_id));
    }, [allUsers, assignedUserIds]);

    const filteredUnassignedUsers = (unassignedUsers || []).filter((user) =>
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAssignUser = async (userId: number) => {
        const currentLevel = hierarchyPath.length > 0 ? hierarchyPath[hierarchyPath.length - 1] : null;
        if (!currentLevel) return;

        try {
            setProcessingUserId(userId);
            const response = await assignUserToAfterAssembly({
                user_id: userId,
                afterAssemblyData_id: currentLevel.id,
            });

            if (response.success) {
                toast.success("User assigned successfully");

                // Reload assigned users
                const updatedResponse = await fetchAssignedUsersForLevel(currentLevel.id);
                if (updatedResponse.success && updatedResponse.users) {
                    setAssignedUsers(updatedResponse.users);
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to assign user");
        } finally {
            setProcessingUserId(null);
        }
    };

    const openUnassignModal = (userId: number, userName: string, levelId: number) => {
        setConfirmModal({
            isOpen: true,
            userId,
            userName,
            levelId,
        });
    };

    const handleUnassignUser = async () => {
        if (!confirmModal.userId || !confirmModal.levelId) return;

        try {
            setProcessingUserId(confirmModal.userId);
            const response = await unassignUserFromAfterAssembly({
                user_id: confirmModal.userId,
                afterAssemblyData_ids: [confirmModal.levelId],
            });

            if (response.success) {
                toast.success("User unassigned successfully");

                // Reload assigned users using the levelId from confirmModal
                const updatedResponse = await fetchAssignedUsersForLevel(confirmModal.levelId);
                if (updatedResponse.success && updatedResponse.users) {
                    setAssignedUsers(updatedResponse.users);
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to unassign user");
        } finally {
            setProcessingUserId(null);
            setConfirmModal({ isOpen: false, userId: null, userName: "", levelId: null });
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
        <div className="p-6 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                    <h1 className="text-3xl font-bold text-gray-800">User Assignment</h1>
                    <p className="text-gray-600 mt-2">
                        Assign users to sub-levels in {currentPanel.metadata?.stateName}
                    </p>
                </div>
            </div>

            {/* Selection Dropdowns */}
            <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* District Select */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select District
                        </label>
                        <select
                            value={selectedDistrict?.location_id || ""}
                            onChange={(e) => {
                                const district = districts.find(d => d.location_id === Number(e.target.value));
                                setSelectedDistrict(district || null);
                                setSelectedAssembly(null);
                                setHierarchyPath([]);
                                setLevelOptions([]);
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                            disabled={loading}
                        >
                            <option value="">-- Select District --</option>
                            {(districts || []).map((district) => (
                                <option key={district.location_id} value={district.location_id}>
                                    {district.location_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Assembly Select */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Assembly
                        </label>
                        <select
                            value={selectedAssembly?.location_id || ""}
                            onChange={(e) => {
                                const assembly = assemblies.find(a => a.location_id === Number(e.target.value));
                                setSelectedAssembly(assembly || null);
                                setHierarchyPath([]);
                                setLevelOptions([]);
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                            disabled={!selectedDistrict || assembliesLoading}
                        >
                            <option value="">-- Select Assembly --</option>
                            {(assemblies || []).map((assembly) => (
                                <option key={assembly.location_id} value={assembly.location_id}>
                                    {assembly.location_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Dynamic Hierarchy Selects */}
                {selectedAssembly && levelOptions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {levelOptions.map((options, index) => {
                            const selectedValue = hierarchyPath[index]?.id || "";
                            const levelLabel = options.length > 0 ? `${options[0].levelName}` : `Level ${index + 1}`;

                            return (
                                <div key={index}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        {levelLabel}
                                    </label>
                                    <select
                                        value={selectedValue}
                                        onChange={(e) => {
                                            const level = options.find(l => l.id === Number(e.target.value));
                                            handleLevelSelect(index, level || null);
                                            setShowAssignModal(false);
                                        }}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                                    >
                                        <option value="">-- Select {levelLabel} --</option>
                                        {options.map((level) => (
                                            <option key={level.id} value={level.id}>
                                                {level.displayName} ({level.levelName})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Loading States */}
                {(loading || assembliesLoading || dataLoading) && (
                    <div className="mt-4 flex items-center justify-center text-gray-500">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-2"></div>
                        <span className="text-sm">Loading...</span>
                    </div>
                )}
            </div>

            {/* Users Section */}
            {selectedLevel && (
                <>
                    {/* Search */}
                    <div className="mb-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Users Content */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
                            <div className="flex justify-between items-center">
                                <div className="text-white">
                                    <h2 className="text-2xl font-bold">{selectedLevel?.displayName || 'Level'}</h2>
                                    <p className="text-purple-100 text-sm mt-1">{selectedLevel?.levelName || ''}</p>
                                </div>
                                <button
                                    onClick={() => setShowAssignModal(!showAssignModal)}
                                    className="flex items-center px-5 py-2.5 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-all font-semibold shadow-md"
                                >
                                    {showAssignModal ? (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            View Assigned
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Assign Users
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {!showAssignModal ? (
                            // Assigned Users
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Mobile</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {assignedUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center">
                                                    <p className="text-gray-500">No users assigned</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            (assignedUsers || []).map((user) => (
                                                <tr key={user.user_id || user.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        {user.first_name || user.firstName} {user.last_name || user.lastName}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {user.contact_no || user.mobile_number || user.mobileNumber || "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <button
                                                            onClick={() => {
                                                                if (selectedLevel?.id) {
                                                                    openUnassignModal(
                                                                        user.user_id || user.id,
                                                                        `${user.first_name || user.firstName} ${user.last_name || user.lastName}`,
                                                                        selectedLevel.id
                                                                    );
                                                                }
                                                            }}
                                                            disabled={processingUserId === (user.user_id || user.id)}
                                                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                                                        >
                                                            {processingUserId === (user.user_id || user.id) ? "..." : "Unassign"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            // Available Users
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Mobile</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {usersLoading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center">
                                                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto"></div>
                                                </td>
                                            </tr>
                                        ) : filteredUnassignedUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center">
                                                    <p className="text-gray-500">No available users</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            (filteredUnassignedUsers || []).map((user) => (
                                                <tr key={user.user_id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        {user.first_name} {user.last_name}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{user.contact_no}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <button
                                                            onClick={() => handleAssignUser(user.user_id)}
                                                            disabled={processingUserId === user.user_id}
                                                            className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
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
                        )}
                    </div>
                </>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, userId: null, userName: "", levelId: null })}
                onConfirm={handleUnassignUser}
                title="Unassign User"
                message={`Are you sure you want to unassign ${confirmModal.userName}?`}
                confirmText="Unassign"
                cancelText="Cancel"
            />
        </div>
    );
}
