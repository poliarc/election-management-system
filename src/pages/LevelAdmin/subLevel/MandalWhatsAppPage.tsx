import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppSelector } from "../../../store/hooks";
import WhatsAppLinkModal from "../assemblyLevel/WhatsAppLinkModal"; 
import { fetchHierarchyChildren } from "../../../services/hierarchyApi";
import {
  fetchAfterAssemblyDataByAssembly,
  fetchChildLevelsByParent,
  type AfterAssemblyData,
} from "../../../services/afterAssemblyApi";
import {
  deleteWhatsAppLink,
  fetchWhatsAppLinks,
  type WhatsAppLinkData,
} from "../../../services/levelAdminApi";

interface HierarchyChild {
  location_id: number;
  location_name: string;
}

export default function MandalWhatsAppPage() {
  const location = useLocation();
  const { levelAdminPanels, user } = useAppSelector((state) => state.auth);

  // Hierarchy States
  const [districts, setDistricts] = useState<HierarchyChild[]>([]);
  const [assemblies, setAssemblies] = useState<HierarchyChild[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<HierarchyChild | null>(null);
  const [selectedAssembly, setSelectedAssembly] = useState<HierarchyChild | null>(null);
  const [hierarchyPath, setHierarchyPath] = useState<AfterAssemblyData[]>([]);
  const [levelOptions, setLevelOptions] = useState<AfterAssemblyData[][]>([]);

  // Loading States
  const [, setLoading] = useState(false);
  const [assembliesLoading, setAssembliesLoading] = useState(false);
  const [, setDataLoading] = useState(false);
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);

  // WhatsApp States
  const [whatsappLinks, setWhatsappLinks] = useState<WhatsAppLinkData[]>([]);
  const [editingLink, setEditingLink] = useState<WhatsAppLinkData | null>(null);
  const [modalRow, setModalRow] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deletingLinkId, setDeletingLinkId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false); 
  
  const menuRef = useRef<HTMLDivElement>(null);
  const locationState = location.state as { levelId?: number } | null;

  const currentPanel = useMemo(() => {
    if (locationState?.levelId) {
      return levelAdminPanels?.find((panel) => panel.id === locationState.levelId);
    }
    return levelAdminPanels?.find((panel) => panel.name?.toLowerCase() === "mandal") ?? levelAdminPanels?.[0];
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
        setLoading(true);
        const response = await fetchHierarchyChildren(stateId, { page: 1, limit: 1000 });
        if (response?.success && response?.data?.children) {
          setDistricts(response.data.children);
        }
      } catch (error) {
        toast.error("Failed to load districts");
      } finally {
        setLoading(false);
      }
    };
    void loadDistricts();
  }, [stateId]);

  useEffect(() => {
    const loadAssemblies = async () => {
      if (!selectedDistrict?.location_id) {
        setAssemblies([]);
        return;
      }
      try {
        setAssembliesLoading(true);
        const response = await fetchHierarchyChildren(selectedDistrict.location_id, { page: 1, limit: 1000 });
        if (response?.success && response?.data?.children) {
          setAssemblies(response.data.children);
        }
      } catch (error) {
        toast.error("Failed to load assemblies");
      } finally {
        setAssembliesLoading(false);
      }
    };
    void loadAssemblies();
  }, [selectedDistrict]);

  useEffect(() => {
    const loadInitialLevelData = async () => {
      if (!selectedAssembly?.location_id) {
        setLevelOptions([]);
        setHierarchyPath([]);
        return;
      }
      try {
        setDataLoading(true);
        const response = await fetchAfterAssemblyDataByAssembly(selectedAssembly.location_id);
        if (response?.success && response?.data?.length > 0) {
          setLevelOptions([response.data]);
        } else {
          setLevelOptions([]);
        }
        setHierarchyPath([]);
      } catch (error) {
        toast.error("Failed to load level data");
        setLevelOptions([]);
      } finally {
        setDataLoading(false);
      }
    };
    void loadInitialLevelData();
  }, [selectedAssembly]);

  const handleLevelSelect = async (levelIndex: number, selectedLevel: AfterAssemblyData | null) => {
    if (!selectedLevel) {
      setHierarchyPath((prev) => prev.slice(0, levelIndex));
      setLevelOptions((prev) => prev.slice(0, levelIndex + 1));
      return;
    }

    const newPath = [...hierarchyPath.slice(0, levelIndex), selectedLevel];
    setHierarchyPath(newPath);

    if (selectedLevel.levelName?.toLowerCase() === "mandal" || selectedLevel.levelName === currentPanel?.name) {
      setLevelOptions((prev) => prev.slice(0, levelIndex + 1));
      return;
    }

    try {
      setDataLoading(true);
      const response = await fetchChildLevelsByParent(selectedLevel.id);
      if (response?.success && response?.data?.length > 0) {
        setLevelOptions((prev) => [...prev.slice(0, levelIndex + 1), response.data]);
      } else {
        setLevelOptions((prev) => prev.slice(0, levelIndex + 1));
      }
    } catch (error) {
      setLevelOptions((prev) => prev.slice(0, levelIndex + 1));
    } finally {
      setDataLoading(false);
    }
  };

  const selectedLevel = hierarchyPath.length > 0 ? hierarchyPath[hierarchyPath.length - 1] : null;
  const isMandalSelected = selectedLevel?.levelName?.toLowerCase() === "mandal" || selectedLevel?.levelName === currentPanel?.name;

  const loadWhatsAppLinks = useCallback(async (params: { afterAssemblyData_id?: number, state_id?: number, levelType?: string }) => {
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
    if (selectedLevel?.id && isMandalSelected) {
      void loadWhatsAppLinks({ afterAssemblyData_id: selectedLevel.id, levelType: 'Mandal' });
    } else if (stateId) {
      void loadWhatsAppLinks({ state_id: stateId, levelType: 'Mandal' });
    } else {
      setWhatsappLinks([]);
    }
  }, [selectedLevel, isMandalSelected, stateId, loadWhatsAppLinks]);

  // 🌟 DYNAMIC EXPORT LOGIC
  const handleExport = () => {
    try {
      setIsExporting(true);
      
      let dataToExport = [...whatsappLinks];

      // Identify the deepest selected point for filtering
      if (selectedLevel) {
        if (isMandalSelected) {
          // Links already filtered for this specific Mandal via backend
          dataToExport = whatsappLinks;
        } else {
          // User selected a higher level (like Block), filter local links
          dataToExport = whatsappLinks.filter(link => 
            link.block_name === selectedLevel.displayName || 
            link.mandal_name === selectedLevel.displayName
          );
        }
      } else if (selectedAssembly) {
        dataToExport = whatsappLinks.filter(link => link.assembly_name === selectedAssembly.location_name);
      } else if (selectedDistrict) {
        dataToExport = whatsappLinks.filter(link => link.district_name === selectedDistrict.location_name);
      }
      // If none of the above, dataToExport remains as all state-level mandal links

      if (dataToExport.length === 0) {
        toast.error("No data available to export");
        return;
      }

      const headers = ["State", "Block", "Mandal", "Group Name", "WhatsApp Link"];

      const csvRows = dataToExport.map(link => [
        `"${stateName}"`,
        `"${link.block_name || "—"}"`,
        `"${link.mandal_name || selectedLevel?.displayName || "—"}"`,
        `"${link.group_name || link.group_type || "—"}"`,
        `"${link.link}"`
      ]);
      
      const csvContent = [headers.join(","), ...csvRows.map(row => row.join(","))].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      // Generate Dynamic Filename based on selection
      const fileName = selectedLevel 
        ? `WhatsApp_Links_${selectedLevel.displayName}.csv`
        : selectedAssembly
          ? `WhatsApp_Links_Assembly_${selectedAssembly.location_name}.csv`
          : selectedDistrict
            ? `WhatsApp_Links_District_${selectedDistrict.location_name}.csv`
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
      if (selectedLevel?.id && isMandalSelected) {
        void loadWhatsAppLinks({ afterAssemblyData_id: selectedLevel.id, levelType: 'Mandal' });
      } else {
        void loadWhatsAppLinks({ state_id: stateId, levelType: 'Mandal' });
      }
    } catch (err) {
      toast.error("Failed to delete");
    } finally {
      setDeletingLinkId(null);
      setOpenMenuId(null);
    }
  };

  const openModal = (linkData: WhatsAppLinkData | null = null) => {
    const targetLevel = linkData?.afterAssemblyData_id ? { id: linkData.afterAssemblyData_id, displayName: linkData.mandal_name || "Mandal" } : selectedLevel;
    
    if (!targetLevel?.id) return;
    setEditingLink(linkData);
    
    setModalRow({
      assemblyId: targetLevel.id, 
      assemblyName: targetLevel.displayName || "Mandal",
      districtId: selectedDistrict?.location_id || 0,
      districtName: linkData?.district_name || selectedDistrict?.location_name || "",
      stateId: stateId || 0,
      stateName: stateName || "State",
      totalUsers: linkData?.users?.length || 0 
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        
        <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-white">Mandal WhatsApp Management</h1>
          <p className="mt-2 text-sm text-white">Manage WhatsApp links for specific Mandals. Sub-level users (Polling Center/Booth) can access these.</p>
        </div>

        {/* Hierarchy Filter Bar */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-6 border border-[var(--border-color)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">District</label>
              <select
                value={selectedDistrict?.location_id || ""}
                onChange={(e) => {
                  const dist = districts.find((d) => d.location_id === Number(e.target.value));
                  setSelectedDistrict(dist || null);
                  setSelectedAssembly(null);
                  setHierarchyPath([]);
                  setLevelOptions([]);
                }}
                className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl bg-[var(--bg-main)] focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm"
              >
                <option value="">-- Select District --</option>
                {districts?.map((d) => (
                  <option key={d.location_id} value={d.location_id}>{d.location_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Assembly</label>
              <select
                value={selectedAssembly?.location_id || ""}
                onChange={(e) => {
                  const asm = assemblies.find((a) => a.location_id === Number(e.target.value));
                  setSelectedAssembly(asm || null);
                  setHierarchyPath([]);
                  setLevelOptions([]);
                }}
                className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl bg-[var(--bg-main)] focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm"
                disabled={!selectedDistrict || assembliesLoading}
              >
                <option value="">-- Select Assembly --</option>
                {assemblies?.map((a) => (
                  <option key={a.location_id} value={a.location_id}>{a.location_name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedAssembly && levelOptions?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-[var(--border-color)] pt-4">
              {levelOptions.map((options, index) => {
                const selectedValue = hierarchyPath[index]?.id || "";
                const levelLabel = options?.length > 0 ? `${options[0].levelName}` : `Level ${index + 1}`;
                return (
                  <div key={index}>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">{levelLabel}</label>
                    <select
                      value={selectedValue}
                      onChange={(e) => {
                        const level = options.find((l) => l.id === Number(e.target.value));
                        handleLevelSelect(index, level || null);
                      }}
                      className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl bg-[var(--bg-main)] focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm"
                    >
                      <option value="">-- Select {levelLabel} --</option>
                      {options?.map((level) => (
                        <option key={level.id} value={level.id}>{level.displayName}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-sm gap-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-color)]">
              {selectedLevel && isMandalSelected ? `${selectedLevel.displayName} Actions` : "Mandal Actions"}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">Manage links assigned to Mandals</p>
          </div>

          <div className="flex items-center gap-3">
            {/* 🌟 Export CSV Button */}
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

            {selectedLevel && isMandalSelected && (
              <button
                onClick={() => openModal(null)}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-purple-700 shadow-md active:scale-95 shrink-0"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                Create Mandal Link
              </button>
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
          <div className="max-h-[500px] overflow-auto">
            <table className="min-w-full divide-y divide-[var(--border-color)]">
              <thead className="sticky top-0 z-10 bg-[var(--bg-main)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-secondary)]">State</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-secondary)]">Block</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-secondary)]">Mandal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--text-secondary)]">Link</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--text-secondary)]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {whatsAppLoading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-[var(--text-secondary)]">Loading links...</td></tr>
                ) : whatsappLinks?.length > 0 ? (
                  whatsappLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-[var(--bg-main)]/60 transition-colors">
                      <td className="px-4 py-4 text-sm font-medium text-[var(--text-color)]">{stateName}</td>
                      <td className="px-4 py-4 text-sm text-[var(--text-color)]">{link.block_name || "—"}</td>
                      <td className="px-4 py-4 text-sm font-medium text-[var(--text-color)]">{link.mandal_name || selectedLevel?.displayName || "—"}</td>
                      <td className="px-4 py-4">
                        <a href={link.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all max-w-[200px]">
                          <span className="truncate">{link.group_name || link.group_type || "Open Link"}</span>
                          <svg className="shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </a>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="relative inline-block" ref={link.id === openMenuId ? menuRef : null}>
                          <button onClick={() => setOpenMenuId(openMenuId === link.id ? null : link.id)} className="p-2 rounded-lg hover:bg-[var(--bg-main)] text-[var(--text-secondary)]">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                          </button>
                          {openMenuId === link.id && (
                            <div className="absolute right-0 z-20 mt-2 w-32 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] py-1 shadow-xl ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in duration-75">
                              <button onClick={() => { openModal(link); setOpenMenuId(null); }} className="block w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-main)]">Edit</button>
                              <button onClick={() => handleDelete(link.id)} disabled={deletingLinkId === link.id} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">{deletingLinkId === link.id ? "Deleting..." : "Delete"}</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-[var(--text-secondary)]">No WhatsApp links found for this Mandal.</td></tr>
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
            if (selectedLevel?.id && isMandalSelected) {
              void loadWhatsAppLinks({ afterAssemblyData_id: selectedLevel.id, levelType: 'Mandal' });
            } else if (stateId) {
              void loadWhatsAppLinks({ state_id: stateId, levelType: 'Mandal' });
            }
          }} 
          initialData={editingLink} 
          row={modalRow} 
          hideUserSelection={true}
        />
      </div>
    </div>
  );
}