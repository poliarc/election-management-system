import { useState, useEffect } from "react";
import { useGetBlocksByAssemblyQuery } from "../../../store/api/blockApi";
import { useGetBlockHierarchyQuery } from "../../../store/api/blockTeamApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useDeleteAssignedLevelsMutation } from "../../../store/api/afterAssemblyApi";
import AssignBoothVotersModal from "../../../components/AssignBoothVotersModal";

export default function MandalList() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
    const [selectedMandalFilter, setSelectedMandalFilter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedMandalId, setSelectedMandalId] = useState<number | null>(null);
    const [selectedMandalName, setSelectedMandalName] = useState<string>("");
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [showAssignVotersModal, setShowAssignVotersModal] = useState(false);
    const [selectedMandalForVoters, setSelectedMandalForVoters] = useState<{ id: number; name: string } | null>(null);

    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );

    const [assemblyInfo, setAssemblyInfo] = useState({
        assemblyName: "",
        districtName: "",
        assemblyId: 0,
        stateId: 0,
        districtId: 0,
    });

    useEffect(() => {
        if (selectedAssignment) {
            setAssemblyInfo({
                assemblyName: selectedAssignment.levelName || "",
                districtName: selectedAssignment.parentLevelName || "",
                assemblyId: selectedAssignment.stateMasterData_id || 0,
                stateId: (selectedAssignment as any).state_id || 0,
                districtId: (selectedAssignment as any).district_id || (selectedAssignment as any).parentStateMasterData_id || 0,
            });
        }
    }, [selectedAssignment]);

    // Fetch blocks for the assembly
    const { data: blocks = [] } = useGetBlocksByAssemblyQuery(
        assemblyInfo.assemblyId,
        { skip: !assemblyInfo.assemblyId }
    );

    // Fetch assembly hierarchy details to get state_id and district_id
    useEffect(() => {
        const fetchAssemblyDetails = async () => {
            if (!assemblyInfo.assemblyId || assemblyInfo.stateId !== 0) return;

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL || "https://backend.peopleconnect.in"}/api/state-master-data/${assemblyInfo.assemblyId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                        },
                    }
                );
                const data = await response.json();

                if (data.success && data.data) {
                    setAssemblyInfo(prev => ({
                        ...prev,
                        stateId: data.data.state_id || 0,
                        districtId: data.data.district_id || data.data.parent_id || 0,
                    }));
                }
            } catch (error) {
                console.error("Error fetching assembly details:", error);
            }
        };

        fetchAssemblyDetails();
    }, [assemblyInfo.assemblyId]);

    // Fetch mandals for selected block
    const { data: hierarchyData, isLoading: loadingMandals, error } = useGetBlockHierarchyQuery(
        selectedBlockId,
        { skip: !selectedBlockId }
    );

    const mandals = hierarchyData?.children || [];

    const filteredMandals = mandals.filter((mandal) => {
        const matchesSearch = mandal.displayName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = selectedMandalFilter === "" || mandal.id.toString() === selectedMandalFilter;
        return matchesSearch && matchesFilter;
    });

    const handleViewUsers = (mandalId: number, mandalName: string) => {
        setSelectedMandalId(mandalId);
        setSelectedMandalName(mandalName);
    };

    const handleCloseModal = () => {
        setSelectedMandalId(null);
        setSelectedMandalName("");
    };

    // Delete mutation
    const [deleteAssignedLevels, { isLoading: isDeleting }] = useDeleteAssignedLevelsMutation();
    const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any | null>(null);

    const handleDeleteClick = (user: any) => {
        setUserToDelete(user);
        setShowConfirmModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete || !selectedMandalId) return;

        try {
            setDeletingUserId(userToDelete.user_id);
            setShowConfirmModal(false);

            const response = await deleteAssignedLevels({
                user_id: userToDelete.user_id,
                afterAssemblyData_ids: [selectedMandalId]
            }).unwrap();

            if (response.success && response.deleted.length > 0) {
                window.location.reload();
            } else if (response.errors && response.errors.length > 0) {
                alert(`Error: ${response.errors[0].error || 'Failed to delete user assignment'}`);
            }
        } catch (error: any) {
            console.error("Delete error:", error);
            alert(error?.data?.message || "Failed to delete user assignment. Please try again.");
        } finally {
            setDeletingUserId(null);
            setUserToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setShowConfirmModal(false);
        setUserToDelete(null);
    };

    const selectedMandal = mandals.find(m => m.id === selectedMandalId);
    const users = selectedMandal?.assigned_users || [];

    const totalPages = Math.ceil(filteredMandals.length / itemsPerPage);
    const paginatedMandals = filteredMandals.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    // Auto-select first block if available
    useEffect(() => {
        if (blocks.length > 0 && !selectedBlockId) {
            setSelectedBlockId(blocks[0].id);
        }
    }, [blocks, selectedBlockId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-6 text-white">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3L3 9l9 6 9-6-9-6zm0 6v12" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl font-bold">Mandal Management</h1>
                            </div>
                            <p className="text-blue-100 ml-14">
                                Assembly: {assemblyInfo.assemblyName} | District: {assemblyInfo.districtName}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assembly
                            </label>
                            <input
                                type="text"
                                value={assemblyInfo.assemblyName}
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Block <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedBlockId}
                                onChange={(e) => {
                                    setSelectedBlockId(Number(e.target.value));
                                    setSelectedMandalFilter("");
                                    setCurrentPage(1);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={0}>Select a Block</option>
                                {blocks.map((block) => (
                                    <option key={block.id} value={block.id}>
                                        {block.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Mandal
                            </label>
                            <select
                                value={selectedMandalFilter}
                                onChange={(e) => {
                                    setSelectedMandalFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                disabled={!selectedBlockId}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">All Mandals</option>
                                {mandals.map((mandal) => (
                                    <option key={mandal.id} value={mandal.id}>
                                        {mandal.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search Mandals
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by mandal name..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    disabled={!selectedBlockId}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mandal List */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {!selectedBlockId ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-2 text-gray-500 font-medium">Please select a block to view mandals</p>
                        </div>
                    ) : loadingMandals ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-gray-600">Loading mandals...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-600">
                            <p>Error loading mandals</p>
                        </div>
                    ) : filteredMandals.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="mt-2 text-gray-500 font-medium">No mandals found</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                S.No
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Block
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Level Type
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Display Name
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Users
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Created Date
                                            </th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedMandals.map((mandal, index) => (
                                            <tr key={mandal.id} className="hover:bg-blue-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                        {hierarchyData?.parent.displayName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {mandal.levelName || "Mandal"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-blue-100 p-2 rounded-lg">
                                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3L3 9l9 6 9-6-9-6zm0 6v12" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{mandal.displayName}</p>
                                                            <p className="text-xs text-gray-500">{mandal.partyLevelDisplayName}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {mandal.user_count || 0} users
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${mandal.isActive === 1
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                        }`}>
                                                        {mandal.isActive === 1 ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {mandal.created_at ? new Date(mandal.created_at).toLocaleDateString() : "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="relative inline-block">
                                                        <button
                                                            onClick={() => setOpenDropdownId(openDropdownId === mandal.id ? null : mandal.id)}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                            </svg>
                                                        </button>

                                                        {openDropdownId === mandal.id && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-10"
                                                                    onClick={() => setOpenDropdownId(null)}
                                                                />
                                                                <div
                                                                    className={`absolute right-0 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 ${index >= paginatedMandals.length - 2 && paginatedMandals.length >= 5
                                                                        ? 'bottom-full mb-2'
                                                                        : 'top-full mt-2'
                                                                        }`}
                                                                    style={{
                                                                        scrollbarWidth: 'thin',
                                                                        scrollbarColor: '#9ca3af #f3f4f6'
                                                                    }}
                                                                >
                                                                    <div className="py-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                handleViewUsers(mandal.id, mandal.displayName);
                                                                                setOpenDropdownId(null);
                                                                            }}
                                                                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition-colors group"
                                                                        >
                                                                            <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                                </svg>
                                                                            </div>
                                                                            <span className="font-medium">View Users</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedMandalForVoters({ id: mandal.id, name: mandal.displayName });
                                                                                setShowAssignVotersModal(true);
                                                                                setOpenDropdownId(null);
                                                                            }}
                                                                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 flex items-center gap-3 transition-colors group"
                                                                        >
                                                                            <div className="p-1.5 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                                                                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                                </svg>
                                                                            </div>
                                                                            <span className="font-medium">Assign Booth Voters</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {filteredMandals.length > 0 && (
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 mt-4">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-sm text-gray-700">
                                            <span>
                                                Showing{" "}
                                                <span className="font-semibold">
                                                    {(currentPage - 1) * itemsPerPage + 1}
                                                </span>{" "}
                                                to{" "}
                                                <span className="font-semibold">
                                                    {Math.min(currentPage * itemsPerPage, filteredMandals.length)}
                                                </span>{" "}
                                                of <span className="font-semibold">{filteredMandals.length}</span> results
                                            </span>
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => setCurrentPage(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Previous
                                                </button>
                                                <div className="flex items-center space-x-1">
                                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                        let pageNum;
                                                        if (totalPages <= 5) {
                                                            pageNum = i + 1;
                                                        } else if (currentPage <= 3) {
                                                            pageNum = i + 1;
                                                        } else if (currentPage >= totalPages - 2) {
                                                            pageNum = totalPages - 4 + i;
                                                        } else {
                                                            pageNum = currentPage - 2 + i;
                                                        }
                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => setCurrentPage(pageNum)}
                                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                                                    ? "bg-blue-600 text-white"
                                                                    : "text-gray-700 hover:bg-gray-100"
                                                                    }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <button
                                                    onClick={() => setCurrentPage(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Modal for viewing users */}
                {selectedMandalId && (
                    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">Mandal Users</h2>
                                        <p className="text-blue-100 mt-1">Mandal: {selectedMandalName}</p>
                                    </div>
                                    <button
                                        onClick={handleCloseModal}
                                        className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto flex-1">
                                {users.length === 0 ? (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <p className="mt-2 text-gray-500 font-medium">No users assigned to this mandal</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        S.No
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Name
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Email
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Contact
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Party
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Assigned At
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {users.map((user: any, index: number) => (
                                                    <tr key={user.assignment_id || index} className="hover:bg-blue-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-semibold text-gray-900">
                                                                {user.first_name} {user.last_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {user.username}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                            {user.email || "N/A"}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                            {user.contact_no || "N/A"}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                {user.partyName || "N/A"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span
                                                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.user_active === 1
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-red-100 text-red-800"
                                                                    }`}
                                                            >
                                                                {user.user_active === 1 ? "Active" : "Inactive"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                            {user.assigned_at ? new Date(user.assigned_at).toLocaleDateString() : "N/A"}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <button
                                                                onClick={() => handleDeleteClick(user)}
                                                                disabled={deletingUserId === user.user_id}
                                                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                                                title="Remove user from this mandal"
                                                            >
                                                                {deletingUserId === user.user_id ? (
                                                                    <>
                                                                        <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                        Deleting...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                        Delete
                                                                    </>
                                                                )}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirmation Modal */}
                {showConfirmModal && userToDelete && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-gray-900 text-center">
                                    Confirm Deletion
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 text-center">
                                    Are you sure you want to remove <span className="font-semibold">{userToDelete.first_name} {userToDelete.last_name}</span> from <span className="font-semibold">{selectedMandalName}</span>?
                                </p>
                                <p className="mt-2 text-xs text-gray-500 text-center">
                                    This action will unassign the user from this mandal.
                                </p>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex gap-3 rounded-b-lg">
                                <button
                                    onClick={handleCancelDelete}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .scrollbar-thin::-webkit-scrollbar {
                    height: 8px;
                    width: 8px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #3b82f6;
                    border-radius: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #2563eb;
                }
                .scrollbar-track-gray-200::-webkit-scrollbar-track {
                    background: #e5e7eb;
                }
                .scrollbar-thumb-blue-500::-webkit-scrollbar-thumb {
                    background: #3b82f6;
                }
            `}</style>

            {/* Assign Booth Voters Modal */}
            {showAssignVotersModal && selectedMandalForVoters && (
                <AssignBoothVotersModal
                    isOpen={showAssignVotersModal}
                    onClose={() => {
                        setShowAssignVotersModal(false);
                        setSelectedMandalForVoters(null);
                    }}
                    levelId={selectedMandalForVoters.id}
                    levelName={selectedMandalForVoters.name}
                    levelType="afterAssembly"
                    assemblyId={assemblyInfo.assemblyId}
                    stateId={assemblyInfo.stateId}
                    districtId={assemblyInfo.districtId}
                />
            )}
        </div>
    );
}
