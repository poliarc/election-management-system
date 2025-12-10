import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useDashboard } from "../../hooks/useDashboard";
import { getDashboardNavigation, getDynamicIconType, getIconSvgPath, getDynamicCardColor } from "../../utils/dashboardNavigation";

export default function AssemblyDashboard() {
    const navigate = useNavigate();
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assemblyId = selectedAssignment?.stateMasterData_id;
    const assemblyName = selectedAssignment?.levelName || "Assembly";
    const [stateId, setStateId] = useState<number | null>(null);
    const [partyId, setPartyId] = useState<number | null>(null);

    // Get additional info from localStorage
    useEffect(() => {
        const loadAssemblyInfo = () => {
            try {
                const authState = localStorage.getItem('auth_state');
                if (authState) {
                    const parsed = JSON.parse(authState);
                    const selectedAssignment = parsed.selectedAssignment;

                    // Get state ID - for assembly, we need to traverse up the hierarchy
                    if (selectedAssignment?.levelType === 'Assembly') {
                        // Try to get state ID from the assignment or use default
                        // In a real implementation, you might need to traverse the hierarchy
                        if (selectedAssignment.parentId) {
                            // If parentId exists, it might be district ID, we need state ID
                            // For now, use a default state ID or get it from user context
                            setStateId(1); // Default state ID
                        } else {
                            setStateId(1); // Default state ID
                        }
                    }

                    // Get party ID if available
                    if (parsed.user && parsed.user.partyId) {
                        setPartyId(parsed.user.partyId);
                    }
                }
            } catch (err) {
                console.error('Error reading assembly info:', err);
            }
        };

        loadAssemblyInfo();
    }, []);

    // Use dashboard hook
    const { cards, levelInfo, loading, error } = useDashboard({
        state_id: stateId || 0,
        party_id: partyId || 0,
        level_id: assemblyId || undefined,
        level_type: 'Assembly',
    });

    // Dynamic navigation function for stats cards
    const handleStatsCardClick = (title: string) => {
        const navigationPath = getDashboardNavigation(title, 'Assembly');
        if (navigationPath) {
            navigate(navigationPath);
        }
    };



    // Helper function to get icon for card - now dynamic
    const getIconForCard = (title: string) => {
        const iconType = getDynamicIconType(title);
        const svgPath = getIconSvgPath(iconType);
        return (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={svgPath} />
            </svg>
        );
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
                        {levelInfo?.name || assemblyName} Assembly Dashboard
                    </h1>
                </div>
            </header>

            {/* Summary Stats - Clickable Cards */}
            {cards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {cards.map((card, index) => {
                        const colorClasses = getDynamicCardColor(index);
                        const iconSvg = getIconForCard(card.title);

                        return (
                            <div
                                key={index}
                                onClick={() => handleStatsCardClick(card.title)}
                                className={`${colorClasses.bg} rounded-xl shadow-lg p-5 text-white cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-1`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`${colorClasses.text} text-xs font-medium`}>{card.title}</p>
                                        <p className="text-2xl font-bold mt-1">{card.count}</p>
                                        <p className="text-sm opacity-90 mt-1">{card.userCount} users</p>
                                    </div>
                                    <div className="bg-white/20 rounded-full p-2">
                                        {iconSvg}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                    <p className="text-gray-600">No hierarchy levels have been set up yet for this assembly.</p>
                </div>
            )}
        </div>
    );
}