import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetVotersByAssemblyPaginatedQuery, useUpdateVoterMutation } from "../../../../store/api/votersApi";
import { VoterListTable } from "../../voters/VoterListList";
import { VoterEditForm } from "../../voters/VoterListForm";
import type { VoterList, VoterListCandidate } from "../../../../types/voter";
import toast from "react-hot-toast";

const AddressWiseListPage: React.FC = () => {
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const [selectedVoter, setSelectedVoter] = useState<VoterList | null>(null);
    const [searchAddress, setSearchAddress] = useState<string>("");
    const [partFrom, setPartFrom] = useState<number | undefined>();
    const [partTo, setPartTo] = useState<number | undefined>();
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [language, setLanguage] = useState<"en" | "hi">("en");

    const [updateVoter] = useUpdateVoterMutation();

    const { data: votersData, isLoading } = useGetVotersByAssemblyPaginatedQuery(
        {
            assembly_id: assembly_id!,
            page,
            limit,
            partFrom,
            partTo,
        },
        { skip: !assembly_id }
    );

    const totalPages = votersData?.pagination?.totalPages || 1;
    const totalVoters = votersData?.pagination?.total || 0;

    const filteredVoters = useMemo(() => {
        if (!votersData?.data) return [];

        return votersData.data.filter((voter) => {
            // Apply address search filter
            if (searchAddress) {
                const searchLower = searchAddress.toLowerCase();
                const townEng = voter.town_village_name_eng?.toLowerCase() || "";
                const townHin = voter.town_village_name_eng?.toLowerCase() || "";

                if (!townEng.includes(searchLower) && !townHin.includes(searchLower)) {
                    return false;
                }
            }

            return true;
        }).sort((a, b) => {
            // Sort by town/village name first, then by part number
            const townA = a.town_village_name_eng || "";
            const townB = b.town_village_name_eng || "";

            if (townA !== townB) {
                return townA.localeCompare(townB);
            }

            if (a.part_no !== b.part_no) {
                return Number(a.part_no) - Number(b.part_no);
            }

            return Number(a.sl_no_in_part || 0) - Number(b.sl_no_in_part || 0);
        });
    }, [votersData, searchAddress]);

    const handleReset = () => {
        setSearchAddress("");
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
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Address Wise List
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Search and view voters by town/village address
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
                                    Search Address (Town/Village)
                                </label>
                                <input
                                    type="text"
                                    value={searchAddress}
                                    onChange={(e) => setSearchAddress(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter town or village name"
                                />
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
                            <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                Found {filteredVoters.length} voters
                                {searchAddress && <span> • Address: "{searchAddress}"</span>}
                                {(partFrom || partTo) && (
                                    <span> • Part No: {partFrom || "any"} - {partTo || "any"}</span>
                                )}
                            </div>
                            <VoterListTable
                                voters={filteredVoters}
                                onEdit={handleEdit}
                                language={language}
                            />

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
                </>
            )}
        </div>
    );
};

export default AddressWiseListPage;
