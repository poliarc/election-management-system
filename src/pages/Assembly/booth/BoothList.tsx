import { useState, useEffect } from "react";
import { useGetBlocksByAssemblyQuery } from "../../../store/api/blockApi";
import { useGetBlockHierarchyQuery } from "../../../store/api/blockTeamApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useDeleteAssignedLevelsMutation } from "../../../store/api/afterAssemblyApi";
import AssignBoothVotersModal from "../../../components/AssignBoothVotersModal";
import { DynamicFilterSection } from "../../../components/DynamicFilterSection";
import type { FilterState, HierarchyLevel } from "../../../types/dynamicNavigation";


export default function BoothList() {
    const [filters, setFilters] = useState<FilterState>({
        assemblyId: 0,
        searchTerm: "",
        selectedItemFilter: ""
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedBoothId, setSelectedBoothId] = useState<number | null>(null);
    const [selectedBoothName, setSelectedBoothName] = useState<string>("");
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [showAssignVotersModal, setShowAssignVotersModal] = useState(false);
    const [selectedBoothForVoters, setSelectedBoothForVoters] = useState<{ id: number; name: string } | null>(null);

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
            const newAssemblyInfo = {
                assemblyName: selectedAssignment.levelName || "",
                districtName: selectedAssignment.parentLevelName || "",
                assemblyId: selectedAssignment.stateMasterData_id || 0,
                stateId: (selectedAssignment as any).state_id || 0,
                districtId: (selectedAssignment as any).district_id || (selectedAssignment as any).parentStateMasterData_id || 0,
            };
            setAssemblyInfo(newAssemblyInfo);
            setFilters(prev => ({ ...prev, assemblyId: newAssemblyInfo.assemblyId }));
        }
    }, [selectedAssignment]);

    // Fetch blocks for the assembly
    const { data: blocks = [] } = useGetBlocksByAssemblyQuery(
        assemblyInfo.assemblyId,
        { skip: !assemblyInfo.assemblyId }
    );

    // State for dynamic hierarchy detection
    const [hasPollingCenters, setHasPollingCenters] = useState(false);

    // Check if polling centers exist for the selected mandal
    useEffect(() => {
        const checkPollingCenters = async () => {
            if (filters.mandalId) {
                try {
                    const response = await fetch(
                        `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${filters.mandalId}`,
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                            },
                        }
                    );
                    const data = await response.json();
                    
                    // Check if the children are polling centers (not booths)
                    const children = data.children || [];
                    
                    // Enhanced logic: Check if children are actually polling centers
                    // 1. If all children have booth-like names (Booth 1, Booth 111, etc.), they are booths
                    // 2. If children have non-booth names, they might be polling centers
                    // 3. Also check the levelType if available
                    
                    let hasPollingCenterChildren = false;
                    
                    if (children.length > 0) {
                        // Check if any child has a levelType that indicates it's a polling center
                        const hasPollingCenterType = children.some((child: any) => {
                            const levelType = (child.levelType || '').toLowerCase();
                            return levelType.includes('polling') || levelType.includes('center');
                        });
                        
                        // Check naming patterns
                        const boothPatternCount = children.filter((child: any) => {
                            const name = (child.displayName || child.levelName || '').toLowerCase().trim();
                            // Booth patterns: "booth 1", "booth 111", "booth no 1", etc.
                            return /^booth\s*(no\.?\s*)?\d+$/i.test(name);
                        }).length;
                        
                        // If less than 80% of children match booth pattern, consider them polling centers
                        const boothPatternRatio = boothPatternCount / children.length;
                        
                        hasPollingCenterChildren = hasPollingCenterType || boothPatternRatio < 0.8;
                        
                        console.log('Enhanced mandal children analysis:', {
                            mandalId: filters.mandalId,
                            childrenCount: children.length,
                            boothPatternCount,
                            boothPatternRatio,
                            hasPollingCenterType,
                            hasPollingCenters: hasPollingCenterChildren,
                            sampleNames: children.slice(0, 3).map((c: any) => c.displayName || c.levelName)
                        });
                    }
                    
                    setHasPollingCenters(hasPollingCenterChildren);
                    
                    // Provide user feedback about hierarchy detection
                    if (hasPollingCenterChildren) {
                        console.log('✅ Polling centers detected - showing polling center filter');
                    } else {
                        console.log('ℹ️ No polling centers detected - booths are directly under mandal');
                    }
                } catch (error) {
                    console.error('Error checking polling centers:', error);
                    setHasPollingCenters(false);
                }
            } else {
                setHasPollingCenters(false);
            }
        };

        checkPollingCenters();
    }, [filters.mandalId]);

    // Define available hierarchy levels for booth list
    const availableLevels: HierarchyLevel[] = [
        { type: 'block', hasData: blocks.length > 0, isRequired: true },
        { type: 'mandal', hasData: blocks.length > 0, isRequired: true, parentType: 'block' },
        { 
            type: 'pollingCenter', 
            hasData: hasPollingCenters, 
            isRequired: hasPollingCenters, 
            parentType: 'mandal' 
        },
        { 
            type: 'booth', 
            hasData: true, 
            isRequired: false, 
            parentType: hasPollingCenters ? 'pollingCenter' : 'mandal' 
        }
    ];

    // Handle filter changes from DynamicFilterSection
    const handleFiltersChange = (newFilters: FilterState) => {
        setFilters(newFilters);
        setCurrentPage(1); // Reset pagination when filters change
    };

    useEffect(() => {
        const fetchAssemblyDetails = async () => {
            if (!assemblyInfo.assemblyId || assemblyInfo.stateId !== 0) return;

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/after-assembly-data/assembly/${assemblyInfo.assemblyId}`,
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

    // Fetch booths - either from polling center or directly from mandal
    const parentId = hasPollingCenters ? (filters.pollingCenterId || 0) : (filters.mandalId || 0);
    const shouldSkip = hasPollingCenters ? !filters.pollingCenterId : !filters.mandalId;
    
    const { data: hierarchyData, isLoading: loadingBooths, error } = useGetBlockHierarchyQuery(
        parentId,
        { skip: shouldSkip }
    );

    const booths = hierarchyData?.children || [];

    const filteredBooths = booths.filter((booth) => {
        const matchesSearch = booth.displayName.toLowerCase().includes(filters.searchTerm.toLowerCase());
        const matchesFilter = filters.selectedItemFilter === "" || booth.id.toString() === filters.selectedItemFilter;
        return matchesSearch && matchesFilter;
    });

    const handleViewUsers = (boothId: number, boothName: string) => {
        setSelectedBoothId(boothId);
        setSelectedBoothName(boothName);
    };

    const handleCloseModal = () => {
        setSelectedBoothId(null);
        setSelectedBoothName("");
    };

    const [deleteAssignedLevels] = useDeleteAssignedLevelsMutation();
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-1">
            <div className="max-w-7xl mx-auto">
                {/* Header with Stats Cards */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-3 sm:p-3 mb-1 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="shrink-0">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Booth List</h1>
                            <p className="text-purple-100 text-xs sm:text-sm mt-1">
                                Assembly: {assemblyInfo.assemblyName} | District: {assemblyInfo.districtName}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                            {/* Total Booths Card */}
                            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Total Booths</p>
                                    <p className="text-xl sm:text-2xl font-semibold mt-1">{booths.length}</p>
                                </div>
                                <div className="bg-purple-50 rounded-full p-1.5">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16v12H4V7zm4 0V5h8v2" />
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

                {/* Dynamic Filter Section */}
                <DynamicFilterSection
                    currentLevel="booth"
                    assemblyId={assemblyInfo.assemblyId}
                    availableLevels={availableLevels}
                    onFiltersChange={handleFiltersChange}
                    initialFilters={filters}
                    assemblyName={assemblyInfo.assemblyName}
                    districtName={assemblyInfo.districtName}
                />

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {!filters.blockId ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-2 text-gray-500 font-medium">Please select a block to view booths</p>
                        </div>
                    ) : !filters.mandalId ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-2 text-gray-500 font-medium">Please select a mandal to view booths</p>
                        </div>
                    ) : hasPollingCenters && !filters.pollingCenterId ? (
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
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">S.No</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Polling Center</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Level Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Display Name</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Users</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedBooths.map((booth, index) => (
                                            <tr key={booth.id} className="hover:bg-purple-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {hierarchyData?.parent.displayName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                        {booth.levelName || "Booth"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-purple-100 p-2 rounded-lg">
                                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16v12H4V7zm4 0V5h8v2" />
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
                                                            className="inline-flex items-center p-1 rounded-md text-purple-600 hover:bg-purple-50 hover:text-purple-700 transition-colors mr-2"
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
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${booth.isActive === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                        {booth.isActive === 1 ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="relative inline-block">
                                                        <button
                                                            onClick={() => setOpenDropdownId(openDropdownId === booth.id ? null : booth.id)}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                            </svg>
                                                        </button>

                                                        {openDropdownId === booth.id && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-10"
                                                                    onClick={() => setOpenDropdownId(null)}
                                                                />
                                                                <div
                                                                    className={`absolute right-0 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 ${index >= paginatedBooths.length - 2 && paginatedBooths.length >= 5 ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                                                                >
                                                                    <div className="py-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                handleViewUsers(booth.id, booth.displayName);
                                                                                setOpenDropdownId(null);
                                                                            }}
                                                                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 flex items-center gap-3 transition-colors group"
                                                                        >
                                                                            <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                                                                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                                </svg>
                                                                            </div>
                                                                            <span className="font-medium">View Users</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedBoothForVoters({ id: booth.id, name: booth.displayName });
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

                            {filteredBooths.length > 0 && (
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 mt-4">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-sm text-gray-700">
                                            <span>
                                                Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredBooths.length)}</span> of <span className="font-semibold">{filteredBooths.length}</span> results
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Previous
                                            </button>
                                            <div className="flex gap-1">
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
                                                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === pageNum
                                                                ? "bg-purple-600 text-white"
                                                                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

                {selectedBoothId && (
                    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">
                                    Users Assigned to {selectedBoothName}
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                                {users.length === 0 ? (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <p className="mt-2 text-gray-500 font-medium">No users assigned to this booth</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {users.map((user, index) => (
                                                    <tr key={user.user_id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{index + 1}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                                    <span className="text-purple-600 font-semibold">
                                                                        {user.first_name?.charAt(0).toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.contact_no || "N/A"}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                {user.partyName}
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

                {showConfirmModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Are you sure you want to remove {userToDelete?.name} from this booth?
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleCancelDelete}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showAssignVotersModal && selectedBoothForVoters && (
                    <AssignBoothVotersModal
                        isOpen={showAssignVotersModal}
                        onClose={() => {
                            setShowAssignVotersModal(false);
                            setSelectedBoothForVoters(null);
                        }}
                        levelId={selectedBoothForVoters.id}
                        levelName={selectedBoothForVoters.name}
                        levelType="afterAssembly"
                        assemblyId={assemblyInfo.assemblyId}
                        stateId={assemblyInfo.stateId}
                        districtId={assemblyInfo.districtId}
                    />
                )}
            </div>
        </div>
    );
}
