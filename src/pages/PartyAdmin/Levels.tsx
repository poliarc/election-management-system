import React, { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Plus, Network, Edit, Trash2, ToggleLeft, ToggleRight, UserPlus, X, Eye } from "lucide-react";
import toast from "react-hot-toast";
import {
    useGetPartyWiseLevelsByPartyQuery,
    useCreatePartyWiseLevelMutation,
    useUpdatePartyWiseLevelMutation,
    useDeletePartyWiseLevelMutation,
    useActivatePartyWiseLevelMutation,
    useDeactivatePartyWiseLevelMutation,
    useRemoveAdminFromLevelMutation,
    type PartyWiseLevel,
    type CreatePartyWiseLevelRequest,
} from "../../store/api/partyWiseLevelApi";
import { useGetAllStateMasterDataQuery } from "../../store/api/stateMasterApi";
import { useGetUsersByPartyQuery } from "../../store/api/partyUserApi";

export const PartyAdminLevels: React.FC = () => {
    const { partyId, stateId: urlStateId } = useParams<{ partyId: string; stateId?: string }>();
    const [showForm, setShowForm] = useState(false);
    const [editingLevel, setEditingLevel] = useState<PartyWiseLevel | null>(null);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<PartyWiseLevel | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [levelToDelete, setLevelToDelete] = useState<number | null>(null);
    const [showViewAdminsModal, setShowViewAdminsModal] = useState(false);
    const [viewingLevel, setViewingLevel] = useState<PartyWiseLevel | null>(null);
    const [showRemoveAdminModal, setShowRemoveAdminModal] = useState(false);
    const [adminToRemove, setAdminToRemove] = useState<{ id: number; name: string } | null>(null);
    const [filterStateId, setFilterStateId] = useState<number>(urlStateId ? Number(urlStateId) : 0);
    const formRef = useRef<HTMLDivElement>(null);

    const { data: levels = [], isLoading, refetch } = useGetPartyWiseLevelsByPartyQuery(
        Number(partyId),
        { skip: !partyId }
    );

    const { data: stateMasterData = [] } = useGetAllStateMasterDataQuery();
    const { data: usersResponse } = useGetUsersByPartyQuery(
        {
            partyId: Number(partyId),
            params: { page: 1, limit: 100 },
        },
        { skip: !partyId }
    );
    const [createLevel, { isLoading: isCreating }] = useCreatePartyWiseLevelMutation();
    const [updateLevel, { isLoading: isUpdating }] = useUpdatePartyWiseLevelMutation();
    const [deleteLevel] = useDeletePartyWiseLevelMutation();
    const [activateLevel] = useActivatePartyWiseLevelMutation();
    const [deactivateLevel] = useDeactivatePartyWiseLevelMutation();
    const [removeAdminFromLevel] = useRemoveAdminFromLevelMutation();

    const users = usersResponse?.data || [];

    // Filter levels by state if selected
    const filteredLevels = React.useMemo(() => {
        if (filterStateId === 0) return levels;
        return levels.filter((level) => level.state_id === filterStateId);
    }, [levels, filterStateId]);

    // Group levels by their configuration (same level_name, party_id, state_id, parent_level)
    // and get unique levels for display
    const { groupedLevels, uniqueLevels } = React.useMemo(() => {
        const groups = new Map<string, PartyWiseLevel[]>();
        const unique: PartyWiseLevel[] = [];
        const seenKeys = new Set<string>();

        filteredLevels.forEach((level) => {
            const key = `${level.level_name}-${level.party_id}-${level.state_id}-${level.parent_level || 'null'}`;

            // Add to groups
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(level);

            // Add to unique list (only first occurrence)
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                unique.push(level);
            }
        });

        return { groupedLevels: groups, uniqueLevels: unique };
    }, [filteredLevels]);

    const states = stateMasterData.filter(
        (item) => item.levelType === "State" && item.isActive === 1
    );

    // Sync URL state parameter with filter
    React.useEffect(() => {
        if (urlStateId) {
            setFilterStateId(Number(urlStateId));
        }
    }, [urlStateId]);

    const handleCreate = async (data: CreatePartyWiseLevelRequest) => {
        try {
            await createLevel(data).unwrap();
            toast.success("Level created successfully!");
            setShowForm(false);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to create level");
        }
    };

    const handleUpdate = async (data: Partial<CreatePartyWiseLevelRequest>) => {
        if (!editingLevel) return;
        try {
            await updateLevel({
                id: editingLevel.party_wise_id,
                data,
            }).unwrap();
            toast.success("Level updated successfully!");
            setShowForm(false);
            setEditingLevel(null);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to update level");
        }
    };

    const handleEdit = (level: PartyWiseLevel) => {
        setEditingLevel(level);
        setShowForm(true);
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    };

    const handleDelete = async () => {
        if (!levelToDelete) return;
        try {
            await deleteLevel(levelToDelete).unwrap();
            toast.success("Level deleted successfully!");
            setShowDeleteModal(false);
            setLevelToDelete(null);
            refetch();
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete level");
        }
    };

    const openDeleteModal = (id: number) => {
        setLevelToDelete(id);
        setShowDeleteModal(true);
    };

    const handleToggleStatus = async (level: PartyWiseLevel) => {
        try {
            if (level.isActive === 1) {
                await deactivateLevel(level.party_wise_id).unwrap();
                toast.success("Level deactivated successfully!");
            } else {
                await activateLevel(level.party_wise_id).unwrap();
                toast.success("Level activated successfully!");
            }
            // Don't refetch - rely on optimistic update to keep inactive items visible
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to toggle status");
        }
    };

    const handleAssignAdmin = (level: PartyWiseLevel) => {
        setSelectedLevel(level);
        setShowAdminModal(true);
    };

    const handleSelectAdmin = async (userId: number) => {
        if (!selectedLevel) return;
        try {
            // Check if this user is already assigned to this level
            const key = `${selectedLevel.level_name}-${selectedLevel.party_id}-${selectedLevel.state_id}-${selectedLevel.parent_level || 'null'}`;
            const levelAdmins = groupedLevels.get(key) || [];
            const isAlreadyAdmin = levelAdmins.some(
                (admin) => admin.party_level_admin_id === userId
            );

            if (isAlreadyAdmin) {
                toast.error("This user is already assigned to this level");
                return;
            }

            // Find a level record without an admin (party_level_admin_id is NULL) or use the current one
            const levelToUpdate = levelAdmins.find(l => !l.party_level_admin_id) || selectedLevel;

            // Use the update API to assign the admin
            await updateLevel({
                id: levelToUpdate.party_wise_id,
                data: {
                    party_level_admin_id: userId,
                },
            }).unwrap();
            toast.success("Admin assigned successfully!");
            setShowAdminModal(false);
            setSelectedLevel(null);
            refetch();
        } catch (error: any) {
            console.error("Error assigning admin:", error);
            const errorMessage = error?.data?.message || error?.message || "Failed to assign admin";
            toast.error(errorMessage);
        }
    };

    const handleRemoveAdmin = async () => {
        if (!adminToRemove) return;
        try {
            // The remove-admin API sets party_level_admin_id to NULL
            // instead of soft-deleting the record
            await removeAdminFromLevel(adminToRemove.id).unwrap();
            toast.success("Admin removed from level successfully!");
            setShowRemoveAdminModal(false);
            setAdminToRemove(null);
            // Close the view admins modal if no admins left
            if (viewingLevel) {
                const key = `${viewingLevel.level_name}-${viewingLevel.party_id}-${viewingLevel.state_id}-${viewingLevel.parent_level || 'null'}`;
                const admins = groupedLevels.get(key) || [];
                const adminsWithNames = admins.filter(a => a.party_level_admin_id && a.admin_name);
                if (adminsWithNames.length <= 1) {
                    setShowViewAdminsModal(false);
                    setViewingLevel(null);
                }
            }
            refetch();
        } catch (error: any) {
            console.error("Error removing admin:", error);
            const errorMessage = error?.data?.message || error?.message || "Failed to remove admin";
            toast.error(errorMessage);
        }
    };

    const openRemoveAdminModal = (partyWiseId: number, adminName: string) => {
        setAdminToRemove({ id: partyWiseId, name: adminName });
        setShowRemoveAdminModal(true);
    };

    const handleViewAdmins = (level: PartyWiseLevel) => {
        setViewingLevel(level);
        setShowViewAdminsModal(true);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Organizational Levels
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Manage your party's organizational hierarchy
                        </p>
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => {
                                setEditingLevel(null);
                                setShowForm(true);
                            }}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Level
                        </button>
                    )}
                </div>
            </div>

            {/* State Filter */}
            {!showForm && (
                <div className="mb-6 bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-700">
                            Filter by State:
                        </label>
                        <select
                            value={filterStateId}
                            onChange={(e) => setFilterStateId(Number(e.target.value))}
                            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={0}>All States</option>
                            {states.map((state) => (
                                <option key={state.id} value={state.id}>
                                    {state.levelName}
                                </option>
                            ))}
                        </select>
                        {filterStateId !== 0 && (
                            <span className="text-sm text-gray-600">
                                Showing {uniqueLevels.length} level{uniqueLevels.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div ref={formRef} className="mb-6">
                    <LevelForm
                        partyId={Number(partyId)}
                        level={editingLevel}
                        levels={levels}
                        states={states}
                        onSave={editingLevel ? handleUpdate : handleCreate}
                        onCancel={() => {
                            setShowForm(false);
                            setEditingLevel(null);
                        }}
                        isLoading={isCreating || isUpdating}
                    />
                </div>
            )}

            {/* Levels List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Network className="w-5 h-5" />
                        Levels ({uniqueLevels.length})
                    </h3>
                </div>

                {isLoading ? (
                    <div className="p-10 text-center text-gray-500">Loading levels...</div>
                ) : uniqueLevels.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                        No levels found. Click "Add Level" to create one.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Level Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Display Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Parent Level
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        State
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Level Admin
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {uniqueLevels.map((level) => (
                                    <tr key={level.party_wise_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {level.level_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {level.display_level_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">
                                                {level.parent_level_name || "-"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">
                                                {level.state_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {(() => {
                                                    const key = `${level.level_name}-${level.party_id}-${level.state_id}-${level.parent_level || 'null'}`;
                                                    const admins = groupedLevels.get(key) || [];
                                                    const adminsWithNames = admins.filter(a => a.party_level_admin_id && a.admin_name);

                                                    return (
                                                        <>
                                                            <span className="text-sm text-gray-900">
                                                                {adminsWithNames.length > 0
                                                                    ? `${adminsWithNames.length} Admin${adminsWithNames.length > 1 ? 's' : ''}`
                                                                    : 'No admin'}
                                                            </span>
                                                            {adminsWithNames.length > 0 && (
                                                                <button
                                                                    onClick={() => handleViewAdmins(level)}
                                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                                    title="View admins"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleAssignAdmin(level)}
                                                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                                title="Add admin"
                                                            >
                                                                <UserPlus className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleStatus(level)}
                                                className="flex items-center gap-2"
                                            >
                                                {level.isActive === 1 ? (
                                                    <>
                                                        <ToggleRight className="w-5 h-5 text-green-500" />
                                                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                                            Active
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                                                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                                            Inactive
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center gap-2 justify-end">
                                                <button
                                                    onClick={() => handleEdit(level)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(level.party_wise_id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Admin Selection Modal */}
            {showAdminModal && selectedLevel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                                <UserPlus className="w-5 h-5" />
                                Assign Admin for {selectedLevel.display_level_name}
                            </div>
                            <button
                                onClick={() => {
                                    setShowAdminModal(false);
                                    setSelectedLevel(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1">
                            {users.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No users found for this party
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {users.map((user) => {
                                        // Check if this user is already an admin for this level
                                        const key = `${selectedLevel.level_name}-${selectedLevel.party_id}-${selectedLevel.state_id}-${selectedLevel.parent_level || 'null'}`;
                                        const levelAdmins = groupedLevels.get(key) || [];
                                        const isAlreadyAdmin = levelAdmins.some(
                                            (admin) => admin.party_level_admin_id === user.user_id
                                        );

                                        return (
                                            <button
                                                key={user.user_id}
                                                onClick={() => handleSelectAdmin(user.user_id)}
                                                disabled={isAlreadyAdmin}
                                                className={`w-full p-4 border rounded-lg text-left transition-colors ${isAlreadyAdmin
                                                    ? "bg-gray-100 border-gray-300 cursor-not-allowed opacity-60"
                                                    : "border-gray-200 hover:bg-blue-50"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                            <span className="text-purple-600 font-semibold">
                                                                {user.first_name[0]}
                                                                {user.last_name[0]}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">
                                                                {user.first_name} {user.last_name}
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                {user.email}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {user.partyName || "No party"} •{" "}
                                                                {user.stateName || "No state"}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {user.role || "No role"} •{" "}
                                                                {user.districtName || "No district"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isAlreadyAdmin && (
                                                        <div className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                                            Already Admin
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* View Admins Modal */}
            {showViewAdminsModal && viewingLevel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                                <Eye className="w-5 h-5" />
                                Assigned Admins - {viewingLevel.display_level_name}
                            </div>
                            <button
                                onClick={() => {
                                    setShowViewAdminsModal(false);
                                    setViewingLevel(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1">
                            {(() => {
                                const key = `${viewingLevel.level_name}-${viewingLevel.party_id}-${viewingLevel.state_id}-${viewingLevel.parent_level || 'null'}`;
                                const admins = groupedLevels.get(key) || [];
                                const adminsWithNames = admins.filter(a => a.party_level_admin_id && a.admin_name);

                                if (adminsWithNames.length === 0) {
                                    return (
                                        <div className="text-center py-8 text-gray-500">
                                            No admins assigned to this level
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-3">
                                        {adminsWithNames.map((admin) => (
                                            <div
                                                key={admin.party_wise_id}
                                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span className="text-blue-600 font-semibold">
                                                            {admin.admin_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">
                                                            {admin.admin_name}
                                                        </div>
                                                        {admin.admin_email && (
                                                            <div className="text-sm text-gray-600">
                                                                {admin.admin_email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => openRemoveAdminModal(admin.party_wise_id, admin.admin_name)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Remove admin"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="px-5 py-4 border-t bg-gray-50">
                            <button
                                onClick={() => {
                                    setShowViewAdminsModal(false);
                                    setSelectedLevel(viewingLevel);
                                    setShowAdminModal(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add Another Admin
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Admin Confirmation Modal */}
            {showRemoveAdminModal && adminToRemove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Remove Admin
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Admin will be unassigned from this level
                                    </p>
                                </div>
                            </div>
                            <div className="mb-6">
                                <p className="text-gray-700 mb-3">
                                    Are you sure you want to remove <span className="font-semibold">{adminToRemove.name}</span> from this level?
                                </p>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-800">
                                        <span className="font-medium">Note:</span> The level will remain active and you can assign a new admin later.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRemoveAdminModal(false);
                                        setAdminToRemove(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRemoveAdmin}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                >
                                    Remove Admin
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Level Confirmation Modal */}
            {showDeleteModal && levelToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <Trash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Delete Level
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        This action cannot be undone
                                    </p>
                                </div>
                            </div>
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete this level? All associated data will be removed.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setLevelToDelete(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Level Form Component
interface LevelFormProps {
    partyId: number;
    level: PartyWiseLevel | null;
    levels: PartyWiseLevel[];
    states: any[];
    onSave: (data: any) => void;
    onCancel: () => void;
    isLoading: boolean;
}

const LevelForm: React.FC<LevelFormProps> = ({
    partyId,
    level,
    levels,
    states,
    onSave,
    onCancel,
    isLoading,
}) => {
    const [levelName, setLevelName] = useState(level?.level_name || "");
    const [displayName, setDisplayName] = useState(level?.display_level_name || "");
    const [parentLevel, setParentLevel] = useState<number | null>(
        level?.parent_level || null
    );
    const [stateId, setStateId] = useState(level?.state_id || 0);

    // Reset parent level when state changes if the selected parent is not in the new state
    React.useEffect(() => {
        if (stateId && parentLevel) {
            const selectedParent = levels.find(l => l.party_wise_id === parentLevel);
            if (selectedParent && selectedParent.state_id !== stateId) {
                setParentLevel(null);
            }
        }
    }, [stateId, parentLevel, levels]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            level_name: levelName,
            display_level_name: displayName,
            party_id: partyId,
            state_id: stateId,
            parent_level: parentLevel || null,
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
                {level ? "Edit Level" : "Create New Level"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Level Name *
                        </label>
                        <input
                            type="text"
                            value={levelName}
                            onChange={(e) => setLevelName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., State, District"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Display Name *
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., State Level"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            State *
                        </label>
                        <select
                            value={stateId}
                            onChange={(e) => setStateId(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value={0}>Select a state</option>
                            {states.map((state) => (
                                <option key={state.id} value={state.id}>
                                    {state.levelName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Parent Level
                        </label>
                        <select
                            value={parentLevel || ""}
                            onChange={(e) =>
                                setParentLevel(e.target.value ? Number(e.target.value) : null)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!stateId}
                        >
                            <option value="">No Parent (Top Level)</option>
                            {stateId ? (
                                levels
                                    .filter((l) =>
                                        l.party_wise_id !== level?.party_wise_id &&
                                        l.state_id === stateId &&
                                        l.party_id === partyId
                                    )
                                    .map((l) => (
                                        <option key={l.party_wise_id} value={l.party_wise_id}>
                                            {l.display_level_name}
                                        </option>
                                    ))
                            ) : (
                                <option value="" disabled>Select a state first</option>
                            )}
                        </select>
                        {!stateId && (
                            <p className="mt-1 text-xs text-gray-500">
                                Please select a state to see available parent levels
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isLoading ? "Saving..." : level ? "Update Level" : "Create Level"}
                    </button>
                </div>
            </form>
        </div>
    );
};
