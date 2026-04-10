import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { boothAgentApi } from "../services/boothAgentApi";
import { useTranslation } from "react-i18next";

interface DocSummary {
  total_agents: number;
  documents: {
    photo: { completed: number; pending: number };
    aadhar_card: { completed: number; pending: number };
    voter_id_file: { completed: number; pending: number };
  };
  overall: { all_documents_completed: number; documents_pending: number };
}

const TEAMS = [
  { label: "Booth Inside Team",           slug: "inside",          pendingLink: "/assembly/booth-management/inside?docStatus=pending",          completeLink: "/assembly/booth-management/inside?docStatus=complete",          color: "blue" },
  { label: "Booth Outside Team",          slug: "outside",         pendingLink: "/assembly/booth-management/outside?docStatus=pending",         completeLink: "/assembly/booth-management/outside?docStatus=complete",         color: "emerald" },
  { label: "Polling Center Support Team", slug: "polling-support", pendingLink: "/assembly/booth-management/polling-support?docStatus=pending", completeLink: "/assembly/booth-management/polling-support?docStatus=complete", color: "violet" },
];

const colorMap: Record<string, { tab: string; card: string; badge: string }> = {
  blue:    { tab: "bg-blue-500 text-white",    card: "border-blue-200 dark:border-blue-500/30 hover:bg-blue-500/5",    badge: "bg-blue-100 text-blue-700" },
  emerald: { tab: "bg-emerald-500 text-white", card: "border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-500/5", badge: "bg-emerald-100 text-emerald-700" },
  violet:  { tab: "bg-violet-500 text-white",  card: "border-violet-200 dark:border-violet-500/30 hover:bg-violet-500/5",  badge: "bg-violet-100 text-violet-700" },
};

const DocTeamTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"pending" | "complete">("pending");

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-color)] flex items-center gap-2">
          <span className={`w-1 h-4 rounded-full ${activeTab === "pending" ? "bg-red-400" : "bg-green-400"}`} />
          Document Status by Team
        </h3>
        <div className="flex bg-[var(--bg-main)] p-0.5 rounded-lg border border-[var(--border-color)] ml-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${activeTab === "pending" ? "bg-red-500 text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-color)]"}`}
          >
            ⏳ Pending
          </button>
          <button
            onClick={() => setActiveTab("complete")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${activeTab === "complete" ? "bg-green-500 text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-color)]"}`}
          >
            ✅ Complete
          </button>
        </div>
      </div>

      {/* Team cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TEAMS.map((team) => {
          const c = colorMap[team.color];
          const link = activeTab === "pending" ? team.pendingLink : team.completeLink;
          return (
            <Link
              key={team.slug}
              to={link}
              className={`flex items-center justify-between p-3.5 rounded-xl border-2 ${c.card} transition-all no-underline group`}
            >
              <div>
                <p className="text-xs font-semibold text-[var(--text-color)] group-hover:text-indigo-600 transition-colors">{team.label}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  View {activeTab === "pending" ? "pending" : "completed"} docs
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "pending" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                  {activeTab === "pending" ? "Pending" : "Complete"}
                </span>
                <svg className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export const BoothManagementDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    total: 0, boothInside: 0, boothOutside: 0,
    pollingSupport: 0, active: 0, inactive: 0,
  });
  const [docSummary, setDocSummary] = useState<DocSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedAssignment = useSelector((state: RootState) => state.auth.selectedAssignment);
  const user = useSelector((state: RootState) => state.auth.user);

  const assemblyId =
    selectedAssignment?.levelType === "Assembly"
      ? selectedAssignment?.stateMasterData_id
      : selectedAssignment?.parentAssemblyId;

  const partyId = user?.partyId;

  const hasFetched = React.useRef(false);

  useEffect(() => {
    if (assemblyId && partyId && !hasFetched.current) {
      hasFetched.current = true;
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assemblyId, partyId]);

  const fetchDashboardData = async () => {
    if (!assemblyId || !partyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [statsRes, docRes] = await Promise.all([
        boothAgentApi.getStats(assemblyId, partyId),
        boothAgentApi.getDocumentStatus(assemblyId, partyId, { limit: 1 }),
      ]);
      setStats({
        total: statsRes.total_agents,
        boothInside: statsRes.booth_inside_team,
        boothOutside: statsRes.booth_outside_team,
        pollingSupport: statsRes.polling_support_team,
        active: statsRes.active_agents,
        inactive: statsRes.inactive_agents,
      });
      setDocSummary(docRes.summary);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, gradient, icon, link }: {
    title: string; value: number; gradient: string; icon: string; link: string;
  }) => (
    <Link to={link} className={`block p-5 rounded-xl ${gradient} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 no-underline`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-white/70 text-xs font-medium uppercase tracking-wide">{title}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </Link>
  );

  if (!assemblyId || !partyId) {
    return (
      <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-6 text-center text-red-500">
        {!assemblyId ? "No assembly selected." : "Party information not found."}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
        {t("Booth_Management_Dash.Loading_dashboard")}
      </div>
    );
  }

  const teams = [
    { label: "Booth Inside Team", value: stats.boothInside, bar: "from-blue-500 to-cyan-400", dot: "bg-blue-500", link: "/assembly/booth-management/inside" },
    { label: "Booth Outside Team", value: stats.boothOutside, bar: "from-emerald-500 to-teal-400", dot: "bg-emerald-500", link: "/assembly/booth-management/outside" },
    { label: "Polling Support Team", value: stats.pollingSupport, bar: "from-violet-500 to-purple-400", dot: "bg-violet-500", link: "/assembly/booth-management/polling-support" },
  ];

  const docTypes = docSummary ? [
    { label: "Photo", key: "photo" as const, icon: "🖼️", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/30" },
    { label: "Aadhar Card", key: "aadhar_card" as const, icon: "🪪", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/30" },
    { label: "Voter ID", key: "voter_id_file" as const, icon: "🗳️", color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/30" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-color)]">{t("Booth_Management_Dash.Booth_Management_Dashboard")}</h1>
        <Link to="/assembly/booth-management/agents" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition">
          {t("Booth_Management_Dash.View_All_Agents")}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Team Count" value={stats.total} gradient="bg-gradient-to-br from-indigo-500 to-indigo-700" icon="👥" link="/assembly/booth-management/agents" />
        <StatCard title="Booth Inside Team" value={stats.boothInside} gradient="bg-gradient-to-br from-blue-500 to-cyan-600" icon="🏠" link="/assembly/booth-management/inside" />
        <StatCard title="Booth Outside Team" value={stats.boothOutside} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" icon="🌿" link="/assembly/booth-management/outside" />
        <StatCard title="PC Support Team" value={stats.pollingSupport} gradient="bg-gradient-to-br from-violet-500 to-purple-700" icon="🏛️" link="/assembly/booth-management/polling-support" />
      </div>

      {/* Document Status Section */}
      {docSummary && (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm">
          {/* Section header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-color)] flex items-center gap-2">
                <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block" />
                Document Status
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                Track photo, Aadhar & Voter ID upload status across all agents
              </p>
            </div>
            {/* Overall summary pills */}
            <div className="flex items-center gap-3">
              <Link
                to="/assembly/booth-management/agents?pendingDocs=1"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-full text-xs font-semibold text-red-600 hover:bg-red-500/20 transition no-underline"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {docSummary.overall.documents_pending} Pending
              </Link>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-full text-xs font-semibold text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {docSummary.overall.all_documents_completed} Complete
              </span>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1.5">
              <span>Overall Completion</span>
              <span className="font-semibold text-[var(--text-color)]">
                {docSummary.total_agents > 0
                  ? Math.round((docSummary.overall.all_documents_completed / docSummary.total_agents) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-[var(--bg-main)] rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700"
                style={{
                  width: docSummary.total_agents > 0
                    ? `${(docSummary.overall.all_documents_completed / docSummary.total_agents) * 100}%`
                    : "0%"
                }}
              />
            </div>
          </div>

          {/* Per-document cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {docTypes.map((doc) => {
              const d = docSummary.documents[doc.key];
              const pct = (d.completed + d.pending) > 0
                ? Math.round((d.completed / (d.completed + d.pending)) * 100) : 0;
              return (
                <div key={doc.key} className={`rounded-xl border ${doc.border} ${doc.bg} p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{doc.icon}</span>
                      <span className={`text-sm font-semibold ${doc.color}`}>{doc.label}</span>
                    </div>
                    <span className={`text-xs font-bold ${doc.color}`}>{pct}%</span>
                  </div>
                  <div className="w-full bg-white/30 dark:bg-black/20 rounded-full h-2 mb-3 overflow-hidden">
                    <div
                      className={`h-2 rounded-full bg-current ${doc.color} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 font-medium">✓ {d.completed} done</span>
                    <span className="text-red-500 font-medium">⏳ {d.pending} pending</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Per-team doc status — Pending / Complete tabs */}
          <DocTeamTabs />
        </div>
      )}

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-color)] mb-1">
            Category Breakdown <span className="text-indigo-500 font-bold">({stats.total})</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-5">Distribution across teams</p>
          <div className="space-y-4">
            {teams.map((item) => (
              <Link key={item.label} to={item.link} className="block group no-underline">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                    <span className="text-sm font-medium text-[var(--text-color)] group-hover:text-indigo-500 transition-colors">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text-color)]">
                      {item.value}<span className="text-[var(--text-secondary)] font-normal">/{stats.total}</span>
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      ({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-[var(--bg-hover)] rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`bg-gradient-to-r ${item.bar} h-2.5 rounded-full transition-all duration-700`}
                    style={{ width: stats.total > 0 ? `${(item.value / stats.total) * 100}%` : "0%" }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-color)] mb-1">Team Graph</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Total <span className="text-[var(--text-color)] font-bold">{stats.total}</span> agents across 3 teams
          </p>
          {stats.total === 0 ? (
            <div className="flex items-center justify-center h-32 text-[var(--text-secondary)] text-sm">No data yet</div>
          ) : (() => {
            const pieTeams = [
              { label: "Inside", value: stats.boothInside, color: "#60a5fa" },
              { label: "Outside", value: stats.boothOutside, color: "#34d399" },
              { label: "Support", value: stats.pollingSupport, color: "#a78bfa" },
            ];
            const total = stats.total || 1;
            const cx = 60, cy = 60, r = 50;
            let cumAngle = -Math.PI / 2;
            const slices = pieTeams.map((t) => {
              const angle = (t.value / total) * 2 * Math.PI;
              const x1 = cx + r * Math.cos(cumAngle);
              const y1 = cy + r * Math.sin(cumAngle);
              cumAngle += angle;
              const x2 = cx + r * Math.cos(cumAngle);
              const y2 = cy + r * Math.sin(cumAngle);
              return { ...t, d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${angle > Math.PI ? 1 : 0},1 ${x2},${y2} Z` };
            });
            return (
              <div className="flex items-center gap-6">
                <svg width="120" height="120" viewBox="0 0 120 120" className="flex-shrink-0">
                  {slices.map((s) => s.value > 0 && <path key={s.label} d={s.d} fill={s.color} opacity="0.9" />)}
                  <circle cx={cx} cy={cy} r="28" fill="var(--bg-card)" />
                  <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-color)" fontSize="14" fontWeight="bold">{stats.total}</text>
                  <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-secondary)" fontSize="8">total</text>
                </svg>
                <div className="space-y-2.5 flex-1">
                  {pieTeams.map((t) => (
                    <div key={t.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                        <span className="text-xs text-[var(--text-secondary)]">{t.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-[var(--text-color)]">{t.value}</span>
                        <span className="text-xs text-[var(--text-secondary)]">({total > 0 ? Math.round((t.value / total) * 100) : 0}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
