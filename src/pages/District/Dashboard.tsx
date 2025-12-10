import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useHierarchyDashboard } from "../../hooks/useHierarchyDashboard";

export default function DistrictDashboard() {
    const navigate = useNavigate();
    const [districtId, setDistrictId] = useState<number | null>(null);
    const [stateId, setStateId] = useState<number | null>(null);
    const [partyId, setPartyId] = useState<number | null>(null);
    const [districtName, setDistrictName] = useState("");

    // Get district info from localStorage
    useEffect(() => {
        const loadDistrictInfo = () => {
            try {
                const authState = localStorage.getItem('auth_state');
                if (authState) {
                    const parsed = JSON.parse(authState);
                    const selectedAssignment = parsed.selectedAssignment;

                    if (selectedAssignment && selectedAssignment.levelType === "District") {
                        const id = selectedAssignment.stateMasterData_id;
                        const name = selectedAssignment.levelName;
                        setDistrictId(id);
                        setDistrictName(name);

                        // Get state ID from parent
                        if (selectedAssignment.parentId) {
                            setStateId(selectedAssignment.parentId);
                        }
                    }

                    // Get party ID if available
                    if (parsed.user && parsed.user.partyId) {
                        setPartyId(parsed.user.partyId);
                    }
                }
            } catch (err) {
                console.error('Error reading district info:', err);
            }
        };

        loadDistrictInfo();

        // Listen for assignment changes
        const handleAssignmentChange = () => {
            loadDistrictInfo();
        };

        window.addEventListener('assignmentChanged', handleAssignmentChange);
        window.addEventListener('districtChanged', handleAssignmentChange);

        return () => {
            window.removeEventListener('assignmentChanged', handleAssignmentChange);
            window.removeEventListener('districtChanged', handleAssignmentChange);
        };
    }, []);

    // Use hierarchy dashboard hook
    const { counts, loading, error } = useHierarchyDashboard({
        stateId: stateId || undefined,
        districtId: districtId || undefined,
        partyId: partyId || undefined,
    });

    // Navigation function for stats cards
    const handleStatsCardClick = (type: string) => {
        switch (type) {
            case 'assemblies':
                navigate('/district/assembly');
                break;
            case 'blocks':
                navigate('/district/block');
                break;
            case 'mandals':
                navigate('/district/mandal');
                break;
            case 'pollingCenters':
                navigate('/district/polling-center');
                break;
            case 'booths':
                navigate('/district/booth');
                break;
            default:
                break;
        }
    };

    // Show loading or error state - MOVED AFTER ALL HOOKS
    if (loading) {
        return (
            <div className="w-full py-1 min-h-screen box-border rounded-2xl shadow-md bg-gray-50 transition-all mx-auto px-4">
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading dashboard data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full py-1 min-h-screen box-border rounded-2xl shadow-md bg-gray-50 transition-all mx-auto px-4">
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <div className="text-red-500 mb-4">
                            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-600">Error loading dashboard: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full py-1 min-h-screen box-border rounded-2xl shadow-md bg-gray-50 transition-all mx-auto px-4">
            {/* Header */}
            <header className="mb-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        {districtName} District Dashboard
                    </h1>
                </div>
            </header>

            {/* Summary Stats - Clickable Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div
                    onClick={() => handleStatsCardClick('assemblies')}
                    className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-xs font-medium">Assemblies</p>
                            <p className="text-2xl font-bold mt-1">{counts.assemblies || 0}</p>
                        </div>
                        <div className="bg-white/20 rounded-full p-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleStatsCardClick('blocks')}
                    className="bg-linear-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-5 text-white cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 text-xs font-medium">Blocks</p>
                            <p className="text-2xl font-bold mt-1">{counts.blocks || 0}</p>
                        </div>
                        <div className="bg-white/20 rounded-full p-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleStatsCardClick('mandals')}
                    className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-xs font-medium">Mandals</p>
                            <p className="text-2xl font-bold mt-1">{counts.mandals || 0}</p>
                        </div>
                        <div className="bg-white/20 rounded-full p-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleStatsCardClick('pollingCenters')}
                    className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-5 text-white cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-100 text-xs font-medium">Polling Centers</p>
                            <p className="text-2xl font-bold mt-1">{counts.pollingCenters || 0}</p>
                        </div>
                        <div className="bg-white/20 rounded-full p-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12h3v8H7v-8Zm7-8h3v16h-3V4Z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => handleStatsCardClick('booths')}
                    className="bg-linear-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-5 text-white cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-teal-100 text-xs font-medium">Booths</p>
                            <p className="text-2xl font-bold mt-1">{counts.booths || 0}</p>
                        </div>
                        <div className="bg-white/20 rounded-full p-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
