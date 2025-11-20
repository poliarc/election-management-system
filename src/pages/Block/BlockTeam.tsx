import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useGetBlockTeamQuery } from '../../store/api/blockTeamApi';

export default function BlockTeam() {
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const levelId = selectedAssignment?.level_id;

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    // Use RTK Query hook
    const { data: blockTeamData, isLoading, isError, error } = useGetBlockTeamQuery(levelId!, {
        skip: !levelId, // Skip query if no levelId
    });

    // Filter users based on search and status
    const filteredUsers = blockTeamData?.users.filter(user => {
        const matchesSearch = searchTerm === '' ||
            user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.contact_no.includes(searchTerm);

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && user.user_active === 1) ||
            (filterStatus === 'inactive' && user.user_active === 0);

        return matchesSearch && matchesStatus;
    }) || [];

    if (!levelId) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6">
                    <div className="flex items-center">
                        <svg className="w-6 h-6 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <h3 className="text-yellow-800 font-semibold">No Block Selected</h3>
                            <p className="text-yellow-700">Please select a block from the panels page</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading block team...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
                    <div className="flex items-center">
                        <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="text-red-800 font-semibold">Error</h3>
                            <p className="text-red-700">{error && 'status' in error ? `Error: ${error.status}` : 'Failed to load block team'}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!blockTeamData) {
        return (
            <div className="p-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-gray-600">No block data available</p>
                </div>
            </div>
        );
    }

    const activeUsers = blockTeamData.users.filter(u => u.user_active === 1).length;
    const inactiveUsers = blockTeamData.total_users - activeUsers;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white mb-6">
                <h1 className="text-3xl font-bold">{blockTeamData.level.displayName}</h1>
                <p className="text-blue-100 mt-2">
                    {blockTeamData.level.assemblyName} Assembly • Manage and view block team members
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Total Users</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{blockTeamData.total_users}</p>
                        </div>
                        <div className="bg-blue-100 rounded-full p-3">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Active Users</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">{activeUsers}</p>
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
                            <p className="text-gray-600 text-sm font-medium">Inactive Users</p>
                            <p className="text-3xl font-bold text-red-600 mt-2">{inactiveUsers}</p>
                        </div>
                        <div className="bg-red-100 rounded-full p-3">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex gap-4 mb-4">
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
                <p className="text-sm text-gray-600">
                    Showing {filteredUsers.length} of {blockTeamData.users.length} users
                </p>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">S.No</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Mobile</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Party</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Assigned Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <p className="mt-2 text-gray-500 font-medium">No users found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, index) => (
                                    <tr key={user.assignment_id || index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {user.first_name} {user.last_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.contact_no}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{user.partyName || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${user.user_active === 1
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {user.user_active === 1 ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(user.assigned_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
