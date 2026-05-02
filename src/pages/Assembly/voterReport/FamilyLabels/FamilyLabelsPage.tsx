import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetVotersByAssemblyPaginatedQuery } from "../../../../store/api/votersApi";
import { useTranslation } from "react-i18next";
// import { usePartFilterPagination } from "../../../../hooks/useFilterPagination";

interface FamilyLabelData {
    houseNo: string;
    partNo: string;
    totalMembers: number;
    maleCount: number;
    femaleCount: number;
    otherCount: number;
}

const FamilyLabelsPage: React.FC = () => {
    const {t} = useTranslation();
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const [selectedHouseNo, setSelectedHouseNo] = useState<string>("");
    const [partFrom, setPartFrom] = useState<number | undefined>();
    const [partTo, setPartTo] = useState<number | undefined>();
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(50);
    
    const { data: votersData, isLoading, isFetching } =
          useGetVotersByAssemblyPaginatedQuery(
            {
              assembly_id: assembly_id!,
              page: currentPage,
              limit,
              partFrom,
              partTo,
            },
            { skip: !assembly_id },
          );
    
        const totalPages = votersData?.pagination?.totalPages || 1;
        const totalVoters = votersData?.pagination?.total || 0;

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

    //  const { paginatedVoters, totalPages } = usePartFilterPagination({
    //         data: familyLabelsData,
    //         partFrom,
    //         partTo,
    //         currentPage,
    //         itemsPerPage,
    //     });    

    const handleReset = () => {
        setSelectedHouseNo("");
        setPartFrom(undefined);
        setPartTo(undefined);
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
                <h1 className="text-2xl font-bold text-[var(--text-color)]">
                    {t("FamilyLabelsPage.Title")}
                </h1>
                <p className="text-[var(--text-secondary)] mt-1">
                    {t("FamilyLabelsPage.Desc")}
                </p>
            </div>

            <div className="bg-[var(--bg-card)] p-1 rounded-lg shadow mb-1">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t("FamilyLabelsPage.Desc1")}
                        </label>
                        <select
                            value={selectedHouseNo}
                            onChange={(e) => {
                                setSelectedHouseNo(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">{t("FamilyLabelsPage.Desc2")}</option>
                            {uniqueHouseNumbers.map((houseNo) => (
                                <option key={houseNo} value={houseNo}>
                                    {houseNo}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t("FamilyLabelsPage.Part_No_From")}
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
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t("FamilyLabelsPage.Part_No_To")}
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
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            &nbsp;
                        </label>
                        <button
                            onClick={handleReset}
                            className="w-full bg-[var(--bg-color)] 0 text-[var(--text-secondary)] px-4 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition"
                        >
                            {t("FamilyLabelsPage.Reset")}
                        </button>
                    </div>
                </div>
            </div>

            {isLoading || isFetching ? (
                <div className="text-center py-8">
                    <div className="text-[var(--text-secondary)]">{t("FamilyLabelsPage.Loading")}</div>
                </div>
            ) : (
                <>
                    <div className="mb-1 text-sm text-[var(--text-muted)] bg-[var(--bg-card)] p-3 rounded-lg border border-violet-200">
                        Found {familyLabelsData.length} families
                        {selectedHouseNo && <span> • {t("FamilyLabelsPage.House_No:")} {selectedHouseNo}</span>}
                        {(partFrom || partTo) && (
                            <span> • {t("FamilyLabelsPage.Part_No:")} {partFrom || "any"} - {partTo || "any"}</span>
                        )}
                    </div>

                    <div className="bg-[var(--bg-card)] rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-[var(--bg-main)]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("FamilyLabelsPage.Part_No")}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("FamilyLabelsPage.House_No")}
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("FamilyLabelsPage.Total_Members")}
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("FamilyLabelsPage.Male_Count")}
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("FamilyLabelsPage.Female_Count")}
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("FamilyLabelsPage.Other_Count")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-[var(--bg-card)] divide-y divide-gray-200">
                                    {familyLabelsData.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-[var(--text-secondary)]">
                                                {t("FamilyLabelsPage.Desc3")}
                                            </td>
                                        </tr>
                                    ) : (
                                        familyLabelsData.map((item, index) => (
                                            <tr key={`${item.partNo}-${item.houseNo}-${index}`} className="hover:bg-[var(--bg-color)]/20">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-secondary)]">
                                                    {item.partNo}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-color)] font-medium">
                                                    {item.houseNo}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-[var(--text-color)] font-bold">
                                                    {item.totalMembers}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-600 font-semibold">
                                                    {item.maleCount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-pink-600 font-semibold">
                                                    {item.femaleCount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-[var(--text-secondary)] font-semibold">
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
                        <div className="mt-6 flex items-center justify-between bg-[var(--bg-card)] p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-[var(--text-secondary)]">
                                Showing page {currentPage} of {totalPages} • {totalVoters} total families
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                                >
                                    {t("FamilyLabelsPage.Previous")}
                                </button>
                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                                >
                                    {t("FamilyLabelsPage.Next")}
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



