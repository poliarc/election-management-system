import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Download, Loader2, FileText } from "lucide-react";
import { voterTrackingApi } from "../../../../services/voterTrackingApi";
import { useGetAllStateMasterDataQuery } from "../../../../store/api/stateMasterApi";
import toast from "react-hot-toast";

export default function VoterTrackingPage() {
  const { partyId: partyIdStr } = useParams<{ partyId: string }>();
  const partyId = Number(partyIdStr) || 0;

  const [selectedStateId, setSelectedStateId] = useState<number>(0);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number>(0);
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number>(0);
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

  const canExport = () => selectedAssemblyId > 0;

  const handleExport = async () => {
    if (!canExport()) {
      toast.error("Please select an assembly first.");
      return;
    }
    setLoading(true);
    const toastId = "voter-tracking-export";
    toast.loading("Exporting voter tracking data...", { id: toastId });

    try {
      const response = await voterTrackingApi.downloadExcel(selectedAssemblyId, partyId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const assemblyName = assemblies.find((a) => a.id === selectedAssemblyId)?.levelName || selectedAssemblyId;
      const date = new Date().toISOString().split("T")[0];
      link.href = url;
      link.setAttribute('download', `voter_tracking_${assemblyName}_${date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Excel exported successfully!", { id: toastId });
    } catch (error) {
      toast.error("Export failed. Please try again.", { id: toastId });
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "w-full border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm bg-[var(--bg-main)] text-[var(--text-color)] focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="p-1 bg-[var(--bg-main)] min-h-screen">
      {/* Header */}
      <div className="mb-1">
        <h1 className="text-2xl font-bold text-[var(--text-color)]">Export Voter Tracking Data</h1>
        <p className="text-[var(--text-secondary)] mt-1 text-sm">
          Select an assembly to export voter tracking data as Excel.
        </p>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters panel */}
        <div className="lg:col-span-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-5 shadow-sm h-fit">
          <h2 className="text-sm font-semibold text-[var(--text-color)] mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block" />
            Select Location
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
                <select
                  value={selectedStateId}
                  onChange={(e) => {
                    setSelectedStateId(Number(e.target.value));
                    setSelectedDistrictId(0);
                    setSelectedAssemblyId(0);
                  }}
                  className={selectClass}
                >
                  <option value={0}>-- Select State --</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.levelName}
                    </option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">District</label>
                <select
                  value={selectedDistrictId}
                  onChange={(e) => {
                    setSelectedDistrictId(Number(e.target.value));
                    setSelectedAssemblyId(0);
                  }}
                  disabled={!selectedStateId}
                  className={selectClass}
                >
                  <option value={0}>-- Select District --</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.levelName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assembly */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">Assembly</label>
                <select
                  value={selectedAssemblyId}
                  onChange={(e) => setSelectedAssemblyId(Number(e.target.value))}
                  disabled={!selectedDistrictId}
                  className={selectClass}
                >
                  <option value={0}>-- Select Assembly --</option>
                  {assemblies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.levelName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExport}
                disabled={loading || !canExport()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export Excel
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="lg:col-span-2 space-y-4">
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
                <p className="text-xs text-[var(--text-secondary)] mb-1">District</p>
                <p className="font-semibold text-[var(--text-color)]">
                  {districts.find((d) => d.id === selectedDistrictId)?.levelName || "—"}
                </p>
              </div>
              <div className="bg-[var(--bg-main)] rounded-lg p-3 col-span-2">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Assembly</p>
                <p className="font-semibold text-[var(--text-color)]">
                  {assemblies.find((a) => a.id === selectedAssemblyId)?.levelName || "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-indigo-500/10 rounded-lg flex items-start gap-2">
              <FileText className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                Excel file will contain voter tracking data including changes, timestamps, and user information for the selected assembly.
              </p>
            </div>
          </div>

          {/* Data info */}
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[var(--text-color)] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-violet-500 rounded-full inline-block" />
              What Gets Exported
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 shrink-0"></div>
                <div>
                  <p className="font-medium text-[var(--text-color)]">Voter Changes</p>
                  <p className="text-[var(--text-secondary)] text-xs">
                    All CREATE, UPDATE, and DELETE operations on voter data
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                <div>
                  <p className="font-medium text-[var(--text-color)]">Field Tracking</p>
                  <p className="text-[var(--text-secondary)] text-xs">
                    Old and new values for each changed field
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0"></div>
                <div>
                  <p className="font-medium text-[var(--text-color)]">User Information</p>
                  <p className="text-[var(--text-secondary)] text-xs">
                    Who made the changes and when
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}