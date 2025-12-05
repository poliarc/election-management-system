import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetVotersByAssemblyPaginatedQuery } from "../../../../store/api/votersApi";
import { VoterListTable } from "../../voters/VoterListList";
import { VoterEditForm } from "../../voters/VoterListForm";
import type { VoterList, VoterListCandidate } from "../../../../types/voter";

const SSRFormReportPage: React.FC = () => {
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const [selectedVoter, setSelectedVoter] = useState<VoterList | null>(null);
    const [ssrFormStatus, setSsrFormStatus] = useState<string>("");
    const [partFrom, setPartFrom] = useState<number | undefined>();
    const [partTo, setPartTo] = useState<number | undefined>();
    const [currentPage, setCurrentPage] = useState(1);
    const [language, setLanguage] = useState<"en" | "hi">("en");
    const itemsPerPage = 50;

    const { data: votersData, isLoading } = useGetVotersByAssemblyPaginatedQuery(
        {
            assembly_id: assembly_id!,
            page: currentPage,
            limit: itemsPerPage,
            partFrom,
            partTo,
            eu_ssr_form_submitted: ssrFormStatus || undefined,
        },
        { skip: !assembly_id }
    );

    const voters = votersData?.data || [];
    const totalVoters = votersData?.pagination?.total || 0;
    const totalPages = votersData?.pagination?.totalPages || 1;

    const handleReset = () => {
        setSsrFormStatus("");
        setPartFrom(undefined);
        setPartTo(undefined);
        setCurrentPage(1);
    };

    const handleEdit = (voter: VoterList) => {
        setSelectedVoter(voter);
    };

    const handleCloseModal = () => {
        setSelectedVoter(null);
    };

    const handleSaveVoter = (updatedVoter: VoterListCandidate) => {
        // Handle save logic here if needed
        console.log("Updated voter:", updatedVoter);
        setSelectedVoter(null);
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const stats = useMemo(() => {
        if (!votersData?.data) return { total: 0, submitted: 0, notSubmitted: 0 };

        const total = votersData.data.length;
        const submitted = votersData.data.filter(v => v.eu_ssr_form_submitted === 'yes').length;
        const notSubmitted = votersData.data.filter(v => v.eu_ssr_form_submitted === 'no').length;

        return { total, submitted, notSubmitted };
    }, [votersData]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">SSR Form Report</h1>
                            <p className="text-blue-100 mt-2">
                                Assembly: {selectedAssignment?.levelName || "N/A"}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white/20 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <div className="text-sm text-blue-100">Total Voters</div>
                            </div>
                            <div className="bg-green-500/30 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold">{stats.submitted}</div>
                                <div className="text-sm text-blue-100">Submitted</div>
                            </div>
                            <div className="bg-red-500/30 rounded-lg p-4 text-center">
                                <div className="text-2xl font-bold">{stats.notSubmitted}</div>
                                <div className="text-sm text-blue-100">Not Submitted</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                SSR Form Status
                            </label>
                            <select
                                value={ssrFormStatus}
                                onChange={(e) => {
                                    setSsrFormStatus(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Status</option>
                                <option value="yes">Submitted</option>
                                <option value="no">Not Submitted</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Part From
                            </label>
                            <input
                                type="number"
                                value={partFrom || ""}
                                onChange={(e) => setPartFrom(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Start Part No"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Part To
                            </label>
                            <input
                                type="number"
                                value={partTo || ""}
                                onChange={(e) => setPartTo(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="End Part No"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleReset}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Voter List ({totalVoters.toLocaleString()} voters)
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setLanguage("en")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${language === "en"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLanguage("hi")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${language === "hi"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                            >
                                हिंदी
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-gray-600">Loading voters...</p>
                        </div>
                    ) : voters.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="mt-2 text-gray-500 font-medium">No voters found</p>
                        </div>
                    ) : (
                        <>
                            <VoterListTable
                                voters={voters}
                                onEdit={handleEdit}
                                language={language}
                            />

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                        {Math.min(currentPage * itemsPerPage, totalVoters)} of{" "}
                                        {totalVoters.toLocaleString()} voters
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-4 py-2 text-sm font-medium text-gray-700">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {selectedVoter && (
                <VoterEditForm
                    initialValues={selectedVoter}
                    onSubmit={handleSaveVoter}
                    onCancel={handleCloseModal}
                />
            )}
        </div>
    );
};

export default SSRFormReportPage;
