import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppSelector } from "../../../store/hooks";
import WhatsAppLinkModal from "./WhatsAppLinkModal";
import {
  deleteWhatsAppLink,
  fetchAssembliesByDistrict,
  fetchDistrictsByState,
  type AssemblyOption,
  type DistrictOption,
  type WhatsAppLinkData,
  fetchWhatsAppLinks,
} from "../../../services/levelAdminApi";

interface WhatsAppLocationState {
  levelId?: number;
}

export default function WhatsAppPage() {
  const location = useLocation();
  const { levelAdminPanels, user } = useAppSelector((state) => state.auth);

  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [assemblies, setAssemblies] = useState<AssemblyOption[]>([]);
  const [editingLink, setEditingLink] = useState<WhatsAppLinkData | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | "">("");
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number | "">("");
  
  const [whatsappLinks, setWhatsappLinks] = useState<WhatsAppLinkData[]>([]);
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [modalRow, setModalRow] = useState<any>(null);
  const [deletingLinkId, setDeletingLinkId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const locationState = (location.state as WhatsAppLocationState | null) ?? null;

  const currentPanel = useMemo(() => {
    if (locationState?.levelId) {
      return levelAdminPanels.find((panel) => panel.id === locationState.levelId);
    }
    return levelAdminPanels.find((panel) => panel.name?.toLowerCase() === "assembly") ?? levelAdminPanels[0];
  }, [levelAdminPanels, locationState?.levelId]);

  const stateId = currentPanel?.metadata?.stateId ?? user?.state_id ?? null;
  const stateName = currentPanel?.metadata?.stateName ?? user?.stateName ?? "State";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  useEffect(() => {
    if (!stateId) return;
    const loadDistricts = async () => {
      try {
        const response = await fetchDistrictsByState(stateId);
        setDistricts(response.data);
      } catch (err) {
        setDistricts([]);
      }
    };
    void loadDistricts();
  }, [stateId]);

  useEffect(() => {
    if (!stateId || !selectedDistrictId) {
      setAssemblies([]);
      setSelectedAssemblyId("");
      return;
    }
    const loadAssemblies = async () => {
      try {
        const data = await fetchAssembliesByDistrict(stateId, Number(selectedDistrictId));
        setAssemblies(data);
      } catch (err) {
        setAssemblies([]);
      }
    };
    void loadAssemblies();
  }, [selectedDistrictId, stateId]);

  const loadWhatsAppLinks = useCallback(async (params: { afterAssemblyData_id?: number, stateMasterData_id?: number, state_id?: number, levelType?: string }) => {
    try {
      setWhatsAppLoading(true);
      const data = await fetchWhatsAppLinks(params);
      setWhatsappLinks(data ?? []);
    } catch (err) {
      setWhatsappLinks([]);
    } finally {
      setWhatsAppLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAssemblyId) {
      void loadWhatsAppLinks({ stateMasterData_id: Number(selectedAssemblyId), levelType: 'Assembly' });
    } else if (stateId) {
      void loadWhatsAppLinks({ state_id: stateId, levelType: 'Assembly' });
    } else {
      setWhatsappLinks([]);
    }
  }, [selectedAssemblyId, stateId, loadWhatsAppLinks]);

  const handleExport = () => {
    try {
      setIsExporting(true);
      const selectedDistrict = districts.find(d => d.id === selectedDistrictId);
      const selectedAssembly = assemblies.find(a => a.assemblyId === selectedAssemblyId);

      let dataToExport = [...whatsappLinks];

      if (selectedAssemblyId) {
        dataToExport = whatsappLinks;
      } else if (selectedDistrictId && selectedDistrict) {
        dataToExport = whatsappLinks.filter(
          link => link.district_name === selectedDistrict.name
        );
      }

      if (dataToExport.length === 0) {
        toast.error("No data available to export");
        return;
      }

      const headers = ["State", "District", "Assembly", "Group Name", "WhatsApp Link", "Users Count"];
      const csvRows = dataToExport.map(link => [
        `"${stateName}"`,
        `"${link.district_name || selectedDistrict?.name || "—"}"`,
        `"${link.assembly_name || selectedAssembly?.assemblyName || "—"}"`,
        `"${link.group_name || "—"}"`,
        `"${link.link}"`,
        link.users?.length || 0
      ]);

      const csvContent = [headers.join(","), ...csvRows.map(row => row.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const fileName = selectedAssembly 
        ? `WhatsApp_Links_${selectedAssembly.assemblyName}.csv`
        : selectedDistrict 
          ? `WhatsApp_Links_District_${selectedDistrict.name}.csv`
          : `WhatsApp_Links_All_${stateName}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export successful");
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this WhatsApp link?")) return;
    try {
      setDeletingLinkId(id);
      await deleteWhatsAppLink(id);
      toast.success("Link deleted");
      if (selectedAssemblyId) {
        void loadWhatsAppLinks({ stateMasterData_id: Number(selectedAssemblyId), levelType: 'Assembly' });
      } else {
        void loadWhatsAppLinks({ state_id: stateId, levelType: 'Assembly' });
      }
    } catch (err) {
      toast.error("Failed to delete");
    } finally {
      setDeletingLinkId(null);
      setOpenMenuId(null);
    }
  };

  const selectedRow = useMemo(() => {
    return assemblies.find((item) => item.assemblyId === Number(selectedAssemblyId)) ?? null;
  }, [assemblies, selectedAssemblyId]);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-white">WhatsApp Management</h1>
          <p className="mt-2 text-sm text-white">Manage multiple WhatsApp links for your assembly.</p>
        </div>

        <div className="grid gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-sm md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-color)]">State</label>
            <select disabled className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3 text-sm opacity-80 cursor-not-allowed">
              <option>{stateName}</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-color)]">District</label>
            <select
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3 text-sm text-[var(--text-color)] outline-none focus:border-emerald-500"
            >
              <option value="">Select District</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-color)]">Assembly</label>
            <select
              value={selectedAssemblyId}
              onChange={(e) => setSelectedAssemblyId(Number(e.target.value))}
              disabled={!selectedDistrictId}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3 text-sm text-[var(--text-color)] outline-none focus:border-emerald-500 disabled:opacity-50"
            >
              <option value="">Select Assembly</option>
              {assemblies.map((a) => <option key={a.assemblyId} value={a.assemblyId}>{a.assemblyName}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-color)]">Assembly Actions</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {selectedAssemblyId ? `Selected: ${selectedRow?.assemblyName}` : "Select assembly to create links"}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting || whatsappLinks.length === 0}
              className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-5 py-2.5 text-sm font-bold text-[var(--text-color)] transition hover:bg-[var(--text-color)]/5 shadow-sm active:scale-95 disabled:opacity-50"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              {isExporting ? "Exporting..." : "Export CSV"}
            </button>

            {selectedAssemblyId && (
              <button
                onClick={() => { setEditingLink(null); setModalRow(selectedRow); }}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 shadow-md active:scale-95"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                Create New Link
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
          <div className="max-h-[500px] overflow-auto">
            <table className="min-w-full divide-y divide-[var(--border-color)]">
              <thead className="sticky top-0 z-10 bg-[var(--bg-main)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-secondary)]">State</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-secondary)]">District</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-secondary)]">Assembly</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-secondary)]">Users</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-secondary)]">Link</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--text-secondary)]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {whatsAppLoading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-[var(--text-secondary)]">Loading links...</td></tr>
                ) : whatsappLinks.length > 0 ? (
                  whatsappLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-[var(--bg-main)]/60 transition-colors">
                      <td className="px-4 py-4 text-sm text-[var(--text-color)]">{stateName}</td>
                      <td className="px-4 py-4 text-sm text-[var(--text-color)]">{link.district_name || selectedRow?.districtName || "—"}</td>
                      <td className="px-4 py-4 text-sm font-medium text-[var(--text-color)]">{link.assembly_name || selectedRow?.assemblyName || "—"}</td>
                      <td className="px-4 py-4 text-sm font-bold text-[var(--text-color)]">{link.users?.length || 0}</td>
                      <td className="px-4 py-4">
                        <a href={link.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all max-w-[200px]">
                          <span className="truncate">{link.group_name || "Open Link"}</span>
                          <svg className="shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </a>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="relative inline-block" ref={link.id === openMenuId ? menuRef : null}>
                          <button onClick={() => setOpenMenuId(openMenuId === link.id ? null : link.id)} className="p-2 rounded-lg hover:bg-[var(--bg-main)] text-[var(--text-secondary)]">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                          </button>
                          {openMenuId === link.id && (
                            <div className="absolute right-0 z-20 mt-2 w-32 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] py-1 shadow-xl ring-1 ring-black ring-opacity-5">
                              <button 
                                onClick={() => { 
                                  setEditingLink(link); 
                                  setModalRow(selectedRow || {
                                    stateId: stateId || 0,
                                    stateName: stateName || "",
                                    districtId: 0,
                                    districtName: link.district_name || "",
                                    assemblyId: link.stateMasterData_id || link.afterAssemblyData_id || 0,
                                    assemblyName: link.assembly_name || "",
                                    totalUsers: link.users?.length || 0,
                                  }); 
                                  setOpenMenuId(null); 
                                }} 
                                className="block w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-main)]"
                              >
                                Edit
                              </button>
                              <button onClick={() => handleDelete(link.id)} disabled={deletingLinkId === link.id} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">
                                {deletingLinkId === link.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-[var(--text-secondary)]">No links created for this state/assembly.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <WhatsAppLinkModal 
          isOpen={Boolean(modalRow)} 
          onClose={() => { 
            setModalRow(null); 
            setEditingLink(null); 
            if (selectedAssemblyId) {
              void loadWhatsAppLinks({ stateMasterData_id: Number(selectedAssemblyId), levelType: 'Assembly' });
            } else if (stateId) {
              void loadWhatsAppLinks({ state_id: stateId, levelType: 'Assembly' });
            }
          }} 
          initialData={editingLink} 
          row={modalRow} 
        />
      </div>
    </div>
  );
}