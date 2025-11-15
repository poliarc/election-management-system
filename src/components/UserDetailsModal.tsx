import { useState } from 'react';
import type { HierarchyUser } from '../types/hierarchy';

interface UserDetailsModalProps {
    users: HierarchyUser[];
    locationName: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function UserDetailsModal({ users, locationName, isOpen, onClose }: UserDetailsModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    if (!isOpen) return null;

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
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Username</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Mobile</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Party</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Assigned Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredUsers.map((user, index) => (
                                            <tr key={user.assignment_id || index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {user.first_name} {user.last_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{user.user_name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
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
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {new Date(user.assigned_at).toLocaleDateString()}
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
        </div>
    );
}
