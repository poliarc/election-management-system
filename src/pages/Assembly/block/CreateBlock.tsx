import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    useCreateBlockMutation,
    useGetPartyLevelsByPartyQuery,
} from "../../../store/api/blockApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import toast from "react-hot-toast";

export default function CreateBlock() {
    const navigate = useNavigate();
    const [blockName, setBlockName] = useState("");
    const [levelType, setLevelType] = useState("");
    const [partyId, setPartyId] = useState<number | null>(null);
    const [createBlock, { isLoading }] = useCreateBlockMutation();

    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );

    const [assemblyInfo, setAssemblyInfo] = useState({
        assemblyName: "",
        districtName: "",
        stateName: "",
        assemblyId: 0,
    });

    useEffect(() => {
        const authUser = localStorage.getItem("auth_user");
        if (authUser) {
            try {
                const user = JSON.parse(authUser);
                setPartyId(user.partyId);
            } catch (error) {
                console.error("Error parsing auth_user:", error);
            }
        }
    }, []);

    useEffect(() => {
        if (selectedAssignment) {
            setAssemblyInfo({
                assemblyName: selectedAssignment.levelName,
                districtName: selectedAssignment.parentLevelName || "",
                stateName: "",
                assemblyId: selectedAssignment.stateMasterData_id,
            });
        }
    }, [selectedAssignment]);

    const { data: partyLevels = [] } = useGetPartyLevelsByPartyQuery(partyId!, {
        skip: !partyId,
    });

    // Find level based on user input (case-insensitive)
    const selectedLevel = levelType
        ? partyLevels.find((level) =>
            level.level_name.toLowerCase() === levelType.toLowerCase()
        )
        : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!levelType.trim()) {
            toast.error("Please enter level type");
            return;
        }

        if (!blockName.trim()) {
            toast.error("Please enter block name");
            return;
        }

        if (!assemblyInfo.assemblyId) {
            toast.error("Assembly information not found");
            return;
        }

        try {
            await createBlock({
                levelName: levelType.trim(),
                displayName: blockName.trim(),
                parentAssemblyId: assemblyInfo.assemblyId,
                partyLevelId: selectedLevel?.party_wise_id || null,
            }).unwrap();

            toast.success(`${levelType} created successfully`);
            navigate("/assembly/block");
        } catch (error: any) {
            toast.error(error?.data?.message || `Failed to create ${levelType}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold">Create New Block</h1>
                    </div>
                    <p className="text-blue-100 ml-14">Add a new block to your assembly</p>
                </div>

                {/* Context Info Card */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-blue-100">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Current Context
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg mt-1">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">District</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {assemblyInfo.districtName || "N/A"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg mt-1">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Assembly</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {assemblyInfo.assemblyName || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="levelType" className="block text-sm font-semibold text-gray-700 mb-2">
                                Level Type <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    id="levelType"
                                    value={levelType}
                                    onChange={(e) => setLevelType(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                                    placeholder="e.g., Block, Ward, Zone, etc."
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                {partyLevels.length > 0
                                    ? `Available levels: ${partyLevels.map(l => l.level_name).join(", ")}`
                                    : "Enter the level type (must match party level configuration)"
                                }
                            </p>
                        </div>

                        <div>
                            <label htmlFor="blockName" className="block text-sm font-semibold text-gray-700 mb-2">
                                Display Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    id="blockName"
                                    value={blockName}
                                    onChange={(e) => setBlockName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                                    placeholder="e.g., Badli Block 1, Central Block, etc."
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                Enter the display name for this level
                            </p>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={isLoading || !levelType.trim() || !blockName.trim()}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-semibold flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create {levelType || "Level"}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/assembly/block")}
                                disabled={isLoading}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>

                {/* Help Text */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">Quick Tips:</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-700">
                                <li>Block will be created under the current assembly</li>
                                <li>You can assign users to this block after creation</li>
                                <li>Use a descriptive name for easy identification</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
