import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetVotersByAssemblyPaginatedQuery, useUpdateVoterMutation } from "../../../../store/api/votersApi";
import { VoterListTable } from "../../voters/VoterListList";
import { VoterEditForm } from "../../voters/VoterListForm";
import type { VoterList, VoterListCandidate } from "../../../../types/voter";
import toast from "react-hot-toast";

const SingleVoterReportPage: React.FC = () => {
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

    const [updateVoter] = useUpdateVoterMutation();

    const { data: votersData, isLoading } = useGetVotersByAssemblyPaginatedQuery(
        {
            assembly_id: assembly_id!,
            page,
            limit: 1000, // Fetch more records to filter on client side
            partFrom,
            partTo,
        },
        { skip: !assembly_id }
    );

    const singleVoters = useMemo(() => {
        if (!votersData?.data) return [];

        return votersData.data.filter((voter) => {
            // Filter by married column - should be "single" (case-insensitive)
            const marriedStatus = voter.married?.toLowerCase()?.trim() || "";
            const isSingle = marriedStatus === "single";

            if (!isSingle) return false;

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
                        Single Voter Report
                    </h1>
                    <p className="text-gray-600 mt-1">
                        View single/unmarried voters (married status: single)
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
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
                                    Age From
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Age To
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Gender
                                </label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All</option>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="O">Other</option>
                                </select>
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
                            <div className="mb-4 text-sm text-gray-600 bg-purple-50 p-3 rounded-lg border border-purple-200">
                                Found {singleVoters.length} single/unmarried voters
                                {(partFrom || partTo) && (
                                    <span> • Part No: {partFrom || "any"} - {partTo || "any"}</span>
                                )}
                                {gender && <span> • Gender: {gender === "M" ? "Male" : gender === "F" ? "Female" : "Other"}</span>}
                                {(ageFrom || ageTo) && (
                                    <span> • Age: {ageFrom || "any"} - {ageTo || "any"}</span>
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
