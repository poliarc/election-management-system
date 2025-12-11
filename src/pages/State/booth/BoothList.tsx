import { useState, useEffect } from "react";
import { useGetBlockHierarchyQuery } from "../../../store/api/blockTeamApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useDeleteAssignedLevelsMutation } from "../../../store/api/afterAssemblyApi";

export default function StateBoothList() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDistrictId, setSelectedDistrictId] = useState<number>(0);
    const [selectedAssemblyId, setSelectedAssemblyId] = useState<number>(0);
    const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
    const [selectedMandalId, setSelectedMandalId] = useState<number>(0);
    const [selectedPollingCenterId, setSelectedPollingCenterId] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedBoothId, setSelectedBoothId] = useState<number | null>(null);
    const [selectedBoothName, setSelectedBoothName] = useState<string>("");

    const [districts, setDistricts] = useState<any[]>([]);
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [blocks, setBlocks] = useState<any[]>([]);

    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );

    const [stateInfo, setStateInfo] = useState({
        stateName: "",
        stateId: 0,
    });

    useEffect(() => {
        if (selectedAssignment) {
            setStateInfo({
                stateName: selectedAssignment.levelName || "",
                stateId: selectedAssignment.stateMasterData_id || 0,
            });
        }
    }, [selectedAssignment]);

    // Fetch districts using user-state-hierarchies API
    useEffect(() => {
        const fetchDistricts = async () => {
            if (!stateInfo.stateId) return;
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/user-state-hierarchies/hierarchy/children/${stateInfo.stateId}?page=1&limit=100`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                        },
                    }
                );
                const data = await response.json();
                if (data.success && data.data) {
                    const mappedDistricts = data.data.children.map((district: any) => ({
                        id: district.location_id || district.id,
                        displayName: district.location_name,
                        levelName: "District",
                        location_id: district.location_id,
                    }));
                    setDistricts(mappedDistricts);
                }
            } catch (error) {
                console.error("Error fetching districts:", error);
            }
        };
        fetchDistricts();
    }, [stateInfo.stateId]);

    // Auto-select first district when districts load
    useEffect(() => {
        if (districts.length > 0 && selectedDistrictId === 0) {
            setSelectedDistrictId(districts[0].location_id || districts[0].id);
        }
    }, [districts, selectedDistrictId]);

    // Fetch assemblies when district is selected
    useEffect(() => {
        const fetchAssemblies = async () => {
            if (!selectedDistrictId) {
                setAssemblies([]);
                return;
            }
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/user-state-hierarchies/hierarchy/children/${selectedDistrictId}?page=1&limit=100`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                        },
                    }
                );
                const data = await response.json();
                if (data.success && data.data) {
                    const mappedAssemblies = data.data.children.map((assembly: any) => ({
                        id: assembly.location_id || assembly.id,
                        displayName: assembly.location_name,
                        levelName: "Assembly",
                        location_id: assembly.location_id,
                    }));
                    setAssemblies(mappedAssemblies);
                }
            } catch (error) {
                console.error("Error fetching assemblies:", error);
            }
        };
        fetchAssemblies();
    }, [selectedDistrictId]);

    // Auto-select first assembly when assemblies load
    useEffect(() => {
        if (assemblies.length > 0 && selectedDistrictId > 0 && selectedAssemblyId === 0) {
            setSelectedAssemblyId(assemblies[0].location_id || assemblies[0].id);
        }
    }, [assemblies, selectedDistrictId, selectedAssemblyId]);

    // Fetch blocks when assembly is selected
    useEffect(() => {
        const fetchBlocks = async () => {
            if (!selectedAssemblyId) {
                setBlocks([]);
                return;
            }
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/after-assembly-data/assembly/${selectedAssemblyId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                        },
                    }
                );
                const data = await response.json();
                if (data.success) {
                    setBlocks(data.data || []);
                }
            } catch (error) {
                console.error("Error fetching blocks:", error);
            }
        };
        fetchBlocks();
    }, [selectedAssemblyId]);

    // Auto-select first block when blocks load
    useEffect(() => {
        if (blocks.length > 0 && selectedAssemblyId > 0 && selectedBlockId === 0) {
            setSelectedBlockId(blocks[0].id);
        }
    }, [blocks, selectedAssemblyId, selectedBlockId]);

    // Fetch mandals for selected block
    const { data: mandalHierarchyData } = useGetBlockHierarchyQuery(
        selectedBlockId,
        { skip: !selectedBlockId }
    );

    const mandals = mandalHierarchyData?.children || [];

    // Auto-select first mandal when mandals load
    useEffect(() => {
        if (mandals.length > 0 && selectedBlockId > 0 && selectedMandalId === 0) {
            setSelectedMandalId(mandals[0].id);
        }
    }, [mandals, selectedBlockId, selectedMandalId]);

    // Fetch polling centers for selected mandal
    const { data: pollingCenterHierarchyData } = useGetBlockHierarchyQuery(
        selectedMandalId,
        { skip: !selectedMandalId }
    );

    const pollingCenters = pollingCenterHierarchyData?.children || [];

    // Auto-select first polling center when polling centers load
    useEffect(() => {
        if (pollingCenters.length > 0 && selectedMandalId > 0 && selectedPollingCenterId === 0) {
            setSelectedPollingCenterId(pollingCenters[0].id);
        }
    }, [pollingCenters, selectedMandalId, selectedPollingCenterId]);

    // Fetch booths for selected polling center
    const { data: hierarchyData, isLoading: loadingBooths, error } = useGetBlockHierarchyQuery(
        selectedPollingCenterId,
        { skip: !selectedPollingCenterId }
    );

    const booths = hierarchyData?.children || [];

    const filteredBooths = booths.filter((booth) => {
        const matchesSearch = booth.displayName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const handleViewUsers = (boothId: number, boothName: string) => {
        setSelectedBoothId(boothId);
        setSelectedBoothName(boothName);
    };

    const handleCloseModal = () => {
        setSelectedBoothId(null);
        setSelectedBoothName("");
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
        if (!userToDelete || !selectedBoothId) return;

        try {
            setDeletingUserId(userToDelete.user_id);
            setShowConfirmModal(false);

            const response = await deleteAssignedLevels({
                user_id: userToDelete.user_id,
                afterAssemblyData_ids: [selectedBoothId]
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

    const selectedBooth = booths.find(b => b.id === selectedBoothId);
    const users = selectedBooth?.assigned_users || [];

    const totalPages = Math.ceil(filteredBooths.length / itemsPerPage);
    const paginatedBooths = filteredBooths.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-1">
            <div className="max-w-7xl mx-auto">
                {/* Header with Stats Cards */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-3 mb-1 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="shrink-0">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Booth List</h1>
                            <p className="text-purple-100 mt-1 text-xs sm:text-sm">
                                State: {stateInfo.stateName}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                            {/* Total Booths Card */}
                            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Total Booths</p>
                                    <p className="text-xl sm:text-2xl font-semibold mt-1">{booths.length}</p>
                                </div>
                                <div className="bg-orange-50 rounded-full p-1.5">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0-8h2a2 2 0 012 2v6a2 2 0 01-2 2H9m0-8v8m0-8h6m-6 8h6" />
                                    </svg>
                                </div>
                            </div>

                            {/* Total Users Card */}
                            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Total Users</p>
                                    <p className="text-xl sm:text-2xl font-semibold text-green-600 mt-1">
                                        {booths.reduce((sum, booth) => sum + (booth.user_count || 0), 0)}
                                    </p>
                                </div>
                                <div className="bg-green-50 rounded-full p-1.5">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Booths Without Users Card */}
                            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Booths Without Users</p>
                                    <p className={`text-xl sm:text-2xl font-semibold mt-1 ${booths.filter(booth => (booth.user_count || 0) === 0).length > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                        {booths.filter(booth => (booth.user_count || 0) === 0).length}
                                    </p>
                                </div>
                                <div className={`rounded-full p-1.5 ${booths.filter(booth => (booth.user_count || 0) === 0).length > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                                    {booths.filter(booth => (booth.user_count || 0) === 0).length > 0 ? (
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-md p-3 mb-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                State
                            </label>
                            <input
                                type="text"
                                value={stateInfo.stateName}
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select District <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedDistrictId}
                                onChange={(e) => {
                                    setSelectedDistrictId(Number(e.target.value));
                                    setSelectedAssemblyId(0);
                                    setSelectedBlockId(0);
                                    setSelectedMandalId(0);
                                    setSelectedPollingCenterId(0);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value={0}>Select District</option>
                                {districts.map((district) => (
                                    <option key={district.location_id || district.id} value={district.location_id || district.id}>
                                        {district.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Assembly <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedAssemblyId}
                                onChange={(e) => {
                                    setSelectedAssemblyId(Number(e.target.value));
                                    setSelectedBlockId(0);
                                    setSelectedMandalId(0);
                                    setSelectedPollingCenterId(0);
                                    setCurrentPage(1);
                                }}
                                disabled={!selectedDistrictId}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value={0}>Select Assembly</option>
                                {assemblies.map((assembly) => (
                                    <option key={assembly.location_id || assembly.id} value={assembly.location_id || assembly.id}>
                                        {assembly.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Block <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedBlockId}
                                onChange={(e) => {
                                    setSelectedBlockId(Number(e.target.value));
                                    setSelectedMandalId(0);
                                    setSelectedPollingCenterId(0);
                                    setCurrentPage(1);
                                }}
                                disabled={!selectedAssemblyId}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value={0}>Select Block</option>
                                {blocks.map((block) => (
                                    <option key={block.id} value={block.id}>
                                        {block.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Mandal <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedMandalId}
                                onChange={(e) => {
                                    setSelectedMandalId(Number(e.target.value));
                                    setSelectedPollingCenterId(0);
                                    setCurrentPage(1);
                                }}
                                disabled={!selectedBlockId}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value={0}>Select Mandal</option>
                                {mandals.map((mandal) => (
                                    <option key={mandal.id} value={mandal.id}>
                                        {mandal.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Polling Center <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedPollingCenterId}
                                onChange={(e) => {
                                    setSelectedPollingCenterId(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                disabled={!selectedMandalId}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value={0}>Select Polling Center</option>
                                {pollingCenters.map((pc) => (
                                    <option key={pc.id} value={pc.id}>
                                        {pc.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Booths
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search by booth name..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                disabled={!selectedPollingCenterId}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* Booth List */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {!selectedPollingCenterId ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-2 text-gray-500 font-medium">Please select a polling center to view booths</p>
                        </div>
                    ) : loadingBooths ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                            <p className="mt-4 text-gray-600">Loading booths...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-600">
                            <p>Error loading booths</p>
                        </div>
                    ) : filteredBooths.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="mt-2 text-gray-500 font-medium">No booths found</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-purple-50 to-purple-100 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                S.No
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Polling Center
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Level Type
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Display Name
                                            </th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
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
                                        {paginatedBooths.map((booth, index) => (
                                            <tr key={booth.id} className="hover:bg-purple-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {hierarchyData?.parent.displayName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {booth.levelName || "Booth"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-purple-100 p-2 rounded-lg">
                                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{booth.displayName}</p>
                                                            <p className="text-xs text-gray-500">{booth.partyLevelDisplayName}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center">
                                                        <button
                                                            onClick={() => handleViewUsers(booth.id, booth.displayName)}
                                                            className="inline-flex items-center p-1 rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors mr-2"
                                                            title="View Users"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {booth.user_count || 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${booth.isActive === 1
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                        }`}>
                                                        {booth.isActive === 1 ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {booth.created_at ? new Date(booth.created_at).toLocaleDateString() : "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => handleViewUsers(booth.id, booth.displayName)}
                                                        className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {filteredBooths.length > 0 && (
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-sm text-gray-700">
                                            <span>
                                                Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                                                <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredBooths.length)}</span> of{" "}
                                                <span className="font-semibold">{filteredBooths.length}</span> results
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <span className="px-4 py-2 text-sm font-medium text-gray-700">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* View Users Modal */}
            {selectedBoothId && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Assigned Users</h2>
                                    <p className="text-purple-100 mt-1">Booth: {selectedBoothName}</p>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            {users.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <p className="mt-2 text-gray-500 font-medium">No users assigned to this booth</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {users.map((user: any) => (
                                                <tr key={user.user_id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                                    <span className="text-purple-600 font-semibold text-sm">
                                                                        {user.first_name?.charAt(0).toUpperCase() || 'U'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                                <div className="text-sm text-gray-500">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{user.first_name || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{user.last_name || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{user.contact_no || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                            {user.partyName || 'User'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                            }`}>
                                                            {user.isActive ? 'Inactive' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                        <button
                                                            onClick={() => handleDeleteClick(user)}
                                                            disabled={deletingUserId === user.user_id}
                                                            className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {deletingUserId === user.user_id ? (
                                                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                            ) : (
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
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

            {/* Confirm Delete Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Are you sure you want to remove this user assignment?
                                </p>
                            </div>
                        </div>

                        {userToDelete && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-700">
                                    <span className="font-medium">User:</span> {userToDelete.name}
                                </p>
                                <p className="text-sm text-gray-700 mt-1">
                                    <span className="font-medium">Email:</span> {userToDelete.email}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelDelete}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
