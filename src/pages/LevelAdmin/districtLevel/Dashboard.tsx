import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import { fetchHierarchyChildren } from "../../../services/hierarchyApi";

export default function DistrictLevelDashboard() {
    const { levelId } = useParams<{ levelId: string }>();
    const { levelAdminPanels } = useAppSelector((state) => state.auth);
    const [stats, setStats] = useState({
        totalDistricts: 0,
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
    });
    const [loading, setLoading] = useState(true);

    const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

    useEffect(() => {
        const loadStats = async () => {
            if (!currentPanel?.metadata?.stateId) return;

            try {
                setLoading(true);
                const response = await fetchHierarchyChildren(currentPanel.metadata.stateId, {
                    page: 1,
                    limit: 1000
                });

                if (response.success && response.data?.children) {
                    const districts = response.data.children;
                    const totalUsers = districts.reduce((sum: number, d: any) => sum + (d.total_users || 0), 0);
                    const activeUsers = districts.reduce((sum: number, d: any) => sum + (d.active_users || 0), 0);
                    const inactiveUsers = districts.reduce((sum: number, d: any) => sum + (d.inactive_users || 0), 0);

                    setStats({
                        totalDistricts: districts.length,
                        totalUsers,
                        activeUsers,
                        inactiveUsers,
                    });
                }
            } catch (error) {
                console.error("Failed to load stats:", error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, [currentPanel]);

    if (!currentPanel) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
                    <p className="text-red-700">Level admin panel not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-1 bg-gray-50 min-h-screen">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-3 sm:p-3 text-white mb-1">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="shrink-0">
                        <h1 className="text-xl sm:text-2xl font-bold">{currentPanel.displayName} Dashboard</h1>
                        <p className="text-blue-100 mt-1 text-xs sm:text-sm">
                            {currentPanel.metadata?.stateName} - {currentPanel.metadata?.partyName}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                        <div className="bg-white text-gray-900 rounded-md shadow-md p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Districts</p>
                                <p className="text-2xl sm:text-3xl font-semibold mt-1">
                                    {loading ? "..." : stats.totalDistricts}
                                </p>
                            </div>
                            <div className="bg-blue-50 rounded-full p-2">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-white text-gray-900 rounded-md shadow-md p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-2xl sm:text-3xl font-semibold mt-1">
                                    {loading ? "..." : stats.totalUsers}
                                </p>
                            </div>
                            <div className="bg-purple-50 rounded-full p-2">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-white text-gray-900 rounded-md shadow-md p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Users</p>
                                <p className="text-2xl sm:text-3xl font-semibold text-green-600 mt-1">
                                    {loading ? "..." : stats.activeUsers}
                                </p>
                            </div>
                            <div className="bg-green-50 rounded-full p-2">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-1 bg-white rounded-lg shadow-md p-3">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Panel Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Level Type</p>
                        <p className="text-lg font-semibold text-gray-900">{currentPanel.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">State</p>
                        <p className="text-lg font-semibold text-gray-900">{currentPanel.metadata?.stateName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Party</p>
                        <p className="text-lg font-semibold text-gray-900">{currentPanel.metadata?.partyName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Parent Level</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {currentPanel.metadata?.parentLevelName || "None"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
