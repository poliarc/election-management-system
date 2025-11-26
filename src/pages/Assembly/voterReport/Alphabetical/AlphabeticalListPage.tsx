import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { VoterEditForm } from "../../voters/VoterListForm";
import { VoterListTable } from "../../voters/VoterListList";
import type { VoterList, VoterListCandidate } from "../../../../types/voter";
import toast from "react-hot-toast";
import { useUpdateVoterMutation, useGetVotersByAssemblyPaginatedQuery } from "../../../../store/api/votersApi";

export default function AlphabeticalListPage() {
    const [selectedVoter, setSelectedVoter] = useState<VoterList | null>(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(50);

    // Search/Filter states - Only Part Range for Alphabetical List
    const [partFrom, setPartFrom] = useState<number | undefined>();
    const [partTo, setPartTo] = useState<number | undefined>();
    const [language, setLanguage] = useState<"en" | "hi">("en");

    // Get assembly_id from Redux state
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const { data, isLoading, error } = useGetVotersByAssemblyPaginatedQuery(
        {
            assembly_id: assembly_id!,
            page,
            limit,
            partFrom,
            partTo
        },
        { skip: !assembly_id }
    );
    const [updateVoter] = useUpdateVoterMutation();

    const handleClearFilters = () => {
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

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-gray-600">Loading alphabetical list...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    Failed to load alphabetical list. Please try again.
                </div>
            </div>
        );
    }

    const totalPages = data?.pagination?.totalPages || 1;
    const totalVoters = data?.pagination?.total || 0;

    // Sort voters alphabetically by name
    const sortedVoters = [...(data?.data || [])].sort((a, b) => {
        const nameA = language === "hi"
            ? (a.voter_full_name_hi || a.voter_full_name_en || "")
            : (a.voter_full_name_en || "");
        const nameB = language === "hi"
            ? (b.voter_full_name_hi || b.voter_full_name_en || "")
            : (b.voter_full_name_en || "");
        return nameA.localeCompare(nameB);
    });

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Alphabetical List</h1>
                    <p className="text-gray-600 mt-1">
                        Voters sorted alphabetically by name • {totalVoters.toLocaleString()} total voters
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
                    <button
                        onClick={() => setLanguage("en")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${language === "en"
                            ? "bg-indigo-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => setLanguage("hi")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${language === "hi"
                            ? "bg-indigo-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        हिंदी
                    </button>
                </div>
            </div>

            {selectedVoter ? (
                <VoterEditForm initialValues={selectedVoter} onSubmit={handleSave} onCancel={handleCancel} />
            ) : (
                <>
                    {/* Part Range Filters */}
                    <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Part From
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Part To
                                </label>
                                <input
                                    type="number"
                                    value={partTo || ""}
                                    onChange={(e) => { setPartTo(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                    placeholder="To part no..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            {(partFrom || partTo) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </div>

                    <VoterListTable
                        voters={sortedVoters}
                        onEdit={handleEdit}
                        language={language}
                    />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-600">
                                Showing page {page} of {totalPages} • {totalVoters.toLocaleString()} total voters
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
