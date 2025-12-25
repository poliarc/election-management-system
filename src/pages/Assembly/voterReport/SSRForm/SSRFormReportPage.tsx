import React, { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store";
import { useGetVotersByAssemblyPaginatedQuery } from "../../../../store/api/votersApi";
import { VoterListTable } from "../../voters/VoterListList";
import { VoterEditForm } from "../../voters/VoterListForm";
import type { VoterList, VoterListCandidate } from "../../../../types/voter";
import "./SSRFormReportPage.css";

// Custom hook for responsive design
const useResponsive = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return { isMobile, isTablet };
};

const SSRFormReportPage: React.FC = () => {
    const { isMobile, isTablet } = useResponsive();
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
    const [itemsPerPage, setItemsPerPage] = useState(isMobile ? 25 : isTablet ? 40 : 50);

    // Update items per page when screen size changes
    useEffect(() => {
        const newItemsPerPage = isMobile ? 25 : isTablet ? 40 : 50;
        if (newItemsPerPage !== itemsPerPage) {
            setItemsPerPage(newItemsPerPage);
            // Recalculate current page to maintain position
            const firstVisibleItem = (currentPage - 1) * itemsPerPage + 1;
            const newPage = Math.ceil(firstVisibleItem / newItemsPerPage);
            setCurrentPage(newPage);
        }
    }, [isMobile, isTablet, itemsPerPage, currentPage]);

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-2 sm:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">SSR Form Report</h1>
                            <p className="text-blue-100 mt-1 sm:mt-2 text-sm sm:text-base">
                                Assembly: {selectedAssignment?.levelName || "N/A"}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <div className="bg-white/20 rounded-lg p-3 sm:p-4 text-center flex-1 sm:flex-none">
                                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.total}</div>
                                <div className="text-xs sm:text-sm text-blue-100">Total Voters</div>
                            </div>
                            <div className="bg-green-500/30 rounded-lg p-3 sm:p-4 text-center flex-1 sm:flex-none">
                                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.submitted}</div>
                                <div className="text-xs sm:text-sm text-blue-100">Submitted</div>
                            </div>
                            <div className="bg-red-500/30 rounded-lg p-3 sm:p-4 text-center flex-1 sm:flex-none">
                                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stats.notSubmitted}</div>
                                <div className="text-xs sm:text-sm text-blue-100">Not Submitted</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
                                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="sm:col-span-2 lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2 invisible sm:visible">
                                Actions
                            </label>
                            <button
                                onClick={handleReset}
                                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                            Voter List ({totalVoters.toLocaleString()} voters)
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setLanguage("en")}
                                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors flex-1 sm:flex-none ${language === "en"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLanguage("hi")}
                                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors flex-1 sm:flex-none ${language === "hi"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                            >
                                हिंदी
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-8 sm:py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading voters...</p>
                        </div>
                    ) : voters.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="mt-2 text-gray-500 font-medium text-sm sm:text-base">No voters found</p>
                        </div>
                    ) : (
                        <>
                            <div className="table-wrapper">
                                <VoterListTable
                                    voters={voters}
                                    onEdit={handleEdit}
                                    language={language}
                                />
                            </div>

                            {/* Ultra Responsive Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-4 sm:mt-6">
                                    {/* Mobile Pagination (< 640px) */}
                                    <div className="block sm:hidden">
                                        <div className="mobile-pagination">
                                            <div className="mobile-pagination-info">
                                                Page {currentPage} of {totalPages} • {totalVoters.toLocaleString()} voters
                                            </div>

                                            {/* Main mobile pagination controls */}
                                            <div className="mobile-pagination-buttons">
                                                <button
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className="mobile-pagination-button touch-button"
                                                    aria-label="Previous page"
                                                >
                                                    ← Prev
                                                </button>

                                                {/* Current page indicator with dropdown for quick navigation */}
                                                <div className="relative">
                                                    <select
                                                        value={currentPage}
                                                        onChange={(e) => handlePageChange(Number(e.target.value))}
                                                        className="appearance-none bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-16 text-center"
                                                        aria-label="Select page"
                                                    >
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                            <option key={page} value={page}>
                                                                {page}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className="mobile-pagination-button touch-button"
                                                    aria-label="Next page"
                                                >
                                                    Next →
                                                </button>
                                            </div>

                                            {/* Quick jump buttons for mobile */}
                                            {totalPages > 3 && (
                                                <div className="flex items-center justify-center gap-2 mt-2">
                                                    <button
                                                        onClick={() => handlePageChange(1)}
                                                        disabled={currentPage === 1}
                                                        className="px-3 py-1.5 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-button"
                                                        aria-label="First page"
                                                    >
                                                        First
                                                    </button>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <button
                                                        onClick={() => handlePageChange(totalPages)}
                                                        disabled={currentPage === totalPages}
                                                        className="px-3 py-1.5 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-button"
                                                        aria-label="Last page"
                                                    >
                                                        Last
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Desktop/Tablet Pagination (> 640px) */}
                                    <div className="hidden sm:flex items-center justify-between">
                                        <div className="text-sm text-gray-700 flex-shrink-0">
                                            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                            {Math.min(currentPage * itemsPerPage, totalVoters)} of{" "}
                                            {totalVoters.toLocaleString()} voters
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePageChange(1)}
                                                disabled={currentPage === 1}
                                                className="pagination-button touch-button"
                                                aria-label="First page"
                                            >
                                                First
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="pagination-button touch-button"
                                                aria-label="Previous page"
                                            >
                                                Previous
                                            </button>

                                            {/* Current page indicator */}
                                            <div className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                                                {currentPage}
                                            </div>

                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="pagination-button touch-button"
                                                aria-label="Next page"
                                            >
                                                Next
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(totalPages)}
                                                disabled={currentPage === totalPages}
                                                className="pagination-button touch-button"
                                                aria-label="Last page"
                                            >
                                                Last
                                            </button>
                                        </div>
                                    </div>

                                    {/* Items per page selector for larger screens */}
                                    <div className="hidden md:flex items-center justify-center mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span>Items per page:</span>
                                            <select
                                                value={itemsPerPage}
                                                onChange={(e) => {
                                                    const newItemsPerPage = Number(e.target.value);
                                                    // Calculate what page the first currently visible item would be on
                                                    const firstVisibleItem = (currentPage - 1) * itemsPerPage + 1;
                                                    const newPage = Math.ceil(firstVisibleItem / newItemsPerPage);
                                                    setCurrentPage(newPage);
                                                }}
                                                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                        </div>
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
