import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useDashboard } from "../../hooks/useDashboard";
import { getDashboardNavigation, getDynamicIconType, getIconSvgPath, getDynamicCardColor } from "../../utils/dashboardNavigation";
import { useTranslation } from "react-i18next";

export default function AssemblyDashboard() {
    const navigate = useNavigate();
    const user = useSelector((state: RootState) => state.auth.user);
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assemblyId = selectedAssignment?.stateMasterData_id;
    const assemblyName = selectedAssignment?.levelName || "Assembly";
    const { t } = useTranslation();

    // Get state_id and party_id from user
    const stateId = user?.state_id || null;
    const partyId = user?.partyId || null;

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
            <div className="glass-dashboard w-full py-1 min-h-screen box-border rounded-2xl shadow-md border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-color)] transition-colors duration-400 ease-in-out [will-change:background-color,color] mx-auto px-4">
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-[var(--text-secondary)]">{t('assemblyDashboard.Loading_dashboard_data')}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-dashboard w-full py-1 min-h-screen box-border rounded-2xl shadow-md border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-color)] transition-colors duration-400 ease-in-out [will-change:background-color,color] mx-auto px-4">
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <div className="text-red-500 mb-4">
                            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-[var(--text-secondary)]">{t('assemblyDashboard.Error_loading_dashboard')}: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-dashboard w-full py-1 min-h-screen box-border rounded-2xl shadow-md border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-color)] transition-colors duration-400 ease-in-out [will-change:background-color,color] mx-auto px-4">
            {/* Header */}
            <header className="mb-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-color)]">
                        {levelInfo?.name || assemblyName} {t('assemblyDashboard.Assembly_Dashboard')}
                    </h1>
                </div>
            </header>

            {/* Summary Stats - Clickable Cards */}
            {cards.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-8">
                        {cards.map((card, index) => {
                            const colorClasses = getDynamicCardColor(partyId || 0);
                            const iconSvg = getIconForCard(card.title);

                            return (
                                <div
                                    key={index}
                                    onClick={() => handleStatsCardClick(card.title)}
                                    className={`dashboard-stat-card ${colorClasses.bg} rounded-xl shadow-lg p-5 text-white cursor-pointer hover:shadow-xl transition-[background-color,color,border-color,box-shadow,transform] duration-400 ease-in-out hover:-translate-y-1`}
                                    style={{ animationDelay: `${index * 70}ms` }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`${colorClasses.text} text-xs font-medium`}>{card.title}</p>
                                            <p className="text-2xl font-bold mt-1">{card.count}</p>
                                            <p className="text-sm opacity-90 mt-1">{card.userCount} users</p>
                                        </div>
                                        <div className="bg-[var(--bg-card)]/20 rounded-full p-2">
                                            {iconSvg}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Analytics Dashboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* User Distribution Pie Chart */}
                        <div className="glass-panel bg-[var(--bg-card)] rounded-xl shadow-lg p-6 border border-[var(--border-color)] hover:shadow-2xl transition-[background-color,color,border-color,box-shadow,transform] duration-400 ease-in-out hover:-translate-y-1 group">
                            <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4 flex items-center group-hover:text-blue-600 transition-colors duration-300">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 group-hover:animate-pulse"></div>
                                {t('assemblyDashboard.User_Distribution_Pie_Chart')}
                            </h3>
                            <div className="flex items-center justify-center">
                                <div className="relative w-48 h-48">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        {cards.map((card, index) => {
                                            const total = cards.reduce((sum, c) => sum + c.userCount, 0);
                                            const percentage = total > 0 ? (card.userCount / total) * 100 : 0;
                                            const strokeDasharray = `${percentage * 2.51} 251.2`;
                                            const strokeDashoffset = index > 0 ?
                                                -cards.slice(0, index).reduce((sum, c) => sum + (c.userCount / total) * 251.2, 0) : 0;

                                            const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

                                            return (
                                                <circle
                                                    key={index}
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    fill="none"
                                                    stroke={colors[index % colors.length]}
                                                    strokeWidth="8"
                                                    strokeDasharray={strokeDasharray}
                                                    strokeDashoffset={strokeDashoffset}
                                                    className="transition-all duration-1000 ease-out hover:stroke-[10] cursor-pointer"
                                                    style={{ animationDelay: `${index * 200}ms` }}
                                                />
                                            );
                                        })}
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-[var(--text-color)]">
                                                {cards.reduce((sum, c) => sum + c.userCount, 0)}
                                            </div>
                                            <div className="text-sm text-[var(--text-secondary)]">Total Users</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                {cards.slice(0, 6).map((card, index) => {
                                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-cyan-500'];
                                    return (
                                        <div key={index} className="flex items-center text-sm hover:bg-[var(--text-color)]/5 p-2 rounded-lg transition-all duration-200 cursor-pointer group">
                                            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-2 group-hover:scale-125 transition-transform duration-200`}></div>
                                            <span className="text-[var(--text-secondary)] truncate group-hover:text-[var(--text-color)] group-hover:font-medium transition-all duration-200">{card.title} users: {card.userCount}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Activity Trends Bar Chart */}
                        <div className="glass-panel bg-[var(--bg-card)] rounded-xl shadow-lg p-6 border border-[var(--border-color)] hover:shadow-2xl transition-[background-color,color,border-color,box-shadow,transform] duration-400 ease-in-out hover:-translate-y-1 group">
                            <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4 flex items-center group-hover:text-green-600 transition-colors duration-300">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 group-hover:animate-pulse"></div>
                                {t('assemblyDashboard.Activity_Trends_Bar_Chart')}
                            </h3>
                            <div className="space-y-4">
                                {cards.slice(0, 5).map((card, index) => {
                                    const maxCount = Math.max(...cards.map(c => c.count));
                                    const percentage = maxCount > 0 ? (card.count / maxCount) * 100 : 0;
                                    const colors = ['bg-gradient-to-r from-blue-400 to-blue-600',
                                        'bg-gradient-to-r from-green-400 to-green-600',
                                        'bg-gradient-to-r from-yellow-400 to-yellow-600',
                                        'bg-gradient-to-r from-red-400 to-red-600',
                                        'bg-gradient-to-r from-purple-400 to-purple-600'];

                                    return (
                                        <div key={index} className="space-y-2 hover:bg-[var(--text-color)]/5 p-3 rounded-lg transition-all duration-200 cursor-pointer group">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-[var(--text-secondary)] truncate group-hover:text-[var(--text-color)] group-hover:font-semibold transition-all duration-200">{card.title}</span>
                                                <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-secondary)] group-hover:font-medium transition-all duration-200">{card.count}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden group-hover:h-4 transition-all duration-200">
                                                <div
                                                    className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-1000 ease-out group-hover:shadow-lg`}
                                                    style={{
                                                        width: `${percentage}%`,
                                                        animationDelay: `${index * 100}ms`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Locations */}
                        <div className="glass-kpi-card bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg p-6 border border-blue-200 hover:shadow-2xl hover:-translate-y-2 transition-[background-color,color,border-color,box-shadow,transform] duration-400 ease-in-out cursor-pointer group hover:from-blue-100 hover:to-indigo-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-blue-700 mb-1 group-hover:text-blue-800 transition-colors duration-300">{t('assemblyDashboard.Total_Locations_KPI')}</h4>
                                    <p className="text-3xl font-bold text-blue-900 group-hover:scale-110 transition-transform duration-300">{cards.reduce((sum, c) => sum + c.count, 0)}</p>
                                    <p className="text-sm text-blue-600 mt-1 group-hover:text-blue-700 transition-colors duration-300">{t('assemblyDashboard.Across_all_levels_KPI')}</p>
                                </div>
                                <div className="bg-blue-500 rounded-full p-3 group-hover:bg-blue-600 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Active Users */}
                        <div className="glass-kpi-card bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-lg p-6 border border-green-200 hover:shadow-2xl hover:-translate-y-2 transition-[background-color,color,border-color,box-shadow,transform] duration-400 ease-in-out cursor-pointer group hover:from-green-100 hover:to-emerald-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-green-700 mb-1 group-hover:text-green-800 transition-colors duration-300">{t('assemblyDashboard.Active_Users_KPI')}</h4>
                                    <p className="text-3xl font-bold text-green-900 group-hover:scale-110 transition-transform duration-300">{cards.reduce((sum, c) => sum + c.userCount, 0)}</p>
                                    <p className="text-sm text-green-600 mt-1 group-hover:text-green-700 transition-colors duration-300">{t('assemblyDashboard.Currently_assigned_KPI')}</p>
                                </div>
                                <div className="bg-green-500 rounded-full p-3 group-hover:bg-green-600 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Coverage Rate */}
                        <div className="glass-kpi-card bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl shadow-lg p-6 border border-purple-200 hover:shadow-2xl hover:-translate-y-2 transition-[background-color,color,border-color,box-shadow,transform] duration-400 ease-in-out cursor-pointer group hover:from-purple-100 hover:to-violet-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-purple-700 mb-1 group-hover:text-purple-800 transition-colors duration-300">{t('assemblyDashboard.Coverage_Rate_KPI')}</h4>
                                    <p className="text-3xl font-bold text-purple-900 group-hover:scale-110 transition-transform duration-300">
                                        {cards.length > 0 ? Math.round((cards.filter(c => c.userCount > 0).length / cards.length) * 100) : 0}%
                                    </p>
                                    <p className="text-sm text-purple-600 mt-1 group-hover:text-purple-700 transition-colors duration-300">{t('assemblyDashboard.Levels_with_users_KPI')}</p>
                                </div>
                                <div className="bg-purple-500 rounded-full p-3 group-hover:bg-purple-600 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="glass-empty-panel bg-[var(--bg-card)] rounded-lg shadow-md p-8 text-center border border-[var(--border-color)] transition-colors duration-400 ease-in-out">
                    <div className="text-[var(--text-secondary)] mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">No Data Available</h3>
                    <p className="text-[var(--text-secondary)]">No hierarchy levels have been set up yet for this assembly.</p>
                </div>
            )}
        </div>
    );
}




