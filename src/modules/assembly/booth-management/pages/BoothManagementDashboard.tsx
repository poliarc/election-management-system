import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { boothAgentApi } from "../services/boothAgentApi";
import type { BoothAgent } from "../types";

export const BoothManagementDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    total: 0,
    boothInside: 0,
    boothOutside: 0,
    pollingSupport: 0,
    active: 0,
    inactive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentAgents, setRecentAgents] = useState<BoothAgent[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [allRes, insideRes, outsideRes, supportRes] = await Promise.all([
        boothAgentApi.getAllAgents({
          limit: 5,
          sort_by: "created_at",
          order: "desc",
        }),
        boothAgentApi.getAgentsByCategory("Booth Inside Team", { limit: 1 }),
        boothAgentApi.getAgentsByCategory("Booth Outside Team", { limit: 1 }),
        boothAgentApi.getAgentsByCategory("Polling Center Support Team", {
          limit: 1,
        }),
      ]);

      setRecentAgents(allRes.data);

      const total = allRes.pagination?.total || 0;
      const boothInside = insideRes.pagination?.total || 0;
      const boothOutside = outsideRes.pagination?.total || 0;
      const pollingSupport = supportRes.pagination?.total || 0;

      // Calculate active/inactive from all agents
      const activeRes = await boothAgentApi.getAllAgents({
        status: "1",
        limit: 1,
      });
      const active = activeRes.pagination?.total || 0;

      setStats({
        total,
        boothInside,
        boothOutside,
        pollingSupport,
        active,
        inactive: total - active,
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
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Booth Management Dashboard</h1>
        <Link
          to="/assembly/booth-management/agents"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          View All Agents
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Agents"
          value={stats.total}
          color="border-indigo-200 bg-indigo-50"
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

      {/* Recent Agents */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Agents</h2>
        {recentAgents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No agents found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentAgents.map((agent) => (
                  <tr key={agent.agent_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{agent.name}</td>
                    <td className="px-4 py-3 text-sm">{agent.category}</td>
                    <td className="px-4 py-3 text-sm">{agent.role}</td>
                    <td className="px-4 py-3 text-sm">{agent.phone}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          agent.status === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {agent.status === 1 ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/assembly/booth-management/inside"
          className="p-6 border-2 border-blue-200 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-lg mb-2">Booth Inside Team</h3>
          <p className="text-sm text-gray-600">
            Manage Booth Agents and Table Coordinators
          </p>
        </Link>
        <Link
          to="/assembly/booth-management/outside"
          className="p-6 border-2 border-green-200 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-lg mb-2">Booth Outside Team</h3>
          <p className="text-sm text-gray-600">
            Manage Voter Field Coordination
          </p>
        </Link>
        <Link
          to="/assembly/booth-management/polling-support"
          className="p-6 border-2 border-purple-200 rounded-lg hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-lg mb-2">Polling Center Support</h3>
          <p className="text-sm text-gray-600">
            Manage Polling Center, Water & Food Incharge
          </p>
        </Link>
      </div>
    </div>
  );
};
