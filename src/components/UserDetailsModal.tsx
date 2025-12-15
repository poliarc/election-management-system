import { useState, useEffect, useRef } from 'react';
import type { HierarchyUser } from '../types/hierarchy';
import { useDeleteAssignedLocationsMutation } from '../store/api/stateMasterApi';
import { useDeleteAssignedLevelsMutation } from '../store/api/afterAssemblyApi';

interface UserDetailsModalProps {
    users: HierarchyUser[];
    locationName: string;
    locationId: number;
    locationType?: 'State' | 'District' | 'Assembly' | 'Block' | 'Mandal' | 'Booth';
    isOpen: boolean;
    onClose: () => void;
    onUserDeleted?: () => void;
}

export default function UserDetailsModal({ users, locationName, locationId, locationType = 'District', isOpen, onClose, onUserDeleted }: UserDetailsModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };

        if (openMenuId !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    // Use different APIs based on location type
    // District uses state hierarchy API, Block/Mandal/Booth use after-assembly API
    const [deleteAssignedLocations, { isLoading: isLoadingLocations }] = useDeleteAssignedLocationsMutation();
    const [deleteAssignedLevels, { isLoading: isLoadingLevels }] = useDeleteAssignedLevelsMutation();

    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<HierarchyUser | null>(null);

    if (!isOpen) return null;

    // Determine which API to use based on location type
    const useAfterAssemblyApi = ['Block', 'Mandal', 'PollingCenter', 'Sector', 'Ward', 'Zone', 'Booth'].includes(locationType);
    const isDeleting = isLoadingLocations || isLoadingLevels;

    const handleDeleteClick = (user: HierarchyUser) => {
        setUserToDelete(user);
        setShowConfirmModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;

        try {
            setDeletingUserId(userToDelete.user_id);
            setShowConfirmModal(false);

            let response;

            if (useAfterAssemblyApi) {
                // Use after-assembly API for Block, Mandal, Booth
                response = await deleteAssignedLevels({
                    user_id: userToDelete.user_id,
                    afterAssemblyData_ids: [locationId]
                }).unwrap();
            } else {
                // Use state hierarchy API for District
                response = await deleteAssignedLocations({
                    userId: userToDelete.user_id,
                    stateMasterData_id: locationId
                }).unwrap();
            }

            if (response.success && response.deleted.length > 0) {
                // Successfully deleted, refresh the page
                if (onUserDeleted) {
                    onUserDeleted();
                }
            } else if (response.errors && response.errors.length > 0) {
                alert(`Error: ${response.errors[0].error || response.errors[0].message || 'Failed to delete user assignment'}`);
            }
        } catch (error: any) {
            console.error("Delete error:", error);
            alert(error?.data?.message || "Failed to delete user assignment. Please try again.");
        } finally {
            setDeletingUserId(null);
            setUserToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setShowConfirmModal(false);
        setUserToDelete(null);
    };

    // Filter users based on search and status
    const filteredUsers = users.filter(user => {
        const matchesSearch = searchTerm === '' ||
            user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.mobile_number.includes(searchTerm);

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && user.is_active) ||
            (filterStatus === 'inactive' && !user.is_active);

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto backdrop-blur-sm bg-black/30">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl">
                    {/* Header */}
                    <div className="bg-blue-600 px-6 py-4 rounded-t-lg flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-white">Assigned Users</h3>
                            <p className="text-sm text-blue-100 mt-1">{locationName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-blue-700 p-2 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search and Filter */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            Showing {filteredUsers.length} of {users.length} users
                        </p>
                    </div>

                    {/* Table */}
                    <div className="px-6 py-4 max-h-[500px] overflow-y-auto">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="mt-4 text-gray-600">No users found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">S.No</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Designation</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Phone Number</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Party</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredUsers.map((user, index) => (
                                            <tr key={user.assignment_id || index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {user.first_name} {user.last_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{user.role || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{user.mobile_number}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{user.party?.party_name || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span
                                                        className={`px-2 py-1 text-xs font-medium rounded-full ${user.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}
                                                    >
                                                        {user.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="relative inline-block text-left" ref={openMenuId === user.user_id ? menuRef : null}>
                                                        <button
                                                            onClick={() => setOpenMenuId(openMenuId === user.user_id ? null : user.user_id)}
                                                            disabled={deletingUserId === user.user_id}
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
                                                            title="More actions"
                                                        >
                                                            {deletingUserId === user.user_id ? (
                                                                <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                        
                                                        {openMenuId === user.user_id && (
                                                            <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg shadow-lg bg-white border border-gray-200 overflow-hidden">
                                                                <div className="py-1" role="menu">
                                                                    <button
                                                                        onClick={() => {
                                                                            handleDeleteClick(user);
                                                                            setOpenMenuId(null);
                                                                        }}
                                                                        className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                                                        role="menuitem"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                        Delete User
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            Total Users: <span className="font-semibold text-gray-900">{users.length}</span>
                        </p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && userToDelete && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-gray-900 text-center">
                                Confirm Deletion
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 text-center">
                                Are you sure you want to remove <span className="font-semibold">{userToDelete.first_name} {userToDelete.last_name}</span> from <span className="font-semibold">{locationName}</span>?
                            </p>
                            <p className="mt-2 text-xs text-gray-500 text-center">
                                This action will unassign the user from this location.
                            </p>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex gap-3 rounded-b-lg">
                            <button
                                onClick={handleCancelDelete}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
