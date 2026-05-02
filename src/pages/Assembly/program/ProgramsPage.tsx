import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import type { ProgramListItem, ProgramStatus } from "./types";
import type { ProgramSubmitData } from "./ProgramForm";
import {
  getPrograms, createProgram, updateProgram, deleteProgram,
  updateProgramStatus, getProgramLinks, deleteProgramLink, getProgramStats,
} from "../../../services/programApi";
import type { ProgramLink, ProgramStats } from "../../../services/programApi";
import { useAppSelector } from "../../../store/hooks";
import ProgramForm from "./ProgramForm";
import CreateProgramLinkModal from "./CreateProgramLinkModal";

const STATUS_COLORS: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  COMPLETE: 'bg-blue-100 text-blue-700',
  MISSED:   'bg-gray-100 text-gray-600',
};

type View = 'dashboard' | 'add' | 'edit' | 'links';

export default function ProgramsPage() {
  const { t } = useTranslation();
  const { selectedAssignment, user } = useAppSelector((s) => s.auth);
  const assemblyId = selectedAssignment?.stateMasterData_id || 0;
  const currentUserId = user?.id || 0;

  const [view, setView] = useState<View>('dashboard');
  const [programs, setPrograms] = useState<ProgramListItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // 'today' or ''
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ProgramListItem | null>(null);
  const [viewProgram, setViewProgram] = useState<ProgramListItem | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [links, setLinks] = useState<ProgramLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [stats, setStats] = useState<ProgramStats | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getProgramStats({ assembly_id: assemblyId || undefined });
      if (res.success) setStats(res.data);
    } catch { /* silent */ }
  }, [assemblyId]);

  const fetchLinks = useCallback(async () => {
    setLinksLoading(true);
    try {
      const res = await getProgramLinks({ assembly_id: assemblyId || undefined });
      if (res.success) setLinks(res.data);
    } catch { toast.error('Failed to load links'); }
    finally { setLinksLoading(false); }
  }, [assemblyId]);

  const fetchPrograms = useCallback(async (page = 1, q = search, status = statusFilter, date = dateFilter) => {
    setLoading(true);
    try {
      const res = await getPrograms({
        page, limit: 20, search: q || undefined,
        sortBy: 'date', sortOrder: 'DESC',
        assembly_id: assemblyId || undefined,
      });
      if (res.success) {
        let filtered = res.data;
        if (status) filtered = filtered.filter(p => p.status === status);
        if (date === 'today') {
          const today = new Date().toISOString().slice(0, 10);
          filtered = filtered.filter(p => p.created_at?.slice(0, 10) === today);
        }
        setPrograms(filtered);
        setPagination(res.pagination);
      }
    } catch { toast.error('Failed to load programs'); }
    finally { setLoading(false); }
  }, [assemblyId]);

  useEffect(() => {
    fetchPrograms(1, '');
    fetchStats();
  }, [fetchPrograms, fetchStats]);

  useEffect(() => {
    if (view === 'links') fetchLinks();
  }, [view, fetchLinks]);

  const handleAdd = async (data: ProgramSubmitData) => {
    setSaving(true);
    try {
      const res = await createProgram({ program_name: data.program_name, isActive: data.isActive, managers: [data.manager] });
      if (res.success) {
        toast.success('Program created');
        setView('dashboard');
        fetchPrograms(1, search);
        fetchStats();
      } else { toast.error(res.message || 'Failed to create program'); }
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to create program'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (data: ProgramSubmitData) => {
    if (!editing) return;
    setSaving(true);
    try {
      // Don't update candidate_id - preserve the original
      const { candidate_id, ...managerWithoutCandidateId } = data.manager;
      const res = await updateProgram(editing.program_id, {
        program_name: data.program_name, isActive: data.isActive,
        managers: [{ id: editing.id, ...managerWithoutCandidateId }], deletedManagerIds: [],
      });
      if (res.success) {
        toast.success('Program updated');
        setEditing(null); setView('dashboard');
        fetchPrograms(pagination.page, search);
        fetchStats();
      } else { toast.error(res.message || 'Failed to update program'); }
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to update program'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (programId: number) => {
    if (!confirm('Delete this program?')) return;
    try {
      await deleteProgram(programId);
      toast.success('Program deleted');
      fetchPrograms(pagination.page, search);
      fetchStats();
    } catch { toast.error('Failed to delete program'); }
  };

  const handleUpdateProgramStatus = async (program: ProgramListItem, status: ProgramStatus) => {
    if (program.status === status) return;
    if (currentUserId !== program.candidate_id) {
      toast.error('Only the assigned candidate can approve or reject this program.');
      setOpenMenuId(null);
      return;
    }
    if (!confirm(`Change status to ${status}?`)) return;

    setLoading(true);
    try {
      const res = await updateProgramStatus(program.id, {
        status,
        candidateId: program.candidate_id,
      });

      if (res.success) {
        toast.success(res.message || `Program status updated to ${status}`);
        fetchPrograms(pagination.page, search, statusFilter, dateFilter);
        fetchStats();
      } else {
        toast.error(res.message || 'Failed to update program status');
      }
    } catch (err) {
      toast.error('Failed to update program status');
    } finally {
      setLoading(false);
      setOpenMenuId(null);
    }
  };

  const handleDeleteLink = async (linkId: number) => {
    try { await deleteProgramLink(linkId); setLinks(prev => prev.filter(l => l.id !== linkId)); toast.success('Link deleted'); }
    catch { toast.error('Failed to delete link'); }
  };

  const copyLink = (link: ProgramLink) => {
    const p = new URLSearchParams({
      link_id: String(link.id), state_id: String(link.state_id), district_id: String(link.district_id),
      assembly_id: String(link.assembly_id), candidate_id: String(link.candidate_id),
      creator_id: String(link.creator_id), party_id: String(link.party_id),
      candidate_name: (link as any).candidate ? `${(link as any).candidate.first_name} ${(link as any).candidate.last_name}`.trim() : '',
      state_name: (link as any).state?.name || '', district_name: (link as any).district?.name || '',
      assembly_name: (link as any).assembly?.name || '',
    });
    navigator.clipboard.writeText(`${window.location.origin}/program/add?${p.toString()}`);
    toast.success('Link copied!');
  };

  const handleLinkCreated = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
    setShowLinkModal(false);
    fetchLinks();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrograms(1, search, statusFilter, dateFilter);
  };

  const applyStatusFilter = (key: string) => {
    const s = key === 'total' ? '' : key.toUpperCase();
    setStatusFilter(s);
    setDateFilter('');
    fetchPrograms(1, search, s, '');
  };

  const applyTodayFilter = () => {
    const isActive = dateFilter === 'today';
    const newDate = isActive ? '' : 'today';
    setDateFilter(newDate);
    setStatusFilter('');
    fetchPrograms(1, search, '', newDate);
  };

  // ── Shared top nav ──────────────────────────────────────────────
  // NOTE: defined as JSX inline (not as inner component) to avoid focus loss on re-render
  const topNavJsx = (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
      {/* Left: tabs */}
      <div className="flex items-center gap-1 shrink-0">
        {(['dashboard', 'links'] as View[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition capitalize ${view === v ? 'bg-indigo-600 text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5'}`}>
            {v === 'dashboard' ? t("ProgramsPage.Programs") : t("ProgramsPage.Links")}
          </button>
        ))}
      </div>

      {/* Center: search — only on dashboard */}
      {view === 'dashboard' && (
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 max-w-sm mx-auto">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); if (e.target.value === '') fetchPrograms(1, '', statusFilter, dateFilter); }}
              placeholder={t("ProgramsPage.Search_Placeholder")}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-sm text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition shrink-0">
            Search
          </button>
        </form>
      )}
      {view !== 'dashboard' && <div className="flex-1" />}

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => setShowLinkModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-sm text-[var(--text-color)] hover:bg-[var(--text-color)]/5 transition">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          {t("ProgramsPage.Link")}
        </button>
        <button onClick={() => { setEditing(null); setView('add'); }}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t("ProgramsPage.Add_Program")}
        </button>
      </div>
    </div>
  );

  // ── Add / Edit form view ────────────────────────────────────────
  if (view === 'add' || view === 'edit') {
    return (
      <div className="min-h-full bg-[var(--bg-main)]">
        {topNavJsx}
        <div className="px-6 py-6">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => { setView('dashboard'); setEditing(null); }}
              className="text-[var(--text-secondary)] hover:text-[var(--text-color)] transition">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-[var(--text-color)]">
              {editing ? t("ProgramsPage.Edit_Program") : t("ProgramsPage.Add_Program")}
            </h2>
          </div>
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6">
            <ProgramForm
              initial={editing}
              onSubmit={editing ? handleEdit : handleAdd}
              onCancel={() => { setView('dashboard'); setEditing(null); }}
              loading={saving}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Links view ──────────────────────────────────────────────────
  if (view === 'links') {
    return (
      <div className="min-h-full bg-[var(--bg-main)]">
        {topNavJsx}
        <div className="px-6 py-6">
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
            {linksLoading ? (
              <div className="flex items-center justify-center h-48 text-[var(--text-secondary)] text-sm">{t("ProgramsPage.Loading")}</div>
            ) : links.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-[var(--text-secondary)] text-sm gap-3">
                <svg className="h-10 w-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t("ProgramsPage.No_Links")}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Candidate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("ProgramsPage.Assembly")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("ProgramsPage.Creator")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("ProgramsPage.Created_At")}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map(link => {
                    const candidateName = link.candidate ? `${link.candidate.first_name} ${link.candidate.last_name}`.trim() : `#${link.candidate_id}`;
                    const assemblyName = link.assembly?.name || `#${link.assembly_id}`;
                    const creatorName = link.creator ? `${link.creator.first_name} ${link.creator.last_name}`.trim() : `#${link.creator_id}`;
                    return (
                      <tr key={link.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-main)] transition">
                        <td className="px-4 py-3 font-medium text-[var(--text-color)]">{candidateName}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{assemblyName}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{creatorName}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{new Date(link.created_at || '').toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => copyLink(link)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-indigo-600 hover:border-indigo-300 transition">
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              Copy
                            </button>
                            <button onClick={() => handleDeleteLink(link.id)}
                              className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-red-600 hover:border-red-300 transition">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
        {showLinkModal && <CreateProgramLinkModal onClose={() => setShowLinkModal(false)} onLinkCreated={handleLinkCreated} />}
      </div>
    );
  }

  // ── Dashboard view (default) ────────────────────────────────────
  return (
    <div className="min-h-full bg-[var(--bg-main)]">
      {topNavJsx}

      <div className="px-6 py-5 space-y-5">

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {[
              { key: 'total',       label: t("ProgramsPage.Total"),       value: stats.total,       bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-700' },
              { key: 'today_total', label: t("ProgramsPage.Today"),       value: stats.today_total, bg: 'bg-teal-50 border-teal-100',     text: 'text-teal-700' },
              { key: 'pending',     label: t("ProgramsPage.Pending"),     value: stats.pending,     bg: 'bg-yellow-50 border-yellow-100', text: 'text-yellow-700' },
              { key: 'approved',    label: t("ProgramsPage.Approved"),    value: stats.approved,    bg: 'bg-green-50 border-green-100',   text: 'text-green-700' },
              { key: 'complete',    label: t("ProgramsPage.Complete"),    value: stats.complete,    bg: 'bg-blue-50 border-blue-100',     text: 'text-blue-700' },
              { key: 'rejected',    label: t("ProgramsPage.Rejected"),    value: stats.rejected,    bg: 'bg-red-50 border-red-100',       text: 'text-red-700' },
              { key: 'missed',      label: t("ProgramsPage.Missed"),      value: stats.missed,      bg: 'bg-gray-50 border-gray-100',     text: 'text-gray-600' },
            ].map(({ key, label, value, bg, text }) => (
              <button key={key} onClick={() => key === 'today_total' ? applyTodayFilter() : applyStatusFilter(key)}
                className={[
                  "rounded-xl border px-4 py-3 text-left transition hover:shadow-sm",
                  bg, text,
                  key === 'today_total'
                    ? (dateFilter === 'today' ? 'ring-2 ring-teal-400 ring-offset-1' : '')
                    : (statusFilter === (key === 'total' ? '' : key.toUpperCase()) ? 'ring-2 ring-indigo-400 ring-offset-1' : ''),
                ].join(" ")}>
                <div className="text-2xl font-bold leading-none">{value}</div>
                <div className="text-xs mt-1 font-medium opacity-75">{label}</div>
              </button>
            ))}
          </div>
        )}

        {/* Active filter badges */}
        {(statusFilter || dateFilter) && (
          <div className="flex items-center gap-2">
            {statusFilter && (
              <button onClick={() => applyStatusFilter('total')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 transition">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[statusFilter]}`}>{statusFilter}</span>
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
            {dateFilter === 'today' && (
              <button onClick={applyTodayFilter}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-xs text-teal-700 hover:bg-teal-100 transition">
                Today
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        )}

        {/* Programs Table */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
          <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-[var(--text-secondary)] text-sm">{t("ProgramsPage.Loading")}</div>
          ) : programs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-[var(--text-secondary)] text-sm gap-3">
              <svg className="h-10 w-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t("ProgramsPage.No_Programs")}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("ProgramsPage.Programs")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("ProgramsPage.Location")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("ProgramsPage.Date")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("ProgramsPage.Created_By")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p, idx) => (
                  <tr key={p.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-main)] transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text-color)]">{p.program_name}</div>
                      {p.assembly_name && <div className="text-xs text-[var(--text-secondary)] mt-0.5">{p.assembly_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{p.location}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">{p.date?.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {!isNaN(Number(p.created_by)) && p.created_by ? (p.user_name || p.created_by) : (p.created_by || p.user_name || '—')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || ''}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative flex justify-end" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--text-color)]/10 text-[var(--text-secondary)] transition"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </button>
                        {openMenuId === p.id && (
                          <div
                            className="absolute right-0 z-50 w-36 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-lg py-1 text-sm"
                            style={idx < 2 ? { top: 'calc(100% + 4px)' } : { bottom: 'calc(100% + 4px)' }}
                          >
                            <button
                              onClick={() => { setViewProgram(p); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-[var(--text-color)] hover:bg-[var(--text-color)]/5 transition"
                            >
                              <svg className="h-4 w-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                              </svg>
                              View
                            </button>
                            {currentUserId === p.candidate_id && (
                              <>
                                {p.status !== 'APPROVED' && (
                                  <button
                                    onClick={() => handleUpdateProgramStatus(p, 'APPROVED')}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-green-600 hover:bg-green-50 transition"
                                  >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                      <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                    Approve
                                  </button>
                                )}
                                {p.status !== 'REJECTED' && (
                                  <button
                                    onClick={() => handleUpdateProgramStatus(p, 'REJECTED')}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 transition"
                                  >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                      <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                    Reject
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => { setEditing(p); setView('edit'); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-[var(--text-color)] hover:bg-[var(--text-color)]/5 transition"
                            >
                              <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              {t("ProgramsPage.Edit")}
                            </button>
                            <button
                              onClick={() => { handleDelete(p.program_id); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 transition"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                              </svg>
                              {t("ProgramsPage.Delete")}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
            <span>Page {pagination.page} / {pagination.totalPages} · {pagination.total} total</span>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1} onClick={() => fetchPrograms(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] disabled:opacity-40 hover:bg-[var(--text-color)]/5 transition">←</button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchPrograms(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] disabled:opacity-40 hover:bg-[var(--text-color)]/5 transition">→</button>
            </div>
          </div>
        )}
      </div>

      {showLinkModal && <CreateProgramLinkModal onClose={() => setShowLinkModal(false)} onLinkCreated={handleLinkCreated} />}

      {/* View Detail Modal */}
      {viewProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setViewProgram(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-color)]">{viewProgram.program_name}</h2>
                <span className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[viewProgram.status] || ''}`}>
                  {viewProgram.status}
                </span>
              </div>
              <button onClick={() => setViewProgram(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-color)] transition mt-1">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Modal Body */}
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: t("ProgramsPage.Location"), value: viewProgram.location },
                  { label: t("ProgramsPage.Date"), value: viewProgram.date?.slice(0, 10) },
                  { label: t("ProgramsPage.Time"), value: viewProgram.time?.slice(0, 5) },
                  { label: t("ProgramsPage.State"), value: viewProgram.state_name },
                  { label: t("ProgramsPage.District"), value: viewProgram.district_name },
                  { label: t("ProgramsPage.Assembly"), value: viewProgram.assembly_name },
                  {
                    label: t("ProgramsPage.Created_By"),
                    value: !isNaN(Number(viewProgram.created_by)) && viewProgram.created_by
                      ? (viewProgram.user_name || viewProgram.created_by)
                      : (viewProgram.created_by || viewProgram.user_name || '—')
                  },
                  ...(viewProgram.creator_phone_no ? [{ label: t("ProgramsPage.Phone"), value: viewProgram.creator_phone_no }] : []),
                  { label: t("ProgramsPage.Active"), value: viewProgram.isActive ? t("ProgramsPage.Yes") : t("ProgramsPage.No") },
                  { label: t("ProgramsPage.Created_At"), value: new Date(viewProgram.created_at).toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2.5">
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold mb-0.5">{label}</p>
                    <p className="text-sm text-[var(--text-color)] font-medium">{value || '—'}</p>
                  </div>
                ))}
              </div>
              {viewProgram.description && (
                <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2.5">
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold mb-1">{t("ProgramsPage.Description")}</p>
                  <p className="text-sm text-[var(--text-color)] whitespace-pre-wrap">{viewProgram.description}</p>
                </div>
              )}
            </div>
            {/* Modal Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[var(--border-color)]">
              <button onClick={() => { setEditing(viewProgram); setViewProgram(null); setView('edit'); }}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition">
                {t("ProgramsPage.Edit")}
              </button>
              <button onClick={() => setViewProgram(null)}
                className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close menu on outside click */}
      {openMenuId !== null && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}
    </div>
  );
}
