import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetDistinctFieldsQuery, useGetVotersByAssemblyPaginatedQuery, useUpdateVoterMutation } from "../../../../store/api/votersApi";
import { VoterListTable } from "../../voters/VoterListList";
import { VoterEditForm } from "../../voters/VoterListForm";
import type { VoterList, VoterListCandidate } from "../../../../types/voter";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const BirthWiseListPage: React.FC = () => {
    const {t} = useTranslation();
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const [selectedVoter, setSelectedVoter] = useState<VoterList | null>(null);
    const [selectedDOB, setSelectedDOB] = useState<string>("");
    const [partFrom, setPartFrom] = useState<number | undefined>();
    const [partTo, setPartTo] = useState<number | undefined>();
    const [page, setPage] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [language, setLanguage] = useState<"en" | "hi">("en");
    const itemsPerPage = 50;

    const [updateVoter] = useUpdateVoterMutation();

    const { data: votersData, isLoading } = useGetVotersByAssemblyPaginatedQuery(
        {
            assembly_id: assembly_id!,
            page,
            limit: itemsPerPage,
            partFrom,
            partTo,
            voterDOB: selectedDOB

        },
        { skip: !assembly_id }
    );

    const {data: dobData} = useGetDistinctFieldsQuery({
            field: 'voter_dob' 
    })

    const totalVoters = votersData?.pagination?.total || 0;
    const totalPages = votersData?.pagination?.totalPages || 1;


    const uniqueDOBs = dobData?.data || []

    // Filter voters by selected DOB
    const filteredVoters = useMemo(() => {
        if (!votersData?.data) return [];

        return votersData.data.filter((voter) => {
            // Filter by DOB if selected
            if (selectedDOB && voter.voter_dob !== selectedDOB) {
                return false;
            }

            return true;
        }).sort((a, b) => {
            if (a.part_no !== b.part_no) {
                return Number(a.part_no) - Number(b.part_no);
            }
            return Number(a.sl_no_in_part || 0) - Number(b.sl_no_in_part || 0);
        });
    }, [votersData, selectedDOB]);

    // Paginate the filtered data
    // const paginatedVoters = useMemo(() => {
    //     const startIndex = (currentPage - 1) * itemsPerPage;
    //     const endIndex = startIndex + itemsPerPage;
    //     return filteredVoters.slice(startIndex, endIndex);
    // }, [filteredVoters, currentPage]);

    // const totalPages = Math.ceil(filteredVoters.length / itemsPerPage);

    const handleReset = () => {
        setSelectedDOB("");
        setPartFrom(undefined);
        setPartTo(undefined);
        setPage(1);
        setCurrentPage(1);
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
        <div className="p-1">
            <div className="mb-1 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-color)]">
                        {t("BirthWiseListPage.Title")}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        {t("BirthWiseListPage.Desc")}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-gray-300 rounded-lg p-1">
                    <button
                        onClick={() => setLanguage("en")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${language === "en"
                            ? "bg-indigo-600 text-white"
                            : "text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5"
                            }`}
                    >
                        {t("BirthWiseListPage.English")}
                    </button>
                    <button
                        onClick={() => setLanguage("hi")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${language === "hi"
                            ? "bg-indigo-600 text-white"
                            : "text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5"
                            }`}
                    >
                        {t("BirthWiseListPage.Regional")}
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
                    <div className="bg-[var(--bg-card)] p-1 rounded-lg shadow mb-1">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("BirthWiseListPage.Select_Date_Birth")}
                                </label>
                                <select
                                    value={selectedDOB}
                                    onChange={(e) => {
                                        setSelectedDOB(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">{t("BirthWiseListPage.All_Dates")}</option>
                                    {uniqueDOBs.map((dob) => (
                                        <option key={dob.value} value={dob.value}>
                                            {dob.value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("BirthWiseListPage.Part_No_From")}
                                </label>
                                <input
                                    type="number"
                                    value={partFrom || ""}
                                    onChange={(e) =>
                                        setPartFrom(e.target.value ? Number(e.target.value) : undefined)
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter part number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("BirthWiseListPage.Part_No_To")}
                                </label>
                                <input
                                    type="number"
                                    value={partTo || ""}
                                    onChange={(e) =>
                                        setPartTo(e.target.value ? Number(e.target.value) : undefined)
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter part number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    &nbsp;
                                </label>
                                <button
                                    onClick={handleReset}
                                    className="w-full bg-[var(--bg-color)]0 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                                >
                                    {t("BirthWiseListPage.Reset")}
                                </button>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="text-[var(--text-secondary)]">{t("BirthWiseListPage.Loading")}</div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-1 text-sm text-[var(--text-secondary)] bg-cyan-50 p-3 rounded-lg border border-cyan-200">
                                {t("BirthWiseListPage.Found")} {filteredVoters.length} {t("BirthWiseListPage.voters")}
                                {selectedDOB && <span> • {t("BirthWiseListPage.DOB")} {selectedDOB}</span>}
                                {(partFrom || partTo) && (
                                    <span> • {t("BirthWiseListPage.Part_No")} {partFrom || "any"} - {partTo || "any"}</span>
                                )}
                            </div>

                            <VoterListTable
                                voters={filteredVoters}
                                onEdit={handleEdit}
                                language={language}
                            />

                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-between bg-[var(--bg-card)] p-4 rounded-lg border border-[var(--border-color)]">
                                    <div className="text-sm text-[var(--text-secondary)]">
                                        {t("BirthWiseListPage.Showing_page")} {currentPage} {t("BirthWiseListPage.of")} {totalPages} • {totalVoters} {t("BirthWiseListPage.total_voters")}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                                        >
                                            {t("BirthWiseListPage.Previous")}
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                                        >
                                            {t("BirthWiseListPage.Next")}
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

export default BirthWiseListPage;


