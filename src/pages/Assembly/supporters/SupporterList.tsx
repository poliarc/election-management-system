import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import {
  useGetSupportersByCreatedByQuery
} from '../../../store/api/supportersApi';
import { useAppSelector } from '../../../store/hooks';
import type { Supporter, SupporterFilters } from '../../../types/supporter';

interface SupporterListProps {
  onEdit: (supporter: Supporter) => void;
  onView: (supporter: Supporter) => void;
  onShowPhone: (supporter: Supporter) => void;
}

export default function SupporterList({ onEdit, onView, onShowPhone }: SupporterListProps) {
  const { user, selectedAssignment } = useAppSelector((s) => s.auth);

  const [filters, setFilters] = useState<SupporterFilters>({
    page: 1,
    limit: 10,
    search: '',
    party_id: user?.partyId || 0,
    state_id: user?.state_id || selectedAssignment?.stateMasterData_id || 0,
    assembly_id: selectedAssignment?.level_id || 0,
    created_by: user?.id || 0,
    sortBy: 'created_at',
    sortOrder: 'DESC',
    dateFrom: '',
    dateTo: '',
    gender: '',
    ageFrom: '',
    ageTo: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  // Use the created-by endpoint as specified in the API documentation
  // Get user ID from localStorage if not available in Redux state
  const getUserId = () => {
    if (user?.id) return user.id;

    // Fallback to localStorage
    const authData = localStorage.getItem('auth_user');
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData);
        return parsedAuth.id || 1;
      } catch (e) {
        console.error('Failed to parse auth data from localStorage:', e);
      }
    }
    return 1;
  };

  const currentUserId = getUserId();

  const { data, isLoading, error } = useGetSupportersByCreatedByQuery(
    {
      createdBy: currentUserId,
      page: filters.page,
      limit: filters.limit
    },
    {
      skip: !currentUserId,
    }
  );

  // Select the appropriate data and apply client-side date filtering
  const allSupporters = data?.data || [];
  const pagination = data?.pagination;

  // Apply client-side filtering
  const filteredSupporters = allSupporters.filter(supporter => {
    const createdDate = new Date(supporter.created_at);

    // Apply date filters with proper type checking
    if (filters.dateFrom && filters.dateFrom.trim()) {
      const fromDate = new Date(filters.dateFrom);
      if (createdDate < fromDate) return false;
    }

    if (filters.dateTo && filters.dateTo.trim()) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      if (createdDate > toDate) return false;
    }

    // Apply gender filter
    if (filters.gender && filters.gender.trim()) {
      if (supporter.gender !== filters.gender) return false;
    }

    // Apply age filters
    if (filters.ageFrom && filters.ageFrom.trim()) {
      const ageFrom = parseInt(filters.ageFrom);
      if (!supporter.age || supporter.age < ageFrom) return false;
    }

    if (filters.ageTo && filters.ageTo.trim()) {
      const ageTo = parseInt(filters.ageTo);
      if (!supporter.age || supporter.age > ageTo) return false;
    }

    // Apply search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      const searchableText = [
        supporter.first_name,
        supporter.last_name,
        supporter.father_name,
        supporter.phone_no,
        supporter.whatsapp_no || '',
        supporter.voter_epic_id || '',
        supporter.address
      ].join(' ').toLowerCase();

      if (!searchableText.includes(searchTerm)) return false;
    }

    return true;
  });

  const supporters = filteredSupporters;

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleDateFilter = (field: 'dateFrom' | 'dateTo', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const handleGenderFilter = (gender: string) => {
    setFilters(prev => ({ ...prev, gender, page: 1 }));
  };

  const handleAgeFilter = (field: 'ageFrom' | 'ageTo', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const clearAllFilters = () => {
    setFilters(prev => ({
      ...prev,
      dateFrom: '',
      dateTo: '',
      gender: '',
      ageFrom: '',
      ageTo: '',
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSort = (sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC',
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p>Failed to load supporters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with search and filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search supporters..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Filters
              </button>
            </div>
          </div>

          {/* All Filters */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              {/* Date Filters */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Date Range</h4>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleDateFilter('dateFrom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleDateFilter('dateTo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Gender and Age Filters */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Demographics</h4>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={filters.gender}
                      onChange={(e) => handleGenderFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age From</label>
                    <input
                      type="number"
                      placeholder="Min age"
                      value={filters.ageFrom}
                      onChange={(e) => handleAgeFilter('ageFrom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="1"
                      max="120"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age To</label>
                    <input
                      type="number"
                      placeholder="Max age"
                      value={filters.ageTo}
                      onChange={(e) => handleAgeFilter('ageTo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="1"
                      max="120"
                    />
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear All Filters
                </button>
              </div>

              {/* Active Filters Display */}
              {(filters.dateFrom || filters.dateTo || filters.gender || filters.ageFrom || filters.ageTo) && (
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  {(filters.dateFrom || filters.dateTo) && (
                    <div>
                      📅 {filters.dateFrom && filters.dateTo
                        ? `Created: ${new Date(filters.dateFrom).toLocaleDateString()} - ${new Date(filters.dateTo).toLocaleDateString()}`
                        : filters.dateFrom
                          ? `Created from: ${new Date(filters.dateFrom).toLocaleDateString()}`
                          : filters.dateTo
                            ? `Created until: ${new Date(filters.dateTo).toLocaleDateString()}`
                            : ''
                      }
                    </div>
                  )}
                  {filters.gender && (
                    <div>👤 Gender: {filters.gender}</div>
                  )}
                  {(filters.ageFrom || filters.ageTo) && (
                    <div>
                      🎂 Age: {filters.ageFrom && filters.ageTo
                        ? `${filters.ageFrom} - ${filters.ageTo} years`
                        : filters.ageFrom
                          ? `${filters.ageFrom}+ years`
                          : `Up to ${filters.ageTo} years`
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                S.No
              </th>
              <th
                className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                Name
                {filters.sortBy === 'name' && (
                  <span className="ml-1">
                    {filters.sortOrder === 'ASC' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Father Name
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gender
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Age
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                EPIC ID
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assembly
              </th>
              <th
                className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('created_at')}
              >
                Created Date
                {filters.sortBy === 'created_at' && (
                  <span className="ml-1">
                    {filters.sortOrder === 'ASC' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {supporters.map((supporter, index) => (
              <tr key={supporter.supporter_id} className="hover:bg-gray-50">
                <td className="px-3 py-4 text-center">
                  <div className="text-sm font-medium text-gray-900">{((filters.page || 1) - 1) * (filters.limit || 10) + index + 1}</div>
                </td>
                <td className="px-3 py-4 text-center">
                  <div className="text-sm font-medium text-gray-900">{supporter.initials} {supporter.first_name} {supporter.last_name}</div>
                </td>
                <td className="px-3 py-4 text-center">
                  <div className="text-sm text-gray-900">{supporter.father_name}</div>
                </td>
                <td className="px-3 py-4 text-center">
                  <div className="text-sm text-gray-900">{supporter.gender || 'N/A'}</div>
                </td>
                <td className="px-3 py-4 text-center">
                  <div className="text-sm text-gray-900">{supporter.age || 'N/A'}</div>
                </td>
                <td className="px-3 py-4 text-center">
                  <div className="text-sm text-gray-900">{supporter.voter_epic_id || 'N/A'}</div>
                </td>
                <td className="px-3 py-4 text-center">
                  <div className="text-sm text-gray-900">
                    {supporter.assembly_name}
                  </div>
                </td>
                <td className="px-3 py-4 text-center">
                  <div className="text-sm text-gray-900">
                    {new Date(supporter.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(supporter.created_at).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-3 py-4 text-center">
                  <div className="relative inline-block text-left">
                    <button
                      className="text-black hover:text-gray-600 focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        const menu = e.currentTarget.nextElementSibling as HTMLElement;
                        menu.classList.toggle('hidden');
                      }}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                    <div className="hidden absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <button
                          onClick={() => onView(supporter)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => onEdit(supporter)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onShowPhone(supporter)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Phone
                        </button>

                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-sm border rounded ${pagination.page === page
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
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {supporters.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No supporters found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new supporter.</p>
        </div>
      )}
    </div>
  );
}