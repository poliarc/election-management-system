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
    color,
    link,
  }: {
    title: string;
    value: number;
    color: string;
    link: string;
  }) => (
    <Link
      to={link}
      className={`block p-6 rounded-lg border-2 ${color} hover:shadow-lg transition-shadow`}
    >
      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-[var(--text-secondary)]">
        <StatCard
          title="Total Agents"
          value={stats.total}
          color="border-indigo-200 bg-indigo-50 "
          link="/assembly/booth-management/agents"
        />
        <StatCard
          title="Booth Inside Team"
          value={stats.boothInside}
          color="border-blue-200 bg-blue-50"
          link="/assembly/booth-management/inside"
        />
        <StatCard
          title="Booth Outside Team"
          value={stats.boothOutside}
          color="border-green-200 bg-green-50"
          link="/assembly/booth-management/outside"
        />
        <StatCard
          title="Polling Support"
          value={stats.pollingSupport}
          color="border-purple-200 bg-purple-50"
          link="/assembly/booth-management/polling-support"
        />
        <StatCard
          title="Active"
          value={stats.active}
          color="border-emerald-200 bg-emerald-50"
          link="/assembly/booth-management/agents?status=1"
        />
        <StatCard
          title="Inactive"
          value={stats.inactive}
          color="border-red-200 bg-red-50"
          link="/assembly/booth-management/agents?status=0"
        />
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Active vs Inactive */}
        <div className="bg-[var(--bg-color)] rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Agent Status Overview</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-600 font-medium">Active</span>
                <span className="font-semibold">{stats.active} / {stats.total}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: stats.total > 0 ? `${(stats.active / stats.total) * 100}%` : "0%" }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-500 font-medium">Inactive</span>
                <span className="font-semibold">{stats.inactive} / {stats.total}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-red-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: stats.total > 0 ? `${(stats.inactive / stats.total) * 100}%` : "0%" }}
                />
              </div>
            </div>
            <div className="pt-2 flex items-center justify-center gap-6 text-sm text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />Active {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" />Inactive {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-[var(--bg-color)] rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Category Breakdown</h2>
          <div className="space-y-4">
            {[
              { label: "Booth Inside Team", value: stats.boothInside, color: "bg-blue-500", link: "/assembly/booth-management/inside" },
              { label: "Booth Outside Team", value: stats.boothOutside, color: "bg-green-500", link: "/assembly/booth-management/outside" },
              { label: "Polling Support Team", value: stats.pollingSupport, color: "bg-purple-500", link: "/assembly/booth-management/polling-support" },
            ].map((item) => (
              <Link key={item.label} to={item.link} className="block group">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-secondary)] group-hover:text-indigo-600 transition-colors">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`${item.color} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: stats.total > 0 ? `${(item.value / stats.total) * 100}%` : "0%" }}
                  />
                </div>
              </Link>
            ))}
          </div>
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



