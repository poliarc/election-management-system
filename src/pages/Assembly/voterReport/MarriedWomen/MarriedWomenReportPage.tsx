import React, { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetVotersByAssemblyPaginatedQuery, useUpdateVoterMutation } from "../../../../store/api/votersApi";
import { VoterListTable } from "../../voters/VoterListList";
import { VoterEditForm } from "../../voters/VoterListForm";
import type { VoterList, VoterListCandidate } from "../../../../types/voter";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const MarriedWomenReportPage: React.FC = () => {
    const {t} = useTranslation();
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const [selectedVoter, setSelectedVoter] = useState<VoterList | null>(null);
    const [partFrom, setPartFrom] = useState<number | undefined>();
    const [partTo, setPartTo] = useState<number | undefined>();
    const [ageFrom, setAgeFrom] = useState<number | undefined>();
    const [ageTo, setAgeTo] = useState<number | undefined>();
    const [language, setLanguage] = useState<"en" | "hi">("en");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const [updateVoter] = useUpdateVoterMutation();

    const { data: votersData, isLoading, isFetching } = useGetVotersByAssemblyPaginatedQuery(
        {
            assembly_id: assembly_id!,
            page: currentPage,
            limit: itemsPerPage,
            partFrom,
            partTo,
            ageTo,
            ageFrom,
            marriedRelation: "husband"
        },
        { skip: !assembly_id }
    );

    const marriedWomen = votersData?.data || [];
    const totalVoters = votersData?.pagination?.total || 0;
    const totalPages = votersData?.pagination?.totalPages || 1;

    // const marriedWomen = useMemo(() => {
    //     if (!votersData?.data) return [];

    //     return votersData.data.filter((voter) => {
    //         // Filter by gender - must be Female
    //         const isFemale = voter.gender === "F";
    //         if (!isFemale) return false;

    //         // Filter by relation - should be "Husband", "husband", or "पति"
    //         const relation = voter.relation?.trim() || "";
    //         const isMarried =
    //             relation.toLowerCase() === "husband" ||
    //             relation === "पति";
    //         if (!isMarried) return false;

    //         // Apply part number filter
    //         const partNo = Number(voter.part_no);
    //         const partMatch =
    //             (!partFrom || partNo >= partFrom) &&
    //             (!partTo || partNo <= partTo);
    //         if (!partMatch) return false;

    //         // Apply age filter if specified
    //         const age = voter.age || 0;
    //         const ageMatch = (!ageFrom || age >= ageFrom) && (!ageTo || age <= ageTo);

    //         return ageMatch;
    //     }).sort((a, b) => {
    //         if (a.part_no !== b.part_no) {
    //             return Number(a.part_no) - Number(b.part_no);
    //         }
    //         return Number(a.sl_no_in_part || 0) - Number(b.sl_no_in_part || 0);
    //     });
    // }, [votersData, partFrom, partTo, ageFrom, ageTo]);

    const handleReset = () => {
        setPartFrom(undefined);
        setPartTo(undefined);
        setAgeFrom(undefined);
        setAgeTo(undefined);
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
                    {t("MarriedWomenReportPage.No_assembly_selected")}
                </div>
            </div>
        );
    }

    return (
        <div className="p-1">
            <div className="mb-1 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-color)]">
                        {t("MarriedWomenReportPage.Title")}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        {t("MarriedWomenReportPage.Desc")}
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
                        {t("MarriedWomenReportPage.English")}
                    </button>
                    <button
                        onClick={() => setLanguage("hi")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${language === "hi"
                            ? "bg-indigo-600 text-white"
                            : "text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5"
                            }`}
                    >
                        Regional
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
                        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("MarriedWomenReportPage.Part_No_From")}
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
                                    {t("MarriedWomenReportPage.Part_No_To")}
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
                                    {t("MarriedWomenReportPage.Age_From")}
                                </label>
                                <input
                                    type="number"
                                    value={ageFrom || ""}
                                    onChange={(e) =>
                                        setAgeFrom(e.target.value ? Number(e.target.value) : undefined)
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Min age"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("MarriedWomenReportPage.Age_To")}
                                </label>
                                <input
                                    type="number"
                                    value={ageTo || ""}
                                    onChange={(e) =>
                                        setAgeTo(e.target.value ? Number(e.target.value) : undefined)
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Max age"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    &nbsp;
                                </label>
                                <button
                                    onClick={handleReset}
                                    className="w-full bg-[var(--bg-color)] 0 text-[var(--text-secondary)]white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                                >
                                    {t("MarriedWomenReportPage.Reset")}
                                </button>
                            </div>
                        </div>
                    </div>

                    {isLoading || isFetching ? (
                        <div className="text-center py-8">
                            <div className="text-[var(--text-secondary)]">{t("MarriedWomenReportPage.Loading")}</div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-1 text-sm text-[var(--text-secondary)] bg-pink-50 p-3 rounded-lg border border-pink-200">
                                {t("MarriedWomenReportPage.Found")} {marriedWomen.length} {t("MarriedWomenReportPage.married_women_voters")}
                                {(partFrom || partTo) && (
                                    <span> • {t("MarriedWomenReportPage.Part_No")}: {partFrom || "any"} - {partTo || "any"}</span>
                                )}
                                {(ageFrom || ageTo) && (
                                    <span> • {t("MarriedWomenReportPage.Age")}: {ageFrom || "any"} - {ageTo || "any"}</span>
                                )}
                            </div>
                            <VoterListTable
                                voters={marriedWomen}
                                onEdit={handleEdit}
                                language={language}
                            />

                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                                    <div className="text-sm text-gray-600">
                                        Showing page {currentPage} of {totalPages} • {totalVoters} total voters
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                                        >
                                            Next
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

export default MarriedWomenReportPage;


