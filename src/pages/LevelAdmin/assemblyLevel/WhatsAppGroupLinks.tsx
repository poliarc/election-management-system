import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import toast from "react-hot-toast";
import {
  useGetLinksQuery,
  useGetLinkByIdQuery,
  useCreateLinkMutation,
  useUpdateLinkMutation,
  useDeleteLinkMutation,
  type WhatsAppGroupLink,
} from "../../../store/api/whatsappGroupLinkApi";
import { useGetAllStateMasterDataQuery } from "../../../store/api/stateMasterApi";
import { fetchUsersByPartyAndState } from "../../../services/levelAdminApi";

export default function AssemblyWhatsAppGroupLinks() {
  const { levelId } = useParams<{ levelId: string }>();
  const { levelAdminPanels } = useAppSelector((s) => s.auth);
  const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

  const meta = currentPanel?.metadata;
  const partyId = meta?.partyId;
  const panelStateId = meta?.stateId;

  // Debug: log to verify values
  console.log("[WhatsAppGroupLinks] meta:", meta, "partyId:", partyId, "panelStateId:", panelStateId);

  // Hierarchy dropdowns — State is pre-selected from panel metadata and locked
  const { data: stateMasterData = [] } = useGetAllStateMasterDataQuery();
  const [selectedStateId, setSelectedStateId] = useState<number | null>(panelStateId || null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number | null>(null);
  const [selectedDistrictStateMasterId, setSelectedDistrictStateMasterId] = useState<number | null>(null);

  // Keep selectedStateId in sync if panelStateId loads after mount
  useEffect(() => {
    if (panelStateId && !selectedStateId) setSelectedStateId(panelStateId);
  }, [panelStateId]);

  const states = stateMasterData.filter((i) => i.levelType === "State" && i.isActive === 1);
  const districts = stateMasterData.filter(
    (i) => i.levelType === "District" && i.isActive === 1 && (!selectedStateId || i.ParentId === selectedStateId)
  );
  const assemblies = stateMasterData.filter(
    (i) => i.levelType === "Assembly" && i.isActive === 1 && (!selectedDistrictId || i.ParentId === selectedDistrictId)
  );

  // Use selected assembly or fall back to panel's assembly
  const assemblyId = selectedAssemblyId || meta?.assemblyId || meta?.stateMasterData_id;
  const stateId = selectedStateId || panelStateId;
  const districtId = selectedDistrictStateMasterId || meta?.districtId || meta?.parentStateMasterData_id;

  const { data, isLoading, refetch } = useGetLinksQuery(
    { assembly_id: assemblyId, party_id: partyId },
    { skip: !assemblyId }
  );
  const [createLink] = useCreateLinkMutation();
  const [updateLink] = useUpdateLinkMutation();
  const [deleteLink] = useDeleteLinkMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<WhatsAppGroupLink | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", group_link: "" });
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewingLinkId, setViewingLinkId] = useState<number | null>(null);

  // Fetch detail for viewing users
  const { data: viewLinkData, isFetching: viewFetching } = useGetLinkByIdQuery(
    viewingLinkId!,
    { skip: viewingLinkId === null }
  );

  // Fetch detail for editing (to get selected_users)
  const { data: editLinkData } = useGetLinkByIdQuery(
    editingLinkId!,
    { skip: editingLinkId === null }
  );

  // Populate selectedUserIds when edit detail loads
  useEffect(() => {
    if (editLinkData?.data) {
      setSelectedUserIds(editLinkData.data.selected_users?.map((u) => u.user_id) || []);
    }
  }, [editLinkData]);

  useEffect(() => {
    const effectiveStateId = selectedStateId || panelStateId;
    if (!partyId || !effectiveStateId) return;

    const loadAllUsers = async () => {
      let allUsers: any[] = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const res = await fetchUsersByPartyAndState(partyId, effectiveStateId, page, limit);
        if (!res.success) break;
        const filtered = res.data.filter((u: any) => !u.isSuperAdmin);
        allUsers = [...allUsers, ...filtered];
        hasMore = page < res.pagination.totalPages;
        page++;
      }

      setUsers(allUsers);
      setTotalUsers(allUsers.length);
    };

    loadAllUsers();
  }, [partyId, selectedStateId, panelStateId]);

  const filteredUsers = users.filter((u) =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  const openCreate = () => {
    setEditingLink(null);
    setForm({ title: "", group_link: "" });
    setSelectedUserIds([]);
    setShowForm(true);
  };

  const openEdit = (link: WhatsAppGroupLink) => {
    setEditingLink(link);
    setEditingLinkId(link.id);
    setForm({ title: link.title, group_link: link.group_link });
    setSelectedUserIds([]); // will be populated by useEffect when editLinkData loads
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.group_link.trim()) { toast.error("Title and group link are required"); return; }
    setSubmitting(true);
    try {
      if (editingLink) {
        await updateLink({ id: editingLink.id, body: { title: form.title, group_link: form.group_link, user_ids: selectedUserIds } }).unwrap();
        toast.success("Link updated");
      } else {
        await createLink({
          title: form.title, group_link: form.group_link,
          party_id: partyId, state_id: stateId, district_id: districtId,
          assembly_id: assemblyId, target_level: "Assembly", user_ids: selectedUserIds,
        }).unwrap();
        toast.success("Link created");
      }
      setShowForm(false);
      setEditingLinkId(null);
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this link?")) return;
    try { await deleteLink(id).unwrap(); toast.success("Deleted"); refetch(); }
    catch { toast.error("Failed to delete"); }
  };

  const toggleUser = (uid: number) => {
    setSelectedUserIds((prev) => prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]);
  };

  if (!currentPanel) return <div className="p-4 text-red-500">Panel not found</div>;

  return (
    <div className="p-4 bg-[var(--bg-main)] min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-color)] flex items-center gap-2">
            <span>💬</span> WhatsApp Group Links
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {currentPanel.displayName} — Assembly Level
            {totalUsers > 0 && <span className="ml-2 text-indigo-500 font-medium">({totalUsers} total users)</span>}
          </p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">+ Add Link</button>
      </div>

      {/* Hierarchy Dropdowns */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">State</label>
            <select
              value={selectedStateId || ""}
              disabled
              className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 bg-[var(--bg-main)] text-[var(--text-color)] text-sm opacity-70 cursor-not-allowed"
            >
              <option value="">All States</option>
              {states.map((s) => <option key={s.id} value={s.id}>{s.levelName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">District</label>
            <select value={selectedDistrictId || ""} onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setSelectedDistrictId(val);
              setSelectedDistrictStateMasterId(val);
              setSelectedAssemblyId(null);
            }} className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 bg-[var(--bg-card)] text-[var(--text-color)] text-sm">
              <option value="">All Districts</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.levelName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Assembly</label>
            <select value={selectedAssemblyId || ""} onChange={(e) => {
              setSelectedAssemblyId(e.target.value ? Number(e.target.value) : null);
            }} disabled={!selectedDistrictId} className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 bg-[var(--bg-card)] text-[var(--text-color)] text-sm disabled:opacity-50">
              <option value="">All Assemblies</option>
              {assemblies.map((a) => <option key={a.id} value={a.id}>{a.levelName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-color)]">{editingLink ? "Edit Link" : "Add WhatsApp Group Link"}</h2>
              <button onClick={() => { setShowForm(false); setEditingLinkId(null); }} className="text-[var(--text-secondary)] text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 bg-[var(--bg-card)] text-[var(--text-color)]"
                  placeholder="e.g. Assembly WhatsApp Group" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">WhatsApp Group Link *</label>
                <input value={form.group_link} onChange={(e) => setForm({ ...form, group_link: e.target.value })}
                  className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 bg-[var(--bg-card)] text-[var(--text-color)]"
                  placeholder="https://chat.whatsapp.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Select Users ({selectedUserIds.length} selected of {totalUsers} total)
                </label>
                <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 mb-2 bg-[var(--bg-card)] text-[var(--text-color)] text-sm"
                  placeholder="Search users..." />
                <div className="border border-[var(--border-color)] rounded-lg max-h-48 overflow-y-auto">
                  {filteredUsers.map((u) => (
                    <label key={u.user_id} className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-hover)] cursor-pointer">
                      <input type="checkbox" checked={selectedUserIds.includes(u.user_id)} onChange={() => toggleUser(u.user_id)} className="rounded" />
                      <span className="text-sm text-[var(--text-color)]">{u.first_name} {u.last_name}</span>
                      <span className="text-xs text-[var(--text-secondary)]">{u.email}</span>
                    </label>
                  ))}
                  {filteredUsers.length === 0 && <p className="text-center text-sm text-[var(--text-secondary)] py-4">No users found</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setShowForm(false); setEditingLinkId(null); }} className="px-4 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)]">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {submitting ? "Saving..." : editingLink ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Links List */}
      {!assemblyId ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Select state, district and assembly to view links</div>
      ) : isLoading ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>
      ) : (() => {
        const assemblyLinks = (data?.data || []).filter((l) => l.target_level === "Assembly");
        if (assemblyLinks.length === 0) return (
          <div className="text-center py-16 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-[var(--text-secondary)]">No WhatsApp group links yet</p>
            <button onClick={openCreate} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add First Link</button>
          </div>
        );
        return (
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Link</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Users</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Created By</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {assemblyLinks.map((link, i) => (
                  <tr key={link.id} className="hover:bg-[var(--bg-main)] transition-colors">
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text-color)]">{link.title}</td>
                    <td className="px-4 py-3">
                      <a href={link.group_link} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-green-600 hover:text-green-700 max-w-xs truncate">
                        🔗 <span className="truncate">{link.group_link}</span>
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setViewingLinkId(link.id)}
                        className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        title="View users"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm4 10v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        View Users
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{link.creator_first_name} {link.creator_last_name}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(link)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Edit">✏️</button>
                        <button onClick={() => handleDelete(link.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}
      {/* View Users Modal */}
      {viewingLinkId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-color)]">
                {viewLinkData?.data?.title || "Link"} — Users
              </h2>
              <button onClick={() => setViewingLinkId(null)} className="text-[var(--text-secondary)] text-xl">✕</button>
            </div>
            <div className="p-4">
              {viewFetching ? (
                <p className="text-center text-sm text-[var(--text-secondary)] py-6">Loading...</p>
              ) : (viewLinkData?.data?.selected_users || []).length === 0 ? (
                <p className="text-center text-sm text-[var(--text-secondary)] py-6">No users assigned to this link</p>
              ) : (
                <div className="divide-y divide-[var(--border-color)] max-h-80 overflow-y-auto">
                  {(viewLinkData?.data?.selected_users || []).map((u, i) => (
                    <div key={u.user_id} className="flex items-center gap-3 py-2.5 px-2">
                      <span className="text-xs text-[var(--text-secondary)] w-5">{i + 1}</span>
                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold shrink-0">
                        {u.first_name?.[0]}{u.last_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-color)] truncate">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{u.contact_no}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)] text-right">
                Total: {viewLinkData?.data?.selected_users?.length ?? 0} users
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
