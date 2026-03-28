import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDashboard } from "../../hooks/useDashboard";
import { getDashboardNavigation, getDynamicIconType, getIconSvgPath, getDynamicCardColor } from "../../utils/dashboardNavigation";
import { useTranslation } from "react-i18next";

interface UserStats {
  totalUsers: number;
  loading: boolean;
  error: string | null;
}

export default function StateOverview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stateId, setStateId] = useState<number | null>(null);
  const [stateName, setStateName] = useState("");
  const [partyId, setPartyId] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    loading: false,
    error: null
  });

  // Fetch total user count using the same API as UserCommunication.tsx
  const fetchUserStats = async () => {
    if (!stateId || !partyId) return;

    setUserStats(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = localStorage.getItem("auth_access_token");
      if (!token) throw new Error("Authentication required");

      // Use the same API endpoint as UserCommunication.tsx
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/filter?party_id=${partyId}&state_id=${stateId}&page=1&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Use pagination.total like UserCommunication.tsx does
      setUserStats({
        totalUsers: data.pagination?.total || 0,
        loading: false,
        error: null
      });
    } catch (err) {
      console.error("Error fetching user stats:", err);
      setUserStats({
        totalUsers: 0,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch user stats"
      });
    }
  };

  // Fetch user stats when state/party info is available
  useEffect(() => {
    if (stateId && partyId) {
      fetchUserStats();
    }
  }, [stateId, partyId]);

  // Get state info from localStorage
  useEffect(() => {
    const loadStateInfo = () => {
      try {
        const authState = localStorage.getItem("auth_state");
        if (authState) {
          const parsed = JSON.parse(authState);
          const selectedAssignment = parsed.selectedAssignment;

          if (selectedAssignment && selectedAssignment.levelType === "State") {
            const id = selectedAssignment.stateMasterData_id;
            const name = selectedAssignment.levelName;
            setStateId(id);
            setStateName(name);
          }

          // Get party ID if available
          if (parsed.user && parsed.user.partyId) {
            setPartyId(parsed.user.partyId);
          }
        }
      } catch (err) {
        console.error("Error reading state info:", err);
      }
    };

    loadStateInfo();

    // Listen for storage changes (when state is changed from topbar)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_state") {
        loadStateInfo();
      }
    };

    // Listen for custom event (for same-tab changes)
    const handleAuthStateChange = () => {
      loadStateInfo();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth_state_changed", handleAuthStateChange);
    window.addEventListener("assignmentChanged", handleAuthStateChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth_state_changed", handleAuthStateChange);
      window.removeEventListener("assignmentChanged", handleAuthStateChange);
    };
  }, []);

  // Use dashboard hook
  const { cards, levelInfo, loading, error } = useDashboard({
    state_id: stateId || 0,
    party_id: partyId || 0,
    level_type: 'State',
  });

  // Dynamic navigation function for stats cards
  const handleStatsCardClick = (title: string) => {
    const navigationPath = getDashboardNavigation(title, 'State');
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

  // Show loading or error state
  if (loading) {
    return (
      <div className="w-full py-1 min-h-screen box-border rounded-2xl shadow-md bg-[var(--bg-color)] transition-all mx-auto px-4">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-[var(--text-secondary)]">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-1 min-h-screen box-border rounded-2xl shadow-md bg-[var(--bg-color)] transition-all mx-auto px-4">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[var(--text-secondary)]">Error loading dashboard: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-1 min-h-screen box-border rounded-2xl shadow-md bg-[var(--bg-color)] transition-all mx-auto px-4">
      {/* Header */}
      <header className="mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-color)]">
            {levelInfo?.name || stateName} 
          </h1>
        </div>
      </header>

      {/* Summary Stats - Clickable Cards */}
      {cards.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-8">
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
                      <p className="text-sm opacity-90 mt-1">{card.userCount} {t("stateDashboard.Users")}</p>
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
            {/* User Distribution Pie Charts */}
            <div className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl shadow-lg p-6 hover:shadow-2xl dark:hover:bg-[var(--bg-card)]/5 transition-all duration-300 hover:-translate-y-1 group">
              <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4 flex items-center group-hover:text-blue-600 transition-colors duration-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 group-hover:animate-pulse"></div>
                {t("stateDashboard.User_Statistics")}
              </h3>
              
              {/* Two Smaller Pie Charts Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* First Pie Chart - Assigned Users by Level */}
                <div className="text-center">
                  <h4 className="text-sm font-medium text-[var(--text-color)] mb-2">{t("stateDashboard.User_Level")}</h4>
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
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
                          <div className="text-lg font-bold text-[var(--text-color)]">
                            {cards.reduce((sum, c) => sum + c.userCount, 0)}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)]">{t("stateDashboard.Assigned_Users")}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Second Pie Chart - Total Users */}
                <div className="text-center">
                  <h4 className="text-sm font-medium text-[var(--text-color)] mb-2">{t("stateDashboard.Total_Overview")}</h4>
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Total Users Pie Chart */}
                        {(() => {
                          const assignedUsers = cards.reduce((sum, c) => sum + c.userCount, 0);
                          const totalUsers = userStats.totalUsers;
                          const unassignedUsers = Math.max(0, totalUsers - assignedUsers);
                          
                          if (totalUsers === 0) {
                            return (
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#E5E7EB"
                                strokeWidth="8"
                              />
                            );
                          }
                          
                          const assignedPercentage = (assignedUsers / totalUsers) * 100;
                          const unassignedPercentage = (unassignedUsers / totalUsers) * 100;
                          
                          const assignedDasharray = `${assignedPercentage * 2.51} 251.2`;
                          const unassignedDasharray = `${unassignedPercentage * 2.51} 251.2`;
                          const unassignedOffset = -assignedPercentage * 2.51;
                          
                          return (
                            <>
                              {/* Assigned Users Segment */}
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#10B981"
                                strokeWidth="8"
                                strokeDasharray={assignedDasharray}
                                strokeDashoffset="0"
                                className="transition-all duration-1000 ease-out hover:stroke-[10] cursor-pointer"
                              />
                              {/* Unassigned Users Segment */}
                              {unassignedUsers > 0 && (
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="none"
                                  stroke="#F59E0B"
                                  strokeWidth="8"
                                  strokeDasharray={unassignedDasharray}
                                  strokeDashoffset={unassignedOffset}
                                  className="transition-all duration-1000 ease-out hover:stroke-[10] cursor-pointer"
                                  style={{ animationDelay: '200ms' }}
                                />
                              )}
                            </>
                          );
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-lg font-bold text-[var(--text-color)]">
                            {userStats.loading ? (
                              <div className="animate-pulse bg-gray-200 h-4 w-8 rounded mx-auto"></div>
                            ) : userStats.error ? (
                              <span className="text-red-500 text-xs">Error</span>
                            ) : (
                              userStats.totalUsers.toLocaleString()
                            )}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)]">{t("stateDashboard.Total_Users")}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Combined Legend Below Charts */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {/* Level Legend */}
                <div className="space-y-1">
                  {cards.slice(0, 6).map((card, index) => {
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-cyan-500'];
                    return (
                      <div key={index} className="flex items-center text-xs hover:bg-[var(--text-color)]/5 p-1 rounded transition-all duration-200 cursor-pointer group">
                        <div className={`w-2 h-2 rounded-full ${colors[index % colors.length]} mr-2 group-hover:scale-125 transition-transform duration-200`}></div>
                        <span className="text-[var(--text-secondary)] truncate group-hover:text-[var(--text-color)] transition-all duration-200">{card.title} {t("stateDashboard.Users")}: {card.userCount}</span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Total Legend */}
                <div className="space-y-1">
                  <div className="flex items-center text-xs hover:bg-[var(--text-color)]/5 p-1 rounded transition-all duration-200 cursor-pointer group">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 group-hover:scale-125 transition-transform duration-200"></div>
                    <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-color)] transition-all duration-200">
                      {t("stateDashboard.Assigned_Users")}: {cards.reduce((sum, c) => sum + c.userCount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center text-xs hover:bg-[var(--text-color)]/5 p-1 rounded transition-all duration-200 cursor-pointer group">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2 group-hover:scale-125 transition-transform duration-200"></div>
                    <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-color)] transition-all duration-200">
                      {t("stateDashboard.Unassigned_Users")}: {userStats.loading ? 'Loading...' : userStats.error ? 'Error' : Math.max(0, userStats.totalUsers - cards.reduce((sum, c) => sum + c.userCount, 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Trends Bar Chart */}
            <div className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl shadow-lg p-6 hover:shadow-2xl dark:hover:bg-[var(--bg-card)]/5 transition-all duration-300 hover:-translate-y-1 group">
              <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4 flex items-center group-hover:text-green-600 transition-colors duration-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 group-hover:animate-pulse"></div>
                {t("stateDashboard.Level_Activity_Overview")}
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
                        <span className="text-sm font-medium text-[var(--text-color)] truncate group-hover:text-[var(--text-color)] group-hover:font-semibold transition-all duration-200">{card.title}</span>
                        <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-color)] group-hover:font-medium transition-all duration-200">{card.count}</span>
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
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg p-6 border border-blue-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group hover:from-blue-100 hover:to-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-blue-700 mb-1 group-hover:text-blue-800 transition-colors duration-300">{t("stateDashboard.Total_Locations")}</h4>
                  <p className="text-3xl font-bold text-blue-900 group-hover:scale-110 transition-transform duration-300">{cards.reduce((sum, c) => sum + c.count, 0)}</p>
                  <p className="text-sm text-blue-600 mt-1 group-hover:text-blue-700 transition-colors duration-300">{t("stateDashboard.Across_all_levels")}</p>
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
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-lg p-6 border border-green-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group hover:from-green-100 hover:to-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-green-700 mb-1 group-hover:text-green-800 transition-colors duration-300">{t("stateDashboard.Active_Users")}</h4>
                  <p className="text-3xl font-bold text-green-900 group-hover:scale-110 transition-transform duration-300">{cards.reduce((sum, c) => sum + c.userCount, 0)}</p>
                  <p className="text-sm text-green-600 mt-1 group-hover:text-green-700 transition-colors duration-300">{t("stateDashboard.Currently_assigned")}</p>
                </div>
                <div className="bg-green-500 rounded-full p-3 group-hover:bg-green-600 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Coverage Rate */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl shadow-lg p-6 border border-purple-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group hover:from-purple-100 hover:to-violet-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-purple-700 mb-1 group-hover:text-purple-800 transition-colors duration-300">{t("stateDashboard.Coverage_Rate")}</h4>
                  <p className="text-3xl font-bold text-purple-900 group-hover:scale-110 transition-transform duration-300">
                    {cards.length > 0 ? Math.round((cards.filter(c => c.userCount > 0).length / cards.length) * 100) : 0}%
                  </p>
                  <p className="text-sm text-purple-600 mt-1 group-hover:text-purple-700 transition-colors duration-300">{t("stateDashboard.Levels_with_users")}</p>
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
        <div className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-md p-8 text-center">
          <div className="text-[var(--text-secondary)] mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">No Data Available</h3>
          <p className="text-[var(--text-secondary)]">No hierarchy levels have been set up yet for this state.</p>
        </div>
      )}
    </div>
  );
}




{/*********
  import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDashboard } from "../../hooks/useDashboard";
import {
  getDashboardNavigation,
  getDynamicIconType,
  getIconSvgPath,
} from "../../utils/dashboardNavigation";

interface UserStats {
  totalUsers: number;
  loading: boolean;
  error: string | null;
}

export default function StateOverview() {
  const navigate = useNavigate();
  const [stateId, setStateId] = useState<number | null>(null);
  const [stateName, setStateName] = useState("");
  const [partyId, setPartyId] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    loading: false,
    error: null,
  });

  /* ================= USER STATS (UNCHANGED) ================= *
  const fetchUserStats = async () => {
    if (!stateId || !partyId) return;
    setUserStats((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const token = localStorage.getItem("auth_access_token");
      if (!token) throw new Error("Authentication required");

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/filter?party_id=${partyId}&state_id=${stateId}&page=1&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      setUserStats({
        totalUsers: data.pagination?.total || 0,
        loading: false,
        error: null,
      });
    } catch (err) {
      setUserStats({
        totalUsers: 0,
        loading: false,
        error: err instanceof Error ? err.message : "Failed",
      });
    }
  };

  useEffect(() => {
    if (stateId && partyId) fetchUserStats();
  }, [stateId, partyId]);

  /* ================= STATE INFO (UNCHANGED) ================= *
  useEffect(() => {
    const loadStateInfo = () => {
      try {
        const authState = localStorage.getItem("auth_state");
        if (!authState) return;

        const parsed = JSON.parse(authState);
        const selectedAssignment = parsed.selectedAssignment;

        if (selectedAssignment?.levelType === "State") {
          setStateId(selectedAssignment.stateMasterData_id);
          setStateName(selectedAssignment.levelName);
        }

        if (parsed.user?.partyId) setPartyId(parsed.user.partyId);
      } catch {}
    };

    loadStateInfo();
    window.addEventListener("storage", loadStateInfo);
    window.addEventListener("auth_state_changed", loadStateInfo);
    window.addEventListener("assignmentChanged", loadStateInfo);

    return () => {
      window.removeEventListener("storage", loadStateInfo);
      window.removeEventListener("auth_state_changed", loadStateInfo);
      window.removeEventListener("assignmentChanged", loadStateInfo);
    };
  }, []);

  /* ================= DASHBOARD DATA ================= *
  const { cards, levelInfo, loading, error } = useDashboard({
    state_id: stateId || 0,
    party_id: partyId || 0,
    level_type: "State",
  });

  const handleStatsCardClick = (title: string) => {
    const path = getDashboardNavigation(title, "State");
    if (path) navigate(path);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-color)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) return null;

  /* ================= RAW NUMBERS ================= *
  const totalAssigned = cards.reduce((sum, c) => sum + c.userCount, 0);
  const totalLocations = cards.reduce((sum, c) => sum + c.count, 0);
  const activeLevels = cards.filter((c) => c.userCount > 0).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans text-[var(--text-color)]">
      {/* HEADER *}
      <div className="mb-8">
        <span className="text-indigo-600 font-bold text-xs uppercase tracking-widest">
          State Overview
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-color)]">
          {levelInfo?.name || stateName}
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Real-time hierarchy and user distribution analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Network",
            val: totalLocations,
            sub: "Locations",
            icon: (
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 7h18M3 12h18M3 17h18" />
              </svg>
            ),
            bg: "bg-blue-50",
          },
          {
            label: "Reach",
            val: activeLevels,
            sub: "Active Levels",
            icon: (
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3" />
              </svg>
            ),
            bg: "bg-purple-50",
          },
          {
            label: "Active Force",
            val: totalAssigned,
            sub: "Assigned Users",
            icon: (
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a4 4 0 00-5-4M9 20H4v-2a4 4 0 015-4" />
              </svg>
            ),
            bg: "bg-emerald-50",
          },
          {
            label: "Database",
            val: userStats.totalUsers,
            sub: "Total Records",
            icon: (
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ),
            bg: "bg-orange-50",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center gap-4">
              {/* ICON *}
              <div className={`p-3 rounded-xl ${item.bg}`}>
                {item.icon}
              </div>

              {/* DETAILS *}
              <div>
                <p className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wide">
                  {item.label}
                </p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-2xl font-black text-[var(--text-color)]">
                    {item.val.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 mb-1">
                    {item.sub}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

            <div className="grid grid-cols-12 gap-8">
              {/* MAIN COLUMN *}
              <div className="col-span-12 lg:col-span-8">
        <div className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-3xl shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-bold text-[var(--text-color)]">
              Hierarchy Performance
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map((card, idx) => (
              <div
                key={idx}
                onClick={() => handleStatsCardClick(card.title)}
                className="group cursor-pointer p-4 rounded-2xl bg-[var(--bg-color)] hover:bg-indigo-600 transition-all duration-300"
              >
                <div className="flex justify-between mb-3">
                  
                  {/* ICON CONTAINER *}
                  <div className="p-2 rounded-xl bg-[var(--bg-color)] group-hover:bg-indigo-500 transition-colors duration-300">
                    <svg
                      className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={getIconSvgPath(
                          getDynamicIconType(card.title)
                        )}
                      />
                    </svg>
                  </div>

                  <span className="text-2xl font-bold text-[var(--text-color)] group-hover:text-white transition-colors">
                    {card.count}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-700 group-hover:text-indigo-100 transition-colors">
                  {card.title}
                </h3>

                <div className="mt-4 flex justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)] group-hover:text-indigo-200 transition-colors">
                    Users: {card.userCount}
                  </span>
                  <span className="font-bold text-indigo-600 group-hover:text-white transition-colors">
                    View Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        {/* SIDE COLUMN *}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* DONUT *}
          <div className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-[var(--text-color)] mb-6">
              Reach Distribution
            </h2>

            <div className="relative flex justify-center py-4">
              <svg
                className="w-48 h-48 transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="10"
                  strokeDasharray={`${
                    (totalAssigned / (userStats.totalUsers || 1)) * 251.2
                  } 251.2`}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-[var(--text-color)]">
                  {totalAssigned.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Assigned Users
                </span>
              </div>
            </div>
          </div>

          {/* ACTIVITY BARS *}
          <div className="bg-indigo-900 rounded-3xl p-6 text-white">
            <h2 className="font-bold mb-4">Level Activity</h2>

            <div className="space-y-5">
              {cards.slice(0, 4).map((card, i) => {
                const max = Math.max(...cards.map((c) => c.count));
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span>{card.title}</span>
                      <span>{card.count}</span>
                    </div>
                    <div className="h-1.5 bg-[var(--bg-card)]/10 rounded-full">
                      <div
                        className="h-full bg-indigo-400 rounded-full"
                        style={{
                          width: `${(card.count / (max || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  
  
  
  */}


