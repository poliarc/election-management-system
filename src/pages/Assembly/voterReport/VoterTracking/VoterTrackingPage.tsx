import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import type { RootState } from "../../../../store";
import { voterTrackingApi, type VoterTrackingRecord, type VoterTrackingSummary } from "../../../../services/voterTrackingApi";

const CHANGE_TYPE_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
};

export default function VoterTrackingPage() {
  const { t } = useTranslation();
  const selectedAssignment = useSelector((state: RootState) => state.auth.selectedAssignment);
  const assembly_id = selectedAssignment?.stateMasterData_id;

  const FIELD_LABELS: Record<string, string> = {
    voter_full_name_en: t("VoterTrackingPage.Name_English"),
    voter_full_name_hi: t("VoterTrackingPage.Name_Hindi"),
    contact_number1: t("VoterTrackingPage.Contact_1"),
    contact_number2: t("VoterTrackingPage.Contact_2"),
    contact_number3: t("VoterTrackingPage.Contact_3"),
    contact_number4: t("VoterTrackingPage.Contact_4"),
    house_no_eng: t("VoterTrackingPage.House_No_Eng"),
    house_no_hi: t("VoterTrackingPage.House_No_Hindi"),
    age: t("VoterTrackingPage.Age"),
    gender: t("VoterTrackingPage.Gender"),
    family_id: t("VoterTrackingPage.Family_ID"),
    religion: t("VoterTrackingPage.Religion"),
    caste: t("VoterTrackingPage.Caste"),
    married: t("VoterTrackingPage.Married"),
    politcal_party: t("VoterTrackingPage.Political_Party"),
    education: t("VoterTrackingPage.Education"),
    profession_type: t("VoterTrackingPage.Profession"),
    shifted: t("VoterTrackingPage.Shifted"),
    shifted_address: t("VoterTrackingPage.Shifted_Address"),
    staying_outside: t("VoterTrackingPage.Staying_Outside"),
    outside_country: t("VoterTrackingPage.Outside_Country"),
  };

  const [records, setRecords] = useState<VoterTrackingRecord[]>([]);
  const [summary, setSummary] = useState<VoterTrackingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [changeType, setChangeType] = useState("");
  const [epicNo, setEpicNo] = useState("");
  const [activeTab, setActiveTab] = useState<"records" | "summary">("records");

  const fetchRecords = async (p = 1) => {
    if (!assembly_id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await voterTrackingApi.getByAssembly(assembly_id, {
        page: p, limit: 25,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        field_name: fieldName || undefined,
        change_type: changeType || undefined,
        voter_epic_no: epicNo || undefined,
      });
      setRecords(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch {
      setError("Failed to load tracking records.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!assembly_id) return;
    setSummaryLoading(true);
    try {
      const res = await voterTrackingApi.getAssemblySummary(assembly_id, {
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setSummary(res.data.data);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "records") fetchRecords(1);
    else fetchSummary();
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assembly_id, activeTab]);

  const handleSearch = () => {
    setPage(1);
    if (activeTab === "records") fetchRecords(1);
    else fetchSummary();
  };

  const handleReset = () => {
    setDateFrom(""); setDateTo(""); setFieldName(""); setChangeType(""); setEpicNo(""); setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchRecords(newPage);
  };

  if (!assembly_id) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          {t("VoterTrackingPage.No_Assembly")}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header + Tabs in same row */}
      <div className="flex items-end justify-between mb-4 border-b border-[var(--border-color)] pb-0">
        <div className="pb-3">
          <h1 className="text-2xl font-bold text-[var(--text-color)]">{t("VoterTrackingPage.Title")}</h1>
          <p className="text-[var(--text-secondary)] mt-0.5 text-sm">{t("VoterTrackingPage.Desc")}</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("records")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === "records" ? "border-indigo-600 text-indigo-600" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-color)]"}`}
          >
            {t("VoterTrackingPage.Change_Records")}
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === "summary" ? "border-indigo-600 text-indigo-600" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-color)]"}`}
          >
            {t("VoterTrackingPage.Summary")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t("VoterTrackingPage.Date_From")}</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t("VoterTrackingPage.Date_To")}</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          {activeTab === "records" && (
            <>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t("VoterTrackingPage.Field")}</label>
                <select value={fieldName} onChange={(e) => setFieldName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">{t("VoterTrackingPage.All_Fields")}</option>
                  {Object.entries(FIELD_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t("VoterTrackingPage.Change_Type")}</label>
                <select value={changeType} onChange={(e) => setChangeType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">{t("VoterTrackingPage.All_Types")}</option>
                  <option value="CREATE">{t("VoterTrackingPage.Create")}</option>
                  <option value="UPDATE">{t("VoterTrackingPage.Update")}</option>
                  <option value="DELETE">{t("VoterTrackingPage.Delete")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{t("VoterTrackingPage.EPIC_No")}</label>
                <input type="text" value={epicNo} onChange={(e) => setEpicNo(e.target.value)}
                  placeholder={t("VoterTrackingPage.Search_EPIC")}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </>
          )}
          <div className="flex gap-2">
            <button onClick={handleSearch}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition">
              {t("VoterTrackingPage.Search")}
            </button>
            <button onClick={handleReset}
              className="px-3 py-2 bg-[var(--bg-main)] text-[var(--text-secondary)] text-sm rounded-lg border border-[var(--border-color)] hover:bg-[var(--text-color)]/5 transition">
              {t("VoterTrackingPage.Reset")}
            </button>
          </div>
        </div>
      </div>

      {/* Records Tab */}
      {activeTab === "records" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px] text-[var(--text-secondary)]">
              {t("VoterTrackingPage.Loading_Records")}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
          ) : (
            <>
              <div className="text-sm text-[var(--text-secondary)] mb-2">
                {total.toLocaleString()} {t("VoterTrackingPage.Total_Records")}
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("VoterTrackingPage.Voter")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("VoterTrackingPage.EPIC_No")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("VoterTrackingPage.Field")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("VoterTrackingPage.Old_Value")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("VoterTrackingPage.New_Value")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("VoterTrackingPage.Type")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("VoterTrackingPage.Changed_By")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("VoterTrackingPage.Date_Time")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-[var(--text-secondary)]">
                          {t("VoterTrackingPage.No_Records")}
                        </td>
                      </tr>
                    ) : (
                      records.map((r) => (
                        <tr key={r.tracking_id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-main)] transition">
                          <td className="px-4 py-3 font-medium text-[var(--text-color)]">{r.voter_full_name_en}</td>
                          <td className="px-4 py-3 text-[var(--text-secondary)]">{r.voter_epic_no}</td>
                          <td className="px-4 py-3 text-[var(--text-color)]">{FIELD_LABELS[r.field_name] || r.field_name}</td>
                          <td className="px-4 py-3 text-red-500 max-w-[120px] truncate" title={r.old_value ?? "—"}>
                            {r.old_value ?? <span className="text-[var(--text-secondary)]">—</span>}
                          </td>
                          <td className="px-4 py-3 text-green-600 max-w-[120px] truncate" title={r.new_value ?? "—"}>
                            {r.new_value ?? <span className="text-[var(--text-secondary)]">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CHANGE_TYPE_COLORS[r.change_type] || "bg-gray-100 text-gray-600"}`}>
                              {r.change_type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-[var(--text-color)]">{r.changed_by_user_name}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{r.changed_by_user_level}</div>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                            {new Date(r.change_timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between bg-[var(--bg-card)] p-4 rounded-lg border border-[var(--border-color)]">
                  <div className="text-sm text-[var(--text-secondary)]">
                    {t("VoterTrackingPage.Page")} {page} {t("VoterTrackingPage.Of")} {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition text-sm">
                      {t("VoterTrackingPage.Previous")}
                    </button>
                    <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition text-sm">
                      {t("VoterTrackingPage.Next")}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Summary Tab */}
      {activeTab === "summary" && (
        <>
          {summaryLoading ? (
            <div className="flex items-center justify-center min-h-[300px] text-[var(--text-secondary)]">
              {t("VoterTrackingPage.Loading_Summary")}
            </div>
          ) : !summary ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-12 text-center text-[var(--text-secondary)]">
              {t("VoterTrackingPage.No_Summary")}
            </div>
          ) : (
            <SummaryView summary={summary} fieldLabels={FIELD_LABELS} />
          )}
        </>
      )}
    </div>
  );
}

function SummaryView({ summary, fieldLabels }: { summary: VoterTrackingSummary; fieldLabels: Record<string, string> }) {
  const { t } = useTranslation();
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t("VoterTrackingPage.Total_Changes")} value={summary.total_changes.toLocaleString()} color="indigo" />
        <StatCard label={t("VoterTrackingPage.Unique_Voters_Modified")} value={summary.unique_voters_modified.toLocaleString()} color="green" />
        <StatCard label={t("VoterTrackingPage.Users_Made_Changes")} value={summary.unique_users_made_changes.toLocaleString()} color="purple" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Most Changed Fields — collapsible */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden">
          <button
            onClick={() => setFieldsOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--text-color)]/5 transition"
          >
            <span className="font-semibold text-[var(--text-color)] text-sm">{t("VoterTrackingPage.Most_Changed_Fields")}</span>
            <svg
              className={`h-4 w-4 text-[var(--text-secondary)] transition-transform ${fieldsOpen ? "rotate-180" : "rotate-0"}`}
              viewBox="0 0 20 20" fill="none"
            >
              <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {fieldsOpen && (
            <div className="px-4 pb-4 border-t border-[var(--border-color)]">
              {summary.most_changed_fields.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-sm pt-3">{t("VoterTrackingPage.No_Data")}</p>
              ) : (
                <div className="space-y-2 pt-3">
                  {summary.most_changed_fields.map((f) => (
                    <div key={f.field_name} className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-color)]">{fieldLabels[f.field_name] || f.field_name}</span>
                      <span className="text-sm font-semibold text-indigo-600">{f.change_count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Changes by Date — collapsible */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden">
          <button
            onClick={() => setDatesOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--text-color)]/5 transition"
          >
            <span className="font-semibold text-[var(--text-color)] text-sm">{t("VoterTrackingPage.Changes_By_Date")}</span>
            <svg
              className={`h-4 w-4 text-[var(--text-secondary)] transition-transform ${datesOpen ? "rotate-180" : "rotate-0"}`}
              viewBox="0 0 20 20" fill="none"
            >
              <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {datesOpen && (
            <div className="px-4 pb-4 border-t border-[var(--border-color)]">
              {summary.changes_by_date.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-sm pt-3">{t("VoterTrackingPage.No_Data")}</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pt-3">
                  {summary.changes_by_date.map((d) => (
                    <div key={d.date} className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-secondary)]">{d.date}</span>
                      <span className="text-sm font-semibold text-[var(--text-color)]">{d.change_count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {summary.recent_changes?.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4">
          <h3 className="font-semibold text-[var(--text-color)] mb-3">{t("VoterTrackingPage.Recent_Changes")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="pb-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("VoterTrackingPage.Voter")}</th>
                  <th className="pb-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("VoterTrackingPage.Field")}</th>
                  <th className="pb-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("VoterTrackingPage.Changed_By")}</th>
                  <th className="pb-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{t("VoterTrackingPage.Date_From")}</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent_changes.map((r) => (
                  <tr key={r.tracking_id} className="border-b border-[var(--border-color)]">
                    <td className="py-2 text-[var(--text-color)]">{r.voter_full_name_en}</td>
                    <td className="py-2 text-[var(--text-secondary)]">{fieldLabels[r.field_name] || r.field_name}</td>
                    <td className="py-2 text-[var(--text-color)]">{r.changed_by_user_name}</td>
                    <td className="py-2 text-[var(--text-secondary)]">{new Date(r.change_timestamp).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color] || colorMap.indigo}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm mt-1 opacity-80">{label}</div>
    </div>
  );
}
