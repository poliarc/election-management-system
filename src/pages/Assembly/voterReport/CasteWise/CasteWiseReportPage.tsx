import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetVotersByAssemblyPaginatedQuery } from "../../../../store/api/votersApi";

const CasteWiseReportPage: React.FC = () => {
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const [selectedCaste, setSelectedCaste] = useState<string>("");
    const [partFrom, setPartFrom] = useState<number | undefined>();
    const [partTo, setPartTo] = useState<number | undefined>();
    const [page, setPage] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [language, setLanguage] = useState<"en" | "hi">("en");
    const itemsPerPage = 50;

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

    // Extract unique castes from voter data
    const uniqueCastes = useMemo(() => {
        if (!votersData?.data) return [];

        const castes = new Set<string>();
        votersData.data.forEach((voter) => {
            const caste = voter.caste?.trim();
            if (caste) {
                castes.add(caste);
            }
        });

        return Array.from(castes).sort();
    }, [votersData]);

    // Filter voters by selected caste
    const filteredVoters = useMemo(() => {
        if (!votersData?.data) return [];

        return votersData.data.filter((voter) => {
            // Filter by caste if selected
            if (selectedCaste && voter.caste !== selectedCaste) {
                return false;
            }

            return true;
        }).sort((a, b) => {
            if (a.part_no !== b.part_no) {
                return Number(a.part_no) - Number(b.part_no);
            }
            return Number(a.sl_no_in_part || 0) - Number(b.sl_no_in_part || 0);
        });
    }, [votersData, selectedCaste]);

    // Paginate the filtered data
    const paginatedVoters = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredVoters.slice(startIndex, endIndex);
    }, [filteredVoters, currentPage]);

    const totalPages = Math.ceil(filteredVoters.length / itemsPerPage);

    const handleReset = () => {
        setSelectedCaste("");
        setPartFrom(undefined);
        setPartTo(undefined);
        setPage(1);
        setCurrentPage(1);
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
                        Caste Wise Report
                    </h1>
                    <p className="text-gray-600 mt-1">
                        View voters filtered by caste
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

            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Caste
                        </label>
                        <select
                            value={selectedCaste}
                            onChange={(e) => {
                                setSelectedCaste(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All Castes</option>
                            {uniqueCastes.map((caste) => (
                                <option key={caste} value={caste}>
                                    {caste}
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
                    <div className="mb-4 text-sm text-gray-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                        Found {filteredVoters.length} voters
                        {selectedCaste && <span> • Caste: {selectedCaste}</span>}
                        {(partFrom || partTo) && (
                            <span> • Part No: {partFrom || "any"} - {partTo || "any"}</span>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Part No
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Full Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Father Name
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Gender
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Age
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mobile Number
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Voter EPIC ID
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedVoters.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                                No voters found
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedVoters.map((voter) => (
                                            <tr key={voter.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {voter.part_no}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                    {language === "en"
                                                        ? voter.voter_full_name_en || "-"
                                                        : voter.voter_full_name_hi || voter.voter_full_name_en || "-"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                    {language === "en"
                                                        ? voter.relative_full_name_en || "-"
                                                        : voter.relative_full_name_hi || voter.relative_full_name_en || "-"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${voter.gender === "M"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : voter.gender === "F"
                                                            ? "bg-pink-100 text-pink-800"
                                                            : "bg-gray-100 text-gray-800"
                                                        }`}>
                                                        {voter.gender || "-"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900">
                                                    {voter.age || "-"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                    {voter.contact_number1 || "-"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                                                    {voter.voter_id_epic_no || "-"}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

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
        </div>
    );
};

export default CasteWiseReportPage;
