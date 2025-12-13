import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useDeleteAssignedLevelsMutation } from "../../../store/api/afterAssemblyApi";

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


export default function DistrictPollingCenterList() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAssemblyId, setSelectedAssemblyId] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedPollingCenterId, setSelectedPollingCenterId] = useState<number | null>(null);
    const [selectedPollingCenterName, setSelectedPollingCenterName] = useState<string>("");
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

    // Flexible hierarchy state
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [dynamicLevels, setDynamicLevels] = useState<DynamicLevel[]>([]);
    const [selectedLevelValues, setSelectedLevelValues] = useState<number[]>([]);
    const [, setCurrentLevelIndex] = useState<number>(-1);
    const [availablePollingCenters, setAvailablePollingCenters] = useState<HierarchyLevel[]>([]);
    const [loadingHierarchy, setLoadingHierarchy] = useState<boolean>(false);

    // Booth states
    const [booths, setBooths] = useState<any[]>([]);
    const [loadingBooths, setLoadingBooths] = useState(false);

    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );

    const [districtInfo, setDistrictInfo] = useState({
        districtName: "",
        districtId: 0,
        stateName: "",
    });

    useEffect(() => {
        if (selectedAssignment) {
            setDistrictInfo({
                districtName: selectedAssignment.levelName || "",
                districtId: selectedAssignment.stateMasterData_id || 0,
                stateName: selectedAssignment.parentLevelName || "",
            });
        }
    }, [selectedAssignment]);

    // Fetch assemblies for the district using user-state-hierarchies API
    useEffect(() => {
        const fetchAssemblies = async () => {
            if (!districtInfo.districtId) {
                setAssemblies([]);
                return;
            }
            try {
                console.log("Fetching assemblies for district ID:", districtInfo.districtId);
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/user-state-hierarchies/hierarchy/children/${districtInfo.districtId}?page=1&limit=100`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                        },
                    }
                );
                const data = await response.json();
                console.log("Assemblies API response:", data);
                if (data.success && data.data) {
                    // Map the response to match expected format
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
                setAssemblies([]);
            }
        };
        fetchAssemblies();
    }, [districtInfo.districtId]);

    // Auto-select first assembly when assemblies load
    useEffect(() => {
        if (assemblies.length > 0 && selectedAssemblyId === 0) {
            setSelectedAssemblyId(assemblies[0].location_id || assemblies[0].id);
        }
    }, [assemblies, selectedAssemblyId]);

    // Discover hierarchy when assembly is selected
    useEffect(() => {
        const discoverHierarchy = async () => {
            if (!selectedAssemblyId) {
                setDynamicLevels([]);
                setSelectedLevelValues([]);
                setCurrentLevelIndex(-1);
                setAvailablePollingCenters([]);
                return;
            }

            try {
                setLoadingHierarchy(true);
                
                // Start with assembly and discover what comes next
                await loadHierarchyLevel(selectedAssemblyId, 0);

            } catch (error) {
                console.error("Error discovering hierarchy:", error);
            } finally {
                setLoadingHierarchy(false);
            }
        };

        discoverHierarchy();
    }, [selectedAssemblyId]);

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

    // Fetch Booths for selected Polling Center
    const fetchBooths = async (pollingCenterId: number) => {
        setLoadingBooths(true);
        try {
            const token = localStorage.getItem('auth_access_token');
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${pollingCenterId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            if (data.success) {
                setBooths(data.children || []);
            }
        } catch (error) {
            console.error("Error fetching booths:", error);
            setBooths([]);
        } finally {
            setLoadingBooths(false);
        }
    };

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
                                District: {districtInfo.districtName} | State: {districtInfo.stateName}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                            {/* Total Polling Centers Card */}
                            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Total Polling Centers</p>
                                    <p className="text-xl sm:text-2xl font-semibold mt-1">{availablePollingCenters.length}</p>
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
                        {/* Fixed filters: State, District, Assembly */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                State
                            </label>
                            <input
                                type="text"
                                value={districtInfo.stateName}
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                District
                            </label>
                            <input
                                type="text"
                                value={districtInfo.districtName}
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Assembly <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedAssemblyId}
                                onChange={(e) => {
                                    setSelectedAssemblyId(Number(e.target.value));
                                    setSelectedLevelValues([]);
                                    setCurrentLevelIndex(-1);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value={0}>Select Assembly</option>
                                {assemblies.map((assembly) => (
                                    <option key={assembly.location_id || assembly.id} value={assembly.location_id || assembly.id}>
                                        {assembly.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Dynamic filters based on available hierarchy */}
                        {dynamicLevels.map((level, index) => {
                            const isDisabled = !selectedAssemblyId || (index > 0 && (!selectedLevelValues[index - 1] || selectedLevelValues[index - 1] === 0));
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
                        {Array.from({ length: Math.max(0, 6 - 3 - dynamicLevels.length - 1) }).map((_, index) => (
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
                                {!selectedAssemblyId 
                                    ? "Please select an assembly to continue" 
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
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                S.No
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Parent Level
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
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedPollingCenters.map((pollingCenter, index) => (
                                            <tr key={pollingCenter.id} className="hover:bg-green-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                        {(() => {
                                                            // Get the last level name from dynamic levels
                                                            if (dynamicLevels.length > 0) {
                                                                const lastLevel = dynamicLevels[dynamicLevels.length - 1];
                                                                return lastLevel.name;
                                                            }
                                                            return assemblies.find(a => (a.location_id || a.id) === selectedAssemblyId)?.displayName || "Assembly";
                                                        })()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        {pollingCenter.levelName || "Polling Center"}
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
                                                            <p className="text-sm font-semibold text-gray-900">{pollingCenter.displayName}</p>
                                                            <p className="text-xs text-gray-500">{pollingCenter.partyLevelDisplayName}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center">
                                                        <button
                                                            onClick={() => handleViewUsers(pollingCenter.id, pollingCenter.displayName)}
                                                            className="inline-flex items-center p-1 rounded-md text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors mr-2"
                                                            title="View Users"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {pollingCenter.user_count || 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${pollingCenter.isActive === 1
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                        }`}>
                                                        {pollingCenter.isActive === 1 ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="relative inline-block">
                                                        <button
                                                            onClick={() => setOpenDropdownId(openDropdownId === pollingCenter.id ? null : pollingCenter.id)}
                                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                            </svg>
                                                        </button>

                                                        {openDropdownId === pollingCenter.id && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-10"
                                                                    onClick={() => setOpenDropdownId(null)}
                                                                />
                                                                <div
                                                                    className={`absolute right-0 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 ${index >= paginatedPollingCenters.length - 2 && paginatedPollingCenters.length >= 5
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
                                                                                handleViewUsers(pollingCenter.id, pollingCenter.displayName);
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
                                                                                fetchBooths(pollingCenter.id);
                                                                                setOpenDropdownId(null);
                                                                            }}
                                                                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-3 transition-colors group"
                                                                        >
                                                                            <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                                </svg>
                                                                            </div>
                                                                            <span className="font-medium">View Booths</span>
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
                            {totalPages > 1 && (
                                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                                                    <span className="font-medium">
                                                        {Math.min(currentPage * itemsPerPage, filteredPollingCenters.length)}
                                                    </span>{" "}
                                                    of <span className="font-medium">{filteredPollingCenters.length}</span> results
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                        disabled={currentPage === 1}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="sr-only">Previous</span>
                                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                    {[...Array(totalPages)].map((_, i) => (
                                                        <button
                                                            key={i + 1}
                                                            onClick={() => setCurrentPage(i + 1)}
                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                                                                ? "z-10 bg-green-50 border-green-500 text-green-600"
                                                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                                }`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                        disabled={currentPage === totalPages}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="sr-only">Next</span>
                                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* View Users Modal */}
            {selectedPollingCenterId && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Assigned Users</h2>
                                    <p className="text-green-100 mt-1">{selectedPollingCenterName}</p>
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

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            {users.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <p className="mt-2 text-gray-500 font-medium">No users assigned to this polling center</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    S.No
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    First Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Last Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Contact
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Party
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    State
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {users.map((user, index) => (
                                                <tr key={user.user_id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {user.first_name || "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {user.last_name || "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {user.contact_no || "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {user.email || "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                            {user.partyName || "N/A"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {user.stateName || "N/A"}
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
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Are you sure you want to remove this user assignment?
                                </p>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-700">
                                <span className="font-medium">User:</span> {userToDelete?.name}
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                                <span className="font-medium">Polling Center:</span> {selectedPollingCenterName}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelDelete}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Booths Modal */}
            {booths.length > 0 && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold">Booths</h2>
                                    <p className="text-green-100 mt-1">List of all booths</p>
                                </div>
                                <button
                                    onClick={() => setBooths([])}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            {loadingBooths ? (
                                <div className="text-center py-12">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                                    <p className="mt-4 text-gray-600">Loading booths...</p>
                                </div>
                            ) : booths.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p className="mt-2 text-gray-500 font-medium">No booths found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    S.No
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Display Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Level Type
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Users
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Created Date
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {booths.map((booth, index) => (
                                                <tr key={booth.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-green-100 p-2 rounded-lg">
                                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">{booth.displayName}</p>
                                                                <p className="text-xs text-gray-500">{booth.partyLevelDisplayName}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                                            {booth.levelName || "Booth"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {booth.user_count || 0} users
                                                        </span>
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
        </div>
    );
}
