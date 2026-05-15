import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Search, Users, MapPin, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetVoterMarkersQuery } from "../../../store/api/votersApi"; 
import { useAppSelector } from "../../../store/hooks";

export const MarkedVotersPage: React.FC = () => {
  const { t } = useTranslation();
  
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [, setIsDarkMode] = useState<boolean>(false);

  // Grab selectedAssignment from Auth State
  const { selectedAssignment } = useAppSelector((state: any) => state.auth);
  
  // Extract District ID 
  const currentDistrictId = selectedAssignment?.parentLevelType === "District" 
    ? selectedAssignment?.parentId 
    : selectedAssignment?.stateMasterData_id;

  // Initialize Theme based on localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch data for the ENTIRE DISTRICT
  const { data, error, isLoading, isFetching } = useGetVoterMarkersQuery(
    { 
      page: 1, 
      limit: 5000, 
      district_id: currentDistrictId,
      search: debouncedSearch 
    },
    { skip: !currentDistrictId } 
  );
  
  const voters = data?.data || [];

  // SUMMARY GROUPING LOGIC
  const summaryData = useMemo(() => {
    const groups: Record<string, { 
      userId: number; 
      userName: string; 
      assemblyId: number;
      assemblyName: string; 
      markedCount: number; 
      totalCount: number; 
    }> = {};
    
    voters.forEach((voter: any) => {
      const key = `${voter.user_id}_${voter.assembly_id}`;
      
      if (!groups[key]) {
        groups[key] = {
          userId: voter.user_id,
          userName: voter.marked_by_user_name || `User ID: ${voter.user_id}`,
          assemblyId: voter.assembly_id,
          assemblyName: voter.assembly_name || `Assembly ${voter.assembly_id || "-"}`,
          markedCount: 0,
          totalCount: voter.total_assembly_voters || 0 
        };
      }
      
      groups[key].markedCount += 1;
    });
    
    return Object.values(groups).sort((a, b) => b.markedCount - a.markedCount);
  }, [voters]);

  if (!currentDistrictId) {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl flex items-center gap-3">
                <MapPin className="w-5 h-5" />
                No district context found. Please ensure you have a valid district selected in the sidebar.
            </div>
        </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto transition-smooth">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-color)] flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            {t("markedVoters.title", "Marked Voters Summary")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Overview of marked voters per user across all assemblies in the current district.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:max-w-md">
          {/* Search Bar */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isFetching && searchInput ? (
                <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
              ) : (
                <Search className="h-4 w-4 text-[var(--text-secondary)]" />
              )}
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-[var(--border-color)] rounded-lg leading-5 bg-[var(--bg-card)] text-[var(--text-color)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
              placeholder="Search by user or assembly..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Theme Toggle Button */}
          
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          Failed to load marked voters data.
        </div>
      )}

      {/* Summary Table */}
      <div className="overflow-hidden w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm transition-smooth">
        <table className="w-full text-sm text-left">
          <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)] text-xs uppercase border-b border-[var(--border-color)]">
            <tr>
              <th className="px-6 py-4 font-semibold w-1/3">Marked By</th>
              <th className="px-6 py-4 font-semibold">Assembly</th>
              <th className="px-6 py-4 font-semibold text-center">Marked Voters</th>
              <th className="px-6 py-4 font-semibold text-center">Total Assembly Voters</th>
              <th className="px-6 py-4 font-semibold">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {(isLoading || isFetching) ? (
              <tr>
                <td colSpan={5} className="text-center py-16">
                  <div className="flex flex-col justify-center items-center space-y-3 text-indigo-600">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-sm font-medium">Calculating district summary...</span>
                  </div>
                </td>
              </tr>
            ) : summaryData.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16 text-[var(--text-secondary)]">
                  <div className="flex flex-col items-center">
                    <Users className="w-12 h-12 opacity-20 mb-3" />
                    <p className="text-lg font-medium text-[var(--text-color)]">No Data Found</p>
                    <p>{debouncedSearch ? "No users match your search." : "No voters have been marked in this district yet."}</p>
                  </div>
                </td>
              </tr>
            ) : (
              summaryData.map((row) => {
                const percent = row.totalCount > 0 ? Math.min(100, (row.markedCount / row.totalCount) * 100) : 0;
                
                return (
                  <tr key={`${row.userId}-${row.assemblyId}`} className="hover:bg-[var(--bg-hover)] transition-colors duration-150">
                    
                    {/* User Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-base text-[var(--text-color)]">{row.userName}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Assembly Name */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-800/50 dark:text-blue-300 transition-colors">
                        {row.assemblyName}
                      </span>
                    </td>

                    {/* Marked Count */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {row.markedCount.toLocaleString()}
                      </span>
                    </td>

                    {/* Total Count */}
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-[var(--text-secondary)]">
                        {row.totalCount > 0 ? row.totalCount.toLocaleString() : "—"}
                      </span>
                    </td>

                    {/* Progress Bar */}
                    <td className="px-6 py-4 w-48">
                      {row.totalCount > 0 ? (
                        <div className="w-full flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-[#27284d] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-[var(--text-secondary)] w-8 text-right">
                            {percent.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-secondary)] italic">Awaiting Total</span>
                      )}
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {!isLoading && !isFetching && summaryData.length > 0 && (
        <div className="text-sm text-[var(--text-secondary)] text-right">
          Showing summary for <span className="font-semibold text-[var(--text-color)]">{summaryData.length}</span> marking assignments.
        </div>
      )}
    </div>
  );
};

export default MarkedVotersPage;