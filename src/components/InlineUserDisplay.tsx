import { useState, useEffect, useRef } from 'react';
import type { HierarchyUser } from '../types/hierarchy';
import { useDeleteAssignedLocationsMutation } from '../store/api/stateMasterApi';
import { useDeleteAssignedLevelsMutation } from '../store/api/afterAssemblyApi';

interface InlineUserDisplayProps {
  users: HierarchyUser[];
  locationName: string;
  locationId: number;
  locationType: 'State' | 'District' | 'Assembly' | 'Block' | 'Mandal' | 'Booth' | 'PollingCenter';
  parentLocationName?: string;
  parentLocationType?: 'State' | 'District' | 'Assembly' | 'Block' | 'Mandal' | 'Booth' | 'PollingCenter';
  onUserDeleted: () => void;
  onClose: () => void;
  colSpan: number; // Number of columns to span in parent table
}

export default function InlineUserDisplay({
  users,
  locationName,
  locationId,
  locationType = 'District',
  parentLocationName,
  parentLocationType,
  onUserDeleted,
  onClose,
  colSpan
}: InlineUserDisplayProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<HierarchyUser | null>(null);
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

  // Determine which API to use based on location type
  const useAfterAssemblyApi = ['Block', 'Mandal', 'PollingCenter', 'Sector', 'Ward', 'Zone', 'Booth'].includes(locationType);
  const isDeleting = isLoadingLocations || isLoadingLevels;

  // Function to format hierarchical header text
  const formatHierarchicalHeader = (): string => {
    // Sanitize input strings to prevent XSS and handle edge cases
    const sanitizeString = (str?: string): string => {
      if (!str || typeof str !== 'string') return '';
      // Remove potentially dangerous characters and limit length
      return str.trim().replace(/[<>]/g, '').slice(0, 100);
    };

    // Validate location types against allowed values
    const validLocationTypes = ['State', 'District', 'Assembly', 'Block', 'Mandal', 'Booth', 'PollingCenter'];
    const isValidLocationType = (type?: string): boolean => {
      return type ? validLocationTypes.includes(type) : false;
    };

    const sanitizedParentName = sanitizeString(parentLocationName);
    const sanitizedLocationName = sanitizeString(locationName);
    const sanitizedParentType = isValidLocationType(parentLocationType) ? parentLocationType : undefined;
    const sanitizedLocationType = isValidLocationType(locationType) ? locationType : 'Location';

    // If no parent context is provided or invalid, fall back to current location only
    if (!sanitizedParentName || !sanitizedParentType) {
      return sanitizedLocationName || 'Unknown Location';
    }

    // Ensure we have valid current location name
    if (!sanitizedLocationName) {
      return `${sanitizedParentType}: ${sanitizedParentName}`;
    }

    // Format with hierarchical context: "Parent Type: Parent Name | Current Type: Current Name"
    return `${sanitizedParentType}: ${sanitizedParentName} | ${sanitizedLocationType}: ${sanitizedLocationName}`;
  };

  // Function to get parent column header
  const getParentColumnHeader = (): string | null => {
    const validLocationTypes = ['State', 'District', 'Assembly', 'Block', 'Mandal', 'Booth', 'PollingCenter'];
    if (parentLocationType && validLocationTypes.includes(parentLocationType)) {
      return parentLocationType;
    }
    return null;
  };

  // Function to get current location column header
  const getCurrentLocationColumnHeader = (): string => {
    const validLocationTypes = ['State', 'District', 'Assembly', 'Block', 'Mandal', 'Booth', 'PollingCenter'];
    if (locationType && validLocationTypes.includes(locationType)) {
      return locationType;
    }
    return 'Location';
  };

  // Function to get parent location name
  const getParentLocationName = (): string => {
    const sanitizeString = (str?: string): string => {
      if (!str || typeof str !== 'string') return '';
      return str.trim().replace(/[<>]/g, '').slice(0, 100);
    };
    return sanitizeString(parentLocationName) || '';
  };

  // Function to get current location name
  const getCurrentLocationName = (): string => {
    const sanitizeString = (str?: string): string => {
      if (!str || typeof str !== 'string') return '';
      return str.trim().replace(/[<>]/g, '').slice(0, 100);
    };
    return sanitizeString(locationName) || 'Unknown';
  };

  // Check if we should show parent column
  const shouldShowParentColumn = (): boolean => {
    return !!(parentLocationName && parentLocationType);
  };

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
        // Successfully deleted, refresh the data
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
      (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.mobile_number && user.mobile_number.includes(searchTerm)) ||
      (user.contact_no && user.contact_no.includes(searchTerm)) ||
      (user.phone && user.phone.includes(searchTerm));

    // Enhanced status checking for filtering
    const checkActiveStatus = (value: any): boolean => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value === 1;
      if (typeof value === 'string') return value === 'active' || value === '1' || value === 'true';
      return false;
    };

    let isUserActive = false;
    if (user.is_active !== undefined && user.is_active !== null) {
      isUserActive = checkActiveStatus(user.is_active);
    } else if (user.user_active !== undefined && user.user_active !== null) {
      isUserActive = checkActiveStatus(user.user_active);
    } else if (user.active !== undefined && user.active !== null) {
      isUserActive = checkActiveStatus(user.active);
    } else if (user.status !== undefined && user.status !== null) {
      isUserActive = checkActiveStatus(user.status);
    }
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && isUserActive) ||
      (filterStatus === 'inactive' && !isUserActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* Inline User Display Row */}
      <tr className="bg-blue-50 border-t-2 border-blue-200">
        <td colSpan={colSpan} className="px-0 py-0">
          <div className="bg-gradient-to-b from-blue-50 to-white border-l-4 border-blue-400">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-400 to-indigo-500 px-6 py-3 border-b border-blue-200">
              <div className="flex items-center gap-4">
                {/* Title and Location Info */}
                <div className="flex-shrink-0">
                  <h4 className="text-lg font-semibold text-white">Assigned Users</h4>
                  <p className="text-xs text-blue-100">{formatHierarchicalHeader()}</p>
                </div>

                {/* Total Users Count */}
                <div className="flex-shrink-0">
                  <span className="text-sm text-white/90 font-medium">
                    Total: {users.length} users
                  </span>
                </div>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-1.5 text-sm border border-white/30 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-white/50 focus:border-transparent backdrop-blur-sm"
                >
                  <option value="all" className="text-gray-900">All Status</option>
                  <option value="active" className="text-gray-900">Active Only</option>
                  <option value="inactive" className="text-gray-900">Inactive Only</option>
                </select>
                
                
                {/* Search Input */}
                <div className="flex-1 max-w-xs">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-white/30 rounded-lg bg-white/10 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:border-transparent backdrop-blur-sm"
                  />
                </div>
                
                
                
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
                  title="Close user details"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* User Table */}
            <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="mt-4 text-gray-600">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase">S.No</th>
                        {shouldShowParentColumn() && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase">{getParentColumnHeader()}</th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase">{getCurrentLocationColumnHeader()}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Designation</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Phone Number</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-blue-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-blue-100">
                      {filteredUsers.map((user, index) => (
                        <tr key={user.assignment_id || index} className="hover:bg-blue-50 even:bg-gray-50/50">
                          <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                          {shouldShowParentColumn() && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="text-sm font-medium text-gray-900">
                                {getParentLocationName()}
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="text-sm font-medium text-gray-900">
                              {getCurrentLocationName()}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{user.role || user.designation || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {user.mobile_number || user.contact_no || user.phone || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {(() => {
                              // Enhanced status checking with more field variations
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
                              }

                              return (
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                  {isActive ? 'Active' : 'Inactive'}
                                </span>
                              );
                            })()}
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


          </div>
        </td>
      </tr>

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
              <p className="mt-1 text-xs text-gray-500 text-center">
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
    </>
  );
}