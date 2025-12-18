import { useState, useEffect } from "react";
import { useGetBlocksByAssemblyQuery } from "../../../store/api/blockApi";
import { useGetBlockHierarchyQuery } from "../../../store/api/blockTeamApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import AssignBoothVotersModal from "../../../components/AssignBoothVotersModal";
import InlineUserDisplay from "../../../components/InlineUserDisplay";


export default function PollingCenterList() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
    const [selectedMandalId, setSelectedMandalId] = useState<number>(0);
    const [selectedPollingCenterFilter, setSelectedPollingCenterFilter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [showAssignVotersModal, setShowAssignVotersModal] = useState(false);
    const [selectedPollingCenterForVoters, setSelectedPollingCenterForVoters] = useState<{ id: number; name: string } | null>(null);
    
    // State for inline user display
    const [expandedPollingCenterId, setExpandedPollingCenterId] = useState<number | null>(null);
    const [pollingCenterUsers, setPollingCenterUsers] = useState<Record<number, any[]>>({});
    
    // State for filtering polling centers without users
    const [showPollingCentersWithoutUsers, setShowPollingCentersWithoutUsers] = useState(false);

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
                    `${import.meta.env.VITE_API_BASE_URL}/api/state-master-data/${assemblyInfo.assemblyId}`,
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
    const { data: mandalHierarchyData } = useGetBlockHierarchyQuery(
        selectedBlockId,
        { skip: !selectedBlockId }
    );

    const mandals = mandalHierarchyData?.children || [];

    // State for all polling centers in the mandal
    const [allPollingCenters, setAllPollingCenters] = useState<any[]>([]);
    const [loadingPollingCenters, setLoadingPollingCenters] = useState(false);
    const [error, setError] = useState<any>(null);

    // Fetch all polling centers for selected mandal (filter out booths)
    useEffect(() => {
        const fetchAllPollingCenters = async () => {
            if (!selectedMandalId) {
                setAllPollingCenters([]);
                return;
            }

            setLoadingPollingCenters(true);
            setError(null);

            try {
                const token = localStorage.getItem("auth_access_token");
                
                // First get direct children of mandal
                const mandalChildrenRes = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${selectedMandalId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const mandalChildrenData = await mandalChildrenRes.json();
                const mandalChildren = mandalChildrenData.children || [];

                let actualPollingCenters: any[] = [];

                // Check each child to determine if it's a polling center or booth
                for (const child of mandalChildren) {
                    // Try to fetch children first to determine the structure
                    try {
                        const childrenRes = await fetch(
                            `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${child.id}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        const childrenData = await childrenRes.json();
                        const children = childrenData.children || [];
                        
                        if (children.length > 0) {
                            // This child has children, so it's likely a polling center
                            actualPollingCenters.push(child);
                        } else {
                            // This child has no children
                            // Check if it's a polling center by examining its levelName or other properties
                            const isActualPollingCenter = child.levelName === 'PollingCenter' || 
                                                        child.levelName === 'Polling Center' ||
                                                        child.displayName?.toLowerCase().includes('polling') ||
                                                        // If it doesn't have children and is not explicitly a booth, might be polling center
                                                        (child.levelName !== 'Booth' && child.levelName !== 'booth');
                            
                            if (isActualPollingCenter) {
                                actualPollingCenters.push(child);
                            }
                            // If it's not a polling center, we ignore it (it might be a direct booth)
                        }
                    } catch (childError) {
                        // If we can't fetch children, check if it looks like a polling center
                        console.log(`Error fetching children for ${child.displayName}:`, childError);
                        const isLikelyPollingCenter = child.levelName === 'PollingCenter' || 
                                                    child.levelName === 'Polling Center' ||
                                                    child.displayName?.toLowerCase().includes('polling');
                        
                        if (isLikelyPollingCenter) {
                            actualPollingCenters.push(child);
                        }
                    }
                }

                setAllPollingCenters(actualPollingCenters);
            } catch (err) {
                console.error("Error fetching polling centers:", err);
                setError(err);
            } finally {
                setLoadingPollingCenters(false);
            }
        };

        fetchAllPollingCenters();
    }, [selectedMandalId]);

    const pollingCenters = allPollingCenters;

    // Handle polling centers without users filter
    const handlePollingCentersWithoutUsersClick = () => {
        const pollingCentersWithoutUsersCount = pollingCenters.filter(pc => (pc.user_count || 0) === 0).length;
        
        if (pollingCentersWithoutUsersCount > 0) {
            setShowPollingCentersWithoutUsers(!showPollingCentersWithoutUsers);
            setCurrentPage(1); // Reset to page 1
        }
    };

    const filteredPollingCenters = pollingCenters.filter((pc) => {
        const matchesSearch = pc.displayName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = selectedPollingCenterFilter === "" || pc.id.toString() === selectedPollingCenterFilter;
        
        // Apply polling centers without users filter
        const matchesWithoutUsersFilter = showPollingCentersWithoutUsers 
            ? (pc.user_count || 0) === 0 
            : true;
        
        return matchesSearch && matchesFilter && matchesWithoutUsersFilter;
    });

    const handleViewUsers = async (pollingCenterId: number) => {
        // If already expanded, collapse it
        if (expandedPollingCenterId === pollingCenterId) {
            setExpandedPollingCenterId(null);
            return;
        }

        // If users already loaded, just expand
        if (pollingCenterUsers[pollingCenterId]) {
            setExpandedPollingCenterId(pollingCenterId);
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/after-assembly/${pollingCenterId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                    },
                }
            );
            const data = await response.json();
            
            if (data.success && data.data?.users) {
                // Store users data
                setPollingCenterUsers(prev => ({
                    ...prev,
                    [pollingCenterId]: data.data.users
                }));
                setExpandedPollingCenterId(pollingCenterId);
            } else {
                console.log('Polling Center API Error or No Users:', data);
            }
        } catch (error) {
            console.error(`Error fetching users for polling center ${pollingCenterId}:`, error);
        }
    };



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

    // Auto-select first block if available
    useEffect(() => {
        if (blocks.length > 0 && selectedBlockId === 0) {
            setSelectedBlockId(blocks[0].id);
        }
    }, [blocks]);

    // Auto-select first mandal when mandals load
    useEffect(() => {
        if (mandals.length > 0 && selectedBlockId > 0 && selectedMandalId === 0) {
            setSelectedMandalId(mandals[0].id);
        }
    }, [mandals, selectedBlockId]);

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

                            {/* Polling Centers Without Users Card - Clickable */}
                            <div 
                                onClick={handlePollingCentersWithoutUsersClick}
                                className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${
                                    pollingCenters.filter(pc => (pc.user_count || 0) === 0).length > 0
                                        ? 'cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-red-50' 
                                        : 'cursor-default'
                                } ${
                                    showPollingCentersWithoutUsers 
                                        ? 'ring-2 ring-red-500 bg-red-50' 
                                        : ''
                                }`}
                                title={pollingCenters.filter(pc => (pc.user_count || 0) === 0).length > 0 ? "Click to view polling centers without users" : "No polling centers without users"}
                            >
                                <div>
                                    <p className="text-xs font-medium text-gray-600">
                                        Polling Centers Without Users
                                        {showPollingCentersWithoutUsers && (
                                            <span className="ml-2 text-red-600 font-semibold"></span>
                                        )}
                                    </p>
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
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                                    setSelectedMandalId(0);
                                    setSelectedPollingCenterFilter("");
                                    setCurrentPage(1);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                                Select Mandal <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedMandalId}
                                onChange={(e) => {
                                    setSelectedMandalId(Number(e.target.value));
                                    setSelectedPollingCenterFilter("");
                                    setCurrentPage(1);
                                }}
                                disabled={!selectedBlockId}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value={0}>Select a Mandal</option>
                                {mandals.map((mandal) => (
                                    <option key={mandal.id} value={mandal.id}>
                                        {mandal.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Polling Center
                            </label>
                            <select
                                value={selectedPollingCenterFilter}
                                onChange={(e) => {
                                    setSelectedPollingCenterFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                disabled={!selectedMandalId}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">All Polling Centers</option>
                                {pollingCenters.map((pc) => (
                                    <option key={pc.id} value={pc.id}>
                                        {pc.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
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
                                    disabled={!selectedMandalId}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Polling Center List */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {!selectedBlockId ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-2 text-gray-500 font-medium">Please select a block to view mandals</p>
                        </div>
                    ) : !selectedMandalId ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-2 text-gray-500 font-medium">Please select a mandal to view polling centers</p>
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
                            <p className="mt-2 text-gray-500 font-medium">No polling centers found in this mandal</p>
                            <p className="mt-1 text-xs text-gray-400">
                                This mandal may contain only direct booths. 
                                <br />
                                Please check the <span className="font-semibold">Booth</span> section to view booths.
                            </p>
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
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Users</th>
                                            
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Assigned Booth</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedPollingCenters.map((pc, index) => (
                                            <>
                                                <tr key={pc.id} className="hover:bg-green-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                        {mandals.find(m => m.id === selectedMandalId)?.displayName || "Mandal"}
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
                                                            onClick={() => handleViewUsers(pc.id)}
                                                            className={`inline-flex items-center p-1 rounded-md transition-colors mr-2 ${
                                                                expandedPollingCenterId === pc.id
                                                                    ? "text-green-700 bg-green-100"
                                                                    : "text-green-600 hover:bg-green-50 hover:text-green-700"
                                                            }`}
                                                            title={expandedPollingCenterId === pc.id ? "Hide Users" : "View Users"}
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
                                              
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPollingCenterForVoters({ id: pc.id, name: pc.displayName });
                                                            setShowAssignVotersModal(true);
                                                        }}
                                                        className="p-2 hover:bg-indigo-50 rounded-lg transition-colors group"
                                                        title="Assign Booth Voters"
                                                    >
                                                        <svg className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                            
                                            {/* Inline User Display */}
                                            {expandedPollingCenterId === pc.id && pollingCenterUsers[pc.id] && (
                                                <InlineUserDisplay
                                                    users={pollingCenterUsers[pc.id]}
                                                    locationName={pc.displayName}
                                                    locationId={pc.id}
                                                    locationType="PollingCenter"
                                                    parentLocationName={mandals.find(m => m.id === selectedMandalId)?.displayName || "Mandal"}
                                                    parentLocationType="Mandal"
                                                    onUserDeleted={() => {
                                                        // Refresh user counts after deletion
                                                        setExpandedPollingCenterId(null);
                                                        setPollingCenterUsers(prev => {
                                                            const updated = { ...prev };
                                                            delete updated[pc.id];
                                                            return updated;
                                                        });
                                                        window.location.reload();
                                                    }}
                                                    onClose={() => setExpandedPollingCenterId(null)}
                                                    colSpan={7}
                                                />
                                            )}
                                        </>
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
