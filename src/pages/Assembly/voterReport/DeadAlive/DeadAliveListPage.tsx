import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetVotersByAssemblyPaginatedQuery, useUpdateVoterMutation } from "../../../../store/api/votersApi";
import { VoterListTable } from "../../voters/VoterListList";
import { VoterEditForm } from "../../voters/VoterListForm";
import type { VoterList, VoterListCandidate } from "../../../../types/voter";
import toast from "react-hot-toast";

const DeadAliveListPage: React.FC = () => {
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const [selectedVoter, setSelectedVoter] = useState<VoterList | null>(null);
    const [expiredAliveStatus, setExpiredAliveStatus] = useState<string>("");
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
            limit: 1000,
            partFrom,
            partTo,
        },
        { skip: !assembly_id }
    );

    // Filter voters by expired_alive status
    const filteredVoters = useMemo(() => {
        if (!votersData?.data) return [];

        return votersData.data.filter((voter) => {
            // Filter by expired_alive status if selected
            if (expiredAliveStatus) {
                const status = voter.expired_alive?.trim();

                if (expiredAliveStatus === "Expired") {
                    // Show dead voters (expired_alive = "Expired")
                    if (status !== "Expired") return false;
                } else if (expiredAliveStatus === "Alive") {
                    // Show alive voters (expired_alive = "Alive")
                    if (status !== "Alive") return false;
                }
            }

            return true;
        }).sort((a, b) => {
            if (a.part_no !== b.part_no) {
                return Number(a.part_no) - Number(b.part_no);
            }
            return Number(a.sl_no_in_part || 0) - Number(b.sl_no_in_part || 0);
        });
    }, [votersData, expiredAliveStatus]);

    // Paginate the filtered data
    const paginatedVoters = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredVoters.slice(startIndex, endIndex);
    }, [filteredVoters, currentPage]);

    const totalPages = Math.ceil(filteredVoters.length / itemsPerPage);

    const handleReset = () => {
        setExpiredAliveStatus("");
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
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Dead/Alive List
                    </h1>
                    <p className="text-gray-600 mt-1">
                        View voters filtered by alive/deceased status
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
                <VoterEditForm
                    initialValues={selectedVoter}
                    onSubmit={handleSave}
                    onCancel={handleCancel}
                />
            ) : (
                <>
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={expiredAliveStatus}
                                    onChange={(e) => {
                                        setExpiredAliveStatus(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Voters</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Alive">Alive</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Part No From
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Part No To
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
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleReset}
                                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="text-gray-600">Loading...</div>
                        </div>
                    ) : (
                        <>
                            <div className={`mb-4 text-sm text-gray-600 p-3 rounded-lg border ${expiredAliveStatus === "Expired"
                                ? "bg-red-50 border-red-200"
                                : expiredAliveStatus === "Alive"
                                    ? "bg-green-50 border-green-200"
                                    : "bg-gray-50 border-gray-200"
                                }`}>
                                Found {filteredVoters.length} voters
                                {expiredAliveStatus && (
                                    <span> • Status: {expiredAliveStatus}</span>
                                )}
                                {(partFrom || partTo) && (
                                    <span> • Part No: {partFrom || "any"} - {partTo || "any"}</span>
                                )}
                            </div>
                            <VoterListTable
                                voters={paginatedVoters}
                                onEdit={handleEdit}
                                language={language}
                            />

                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                                    <div className="text-sm text-gray-600">
                                        Showing page {currentPage} of {totalPages} • {filteredVoters.length} total voters
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

export default DeadAliveListPage;
