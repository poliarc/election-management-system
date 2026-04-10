import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Download, Loader2, Users, MapPin, Building2, Landmark } from "lucide-react";
import * as XLSX from "xlsx";
import { useGetAllStateMasterDataQuery } from "../../store/api/stateMasterApi";
import { boothAgentApi } from "../../modules/assembly/booth-management/services/boothAgentApi";
import type { BoothAgent } from "../../modules/assembly/booth-management/types";
import toast from "react-hot-toast";

type ExportLevel = "state" | "district" | "assembly";
type TeamCategory = "" | "Booth Inside Team" | "Booth Outside Team" | "Polling Center Support Team";

const TEAM_OPTIONS: { value: TeamCategory; label: string; color: string }[] = [
    { value: "", label: "All Teams", color: "bg-indigo-100 text-indigo-700" },
    { value: "Booth Inside Team", label: "Booth Inside Team", color: "bg-blue-100 text-blue-700" },
    { value: "Booth Outside Team", label: "Booth Outside Team", color: "bg-emerald-100 text-emerald-700" },
    { value: "Polling Center Support Team", label: "Polling Center Support Team", color: "bg-violet-100 text-violet-700" },
];

const COLUMNS = [
    "S.No", "State", "District", "Assembly", "Booth", "Polling Center", "Name", "Father Name", "Phone", "Email", "Category", "Role",

    "Android Phone", "Laptop", "Two Wheeler", "Four Wheeler", "Address", "Status",
];

function agentToRow(a: BoothAgent, idx: number): (string | number)[] {
    return [
        idx + 1, a.state_name ?? "", a.district_name ?? "", a.assembly_name ?? "",
        a.booth_name ?? "", a.polling_center_name ?? "", a.name ?? "", a.father_name ?? "", a.phone ?? "", a.email ?? "",
        a.category ?? "", a.role ?? "",

        a.android_phone ?? "", a.laptop ?? "", a.twoWheeler ?? "", a.fourWheeler ?? "",
        a.address ?? "", a.status === 1 ? "Active" : "Inactive",
    ];
}

const COL_WIDTHS = [6, 20, 18, 14, 24, 22, 24, 16, 16, 20, 22, 16, 14, 10, 14, 14, 28, 10];

function makeSummarySheet(entries: { name: string; agents: BoothAgent[] }[]) {
    const rows: (string | number)[][] = [
        ["Name", "Total Agents", "Booth Inside Team", "Booth Outside Team", "Polling Center Support Team", "Active", "Inactive"],
        ...entries.map(({ name, agents }) => [
            name,
            agents.length,
            agents.filter((a) => a.category === "Booth Inside Team").length,
            agents.filter((a) => a.category === "Booth Outside Team").length,
            agents.filter((a) => a.category === "Polling Center Support Team").length,
            agents.filter((a) => a.status === 1).length,
            agents.filter((a) => a.status !== 1).length,
        ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 20 }, { wch: 22 }, { wch: 30 }, { wch: 10 }, { wch: 10 }];
    return ws;
}

function makeDataSheet(agents: BoothAgent[], headerLabel: string) {
    const rows: (string | number)[][] = [
        [headerLabel],
        [],
        COLUMNS,
        ...agents.map((a, i) => agentToRow(a, i)),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = COLUMNS.map((_, i) => ({ wch: COL_WIDTHS[i] || 14 }));
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: COLUMNS.length - 1 } }];
    return ws;
}

/** Single-location export — Summary sheet + one Data sheet */
function downloadSingleSheet(agents: BoothAgent[], sheetName: string, filename: string) {
    const wb = XLSX.utils.book_new();
    // Summary
    XLSX.utils.book_append_sheet(wb, makeSummarySheet([{ name: sheetName, agents }]), "Summary");
    // Data
    const safe = sheetName.replace(/[\\/*?[\]:]/g, "").slice(0, 31);
    XLSX.utils.book_append_sheet(wb, makeDataSheet(agents, sheetName), safe || "Data");
    XLSX.writeFile(wb, filename);
}

/**
 * Multi-assembly export: Summary sheet + one sheet per assembly
 */
function downloadMultiAssemblyExcel(
    assemblyDataMap: { assemblyName: string; agents: BoothAgent[] }[],
    filename: string
) {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    XLSX.utils.book_append_sheet(
        wb,
        makeSummarySheet(assemblyDataMap.map(({ assemblyName, agents }) => ({ name: assemblyName, agents }))),
        "Summary"
    );

    // One sheet per assembly
    for (const { assemblyName, agents } of assemblyDataMap) {
        const safe = assemblyName.replace(/[\\/*?[\]:]/g, "").slice(0, 31);
        XLSX.utils.book_append_sheet(wb, makeDataSheet(agents, `Assembly: ${assemblyName}`), safe || "Assembly");
    }

    XLSX.writeFile(wb, filename);
}

const levelConfig = {
    assembly: { label: "Assembly", icon: Landmark, color: "from-emerald-500 to-teal-600" },
    district: { label: "District", icon: Building2, color: "from-blue-500 to-cyan-600" },
    state: { label: "State", icon: MapPin, color: "from-indigo-500 to-indigo-700" },

};

const ExportBoothAgentsPage: React.FC = () => {
    const { partyId: partyIdStr } = useParams<{ partyId: string }>();
    const partyId = Number(partyIdStr) || 0;

    const [level, setLevel] = useState<ExportLevel>("state");
    const [selectedStateId, setSelectedStateId] = useState<number>(0);
    const [selectedDistrictId, setSelectedDistrictId] = useState<number>(0);
    const [selectedAssemblyId, setSelectedAssemblyId] = useState<number>(0); // 0 = all assemblies in district
    const [selectedTeam, setSelectedTeam] = useState<TeamCategory>("");
    const [loading, setLoading] = useState(false);

    const { data: allData = [], isLoading: masterLoading } = useGetAllStateMasterDataQuery();

    const states = useMemo(
        () => allData.filter((d) => d.levelType === "State" && d.isActive === 1),
        [allData]
    );
    const districts = useMemo(
        () => allData.filter((d) =>
            d.levelType === "District" && d.isActive === 1 &&
            (selectedStateId ? (d.ParentId === selectedStateId || d.parentId === selectedStateId) : true)
        ), [allData, selectedStateId]
    );
    const assemblies = useMemo(
        () => allData.filter((d) =>
            d.levelType === "Assembly" && d.isActive === 1 &&
            (selectedDistrictId ? (d.ParentId === selectedDistrictId || d.parentId === selectedDistrictId) : true)
        ), [allData, selectedDistrictId]
    );

    const canExport = () => {
        if (level === "state") return selectedStateId > 0;
        if (level === "district") return selectedDistrictId > 0;
        // assembly tab: need at least district selected
        return selectedDistrictId > 0;
    };

    const filterByTeam = (agents: BoothAgent[]) =>
        selectedTeam ? agents.filter((a) => a.category === selectedTeam) : agents;

    const fetchAssemblyAgents = async (assemblyId: number): Promise<BoothAgent[]> => {
        let agents: BoothAgent[] = [];
        let page = 1, totalPages = 1;
        do {
            const res = await boothAgentApi.getAgentsByAssembly(assemblyId, { partyId, page, limit: 100 });
            agents = [...agents, ...(Array.isArray(res.data) ? res.data : [])];
            totalPages = res.pagination?.totalPages || 1;
            page++;
        } while (page <= totalPages);
        return agents;
    };

    const handleExport = async () => {
        if (!canExport()) { toast.error("Please select a location first."); return; }
        setLoading(true);
        const toastId = "booth-export";
        toast.loading("Fetching booth agents...", { id: toastId });

        try {
            const date = new Date().toISOString().split("T")[0];
            const teamSuffix = selectedTeam ? `_${selectedTeam.replace(/\s+/g, "_")}` : "";

            if (level === "state") {
                const res = await boothAgentApi.getStateStats(selectedStateId, partyId);
                const agents = filterByTeam(res.all_agents || []);
                if (!agents.length) { toast.error("No agents found.", { id: toastId }); return; }
                const name = states.find((s) => s.id === selectedStateId)?.levelName || selectedStateId;
                downloadSingleSheet(agents, String(name), `booth_agents_state_${name}${teamSuffix}_${date}.xlsx`);
                toast.success(`Exported ${agents.length} agents`, { id: toastId });

            } else if (level === "district") {
                const res = await boothAgentApi.getDistrictStats(selectedDistrictId, partyId);
                const agents = filterByTeam(res.all_agents || []);
                if (!agents.length) { toast.error("No agents found.", { id: toastId }); return; }
                const name = districts.find((d) => d.id === selectedDistrictId)?.levelName || selectedDistrictId;
                downloadSingleSheet(agents, String(name), `booth_agents_district_${name}${teamSuffix}_${date}.xlsx`);
                toast.success(`Exported ${agents.length} agents`, { id: toastId });

            } else {
                // Assembly tab
                const districtName = districts.find((d) => d.id === selectedDistrictId)?.levelName || "District";

                if (selectedAssemblyId > 0) {
                    // Single assembly selected
                    const agents = filterByTeam(await fetchAssemblyAgents(selectedAssemblyId));
                    if (!agents.length) { toast.error("No agents found.", { id: toastId }); return; }
                    const name = assemblies.find((a) => a.id === selectedAssemblyId)?.levelName || selectedAssemblyId;
                    downloadSingleSheet(agents, String(name), `booth_agents_assembly_${name}${teamSuffix}_${date}.xlsx`);
                    toast.success(`Exported ${agents.length} agents`, { id: toastId });
                } else {
                    // All assemblies in district — multi-sheet Excel
                    const assemblyList = assemblies; // already filtered by selectedDistrictId
                    if (!assemblyList.length) { toast.error("No assemblies found in this district.", { id: toastId }); return; }

                    toast.loading(`Fetching data for ${assemblyList.length} assemblies...`, { id: toastId });

                    const assemblyDataMap: { assemblyName: string; agents: BoothAgent[] }[] = [];
                    for (let i = 0; i < assemblyList.length; i++) {
                        const asm = assemblyList[i];
                        toast.loading(`Fetching assembly ${i + 1}/${assemblyList.length}: ${asm.levelName}`, { id: toastId });
                        const agents = filterByTeam(await fetchAssemblyAgents(asm.id));
                        assemblyDataMap.push({ assemblyName: asm.levelName, agents });
                    }

                    const totalAgents = assemblyDataMap.reduce((s, d) => s + d.agents.length, 0);
                    if (!totalAgents) { toast.error("No agents found.", { id: toastId }); return; }

                    downloadMultiAssemblyExcel(
                        assemblyDataMap,
                        `booth_agents_${districtName}_all_assemblies${teamSuffix}_${date}.xlsx`
                    );
                    toast.success(`Exported ${totalAgents} agents across ${assemblyList.length} assemblies`, { id: toastId });
                }
            }
        } catch (err) {
            toast.error("Export failed. Please try again.", { id: toastId });
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Dynamic button label
    const exportBtnLabel = useMemo(() => {
        if (loading) return "Exporting...";
        if (selectedTeam) return `Export — ${selectedTeam}`;
        return "Export All Teams";
    }, [loading, selectedTeam]);

    const selectClass = "w-full border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg-main)] text-[var(--text-color)] focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed";

    return (
        <div className="p-1 bg-[var(--bg-main)] min-h-screen">
            {/* Header */}
            <div className="mb-1">
                <h1 className="text-2xl font-bold text-[var(--text-color)]">Export Booth Agents</h1>
                <p className="text-[var(--text-secondary)] mt-1 text-sm">
                    Select level, location and team to export booth management data as Excel.
                </p>
            </div>

            {/* Level selector cards */}
            <div className="grid grid-cols-3 gap-4 mb-1">
                {(Object.entries(levelConfig) as [ExportLevel, typeof levelConfig.state][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const active = level === key;
                    return (
                        <button
                            key={key}
                            onClick={() => {
                                setLevel(key);
                                setSelectedStateId(0); setSelectedDistrictId(0);
                                setSelectedAssemblyId(0); setSelectedTeam("");
                            }}
                            className={[
                                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                                active
                                    ? `border-indigo-500 bg-gradient-to-br ${cfg.color} text-white shadow-md`
                                    : "border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-color)] hover:border-indigo-300 hover:shadow-sm",
                            ].join(" ")}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-white/20" : "bg-indigo-100"}`}>
                                <Icon className={`w-5 h-5 ${active ? "text-white" : "text-indigo-600"}`} />
                            </div>
                            <div>
                                <p className={`font-semibold text-sm ${active ? "text-white" : "text-[var(--text-color)]"}`}>{cfg.label}</p>
                                <p className={`text-xs mt-0.5 ${active ? "text-white/70" : "text-[var(--text-secondary)]"}`}>
                                    Export by {cfg.label.toLowerCase()}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Filters panel */}
                <div className="lg:col-span-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-5 shadow-sm h-fit">
                    <h2 className="text-sm font-semibold text-[var(--text-color)] mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block" />
                        Filter Options
                    </h2>

                    {masterLoading ? (
                        <div className="flex items-center justify-center py-8 gap-2 text-[var(--text-secondary)]">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Loading...</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* State */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">State</label>
                                <select value={selectedStateId} onChange={(e) => { setSelectedStateId(Number(e.target.value)); setSelectedDistrictId(0); setSelectedAssemblyId(0); }} className={selectClass}>
                                    <option value={0}>-- Select State --</option>
                                    {states.map((s) => <option key={s.id} value={s.id}>{s.levelName}</option>)}
                                </select>
                            </div>

                            {/* District */}
                            {(level === "district" || level === "assembly") && (
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">District</label>
                                    <select value={selectedDistrictId} onChange={(e) => { setSelectedDistrictId(Number(e.target.value)); setSelectedAssemblyId(0); }} disabled={!selectedStateId} className={selectClass}>
                                        <option value={0}>-- Select District --</option>
                                        {districts.map((d) => <option key={d.id} value={d.id}>{d.levelName}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Assembly — optional, 0 = all */}
                            {level === "assembly" && (
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                                        Assembly <span className="normal-case text-[var(--text-secondary)]">(optional — blank = all)</span>
                                    </label>
                                    <select value={selectedAssemblyId} onChange={(e) => setSelectedAssemblyId(Number(e.target.value))} disabled={!selectedDistrictId} className={selectClass}>
                                        <option value={0}>-- All Assemblies --</option>
                                        {assemblies.map((a) => <option key={a.id} value={a.id}>{a.levelName}</option>)}
                                    </select>
                                    {selectedDistrictId > 0 && selectedAssemblyId === 0 && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                                            <span>⚠</span> All {assemblies.length} assemblies will be exported as separate sheets.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Team filter */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                                    Team <span className="normal-case text-[var(--text-secondary)]">(optional)</span>
                                </label>
                                <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value as TeamCategory)} className={selectClass}>
                                    {TEAM_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>

                            <button
                                onClick={handleExport}
                                disabled={loading || !canExport()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {loading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" />{exportBtnLabel}</>
                                    : <><Download className="w-4 h-4" />{exportBtnLabel}</>
                                }
                            </button>
                        </div>
                    )}
                </div>

                {/* Info panel */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Team cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {TEAM_OPTIONS.filter((t) => t.value !== "").map((team) => (
                            <button
                                key={team.value}
                                onClick={() => setSelectedTeam(selectedTeam === team.value ? "" : team.value as TeamCategory)}
                                className={[
                                    "p-4 rounded-xl border-2 text-left transition-all",
                                    selectedTeam === team.value
                                        ? "border-indigo-500 bg-indigo-500/10 shadow-sm"
                                        : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-300",
                                ].join(" ")}
                            >
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-2 ${team.color}`}>
                                    <Users className="w-3 h-3" />
                                    {selectedTeam === team.value ? "Selected ✓" : "Click to filter"}
                                </div>
                                <p className="text-sm font-semibold text-[var(--text-color)]">{team.label}</p>
                            </button>
                        ))}
                    </div>

                    {/* Summary box */}
                    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-[var(--text-color)] mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block" />
                            Export Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-[var(--bg-main)] rounded-lg p-3">
                                <p className="text-xs text-[var(--text-secondary)] mb-1">State</p>
                                <p className="font-semibold text-[var(--text-color)]">
                                    {states.find((s) => s.id === selectedStateId)?.levelName || "—"}
                                </p>
                            </div>
                            <div className="bg-[var(--bg-main)] rounded-lg p-3">
                                <p className="text-xs text-[var(--text-secondary)] mb-1">
                                    {level === "assembly" ? "Assembly" : level === "district" ? "District" : "Location"}
                                </p>
                                <p className="font-semibold text-[var(--text-color)]">
                                    {level === "district"
                                        ? districts.find((d) => d.id === selectedDistrictId)?.levelName || "—"
                                        : level === "assembly"
                                            ? selectedAssemblyId > 0
                                                ? assemblies.find((a) => a.id === selectedAssemblyId)?.levelName || "—"
                                                : selectedDistrictId > 0 ? `All ${assemblies.length} Assemblies` : "—"
                                            : "All Districts"}
                                </p>
                            </div>
                            <div className="bg-[var(--bg-main)] rounded-lg p-3">
                                <p className="text-xs text-[var(--text-secondary)] mb-1">Level</p>
                                <p className="font-semibold text-[var(--text-color)] capitalize">{level}</p>
                            </div>
                            <div className="bg-[var(--bg-main)] rounded-lg p-3">
                                <p className="text-xs text-[var(--text-secondary)] mb-1">Team</p>
                                <p className="font-semibold text-[var(--text-color)]">{selectedTeam || "All Teams"}</p>
                            </div>

                        </div>

                        <div className="mt-4 p-3 bg-indigo-500/10 rounded-lg flex items-start gap-2">
                            <Users className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-indigo-700 dark:text-indigo-300">
                                {level === "assembly" && selectedAssemblyId === 0 && selectedDistrictId > 0
                                    ? `Excel file will have ${assemblies.length} sheets (one per assembly) + a Summary sheet.`
                                    : selectedTeam
                                        ? `Only "${selectedTeam}" agents will be exported.`
                                        : "All 3 teams will be exported."}
                            </p>
                        </div>
                    </div>

                    {/* CSV columns info */}
                    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-[var(--text-color)] mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-4 bg-violet-500 rounded-full inline-block" />
                            Excel Columns ({COLUMNS.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {COLUMNS.map((col) => (
                                <span key={col} className="px-2.5 py-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md text-xs text-[var(--text-secondary)]">
                                    {col}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportBoothAgentsPage;
