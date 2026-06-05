import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Users, Search, X } from "lucide-react";
import { useGetVoterMarkersQuery, useGetParentLevelsQuery } from "../../../store/api/votersApi";
import { useAppSelector } from "../../../store/hooks";

const HierarchyBreadcrumb = ({ levelId }: { levelId: number }) => {
  const { data, isLoading } = useGetParentLevelsQuery(levelId, { skip: !levelId });

  if (isLoading) return <span className="text-[var(--text-secondary)] text-[10px]">Loading path...</span>;
  if (!data?.data || data.data.length === 0) return null;

  const pathString = [...data.data]
    .reverse()
    .map((level: any) => `${level.displayName} (${level.levelName})`)
    .join(" > ");

  return (
    <div className="text-[10px] text-[var(--text-secondary)] opacity-80 mt-0.5 truncate w-full" title={pathString}>
      {pathString}
    </div>
  );
};

export const MarkedVotersPage: React.FC = () => {
  const { levelId } = useParams<{ levelId: string }>();
  
  // 🔥 NEW: Added language state for the toggle
  const [language, setLanguage] = useState<"en" | "hi">("en");
  
  const { user, selectedAssignment } = useAppSelector((state: any) => state.auth);
  const currentUserId = user?.user_id || user?.id;

  let authUser = {};
  try {
      authUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
  } catch(e) {}
  
  const isSubLevel = !!levelId;
  const currentAssemblyId = isSubLevel 
      ? (selectedAssignment?.assembly_id || selectedAssignment?.parentId || (authUser as any).assembly_id)
      : (selectedAssignment?.stateMasterData_id || (authUser as any).assembly_id);
  
  const currentAfterAssemblyId = levelId ? Number(levelId) : undefined;
  const hasValidScope = !!(currentAssemblyId || currentAfterAssemblyId);

  const { data, isLoading } = useGetVoterMarkersQuery(
    { 
      page: 1, 
      limit: 1000, 
      assembly_id: currentAssemblyId,
      after_assembly_id: currentAfterAssemblyId
    },
    { skip: !currentUserId || !hasValidScope } 
  );

  const voters = data?.data || [];

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState("");

  const toggleRow = (key: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRows(newExpanded);
  };

  const filteredVoters = useMemo(() => {
    if (!searchInput.trim()) return voters;
    
    const term = searchInput.toLowerCase();
    
    return voters.filter((v: any) => {
      return (
        v.marked_by_user_name?.toLowerCase().includes(term) ||
        v.assembly_name?.toLowerCase().includes(term) ||
        v.after_assembly_name?.toLowerCase().includes(term) ||
        v.voter_full_name_en?.toLowerCase().includes(term) ||
        v.voter_full_name_hi?.toLowerCase().includes(term) ||
        v.relative_full_name_en?.toLowerCase().includes(term) ||
        v.voter_id_epic_no?.toLowerCase().includes(term) ||
        v.contact_number1?.includes(term) ||
        v.part_no?.includes(term)
      );
    });
  }, [voters, searchInput]);

  const groupedData = useMemo(() => {
    const groups: Record<string, any> = {};

    filteredVoters.forEach((voter: any) => {
      const key = `${voter.user_id}`; 
      
      if (!groups[key]) {
        groups[key] = {
          key: key,
          userId: voter.user_id,
          userName: voter.marked_by_user_name,
          assemblyName: voter.assembly_name,
          totalAssemblyVoters: voter.total_assembly_voters,
          markedCount: 0,
          votersList: []
        };
      }
      
      groups[key].markedCount += 1;
      groups[key].votersList.push(voter);
    });

    return Object.values(groups);
  }, [filteredVoters]);

  if (!hasValidScope) {
    return (
        <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                Loading context... Please ensure you navigate here from a valid assembly or sub-level assignment.
            </div>
        </div>
    );
  }

  if (isLoading) {
    return <div className="p-6 animate-pulse text-[var(--text-secondary)]">Loading dashboard data...</div>;
  }

  const SummaryGroup = ({ group, isCurrentUser }: { group: any, isCurrentUser: boolean }) => {
    const isExpanded = expandedRows.has(group.key) || searchInput.trim().length > 0;
    
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

    const displayedVoters = useMemo(() => {
      return [...group.votersList].sort((a, b) => {
        const partA = String(a.part_no || "");
        const partB = String(b.part_no || "");
        const compare = partA.localeCompare(partB, undefined, { numeric: true, sensitivity: 'base' });
        return sortOrder === "ASC" ? compare : -compare;
      });
    }, [group.votersList, sortOrder]);

    // 🔥 NEW: Helper functions to toggle localized names
    const getLocalizedName = (voter: any) => {
        return language === "hi" 
            ? (voter.voter_full_name_hi || voter.voter_full_name_en || "-")
            : (voter.voter_full_name_en || "-");
    };

    const getLocalizedRelative = (voter: any) => {
        return language === "hi" 
            ? (voter.relative_full_name_hi || voter.relative_full_name_en || "-")
            : (voter.relative_full_name_en || "-");
    };

    return (
      <div className="mb-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm">
        <div 
          onClick={() => toggleRow(group.key)}
          className={`flex items-center justify-between p-3 sm:p-4 cursor-pointer transition ${isCurrentUser ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : 'hover:bg-[var(--text-color)]/5'}`}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 items-center">
            <div className="font-semibold text-[var(--text-color)] flex items-center gap-2">
              <Users className={`w-4 h-4 ${isCurrentUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-secondary)]'}`} />
              <span className="truncate">{group.userName}</span>
              {isCurrentUser && <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full shrink-0">(You)</span>}
            </div>
            
            <div className="text-sm text-[var(--text-secondary)]">
              <span className="block text-[10px] uppercase opacity-70">Assembly</span>
              <div className="font-medium truncate text-[var(--text-color)]">{group.assemblyName}</div>
            </div>
            
            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <span className="block text-[10px] uppercase text-[var(--text-secondary)] opacity-70">Marked Voters</span>
              {group.markedCount}
            </div>
            
            <div className="text-sm text-[var(--text-secondary)]">
              <span className="block text-[10px] uppercase opacity-70">Total Voters</span>
              <div className="text-[var(--text-color)]">{group.totalAssemblyVoters?.toLocaleString() || "N/A"}</div>
            </div>
          </div>
          <div className="ml-4 text-[var(--text-secondary)]">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-[var(--border-color)] bg-[var(--bg-card)] p-0 sm:p-2">
            <div className="overflow-x-auto sm:rounded border-x-0 sm:border border-y-0 sm:border-[var(--border-color)]">
              <table className="w-full text-sm text-left">
                <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2 font-semibold w-1/4">Sub-Level Name</th>
                    
                    <th 
                      className="px-3 py-2 font-semibold cursor-pointer hover:bg-[var(--text-color)]/5 transition select-none group"
                      onClick={() => setSortOrder(prev => prev === "ASC" ? "DESC" : "ASC")}
                    >
                      <div className="flex items-center gap-1">
                        Part No
                        <div className="text-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity">
                          {sortOrder === "ASC" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </div>
                      </div>
                    </th>

                    <th className="px-3 py-2 font-semibold">Voter Name</th>
                    <th className="px-3 py-2 font-semibold">Father/Husband</th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">Gender / Age</th>
                    <th className="px-3 py-2 font-semibold whitespace-nowrap">Voter ID</th>
                    <th className="px-3 py-2 font-semibold">Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedVoters.map((voter: any) => (
                    <tr key={voter.id} className="border-t border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--text-color)]/5 transition-colors">
                      <td className="px-3 py-2 min-w-0">
                        <div className="font-medium text-[var(--text-color)] text-xs">
                          {voter.after_assembly_name || voter.assembly_name}
                        </div>
                        {voter.after_assembly_id && (
                          <HierarchyBreadcrumb levelId={voter.after_assembly_id} />
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium">{voter.part_no || "-"}</td>
                      
                      {/* 🔥 NEW: Use localized helper functions here */}
                      <td className="px-3 py-2 font-medium">{getLocalizedName(voter)}</td>
                      <td className="px-3 py-2">{getLocalizedRelative(voter)}</td>
                      
                      <td className="px-3 py-2 whitespace-nowrap">{voter.gender || "-"} / {voter.age || "-"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{voter.voter_id_epic_no || "-"}</td>
                      <td className="px-3 py-2">{voter.contact_number1 || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-color)] mb-1">Marked Voters Overview</h2>
            <p className="text-[var(--text-secondary)] text-sm">View marked voter statistics for you and your team hierarchy.</p>
          </div>
          
          {/* 🔥 NEW: The Language Toggle implementation */}
          <div className="relative inline-flex items-center bg-gray-200 rounded-full p-1 w-max">
             <button
                 onClick={() => setLanguage("en")}
                 className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${language === "en"
                     ? "bg-white text-indigo-600 shadow-sm"
                     : "text-gray-600 hover:text-gray-900"
                     }`}
             >
                 English
             </button>
             <button
                 onClick={() => setLanguage("hi")}
                 className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${language === "hi"
                     ? "bg-white text-indigo-600 shadow-sm"
                     : "text-gray-600 hover:text-gray-900"
                     }`}
             >
                 Native
             </button>
          </div>
        </div>
        
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[var(--text-secondary)]" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-[var(--text-color)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            placeholder="Search team member, assembly, or voter info..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-secondary)] hover:text-[var(--text-color)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {groupedData.length === 0 ? (
        <div className="text-[var(--text-secondary)] italic bg-[var(--bg-card)] p-8 text-center rounded-lg border border-[var(--border-color)]">
          {searchInput ? "No matching voters found." : "No marked voters found in this assembly yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {groupedData.map(group => (
            <SummaryGroup 
              key={group.key} 
              group={group} 
              isCurrentUser={group.userId === currentUserId} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarkedVotersPage;