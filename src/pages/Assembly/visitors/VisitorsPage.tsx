import React, { useState } from 'react';
import { useGetVisitorsQuery, useDeleteVisitorMutation, useToggleVisitorStatusMutation, useBulkVisitorOperationMutation, useGetAssemblyUsersQuery, useGetVisitorsByAssemblyUserQuery } from '../../../store/api/visitorsApi';
import { useAppSelector } from '../../../store/hooks';
import type { VisitorFilters, Visitor } from '../../../types/visitor';
import { VisitorForm, VisitorList, VisitorStats } from './index';

const VisitorsPage: React.FC = () => {
  const { selectedAssignment } = useAppSelector((state) => state.auth);
  const [showForm, setShowForm] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [selectedVisitors, setSelectedVisitors] = useState<number[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState<number | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | null>(null);
  const [filters, setFilters] = useState<VisitorFilters>({
    page: 1,
    limit: 10,
    assembly_id: selectedAssignment?.stateMasterData_id || undefined,
  });

  // Get team members
  const { data: teamData } = useGetAssemblyUsersQuery(
    selectedAssignment?.stateMasterData_id || 0,
    { skip: !selectedAssignment?.stateMasterData_id }
  );

  // Get visitors - either all or by selected team member
  const { data: visitorsData, isLoading, error, refetch } = useGetVisitorsQuery(filters, {
    skip: !!selectedTeamMember
  });

  const { data: teamMemberVisitorsData, isLoading: isLoadingTeamVisitors, error: teamVisitorsError, refetch: refetchTeamVisitors } = useGetVisitorsByAssemblyUserQuery(
    { 
      assemblyUserId: selectedTeamMember || 0, 
      page: filters.page || 1, 
      limit: filters.limit || 10 
    },
    { skip: !selectedTeamMember }
  );

  const [deleteVisitor] = useDeleteVisitorMutation();
  const [toggleStatus] = useToggleVisitorStatusMutation();
  const [bulkOperation] = useBulkVisitorOperationMutation();

  // Use appropriate data based on selection
  const currentData = selectedTeamMember ? teamMemberVisitorsData : visitorsData;
  const currentLoading = selectedTeamMember ? isLoadingTeamVisitors : isLoading;
  const currentError = selectedTeamMember ? teamVisitorsError : error;
  const currentRefetch = selectedTeamMember ? refetchTeamVisitors : refetch;

  const visitors = currentData?.data || [];
  const pagination = currentData?.pagination;
  const teamMembers = teamData?.data?.users || [];

  const handleCreateVisitor = () => {
    setEditingVisitor(null);
    setShowForm(true);
  };

  const handleEditVisitor = (visitor: Visitor) => {
    setEditingVisitor(visitor);
    setShowForm(true);
  };

  const handleDeleteVisitor = async (visitorId: number) => {
    try {
      await deleteVisitor(visitorId).unwrap();
      currentRefetch();
    } catch (error) {
      console.error('Failed to delete visitor:', error);
    }
  };

  const handleToggleStatus = async (visitorId: number, isActive: boolean) => {
    try {
      await toggleStatus({ id: visitorId, status: { isActive } }).unwrap();
      currentRefetch();
    } catch (error) {
      console.error('Failed to toggle visitor status:', error);
    }
  };

  const handleBulkOperation = async (operation: 'activate' | 'deactivate' | 'delete') => {
    if (selectedVisitors.length === 0) {
      alert('Please select visitors first');
      return;
    }
    setBulkAction(operation);
    setShowBulkModal(true);
  };

  const handleBulkConfirm = async () => {
    if (!bulkAction || selectedVisitors.length === 0) return;

    try {
      await bulkOperation({ visitor_ids: selectedVisitors, operation: bulkAction }).unwrap();
      setSelectedVisitors([]);
      currentRefetch();
      setShowBulkModal(false);
      setBulkAction(null);
    } catch (error) {
      console.error(`Failed to ${bulkAction} visitors:`, error);
    }
  };

  const handleBulkCancel = () => {
    setShowBulkModal(false);
    setBulkAction(null);
  };

  const handleFilterChange = (newFilters: Partial<VisitorFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingVisitor(null);
    currentRefetch();
  };

  const handleSelectVisitor = (visitorId: number, selected: boolean) => {
    setSelectedVisitors(prev => 
      selected 
        ? [...prev, visitorId]
        : prev.filter(id => id !== visitorId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedVisitors(selected ? visitors.map(v => v.visitor_id) : []);
  };

  const handleTeamMemberSelect = (userId: number) => {
    if (userId === 0 || selectedTeamMember === userId) {
      // Deselect if clicking the same member or clicking "Clear Selection"
      setSelectedTeamMember(null);
    } else {
      setSelectedTeamMember(userId);
    }
    setSelectedVisitors([]);
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  if (showForm) {
    return (
      <VisitorForm
        visitor={editingVisitor}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Visitors</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {selectedTeamMember 
              ? `Visitors for ${teamMembers.find(m => m.user_id === selectedTeamMember)?.user_name || 'Selected Team Member'}`
              : 'Manage visitor records and appointments'
            }
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {selectedTeamMember && (
            <button
              onClick={() => handleTeamMemberSelect(0)}
              className="bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base order-2 sm:order-1"
            >
              Show All Visitors
            </button>
          )}
          <button
            onClick={handleCreateVisitor}
            className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base order-1 sm:order-2"
          >
            Add New Visitor
          </button>
        </div>
      </div>

      {/* Stats - Only show when not filtering by team member */}
      {!selectedTeamMember && (
        <VisitorStats assemblyId={selectedAssignment?.stateMasterData_id} />
      )}

      {/* Bulk Actions */}
      {selectedVisitors.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-blue-800 font-medium text-sm sm:text-base">
              {selectedVisitors.length} visitor(s) selected
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkOperation('activate')}
                className="bg-green-600 text-white px-3 py-1.5 rounded text-xs sm:text-sm hover:bg-green-700 transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkOperation('deactivate')}
                className="bg-yellow-600 text-white px-3 py-1.5 rounded text-xs sm:text-sm hover:bg-yellow-700 transition-colors"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkOperation('delete')}
                className="bg-red-600 text-white px-3 py-1.5 rounded text-xs sm:text-sm hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visitor List */}
      <VisitorList
        visitors={visitors}
        pagination={pagination}
        isLoading={currentLoading}
        error={currentError}
        selectedVisitors={selectedVisitors}
        filters={filters}
        teamMembers={teamMembers}
        selectedTeamMember={selectedTeamMember || undefined}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onEditVisitor={handleEditVisitor}
        onDeleteVisitor={handleDeleteVisitor}
        onToggleStatus={handleToggleStatus}
        onSelectVisitor={handleSelectVisitor}
        onSelectAll={handleSelectAll}
        onTeamMemberSelect={handleTeamMemberSelect}
      />

      {/* Bulk Action Confirmation Modal */}
      {showBulkModal && bulkAction && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className={`h-5 w-5 sm:h-6 sm:w-6 ${
                  bulkAction === 'delete' ? 'text-red-600' : 'text-yellow-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  Confirm Bulk {bulkAction.charAt(0).toUpperCase() + bulkAction.slice(1)}
                </h3>
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-gray-500">
                Are you sure you want to {bulkAction} {selectedVisitors.length} selected visitor(s)?
                {bulkAction === 'delete' && (
                  <span className="block mt-2 text-red-600 font-medium">
                    This action cannot be undone.
                  </span>
                )}
              </p>
              
              {/* Show selected count and action details */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">Selected visitors:</span>
                  <span className="text-indigo-600 font-semibold">{selectedVisitors.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="font-medium text-gray-700">Action:</span>
                  <span className={`font-semibold capitalize ${
                    bulkAction === 'delete' ? 'text-red-600' : 
                    bulkAction === 'activate' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {bulkAction}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={handleBulkCancel}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkConfirm}
                className={`w-full sm:w-auto px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                  bulkAction === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                    : bulkAction === 'activate'
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                }`}
              >
                {bulkAction === 'delete' ? 'Delete' : bulkAction === 'activate' ? 'Activate' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorsPage;