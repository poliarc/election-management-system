import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchAssignedUsersForLevel, fetchAfterAssemblyChildrenByParent } from "../../services/afterAssemblyApi";
import { useAppSelector } from "../../store/hooks";
import toast from "react-hot-toast";

export default function SubLevelPanelDashboard() {
    const { levelId } = useParams<{ levelId: string }>();
    const { user } = useAppSelector((s) => s.auth);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        childLevels: 0,
    });
    const [loading, setLoading] = useState(true);
    const [levelInfo, setLevelInfo] = useState<any>(null);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!levelId) return;

            try {
                setLoading(true);

                // Get level info from localStorage
                const authState = localStorage.getItem("auth_state");
                if (authState) {
                    const parsed = JSON.parse(authState);
                    setLevelInfo(parsed.selectedAssignment);
                }

                // Fetch users for this level
                const usersResponse = await fetchAssignedUsersForLevel(Number(levelId));
                if (usersResponse.success && usersResponse.users) {
                    setStats(prev => ({
                        ...prev,
                        totalUsers: usersResponse.users.length,
                        activeUsers: usersResponse.users.filter((u: any) => u.isActive).length,
                    }));
                }

                // Fetch child levels
                const childrenResponse = await fetchAfterAssemblyChildrenByParent(Number(levelId));
                if (childrenResponse.success && childrenResponse.data) {
                    setStats(prev => ({
                        ...prev,
                        childLevels: childrenResponse.data.length,
                    }));
                }
            } catch (error) {
                console.error("Failed to load dashboard data:", error);
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [levelId]);

    return (
        <div className="p-1 bg-gray-50 min-h-screen">
            {/* Header with Stats Cards */}
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg shadow-lg p-4 sm:p-6 text-white mb-1">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="shrink-0">
                        <h1 className="text-xl sm:text-2xl font-bold">
                            {levelInfo?.displayName || levelInfo?.levelName || "Sub Level"} Dashboard
                        </h1>
                        <p className="text-teal-100 mt-1 text-xs sm:text-sm">
                            {levelInfo?.levelType || "Level"}
                            {levelInfo?.parentLevelName && levelInfo.parentLevelName !== 'Unknown'
                                ? ` under ${levelInfo.parentLevelName}`
                                : levelInfo?.assemblyName
                                    ? ` under ${levelInfo.assemblyName}`
                                    : ""}
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Child Levels</p>
                                <p className="text-2xl sm:text-3xl font-semibold text-teal-600 mt-1">
                                    {loading ? "..." : stats.childLevels}
                                </p>
                            </div>
                            <div className="bg-teal-50 rounded-full p-2">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Level Information */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Level Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs sm:text-sm text-gray-600">Level Name</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-900">{levelInfo?.levelName || levelInfo?.displayName || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm text-gray-600">Level Type</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-900">{levelInfo?.levelType || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm text-gray-600">Party Name</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-900">
                            {user?.partyName || "N/A"}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm text-gray-600">Parent Type</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-900">
                            {levelInfo?.parentId === null
                                ? "Assembly"
                                : (levelInfo?.parentLevelType && levelInfo.parentLevelType !== 'Unknown'
                                    ? levelInfo.parentLevelType
                                    : levelInfo?.levelType || "Parent Type")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
