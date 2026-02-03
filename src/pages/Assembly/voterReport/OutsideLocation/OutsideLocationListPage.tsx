import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetVotersByAssemblyPaginatedQuery, useUpdateVoterMutation } from "../../../../store/api/votersApi";
import { VoterListTable } from "../../voters/VoterListList";
import { VoterEditForm } from "../../voters/VoterListForm";
import type { VoterList, VoterListCandidate } from "../../../../types/voter";
import toast from "react-hot-toast";

const OutsideLocationListPage: React.FC = () => {
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const [selectedVoter, setSelectedVoter] = useState<VoterList | null>(null);
    const [outsideCountry, setOutsideCountry] = useState<string>("");
    const [page, setPage] = useState(1);
    const [language, setLanguage] = useState<"en" | "hi">("en");
    const itemsPerPage = 50;

    const [updateVoter] = useUpdateVoterMutation();

    // Countries list for outside country filter
    const countries = [
        "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria",
        "Bangladesh", "Belgium", "Brazil", "Canada", "China", "Denmark", "Egypt",
        "France", "Germany", "India", "Indonesia", "Iran", "Iraq", "Italy", "Japan",
        "Jordan", "Kenya", "Malaysia", "Mexico", "Netherlands", "New Zealand", "Norway",
        "Pakistan", "Philippines", "Russia", "Saudi Arabia", "Singapore", "South Africa",
        "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland", "Thailand",
        "Turkey", "United Arab Emirates", "United Kingdom", "United States", "Vietnam"
    ];

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

    // Filter voters - only show voters staying outside with country filter
    const filteredVoters = useMemo(() => {
        if (!voters) return [];

        return voters.filter((voter) => {
            // Only show voters staying outside
            if (!voter.staying_outside) return false;

            // Filter by outside country
            if (outsideCountry && voter.outside_country !== outsideCountry) {
                return false;
            }

            return true;
        }).sort((a, b) => {
            if (a.part_no !== b.part_no) {
                return Number(a.part_no) - Number(b.part_no);
            }
            return Number(a.sl_no_in_part || 0) - Number(b.sl_no_in_part || 0);
        });
    }, [voters, outsideCountry]);

    const handleReset = () => {
        setOutsideCountry("");
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
                        Outside Location Wise List
                    </h1>
                    <p className="text-gray-600 mt-1">
                        View voters staying outside their registered location
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Outside Country
                                </label>
                                <select
                                    value={outsideCountry}
                                    onChange={(e) => {
                                        setOutsideCountry(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All Countries</option>
                                    {countries.map((country) => (
                                        <option key={country} value={country}>
                                            {country}
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
                                    className="w-50 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
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
                            <div className="mb-1 text-sm text-gray-600 p-3 rounded-lg border bg-purple-50 border-purple-200">
                                Found {filteredVoters.length} voters staying outside
                                {outsideCountry && (
                                    <span> • Country: {outsideCountry}</span>
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

export default OutsideLocationListPage;
