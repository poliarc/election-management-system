import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Search, Users, MapPin, BarChart3, Map } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetVoterMarkersQuery } from "../../../store/api/votersApi"; 
import { useAppSelector } from "../../../store/hooks";

export const StateMarkedVotersPage: React.FC = () => {
  const { t } = useTranslation();
  
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  // 👉 GRAB USER STATE ID (Since this is a State Level page, we use the user's state)
  const { user } = useAppSelector((state: any) => state.auth);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 👉 FETCH DATA (Securely locked to the User's state_id, grabbing the whole state)
  const { data, error, isLoading, isFetching } = useGetVoterMarkersQuery(
    { 
      page: 1, 
      limit: 10000, // Very high limit to ensure we grab all marking data for the state
      state_id: user?.state_id, 
      search: debouncedSearch 
    },
    { skip: !user?.state_id } 
  );
  
  const voters = data?.data || [];

  // 👉 STATE-LEVEL SUMMARY GROUPING LOGIC
  // Groups by User AND Assembly, while capturing the District Name
  const summaryData = useMemo(() => {
    const groups: Record<string, { 
      userId: number; 
      userName: string; 
      districtId: number;
      districtName: string;
      assemblyId: number;
      assemblyName: string; 
      markedCount: number; 
      totalCount: number; 
    }> = {};
    
    voters.forEach((voter: any) => {
      // Create a unique key for each User + Assembly combination
      const key = `${voter.user_id}_${voter.assembly_id}`;
      
      if (!groups[key]) {
        groups[key] = {
          userId: voter.user_id,
          userName: voter.marked_by_user_name || `User ID: ${voter.user_id}`,
          districtId: voter.district_id,
          districtName: voter.district_name || `District ${voter.district_id || "-"}`,
          assemblyId: voter.assembly_id,
          assemblyName: voter.assembly_name || `Assembly ${voter.assembly_id || "-"}`,
          markedCount: 0,
          totalCount: voter.total_assembly_voters || 0
        };
      }
      
      groups[key].markedCount += 1;
    });
    
    // Convert to array and sort by highest marked count first
    return Object.values(groups).sort((a, b) => b.markedCount - a.markedCount);
  }, [voters]);

  if (!user?.state_id) {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl flex items-center gap-3">
                <MapPin className="w-5 h-5" />
                No state context found. Please ensure you are logged in correctly.
            </div>
        </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-color)] flex items-center gap-2">
            <Map className="w-6 h-6 text-indigo-600" />
            {t("stateMarkedVoters.title", "State-Wide Marking Summary")}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Overview of marked voters by all users across every district and assembly in the state.
          </p>
        </div>
        
        <div className="relative w-full sm:max-w-md">
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
            placeholder="Search by user, district, or assembly..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          Failed to load state-wide marked voters data.
        </div>
      )}

      {/* Summary Table */}
      <div className="overflow-hidden w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className=" dark:bg-[var(--bg-main)] text-[var(--text-secondary)] text-xs uppercase border-b border-[var(--border-color)]">
            <tr>
              <th className="px-6 py-4 font-semibold">Marked By</th>
              <th className="px-6 py-4 font-semibold">District</th> {/* 👉 NEW COLUMN */}
              <th className="px-6 py-4 font-semibold">Assembly</th>
              <th className="px-6 py-4 font-semibold text-center">Marked Voters</th>
              <th className="px-6 py-4 font-semibold text-center">Total Assembly Voters</th>
              <th className="px-6 py-4 font-semibold">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {(isLoading || isFetching) ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <div className="flex flex-col justify-center items-center space-y-3 text-indigo-600">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-sm font-medium">Calculating state-wide summary...</span>
                  </div>
                </td>
              </tr>
            ) : summaryData.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-[var(--text-secondary)]">
                  <div className="flex flex-col items-center">
                    <Users className="w-12 h-12 opacity-20 mb-3" />
                    <p className="text-lg font-medium text-[var(--text-color)]">No Data Found</p>
                    <p>{debouncedSearch ? "No users match your search." : "No voters have been marked in this state yet."}</p>
                  </div>
                </td>
              </tr>
            ) : (
              summaryData.map((row) => {
                const percent = row.totalCount > 0 ? Math.min(100, (row.markedCount / row.totalCount) * 100) : 0;
                
                return (
                  <tr key={`${row.userId}-${row.assemblyId}`} className="hover:bg-[var(--text-color)]/5 transition-colors duration-150">
                    
                    {/* User Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2  text-indigo-600 dark:bg-indigo-100 dark:text-indigo-400 rounded-lg">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-base text-[var(--text-color)]">{row.userName}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* 👉 NEW: District Name */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium  bg-blue-50 text-purple-700 border border-blue-200 dark:bg-blue-50 dark:border-blue-800/50 dark:text-purple-700">
                        {row.districtName}
                      </span>
                    </td>

                    {/* Assembly Name */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium  bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-50 dark:border-blue-800/50 dark:text-blue-700">
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
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full"
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
          Showing summary for <span className="font-semibold text-[var(--text-color)]">{summaryData.length}</span> marking assignments across the state.
        </div>
      )}
    </div>
  );
};

export default StateMarkedVotersPage;