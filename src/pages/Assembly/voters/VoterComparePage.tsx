import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import {
  useGetDraftCompareSummaryQuery,
  useGetDraftCompareNewQuery,
  useGetDraftCompareMissingQuery,
  useGetDraftCompareModifiedQuery,
  useGetDraftCompareMatchedQuery,
} from "../../../store/api/votersApi";
import { useTranslation } from "react-i18next";

const cardClasses =
  "rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-sm flex flex-col gap-1";
const labelClasses = "text-xs uppercase tracking-wide text-[var(--text-secondary)]";
const valueClasses = "text-2xl font-semibold text-[var(--text-color)]";

export default function VoterComparePage() {
  const {t} = useTranslation();
  const { selectedAssignment, user } = useSelector((s: RootState) => s.auth);
  const assemblyId = selectedAssignment?.stateMasterData_id;
  const partyId = user?.partyId;

  const [activeTab, setActiveTab] = useState<
    "new" | "missing" | "modified" | "matched"
  >("new");
  const [pageNew, setPageNew] = useState(1);
  const [pageMissing, setPageMissing] = useState(1);
  const [pageModified, setPageModified] = useState(1);
  const [pageMatched, setPageMatched] = useState(1);
  const limit = 20;

  const summaryQuery = useGetDraftCompareSummaryQuery(
    { assembly_id: assemblyId as number, party_id: partyId },
    { skip: !assemblyId }
  );

  const newQuery = useGetDraftCompareNewQuery(
    {
      assembly_id: assemblyId as number,
      page: pageNew,
      limit,
      party_id: partyId,
    },
    { skip: !assemblyId || activeTab !== "new" }
  );

  const missingQuery = useGetDraftCompareMissingQuery(
    { assembly_id: assemblyId as number, page: pageMissing, limit },
    { skip: !assemblyId || activeTab !== "missing" }
  );

  const modifiedQuery = useGetDraftCompareModifiedQuery(
    { assembly_id: assemblyId as number, page: pageModified, limit },
    { skip: !assemblyId || activeTab !== "modified" }
  );

  const matchedQuery = useGetDraftCompareMatchedQuery(
    { assembly_id: assemblyId as number, page: pageMatched, limit },
    { skip: !assemblyId || activeTab !== "matched" }
  );

  const summary = summaryQuery.data?.summary;

  const cards = useMemo(
    () => [
      {
        label: "Master Voters",
        value: summary?.total_master_voters ?? 0,
      },
      {
        label: "Draft Voters",
        value: summary?.total_draft_voters ?? 0,
      },
      {
        label: "Matched",
        value: summary?.matched_voters ?? 0,
      },
      {
        label: "New in Draft",
        value: summary?.new_in_draft ?? 0,
      },
      {
        label: "Missing in Draft",
        value: summary?.missing_in_draft ?? 0,
      },
      {
        label: "Modified",
        value: summary?.modified_voters ?? 0,
      },
    ],
    [summary]
  );

  if (!assemblyId) {
    return (
      <div className="p-6">
        <div className="rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700">
          No assembly selected. Please select an assembly first.
        </div>
      </div>
    );
  }

  const renderTableHeader = (columns: string[]) => (
    <thead className="bg-[var(--bg-main)]">
      <tr>
        {columns.map((col) => (
          <th
            key={col}
            className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]"
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );

  const renderPagination = (
    current: number,
    totalPages: number,
    onChange: (page: number) => void
  ) => (
    <div className="flex items-center justify-between border-t border-[var(--border-color)] px-2 py-3 text-sm text-[var(--text-secondary)]">
      <span>
        {t("Compare_Voters.Page")} {current} {t("Compare_Voters.of")} {Math.max(totalPages, 1)}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(Math.max(1, current - 1))}
          disabled={current <= 1}
          className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("Compare_Voters.Previous")}
        </button>
        <button
          onClick={() => onChange(Math.min(totalPages || 1, current + 1))}
          disabled={current >= (totalPages || 1)}
          className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("Compare_Voters.Next")}
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeTab === "new") {
      const { data, isLoading, isError } = newQuery;
      if (isLoading)
        return <div className="p-4 text-[var(--text-secondary)]">{t("Compare_Voters.Loading_new_voters")}</div>;
      if (isError)
        return (
          <div className="p-4 text-red-600">{t("Compare_Voters.Failed_load_new_voters")}</div>
        );
      const rows = data?.data ?? [];
      const pagination = data?.pagination;
      return (
        <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            {renderTableHeader([
              "EPIC",
              "Name",
              "Contact",
              "House",
              "Part",
              "Uploaded At",
            ])}
            <tbody className="divide-y divide-gray-200 text-sm text-[var(--text-color)]">
              {rows.map((item) => (
                <tr key={item.draft_id}>
                  <td className="px-4 py-2 font-medium">
                    {item.voter_id_epic_no || "-"}
                  </td>
                  <td className="px-4 py-2">{item.draft_name || "-"}</td>
                  <td className="px-4 py-2">{item.draft_contact || "-"}</td>
                  <td className="px-4 py-2">{item.draft_house || "-"}</td>
                  <td className="px-4 py-2">{item.part_no || "-"}</td>
                  <td className="px-4 py-2">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-4 text-center text-[var(--text-secondary)]"
                  >
                    {t("Compare_Voters.Desc2")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {pagination &&
            renderPagination(pageNew, pagination.totalPages, (p) => {
              setPageNew(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            })}
        </div>
      );
    }

    if (activeTab === "missing") {
      const { data, isLoading, isError } = missingQuery;
      if (isLoading)
        return <div className="p-4 text-[var(--text-secondary)]">{t("Compare_Voters.Desc3")}</div>;
      if (isError)
        return (
          <div className="p-4 text-red-600">{t("Compare_Voters.Desc4")}</div>
        );
      const rows = data?.data ?? [];
      const pagination = data?.pagination;
      return (
        <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            {renderTableHeader([
              "EPIC",
              "Name",
              "Contact",
              "House",
              "Part",
              "Last Updated",
            ])}
            <tbody className="divide-y divide-gray-200 text-sm text-[var(--text-color)]">
              {rows.map((item) => (
                <tr key={item.master_id}>
                  <td className="px-4 py-2 font-medium">
                    {item.voter_id_epic_no || "-"}
                  </td>
                  <td className="px-4 py-2">{item.master_name || "-"}</td>
                  <td className="px-4 py-2">{item.master_contact || "-"}</td>
                  <td className="px-4 py-2">{item.master_house || "-"}</td>
                  <td className="px-4 py-2">{item.part_no || "-"}</td>
                  <td className="px-4 py-2">
                    {item.last_updated
                      ? new Date(item.last_updated).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-4 text-center text-[var(--text-secondary)]"
                  >
                    {t("Compare_Voters.Desc5")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {pagination &&
            renderPagination(pageMissing, pagination.totalPages, (p) => {
              setPageMissing(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            })}
        </div>
      );
    }

    if (activeTab === "modified") {
      const { data, isLoading, isError } = modifiedQuery;
      if (isLoading)
        return (
          <div className="p-4 text-[var(--text-secondary)]">{t("Compare_Voters.Desc6")}</div>
        );
      if (isError)
        return (
          <div className="p-4 text-red-600">
            {t("Compare_Voters.Desc7")}
          </div>
        );
      const rows = data?.data ?? [];
      const pagination = data?.pagination;
      return (
        <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            {renderTableHeader([
              "EPIC",
              "Master Name",
              "Draft Name",
              "Master Contact",
              "Draft Contact",
              "Differences",
            ])}
            <tbody className="divide-y divide-gray-200 text-sm text-[var(--text-color)]">
              {rows.map((item) => (
                <tr key={`${item.master_id}-${item.draft_id}`}>
                  <td className="px-4 py-2 font-medium">
                    {item.voter_id_epic_no || "-"}
                  </td>
                  <td className="px-4 py-2">{item.master_name || "-"}</td>
                  <td className="px-4 py-2">{item.draft_name || "-"}</td>
                  <td className="px-4 py-2">{item.master_contact || "-"}</td>
                  <td className="px-4 py-2">{item.draft_contact || "-"}</td>
                  <td className="px-4 py-2">
                    {item.differences && item.differences.length > 0
                      ? item.differences.join(", ")
                      : "-"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-4 text-center text-[var(--text-secondary)]"
                  >
                    {t("Compare_Voters.Desc8")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {pagination &&
            renderPagination(pageModified, pagination.totalPages, (p) => {
              setPageModified(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            })}
        </div>
      );
    }

    const { data, isLoading, isError } = matchedQuery;
    if (isLoading)
      return <div className="p-4 text-[var(--text-secondary)]">{t("Compare_Voters.Loading_matched_voters")}</div>;
    if (isError)
      return (
        <div className="p-4 text-red-600">{t("Compare_Voters.Desc9")}</div>
      );
    const rows = data?.data ?? [];
    const pagination = data?.pagination;
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          {renderTableHeader([
            "EPIC",
            "Name",
            "Contact",
            "House",
            "Part",
            "Match Type",
          ])}
          <tbody className="divide-y divide-gray-200 text-sm text-[var(--text-color)]">
            {rows.map((item) => (
              <tr key={`${item.master_id}-${item.draft_id}`}>
                <td className="px-4 py-2 font-medium">
                  {item.voter_id_epic_no || "-"}
                </td>
                <td className="px-4 py-2">{item.voter_name || "-"}</td>
                <td className="px-4 py-2">{item.contact || "-"}</td>
                <td className="px-4 py-2">{item.house_no || "-"}</td>
                <td className="px-4 py-2">{item.part_no || "-"}</td>
                <td className="px-4 py-2">{item.match_type || "-"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-[var(--text-secondary)]">
                  {t("Compare_Voters.No_matched_voters_found")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {pagination &&
          renderPagination(pageMatched, pagination.totalPages, (p) => {
            setPageMatched(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          })}
      </div>
    );
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-color)]">
            {t("Compare_Voters.Title")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {t("Compare_Voters.Desc")}
          </p>
        </div>
        {summaryQuery.isFetching && (
          <span className="text-sm text-[var(--text-secondary)]">{t("Compare_Voters.Refreshing")}</span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className={cardClasses}>
            <span className={labelClasses}>{card.label}</span>
            <span className={valueClasses}>{card.value.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {summaryQuery.isLoading && (
        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-[var(--text-secondary)]">
          {t("Compare_Voters.Loading_summary")}
        </div>
      )}
      {summaryQuery.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {t("Compare_Voters.Desc1")}
        </div>
      )}

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-2 shadow-sm">
        <div className="flex gap-2 border-b border-[var(--border-color)] pb-2">
          {(
            [
              { key: "new", label: "New in Draft" },
              { key: "missing", label: "Missing in Draft" },
              { key: "modified", label: "Modified" },
              { key: "matched", label: "Matched" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                  : "text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="pt-3">{renderContent()}</div>
      </div>
    </div>
  );
}



