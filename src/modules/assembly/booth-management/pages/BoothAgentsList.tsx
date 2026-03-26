import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { boothAgentApi } from "../services/boothAgentApi";
import type { BoothAgent, BoothAgentCategory, PollingCenter } from "../types";
import { BoothAgentForm } from "../components/BoothAgentForm";
import { useTranslation } from "react-i18next";

interface BoothAgentsListProps {
  category?: BoothAgentCategory;
  title: string;
}

export const BoothAgentsList: React.FC<BoothAgentsListProps> = ({ category, title }) => {
  const {t} = useTranslation();
  const [agents, setAgents] = useState<BoothAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<BoothAgent | null>(null);
  const [search, setSearch] = useState("");
  const [boothFilter, setBoothFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pollingCenters, setPollingCenters] = useState<PollingCenter[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const limit = 10;

  const selectedAssignment = useSelector((state: RootState) => state.auth.selectedAssignment);
  const user = useSelector((state: RootState) => state.auth.user);

  const isPollingCenterTeam = category === "Polling Center Support Team";

  const assemblyId =
    selectedAssignment?.levelType === "Assembly"
      ? selectedAssignment?.stateMasterData_id
      : selectedAssignment?.parentAssemblyId;

  const partyId = user?.partyId;

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (assemblyId && partyId) fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search, boothFilter, page, assemblyId, partyId]);

  // Fetch polling centers for booth dropdown only
  useEffect(() => {
    if (assemblyId) {
      boothAgentApi.getPollingCentersByAssembly(assemblyId).then((res) => {
        setPollingCenters(res.data);
      }).catch(() => {});
    }
  }, [assemblyId]);

  // All booths across all polling centers for dropdown
  const allBooths = pollingCenters.flatMap((pc) => pc.booths || []);

  const fetchAgents = async () => {
    if (!assemblyId || !partyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page, limit,
        search: search || undefined,
        category: category || undefined,
        partyId,
        ...(boothFilter !== "all" && { booth_id: boothFilter }),
      };
      const response = await boothAgentApi.getAgentsByAssembly(assemblyId, params as any);
      setAgents(response.data);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    try { await boothAgentApi.deleteAgent(id); fetchAgents(); }
    catch { alert("Failed to delete agent"); }
  };

  const handleToggleStatus = async (id: number, currentStatus: number) => {
    try { await boothAgentApi.toggleStatus(id, currentStatus === 1 ? 0 : 1); fetchAgents(); }
    catch { alert("Failed to toggle status"); }
  };

  const handleEdit = (agent: BoothAgent) => { setEditingAgent(agent); setShowForm(true); };
  const handleFormSuccess = () => { setShowForm(false); setEditingAgent(null); fetchAgents(); };
  const handleFormCancel = () => { setShowForm(false); setEditingAgent(null); };

  if (!assemblyId || !partyId) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="text-center text-red-600">
          {!assemblyId ? "No assembly selected." : "Party information not found."}
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="bg-[var(--bg-color)] rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-6">{editingAgent ? "Edit Agent" : "Add New Agent"}</h2>
        <BoothAgentForm
          initialData={editingAgent ? {
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
          } : category ? { category } : undefined}
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
          {t("BoothAgent.Add_New_Agent")}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[var(--bg-color)] rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("BoothAgent.Search")}</label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, phone..."
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          {!isPollingCenterTeam && (
          <div>
            <label className="block text-sm font-medium mb-1">{t("BoothAgent.Booth")}</label>
            <select
              value={boothFilter}
              onChange={(e) => { setBoothFilter(e.target.value); setPage(1); }}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Booths</option>
              {allBooths.map((b) => (
                <option key={b.id} value={String(b.id)}>{b.displayName}</option>
              ))}
            </select>
          </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-color)] rounded-lg border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">{t("BoothAgent.Loading")}</div>
        ) : agents.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">{t("BoothAgent.No_agents_found")}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-color)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t("BoothAgent.Name")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t("BoothAgent.Category")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t("BoothAgent.Role")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t("BoothAgent.Phone")}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t("BoothAgent.Polling_Center")}</th>
                    {!isPollingCenterTeam && <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t("BoothAgent.Booth_No")}</th>}
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t("BoothAgent.Action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {agents.map((agent) => (
                    <tr key={agent.agent_id} className="hover:bg-[var(--bg-color)]">
                      <td className="px-4 py-3 text-sm">{agent.name}</td>
                      <td className="px-4 py-3 text-sm">{agent.category}</td>
                      <td className="px-4 py-3 text-sm">{agent.role}</td>
                      <td className="px-4 py-3 text-sm">{agent.phone}</td>
                      <td className="px-4 py-3 text-sm">
                        {agent.polling_center_name || "-"}
                      </td>
                      {!isPollingCenterTeam && (
                      <td className="px-4 py-3 text-sm">
                        {agent.booth_name || agent.booth_no || "-"}
                      </td>
                      )}
                      <td className="px-4 py-3 text-sm relative">
                        <div ref={openMenuId === agent.agent_id ? menuRef : null} className="relative inline-block">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === agent.agent_id ? null : agent.agent_id)}
                            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                            </svg>
                          </button>

                          {openMenuId === agent.agent_id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                              <button
                                onClick={() => { handleEdit(agent); setOpenMenuId(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => { handleToggleStatus(agent.agent_id, agent.status); setOpenMenuId(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                </svg>
                                {agent.status === 1 ? "Set Inactive" : "Set Active"}
                              </button>
                              <button
                                onClick={() => { handleDelete(agent.agent_id); setOpenMenuId(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded-md disabled:opacity-50">{t("BoothAgent.Previous")}</button>
                <span className="text-sm text-[var(--text-secondary)]">{t("BoothAgent.Page")} {page} {t("BoothAgent.of")} {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50">{t("BoothAgent.Next")}</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};



