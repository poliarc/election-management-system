import { useState } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { useGetCreatorsListQuery, useGetSupportersByCreatedByQuery } from '../../../store/api/supportersApi';
import type { Supporter } from '../../../types/supporter';

export default function StateUserWiseSupportersPage() {
  const { user, selectedAssignment } = useAppSelector((s) => s.auth);
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingSupporter, setViewingSupporter] = useState<Supporter | null>(null);

  const stateId = user?.state_id || selectedAssignment?.stateMasterData_id || 0;
  const partyId = user?.partyId || 0;

  // Fetch creators list using Redux
  const { data: creatorsData } = useGetCreatorsListQuery({
    state_id: stateId,
    party_id: partyId,
  }, {
    skip: !stateId || !partyId,
  });

  const creators = creatorsData?.data || [];

  // Fetch supporters by selected user using Redux
  const { data: supportersData, isLoading: supportersLoading } = useGetSupportersByCreatedByQuery({
    createdBy: selectedUserId,
    page: currentPage,
    limit: 10,
    search: searchTerm,
  }, {
    skip: !selectedUserId,
  });

  const supporters = supportersData?.data || [];
  const pagination = supportersData?.pagination;

  const handleUserChange = (userId: number) => {
    setSelectedUserId(userId);
    setCurrentPage(1);
    setSearchTerm('');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getFullName = (supporter: Supporter) => {
    return `${supporter.initials || ''} ${supporter.first_name || ''} ${supporter.last_name || ''}`.trim();
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Wise Supporters</h1>
          <p className="text-gray-600">View supporters created by each user</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">Total Users</p>
                <p className="text-2xl font-bold mt-1">{creators.length}</p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium">Selected User Supporters</p>
                <p className="text-2xl font-bold mt-1">{pagination?.total || 0}</p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium">Total Supporters</p>
                <p className="text-2xl font-bold mt-1">
                  {creators.reduce((sum, creator) => sum + creator.supporters_count, 0)}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Supporters</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => handleUserChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={0}>Select a user...</option>
                {creators.map((creator) => (
                  <option key={creator.user_id} value={creator.user_id}>
                    {creator.full_name} ({creator.supporters_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Supporters
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone, or EPIC ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={!selectedUserId}
              />
            </div>
          </div>
        </div>

        {/* Supporters List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Supporters List
                {pagination && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({pagination.total} total)
                  </span>
                )}
              </h2>
            </div>
          </div>

          {/* Loading State */}
          {supportersLoading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading supporters...</p>
            </div>
          )}

          {/* Empty State - No User Selected */}
          {!supportersLoading && !selectedUserId && (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No user selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please select a user from the dropdown to view their supporters.
              </p>
            </div>
          )}

          {/* Empty State - No Supporters */}
          {!supportersLoading && selectedUserId && supporters.length === 0 && (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No supporters found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria.' : 'This user has not created any supporters yet.'}
              </p>
            </div>
          )}

          {/* Supporters Table */}
          {!supportersLoading && selectedUserId && supporters.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supporter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Demographics
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {supporters.map((supporter) => (
                      <tr key={supporter.supporter_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getFullName(supporter)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Father: {supporter.father_name}
                            </div>
                            {supporter.voter_epic_id && (
                              <div className="text-xs text-gray-400">
                                EPIC: {supporter.voter_epic_id}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{supporter.phone_no}</div>
                          {supporter.whatsapp_no && (
                            <div className="text-sm text-gray-500">WA: {supporter.whatsapp_no}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {supporter.gender}, Age {supporter.age}
                          </div>
                          <div className="text-sm text-gray-500">
                            {supporter.religion} - {supporter.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{supporter.assembly_name}</div>
                          {supporter.block_name && (
                            <div className="text-sm text-gray-500">{supporter.block_name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {supporter.created_by_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(supporter.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setViewingSupporter(supporter)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} results
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 text-sm border rounded-md ${page === pagination.page
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Supporter Details Modal */}
        {viewingSupporter && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Supporter Details</h3>
                <button
                  onClick={() => setViewingSupporter(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-4 space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-sm text-gray-900">{getFullName(viewingSupporter)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Father's Name</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.father_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Age</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.age} years</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Gender</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.gender}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.phone_no}</p>
                    </div>
                    {viewingSupporter.whatsapp_no && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">WhatsApp Number</label>
                        <p className="text-sm text-gray-900">{viewingSupporter.whatsapp_no}</p>
                      </div>
                    )}
                    {viewingSupporter.voter_epic_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">EPIC ID</label>
                        <p className="text-sm text-gray-900">{viewingSupporter.voter_epic_id}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Demographics */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Demographics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Religion</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.religion}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Category</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.category}</p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Location Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">State</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.state_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">District</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.district_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Assembly</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.assembly_name}</p>
                    </div>
                    {viewingSupporter.block_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Block</label>
                        <p className="text-sm text-gray-900">{viewingSupporter.block_name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Created Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Record Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Created At</label>
                      <p className="text-sm text-gray-900">
                        {new Date(viewingSupporter.created_at).toLocaleString()}
                      </p>
                    </div>
                    {viewingSupporter.created_by_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Created By</label>
                        <p className="text-sm text-gray-900">{viewingSupporter.created_by_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setViewingSupporter(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
