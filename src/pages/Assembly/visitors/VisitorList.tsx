import React, { useState } from 'react';
import type { Visitor, VisitorFilters, AssemblyUser } from '../../../types/visitor';

interface VisitorListProps {
  visitors: Visitor[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  isLoading: boolean;
  error: any;
  selectedVisitors: number[];
  filters: VisitorFilters;
  teamMembers?: AssemblyUser[];
  selectedTeamMember?: number;
  onFilterChange: (filters: Partial<VisitorFilters>) => void;
  onPageChange: (page: number) => void;
  onEditVisitor: (visitor: Visitor) => void;
  onDeleteVisitor: (visitorId: number) => void;
  onToggleStatus: (visitorId: number, isActive: boolean) => void;
  onSelectVisitor: (visitorId: number, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onTeamMemberSelect?: (userId: number) => void;
}

const VisitorList: React.FC<VisitorListProps> = ({
  visitors,
  pagination,
  isLoading,
  error,
  selectedVisitors,
  filters,
  onFilterChange,
  onPageChange,
  onEditVisitor,
  onDeleteVisitor,
  onToggleStatus,
  onSelectVisitor,
  onSelectAll,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteVisitorId, setDeleteVisitorId] = useState<number | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingVisitor, setViewingVisitor] = useState<Visitor | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchTerm });
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    onFilterChange({ search: '' });
  };

  const handleFilterChange = (key: keyof VisitorFilters, value: any) => {
    onFilterChange({ [key]: value });
  };

  const handleDeleteClick = (visitorId: number) => {
    setDeleteVisitorId(visitorId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteVisitorId) {
      onDeleteVisitor(deleteVisitorId);
      setShowDeleteModal(false);
      setDeleteVisitorId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteVisitorId(null);
  };

  const handleViewClick = (visitor: Visitor) => {
    setViewingVisitor(visitor);
    setShowViewModal(true);
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingVisitor(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Loading visitors...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center text-red-600">
          <p>Error loading visitors: {error.message || 'Unknown error'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-indigo-600 hover:text-indigo-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Filters */}
        <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search visitors by name, phone, email..."
                  className="w-full pl-10 pr-10 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={handleSearchClear}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </form>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Items per page */}
              <select
                value={filters.limit || 10}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base min-w-0 sm:min-w-[120px]"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-4 lg:px-6 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={visitors.length > 0 && selectedVisitors.length === visitors.length}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visitor Details
                </th>
                <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visit Date
                </th>
                <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visitors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-4 lg:px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-sm sm:text-base">No visitors found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                visitors.map((visitor) => (
                  <tr key={visitor.visitor_id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 lg:px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedVisitors.includes(visitor.visitor_id)}
                        onChange={(e) => onSelectVisitor(visitor.visitor_id, e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 text-sm sm:text-base">{visitor.name}</div>
                        <div className="text-xs sm:text-sm text-gray-500">{visitor.phone}</div>
                        <div className="text-xs sm:text-sm text-gray-400">{visitor.assembly_user_name}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-4">
                      <div className="text-xs sm:text-sm text-gray-900">
                        {formatDate(visitor.date_of_visit)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visitor.isActive === 1}
                          onChange={() => onToggleStatus(visitor.visitor_id, visitor.isActive !== 1)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-2 text-xs sm:text-sm font-medium text-gray-700">
                          {visitor.isActive === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewClick(visitor)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onEditVisitor(visitor)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"
                          title="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(visitor.visitor_id)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-3 sm:px-4 lg:px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-700 order-2 sm:order-1">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex flex-wrap justify-center gap-1 order-1 sm:order-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded ${pagination.page === page
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
              {pagination.pages > 5 && (
                <>
                  <span className="px-1 sm:px-2 py-1 text-xs sm:text-sm text-gray-500">...</span>
                  <button
                    onClick={() => onPageChange(pagination.pages)}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded ${pagination.page === pagination.pages
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {pagination.pages}
                  </button>
                </>
              )}
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {showViewModal && viewingVisitor && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Visitor Details</h3>
              <button
                onClick={handleViewClose}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3">Personal Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingVisitor.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingVisitor.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingVisitor.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${viewingVisitor.isActive === 1
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {viewingVisitor.isActive === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3">Location Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">State</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingVisitor.state_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">District</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingVisitor.district_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Assembly</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingVisitor.assembly_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Party</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingVisitor.party_name}</p>
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3">Visit Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Date of Visit</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(viewingVisitor.date_of_visit)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Place of Visit</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingVisitor.place_of_visit}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Number of Persons</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingVisitor.no_of_persons}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Follow-up Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {viewingVisitor.follow_up_date ? formatDate(viewingVisitor.follow_up_date) : 'Not scheduled'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Purpose of Visit */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3">Purpose of Visit</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-900">{viewingVisitor.purpose_of_visit}</p>
                </div>
              </div>

              {/* Assignment Information */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3">Assignment Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Assigned to</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingVisitor.assembly_user_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created by</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingVisitor.inserted_by_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Created on</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(viewingVisitor.inserted_on)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last updated</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(viewingVisitor.updated_on)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  handleViewClose();
                  onEditVisitor(viewingVisitor);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                Edit Visitor
              </button>
              <button
                onClick={handleViewClose}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Delete Visitor</h3>
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-gray-500">
                Are you sure you want to delete this visitor? This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VisitorList;