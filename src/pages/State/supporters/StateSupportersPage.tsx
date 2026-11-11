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

  const parseLanguages = (language: any): string[] => {
    if (!language) return [];

    let parsed = language;
    if (typeof language === 'string') {
      try {
        parsed = JSON.parse(language);
      } catch {
        return [language];
      }
    }

    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean).map(String);
    }

    if (typeof parsed === 'object' && parsed !== null) {
      const langs: string[] = [];
      if (parsed.primary) langs.push(String(parsed.primary));
      if (parsed.secondary && Array.isArray(parsed.secondary)) {
        langs.push(...parsed.secondary.map(String));
      }
      return langs;
    }

    return [String(parsed)];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      if (d.getFullYear() === 1970 && d.getMonth() === 0 && d.getDate() === 1) return 'N/A';
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      if (d.getFullYear() === 1970 && d.getMonth() === 0 && d.getDate() === 1) return 'N/A';
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[var(--border-color)]">
              {/* Header / Banner */}
              <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-indigo-700 px-6 py-5 text-white relative shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-4 min-w-0">
                    {/* Initials Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-bold text-xl text-white shadow-inner shrink-0">
                      {((viewingSupporter.first_name?.[0] || '') +
                        (viewingSupporter.last_name?.[0] || '')).toUpperCase() ||
                        viewingSupporter.initials?.toUpperCase() ||
                        'SP'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-white tracking-wide truncate">
                          {getFullName(viewingSupporter) || 'Supporter Details'}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 shrink-0">
                          #{viewingSupporter.supporter_id}
                        </span>
                        {viewingSupporter.isActive === 1 || viewingSupporter.isActive === undefined ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/25 text-emerald-100 border border-emerald-400/40 flex items-center gap-1.5 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {t('stateSupporter.Active', 'Active')}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/25 text-rose-100 border border-rose-400/40 flex items-center gap-1.5 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            {t('stateSupporter.Inactive', 'Inactive')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-indigo-100 flex-wrap">
                        {viewingSupporter.party_name && (
                          <span className="flex items-center gap-1 font-medium bg-black/20 px-2 py-0.5 rounded">
                            🏛️ {viewingSupporter.party_name}
                          </span>
                        )}
                        {viewingSupporter.district_name && (
                          <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded">
                            📍 {viewingSupporter.district_name}
                          </span>
                        )}
                        {viewingSupporter.assembly_name && (
                          <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded">
                            🗳️ {viewingSupporter.assembly_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingSupporter(null)}
                    className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors shrink-0"
                    title="Close"
                  >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-[var(--bg-main)]/40">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  {/* ── LEFT COLUMN ── */}
                  <div className="space-y-5">
                    {/* Personal Information */}
                    <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-color)] shadow-sm">
                      <h3 className="text-sm font-bold text-[var(--text-color)] mb-4 flex items-center gap-2 pb-2.5 border-b border-[var(--border-color)]">
                        <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        {t('stateSupporter.Personal_Information', 'Personal Information')}
                      </h3>

                      <div className="divide-y divide-[var(--border-color)]/60 text-sm">
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('stateSupporter.Full_Name', 'Full Name')}
                          </span>
                          <span className="font-semibold text-[var(--text-color)] text-right">
                            {getFullName(viewingSupporter) || 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('stateSupporter.Father_Name', "Father's Name")}
                          </span>
                          <span className="font-medium text-[var(--text-color)] text-right">
                            {viewingSupporter.father_name || 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('stateSupporter.Date_of_Birth', 'Date of Birth')}
                          </span>
                          <span className="font-medium text-[var(--text-color)] text-right">
                            {formatDate(viewingSupporter.date_of_birth)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('stateSupporter.Age', 'Age')}
                          </span>
                          <span className="font-medium text-[var(--text-color)] text-right">
                            {viewingSupporter.age
                              ? `${viewingSupporter.age} ${t('stateSupporter.years', 'Years')}`
                              : 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('stateSupporter.Gender', 'Gender')}
                          </span>
                          <span className="font-medium text-[var(--text-color)] text-right">
                            {viewingSupporter.gender || 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('stateSupporter.EPIC_ID', 'Voter EPIC ID')}
                          </span>
                          <span className="text-right">
                            {viewingSupporter.voter_epic_id ? (
                              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold tracking-wider">
                                {viewingSupporter.voter_epic_id}
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--text-secondary)]">N/A</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-color)] shadow-sm">
                      <h3 className="text-sm font-bold text-[var(--text-color)] mb-4 flex items-center gap-2 pb-2.5 border-b border-[var(--border-color)]">
                        <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        {t('stateSupporter.Contact_Information', 'Contact Information')}
                      </h3>

                      <div className="divide-y divide-[var(--border-color)]/60 text-sm">
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('stateSupporter.Phone_Number', 'Phone Number')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--text-color)]">
                              {viewingSupporter.phone_no || 'N/A'}
                            </span>
                            {viewingSupporter.phone_no && (
                              <a
                                href={`tel:${viewingSupporter.phone_no}`}
                                className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 transition"
                                title="Call"
                              >
                                Call
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('stateSupporter.WhatsApp_Number', 'WhatsApp Number')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--text-color)]">
                              {viewingSupporter.whatsapp_no || 'N/A'}
                            </span>
                            {viewingSupporter.whatsapp_no && (
                              <a
                                href={`https://wa.me/91${viewingSupporter.whatsapp_no}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1"
                                title="WhatsApp"
                              >
                                WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Record Details */}
                    <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-color)] shadow-sm">
                      <h3 className="text-sm font-bold text-[var(--text-color)] mb-4 flex items-center gap-2 pb-2.5 border-b border-[var(--border-color)]">
                        <span className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0118 0Z"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        {t('stateSupporter.Record_Information', 'Record Information')}
                      </h3>

                      <div className="divide-y divide-[var(--border-color)]/60 text-sm">
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('stateSupporter.Created_By', 'Created By')}
                          </span>
                          <span className="font-medium text-[var(--text-color)] text-right">
                            {viewingSupporter.created_by_name || viewingSupporter.created_by || 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('stateSupporter.Created_At', 'Created At')}
                          </span>
                          <span className="font-medium text-[var(--text-color)] text-right">
                            {formatDateTime(viewingSupporter.created_at)}
                          </span>
                        </div>

                        {viewingSupporter.updated_at && (
                          <div className="flex items-center justify-between py-2.5">
                            <span className="text-xs font-medium text-[var(--text-secondary)]">
                              Updated At
                            </span>
                            <span className="font-medium text-[var(--text-color)] text-right">
                              {formatDateTime(viewingSupporter.updated_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── RIGHT COLUMN ── */}
                  <div className="space-y-5">
                    {/* Location & Hierarchy */}
                    <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-color)] shadow-sm">
                      <h3 className="text-sm font-bold text-[var(--text-color)] mb-4 flex items-center gap-2 pb-2.5 border-b border-[var(--border-color)]">
                        <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle cx="12" cy="10" r="3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        {t('stateSupporter.Address_Location', 'Address & Location')}
                      </h3>

                      <div className="divide-y divide-[var(--border-color)]/60 text-sm">
                        {/* Address */}
                        <div className="py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                            {t('stateSupporter.Address', 'Address')}
                          </span>
                          <p className="font-medium text-[var(--text-color)] bg-[var(--bg-main)]/50 p-2.5 rounded-lg border border-[var(--border-color)]/60 text-xs leading-relaxed">
                            {viewingSupporter.address || 'N/A'}
                          </p>
                        </div>

                        {/* State */}
                        {viewingSupporter.state_name && (
                          <div className="flex items-center justify-between py-2.5">
                            <span className="text-xs font-medium text-[var(--text-secondary)]">State</span>
                            <span className="font-semibold text-[var(--text-color)] text-right">
                              {viewingSupporter.state_name}
                            </span>
                          </div>
                        )}

                        {/* District */}
                        {viewingSupporter.district_name && (
                          <div className="flex items-center justify-between py-2.5">
                            <span className="text-xs font-medium text-[var(--text-secondary)]">District</span>
                            <span className="font-semibold text-[var(--text-color)] text-right">
                              {viewingSupporter.district_name}
                            </span>
                          </div>
                        )}

                        {/* Assembly */}
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('stateSupporter.Assembly', 'Assembly')}
                          </span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-right">
                            {viewingSupporter.assembly_name || 'N/A'}
                          </span>
                        </div>

                        {/* Dynamic After-Assembly Hierarchy or Block / Mandal */}
                        {viewingSupporter.after_assembly_levels &&
                        viewingSupporter.after_assembly_levels.length > 0 ? (
                          viewingSupporter.after_assembly_levels.map((lvl) => (
                            <div key={lvl.depth} className="flex items-center justify-between py-2.5">
                              <span className="text-xs font-medium text-[var(--text-secondary)]">
                                {lvl.level_label || lvl.level_type}
                              </span>
                              <span className="font-semibold text-[var(--text-color)] text-right">
                                {lvl.level_name}
                              </span>
                            </div>
                          ))
                        ) : (
                          <>
                            {viewingSupporter.block_name && (
                              <div className="flex items-center justify-between py-2.5">
                                <span className="text-xs font-medium text-[var(--text-secondary)]">
                                  {t('stateSupporter.Block', 'Block')}
                                </span>
                                <span className="font-semibold text-[var(--text-color)] text-right">
                                  {viewingSupporter.block_name}
                                </span>
                              </div>
                            )}
                            {viewingSupporter.mandal_name && (
                              <div className="flex items-center justify-between py-2.5">
                                <span className="text-xs font-medium text-[var(--text-secondary)]">
                                  {t('stateSupporter.Mandal', 'Mandal')}
                                </span>
                                <span className="font-semibold text-[var(--text-color)] text-right">
                                  {viewingSupporter.mandal_name}
                                </span>
                              </div>
                            )}
                            {viewingSupporter.booth_name && (
                              <div className="flex items-center justify-between py-2.5">
                                <span className="text-xs font-medium text-[var(--text-secondary)]">
                                  Booth
                                </span>
                                <span className="font-semibold text-[var(--text-color)] text-right">
                                  {viewingSupporter.booth_name}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Cultural & Social Information */}
                    <div className="bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-color)] shadow-sm">
                      <h3 className="text-sm font-bold text-[var(--text-color)] mb-4 flex items-center gap-2 pb-2.5 border-b border-[var(--border-color)]">
                        <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3s-4.5 4.03-4.5 9 2.015 9 4.5 9Z"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        {t('stateSupporter.Cultural_Information', 'Cultural & Demographics')}
                      </h3>

                      <div className="divide-y divide-[var(--border-color)]/60 text-sm">
                        {/* Languages */}
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('stateSupporter.Languages', 'Languages')}
                          </span>
                          <div>
                            {(() => {
                              const langs = parseLanguages(viewingSupporter.language);
                              if (langs.length === 0)
                                return (
                                  <span className="text-xs text-[var(--text-secondary)]">N/A</span>
                                );
                              return (
                                <div className="flex flex-wrap gap-1.5 justify-end">
                                  {langs.map((l, i) => (
                                    <span
                                      key={i}
                                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                    >
                                      {l}
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('stateSupporter.Religion', 'Religion')}
                          </span>
                          <span className="font-semibold text-[var(--text-color)] text-right">
                            {viewingSupporter.religion || 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('stateSupporter.Category', 'Category')}
                          </span>
                          <span className="font-semibold text-[var(--text-color)] text-right">
                            {viewingSupporter.category || 'N/A'}
                          </span>
                        </div>

                        {viewingSupporter.caste && (
                          <div className="flex items-center justify-between py-2.5">
                            <span className="text-xs font-medium text-[var(--text-secondary)]">
                              {t('stateSupporter.Caste', 'Caste')}
                            </span>
                            <span className="font-semibold text-[var(--text-color)] text-right">
                              {viewingSupporter.caste}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Remarks */}
                    {viewingSupporter.remarks && (
                      <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 shadow-sm">
                        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                          <svg
                            className="h-3.5 w-3.5 text-amber-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {t('stateSupporter.Remarks', 'Remarks')}
                        </h4>
                        <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-wrap">
                          {viewingSupporter.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between shrink-0">
                <span className="text-xs text-[var(--text-secondary)]">
                  Supporter ID: <strong className="text-[var(--text-color)]">#{viewingSupporter.supporter_id}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setViewingSupporter(null)}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm font-semibold shadow-sm"
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
