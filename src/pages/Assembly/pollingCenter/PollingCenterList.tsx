import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useDeleteAssignedLevelsMutation } from "../../../store/api/afterAssemblyApi";
import AssignBoothVotersModal from "../../../components/AssignBoothVotersModal";

// Types for flexible hierarchy
interface HierarchyLevel {
  id: number;
  displayName: string;
  levelName: string;
  parentId: number;
  user_count?: number;
  isActive: number;
  assigned_users?: any[];
  partyLevelDisplayName?: string;
}

interface DynamicLevel {
  id: number;
  name: string;
  data: HierarchyLevel[];
}


export default function AssemblyPollingCenterList() {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedPollingCenterId, setSelectedPollingCenterId] = useState<number | null>(null);
    const [selectedPollingCenterName, setSelectedPollingCenterName] = useState<string>("");
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [showAssignVotersModal, setShowAssignVotersModal] = useState(false);
    const [selectedPollingCenterForVoters, setSelectedPollingCenterForVoters] = useState<{ id: number; name: string } | null>(null);

    // Flexible hierarchy state
    const [dynamicLevels, setDynamicLevels] = useState<DynamicLevel[]>([]);
    const [selectedLevelValues, setSelectedLevelValues] = useState<number[]>([]);
    const [, setCurrentLevelIndex] = useState<number>(-1);
    const [availablePollingCenters, setAvailablePollingCenters] = useState<HierarchyLevel[]>([]);
    const [loadingHierarchy, setLoadingHierarchy] = useState<boolean>(false);



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

    // Discover hierarchy when assembly is loaded
    useEffect(() => {
        const discoverHierarchy = async () => {
            if (!assemblyInfo.assemblyId) {
                setDynamicLevels([]);
                setSelectedLevelValues([]);
                setCurrentLevelIndex(-1);
                setAvailablePollingCenters([]);
                return;
            }

            try {
                setLoadingHierarchy(true);
                
                // Start with assembly and discover what comes next
                await loadHierarchyLevel(assemblyInfo.assemblyId, 0);

            } catch (error) {
                console.error("Error discovering hierarchy:", error);
            } finally {
                setLoadingHierarchy(false);
            }
        };

        discoverHierarchy();
    }, [assemblyInfo.assemblyId]);

    // Function to load hierarchy level recursively
    const loadHierarchyLevel = async (levelId: number, levelIndex: number) => {
        console.log(`Loading hierarchy level ${levelIndex} for ID ${levelId}`);
        try {
            let response;
            
            // Use different API endpoints based on level
            if (levelIndex === 0) {
                // For assembly children, use the after-assembly-data endpoint
                const url = `${import.meta.env.VITE_API_BASE_URL}/api/after-assembly-data/assembly/${levelId}`;
                console.log(`Fetching from: ${url}`);
                response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                    },
                });
            } else {
                // For subsequent levels, use the hierarchy endpoint
                const url = `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${levelId}`;
                console.log(`Fetching from: ${url}`);
                response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                    },
                });
            }
            
            const data = await response.json();
            console.log(`API Response for level ${levelIndex}:`, data);
            let children = [];
            
            // Handle different response formats
            if (levelIndex === 0) {
                // after-assembly-data response format
                children = data.success ? (data.data || []) : [];
            } else {
                // hierarchy response format
                children = (data.success && data.children) ? data.children : [];
            }
            
            console.log(`Children found for level ${levelIndex}:`, children);
            
            if (children.length > 0) {
                // Check if children are polling centers (final level)
                const arePollingCenters = children.some((child: any) => 
                    child.levelName.toLowerCase().includes('polling center') ||
                    child.levelName.toLowerCase().includes('polling station')
                );
                
                if (arePollingCenters) {
                    // We found polling centers, set them as available for selection
                    setAvailablePollingCenters(children);
                    setCurrentLevelIndex(levelIndex);
                } else {
                    // Add this level to dynamic levels
                    const levelName = children[0]?.levelName || `Level ${levelIndex + 1}`;
                    const newLevel: DynamicLevel = {
                        id: levelIndex,
                        name: levelName,
                        data: children
                    };
                    
                    setDynamicLevels(prev => {
                        const newLevels = [...prev];
                        newLevels[levelIndex] = newLevel;
                        return newLevels;
                    });
                    
                    // Don't auto-select, let user choose
                    // This ensures filters are visible
                }
            } else {
                console.log(`No children found for level ${levelIndex}`);
            }
        } catch (error) {
            console.error(`Error loading hierarchy level ${levelIndex}:`, error);
        }
    };

    // Handle level selection
    const handleLevelSelection = async (levelIndex: number, selectedId: number) => {
        // Update selected values
        setSelectedLevelValues(prev => {
            const newValues = [...prev];
            newValues[levelIndex] = selectedId;
            // Clear subsequent selections
            return newValues.slice(0, levelIndex + 1);
        });
        
        // Clear subsequent levels
        setDynamicLevels(prev => prev.slice(0, levelIndex + 1));
        setAvailablePollingCenters([]);
        
        // Load next level
        await loadHierarchyLevel(selectedId, levelIndex + 1);
        setCurrentPage(1);
    };

    // Get polling centers to display
    const pollingCenters = availablePollingCenters; // Show all polling centers
    const loadingPollingCenters = loadingHierarchy;
    const error = null;



    const filteredPollingCenters = pollingCenters.filter((pc) => {
        const matchesSearch = pc.displayName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const handleViewUsers = (pollingCenterId: number, pollingCenterName: string) => {
        setSelectedPollingCenterId(pollingCenterId);
        setSelectedPollingCenterName(pollingCenterName);
    };

    const handleCloseModal = () => {
        setSelectedPollingCenterId(null);
        setSelectedPollingCenterName("");
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
        if (!userToDelete || !selectedPollingCenterId) return;

        try {
            setDeletingUserId(userToDelete.user_id);
            setShowConfirmModal(false);

            const response = await deleteAssignedLevels({
                user_id: userToDelete.user_id,
                afterAssemblyData_ids: [selectedPollingCenterId]
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

    const selectedPollingCenter = pollingCenters.find(pc => pc.id === selectedPollingCenterId);
    const users = selectedPollingCenter?.assigned_users || [];

    const totalPages = Math.ceil(filteredPollingCenters.length / itemsPerPage);
    const paginatedPollingCenters = filteredPollingCenters.slice(
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
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg p-3 sm:p-3 mb-1 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="shrink-0">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Polling Center List</h1>
                            <p className="text-green-100 text-xs sm:text-sm mt-1">
                                Assembly: {assemblyInfo.assemblyName} | District: {assemblyInfo.districtName}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                            {/* Total Polling Centers Card */}
                            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Total Polling Centers</p>
                                    <p className="text-xl sm:text-2xl font-semibold mt-1">{pollingCenters.length}</p>
                                </div>
                                <div className="bg-green-50 rounded-full p-1.5">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                            </div>

                            {/* Total Users Card */}
                            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Total Users</p>
                                    <p className="text-xl sm:text-2xl font-semibold text-green-600 mt-1">
                                        {pollingCenters.reduce((sum, pc) => sum + (pc.user_count || 0), 0)}
                                    </p>
                                </div>
                                <div className="bg-green-50 rounded-full p-1.5">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Polling Centers Without Users Card */}
                            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Polling Centers Without Users</p>
                                    <p className={`text-xl sm:text-2xl font-semibold mt-1 ${pollingCenters.filter(pc => (pc.user_count || 0) === 0).length > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                        {pollingCenters.filter(pc => (pc.user_count || 0) === 0).length}
                                    </p>
                                </div>
                                <div className={`rounded-full p-1.5 ${pollingCenters.filter(pc => (pc.user_count || 0) === 0).length > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                                    {pollingCenters.filter(pc => (pc.user_count || 0) === 0).length > 0 ? (
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
                        {/* Fixed filter: Assembly */}
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

                        {/* Dynamic filters based on available hierarchy */}
                        {dynamicLevels.map((level, index) => {
                            const isDisabled = !assemblyInfo.assemblyId || (index > 0 && (!selectedLevelValues[index - 1] || selectedLevelValues[index - 1] === 0));
                            const selectedValue = selectedLevelValues[index] || 0;

                            return (
                                <div key={`level-${index}`}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select {level.name} <span className="text-red-500">*</span>
                                        {loadingHierarchy && index === dynamicLevels.length - 1 && (
                                            <span className="ml-2 inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></span>
                                        )}
                                    </label>
                                    <select
                                        value={selectedValue}
                                        onChange={(e) => {
                                            const value = Number(e.target.value);
                                            if (value > 0) {
                                                handleLevelSelection(index, value);
                                            }
                                        }}
                                        disabled={isDisabled || loadingHierarchy}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <option value={0}>Select {level.name}</option>
                                        {level.data.map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.displayName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })}

                        {/* Search Polling Centers - moved to same row */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search Polling Centers
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by polling center name..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    disabled={availablePollingCenters.length === 0}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Fill remaining grid spaces if needed */}
                        {Array.from({ length: Math.max(0, 6 - 1 - dynamicLevels.length - 1) }).map((_, index) => (
                            <div key={`empty-${index}`} className="hidden lg:block"></div>
                        ))}
                    </div>
                </div>

                {/* Polling Center List */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {availablePollingCenters.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-2 text-gray-500 font-medium">
                                {!assemblyInfo.assemblyId 
                                    ? "Loading assembly information..." 
                                    : loadingHierarchy
                                        ? "Loading hierarchy..."
                                        : dynamicLevels.length > 0 
                                            ? "Please complete your selections to view polling centers"
                                            : "No data available for the selected assembly"
                                }
                            </p>
                        </div>
                    ) : loadingPollingCenters ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                            <p className="mt-4 text-gray-600">Loading polling centers...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-600">
                            <p>Error loading polling centers</p>
                        </div>
                    ) : filteredPollingCenters.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="mt-2 text-gray-500 font-medium">No polling centers found</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-green-50 to-green-100 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">S.No</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mandal</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Level Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Display Name</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Users</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedPollingCenters.map((pc, index) => (
                                            <tr key={pc.id} className="hover:bg-green-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                        {dynamicLevels.length > 0 ? dynamicLevels[dynamicLevels.length - 1]?.data.find(item => 
                                                            availablePollingCenters.some(pc => pc.parentId === item.id)
                                                        )?.displayName || 'Parent Level' : 'Parent Level'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {pc.levelName || "Polling Center"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-green-100 p-2 rounded-lg">
                                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{pc.displayName}</p>
                                                            <p className="text-xs text-gray-500">{pc.partyLevelDisplayName}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center">
                                                        <button
                                                            onClick={() => handleViewUsers(pc.id, pc.displayName)}
                                                            className="inline-flex items-center p-1 rounded-md text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors mr-2"
                                                            title="View Users"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {pc.user_count || 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${pc.isActive === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                        {pc.isActive === 1 ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="relative inline-block">
                                                        <button
                                                            onClick={() => setOpenDropdownId(openDropdownId === pc.id ? null : pc.id)}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                            </svg>
                                                        </button>

                                                        {openDropdownId === pc.id && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-10"
                                                                    onClick={() => setOpenDropdownId(null)}
                                                                />
                                                                <div
                                                                    className={`absolute right-0 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 ${index >= paginatedPollingCenters.length - 2 && paginatedPollingCenters.length >= 5 ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                                                                >
                                                                    <div className="py-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                handleViewUsers(pc.id, pc.displayName);
                                                                                setOpenDropdownId(null);
                                                                            }}
                                                                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-3 transition-colors group"
                                                                        >
                                                                            <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                                </svg>
                                                                            </div>
                                                                            <span className="font-medium">View Users</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedPollingCenterForVoters({ id: pc.id, name: pc.displayName });
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
                            {filteredPollingCenters.length > 0 && (
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 mt-4">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-sm text-gray-700">
                                            <span>
                                                Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredPollingCenters.length)}</span> of <span className="font-semibold">{filteredPollingCenters.length}</span> results
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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

                {/* View Users Modal */}
                {selectedPollingCenterId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">Users in {selectedPollingCenterName}</h2>
                                    <p className="text-green-100 text-sm mt-1">Total Users: {users.length}</p>
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

                            <div className="flex-1 overflow-y-auto p-6">
                                {users.length === 0 ? (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <p className="mt-2 text-gray-500 font-medium">No users assigned to this polling center</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Date</th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {users.map((user: any, index: number) => (
                                                    <tr key={user.user_id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{index + 1}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-semibold text-gray-900">{user.first_name} {user.last_name}</div>
                                                            <div className="text-xs text-gray-500">{user.username}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email || "N/A"}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.contact_no || "N/A"}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                {user.partyName || "N/A"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.user_active === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
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
                                                                title="Remove user from this polling center"
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
                                <h3 className="mt-4 text-lg font-semibold text-gray-900 text-center">Confirm Deletion</h3>
                                <p className="mt-2 text-sm text-gray-600 text-center">
                                    Are you sure you want to remove <span className="font-semibold">{userToDelete.first_name} {userToDelete.last_name}</span> from <span className="font-semibold">{selectedPollingCenterName}</span>?
                                </p>
                                <p className="mt-2 text-xs text-gray-500 text-center">This action will unassign the user from this polling center.</p>
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
                    background: #10b981;
                    border-radius: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #059669;
                }
                .scrollbar-track-gray-200::-webkit-scrollbar-track {
                    background: #e5e7eb;
                }
                .scrollbar-thumb-green-500::-webkit-scrollbar-thumb {
                    background: #10b981;
                }
            `}</style>

            {/* Assign Booth Voters Modal */}
            {showAssignVotersModal && selectedPollingCenterForVoters && (
                <AssignBoothVotersModal
                    isOpen={showAssignVotersModal}
                    onClose={() => {
                        setShowAssignVotersModal(false);
                        setSelectedPollingCenterForVoters(null);
                    }}
                    levelId={selectedPollingCenterForVoters.id}
                    levelName={selectedPollingCenterForVoters.name}
                    levelType="afterAssembly"
                    assemblyId={assemblyInfo.assemblyId}
                    stateId={assemblyInfo.stateId}
                    districtId={assemblyInfo.districtId}
                />
            )}
        </div>
    );
}
