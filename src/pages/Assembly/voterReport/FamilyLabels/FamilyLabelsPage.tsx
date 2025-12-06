import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetVotersByAssemblyPaginatedQuery } from "../../../../store/api/votersApi";

interface FamilyLabelData {
    houseNo: string;
    partNo: string;
    totalMembers: number;
    maleCount: number;
    femaleCount: number;
    otherCount: number;
}

const FamilyLabelsPage: React.FC = () => {
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const [selectedHouseNo, setSelectedHouseNo] = useState<string>("");
    const [partFrom, setPartFrom] = useState<number | undefined>();
    const [partTo, setPartTo] = useState<number | undefined>();
    const [page, setPage] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
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

    // Extract unique house numbers
    const uniqueHouseNumbers = useMemo(() => {
        if (!votersData?.data) return [];

        const houseNumbers = new Set<string>();
        votersData.data.forEach((voter) => {
            const houseNo = voter.house_no_eng?.trim();
            if (houseNo) {
                houseNumbers.add(houseNo);
            }
        });

        return Array.from(houseNumbers).sort();
    }, [votersData]);

    // Group voters by house number and calculate statistics
    const familyLabelsData = useMemo(() => {
        if (!votersData?.data) return [];

        const grouped = new Map<string, FamilyLabelData>();

        votersData.data.forEach((voter) => {
            const houseNo = voter.house_no_eng?.trim();
            if (!houseNo) return;

            // Apply house number filter
            if (selectedHouseNo && houseNo !== selectedHouseNo) {
                return;
            }

            const partNo = voter.part_no || "";
            const key = `${partNo}-${houseNo}`;

            if (!grouped.has(key)) {
                grouped.set(key, {
                    houseNo,
                    partNo,
                    totalMembers: 0,
                    maleCount: 0,
                    femaleCount: 0,
                    otherCount: 0,
                });
            }

            const data = grouped.get(key)!;
            data.totalMembers++;

            if (voter.gender === "M") {
                data.maleCount++;
            } else if (voter.gender === "F") {
                data.femaleCount++;
            } else {
                data.otherCount++;
            }
        });

        // Convert to array and sort
        return Array.from(grouped.values()).sort((a, b) => {
            if (a.partNo !== b.partNo) {
                return Number(a.partNo) - Number(b.partNo);
            }
            return a.houseNo.localeCompare(b.houseNo);
        });
    }, [votersData, selectedHouseNo]);

    // Paginate the data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return familyLabelsData.slice(startIndex, endIndex);
    }, [familyLabelsData, currentPage]);

    const totalPages = Math.ceil(familyLabelsData.length / itemsPerPage);

    const handleReset = () => {
        setSelectedHouseNo("");
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
        <div className="p-1">
            <div className="mb-1">
                <h1 className="text-2xl font-bold text-gray-900">
                    Family Labels Report
                </h1>
                <p className="text-gray-600 mt-1">
                    View family statistics grouped by house number
                </p>
            </div>

            <div className="bg-white p-1 rounded-lg shadow mb-1">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select House Number
                        </label>
                        <select
                            value={selectedHouseNo}
                            onChange={(e) => {
                                setSelectedHouseNo(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All House Numbers</option>
                            {uniqueHouseNumbers.map((houseNo) => (
                                <option key={houseNo} value={houseNo}>
                                    {houseNo}
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
                    <div className="mb-1 text-sm text-gray-600 bg-violet-50 p-3 rounded-lg border border-violet-200">
                        Found {familyLabelsData.length} families
                        {selectedHouseNo && <span> • House No: {selectedHouseNo}</span>}
                        {(partFrom || partTo) && (
                            <span> • Part No: {partFrom || "any"} - {partTo || "any"}</span>
                        )}
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Part No
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            House No
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Members
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Male Count
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Female Count
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Other Count
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                No family data found
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item, index) => (
                                            <tr key={`${item.partNo}-${item.houseNo}-${index}`} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {item.partNo}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {item.houseNo}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-bold">
                                                    {item.totalMembers}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 font-semibold">
                                                    {item.maleCount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-pink-600 font-semibold">
                                                    {item.femaleCount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 font-semibold">
                                                    {item.otherCount}
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
                                Showing page {currentPage} of {totalPages} • {familyLabelsData.length} total families
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

export default FamilyLabelsPage;
