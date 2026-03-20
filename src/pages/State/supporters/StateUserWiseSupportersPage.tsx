import { useState } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { useGetCreatorsListQuery, useGetSupportersByCreatedByQuery } from '../../../store/api/supportersApi';
import type { Supporter } from '../../../types/supporter';
import { useTranslation } from 'react-i18next';

export default function StateUserWiseSupportersPage() {
  const {t} = useTranslation();
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
        {/* Header + Stats in one row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("userWise.Title")}</h1>
            <p className="text-gray-600 text-sm">{t("userWise.Desc")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Total Supporters */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md px-4 py-2 text-white flex items-center gap-3 min-w-[140px]">
              <div className="bg-white/20 rounded-full p-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-purple-100 text-xs font-medium">{t("userWise.Total_Supporters")}</p>
                <p className="text-xl font-bold">{creators.reduce((sum, creator) => sum + creator.supporters_count, 0)}</p>
              </div>
            </div>
            {/* Total Users */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md px-4 py-2 text-white flex items-center gap-3 min-w-[140px]">
              <div className="bg-white/20 rounded-full p-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-blue-100 text-xs font-medium">{t("userWise.Total_Users")}</p>
                <p className="text-xl font-bold">{creators.length}</p>
              </div>
            </div>
            {/* Selected User Supporters */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md px-4 py-2 text-white flex items-center gap-3 min-w-[140px]">
              <div className="bg-white/20 rounded-full p-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-green-100 text-xs font-medium">{t("userWise.Selected_User")}</p>
                <p className="text-xl font-bold">{pagination?.total || 0}</p>
              </div>
            </div>
            
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-sm border border-[var(--border-color)] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-color)] mb-4">{t("userWise.Filter_Supporter")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Dropdown */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {t("userWise.Select_User")}
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => handleUserChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={0}>{t("userWise.user")}</option>
                {creators.map((creator) => (
                  <option key={creator.user_id} value={creator.user_id}>
                    {creator.full_name} ({creator.supporters_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {t("userWise.Search_Supporters")}
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
        <div className="bg-[var(--bg-card)] rounded-lg shadow-sm border border-[var(--border-color)]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border-color)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-color)]">
                {t("userWise.Supporters_List")}
                {pagination && (
                  <span className="ml-2 text-sm font-normal text-[var(--text-secondary)]">
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
              <p className="text-[var(--text-secondary)] mt-2">{t("userWise.Loading_supporters")}</p>
            </div>
          )}

          {/* Empty State - No User Selected */}
          {!supportersLoading && !selectedUserId && (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-[var(--text-color)]">{t("userWise.No_User")}</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {t("userWise.Select_Users")}
              </p>
            </div>
          )}

          {/* Empty State - No Supporters */}
          {!supportersLoading && selectedUserId && supporters.length === 0 && (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-[var(--text-color)]">{t("userWise.No_Supporters")}</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {searchTerm ? 'Try adjusting your search criteria.' : 'This user has not created any supporters yet.'}
              </p>
            </div>
          )}

          {/* Supporters Table */}
          {!supportersLoading && selectedUserId && supporters.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[var(--bg-main)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t("userWise.Supporter")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t("userWise.Contact")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t("userWise.Demographics")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t("userWise.Location")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t("userWise.Created")}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t("userWise.Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--bg-card)] divide-y divide-gray-200">
                    {supporters.map((supporter) => (
                      <tr key={supporter.supporter_id} className="hover:bg-[var(--text-color)]/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-[var(--text-color)]">
                              {getFullName(supporter)}
                            </div>
                            <div className="text-sm text-[var(--text-secondary)]">
                              {t("userWise.Father")} {supporter.father_name}
                            </div>
                            {supporter.voter_epic_id && (
                              <div className="text-xs text-[var(--text-secondary)]">
                                {t("userWise.EPIC")} {supporter.voter_epic_id}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[var(--text-color)]">{supporter.phone_no}</div>
                          {supporter.whatsapp_no && (
                            <div className="text-sm text-[var(--text-secondary)]">{t("userWise.WAA")} {supporter.whatsapp_no}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[var(--text-color)]">
                            {supporter.gender}, {t("userWise.Age")} {supporter.age}
                          </div>
                          <div className="text-sm text-[var(--text-secondary)]">
                            {supporter.religion} - {supporter.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[var(--text-color)]">{supporter.assembly_name}</div>
                          {supporter.block_name && (
                            <div className="text-sm text-[var(--text-secondary)]">{supporter.block_name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-[var(--text-color)]">
                            {supporter.created_by_name}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)]">
                            {new Date(supporter.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setViewingSupporter(supporter)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          >
                            {t("userWise.View")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-[var(--border-color)]">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-[var(--text-secondary)]">
                      {t("userWise.Showing")} {((pagination.page - 1) * pagination.limit) + 1} {t("userWise.to")}{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} {t("userWise.of")}{' '}
                      {pagination.total} {t("userWise.results")}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("userWise.Previous")}
                      </button>
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 text-sm border rounded-md ${page === pagination.page
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-gray-300 hover:bg-[var(--text-color)]/5'
                              }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("userWise.Next")}
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
            <div className="bg-[var(--bg-card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--text-color)]">{t("userWise.Supporter_Details")}</h3>
                <button
                  onClick={() => setViewingSupporter(null)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-4 space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-md font-medium text-[var(--text-color)] mb-3">{t("userWise.Personal_Information")}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("userWise.Full_Name")}</label>
                      <p className="text-sm text-[var(--text-color)]">{getFullName(viewingSupporter)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("userWise.Father_Name")}</label>
                      <p className="text-sm text-[var(--text-color)]">{viewingSupporter.father_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("userWise.Age")}</label>
                      <p className="text-sm text-[var(--text-color)]">{viewingSupporter.age} {t("userWise.Years")}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("userWise.Gender")}</label>
                      <p className="text-sm text-[var(--text-color)]">{viewingSupporter.gender}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-md font-medium text-[var(--text-color)] mb-3">{t("userWise.Contact_Information")}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("userWise.Phone_Number")}</label>
                      <p className="text-sm text-[var(--text-color)]">{viewingSupporter.phone_no}</p>
                    </div>
                    {viewingSupporter.whatsapp_no && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("userWise.WhatsApp_Number")}</label>
                        <p className="text-sm text-[var(--text-color)]">{viewingSupporter.whatsapp_no}</p>
                      </div>
                    )}
                    {viewingSupporter.voter_epic_id && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("userWise.EPIC")}</label>
                        <p className="text-sm text-[var(--text-color)]">{viewingSupporter.voter_epic_id}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Demographics */}
                <div>
                  <h4 className="text-md font-medium text-[var(--text-color)] mb-3">{t("userWise.Demographics")}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("userWise.Religion")}</label>
                      <p className="text-sm text-[var(--text-color)]">{viewingSupporter.religion}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("userWise.Category")}</label>
                      <p className="text-sm text-[var(--text-color)]">{viewingSupporter.category}</p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h4 className="text-md font-medium text-[var(--text-color)] mb-3">{t("userWise.Location_Information")}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("userWise.State")}</label>
                      <p className="text-sm text-[var(--text-color)]">{viewingSupporter.state_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("userWise.District")}</label>
                      <p className="text-sm text-[var(--text-color)]">{viewingSupporter.district_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("userWise.Assembly")}</label>
                      <p className="text-sm text-[var(--text-color)]">{viewingSupporter.assembly_name}</p>
                    </div>
                    {viewingSupporter.block_name && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("userWise.Block")}</label>
                        <p className="text-sm text-[var(--text-color)]">{viewingSupporter.block_name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Created Information */}
                <div>
                  <h4 className="text-md font-medium text-[var(--text-color)] mb-3">{t("userWise.Record_Information")}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("userWise.Created_At")}</label>
                      <p className="text-sm text-[var(--text-color)]">
                        {new Date(viewingSupporter.created_at).toLocaleString()}
                      </p>
                    </div>
                    {viewingSupporter.created_by_name && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)]">{t("userWise.Created_By")}</label>
                        <p className="text-sm text-[var(--text-color)]">{viewingSupporter.created_by_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end">
                <button
                  onClick={() => setViewingSupporter(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t("userWise.Close")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



