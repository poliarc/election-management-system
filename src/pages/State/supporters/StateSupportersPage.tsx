import { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { useGetAssemblyByStateQuery } from '../../../store/api/assemblyApi';
import {
  useGetSupportersByStateQuery,
  useGetSupportersByDistrictQuery,
  useGetSupportersByAssemblyQuery,
  useGetHierarchyQuery,
} from '../../../store/api/supportersApi';
import type { AfterAssemblyHierarchyNode } from '../../../types/campaign';
import type { Supporter } from '../../../types/supporter';
import { useTranslation } from 'react-i18next';

// ── Types ────────────────────────────────────────────────────────────────────

interface AssemblyOption {
  id: number;
  levelName: string;
  displayName: string;
  stateMasterData_id?: number;
  parentId?: number;
}

interface DistrictOption {
  id: number;
  levelName: string;
  displayName: string;
}

// One dynamic level dropdown: label + list of options — reserved for future use
// interface DynamicLevel { label: string; depth: number; options: AfterAssemblyHierarchyNode[]; }

// ── Component ────────────────────────────────────────────────────────────────

export default function StateSupportersPage() {
  const { t } = useTranslation();
  const { user, selectedAssignment } = useAppSelector((s) => s.auth);

  const stateId = user?.state_id || selectedAssignment?.stateMasterData_id || 0;
  const partyId = user?.partyId || 0;

  // Geographic filters
  const [selectedDistrictId, setSelectedDistrictId] = useState<number>(0);
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number>(0);

  // Dynamic after-assembly filter: sirf depth-0 level (assembly ka direct child)
  const [selectedAfterAssembly0, setSelectedAfterAssembly0] = useState<number>(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingSupporter, setViewingSupporter] = useState<Supporter | null>(null);

  // ── State / assembly hierarchy ───────────────────────────────────────────
  const { data: hierarchyData, isLoading: hierarchyLoading, error: hierarchyError } =
    useGetAssemblyByStateQuery({ state_id: stateId, party_id: partyId }, { skip: !stateId || !partyId });

  // ── After-assembly hierarchy (same endpoint as campaign form) ────────────
  const { data: campaignHierarchyData, isLoading: campaignHierarchyLoading } =
    useGetHierarchyQuery({ state_id: stateId, party_id: partyId }, { skip: !stateId || !partyId });

  const afterAssemblyHierarchy: AfterAssemblyHierarchyNode[] =
    (campaignHierarchyData?.data?.afterAssemblyHierarchy || []) as AfterAssemblyHierarchyNode[];

  // ── Build only depth-0 dynamic level (direct child of assembly) ────────
  // Assembly ke baad jo pehla level hai wahi dikhana hai (e.g. Zone, Block, Mandal)
  const firstDynamicLevel = useMemo(() => {
    if (!afterAssemblyHierarchy.length) return null;
    // depth-0 = parentId === null
    const depth0Nodes = afterAssemblyHierarchy.filter((n) => n.parentId === null);
    if (!depth0Nodes.length) return null;
    return {
      label: depth0Nodes[0].display_level_name || depth0Nodes[0].levelName,
      options: depth0Nodes,
    };
  }, [afterAssemblyHierarchy]);

  // ── Geographic option lists ──────────────────────────────────────────────
  const districts: DistrictOption[] =
    hierarchyData?.data?.stateHierarchy
      ?.filter((item: any) => item.levelType === 'District')
      .map((item: any) => ({ id: item.id, levelName: item.levelName, displayName: item.levelName })) || [];

  const assemblies: AssemblyOption[] =
    hierarchyData?.data?.stateHierarchy
      ?.filter(
        (item: any) =>
          item.levelType === 'Assembly' &&
          (!selectedDistrictId || item.ParentId === selectedDistrictId),
      )
      .map((item: any) => ({
        id: item.stateMasterData_id || item.id,
        levelName: item.levelName,
        displayName: item.levelName,
        stateMasterData_id: item.stateMasterData_id || item.id,
        parentId: item.ParentId,
      })) || [];

  // Options for depth-0 dropdown, filtered by selected assembly/district
  const firstLevelOptions = useMemo((): AfterAssemblyHierarchyNode[] => {
    if (!firstDynamicLevel) return [];
    return firstDynamicLevel.options.filter((n) => {
      if (selectedAssemblyId > 0) return n.parentAssemblyId === selectedAssemblyId;
      if (selectedDistrictId > 0) {
        const asm = assemblies.find((a) => a.id === n.parentAssemblyId);
        return asm?.parentId === selectedDistrictId;
      }
      return true;
    });
  }, [firstDynamicLevel, selectedAssemblyId, selectedDistrictId, assemblies]);

  // The deepest selected after-assembly ID passed as blockId to supporters API
  const deepestAfterAssemblyId = selectedAfterAssembly0;

  // ── Supporters queries ───────────────────────────────────────────────────
  const { data: stateSupportersData, isLoading: stateLoading, refetch: refetchState } =
    useGetSupportersByStateQuery(
      {
        stateId,
        page: currentPage,
        limit: 10,
        search: searchTerm,
        districtId: selectedDistrictId || undefined,
        assemblyId: selectedAssemblyId || undefined,
        blockId: deepestAfterAssemblyId || undefined,
        partyId: partyId || undefined,
      },
      { skip: !stateId || selectedDistrictId > 0 || selectedAssemblyId > 0 },
    );

  const { data: districtSupportersData, isLoading: districtLoading, refetch: refetchDistrict } =
    useGetSupportersByDistrictQuery(
      {
        districtId: selectedDistrictId,
        page: currentPage,
        limit: 10,
        search: searchTerm,
        assemblyId: selectedAssemblyId || undefined,
        blockId: deepestAfterAssemblyId || undefined,
        partyId: partyId || undefined,
      },
      { skip: !selectedDistrictId || selectedAssemblyId > 0 },
    );

  const { data: assemblySupportersData, isLoading: assemblyLoading, refetch: refetchAssembly } =
    useGetSupportersByAssemblyQuery(
      {
        assemblyId: selectedAssemblyId,
        page: currentPage,
        limit: 10,
        search: searchTerm,
        blockId: deepestAfterAssemblyId || undefined,
        partyId: partyId || undefined,
      },
      { skip: !selectedAssemblyId },
    );

  const supportersData =
    selectedAssemblyId > 0
      ? assemblySupportersData
      : selectedDistrictId > 0
      ? districtSupportersData
      : stateSupportersData;

  const supportersLoading =
    selectedAssemblyId > 0 ? assemblyLoading : selectedDistrictId > 0 ? districtLoading : stateLoading;

  const refetch =
    selectedAssemblyId > 0 ? refetchAssembly : selectedDistrictId > 0 ? refetchDistrict : refetchState;

  const supporters = supportersData?.data || [];
  const pagination = supportersData?.pagination;

  // ── Search debounce ──────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stateId || selectedDistrictId || selectedAssemblyId) {
        setCurrentPage(1);
        refetch();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleDistrictChange = (id: number) => {
    setSelectedDistrictId(id);
    setSelectedAssemblyId(0);
    setSelectedAfterAssembly0(0);
    setCurrentPage(1);
    setSearchTerm('');
  };

  const handleAssemblyChange = (id: number) => {
    setSelectedAssemblyId(id);
    setSelectedAfterAssembly0(0);
    setCurrentPage(1);
    setSearchTerm('');
  };

  const handleAfterAssembly0Change = (id: number) => {
    setSelectedAfterAssembly0(id);
    setCurrentPage(1);
  };



  const getFullName = (s: Supporter) =>
    `${s.initials || ''} ${s.first_name || ''} ${s.last_name || ''}`.trim();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-color)]">{t('stateSupporter.Title')}</h1>
          <p className="text-[var(--text-secondary)]">{t('stateSupporter.disc')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Total */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">{t('stateSupporter.Total_Supporter')}</p>
                <p className="text-2xl font-bold mt-1">{pagination?.total || 0}</p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Districts */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium">{t('stateSupporter.District')}</p>
                <p className="text-2xl font-bold mt-1">
                  {selectedDistrictId ? pagination?.total || 0 : districts.length}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Assemblies */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium">{t('stateSupporter.Assembly')}</p>
                <p className="text-2xl font-bold mt-1">
                  {selectedAssemblyId ? pagination?.total || 0 : assemblies.length}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          {/* First dynamic level stat card (Zone / Block / Mandal …) */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs font-medium">
                  {firstDynamicLevel?.label || t('stateSupporter.Block')}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {selectedAfterAssembly0 ? pagination?.total || 0 : firstLevelOptions.length}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-sm border border-[var(--border-color)] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-color)] mb-4">
            {t('stateSupporter.Filter_Supporter')}
          </h2>

          {/* Row 1: State + District + Assembly + dynamic levels */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

            {/* State (disabled) */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {t('stateSupporter.State')}
              </label>
              <select
                value={stateId}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              >
                <option value={stateId}>
                  {hierarchyData?.data?.stateHierarchy?.find((i: any) => i.id === stateId)?.levelName ||
                    'Current State'}
                </option>
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {t('stateSupporter.Select_District')}
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => handleDistrictChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                disabled={hierarchyLoading}
              >
                <option value={0}>
                  {hierarchyLoading ? 'Loading…' : hierarchyError ? 'Error' : 'All Districts'}
                </option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.displayName}</option>
                ))}
              </select>
            </div>

            {/* Assembly */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {t('stateSupporter.Select_Assembly')}
              </label>
              <select
                value={selectedAssemblyId}
                onChange={(e) => handleAssemblyChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                disabled={hierarchyLoading}
              >
                <option value={0}>All Assemblies</option>
                {assemblies.map((a) => (
                  <option key={a.id} value={a.id}>{a.displayName}</option>
                ))}
              </select>
            </div>

            {/* Dynamic level 0 (Zone / Block / Mandal — assembly ke baad pehla level) */}
            {firstDynamicLevel && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Select {firstDynamicLevel.label}
                </label>
                <select
                  value={selectedAfterAssembly0}
                  onChange={(e) => handleAfterAssembly0Change(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  disabled={campaignHierarchyLoading || firstLevelOptions.length === 0}
                >
                  <option value={0}>
                    {campaignHierarchyLoading
                      ? 'Loading…'
                      : firstLevelOptions.length === 0
                      ? `No ${firstDynamicLevel.label} available`
                      : `All ${firstDynamicLevel.label}s`}
                  </option>
                  {firstLevelOptions.map((n) => (
                    <option key={n.id} value={n.id}>{n.displayName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              {t('stateSupporter.Search_Supporter')}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, or EPIC ID…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Supporters List */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-sm border border-[var(--border-color)]">
          <div className="px-6 py-4 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-color)]">
              {t('stateSupporter.Supporters_List')}
              {pagination && (
                <span className="ml-2 text-sm font-normal text-[var(--text-secondary)]">
                  ({pagination.total} total)
                </span>
              )}
            </h2>
          </div>

          {/* Loading */}
          {supportersLoading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
              <p className="text-[var(--text-secondary)] mt-2">{t('stateSupporter.Loading_Supporters')}</p>
            </div>
          )}

          {/* Empty */}
          {!supportersLoading && supporters.length === 0 && (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-[var(--text-color)]">{t('stateSupporter.No_Supporters')}</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No supporters found for the selected filters.'}
              </p>
            </div>
          )}

          {/* Table */}
          {!supportersLoading && supporters.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[var(--bg-main)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t('stateSupporter.Supporter')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t('stateSupporter.Contact')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t('stateSupporter.Demographics')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t('stateSupporter.Location')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t('stateSupporter.Created')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t('stateSupporter.Actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--bg-card)] divide-y divide-gray-200">
                    {supporters.map((supporter) => (
                      <tr key={supporter.supporter_id} className="hover:bg-[var(--text-color)]/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-[var(--text-color)]">{getFullName(supporter)}</div>
                          <div className="text-sm text-[var(--text-secondary)]">{t('stateSupporter.Father')} {supporter.father_name}</div>
                          {supporter.voter_epic_id && (
                            <div className="text-xs text-[var(--text-secondary)]">{t('stateSupporter.EPIC')} {supporter.voter_epic_id}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[var(--text-color)]">{supporter.phone_no}</div>
                          {supporter.whatsapp_no && (
                            <div className="text-sm text-[var(--text-secondary)]">WA: {supporter.whatsapp_no}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[var(--text-color)]">{supporter.gender}, {t('stateSupporter.Age')} {supporter.age}</div>
                          <div className="text-sm text-[var(--text-secondary)]">{supporter.religion} - {supporter.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[var(--text-color)]">{supporter.assembly_name}</div>
                          {supporter.block_name && (
                            <div className="text-sm text-[var(--text-secondary)]">{supporter.block_name}</div>
                          )}
                          {supporter.mandal_name && (
                            <div className="text-xs text-[var(--text-secondary)]">{supporter.mandal_name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                          {new Date(supporter.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setViewingSupporter(supporter)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          >
                            {t('stateSupporter.View')}
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
                      {t('stateSupporter.Showing')} {(pagination.page - 1) * pagination.limit + 1}{' '}
                      {t('stateSupporter.to')}{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                      {t('stateSupporter.of')} {pagination.total} {t('stateSupporter.results')}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('stateSupporter.Previous')}
                      </button>
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            page === pagination.page
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'border-gray-300 hover:bg-[var(--text-color)]/5'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('stateSupporter.Next')}
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-[var(--bg-card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--text-color)]">
                  {t('stateSupporter.Supporter_Details')}
                </h3>
                <button onClick={() => setViewingSupporter(null)} className="text-[var(--text-secondary)] hover:opacity-70 transition-opacity">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-4 space-y-6">
                <div>
                  <h4 className="text-md font-medium text-[var(--text-color)] mb-3">{t('stateSupporter.Personal_Information')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t('stateSupporter.Full_Name')}</label>
                      <p className="text-sm text-[var(--text-color)]">{getFullName(viewingSupporter)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t('stateSupporter.Father_Name')}</label>
                      <p className="text-sm text-[var(--text-color)]">{viewingSupporter.father_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t('stateSupporter.Age')}</label>
                      <p className="text-sm text-[var(--text-color)]">{viewingSupporter.age} {t('stateSupporter.years')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t('stateSupporter.Gender')}</label>
                      <p className="text-sm text-[var(--text-color)]">{viewingSupporter.gender}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)]">{t('stateSupporter.Date_of_Birth')}</label>
                      <p className="text-sm text-[var(--text-color)]">
                        {new Date(viewingSupporter.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
