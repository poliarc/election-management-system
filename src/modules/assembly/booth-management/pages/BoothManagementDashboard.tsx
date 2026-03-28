import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { boothAgentApi } from "../services/boothAgentApi";
import { useTranslation } from "react-i18next";

export const BoothManagementDashboard: React.FC = () => {
  const {t} = useTranslation();
  const [stats, setStats] = useState({
    total: 0,
    boothInside: 0,
    boothOutside: 0,
    pollingSupport: 0,
    active: 0,
    inactive: 0,
  });
  const [loading, setLoading] = useState(true);

  // Get assembly ID from Redux store
  const selectedAssignment = useSelector(
    (state: RootState) => state.auth.selectedAssignment
  );
  
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Get assembly ID based on level type
  // For Assembly level: use stateMasterData_id directly
  // For levels below Assembly: use parentAssemblyId
  const assemblyId =
    selectedAssignment?.levelType === "Assembly"
      ? selectedAssignment?.stateMasterData_id
      : selectedAssignment?.parentAssemblyId;

  // Get party ID from user
  const partyId = user?.partyId;

  useEffect(() => {
    if (assemblyId && partyId) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assemblyId, partyId]);

  const fetchDashboardData = async () => {
    if (!assemblyId || !partyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const statsRes = await boothAgentApi.getStats(assemblyId, partyId);
      setStats({
        total: statsRes.total_agents,
        boothInside: statsRes.booth_inside_team,
        boothOutside: statsRes.booth_outside_team,
        pollingSupport: statsRes.polling_support_team,
        active: statsRes.active_agents,
        inactive: statsRes.inactive_agents,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    gradient,
    icon,
    link,
    subtitle,
  }: {
    title: string;
    value: number;
    gradient: string;
    icon: string;
    link: string;
    subtitle?: string;
  }) => (
    <Link
      to={link}
      className={`block p-5 rounded-xl ${gradient} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 no-underline [text-decoration:none] hover:[text-decoration:none]`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-white/70 text-xs font-medium uppercase tracking-wide">{title}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-white/60 text-xs mt-1">{subtitle}</p>}
    </Link>
  );

  if (!assemblyId || !partyId) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center text-red-600">
          {!assemblyId
            ? "No assembly selected. Please select an assembly first."
            : "Party information not found. Please login again."}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--text-secondary)]">{t("Booth_Management_Dash.Loading_dashboard")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("Booth_Management_Dash.Booth_Management_Dashboard")}</h1>
        <Link
          to="/assembly/booth-management/agents"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          {t("Booth_Management_Dash.View_All_Agents")}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Team Count" value={stats.total}
          gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
          icon="👥" link="/assembly/booth-management/agents" />
        <StatCard title="Booth Inside Team" value={stats.boothInside}
          gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
          icon="🏠" link="/assembly/booth-management/inside" />
        <StatCard title="Booth Outside Team" value={stats.boothOutside}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          icon="🌿" link="/assembly/booth-management/outside" />
        <StatCard title="PC Support Team" value={stats.pollingSupport}
          gradient="bg-gradient-to-br from-violet-500 to-purple-700"
          icon="🏛️" link="/assembly/booth-management/polling-support" />
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Category Breakdown */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-color)] mb-1">Category Breakdown <span className="text-indigo-500 font-bold">({stats.total})</span></h2>
          <p className="text-sm text-[var(--text-secondary)] mb-5">Distribution across teams</p>
          <div className="space-y-4">
            {[
              { label: "Booth Inside Team", value: stats.boothInside, bar: "from-blue-500 to-cyan-400", dot: "bg-blue-500", link: "/assembly/booth-management/inside" },
              { label: "Booth Outside Team", value: stats.boothOutside, bar: "from-emerald-500 to-teal-400", dot: "bg-emerald-500", link: "/assembly/booth-management/outside" },
              { label: "Polling Support Team", value: stats.pollingSupport, bar: "from-violet-500 to-purple-400", dot: "bg-violet-500", link: "/assembly/booth-management/polling-support" },
            ].map((item) => (
              <Link key={item.label} to={item.link} className="block group no-underline">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                    <span className="text-sm font-medium text-[var(--text-color)] group-hover:text-indigo-500 transition-colors">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text-color)]">{item.value}<span className="text-[var(--text-secondary)] font-normal">/{stats.total}</span></span>
                    <span className="text-xs text-[var(--text-secondary)]">({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)</span>
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

        {/* Team Strength - Pie Chart */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-color)] mb-1">Team Graph</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">Total <span className="text-[var(--text-color)] font-bold">{stats.total}</span> agents across 3 teams</p>
          {stats.total === 0 ? (
            <div className="flex items-center justify-center h-32 text-[var(--text-secondary)] text-sm">No data yet</div>
          ) : (() => {
            const teams = [
              { label: "Inside", value: stats.boothInside, color: "#60a5fa" },
              { label: "Outside", value: stats.boothOutside, color: "#34d399" },
              { label: "Support", value: stats.pollingSupport, color: "#a78bfa" },
            ];
            const total = stats.total || 1;
            const cx = 60, cy = 60, r = 50;
            let cumAngle = -Math.PI / 2;
            const slices = teams.map((t) => {
              const angle = (t.value / total) * 2 * Math.PI;
              const x1 = cx + r * Math.cos(cumAngle);
              const y1 = cy + r * Math.sin(cumAngle);
              cumAngle += angle;
              const x2 = cx + r * Math.cos(cumAngle);
              const y2 = cy + r * Math.sin(cumAngle);
              const large = angle > Math.PI ? 1 : 0;
              return { ...t, d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, angle };
            });
            return (
              <div className="flex items-center gap-6">
                <svg width="120" height="120" viewBox="0 0 120 120" className="flex-shrink-0">
                  {slices.map((s) => s.value > 0 && (
                    <path key={s.label} d={s.d} fill={s.color} opacity="0.9" />
                  ))}
                  <circle cx={cx} cy={cy} r="28" fill="var(--bg-card)" />
                  <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-color)" fontSize="14" fontWeight="bold">{stats.total}</text>
                  <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-secondary)" fontSize="8">total</text>
                </svg>
                <div className="space-y-2.5 flex-1">
                  {teams.map((t) => (
                    <div key={t.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                        <span className="text-xs text-slate-300">{t.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold">{t.value}</span>
                        <span className="text-xs text-slate-500">({total > 0 ? Math.round((t.value / total) * 100) : 0}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        
      </div>

      {/* Quick Links */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/assembly/booth-management/inside"
          className="p-6 border-2 border-blue-200 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-lg mb-2">{t("Booth_Management_Dash.Booth_Inside_Team")}</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("Booth_Management_Dash.Desc")}
          </p>
        </Link>
        <Link
          to="/assembly/booth-management/outside"
          className="p-6 border-2 border-green-200 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-lg mb-2">{t("Booth_Management_Dash.Desc1")}</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("Booth_Management_Dash.Desc2")}
          </p>
        </Link>
        <Link
          to="/assembly/booth-management/polling-support"
          className="p-6 border-2 border-purple-200 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-lg mb-2">{t("Booth_Management_Dash.Desc3")}</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("Booth_Management_Dash.Desc4")}
          </p>
        </Link>
      </div> */}
    </div>
  );
};


