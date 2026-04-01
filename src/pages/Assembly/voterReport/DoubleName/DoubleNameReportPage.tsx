import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import {
  useGetVotersByAssemblyPaginatedQuery,
  useUpdateVoterMutation,
} from "../../../../store/api/votersApi";
import { VoterListTable } from "../../voters/VoterListList";
import { VoterEditForm } from "../../voters/VoterListForm";
import type { VoterList, VoterListCandidate } from "../../../../types/voter";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
// import { usePartFilterPagination } from "../../../../hooks/useFilterPagination";

const DoubleNameReportPage: React.FC = () => {
  const selectedAssignment = useSelector(
    (state: RootState) => state.auth.selectedAssignment,
  );
  const assembly_id = selectedAssignment?.stateMasterData_id;
  const {t} = useTranslation();

  const [selectedVoter, setSelectedVoter] = useState<VoterList | null>(null);
  const [partFrom, setPartFrom] = useState<number | undefined>();
  const [partTo, setPartTo] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [limit] = useState(50);

  const [updateVoter] = useUpdateVoterMutation();

  // get all voters by assembly
  const { data: votersData, isLoading } = useGetVotersByAssemblyPaginatedQuery(
    {
      assembly_id: assembly_id!,
      page,
      limit,
      partFrom,
      partTo,
    },
    { skip: !assembly_id },
  );

  const totalPages = votersData?.pagination?.totalPages || 1;

  // filter for duplicate names
  const duplicateVoters = useMemo(() => {
    if (!votersData?.data) return [];

    const nameMap = new Map<string, any[]>();

    votersData.data.forEach((voter) => {
      // English name
      const enName =
        voter.voter_full_name_en?.trim() ||
        `${voter.voter_first_name_en || ""} ${voter.voter_last_name_en || ""}`.trim();

      // Hindi name
      const hiName =
        voter.voter_full_name_hi?.trim() ||
        `${voter.voter_first_name_hi || ""} ${voter.voter_last_name_hi || ""}`.trim();

      const nameKey = `${enName.toLowerCase()}_${hiName.toLowerCase()}`;
      if (!nameMap.has(nameKey)) {
        nameMap.set(nameKey, []);
      }
      nameMap.get(nameKey)?.push(voter);
    });

    const duplicates: any[] = [];
    nameMap.forEach((voters) => {
      if (voters.length > 1) {
        duplicates.push(...voters);
      }
    });

    return duplicates.sort((a, b) => {
      const nameA = a.voter_full_name_en || a.voter_full_name_hi || "";
      const nameB = b.voter_full_name_en || b.voter_full_name_hi || "";
      return nameA.localeCompare(nameB);
    });
  }, [votersData]);

  const handleReset = () => {
    setPartFrom(undefined);
    setPartTo(undefined);
    setPage(1);
  };

  const handleEdit = (voter: VoterList) => {
    setSelectedVoter(voter);
  };

  const handleSave = async (updatedVoter: VoterListCandidate) => {
    try {
      if (selectedVoter?.id) {
        await updateVoter({ id: selectedVoter.id, ...updatedVoter }).unwrap();
        toast.success("Voter updated successfully");
        setSelectedVoter(null);
      }
    } catch (err) {
      toast.error("Failed to update voter");
    }
  };

  const handleCancel = () => {
    setSelectedVoter(null);
  };

  if (!assembly_id) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          No assembly selected. Please select an assembly first.
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 bg-[var(--bg-card)]">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">
            {t("DoubleNameReportPage.Title")}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {t("DoubleNameReportPage.Desc")}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => setLanguage("en")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              language === "en"
                ? "bg-indigo-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {t("DoubleNameReportPage.English")}
          </button>
          <button
            onClick={() => setLanguage("hi")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              language === "hi"
                ? "bg-indigo-600 text-white"
                : "text-[var(--text-secondary)] hover:bg-gray-100"
            }`}
          >
            {t("DoubleNameReportPage.Regional")}
          </button>
        </div>
      </div>

      {selectedVoter ? (
        <VoterEditForm
          initialValues={selectedVoter}
          onSubmit={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <div className="bg-[var(--bg-color)] p-1 rounded-lg shadow mb-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {t("DoubleNameReportPage.Part_No_From")}
                </label>
                <input
                  type="number"
                  value={partFrom || ""}
                  onChange={(e) =>
                    setPartFrom(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter part number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  {t("DoubleNameReportPage.Part_No_To")}
                </label>
                <input
                  type="number"
                  value={partTo || ""}
                  onChange={(e) =>
                    setPartTo(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter part number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  &nbsp;
                </label>
                <button
                  onClick={handleReset}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  {t("DoubleNameReportPage.Reset")}
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">Loading...</div>
            </div>
          ) : (
            <>
              <div className="mb-1 text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <strong>
                  ⚠️ {t("DoubleNameReportPage.Found")} {duplicateVoters.length} {t("DoubleNameReportPage.Desc1")}
                </strong>
                <br />
                {t("DoubleNameReportPage.Desc2")}
              </div>
              <VoterListTable
                voters={duplicateVoters}
                onEdit={handleEdit}
                language={language}
              />

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between bg-[var(--bg-color)] p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-[var(--text-secondary)]">
                    {t("DoubleNameReportPage.Showing_page")} {page} {t("DoubleNameReportPage.of")} {totalPages} • {duplicateVoters.length}{" "}
                    {t("DoubleNameReportPage.total_voters")}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                    >
                      {t("DoubleNameReportPage.Previous")}
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                    >
                      {t("DoubleNameReportPage.Next")}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default DoubleNameReportPage;