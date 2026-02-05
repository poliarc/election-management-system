import { useState, useMemo } from 'react';
import { 
  useGetSupportersQuery, 
  useToggleSupporterStatusMutation, 
  useDeleteSupporterMutation,
  useBulkOperationMutation 
} from '../../../store/api/supportersApi';
import { useAppSelector } from '../../../store/hooks';
import type { Supporter, SupporterFilters } from '../../../types/supporter';

interface SupporterListProps {
  onEdit: (supporter: Supporter) => void;
  onView: (supporter: Supporter) => void;
}

export default function SupporterList({ onEdit, onView }: SupporterListProps) {
  const { user, selectedAssignment } = useAppSelector((s) => s.auth);
  
  const [filters, setFilters] = useState<SupporterFilters>({
    page: 1,
    limit: 10,
    search: '',
    party_id: user?.partyId || 0,
    state_id: user?.state_id || selectedAssignment?.stateMasterData_id || 0,
    assembly_id: selectedAssignment?.level_id || 0,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });

  const [selectedSupporters, setSelectedSupporters] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const { data, isLoading, error } = useGetSupportersQuery(filters, {
    skip: !filters.party_id || !filters.state_id || !filters.assembly_id,
  });

  const [toggleStatus] = useToggleSupporterStatusMutation();
  const [deleteSupporter] = useDeleteSupporterMutation();
  const [bulkOperation] = useBulkOperationMutation();

  const supporters = data?.data || [];
  const pagination = data?.pagination;

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
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

  const handleToggleStatus = async (supporter: Supporter) => {
    try {
      await toggleStatus({
        id: supporter.supporter_id,
        isActive: !supporter.isActive,
      }).unwrap();
    } catch (error) {
      console.error('Failed to toggle supporter status:', error);
    }
  };

  const handleDelete = async (supporterId: number) => {
    if (window.confirm('Are you sure you want to delete this supporter?')) {
      try {
        await deleteSupporter(supporterId).unwrap();
      } catch (error) {
        console.error('Failed to delete supporter:', error);
      }
    }
  };

  const handleSelectSupporter = (supporterId: number) => {
    setSelectedSupporters(prev =>
      prev.includes(supporterId)
        ? prev.filter(id => id !== supporterId)
        : [...prev, supporterId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSupporters.length === supporters.length) {
      setSelectedSupporters([]);
    } else {
      setSelectedSupporters(supporters.map(s => s.supporter_id));
    }
  };

  const handleBulkAction = async (operation: 'activate' | 'deactivate' | 'delete') => {
    if (selectedSupporters.length === 0) return;

    const confirmMessage = operation === 'delete' 
      ? 'Are you sure you want to delete the selected supporters?'
      : `Are you sure you want to ${operation} the selected supporters?`;

    if (window.confirm(confirmMessage)) {
      try {
        await bulkOperation({
          supporter_ids: selectedSupporters,
          operation,
        }).unwrap();
        setSelectedSupporters([]);
        setShowBulkActions(false);
      } catch (error) {
        console.error(`Failed to ${operation} supporters:`, error);
      }
    }
  };

  const filteredSupporters = useMemo(() => {
    return supporters;
  }, [supporters]);

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
            {selectedSupporters.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedSupporters.length} selected
                </span>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                >
                  Bulk Actions
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && selectedSupporters.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('activate')}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
            >
              Deactivate
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedSupporters.length === supporters.length && supporters.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                Name
                {filters.sortBy === 'name' && (
                  <span className="ml-1">
                    {filters.sortOrder === 'ASC' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Father Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                EPIC ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assembly/Block
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSupporters.map((supporter) => (
              <tr key={supporter.supporter_id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedSupporters.includes(supporter.supporter_id)}
                    onChange={() => handleSelectSupporter(supporter.supporter_id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{supporter.initials} {supporter.first_name} {supporter.last_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{supporter.father_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{supporter.phone_no}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{supporter.voter_epic_id || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {supporter.assembly_name}
                    {supporter.block_name && (
                      <div className="text-xs text-gray-500">{supporter.block_name}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    supporter.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {supporter.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative inline-block text-left">
                    <button
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        const menu = e.currentTarget.nextElementSibling as HTMLElement;
                        menu.classList.toggle('hidden');
                      }}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 5v.01M12 12v.01M12 19v.01" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
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
                          onClick={() => handleToggleStatus(supporter)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {supporter.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(supporter.supporter_id)}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Delete
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
                  className={`px-3 py-1 text-sm border rounded ${
                    pagination.page === page
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

      {filteredSupporters.length === 0 && (
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