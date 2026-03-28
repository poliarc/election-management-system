import React, { useState } from 'react';
import type { Visitor, VisitorFilters, AssemblyUser } from '../../../types/visitor';
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-[var(--text-secondary)]">{t("visitorList.loadingVisitors")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-8">
        <div className="text-center text-red-600">
          <p>{t("visitorList.errorLoadingVisitors", { message: error.message || t("visitorList.unknownError") })}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-indigo-600 hover:text-indigo-800"
          >
            {t("visitorList.btnTryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)]">
        {/* Filters */}
        <div className="p-3 sm:p-4 lg:p-6 border-b border-[var(--border-color)]">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder={t("visitorList.phSearchVisitors")}
                  className="w-full pl-10 pr-10 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                  aria-label={t("visitorList.phSearchVisitors")}
                  title={t("visitorList.phSearchVisitors")}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchTerm && (
                  <button
                    type="button"
                    onClick={handleSearchClear}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--text-secondary)]"
                    aria-label={t("visitorList.btnClearSearch")}
                    title={t("visitorList.btnClearSearch")}
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
                aria-label={t("visitorList.lblItemsPerPage")}
                title={t("visitorList.lblItemsPerPage")}
              >
                <option value={10}>{t("visitorList.optPerPage", { count: 10 })}</option>
                <option value={25}>{t("visitorList.optPerPage", { count: 25 })}</option>
                <option value={50}>{t("visitorList.optPerPage", { count: 50 })}</option>
                <option value={100}>{t("visitorList.optPerPage", { count: 100 })}</option>
              </select>
            </div>
          </div>
        </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-[var(--bg-main)]">
            <tr>
              <th className="px-3 sm:px-4 lg:px-6 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={visitors.length > 0 && selectedVisitors.length === visitors.length}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  aria-label={t("visitorList.cbSelectAll")}
                  title={t("visitorList.cbSelectAll")}
                />
              </th>
              <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                {t("visitorList.thVisitorDetails")}
              </th>
              <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                {t("visitorList.thVisitDate")}
              </th>
              <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                {t("visitorList.thStatus")}
              </th>
              <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider w-32">
                {t("visitorList.thActions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-[var(--bg-card)] divide-y divide-gray-200">
            {visitors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 sm:px-4 lg:px-6 py-8 text-center text-[var(--text-secondary)]">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm sm:text-base">{t("visitorList.emptyNoVisitorsFound")}</p>
                  </div>
                </td>
              </tr>
            ) : (
              visitors.map((visitor) => (
                <tr key={visitor.visitor_id} className="hover:bg-[var(--text-color)]/5">
                  <td className="px-3 sm:px-4 lg:px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedVisitors.includes(visitor.visitor_id)}
                      onChange={(e) => onSelectVisitor(visitor.visitor_id, e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      aria-label={t("visitorList.cbSelectVisitor")}
                      title={t("visitorList.cbSelectVisitor")}
                    />
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-4">
                    <div>
                      <div className="font-medium text-[var(--text-color)] text-sm sm:text-base">{visitor.name}</div>
                      <div className="text-xs sm:text-sm text-[var(--text-secondary)]">{visitor.phone}</div>
                      <div className="text-xs sm:text-sm text-[var(--text-secondary)]">{visitor.assembly_user_name}</div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-4">
                    <div className="text-xs sm:text-sm text-[var(--text-color)]">
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--bg-card)] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      <span className="ml-2 text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                        {visitor.isActive === 1 ? t("visitorList.statusActive") : t("visitorList.statusInactive")}
                      </span>
                    </label>
                  </td>
                  <td className="px-3 sm:px-4 lg:px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewClick(visitor)}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                        title={t("visitorList.btnViewDetails")}
                        aria-label={t("visitorList.btnViewDetails")}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onEditVisitor(visitor)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"
                        title={t("visitorList.btnEdit")}
                        aria-label={t("visitorList.btnEdit")}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(visitor.visitor_id)}
                        className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                        title={t("visitorList.btnDelete")}
                        aria-label={t("visitorList.btnDelete")}
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
        <div className="px-3 sm:px-4 lg:px-6 py-3 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-[var(--text-secondary)] order-2 sm:order-1">
            {t("visitorList.showingResultsRange", {
              from: ((pagination.page - 1) * pagination.limit) + 1,
              to: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total
            })}
          </div>
          <div className="flex flex-wrap justify-center gap-1 order-1 sm:order-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("visitorList.btnPrevious")}
            </button>
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded ${
                    pagination.page === page
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-300 hover:bg-[var(--text-color)]/5'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            {pagination.pages > 5 && (
              <>
                <span className="px-1 sm:px-2 py-1 text-xs sm:text-sm text-[var(--text-secondary)]">...</span>
                <button
                  onClick={() => onPageChange(pagination.pages)}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded ${
                    pagination.page === pagination.pages
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-300 hover:bg-[var(--text-color)]/5'
                  }`}
                >
                  {pagination.pages}
                </button>
              </>
            )}
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("visitorList.btnNext")}
            </button>
          </div>
        </div>
      )}
    </div>
      
      {/* View Details Modal */}
      {showViewModal && viewingVisitor && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] rounded-lg max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-color)]">
              <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-color)]">{t("visitorList.modalVisitorDetailsTitle")}</h3>
              <button
                onClick={handleViewClose}
                className="text-[var(--text-secondary)] hover:text-[var(--text-secondary)] p-1 hover:bg-[var(--text-color)]/5 rounded"
                aria-label={t("visitorList.btnClose")}
                title={t("visitorList.btnClose")}
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
                <h4 className="text-base font-medium text-[var(--text-color)] mb-3">{t("visitorList.sectionPersonalInformation")}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblName")}</label>
                    <p className="mt-1 text-sm text-[var(--text-color)]">{viewingVisitor.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblPhone")}</label>
                    <p className="mt-1 text-sm text-[var(--text-color)]">{viewingVisitor.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblEmail")}</label>
                    <p className="mt-1 text-sm text-[var(--text-color)]">{viewingVisitor.email || t("visitorList.notProvided")}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblStatus")}</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                      viewingVisitor.isActive === 1 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingVisitor.isActive === 1 ? t("visitorList.statusActive") : t("visitorList.statusInactive")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h4 className="text-base font-medium text-[var(--text-color)] mb-3">{t("visitorList.sectionLocationInformation")}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblState")}</label>
                    <p className="mt-1 text-sm text-[var(--text-color)]">{viewingVisitor.state_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblDistrict")}</label>
                    <p className="mt-1 text-sm text-[var(--text-color)]">{viewingVisitor.district_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblAssembly")}</label>
                    <p className="mt-1 text-sm text-[var(--text-color)]">{viewingVisitor.assembly_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblParty")}</label>
                    <p className="mt-1 text-sm text-[var(--text-color)]">{viewingVisitor.party_name}</p>
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div>
                <h4 className="text-base font-medium text-[var(--text-color)] mb-3">{t("visitorList.sectionVisitInformation")}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblDateOfVisit")}</label>
                    <p className="mt-1 text-sm text-[var(--text-color)]">{formatDate(viewingVisitor.date_of_visit)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblPlaceOfVisit")}</label>
                    <p className="mt-1 text-sm text-[var(--text-color)]">{viewingVisitor.place_of_visit}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblNumberOfPersons")}</label>
                    <p className="mt-1 text-sm text-[var(--text-color)]">{viewingVisitor.no_of_persons}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblFollowUpDate")}</label>
                    <p className="mt-1 text-sm text-[var(--text-color)]">
                      {viewingVisitor.follow_up_date ? formatDate(viewingVisitor.follow_up_date) : t("visitorList.notScheduled")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Purpose of Visit */}
              <div>
                <h4 className="text-base font-medium text-[var(--text-color)] mb-3">{t("visitorList.sectionPurposeOfVisit")}</h4>
                <div className="bg-[var(--bg-main)] rounded-lg p-3">
                  <p className="text-sm text-[var(--text-color)]">{viewingVisitor.purpose_of_visit}</p>
                </div>
              </div>

              {/* Assignment Information */}
              <div>
                <h4 className="text-base font-medium text-[var(--text-color)] mb-3">{t("visitorList.sectionAssignmentInformation")}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblAssignedTo")}</label>
                    <p className="mt-1 text-sm text-[var(--text-color)]">{viewingVisitor.assembly_user_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblCreatedBy")}</label>
                    <p className="mt-1 text-sm text-[var(--text-color)]">{viewingVisitor.inserted_by_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblCreatedOn")}</label>
                    <p className="mt-1 text-sm text-[var(--text-color)]">{formatDate(viewingVisitor.inserted_on)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("visitorList.lblLastUpdated")}</label>
                    <p className="mt-1 text-sm text-[var(--text-color)]">{formatDate(viewingVisitor.updated_on)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-[var(--border-color)]">
              <button
                onClick={() => {
                  handleViewClose();
                  onEditVisitor(viewingVisitor);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                {t("visitorList.btnEditVisitor")}
              </button>
              <button
                onClick={handleViewClose}
                className="bg-gray-300 text-[var(--text-secondary)] px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm"
              >
                {t("visitorList.btnClose")}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-base sm:text-lg font-medium text-[var(--text-color)]">{t("visitorList.deleteVisitorTitle")}</h3>
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-[var(--text-secondary)]">
                {t("visitorList.deleteVisitorConfirm")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] border border-gray-300 rounded-md hover:bg-[var(--text-color)]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                {t("visitorList.btnCancel")}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                {t("visitorList.btnDelete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VisitorList;


