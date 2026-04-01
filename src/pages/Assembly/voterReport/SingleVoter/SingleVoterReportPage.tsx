import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetVotersByAssemblyPaginatedQuery, useUpdateVoterMutation } from "../../../../store/api/votersApi";
import { VoterListTable } from "../../voters/VoterListList";
import { VoterEditForm } from "../../voters/VoterListForm";
import type { VoterList, VoterListCandidate } from "../../../../types/voter";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const SingleVoterReportPage: React.FC = () => {
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
    const [gender, setGender] = useState<string>("");
    const [page, setPage] = useState(1);
    const [language, setLanguage] = useState<"en" | "hi">("en");
    const itemsPerPage = 50;

    const [updateVoter] = useUpdateVoterMutation();

    const { data: votersData, isLoading, isFetching } = useGetVotersByAssemblyPaginatedQuery(
        {
            assembly_id: assembly_id!,
            page,
            limit: itemsPerPage,
            partFrom,
            partTo,
            married: 'single'
        },
        { skip: !assembly_id }
    );

    const singleVoters = useMemo(() => {
        if (!votersData?.data) return [];

        return votersData.data.filter((voter) => {
        
            // Apply part number filter
            const partNo = Number(voter.part_no);
            const partMatch =
                (!partFrom || partNo >= partFrom) &&
                (!partTo || partNo <= partTo);

            if (!partMatch) return false;

            // Apply age filter if specified
            const age = voter.age || 0;
            const ageMatch = (!ageFrom || age >= ageFrom) && (!ageTo || age <= ageTo);

            if (!ageMatch) return false;

            // Apply gender filter if specified
            const genderMatch = !gender || voter.gender === gender;

            return genderMatch;
        }).sort((a, b) => {
            if (a.part_no !== b.part_no) {
                return Number(a.part_no) - Number(b.part_no);
            }
            return Number(a.sl_no_in_part || 0) - Number(b.sl_no_in_part || 0);
        });
    }, [votersData, partFrom, partTo, ageFrom, ageTo, gender]);

    const handleReset = () => {
        setPartFrom(undefined);
        setPartTo(undefined);
        setAgeFrom(undefined);
        setAgeTo(undefined);
        setGender("");
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
                    {t("SingleVoterReportPage.No_assembly_selected")}
                </div>
            </div>
        );
    }

    return (
        <div className="p-1">
            <div className="mb-1 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-color)]">
                        {t("SingleVoterReportPage.Title")}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        {t("SingleVoterReportPage.Desc")}
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
                        {t("SingleVoterReportPage.English")}
                    </button>
                    <button
                        onClick={() => setLanguage("hi")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${language === "hi"
                            ? "bg-indigo-600 text-white"
                            : "text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5"
                            }`}
                    >
                        {t("SingleVoterReportPage.Regional")}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("SingleVoterReportPage.Part_No_From")}
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
                                    {t("SingleVoterReportPage.Part_No_To")}
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
                                    {t("SingleVoterReportPage.Age_From")}
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
                                    {t("SingleVoterReportPage.Age_To")}
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
                                    {t("SingleVoterReportPage.Gender")}
                                </label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">{t("SingleVoterReportPage.All")}</option>
                                    <option value="M">{t("SingleVoterReportPage.Male")}</option>
                                    <option value="F">{t("SingleVoterReportPage.Female")}</option>
                                    <option value="O">{t("SingleVoterReportPage.Other")}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    &nbsp;
                                </label>
                                <button
                                    onClick={handleReset}
                                    className="w-full bg-[var(--bg-color)] 0 text-[var(--text-secondary)] px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                                >
                                    {t("SingleVoterReportPage.Reset")}
                                </button>
                            </div>
                        </div>
                    </div>

                    {isLoading || isFetching ? (
                        <div className="text-center py-8">
                            <div className="text-[var(--text-secondary)]">{t("SingleVoterReportPage.Loading")}</div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-1 text-sm text-[var(--text-secondary)] bg-purple-50 p-3 rounded-lg border border-purple-200">
                                {t("SingleVoterReportPage.Found")} {singleVoters.length} single/unmarried voters {t("SingleVoterReportPage.single_unmarried_voters")}
                                {(partFrom || partTo) && (
                                    <span> • {t("SingleVoterReportPage.Part_No")}: {partFrom || "any"} - {partTo || "any"}</span>
                                )}
                                {gender && <span> • {t("SingleVoterReportPage.Gender")}: {gender === "M" ? "Male" : gender === "F" ? "Female" : "Other"}</span>}
                                {(ageFrom || ageTo) && (
                                    <span> • {t("SingleVoterReportPage.Age")}: {ageFrom || "any"} - {ageTo || "any"}</span>
                                )}
                            </div>
                            <VoterListTable
                                voters={singleVoters}
                                onEdit={handleEdit}
                                language={language}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default SingleVoterReportPage;


