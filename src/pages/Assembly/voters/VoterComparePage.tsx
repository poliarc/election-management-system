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

const cardClasses =
  "rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-1";
const labelClasses = "text-xs uppercase tracking-wide text-gray-500";
const valueClasses = "text-2xl font-semibold text-gray-900";

export default function VoterComparePage() {
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
    <thead className="bg-gray-50">
      <tr>
        {columns.map((col) => (
          <th
            key={col}
            className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
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
    <div className="flex items-center justify-between border-t border-gray-200 px-2 py-3 text-sm text-gray-700">
      <span>
        Page {current} of {Math.max(totalPages, 1)}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(Math.max(1, current - 1))}
          disabled={current <= 1}
          className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onChange(Math.min(totalPages || 1, current + 1))}
          disabled={current >= (totalPages || 1)}
          className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeTab === "new") {
      const { data, isLoading, isError } = newQuery;
      if (isLoading)
        return <div className="p-4 text-gray-600">Loading new voters…</div>;
      if (isError)
        return (
          <div className="p-4 text-red-600">Failed to load new voters.</div>
        );
      const rows = data?.data ?? [];
      const pagination = data?.pagination;
      return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            {renderTableHeader([
              "EPIC",
              "Name",
              "Contact",
              "House",
              "Part",
              "Uploaded At",
            ])}
            <tbody className="divide-y divide-gray-200 text-sm text-gray-800">
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
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    No new voters found in draft.
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
        return <div className="p-4 text-gray-600">Loading missing voters…</div>;
      if (isError)
        return (
          <div className="p-4 text-red-600">Failed to load missing voters.</div>
        );
      const rows = data?.data ?? [];
      const pagination = data?.pagination;
      return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            {renderTableHeader([
              "EPIC",
              "Name",
              "Contact",
              "House",
              "Part",
              "Last Updated",
            ])}
            <tbody className="divide-y divide-gray-200 text-sm text-gray-800">
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
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    No missing voters detected.
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
          <div className="p-4 text-gray-600">Loading modified voters…</div>
        );
      if (isError)
        return (
          <div className="p-4 text-red-600">
            Failed to load modified voters.
          </div>
        );
      const rows = data?.data ?? [];
      const pagination = data?.pagination;
      return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            {renderTableHeader([
              "EPIC",
              "Master Name",
              "Draft Name",
              "Master Contact",
              "Draft Contact",
              "Differences",
            ])}
            <tbody className="divide-y divide-gray-200 text-sm text-gray-800">
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
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    No modified voters detected.
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
      return <div className="p-4 text-gray-600">Loading matched voters…</div>;
    if (isError)
      return (
        <div className="p-4 text-red-600">Failed to load matched voters.</div>
      );
    const rows = data?.data ?? [];
    const pagination = data?.pagination;
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          {renderTableHeader([
            "EPIC",
            "Name",
            "Contact",
            "House",
            "Part",
            "Match Type",
          ])}
          <tbody className="divide-y divide-gray-200 text-sm text-gray-800">
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
                <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                  No matched voters found.
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
          <h1 className="text-2xl font-semibold text-gray-900">
            Compare Voters
          </h1>
          <p className="text-sm text-gray-600">
            Draft vs Master for selected assembly
          </p>
        </div>
        {summaryQuery.isFetching && (
          <span className="text-sm text-gray-500">Refreshing…</span>
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
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-700">
          Loading summary…
        </div>
      )}
      {summaryQuery.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load comparison summary.
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
        <div className="flex gap-2 border-b border-gray-200 pb-2">
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
                  : "text-gray-700 hover:bg-gray-50"
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
