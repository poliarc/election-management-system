import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetVotersByAssemblyPaginatedQuery, useUpdateVoterMutation } from "../../../../store/api/votersApi";
import { VoterListTable } from "../../voters/VoterListList";
import { VoterEditForm } from "../../voters/VoterListForm";
import type { VoterList, VoterListCandidate } from "../../../../types/voter";
import toast from "react-hot-toast";

const FamilyReportPage: React.FC = () => {
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const [selectedVoter, setSelectedVoter] = useState<VoterList | null>(null);
    const [partFrom, setPartFrom] = useState<number | undefined>();
    const [partTo, setPartTo] = useState<number | undefined>();
    const [houseNo, setHouseNo] = useState<string>("");
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
            address: houseNo || undefined,
        },
        { skip: !assembly_id }
    );

    const totalPages = votersData?.pagination?.totalPages || 1;
    const totalVoters = votersData?.pagination?.total || 0;

    // Group voters by house number and part number
    const familyGroupedVoters = useMemo(() => {
        if (!votersData?.data) return [];

        const grouped = new Map<string, any[]>();
        votersData.data.forEach((voter) => {
            const key = `${voter.part_no}_${voter.house_no_eng}`;
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)?.push(voter);
        });

        // Only return families with more than 1 member
        const families: any[] = [];
        grouped.forEach((members) => {
            if (members.length > 1) {
                families.push(...members);
            }
        });

        return families.sort((a, b) => {
            if (a.part_no !== b.part_no) {
                return Number(a.part_no) - Number(b.part_no);
            }
            return a.house_no_eng.localeCompare(b.house_no_eng);
        });
    }, [votersData]);

    const handleReset = () => {
        setPartFrom(undefined);
        setPartTo(undefined);
        setHouseNo("");
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
                    <h1 className="text-2xl font-bold text-gray-900">Family Report</h1>
                    <p className="text-gray-600 mt-1">
                        View voters grouped by families (same house number)
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

            <div className="bg-white p-1 rounded-lg shadow mb-1">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
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
                            House Number
                        </label>
                        <input
                            type="text"
                            value={houseNo}
                            onChange={(e) => setHouseNo(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter house number"
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

            {selectedVoter ? (
                <VoterEditForm
                    initialValues={selectedVoter}
                    onSubmit={handleSave}
                    onCancel={handleCancel}
                />
            ) : isLoading ? (
                <div className="text-center py-8">
                    <div className="text-gray-600">Loading...</div>
                </div>
            ) : (
                <>
                    <div className="mb-1 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        Found {familyGroupedVoters.length} voters in families (houses with
                        multiple voters)
                    </div>
                    <VoterListTable
                        voters={familyGroupedVoters}
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
};

export default FamilyReportPage;
