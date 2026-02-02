import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetVotersByAssemblyPaginatedQuery } from "../../../../store/api/votersApi";

interface SurnameData {
    partNo: string;
    lastName: string;
    totalMale: number;
    totalFemale: number;
    totalVoters: number;
}

const SurnameReportPage: React.FC = () => {
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const [searchSurname, setSearchSurname] = useState<string>("");
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

    const surnameData = useMemo(() => {
        if (!votersData?.data) return [];

        // Group voters by part number and last name
        const grouped = new Map<string, SurnameData>();

        votersData.data.forEach((voter) => {
            const lastName = language === "en"
                ? (voter.voter_last_name_en || "").trim()
                : (voter.voter_last_name_hi || voter.voter_last_name_en || "").trim();

            if (!lastName) return;

            // Apply surname search filter
            if (searchSurname) {
                const searchLower = searchSurname.toLowerCase();
                const lastNameEn = (voter.voter_last_name_en || "").toLowerCase();
                const lastNameHi = (voter.voter_last_name_hi || "").toLowerCase();

                if (!lastNameEn.includes(searchLower) && !lastNameHi.includes(searchLower)) {
                    return;
                }
            }

            const partNo = voter.part_no || "";
            const key = `${partNo}-${lastName}`;

            if (!grouped.has(key)) {
                grouped.set(key, {
                    partNo,
                    lastName,
                    totalMale: 0,
                    totalFemale: 0,
                    totalVoters: 0,
                });
            }

            const data = grouped.get(key)!;
            data.totalVoters++;

            if (voter.gender === "M") {
                data.totalMale++;
            } else if (voter.gender === "F") {
                data.totalFemale++;
            }
        });

        // Convert to array and sort
        return Array.from(grouped.values()).sort((a, b) => {
            // Sort by part number first
            if (a.partNo !== b.partNo) {
                return Number(a.partNo) - Number(b.partNo);
            }
            // Then by last name
            return a.lastName.localeCompare(b.lastName);
        });
    }, [votersData, searchSurname, language]);

    // Paginate the surname data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return surnameData.slice(startIndex, endIndex);
    }, [surnameData, currentPage]);

    const totalPages = Math.ceil(surnameData.length / itemsPerPage);

    const handleReset = () => {
        setSearchSurname("");
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
            <div className="mb-1 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Surname Report
                    </h1>
                    <p className="text-gray-600 mt-1">
                        View voter statistics grouped by surname
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

            <div className="bg-white p-1 rounded-lg shadow mb-1">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Surname
                        </label>
                        <input
                            type="text"
                            value={searchSurname}
                            onChange={(e) => setSearchSurname(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter surname to search"
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
                    <div className="mb-1 text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
                        Found {surnameData.length} unique surnames
                        {searchSurname && <span> • Surname: "{searchSurname}"</span>}
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
                                            Last Name
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Male
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Female
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Voters
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {surnameData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                No surname data found
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((item, index) => (
                                            <tr key={`${item.partNo}-${item.lastName}-${index}`} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {item.partNo}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {item.lastName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 font-semibold">
                                                    {item.totalMale}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-pink-600 font-semibold">
                                                    {item.totalFemale}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-bold">
                                                    {item.totalVoters}
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
                                Showing page {currentPage} of {totalPages} • {surnameData.length} total surnames
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

export default SurnameReportPage;
