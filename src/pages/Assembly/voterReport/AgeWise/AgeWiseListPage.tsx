import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { VoterEditForm } from "../../voters/VoterListForm";
import { VoterListTable } from "../../voters/VoterListList";
import type { VoterList, VoterListCandidate } from "../../../../types/voter";
import toast from "react-hot-toast";
import { useUpdateVoterMutation, useGetVotersByAssemblyPaginatedQuery } from "../../../../store/api/votersApi";
import { useTranslation } from "react-i18next";

export default function AgeWiseListPage() {
    const {t} = useTranslation();
    const [selectedVoter, setSelectedVoter] = useState<VoterList | null>(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(50);

    // Filter states - Age Wise specific
    const [ageFrom, setAgeFrom] = useState<number | undefined>();
    const [ageTo, setAgeTo] = useState<number | undefined>();
    const [partFrom, setPartFrom] = useState<number | undefined>();
    const [partTo, setPartTo] = useState<number | undefined>();
    const [gender, setGender] = useState<string>("");
    const [language, setLanguage] = useState<"en" | "hi">("en");

    // Get assembly_id from Redux state
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const { data, isLoading, isFetching, error } = useGetVotersByAssemblyPaginatedQuery(
        {
            assembly_id: assembly_id!,
            page,
            limit,
            partFrom,
            partTo,
            ageTo,
            ageFrom
        },
        { skip: !assembly_id }
    );
    const [updateVoter] = useUpdateVoterMutation();

    const handleClearFilters = () => {
        setAgeFrom(undefined);
        setAgeTo(undefined);
        setPartFrom(undefined);
        setPartTo(undefined);
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
                    No assembly selected. Please select an assembly first.
                </div>
            </div>
        );
    }

    if (isLoading || isFetching) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-[var(--text-secondary)]">Loading age wise list...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    Failed to load age wise list. Please try again.
                </div>
            </div>
        );
    }

    const totalPages = data?.pagination?.totalPages || 1;
    const totalVoters = data?.pagination?.total || 0;

    // Filter voters by age and gender
    let filteredVoters = [...(data?.data || [])];

    if (ageFrom !== undefined) {
        filteredVoters = filteredVoters.filter(voter => (voter.age || 0) >= ageFrom);
    }

    if (ageTo !== undefined) {
        filteredVoters = filteredVoters.filter(voter => (voter.age || 0) <= ageTo);
    }

    if (gender) {
        filteredVoters = filteredVoters.filter(voter => voter.gender === gender);
    }

    // Sort by age (youngest to oldest)
    const sortedVoters = filteredVoters.sort((a, b) => (a.age || 0) - (b.age || 0));

    return (
        <div className="p-1">
            <div className="mb-1 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-color)]">{t("AgeWiseListPage.Title")}</h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        {t("AgeWiseListPage.Desc")} {filteredVoters.length.toLocaleString()}{t("AgeWiseListPage.voters_shown")}
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
                        {t("AgeWiseListPage.English")}
                    </button>
                    <button
                        onClick={() => setLanguage("hi")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${language === "hi"
                            ? "bg-indigo-600 text-white"
                            : "text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5"
                            }`}
                    >
                        {t("AgeWiseListPage.Regional")}
                    </button>
                </div>
            </div>

            {selectedVoter ? (
                <VoterEditForm initialValues={selectedVoter} onSubmit={handleSave} onCancel={handleCancel} />
            ) : (
                <>
                    {/* Age and Part Range Filters */}
                    <div className="mb-1 bg-[var(--bg-card)] p-1 rounded-lg border border-[var(--border-color)]">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    {t("AgeWiseListPage.Age_From")}
                                </label>
                                <input
                                    type="number"
                                    value={ageFrom || ""}
                                    onChange={(e) => { setAgeFrom(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                    placeholder="From age..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    {t("AgeWiseListPage.Age_To")}
                                </label>
                                <input
                                    type="number"
                                    value={ageTo || ""}
                                    onChange={(e) => { setAgeTo(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                    placeholder="To age..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    {t("AgeWiseListPage.Part_From")}
                                </label>
                                <input
                                    type="number"
                                    value={partFrom || ""}
                                    onChange={(e) => { setPartFrom(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                    placeholder="From part no..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    {t("AgeWiseListPage.Part_To")}
                                </label>
                                <input
                                    type="number"
                                    value={partTo || ""}
                                    onChange={(e) => { setPartTo(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                    placeholder="To part no..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    {t("AgeWiseListPage.Gender")}
                                </label>
                                <select
                                    value={gender}
                                    onChange={(e) => { setGender(e.target.value); setPage(1); }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">{t("AgeWiseListPage.All")}</option>
                                    <option value="M">{t("AgeWiseListPage.Male")}</option>
                                    <option value="F">{t("AgeWiseListPage.Female")}</option>
                                    <option value="O">{t("AgeWiseListPage.Other")}</option>
                                </select>
                            </div>
                            <div>
                                <button
                                    onClick={handleClearFilters}
                                    className="w-full px-4 py-2 bg-[var(--bg-color)] text-[var(--text-secondary)] rounded-lg hover:bg-gray-600 transition"
                                >
                                    {t("AgeWiseListPage.Reset")}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Voters Table - Sorted by Age */}
                    {sortedVoters.length > 0 ? (
                        <VoterListTable
                            voters={sortedVoters}
                            onEdit={handleEdit}
                            language={language}
                        />
                    ) : (
                        <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-12 text-center">
                            <p className="text-[var(--text-secondary)]">{t("AgeWiseListPage.Desc1")}</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between bg-[var(--bg-card)] p-4 rounded-lg border border-[var(--border-color)]">
                            <div className="text-sm text-[var(--text-secondary)]">
                                {t("AgeWiseListPage.Showing_page")} {page} {t("AgeWiseListPage.of")} {totalPages} • {totalVoters.toLocaleString()} {t("AgeWiseListPage.total_voters")}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                                >
                                    {t("AgeWiseListPage.Previous")}
                                </button>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                                >
                                    {t("AgeWiseListPage.Next")}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}


