import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDashboard } from "../../hooks/useDashboard";
import { getDashboardNavigation, getDynamicIconType, getIconSvgPath, getDynamicCardColor } from "../../utils/dashboardNavigation";

export default function StateOverview() {
  const navigate = useNavigate();
  const [stateId, setStateId] = useState<number | null>(null);
  const [stateName, setStateName] = useState("");
  const [partyId, setPartyId] = useState<number | null>(null);

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

          {/* Analytics Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* User Distribution Pie Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center group-hover:text-blue-600 transition-colors duration-300">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 group-hover:animate-pulse"></div>
                User Distribution by Level
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
                      <div className="text-2xl font-bold text-gray-800">
                        {cards.reduce((sum, c) => sum + c.userCount, 0)}
                      </div>
                      <div className="text-sm text-gray-500">Total Users</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {cards.slice(0, 6).map((card, index) => {
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-cyan-500'];
                  return (
                    <div key={index} className="flex items-center text-sm hover:bg-gray-50 p-2 rounded-lg transition-all duration-200 cursor-pointer group">
                      <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-2 group-hover:scale-125 transition-transform duration-200`}></div>
                      <span className="text-gray-600 truncate group-hover:text-gray-800 group-hover:font-medium transition-all duration-200">{card.title} Users: {card.userCount}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity Trends Bar Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center group-hover:text-green-600 transition-colors duration-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 group-hover:animate-pulse"></div>
                Level Activity Overview
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
                    <div key={index} className="space-y-2 hover:bg-gray-50 p-3 rounded-lg transition-all duration-200 cursor-pointer group">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900 group-hover:font-semibold transition-all duration-200">{card.title}</span>
                        <span className="text-sm text-gray-500 group-hover:text-gray-700 group-hover:font-medium transition-all duration-200">{card.count}</span>
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
                  <h4 className="text-sm font-medium text-blue-700 mb-1 group-hover:text-blue-800 transition-colors duration-300">Total Locations</h4>
                  <p className="text-3xl font-bold text-blue-900 group-hover:scale-110 transition-transform duration-300">{cards.reduce((sum, c) => sum + c.count, 0)}</p>
                  <p className="text-sm text-blue-600 mt-1 group-hover:text-blue-700 transition-colors duration-300">Across all levels</p>
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
                  <h4 className="text-sm font-medium text-green-700 mb-1 group-hover:text-green-800 transition-colors duration-300">Active Users</h4>
                  <p className="text-3xl font-bold text-green-900 group-hover:scale-110 transition-transform duration-300">{cards.reduce((sum, c) => sum + c.userCount, 0)}</p>
                  <p className="text-sm text-green-600 mt-1 group-hover:text-green-700 transition-colors duration-300">Currently assigned</p>
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
                  <h4 className="text-sm font-medium text-purple-700 mb-1 group-hover:text-purple-800 transition-colors duration-300">Coverage Rate</h4>
                  <p className="text-3xl font-bold text-purple-900 group-hover:scale-110 transition-transform duration-300">
                    {cards.length > 0 ? Math.round((cards.filter(c => c.userCount > 0).length / cards.length) * 100) : 0}%
                  </p>
                  <p className="text-sm text-purple-600 mt-1 group-hover:text-purple-700 transition-colors duration-300">Levels with users</p>
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
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">No hierarchy levels have been set up yet for this state.</p>
        </div>
      )}
    </div>
  );
}