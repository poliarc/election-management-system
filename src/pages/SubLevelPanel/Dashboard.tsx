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
        inactiveUsers: 0,
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
                    // Enhanced status checking function (same as Team.tsx and InlineUserDisplay)
                    const checkActiveStatus = (value: any): boolean => {
                        if (value === undefined || value === null) return false;
                        if (typeof value === 'boolean') return value;
                        if (typeof value === 'number') return value === 1;
                        if (typeof value === 'string') return value === 'active' || value === '1' || value === 'true';
                        return false;
                    };

                    const getUserActiveStatus = (user: any): boolean => {
                        if (user.is_active !== undefined && user.is_active !== null) {
                            return checkActiveStatus(user.is_active);
                        } else if (user.user_active !== undefined && user.user_active !== null) {
                            return checkActiveStatus(user.user_active);
                        } else if (user.active !== undefined && user.active !== null) {
                            return checkActiveStatus(user.active);
                        } else if (user.status !== undefined && user.status !== null) {
                            return checkActiveStatus(user.status);
                        } else if (user.isActive !== undefined && user.isActive !== null) {
                            return checkActiveStatus(user.isActive);
                        }
                        return false; // Default to inactive if no status field found
                    };

                    const activeUsersCount = usersResponse.users.filter((u: any) => getUserActiveStatus(u)).length;
                    const totalUsersCount = usersResponse.users.length;
                    const inactiveUsersCount = totalUsersCount - activeUsersCount;

                    setStats(prev => ({
                        ...prev,
                        totalUsers: totalUsersCount,
                        activeUsers: activeUsersCount,
                        inactiveUsers: inactiveUsersCount,
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

        // Listen for assignment changes
        const handleAssignmentChange = () => {
            loadDashboardData();
        };

        window.addEventListener('assignmentChanged', handleAssignmentChange);

        return () => {
            window.removeEventListener('assignmentChanged', handleAssignmentChange);
        };
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                        <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-xl sm:text-2xl font-semibold mt-1">
                                    {loading ? "..." : stats.totalUsers}
                                </p>
                            </div>
                            <div className="bg-blue-50 rounded-full p-2">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Users</p>
                                <p className="text-xl sm:text-2xl font-semibold text-green-600 mt-1">
                                    {loading ? "..." : stats.activeUsers}
                                </p>
                            </div>
                            <div className="bg-green-50 rounded-full p-2">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Inactive Users</p>
                                <p className="text-xl sm:text-2xl font-semibold text-red-600 mt-1">
                                    {loading ? "..." : stats.inactiveUsers}
                                </p>
                            </div>
                            <div className="bg-red-50 rounded-full p-2">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Sub Levels</p>
                                <p className="text-xl sm:text-2xl font-semibold text-teal-600 mt-1">
                                    {loading ? "..." : stats.childLevels}
                                </p>
                            </div>
                            <div className="bg-teal-50 rounded-full p-2">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
