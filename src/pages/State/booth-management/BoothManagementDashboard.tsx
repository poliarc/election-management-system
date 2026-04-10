import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { boothAgentApi } from "../../../modules/assembly/booth-management/services/boothAgentApi";

interface Stats {
  total: number;
  boothInside: number;
  boothOutside: number;
  pollingSupport: number;
  active: number;
  inactive: number;
}

interface DocSummary {
  total_agents: number;
  documents: {
    photo: { completed: number; pending: number };
    aadhar_card: { completed: number; pending: number };
    voter_id_file: { completed: number; pending: number };
  };
  overall: { all_documents_completed: number; documents_pending: number };
}

const StatCard = ({
  title, value, gradient, icon,
}: {
  title: string; value: number; gradient: string; icon: string;
}) => (
  <div className={`p-5 rounded-xl ${gradient}`}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-white/70 text-xs font-medium uppercase tracking-wide">{title}</span>
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
  </div>
);

const StateBoothManagementDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    total: 0, boothInside: 0, boothOutside: 0,
    pollingSupport: 0, active: 0, inactive: 0,
  });
  const [docSummary, setDocSummary] = useState<DocSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedAssignment = useSelector((state: RootState) => state.auth.selectedAssignment);
  const user = useSelector((state: RootState) => state.auth.user);

  const stateId = selectedAssignment?.stateMasterData_id || 0;
  const partyId = user?.partyId || 0;

  const hasFetched = React.useRef(false);

  useEffect(() => {
    if (stateId && partyId && !hasFetched.current) {
      hasFetched.current = true;
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateId, partyId]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, docRes] = await Promise.all([
        boothAgentApi.getStateStats(stateId, partyId),
        boothAgentApi.getStateDocumentStatus(stateId, partyId),
      ]);
      setStats({
        total: statsRes.stats.total_agents,
        boothInside: statsRes.stats.booth_inside_team,
        boothOutside: statsRes.stats.booth_outside_team,
        pollingSupport: statsRes.stats.polling_support_team,
        active: statsRes.stats.active_agents,
        inactive: statsRes.stats.inactive_agents,
      });
      setDocSummary(docRes.summary);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  if (!stateId || !partyId) {
    return (
      <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-6 text-center text-red-500">
        State or party information not found. Please login again.
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-6 text-center text-red-500">{error}</div>;
  }

  const teams = [
    { label: "Booth Inside Team", value: stats.boothInside, color: "#60a5fa", dot: "bg-blue-500", bar: "from-blue-500 to-cyan-400" },
    { label: "Booth Outside Team", value: stats.boothOutside, color: "#34d399", dot: "bg-emerald-500", bar: "from-emerald-500 to-teal-400" },
    { label: "Polling Support Team", value: stats.pollingSupport, color: "#a78bfa", dot: "bg-violet-500", bar: "from-violet-500 to-purple-400" },
  ];

  const docTypes = docSummary ? [
    { label: "Photo", key: "photo" as const, icon: "🖼️", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/30" },
    { label: "Aadhar Card", key: "aadhar_card" as const, icon: "🪪", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/30" },
    { label: "Voter ID", key: "voter_id_file" as const, icon: "🗳️", color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/30" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-color)]">Booth Management Dashboard</h1>
        <span className="text-sm text-[var(--text-secondary)]">State Level</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Agents" value={stats.total} gradient="bg-gradient-to-br from-indigo-500 to-indigo-700" icon="👥" />
        <StatCard title="Booth Inside Team" value={stats.boothInside} gradient="bg-gradient-to-br from-blue-500 to-cyan-600" icon="🏠" />
        <StatCard title="Booth Outside Team" value={stats.boothOutside} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" icon="🌿" />
        <StatCard title="PC Support Team" value={stats.pollingSupport} gradient="bg-gradient-to-br from-violet-500 to-purple-700" icon="🏛️" />
      </div>

      {/* Active / Inactive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl">✅</div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-color)]">{stats.active}</p>
            <p className="text-sm text-[var(--text-secondary)]">Active Agents</p>
          </div>
        </div>
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xl">❌</div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-color)]">{stats.inactive}</p>
            <p className="text-sm text-[var(--text-secondary)]">Inactive Agents</p>
          </div>
        </div>
      </div>

      {/* Document Status Section */}
      {docSummary && (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-color)] flex items-center gap-2">
                <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block" />
                Document Status
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">Photo, Aadhar & Voter ID upload status</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-full text-xs font-semibold text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {docSummary.overall.documents_pending} Pending
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-full text-xs font-semibold text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {docSummary.overall.all_documents_completed} Complete
              </span>
            </div>
          </div>

          {/* Overall progress */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1.5">
              <span>Overall Completion</span>
              <span className="font-semibold text-[var(--text-color)]">
                {docSummary.total_agents > 0 ? Math.round((docSummary.overall.all_documents_completed / docSummary.total_agents) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-[var(--bg-main)] rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700"
                style={{ width: docSummary.total_agents > 0 ? `${(docSummary.overall.all_documents_completed / docSummary.total_agents) * 100}%` : "0%" }}
              />
            </div>
          </div>

          {/* Per-doc cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {docTypes.map((doc) => {
              const d = docSummary.documents[doc.key];
              const total = d.completed + d.pending;
              const pct = total > 0 ? Math.round((d.completed / total) * 100) : 0;
              return (
                <div key={doc.key} className={`rounded-xl border ${doc.border} ${doc.bg} p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{doc.icon}</span>
                      <span className={`text-sm font-semibold ${doc.color}`}>{doc.label}</span>
                    </div>
                    <span className={`text-xs font-bold ${doc.color}`}>{pct}%</span>
                  </div>
                  <div className="w-full bg-white/30 dark:bg-black/20 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className={`h-1.5 rounded-full bg-current ${doc.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 font-medium">✓ {d.completed}</span>
                    <span className="text-red-500 font-medium">⏳ {d.pending}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Breakdown + Pie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-color)] mb-1">
            Category Breakdown <span className="text-indigo-500 font-bold">({stats.total})</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-5">Distribution across teams</p>
          <div className="space-y-4">
            {teams.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                    <span className="text-sm font-medium text-[var(--text-color)]">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text-color)]">{item.value}<span className="text-[var(--text-secondary)] font-normal">/{stats.total}</span></span>
                    <span className="text-xs text-[var(--text-secondary)]">({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)</span>
                  </div>
                </div>
                <div className="w-full bg-[var(--bg-hover)] rounded-full h-2.5 overflow-hidden">
                  <div className={`bg-gradient-to-r ${item.bar} h-2.5 rounded-full transition-all duration-700`} style={{ width: stats.total > 0 ? `${(item.value / stats.total) * 100}%` : "0%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-color)] mb-1">Team Graph</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">Total <span className="text-[var(--text-color)] font-bold">{stats.total}</span> agents across 3 teams</p>
          {stats.total === 0 ? (
            <div className="flex items-center justify-center h-32 text-[var(--text-secondary)] text-sm">No data yet</div>
          ) : (() => {
            const cx = 60, cy = 60, r = 50;
            let cumAngle = -Math.PI / 2;
            const slices = teams.map((t) => {
              const angle = (t.value / (stats.total || 1)) * 2 * Math.PI;
              const x1 = cx + r * Math.cos(cumAngle); const y1 = cy + r * Math.sin(cumAngle);
              cumAngle += angle;
              const x2 = cx + r * Math.cos(cumAngle); const y2 = cy + r * Math.sin(cumAngle);
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
                  {teams.map((t) => (
                    <div key={t.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                        <span className="text-xs text-[var(--text-secondary)]">{t.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-[var(--text-color)]">{t.value}</span>
                        <span className="text-xs text-[var(--text-secondary)]">({stats.total > 0 ? Math.round((t.value / stats.total) * 100) : 0}%)</span>
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

export default StateBoothManagementDashboard;
