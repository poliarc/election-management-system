import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    useCreateBlockAssignmentMutation,
    useGetBlockAssignmentsQuery,
} from "../../../store/api/blockApi";
import { useGetUsersWithFilterQuery } from "../../../store/api/blockApi";
import { useGetProfileQuery } from "../../../store/api/profileApi";
import { useGetAllStateMasterDataQuery } from "../../../store/api/stateMasterApi";
import { useDeleteAssignedLevelsMutation } from "../../../store/api/afterAssemblyApi";
import { useAppSelector } from "../../../store/hooks";
import toast from "react-hot-toast";
import type { HierarchyUser } from "../../../types/hierarchy";

export default function AssignBlock() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const blockId = searchParams.get("blockId");
    const blockName = searchParams.get("blockName");

    const { user } = useAppSelector((s) => s.auth);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [partyId, setPartyId] = useState<number | null>(null);
    const [stateId, setStateId] = useState<number | null>(null);
    const [stateIdSource, setStateIdSource] = useState<string>("");
    const [stateIdResolved, setStateIdResolved] = useState<boolean>(false);
    
    // Tab state
    const [activeTab, setActiveTab] = useState<'assign' | 'assigned'>('assign');
    const [assignedUsers, setAssignedUsers] = useState<HierarchyUser[]>([]);
    const [loadingAssignedUsers, setLoadingAssignedUsers] = useState(false);
    const [unassigningUserId, setUnassigningUserId] = useState<number | null>(null);


    // Get user profile to extract state name
    const { data: profileData, isLoading: profileLoading } = useGetProfileQuery();

    // Get all state master data to map state name to state_id
    const { data: stateMasterData, isLoading: stateLoading } = useGetAllStateMasterDataQuery();

    // Get party_id and state_id from user profile and state master data
    useEffect(() => {


        // Get party_id from auth user
        const userPartyId = user?.partyId;

        if (userPartyId) {

            setPartyId(userPartyId);
        }

        // Try to get state_id from auth user first (from Redux store)
        if (user?.state_id) {
            setStateId(user.state_id);
            setStateIdSource("auth_user_redux");
            setStateIdResolved(true);
            return; // Exit early if we found state_id
        }

        // Fallback: Try to get state_id from localStorage auth_user
        const authUser = localStorage.getItem("auth_user");
        if (authUser) {
            try {
                const parsedUser = JSON.parse(authUser);

                // Check multiple possible state_id fields
                const possibleStateId = parsedUser.state_id || parsedUser.stateId || parsedUser.user_state_id;
                if (possibleStateId) {
                    setStateId(possibleStateId);
                    setStateIdSource("localStorage");
                    setStateIdResolved(true);
                    return; // Exit early if we found state_id
                }

                // Fallback for party_id if not available from auth selector
                const fallbackPartyId = parsedUser.party_id || parsedUser.partyId;
                if (fallbackPartyId && !userPartyId) {
                    setPartyId(fallbackPartyId);
                }
            } catch (error) {
                // Silent error handling
            }
        }

        // Get state_id from profile + state master data
        if (profileData && stateMasterData) {
            // Find state_id by matching state name from profile with state master data
            const userStateName = profileData.state;

            if (userStateName && userStateName.trim()) {
                // Try multiple matching strategies
                let matchingState = stateMasterData.find(
                    (state) => state.levelName.toLowerCase().trim() === userStateName.toLowerCase().trim()
                );

                // If exact match not found, try partial matches
                if (!matchingState) {
                    matchingState = stateMasterData.find(
                        (state) =>
                            state.levelName.toLowerCase().includes(userStateName.toLowerCase().trim()) ||
                            userStateName.toLowerCase().includes(state.levelName.toLowerCase().trim())
                    );
                }

                // If still not found, try removing common words and matching
                if (!matchingState) {
                    const cleanUserState = userStateName.toLowerCase().replace(/\b(state|pradesh)\b/g, '').trim();
                    matchingState = stateMasterData.find(
                        (state) => {
                            const cleanStateName = state.levelName.toLowerCase().replace(/\b(state|pradesh)\b/g, '').trim();
                            return cleanStateName === cleanUserState ||
                                cleanStateName.includes(cleanUserState) ||
                                cleanUserState.includes(cleanStateName);
                        }
                    );
                }

                if (matchingState) {
                    const foundStateId = matchingState.stateMasterData_id || matchingState.id;

                    setStateId(foundStateId);
                    setStateIdSource("profile+stateMaster");
                    setStateIdResolved(true);
                } else if (stateMasterData.length > 0) {
                    // Fallback: use the first available state if no match found
                    const fallbackStateId = stateMasterData[0].stateMasterData_id || stateMasterData[0].id;

                    setStateId(fallbackStateId);
                    setStateIdSource("fallback");
                    setStateIdResolved(true);
                } else {
                    console.warn("No state master data available for state_id resolution");
                    // Mark as resolved even if we couldn't find a state_id
                    setStateIdResolved(true);
                }
            }
        }

        // If we've processed all data sources and still no stateId, try one more fallback
        if (!profileLoading && !stateLoading && !stateId && !stateIdResolved) {
            if (stateMasterData && stateMasterData.length > 0) {
                // Use the first available state as absolute fallback
                const absoluteFallbackStateId = stateMasterData[0].stateMasterData_id || stateMasterData[0].id;
                console.warn("Using absolute fallback state_id:", absoluteFallbackStateId);
                setStateId(absoluteFallbackStateId);
                setStateIdSource("absolute-fallback");
            } else {
                console.warn("Could not resolve state_id from any source - no state master data available");
                // Even if we can't find state_id, we should still try to fetch users with just party_id
                console.log("Will attempt to fetch users with party_id only");
            }
            setStateIdResolved(true);
        }
    }, [user, profileData, stateMasterData, profileLoading, stateLoading]);



    // Use the blockApi for consistency
    const { data: usersData, isLoading: loadingUsers, error: usersError } = useGetUsersWithFilterQuery(
        {
            partyId: partyId || undefined,
            stateId: stateId || undefined,
            page: currentPage,
            limit: pageSize,
            search: searchTerm,
        },
        {
            skip: profileLoading || stateLoading || !partyId,
            // Add refetch on mount to ensure fresh data
            refetchOnMountOrArgChange: true
        }
    );

    const users = usersData?.users || [];
    const pagination = usersData?.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
    };

    // Debug logging
    console.log("AssignBlock Debug:", {
        partyId,
        stateId,
        stateIdSource,
        stateIdResolved,
        usersDataLength: users.length,
        loadingUsers,
        usersError,
        searchTerm,
        currentPage
    });

    // Fetch already assigned users
    const { data: assignedData } = useGetBlockAssignmentsQuery(
        Number(blockId),
        { skip: !blockId }
    );

    // Fetch assigned users with full details
    const fetchAssignedUsers = async () => {
        if (!blockId) return;
        try {
            setLoadingAssignedUsers(true);
            // Use the existing assigned data from the query
            if (assignedData?.users) {
                setAssignedUsers(assignedData.users);
                const assignedIds = assignedData.users.map((user: any) => user.user_id);
                setAssignedUserIds(assignedIds);
                setSelectedUsers(assignedIds);
            }
        } catch (e) {
            console.error("Error processing assigned users:", e);
        } finally {
            setLoadingAssignedUsers(false);
        }
    };

    // Set assigned user IDs when data is loaded
    useEffect(() => {
        fetchAssignedUsers();
    }, [assignedData]);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Clear selected users when users data changes (except assigned ones)
    useEffect(() => {
        setSelectedUsers(assignedUserIds);
    }, [usersData, assignedUserIds]);



    const [createAssignment, { isLoading: isAssigning }] =
        useCreateBlockAssignmentMutation();
    
    const [deleteAssignedLevels] = useDeleteAssignedLevelsMutation();

    // Filter only active users (search is handled by API)
    const filteredUsers = users.filter(
        (user) => user.isActive === 1 && user.isSuperAdmin !== 1
    );

    const handleUserToggle = (userId: number) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAssign = async () => {
        if (selectedUsers.length === 0) {
            toast.error("Please select at least one user");
            return;
        }

        if (!blockId) {
            toast.error("Block ID not found");
            return;
        }

        try {
            const promises = selectedUsers.map((userId) =>
                createAssignment({
                    user_id: userId,
                    afterAssemblyData_id: Number(blockId),
                }).unwrap()
            );

            await Promise.all(promises);
            toast.success(
                `Successfully assigned ${selectedUsers.length} user(s) to block`
            );
            // Refresh assigned users list
            fetchAssignedUsers();
            // Switch to assigned tab to show the newly assigned users
            setActiveTab('assigned');
        } catch (error: any) {
            console.error(error?.data?.message);
            navigate("/assembly/block");
            window.location.reload();
        }
    };

    const handleUnassign = async (userId: number, userName: string) => {
        if (!blockId) {
            toast.error("Block ID not found");
            return;
        }
        
        try {
            setUnassigningUserId(userId);
            const response = await deleteAssignedLevels({
                user_id: userId,
                afterAssemblyData_ids: [Number(blockId)]
            }).unwrap();

            if (response.success && response.summary.success > 0) {
                toast.success(`Unassigned ${userName} from block`);
                
                // Update local state immediately - user will disappear from list instantly
                setAssignedUsers(prev => prev.filter(user => user.user_id !== userId));
                setAssignedUserIds(prev => prev.filter(id => id !== userId));
                setSelectedUsers(prev => prev.filter(id => id !== userId));
                
                // Note: Removed fetchAssignedUsers() call as it was overwriting our immediate state updates
                // The RTK Query cache invalidation will handle background data refresh
            } else {
                const errorMessage = response.errors?.[0]?.error || "Failed to unassign user";
                toast.error(errorMessage);
            }
        } catch (e: any) {
            toast.error(e?.data?.message || "Failed to unassign user");
        } finally {
            setUnassigningUserId(null);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    if (profileLoading || stateLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="ml-3 text-gray-600">
                                Loading {profileLoading ? "user profile" : "state data"}...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!blockId || !blockName) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
                    <p className="text-red-600">Invalid block information</p>
                    <button
                        onClick={() => navigate("/assembly/block")}
                        className="mt-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                    >
                        Back to Block List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-1">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-3">
                    <div className="mb-1">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate("/assembly/block")}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Back to Block List"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Manage Block Users
                            </h1>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 px-13">
                            Block: <span className="font-medium">{blockName}</span>
                        </p>
                        {/* {stateId && (
                            <p className="text-xs text-blue-600 mt-1">
                                Using state_id: {stateId} (source: {stateIdSource})
                            </p>
                        )} */}
                        {!stateId && (
                            <p className="text-xs text-red-600 mt-1">
                                Warning: state_id not found - this may limit user filtering
                            </p>
                        )}


                    </div>

                    {/* Tab Navigation */}
                    <div className="mb-1">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('assign')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'assign'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Assign Users
                                </button>
                                <button
                                    onClick={() => setActiveTab('assigned')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === 'assigned'
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Assigned Users ({assignedUsers.length})
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'assign' ? (
                        <>
                            <div className="mb-1">
                        <input
                            type="text"
                            placeholder="Search users by name, email, or contact number..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />

                    </div>

                    {loadingUsers ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Loading users...</p>
                        </div>
                    ) : usersError ? (
                        <div className="text-center py-8">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                                <p className="text-red-600 font-medium">Error loading users</p>
                                <p className="text-red-500 text-sm mt-2">
                                    {usersError && 'status' in usersError ? `Error: ${usersError.status}` : 'Please try again later.'}
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-4 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-1 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    {selectedUsers.length} user(s) selected | {pagination.total} total users
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleAssign}
                                        disabled={isAssigning || selectedUsers.length === 0}
                                        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                                    >
                                        {isAssigning ? "Assigning..." : "Assign Selected Users"}
                                    </button>
                                    
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                                {filteredUsers.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        <p>No users found</p>
                                        {/* Debug information */}
                                        <div className="mt-4 text-xs text-gray-400 space-y-1">
                                            <p>Debug Info:</p>
                                            <p>Party ID: {partyId || 'Not set'}</p>
                                            <p>State ID: {stateId || 'Not set'}</p>
                                            <p>Total users from API: {users.length}</p>
                                            <p>Filtered users: {filteredUsers.length}</p>
                                            <p>Search term: {searchTerm || 'None'}</p>
                                            <p>State resolved: {stateIdResolved ? 'Yes' : 'No'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200">
                                        {filteredUsers.map((user) => {
                                            const isSelected = selectedUsers.includes(user.user_id);
                                            const isAlreadyAssigned = assignedUserIds.includes(user.user_id);

                                            return (
                                                <div
                                                    key={user.user_id}
                                                    className={`p-4 hover:bg-blue-50 ${isAlreadyAssigned ? 'bg-blue-50' : ''}`}
                                                >
                                                    <label className="flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleUserToggle(user.user_id)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                        />
                                                        <div className="ml-3 flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-medium text-gray-900">
                                                                            {user.first_name} {user.last_name}
                                                                        </p>
                                                                        {isAlreadyAssigned && (
                                                                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                                Already Assigned
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-gray-600">
                                                                        {user.email}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {user.role} | {user.contact_no}
                                                                    </p>
                                                                    
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing {(currentPage - 1) * pageSize + 1} to{" "}
                                        {Math.min(currentPage * pageSize, pagination.total)} of{" "}
                                        {pagination.total} results
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                                            if (pageNum > pagination.totalPages) return null;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-3 py-1 text-sm border rounded-md ${currentPage === pageNum
                                                        ? "bg-blue-600 text-white border-blue-600"
                                                        : "border-gray-300 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === pagination.totalPages}
                                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={handleAssign}
                                    disabled={isAssigning || selectedUsers.length === 0}
                                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                                >
                                    {isAssigning ? "Assigning..." : "Assign Selected Users"}
                                </button>
                                <button
                                    onClick={() => navigate("/assembly/block")}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </>
            ) : (
                        /* Assigned Users Tab */
                        <>
                            {loadingAssignedUsers ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <p className="mt-2 text-gray-600">Loading assigned users...</p>
                                </div>
                            ) : assignedUsers.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="mt-2 text-gray-500 font-medium">No users assigned to this block</p>
                                    <p className="text-sm text-gray-400">Use the "Assign Users" tab to assign users to this block.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 text-sm text-gray-600">
                                        {assignedUsers.length} user(s) currently assigned to this block
                                    </div>
                                    <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                                        <div className="divide-y divide-gray-200">
                                            {assignedUsers.map((user) => (
                                                <div key={user.user_id} className="p-4 hover:bg-gray-50">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900">
                                                                {user.first_name} {user.last_name}
                                                            </p>
                                                            <p className="text-sm text-gray-600">{user.email}</p>
                                                            <p className="text-xs text-gray-500">
                                                                 {user.mobile_number || user.contact_no}
                                                            </p>
                                                            <div className="mt-1 flex items-center gap-2">
                                                                {user.assigned_at && (
                                                                    <span className="text-xs text-gray-400">
                                                                        Assigned: {new Date(user.assigned_at).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleUnassign(user.user_id, `${user.first_name} ${user.last_name}`)}
                                                            disabled={unassigningUserId === user.user_id}
                                                            className="ml-4 bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            {unassigningUserId === user.user_id ? "Unassigning..." : "Unassign"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-6">
                                        <button
                                            onClick={() => navigate("/assembly/block")}
                                            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Back to Block List
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
