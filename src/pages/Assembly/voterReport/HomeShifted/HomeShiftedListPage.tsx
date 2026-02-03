import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetVotersByAssemblyPaginatedQuery, useUpdateVoterMutation } from "../../../../store/api/votersApi";
import { useGetAllStateMasterDataQuery } from "../../../../store/api/stateMasterApi";
import { VoterListTable } from "../../voters/VoterListList";
import { VoterEditForm } from "../../voters/VoterListForm";
import type { VoterList, VoterListCandidate } from "../../../../types/voter";
import toast from "react-hot-toast";

const HomeShiftedListPage: React.FC = () => {
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const [selectedVoter, setSelectedVoter] = useState<VoterList | null>(null);
    const [shiftedState, setShiftedState] = useState<string>("");
    const [shiftedCity, setShiftedCity] = useState<string>("");
    const [page, setPage] = useState(1);
    const [language, setLanguage] = useState<"en" | "hi">("en");
    const itemsPerPage = 50;

    const [updateVoter] = useUpdateVoterMutation();

    // Fetch state master data for dropdowns
    const { data: stateMasterData = [] } = useGetAllStateMasterDataQuery();

    // Get states for dropdown
    const states = useMemo(() => {
        return stateMasterData.filter(item => item.levelType === "State" && item.isActive === 1);
    }, [stateMasterData]);

    // Get districts based on selected state
    const districts = useMemo(() => {
        if (!shiftedState) return [];
        const selectedState = stateMasterData.find(item =>
            item.levelType === "State" &&
            item.levelName === shiftedState &&
            item.isActive === 1
        );
        return stateMasterData.filter(item =>
            item.levelType === "District" &&
            item.isActive === 1 &&
            (selectedState ? item.ParentId === selectedState.id : false)
        );
    }, [stateMasterData, shiftedState]);

    // Reset city when state changes
    React.useEffect(() => {
        if (shiftedState) {
            setShiftedCity("");
        }
    }, [shiftedState]);

    const { data: votersData, isLoading } = useGetVotersByAssemblyPaginatedQuery(
        {
            assembly_id: assembly_id!,
            page,
            limit: itemsPerPage,
        },
        { skip: !assembly_id }
    );

    const voters = votersData?.data || [];
    const totalVoters = votersData?.pagination?.total || 0;
    const totalPages = votersData?.pagination?.totalPages || 1;

    // Filter voters - only show shifted voters with location filters
    const filteredVoters = useMemo(() => {
        if (!voters) return [];

        return voters.filter((voter) => {
            // Only show shifted voters
            if (!voter.shifted) return false;

            // Filter by shifted state
            if (shiftedState && voter.shifted_state !== shiftedState) {
                return false;
            }

            // Filter by shifted city
            if (shiftedCity && voter.shifted_city !== shiftedCity) {
                return false;
            }

            return true;
        }).sort((a, b) => {
            if (a.part_no !== b.part_no) {
                return Number(a.part_no) - Number(b.part_no);
            }
            return Number(a.sl_no_in_part || 0) - Number(b.sl_no_in_part || 0);
        });
    }, [voters, shiftedState, shiftedCity]);

    const handleReset = () => {
        setShiftedState("");
        setShiftedCity("");
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
                        Home Shifted List
                    </h1>
                    <p className="text-gray-600 mt-1">
                        View voters who have shifted their residence
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
                    <div className="bg-white p-1 rounded-lg shadow mb-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Shifted State
                                </label>
                                <select
                                    value={shiftedState}
                                    onChange={(e) => {
                                        setShiftedState(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All States</option>
                                    {states.map((state) => (
                                        <option key={state.id} value={state.levelName}>
                                            {state.levelName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Shifted District
                                </label>
                                <select
                                    value={shiftedCity}
                                    onChange={(e) => {
                                        setShiftedCity(e.target.value);
                                        setPage(1);
                                    }}
                                    disabled={!shiftedState}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <option value="">All Districts</option>
                                    {districts.map((district) => (
                                        <option key={district.id} value={district.levelName}>
                                            {district.levelName}
                                        </option>
                                    ))}
                                </select>
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
                            <div className="mb-1 text-sm text-gray-600 p-3 rounded-lg border bg-amber-50 border-amber-200">
                                Found {filteredVoters.length} shifted voters
                                {shiftedState && (
                                    <span> • State: {shiftedState}</span>
                                )}
                                {shiftedCity && (
                                    <span> • District: {shiftedCity}</span>
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

export default HomeShiftedListPage;
