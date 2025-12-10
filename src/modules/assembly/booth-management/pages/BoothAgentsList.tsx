import React, { useEffect, useState } from "react";
import { boothAgentApi } from "../services/boothAgentApi";
import type { BoothAgent, BoothAgentCategory } from "../types";
import { BoothAgentForm } from "../components/BoothAgentForm";

interface BoothAgentsListProps {
  category?: BoothAgentCategory;
  title: string;
}

export const BoothAgentsList: React.FC<BoothAgentsListProps> = ({
  category,
  title,
}) => {
  const [agents, setAgents] = useState<BoothAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<BoothAgent | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search, statusFilter, page]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: search || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      };

      const response = category
        ? await boothAgentApi.getAgentsByCategory(category, params)
        : await boothAgentApi.getAllAgents(params);

      setAgents(response.data);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;

    try {
      await boothAgentApi.deleteAgent(id);
      fetchAgents();
    } catch (error) {
      console.error("Failed to delete agent:", error);
      alert("Failed to delete agent");
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: number) => {
    try {
      await boothAgentApi.toggleStatus(id, currentStatus === 1 ? 0 : 1);
      fetchAgents();
    } catch (error) {
      console.error("Failed to toggle status:", error);
      alert("Failed to toggle status");
    }
  };

  const handleEdit = (agent: BoothAgent) => {
    console.log("🔧 Editing agent:", agent);
    console.log("🔧 Agent polling_center_id:", agent.polling_center_id);
    console.log("🔧 Agent booth_id:", agent.booth_id);
    setEditingAgent(agent);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAgent(null);
    fetchAgents();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAgent(null);
  };

  if (showForm) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-6">
          {editingAgent ? "Edit Agent" : "Add New Agent"}
        </h2>
        <BoothAgentForm
          initialData={
            editingAgent
              ? {
                  agent_id: editingAgent.agent_id,
                  category: editingAgent.category,
                  role: editingAgent.role,
                  name: editingAgent.name,
                  father_name: editingAgent.father_name,
                  phone: editingAgent.phone,
                  alternate_no: editingAgent.alternate_no,
                  email: editingAgent.email,
                  address: editingAgent.address,
                  android_phone: editingAgent.android_phone,
                  laptop: editingAgent.laptop,
                  twoWheeler: editingAgent.twoWheeler,
                  fourWheeler: editingAgent.fourWheeler,
                  polling_center_id: editingAgent.polling_center_id,
                  booth_id: editingAgent.booth_id,
                }
              : category
              ? { category }
              : undefined
          }
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Add New Agent
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, phone, email..."
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">No agents found</div>
          </div>
        ) : (
          <>
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
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Polling Center
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {agents.map((agent) => (
                    <tr key={agent.agent_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{agent.name}</td>
                      <td className="px-4 py-3 text-sm">{agent.category}</td>
                      <td className="px-4 py-3 text-sm">{agent.role}</td>
                      <td className="px-4 py-3 text-sm">{agent.phone}</td>
                      <td className="px-4 py-3 text-sm">
                        {agent.email || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {agent.polling_center_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() =>
                            handleToggleStatus(agent.agent_id, agent.status)
                          }
                          className={`px-2 py-1 rounded-full text-xs ${
                            agent.status === 1
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {agent.status === 1 ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(agent)}
                            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded"
                            title="Edit Agent"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(agent.agent_id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="Delete Agent"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
