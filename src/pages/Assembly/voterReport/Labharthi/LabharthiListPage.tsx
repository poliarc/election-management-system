import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetVotersByAssemblyPaginatedQuery, useUpdateVoterMutation } from "../../../../store/api/votersApi";
import { VoterListTable } from "../../voters/VoterListList";
import { VoterEditForm } from "../../voters/VoterListForm";
import type { VoterList, VoterListCandidate } from "../../../../types/voter";
import toast from "react-hot-toast";

const LabharthiListPage: React.FC = () => {
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const [selectedVoter, setSelectedVoter] = useState<VoterList | null>(null);
    const [labharthiStatus, setLabharthiStatus] = useState<string>("in_person");
    const [selectedState, setSelectedState] = useState<string>("");
    const [selectedCenter, setSelectedCenter] = useState<string>("");
    const [partFrom, setPartFrom] = useState<number | undefined>();
    const [partTo, setPartTo] = useState<number | undefined>();
    const [page, setPage] = useState(1);
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
        },
        { skip: !assembly_id }
    );

    const voters = votersData?.data || [];
    const totalVoters = votersData?.pagination?.total || 0;
    const totalPages = votersData?.pagination?.totalPages || 1;

    const uniqueStates = useMemo(() => {
        if (!voters) return [];
        const states = new Set<string>();
        voters.forEach((voter) => {
            const state = voter.labarthi_state?.trim();
            if (state) {
                states.add(state);
            }
        });
        return Array.from(states).sort();
    }, [voters]);

    const uniqueCenters = useMemo(() => {
        if (!voters) return [];
        const centers = new Set<string>();
        voters.forEach((voter) => {
            const center = voter.labarthi_center?.trim();
            if (center) {
                centers.add(center);
            }
        });
        return Array.from(centers).sort();
    }, [voters]);

    const filteredVoters = useMemo(() => {
        if (!voters) return [];

        return voters.filter((voter) => {
            if (labharthiStatus === "in_person") {
                if (!voter.labarthi_in_person) return false;
            } else if (labharthiStatus === "not_in_person") {
                if (voter.labarthi_in_person) return false;
            }

            if (selectedState && voter.labarthi_state !== selectedState) {
                return false;
            }
            if (selectedCenter && voter.labarthi_center !== selectedCenter) {
                return false;
            }
            return true;
        }).sort((a, b) => {
            if (a.part_no !== b.part_no) {
                return Number(a.part_no) - Number(b.part_no);
            }
            return Number(a.sl_no_in_part || 0) - Number(b.sl_no_in_part || 0);
        });
    }, [voters, labharthiStatus, selectedState, selectedCenter]);

    const handleReset = () => {
        setLabharthiStatus("in_person");
        setSelectedState("");
        setSelectedCenter("");
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
        <div className="p-1">
            <div className="mb-1 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Labharthi List
                    </h1>
                    <p className="text-gray-600 mt-1">
                        View voters filtered by labharthi status, state, and center
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
                    <div className="bg-white p-1 rounded-lg shadow mb-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Labharthi Status
                                </label>
                                <select
                                    value={labharthiStatus}
                                    onChange={(e) => {
                                        setLabharthiStatus(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">All Voters</option>
                                    <option value="in_person">Labharthi In Person</option>
                                    <option value="not_in_person">Not Labharthi In Person</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Labharthi State
                                </label>
                                <select
                                    value={selectedState}
                                    onChange={(e) => {
                                        setSelectedState(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All States</option>
                                    {uniqueStates.map((state) => (
                                        <option key={state} value={state}>
                                            {state}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Labharthi Center
                                </label>
                                <select
                                    value={selectedCenter}
                                    onChange={(e) => {
                                        setSelectedCenter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Centers</option>
                                    {uniqueCenters.map((center) => (
                                        <option key={center} value={center}>
                                            {center}
                                        </option>
                                    ))}
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    &nbsp;
                                </label>
                                <button
                                    onClick={handleReset}
                                    className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                                >
                                    Reset
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
                            <div className={`mb-1 text-sm text-gray-600 p-3 rounded-lg border ${labharthiStatus === "in_person"
                                ? "bg-emerald-50 border-emerald-200"
                                : labharthiStatus === "not_in_person"
                                    ? "bg-rose-50 border-rose-200"
                                    : "bg-gray-50 border-gray-200"
                                }`}>
                                Found {filteredVoters.length} voters
                                {labharthiStatus !== "all" && (
                                    <span> • Status: {labharthiStatus === "in_person" ? "Labharthi In Person" : "Not Labharthi In Person"}</span>
                                )}
                                {selectedState && <span> • State: {selectedState}</span>}
                                {selectedCenter && <span> • Center: {selectedCenter}</span>}
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

export default LabharthiListPage;
