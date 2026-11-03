import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SupporterList, SupporterStats } from './index';
import type { Supporter } from '../../../types/supporter';
import type { AfterAssemblyHierarchyNode } from '../../../types/campaign';
import { useAppSelector } from '../../../store/hooks';
import {
  useGetHierarchyQuery,
  useGetSupporterByIdQuery,
  useGenerateShortLinkMutation,
  useGetGeneratedLinksQuery,
} from '../../../store/api/supportersApi';
import { useTranslation } from 'react-i18next';

export default function SupportersPage() {
  const navigate = useNavigate();
  const { user, selectedAssignment } = useAppSelector((s) => s.auth);
  const [generateShortLink, { isLoading: isGeneratingLink }] = useGenerateShortLinkMutation();
  const [viewingSupporter, setViewingSupporter] = useState<Supporter | null>(null);

  // Fetch full supporter details by ID (including dynamic after-assembly levels)
  const { data: fullSupporterDetails } = useGetSupporterByIdQuery(
    viewingSupporter?.supporter_id || 0,
    { skip: !viewingSupporter?.supporter_id }
  );

  const activeSupporter = fullSupporterDetails || viewingSupporter;
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneModalSupporter, setPhoneModalSupporter] = useState<Supporter | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showBlockSelectionModal, setShowBlockSelectionModal] = useState(false);
  const [linkType, setLinkType] = useState<'assembly' | 'state_wide'>('assembly');

  // Modal active tab: 'generate' or 'history'
  const [modalTab, setModalTab] = useState<'generate' | 'history'>('generate');
  const [linksFilter, setLinksFilter] = useState<'all' | 'assembly' | 'state_wide'>('all');

  // Dynamic after-assembly selections for link generation modal
  const [linkSelections, setLinkSelections] = useState<number[]>([]);

  const [generatedLink, setGeneratedLink] = useState('');

  // Fetch hierarchy once via RTK Query (cached, no repeated calls)
  const stateId = user?.state_id || selectedAssignment?.stateMasterData_id || 0;
  const partyId = user?.partyId || 0;
  const assemblyId = selectedAssignment?.stateMasterData_id || 0;

  const { data: hierarchyData, isLoading: loadingBlocks } = useGetHierarchyQuery(
    { state_id: stateId, party_id: partyId },
    { skip: !showBlockSelectionModal || !stateId || !partyId }
  );

  // Fetch previously generated links for this user / party / state
  const { data: generatedLinksData, isLoading: loadingLinks } = useGetGeneratedLinksQuery(
    { party_id: partyId, state_id: stateId },
    { skip: !showBlockSelectionModal || !partyId }
  );
  const existingLinks = (generatedLinksData?.data || []) as any[];

  // Filtered links in the table view
  const filteredLinks = useMemo(() => {
    if (linksFilter === 'state_wide') {
      return existingLinks.filter((l) => l.link_type === 'state_wide');
    }
    if (linksFilter === 'assembly') {
      return existingLinks.filter(
        (l) => l.link_type === 'assembly' && (!assemblyId || l.assembly_id === assemblyId)
      );
    }
    return existingLinks;
  }, [existingLinks, linksFilter, assemblyId]);

  // All after-assembly nodes
  const afterAssemblyData: AfterAssemblyHierarchyNode[] =
    (hierarchyData?.data?.afterAssemblyHierarchy || []) as AfterAssemblyHierarchyNode[];

  // Dynamic levels — depth-based
  const dynamicLevels = useMemo(() => {
    if (!afterAssemblyData.length) return [];
    const depthMap = new Map<number, number>();
    const getDepth = (node: AfterAssemblyHierarchyNode): number => {
      if (depthMap.has(node.id)) return depthMap.get(node.id)!;
      if (node.parentId === null) {
        depthMap.set(node.id, 0);
        return 0;
      }
      const parent = afterAssemblyData.find((n) => n.id === node.parentId);
      const d = parent ? getDepth(parent) + 1 : 0;
      depthMap.set(node.id, d);
      return d;
    };
    afterAssemblyData.forEach(getDepth);
    const byDepth = new Map<number, { label: string; nodes: AfterAssemblyHierarchyNode[] }>();
    afterAssemblyData.forEach((node) => {
      const d = depthMap.get(node.id) ?? 0;
      if (!byDepth.has(d))
        byDepth.set(d, { label: node.display_level_name || node.levelName, nodes: [] });
      byDepth.get(d)!.nodes.push(node);
    });
    return Array.from(byDepth.entries())
      .sort(([a], [b]) => a - b)
      .map(([depth, { label, nodes }]) => ({ depth, label, nodes }));
  }, [afterAssemblyData]);

  // Cascaded options per depth, filtered from assembly
  const visibleLinkOptions = useMemo(() => {
    return dynamicLevels.map(({ depth, nodes }) => {
      if (depth === 0) return nodes.filter((n) => n.parentAssemblyId === assemblyId);
      const parentId = linkSelections[depth - 1];
      if (!parentId) return [];
      return nodes.filter((n) => n.parentId === parentId);
    });
  }, [dynamicLevels, linkSelections, assemblyId]);
  const { t } = useTranslation();

  const handleCreate = () => {
    navigate('/assembly/supporters/add');
  };

  const handleGenerateLink = () => {
    setLinkType('assembly');
    setLinkSelections([]);
    setModalTab('generate');
    setLinksFilter('all');
    setShowBlockSelectionModal(true);
  };

  const handleConfirmBlockAndGenerateLink = async () => {
    try {
      const getNodeAt = (depth: number) => {
        const id = linkSelections[depth];
        if (!id) return null;
        return afterAssemblyData.find((n) => n.id === id) || null;
      };

      const extraLevels: { id: number; name: string; label: string; depth: number }[] = [];
      if (linkType !== 'state_wide') {
        for (let depth = 1; depth < dynamicLevels.length; depth++) {
          const id = linkSelections[depth];
          if (!id || id === 0) break;
          const n = getNodeAt(depth);
          extraLevels.push({
            depth,
            id,
            name: n?.displayName || n?.levelName || '',
            label: dynamicLevels[depth]?.label || `Level ${depth}`,
          });
        }
      }

      const payload = {
        party_id: user?.partyId || 0,
        party_name: user?.partyName || 'Party',
        state_id: stateId,
        state_name: user?.stateName || selectedAssignment?.stateName || 'State',
        district_id: linkType === 'state_wide' ? null : selectedAssignment?.parentId || 0,
        district_name:
          linkType === 'state_wide'
            ? null
            : selectedAssignment?.parentLevelName || selectedAssignment?.districtName || 'District',
        assembly_id: linkType === 'state_wide' ? null : assemblyId,
        assembly_name:
          linkType === 'state_wide'
            ? null
            : selectedAssignment?.levelName || selectedAssignment?.displayName || 'Assembly',
        block_id: linkType === 'state_wide' ? 0 : linkSelections[0] || 0,
        block_name:
          linkType === 'state_wide'
            ? ''
            : getNodeAt(0)?.displayName || getNodeAt(0)?.levelName || '',
        block_label: dynamicLevels[0]?.label || 'Block',
        extra_levels: extraLevels,
        link_type: linkType,
      };

      const res: any = await generateShortLink(payload).unwrap();
      const code = res?.data?.code || res?.code;
      if (code) {
        const shortUrl = `${window.location.origin}/supporter/register?code=${code}`;
        setGeneratedLink(shortUrl);
        setShowBlockSelectionModal(false);
        setShowLinkModal(true);
      } else {
        toast.error('Failed to generate short link');
      }
    } catch (err: any) {
      console.error('Error generating short link:', err);
      toast.error(err?.data?.message || err?.message || 'Failed to generate short link');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copied to clipboard!');
  };

  const handleCopySpecificLink = (code: string) => {
    const shortUrl = `${window.location.origin}/supporter/register?code=${code}`;
    navigator.clipboard.writeText(shortUrl);
    toast.success('Short link copied to clipboard!');
  };

  const handleShareWhatsApp = (linkItem: any) => {
    const shortUrl = `${window.location.origin}/supporter/register?code=${linkItem.code}`;
    const locationParts: string[] = [];
    if (linkItem.link_type === 'state_wide') {
      locationParts.push(linkItem.state_name || 'State');
    } else {
      if (linkItem.assembly_name) locationParts.push(linkItem.assembly_name);
      if (linkItem.block_name)
        locationParts.push(`${linkItem.block_label || 'Block'}: ${linkItem.block_name}`);
      if (linkItem.district_name) locationParts.push(linkItem.district_name);
    }
    const locStr = locationParts.filter(Boolean).join(', ');
    const msg = `Namaste! Join as a supporter for ${linkItem.party_name || 'our party'}${
      locStr ? ` (${locStr})` : ''
    }:\n${shortUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCloseLinkModal = () => {
    setShowLinkModal(false);
    setGeneratedLink('');
  };

  const handleEdit = (supporter: Supporter) => {
    navigate(`/assembly/supporters/edit/${supporter.supporter_id}`);
  };

  const handleView = (supporter: Supporter) => {
    setViewingSupporter(supporter);
  };

  const handleCloseView = () => {
    setViewingSupporter(null);
  };

  const handleShowPhone = (supporter: Supporter) => {
    setPhoneModalSupporter(supporter);
    setShowPhoneModal(true);
  };

  const handleClosePhoneModal = () => {
    setShowPhoneModal(false);
    setPhoneModalSupporter(null);
  };

  // Helper to parse language array
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

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-color)]">
            {t('SupportersPage.Supporters')}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            {t('SupportersPage.Manage_your_supporters_database')}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={handleGenerateLink}
            className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
            title={t('SupportersPage.Generate_Public_Link')}
          >
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{t('SupportersPage.Generate_Public_Link')}</span>
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M12 5v14m-7-7h14"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{t('SupportersPage.Add_Supporter')}</span>
          </button>
        </div>
      </div>

      <SupporterStats />

      <SupporterList
        onEdit={handleEdit}
        onView={handleView}
        onShowPhone={handleShowPhone}
      />

      {/* Block / Short Link Selection & History Modal */}
      {showBlockSelectionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl max-w-3xl w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto border border-[var(--border-color)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-color)]">
                  {modalTab === 'generate'
                    ? t('SupportersPage.Select_Location_for_Registration_Link')
                    : 'Generated Registration Links'}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                  {modalTab === 'generate'
                    ? t('SupportersPage.Choose_hierarchy_levels_for_the_registration_link')
                    : 'View, copy, and share previously generated registration links'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBlockSelectionModal(false);
                  setLinkSelections([]);
                }}
                className="text-[var(--text-secondary)] hover:text-[var(--text-color)] p-1 rounded-lg hover:bg-[var(--text-color)]/5 transition-colors"
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

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mb-5 p-1 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setModalTab('generate')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  modalTab === 'generate'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-color)]'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 5v14m-7-7h14" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Generate New Link</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('history')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  modalTab === 'history'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-color)]'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>View Generated Links</span>
                {existingLinks.length > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      modalTab === 'history'
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    }`}
                  >
                    {existingLinks.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: GENERATE NEW LINK */}
            {modalTab === 'generate' && (
              <div className="space-y-4">
                {/* Link Type Selector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setLinkType('assembly')}
                    className={`cursor-pointer rounded-xl p-3.5 border-2 transition-all flex items-start gap-3 ${
                      linkType === 'assembly'
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30 shadow-sm'
                        : 'border-[var(--border-color)] hover:border-gray-300 dark:hover:border-gray-700 bg-[var(--bg-main)]'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        linkType === 'assembly' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400'
                      }`}
                    >
                      {linkType === 'assembly' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--text-color)]">
                        {t('SupportersPage.Assembly_Specific', 'Assembly Specific Link')}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                        Pre-filled for{' '}
                        <span className="font-semibold text-[var(--text-color)]">
                          {selectedAssignment?.levelName || 'this Assembly'}
                        </span>
                        . Supporter will directly join this assembly.
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setLinkType('state_wide')}
                    className={`cursor-pointer rounded-xl p-3.5 border-2 transition-all flex items-start gap-3 ${
                      linkType === 'state_wide'
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30 shadow-sm'
                        : 'border-[var(--border-color)] hover:border-gray-300 dark:hover:border-gray-700 bg-[var(--bg-main)]'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        linkType === 'state_wide' ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400'
                      }`}
                    >
                      {linkType === 'state_wide' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--text-color)]">
                        {t('SupportersPage.State_Wide_Open', 'State-Wide Open Link')}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                        For all of{' '}
                        <span className="font-semibold text-[var(--text-color)]">
                          {user?.stateName || 'State'}
                        </span>
                        . Supporter can choose their own District & Assembly.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Switch to Existing Links */}
                <div className="flex items-center justify-between px-1 py-0.5">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {linkType === 'state_wide'
                      ? 'Already have a State-Wide link?'
                      : 'Already have an Assembly link?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLinksFilter(linkType === 'state_wide' ? 'state_wide' : 'assembly');
                      setModalTab('history');
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M4 6h16M4 12h16M4 18h7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>
                      View Existing {linkType === 'state_wide' ? 'State-Wide' : 'Assembly'} Links
                    </span>
                  </button>
                </div>

                {linkType === 'state_wide' ? (
                  /* State-Wide Open Link Information Box */
                  <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 space-y-2.5">
                    <div className="font-bold flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-sm">
                      <svg
                        className="w-5 h-5 shrink-0 text-emerald-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>
                        Open State Registration: {user?.stateName || selectedAssignment?.stateName || 'State'}
                      </span>
                    </div>
                    <p className="leading-relaxed">
                      Supporters anywhere across the state can use this link to self-register by selecting
                      their respective <strong>District</strong> and <strong>Assembly</strong>.
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-xs text-emerald-700 dark:text-emerald-400">
                      <span className="font-medium">State:</span>
                      <span className="font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 rounded">
                        {user?.stateName || selectedAssignment?.stateName || 'State'}
                      </span>
                    </div>
                  </div>
                ) : loadingBlocks ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">Loading hierarchy...</p>
                  </div>
                ) : (
                  <>
                    {/* Pre-filled Location (Disabled) */}
                    <div className="bg-[var(--bg-main)] rounded-lg p-4 border border-[var(--border-color)]">
                      <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                        {t('SupportersPage.Pre_filled_Location')}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                            {t('SupportersPage.State')}
                          </label>
                          <input
                            type="text"
                            value={user?.stateName || selectedAssignment?.stateName || 'State'}
                            disabled
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-[var(--text-secondary)]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                            {t('SupportersPage.District')}
                          </label>
                          <input
                            type="text"
                            value={
                              selectedAssignment?.parentLevelName ||
                              selectedAssignment?.districtName ||
                              'District'
                            }
                            disabled
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-[var(--text-secondary)]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                            {t('SupportersPage.Assembly')}
                          </label>
                          <input
                            type="text"
                            value={
                              selectedAssignment?.levelName ||
                              selectedAssignment?.displayName ||
                              'Assembly'
                            }
                            disabled
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-[var(--text-secondary)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dynamic hierarchy selection */}
                    <div>
                      <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                        {t('SupportersPage.Hierarchy_Levels')}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {dynamicLevels.map((level, idx) => {
                          const opts = visibleLinkOptions[idx] || [];
                          const parentSelected =
                            level.depth === 0 || (linkSelections[level.depth - 1] || 0) > 0;
                          const isRequired = false; // all levels optional
                          return (
                            <div key={level.depth}>
                              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {level.label}
                                {isRequired ? (
                                  <span className="text-red-500 ml-1">*</span>
                                ) : (
                                  <span className="text-[var(--text-secondary)] ml-1">(Optional)</span>
                                )}
                              </label>
                              <select
                                value={linkSelections[level.depth] || 0}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setLinkSelections((prev) => {
                                    const next = [...prev];
                                    next[level.depth] = val;
                                    for (let i = level.depth + 1; i < dynamicLevels.length; i++)
                                      next[i] = 0;
                                    return next;
                                  });
                                }}
                                disabled={!parentSelected || opts.length === 0}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-[var(--text-secondary)]"
                              >
                                <option value={0}>
                                  {!parentSelected
                                    ? `Select ${dynamicLevels[level.depth - 1]?.label} first`
                                    : opts.length === 0
                                    ? `No ${level.label} available`
                                    : `Select ${level.label}`}
                                </option>
                                {opts.map((n) => (
                                  <option key={n.id} value={n.id}>
                                    {n.displayName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <svg
                          className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <circle cx="12" cy="12" r="10" strokeWidth={2} />
                          <path
                            d="M12 16v-4M12 8h.01"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="text-sm text-blue-800">
                          All hierarchy levels are optional. You can generate the link for just the
                          assembly level.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Footer Buttons for Generate Tab */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => {
                      setLinksFilter(linkType === 'state_wide' ? 'state_wide' : 'assembly');
                      setModalTab('history');
                    }}
                    className="w-full sm:w-auto px-4 py-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>View Existing Links</span>
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => {
                        setShowBlockSelectionModal(false);
                        setLinkSelections([]);
                      }}
                      className="px-4 py-2 text-[var(--text-secondary)] border border-gray-300 rounded-lg hover:bg-[var(--text-color)]/5 transition-colors text-xs sm:text-sm font-medium"
                    >
                      {t('SupportersPage.Cancel')}
                    </button>
                    <button
                      onClick={handleConfirmBlockAndGenerateLink}
                      disabled={isGeneratingLink}
                      className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-xs sm:text-sm font-semibold shadow-sm"
                    >
                      {isGeneratingLink ? 'Generating...' : t('SupportersPage.Generate_Link')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: VIEW GENERATED LINKS (TABLE FORMAT) */}
            {modalTab === 'history' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setLinksFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        linksFilter === 'all'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-color)] border border-[var(--border-color)]'
                      }`}
                    >
                      All Links ({existingLinks.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinksFilter('assembly')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        linksFilter === 'assembly'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-color)] border border-[var(--border-color)]'
                      }`}
                    >
                      This Assembly (
                      {
                        existingLinks.filter(
                          (l) => l.link_type === 'assembly' && (!assemblyId || l.assembly_id === assemblyId)
                        ).length
                      }
                      )
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinksFilter('state_wide')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        linksFilter === 'state_wide'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-color)] border border-[var(--border-color)]'
                      }`}
                    >
                      State-Wide ({existingLinks.filter((l) => l.link_type === 'state_wide').length})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalTab('generate')}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>+ Generate New</span>
                  </button>
                </div>

                {/* Table or Empty / Loading State */}
                {loadingLinks ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      Loading your generated links...
                    </p>
                  </div>
                ) : filteredLinks.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-main)]">
                    <svg
                      className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3 opacity-60"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <h4 className="text-sm font-semibold text-[var(--text-color)] mb-1">
                      No links found
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mb-4">
                      {linksFilter === 'state_wide'
                        ? 'No state-wide registration link generated yet.'
                        : linksFilter === 'assembly'
                        ? 'No registration link generated for this assembly yet.'
                        : "You haven't generated any registration links yet."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setModalTab('generate')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-semibold transition-colors"
                    >
                      Generate Registration Link
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-[var(--border-color)] rounded-xl bg-[var(--bg-card)] max-h-[50vh]">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead className="sticky top-0 bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[var(--text-secondary)] text-xs uppercase tracking-wider z-10">
                        <tr>
                          <th className="py-3 px-3.5 font-semibold">Type & Location</th>
                          <th className="py-3 px-3 font-semibold">Short Link</th>
                          <th className="py-3 px-3 font-semibold hidden md:table-cell">Created Date</th>
                          <th className="py-3 px-3.5 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {filteredLinks.map((linkItem: any) => {
                          const shortUrl = `${window.location.origin}/supporter/register?code=${linkItem.code}`;
                          return (
                            <tr
                              key={linkItem.id || linkItem.code}
                              className="hover:bg-[var(--bg-main)]/50 transition-colors"
                            >
                              {/* Type & Location */}
                              <td className="py-3 px-3.5 align-top">
                                <div className="space-y-1">
                                  {linkItem.link_type === 'state_wide' ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        State-Wide Open
                                      </span>
                                      <div className="text-xs font-semibold text-[var(--text-color)]">
                                        {linkItem.state_name || 'State'}
                                      </div>
                                      <div className="text-[11px] text-[var(--text-secondary)]">
                                        Open for all districts & assemblies
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                        Assembly Specific
                                      </span>
                                      <div className="text-xs font-semibold text-[var(--text-color)]">
                                        {linkItem.assembly_name || 'Assembly'}
                                      </div>
                                      <div className="text-[11px] text-[var(--text-secondary)] flex flex-wrap gap-1 items-center">
                                        {linkItem.district_name && (
                                          <span>{linkItem.district_name}</span>
                                        )}
                                        {linkItem.block_name && (
                                          <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-medium text-[var(--text-color)]">
                                            {linkItem.block_label || 'Block'}: {linkItem.block_name}
                                          </span>
                                        )}
                                        {linkItem.extra_levels &&
                                          Array.isArray(linkItem.extra_levels) &&
                                          linkItem.extra_levels.map((lvl: any, i: number) => (
                                            <span
                                              key={i}
                                              className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-[10px] font-medium text-indigo-700 dark:text-indigo-300"
                                            >
                                              {lvl.label || `L${lvl.depth}`}: {lvl.name}
                                            </span>
                                          ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>

                              {/* Short Link */}
                              <td className="py-3 px-3 align-top">
                                <div className="space-y-1">
                                  <div className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-[var(--bg-main)] px-2 py-1 rounded border border-[var(--border-color)] inline-block">
                                    code={linkItem.code}
                                  </div>
                                  <div
                                    className="text-[11px] text-[var(--text-secondary)] truncate max-w-[200px]"
                                    title={shortUrl}
                                  >
                                    {shortUrl}
                                  </div>
                                </div>
                              </td>

                              {/* Created Date */}
                              <td className="py-3 px-3 align-top hidden md:table-cell text-xs text-[var(--text-secondary)] whitespace-nowrap">
                                {formatDateTime(linkItem.created_at)}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-3.5 align-top text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleCopySpecificLink(linkItem.code)}
                                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
                                    title="Copy link to clipboard"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5 shrink-0"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                    >
                                      <rect
                                        x="9"
                                        y="9"
                                        width="13"
                                        height="13"
                                        rx="2"
                                        ry="2"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                    <span>Copy</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleShareWhatsApp(linkItem)}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap"
                                    title="Share on WhatsApp"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5 shrink-0 fill-current"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.772.82 2.791.82 3.181 0 5.767-2.586 5.767-5.766.001-3.182-2.585-5.806-5.767-5.806zm7.415 5.766c-.001 4.095-3.332 7.426-7.416 7.426-1.244 0-2.412-.312-3.447-.859l-4.583 1.201 1.222-4.467c-.633-1.09-1.008-2.353-1.008-3.301 0-4.094 3.332-7.425 7.416-7.425 4.084 0 7.416 3.331 7.416 7.425z" />
                                    </svg>
                                    <span>WhatsApp</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer for History Tab */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                  <span className="text-xs text-[var(--text-secondary)]">
                    Showing {filteredLinks.length} of {existingLinks.length} links
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalTab('generate')}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 5v14m-7-7h14" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Generate Another Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBlockSelectionModal(false)}
                      className="px-4 py-2 text-[var(--text-secondary)] border border-gray-300 rounded-lg hover:bg-[var(--text-color)]/5 text-xs sm:text-sm font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link Generation Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-color)]">
                  {t('SupportersPage.Public_Supporter_Registration_Link')}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  {t(
                    'SupportersPage.Share_this_link_to_allow_others_to_register_supporters_on_your_behalf'
                  )}
                </p>
              </div>
              <button
                onClick={handleCloseLinkModal}
                className="text-[var(--text-secondary)] hover:text-[var(--text-color)] p-1 rounded-lg"
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

            <div className="space-y-4">
              <div className="bg-[var(--bg-main)] rounded-lg p-4 border border-[var(--border-color)]">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {t('SupportersPage.Generated_Link')}:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={generatedLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-[var(--bg-card)] text-sm font-mono text-[var(--text-color)]"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 whitespace-nowrap text-sm font-semibold shadow-sm"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        ry="2"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {t('SupportersPage.Copy')}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    <path
                      d="M12 16v-4M12 8h.01"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">{t('SupportersPage.How_it_works')}:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>
                        {t('SupportersPage.Share_this_link_via_WhatsApp_SMS_or_social_media')}
                      </li>
                      <li>{t('SupportersPage.Anyone_with_the_link_can_register_supporters')}</li>
                      <li>
                        {t(
                          'SupportersPage.All_supporters_registered_through_this_link_will_be_credited_to_you'
                        )}
                      </li>
                      <li>
                        {linkType === 'state_wide'
                          ? 'The link allows supporters across the state to select their District and Assembly'
                          : t('SupportersPage.The_link_contains_your_assembly_and_user_information')}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseLinkModal}
                  className="px-4 py-2 text-[var(--text-secondary)] border border-gray-300 rounded-lg hover:bg-[var(--text-color)]/5 transition-colors text-sm font-medium"
                >
                  {t('SupportersPage.Close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supporter Details Modal */}
      {viewingSupporter && activeSupporter && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[var(--border-color)] animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Banner */}
            <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-indigo-700 px-6 py-5 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Initials Avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-bold text-xl text-white shadow-inner shrink-0">
                    {((activeSupporter.first_name?.[0] || '') +
                      (activeSupporter.last_name?.[0] || '')).toUpperCase() || 'SP'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-white tracking-wide">
                        {activeSupporter.initials} {activeSupporter.first_name}{' '}
                        {activeSupporter.last_name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                        #{activeSupporter.supporter_id}
                      </span>
                      {activeSupporter.isActive === 1 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/25 text-emerald-100 border border-emerald-400/40 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          {t('SupportersPage.Active', 'Active')}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/25 text-rose-100 border border-rose-400/40 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                          {t('SupportersPage.Inactive', 'Inactive')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-indigo-100 flex-wrap">
                      {activeSupporter.party_name && (
                        <span className="flex items-center gap-1 font-medium bg-black/20 px-2 py-0.5 rounded">
                          🏛️ {activeSupporter.party_name}
                        </span>
                      )}
                      {activeSupporter.assembly_name && (
                        <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded">
                          🗳️ {activeSupporter.assembly_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleCloseView();
                      handleEdit(activeSupporter);
                    }}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm border border-white/30 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {t('SupportersPage.Edit', 'Edit')}
                  </button>
                  <button
                    onClick={handleCloseView}
                    className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
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
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[var(--bg-main)]/40">
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
                      {t('SupportersPage.Personal_Information')}
                    </h3>

                    <div className="divide-y divide-[var(--border-color)]/60 text-sm">
                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {t('SupportersPage.Full_Name')}
                        </span>
                        <span className="font-semibold text-[var(--text-color)] text-right">
                          {activeSupporter.initials} {activeSupporter.first_name}{' '}
                          {activeSupporter.last_name}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {t('SupportersPage.Fathers_Name')}
                        </span>
                        <span className="font-medium text-[var(--text-color)] text-right">
                          {activeSupporter.father_name || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {t('SupportersPage.Date_of_Birth')}
                        </span>
                        <span className="font-medium text-[var(--text-color)] text-right">
                          {formatDate(activeSupporter.date_of_birth)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {t('SupportersPage.Age')}
                        </span>
                        <span className="font-medium text-[var(--text-color)] text-right">
                          {activeSupporter.age ? `${activeSupporter.age} Years` : 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {t('SupportersPage.Gender')}
                        </span>
                        <span className="font-medium text-[var(--text-color)] text-right">
                          {activeSupporter.gender || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {t('SupportersPage.EPIC_ID')}
                        </span>
                        <span className="text-right">
                          {activeSupporter.voter_epic_id ? (
                            <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold tracking-wider">
                              {activeSupporter.voter_epic_id}
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
                      {t('SupportersPage.Contact_Information', 'Contact Information')}
                    </h3>

                    <div className="divide-y divide-[var(--border-color)]/60 text-sm">
                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {t('SupportersPage.Phone_Number', 'Phone Number')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--text-color)]">
                            {activeSupporter.phone_no || 'N/A'}
                          </span>
                          {activeSupporter.phone_no && (
                            <a
                              href={`tel:${activeSupporter.phone_no}`}
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
                          {t('SupportersPage.WhatsApp_Number', 'WhatsApp Number')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--text-color)]">
                            {activeSupporter.whatsapp_no || 'N/A'}
                          </span>
                          {activeSupporter.whatsapp_no && (
                            <a
                              href={`https://wa.me/91${activeSupporter.whatsapp_no}`}
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
                      {t('SupportersPage.Record_Information')}
                    </h3>

                    <div className="divide-y divide-[var(--border-color)]/60 text-sm">
                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {t('SupportersPage.Created_By')}
                        </span>
                        <span className="font-medium text-[var(--text-color)] text-right">
                          {activeSupporter.created_by_name || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {t('SupportersPage.Created_At')}
                        </span>
                        <span className="font-medium text-[var(--text-color)] text-right">
                          {formatDateTime(activeSupporter.created_at)}
                        </span>
                      </div>

                      {activeSupporter.updated_at && (
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            Updated At
                          </span>
                          <span className="font-medium text-[var(--text-color)] text-right">
                            {formatDateTime(activeSupporter.updated_at)}
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
                      {t('SupportersPage.Address_Location')}
                    </h3>

                    <div className="divide-y divide-[var(--border-color)]/60 text-sm">
                      {/* Address */}
                      <div className="py-2.5">
                        <span className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                          {t('SupportersPage.Address')}
                        </span>
                        <p className="font-medium text-[var(--text-color)] bg-[var(--bg-main)]/50 p-2.5 rounded-lg border border-[var(--border-color)]/60 text-xs leading-relaxed">
                          {activeSupporter.address || 'N/A'}
                        </p>
                      </div>

                      {/* State */}
                      {activeSupporter.state_name && (
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">State</span>
                          <span className="font-semibold text-[var(--text-color)] text-right">
                            {activeSupporter.state_name}
                          </span>
                        </div>
                      )}

                      {/* District */}
                      {activeSupporter.district_name && (
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">District</span>
                          <span className="font-semibold text-[var(--text-color)] text-right">
                            {activeSupporter.district_name}
                          </span>
                        </div>
                      )}

                      {/* Assembly */}
                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {t('SupportersPage.Assembly')}
                        </span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-right">
                          {activeSupporter.assembly_name || 'N/A'}
                        </span>
                      </div>

                      {/* Dynamic After-Assembly Hierarchy */}
                      {activeSupporter.after_assembly_levels &&
                      activeSupporter.after_assembly_levels.length > 0 ? (
                        activeSupporter.after_assembly_levels.map((lvl) => (
                          <div key={lvl.depth} className="flex items-center justify-between py-2.5">
                            <span className="text-xs font-medium text-[var(--text-secondary)]">
                              {lvl.level_label || lvl.level_type}
                            </span>
                            <span className="font-semibold text-[var(--text-color)] text-right">
                              {lvl.level_name}
                            </span>
                          </div>
                        ))
                      ) : activeSupporter.block_name ? (
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('SupportersPage.Block')}
                          </span>
                          <span className="font-semibold text-[var(--text-color)] text-right">
                            {activeSupporter.block_name}
                          </span>
                        </div>
                      ) : null}
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
                      {t('SupportersPage.Cultural_Information')}
                    </h3>

                    <div className="divide-y divide-[var(--border-color)]/60 text-sm">
                      {/* Languages */}
                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {t('SupportersPage.Languages')}
                        </span>
                        <div>
                          {(() => {
                            const langs = parseLanguages(activeSupporter.language);
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
                          {t('SupportersPage.Religion')}
                        </span>
                        <span className="font-semibold text-[var(--text-color)] text-right">
                          {activeSupporter.religion || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {t('SupportersPage.Category')}
                        </span>
                        <span className="font-semibold text-[var(--text-color)] text-right">
                          {activeSupporter.category || 'N/A'}
                        </span>
                      </div>

                      {activeSupporter.caste && (
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-xs font-medium text-[var(--text-secondary)]">
                            {t('SupportersPage.Caste')}
                          </span>
                          <span className="font-semibold text-[var(--text-color)] text-right">
                            {activeSupporter.caste}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Remarks */}
                  {activeSupporter.remarks && (
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
                        {t('SupportersPage.Remarks')}
                      </h4>
                      <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-wrap">
                        {activeSupporter.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-[var(--bg-card)] border-t border-[var(--border-color)] flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">
                Supporter ID:{' '}
                <span className="font-semibold text-[var(--text-color)]">
                  #{activeSupporter.supporter_id}
                </span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCloseView}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-color)] hover:bg-[var(--bg-main)] transition-colors border border-[var(--border-color)]"
                >
                  {t('SupportersPage.Close')}
                </button>
                <button
                  onClick={() => {
                    handleCloseView();
                    handleEdit(activeSupporter);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {t('SupportersPage.Edit_Supporter', 'Edit Supporter')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone Modal */}
      {showPhoneModal && phoneModalSupporter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-color)]">
                {t('SupportersPage.Contact_Information')}
              </h3>
              <button
                onClick={handleClosePhoneModal}
                className="text-[var(--text-secondary)] hover:text-[var(--text-secondary)]"
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

            <div className="space-y-4">
              <div className="bg-[var(--bg-color)] rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <svg
                    className="h-5 w-5 text-blue-600 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    {t('SupportersPage.Phone_Number')}
                  </label>
                </div>
                <p className="text-lg font-semibold text-[var(--text-color)] ml-7">
                  {phoneModalSupporter.phone_no}
                </p>
              </div>

              {phoneModalSupporter.whatsapp_no && (
                <div className="bg-[var(--bg-color)] rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg
                      className="h-5 w-5 text-green-600 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <label className="text-sm font-medium text-[var(--text-secondary)]">
                      {t('SupportersPage.WhatsApp_Number')}
                    </label>
                  </div>
                  <p className="text-lg font-semibold text-[var(--text-color)] ml-7">
                    {phoneModalSupporter.whatsapp_no}
                  </p>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  {t('SupportersPage.For')} {phoneModalSupporter.initials}{' '}
                  {phoneModalSupporter.first_name} {phoneModalSupporter.last_name}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
