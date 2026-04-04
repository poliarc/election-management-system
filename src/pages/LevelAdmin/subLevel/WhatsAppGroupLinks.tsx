import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import toast from "react-hot-toast";
import {
  useGetLinksQuery,
  useCreateLinkMutation,
  useUpdateLinkMutation,
  useDeleteLinkMutation,
  type WhatsAppGroupLink,
} from "../../../store/api/whatsappGroupLinkApi";
import {
  fetchAfterAssemblyDataByAssembly,
  fetchChildLevelsByParent,
  type AfterAssemblyData,
} from "../../../services/afterAssemblyApi";
import { useGetAllStateMasterDataQuery } from "../../../store/api/stateMasterApi";
import { fetchUsersByPartyAndState } from "../../../services/levelAdminApi";

export default function SubLevelWhatsAppGroupLinks() {
  const { levelId } = useParams<{ levelId: string }>();
  const { levelAdminPanels } = useAppSelector((s) => s.auth);
  const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

  const meta = currentPanel?.metadata as any;
  const partyId = meta?.partyId;
  const stateId = meta?.stateId;
  const districtId = meta?.districtId || meta?.parentStateMasterData_id;

  // stateMaster dropdowns — State pre-selected from panel metadata and locked
  const { data: stateMasterData = [] } = useGetAllStateMasterDataQuery();
  const [selectedStateId, setSelectedStateId] = useState<number | null>(stateId || null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedAssemblyStateMasterId, setSelectedAssemblyStateMasterId] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);

  // Keep selectedStateId in sync if stateId loads after mount
  useEffect(() => {
    if (stateId && !selectedStateId) setSelectedStateId(stateId);
  }, [stateId]);

  const states = stateMasterData.filter((i) => i.levelType === "State" && i.isActive === 1);
  const districts = stateMasterData.filter(
    (i) => i.levelType === "District" && i.isActive === 1 && (!selectedStateId || i.ParentId === selectedStateId)
  );
  const assembliesForDropdown = stateMasterData.filter(
    (i) => i.levelType === "Assembly" && i.isActive === 1 && (!selectedDistrictId || i.ParentId === selectedDistrictId)
  );

  // Load total users when state changes
  useEffect(() => {
    if (!partyId || !stateId) return;
    fetchUsersByPartyAndState(partyId, stateId, 1, 1).then((res) => {
      if (res.success) setTotalUsers(res.pagination?.total || 0);
    });
  }, [partyId, stateId]);

  // Hierarchy selection state (Block/Mandal etc. under assembly)
  const [selectedAssembly, setSelectedAssembly] = useState<any>(null);
  const [levelOptions, setLevelOptions] = useState<AfterAssemblyData[][]>([]);
  const [hierarchyPath, setHierarchyPath] = useState<AfterAssemblyData[]>([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  // Use selected assembly from stateMaster dropdown or hierarchy
  const assemblyId = selectedAssemblyStateMasterId || selectedAssembly?.location_id;
  const selectedNode = hierarchyPath.length > 0 ? hierarchyPath[hierarchyPath.length - 1] : null;

  const { data, isLoading, refetch } = useGetLinksQuery(
    { assembly_id: assemblyId, party_id: partyId },
    { skip: !assemblyId }
  );
  const [createLink] = useCreateLinkMutation();
  const [updateLink] = useUpdateLinkMutation();
  const [deleteLink] = useDeleteLinkMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<WhatsAppGroupLink | null>(null);
  const [form, setForm] = useState({ title: "", group_link: "", target_level: "Mandal" });
  const [submitting, setSubmitting] = useState(false);

  // Load initial level options when assembly selected
  useEffect(() => {
    if (!selectedAssembly) { setLevelOptions([]); setHierarchyPath([]); return; }
    setLoadingHierarchy(true);
    fetchAfterAssemblyDataByAssembly(selectedAssembly.location_id || selectedAssembly.id).then((res) => {
      if (res.success) setLevelOptions([res.data]);
      setHierarchyPath([]);
    }).finally(() => setLoadingHierarchy(false));
  }, [selectedAssembly]);

  const handleLevelSelect = async (index: number, level: AfterAssemblyData | null) => {
    if (!level) {
      setHierarchyPath((p) => p.slice(0, index));
      setLevelOptions((p) => p.slice(0, index + 1));
      return;
    }
    const newPath = [...hierarchyPath.slice(0, index), level];
    setHierarchyPath(newPath);
    try {
      const res = await fetchChildLevelsByParent(level.id);
      if (res.success && res.data.length > 0) {
        setLevelOptions((p) => [...p.slice(0, index + 1), res.data]);
      } else {
        setLevelOptions((p) => p.slice(0, index + 1));
      }
    } catch { setLevelOptions((p) => p.slice(0, index + 1)); }
  };

  const openCreate = () => {
    if (!selectedNode) { toast.error("Please select a node first"); return; }
    setEditingLink(null);
    setForm({ title: "", group_link: "", target_level: selectedNode.levelName });
    setShowForm(true);
  };

  const openEdit = (link: WhatsAppGroupLink) => {
    setEditingLink(link);
    setForm({ title: link.title, group_link: link.group_link, target_level: link.target_level });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.group_link.trim()) { toast.error("Title and link required"); return; }
    if (!selectedNode && !editingLink) { toast.error("Select a node"); return; }
    setSubmitting(true);
    try {
      if (editingLink) {
        await updateLink({ id: editingLink.id, body: { title: form.title, group_link: form.group_link } }).unwrap();
        toast.success("Updated");
      } else {
        await createLink({
          title: form.title,
          group_link: form.group_link,
          party_id: partyId,
          state_id: stateId || selectedStateId,
          district_id: districtId || selectedDistrictId,
          assembly_id: assemblyId,
          target_level: selectedNode!.levelName,
          target_node_id: selectedNode!.id,
        }).unwrap();
        toast.success("Created");
      }
      setShowForm(false);
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
    catch { toast.error("Failed"); }
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
            {currentPanel.displayName} — Sub Level
            {totalUsers > 0 && <span className="ml-2 text-indigo-500 font-medium">({totalUsers} total users)</span>}
          </p>
      </div>
      </div>

      {/* State/District/Assembly Dropdowns */}
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
              setSelectedDistrictId(e.target.value ? Number(e.target.value) : null);
              setSelectedAssemblyStateMasterId(null); setSelectedAssembly(null);
              setLevelOptions([]); setHierarchyPath([]);
            }} className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 bg-[var(--bg-card)] text-[var(--text-color)] text-sm">
              <option value="">All Districts</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.levelName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Assembly</label>
            <select value={selectedAssemblyStateMasterId || ""} onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : null;
              setSelectedAssemblyStateMasterId(val);
              // Also set selectedAssembly for hierarchy loading
              if (val) {
                const found = assembliesForDropdown.find((a) => a.id === val);
                if (found) setSelectedAssembly({ location_id: found.id, location_name: found.levelName } as any);
              } else {
                setSelectedAssembly(null);
              }
              setLevelOptions([]); setHierarchyPath([]);
            }} disabled={!selectedDistrictId} className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 bg-[var(--bg-card)] text-[var(--text-color)] text-sm disabled:opacity-50">
              <option value="">All Assemblies</option>
              {assembliesForDropdown.map((a) => <option key={a.id} value={a.id}>{a.levelName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Hierarchy Selection (Block/Mandal etc.) */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-4 mb-4">
        {levelOptions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {levelOptions.map((opts, idx) => (
              <div key={idx}>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{opts[0]?.levelName || `Level ${idx + 1}`}</label>
                <select value={hierarchyPath[idx]?.id || ""} onChange={(e) => {
                  const l = opts.find((x) => x.id === Number(e.target.value));
                  handleLevelSelect(idx, l || null);
                }} className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 bg-[var(--bg-card)] text-[var(--text-color)] text-sm">
                  <option value="">-- Select --</option>
                  {opts.map((o) => <option key={o.id} value={o.id}>{o.displayName}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
        {loadingHierarchy && <p className="text-xs text-[var(--text-secondary)] mt-2">Loading...</p>}
      </div>

      {/* Add button — only when node selected */}
      {selectedNode && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Selected: <span className="font-medium text-[var(--text-color)]">{selectedNode.displayName}</span> ({selectedNode.levelName})
          </p>
          <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">+ Add Link</button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h2 className="text-lg font-semibold text-[var(--text-color)]">{editingLink ? "Edit Link" : "Add Link"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[var(--text-secondary)] text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 bg-[var(--bg-card)] text-[var(--text-color)]"
                  placeholder="Group title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">WhatsApp Link *</label>
                <input value={form.group_link} onChange={(e) => setForm({ ...form, group_link: e.target.value })}
                  className="w-full border border-[var(--border-color)] rounded-lg px-3 py-2 bg-[var(--bg-card)] text-[var(--text-color)]"
                  placeholder="https://chat.whatsapp.com/..." />
              </div>
              {!editingLink && selectedNode && (
                <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-hover)] rounded-lg px-3 py-2">
                  Target: <strong>{selectedNode.displayName}</strong> ({selectedNode.levelName})
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)]">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {submitting ? "Saving..." : editingLink ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Links */}
      {!assemblyId ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Select district and assembly to view links</div>
      ) : isLoading ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">Loading...</div>
      ) : (() => {
        const subLinks = (data?.data || []).filter((l) => l.target_level !== "Assembly");
        if (subLinks.length === 0) return (
          <div className="text-center py-12 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-[var(--text-secondary)]">No sub-level links for this assembly</p>
          </div>
        );
        return (
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Level</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Link</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Created By</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {subLinks.map((link, i) => (
                  <tr key={link.id} className="hover:bg-[var(--bg-main)] transition-colors">
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text-color)]">{link.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{link.target_level}</span>
                    </td>
                    <td className="px-4 py-3">
                      <a href={link.group_link} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-green-600 hover:text-green-700 max-w-xs truncate">
                        🔗 <span className="truncate">{link.group_link}</span>
                      </a>
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
    </div>
  );
}
