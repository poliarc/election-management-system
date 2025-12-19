import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchBoothsByLevelSmart } from "../../services/afterAssemblyApi";
import { useAppSelector } from "../../store/hooks";
import toast from "react-hot-toast";

export default function SubLevelBooths() {
    const { levelId } = useParams<{ levelId: string }>();
    const selectedAssignment = useAppSelector((s) => s.auth.selectedAssignment);
    const [booths, setBooths] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedParentLevel, setSelectedParentLevel] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        loadBooths();
    }, [levelId, selectedAssignment]);

    const loadBooths = async () => {
        if (!levelId) return;

        try {
            setLoading(true);
            const response = await fetchBoothsByLevelSmart(
                Number(levelId),
                selectedAssignment?.levelType,
                selectedAssignment?.partyLevelName,
                selectedAssignment?.parentId
            );

            if (response.success && response.data) {
                setBooths(response.data);
            }
        } catch (error) {
            console.error("Failed to load booths:", error);
            toast.error("Failed to load booths");
        } finally {
            setLoading(false);
        }
    };

    const filteredBooths = booths.filter((booth) => {
        const matchesSearch = booth.parentLevelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booth.partyLevelName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesParentLevel = selectedParentLevel === "" || booth.parentLevelId?.toString() === selectedParentLevel;
        return matchesSearch && matchesParentLevel;
    });

    // Get unique parent levels for filter
    const uniqueParentLevels = Array.from(
        new Map(booths.map(booth => [booth.parentLevelId, booth])).values()
    );

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBooths.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBooths.length / itemsPerPage);

    return (
        <div className="p-1 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-md p-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Booth Management</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Parent Level
                        </label>
                        <select
                            value={selectedParentLevel}
                            onChange={(e) => {
                                setSelectedParentLevel(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                            <option value="">All Parent Levels</option>
                            {uniqueParentLevels.map((booth) => (
                                <option key={booth.parentLevelId} value={booth.parentLevelId}>
                                    {booth.parentLevelName} ({booth.parentLevelType})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Booths
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search booths..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600"></div>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow-md overflow-hidden overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Level</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booth Range</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booth Numbers</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Booths</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No booths found
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((booth, index) => (
                                        <tr key={booth.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {indexOfFirstItem + index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{booth.parentLevelName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-100 text-teal-800">
                                                    {booth.parentLevelType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {booth.boothFrom} - {booth.boothTo}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {booth.boothNumbers && booth.boothNumbers.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {booth.boothNumbers.map((number: number, idx: number) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                                >
                                                                    {number}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic">No booth numbers</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {booth.boothNumbers?.length || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${booth.isActive === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                    }`}>
                                                    {booth.isActive === 1 ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg mt-4">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(indexOfLastItem, filteredBooths.length)}</span> of{' '}
                                <span className="font-medium">{filteredBooths.length}</span> results
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium ${currentPage === i + 1
                                            ? 'bg-teal-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
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
}
