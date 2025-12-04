import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import { fetchAssignedUsers } from "../../../services/levelAdminApi";

export default function LevelAdminDashboard() {
    const { levelId } = useParams<{ levelId: string }>();
    const { levelAdminPanels } = useAppSelector((state) => state.auth);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
    });
    const [loading, setLoading] = useState(true);

    const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

    useEffect(() => {
        const loadStats = async () => {
            if (!currentPanel?.metadata) return;

            try {
                setLoading(true);
                const response = await fetchAssignedUsers(
                    currentPanel.metadata.stateId,
                    1,
                    1000 // Get all users for stats
                );
                if (response.success) {
                    // Handle both response formats: response.data.users or response.data
                    const users = response.data?.users || response.data || [];

                    // Filter out super admins
                    const filteredUsers = users.filter((u: any) => u.isSuperAdmin !== 1);

                    setStats({
                        totalUsers: filteredUsers.length,
                        activeUsers: filteredUsers.filter((u: any) => {
                            const isActive = u.isActive !== undefined ? u.isActive === 1 : u.is_active;
                            return isActive;
                        }).length,
                        inactiveUsers: filteredUsers.filter((u: any) => {
                            const isActive = u.isActive !== undefined ? u.isActive === 1 : u.is_active;
                            return !isActive;
                        }).length,
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
            {/* Header */}
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
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-2xl sm:text-3xl font-semibold mt-1">
                                    {loading ? "..." : stats.totalUsers}
                                </p>
                            </div>
                            <div className="bg-blue-50 rounded-full p-2">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                        <div className="bg-white text-gray-900 rounded-md shadow-md p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Inactive Users</p>
                                <p className="text-2xl sm:text-3xl font-semibold text-red-600 mt-1">
                                    {loading ? "..." : stats.inactiveUsers}
                                </p>
                            </div>
                            <div className="bg-red-50 rounded-full p-2">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <div className="mt-1 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Panel Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Level Type</p>
                        <p className="text-lg font-semibold text-gray-900">{currentPanel.metadata?.stateLevelType}</p>
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
