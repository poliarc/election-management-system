import { useState, useEffect } from "react";
import { useGetBlocksByAssemblyQuery } from "../../../store/api/blockApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import AssignBoothVotersModal from "../../../components/AssignBoothVotersModal";
import InlineUserDisplay from "../../../components/InlineUserDisplay";


export default function MandalList() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
    const [selectedMandalFilter, setSelectedMandalFilter] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // State for all mandals in the assembly
    const [allMandals, setAllMandals] = useState<any[]>([]);
    const [isLoadingAllMandals, setIsLoadingAllMandals] = useState(false);

    const [showAssignVotersModal, setShowAssignVotersModal] = useState(false);
    const [selectedMandalForVoters, setSelectedMandalForVoters] = useState<{ id: number; name: string } | null>(null);
    
    // State for inline user display
    const [expandedMandalId, setExpandedMandalId] = useState<number | null>(null);
    const [mandalUsers, setMandalUsers] = useState<Record<number, any[]>>({});
    
    // State for filtering mandals without users
    const [showMandalsWithoutUsers, setShowMandalsWithoutUsers] = useState(false);



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

    // Function to fetch all mandals from all blocks in the assembly
    const fetchAllMandals = async () => {
        if (!assemblyInfo.assemblyId || blocks.length === 0) return;

        setIsLoadingAllMandals(true);
        const allMandalsData: any[] = [];

        try {
            const token = localStorage.getItem("auth_access_token");

            // Fetch mandals from all blocks in parallel
            const mandalPromises = blocks.map(async (block: any) => {
                try {
                    let allBlockMandals: any[] = [];
                    let page = 1;
                    let hasMore = true;

                    while (hasMore) {
                        const response = await fetch(
                            `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${block.id}?page=${page}&limit=50`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );
                        const data = await response.json();
                        
                        if (data.success && data.children && data.children.length > 0) {
                            allBlockMandals = allBlockMandals.concat(data.children);
                            page++;
                            hasMore = data.children.length === 50;
                        } else {
                            hasMore = false;
                        }
                    }

                    // Add block info to each mandal
                    return allBlockMandals.map((mandal: any) => ({
                        ...mandal,
                        blockName: block.displayName,
                        blockId: block.id,
                    }));
                } catch (error) {
                    console.error(`Error fetching mandals for block ${block.id}:`, error);
                    return [];
                }
            });

            const mandalResults = await Promise.all(mandalPromises);
            const flatMandals = mandalResults.flat();
            allMandalsData.push(...flatMandals);

            setAllMandals(allMandalsData);
        } catch (error) {
            console.error("Error fetching all mandals:", error);
        } finally {
            setIsLoadingAllMandals(false);
        }
    };

    // Fetch all mandals when blocks are loaded
    useEffect(() => {
        if (blocks.length > 0) {
            fetchAllMandals();
        }
    }, [blocks]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Use all mandals by default, or filtered mandals based on selected block
    const mandals = (() => {
        if (selectedBlockId > 0) {
            // Filter by selected block
            return allMandals.filter((mandal) => mandal.blockId === selectedBlockId);
        }
        // Return all mandals if no block filter is selected
        return allMandals;
    })();

    // Handle mandals without users filter
    const handleMandalsWithoutUsersClick = () => {
        const mandalsWithoutUsersCount = mandals.filter(mandal => (mandal.user_count || 0) === 0).length;
        
        if (mandalsWithoutUsersCount > 0) {
            setShowMandalsWithoutUsers(!showMandalsWithoutUsers);
            setCurrentPage(1); // Reset to page 1
        }
    };

    const filteredMandals = mandals.filter((mandal) => {
        const matchesSearch = mandal.displayName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = selectedMandalFilter === "" || mandal.id.toString() === selectedMandalFilter;
        
        // Apply mandals without users filter
        const matchesWithoutUsersFilter = showMandalsWithoutUsers 
            ? (mandal.user_count || 0) === 0 
            : true;
        
        return matchesSearch && matchesFilter && matchesWithoutUsersFilter;
    });

    const handleViewUsers = async (mandalId: number) => {
        // If already expanded, collapse it
        if (expandedMandalId === mandalId) {
            setExpandedMandalId(null);
            return;
        }

        // If users already loaded, just expand
        if (mandalUsers[mandalId]) {
            setExpandedMandalId(mandalId);
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/after-assembly/${mandalId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                    },
                }
            );
            const data = await response.json();
            
            if (data.success && data.data?.users) {
                // Store users data
                setMandalUsers(prev => ({
                    ...prev,
                    [mandalId]: data.data.users
                }));
                setExpandedMandalId(mandalId);
            } else {
                // No users found or API error
            }
        } catch (error) {
            console.error(`Error fetching users for mandal ${mandalId}:`, error);
        }
    };



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

    // Remove auto-selection of first block - let user see all mandals by default
    // useEffect(() => {
    //     if (blocks.length > 0 && !selectedBlockId) {
    //         setSelectedBlockId(blocks[0].id);
    //     }
    // }, [blocks, selectedBlockId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-1">
            <div className="w-full mx-auto">
                {/* Header with Stats Cards */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-3 sm:p-3 mb-1 text-white">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="shrink-0">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Mandal List</h1>
                            <p className="text-blue-100 text-xs sm:text-sm mt-1">
                                Assembly: {assemblyInfo.assemblyName} | District: {assemblyInfo.districtName}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                            {/* Total Mandals Card */}
                            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Total Mandals</p>
                                    <p className="text-xl sm:text-2xl font-semibold mt-1">{mandals.length}</p>
                                </div>
                                <div className="bg-blue-50 rounded-full p-1.5">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3L3 9l9 6 9-6-9-6zm0 6v12" />
                                    </svg>
                                </div>
                            </div>

                            {/* Total Users Card */}
                            <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Total Users</p>
                                    <p className="text-xl sm:text-2xl font-semibold text-green-600 mt-1">
                                        {mandals.reduce((sum, mandal) => sum + (mandal.user_count || 0), 0)}
                                    </p>
                                </div>
                                <div className="bg-green-50 rounded-full p-1.5">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Mandals Without Users Card - Clickable */}
                            <div 
                                onClick={handleMandalsWithoutUsersClick}
                                className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${
                                    mandals.filter(mandal => (mandal.user_count || 0) === 0).length > 0
                                        ? 'cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-red-50' 
                                        : 'cursor-default'
                                } ${
                                    showMandalsWithoutUsers 
                                        ? 'ring-2 ring-red-500 bg-red-50' 
                                        : ''
                                }`}
                                title={mandals.filter(mandal => (mandal.user_count || 0) === 0).length > 0 ? "Click to view mandals without users" : "No mandals without users"}
                            >
                                <div>
                                    <p className="text-xs font-medium text-gray-600">
                                        Mandals Without Users
                                        {showMandalsWithoutUsers && (
                                            <span className="ml-2 text-red-600 font-semibold"></span>
                                        )}
                                    </p>
                                    <p className={`text-xl sm:text-2xl font-semibold mt-1 ${mandals.filter(mandal => (mandal.user_count || 0) === 0).length > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                        {mandals.filter(mandal => (mandal.user_count || 0) === 0).length}
                                    </p>
                                </div>
                                <div className={`rounded-full p-1.5 ${mandals.filter(mandal => (mandal.user_count || 0) === 0).length > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                                    {mandals.filter(mandal => (mandal.user_count || 0) === 0).length > 0 ? (
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
                                Select Block
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
                                <option value={0}>All Blocks</option>
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mandal List */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {isLoadingAllMandals ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-gray-600">Loading mandals...</p>
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
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                               Total Users
                                            </th>
                                            
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                Assigned Booth
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedMandals.map((mandal, index) => (
                                            <>
                                                <tr key={mandal.id} className="hover:bg-blue-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                        {mandal.blockName || "N/A"}
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
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center">
                                                        <button
                                                            onClick={() => handleViewUsers(mandal.id)}
                                                            className={`inline-flex items-center p-1 rounded-md transition-colors mr-2 ${
                                                                expandedMandalId === mandal.id
                                                                    ? "text-blue-700 bg-blue-100"
                                                                    : "text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                            }`}
                                                            title={expandedMandalId === mandal.id ? "Hide Users" : "View Users"}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {mandal.user_count || 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMandalForVoters({ id: mandal.id, name: mandal.displayName });
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
                                            {expandedMandalId === mandal.id && mandalUsers[mandal.id] && (
                                                <InlineUserDisplay
                                                    users={mandalUsers[mandal.id]}
                                                    locationName={mandal.displayName}
                                                    locationId={mandal.id}
                                                    locationType="Mandal"
                                                    parentLocationName={mandal.blockName || "Unknown Block"}
                                                    parentLocationType="Block"
                                                    onUserDeleted={() => {
                                                        // Refresh user counts after deletion
                                                        setExpandedMandalId(null);
                                                        setMandalUsers(prev => {
                                                            const updated = { ...prev };
                                                            delete updated[mandal.id];
                                                            return updated;
                                                        });
                                                        window.location.reload();
                                                    }}
                                                    onClose={() => setExpandedMandalId(null)}
                                                    colSpan={7}
                                                />
                                            )}
                                        </>
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
