import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, UserCircle, MapPin, ChevronDown, ChevronUp, X, 
  Loader2, Users, Phone, Home, ChevronLeft, ChevronRight 
} from "lucide-react";
import { useGetVoterMarkersQuery, useGetParentLevelsQuery } from "../../../store/api/votersApi";

// Reusing the breadcrumb to show exact location context
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

export const VoterCentricPage: React.FC = () => {
  
  // States
  const [filterType, setFilterType] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  // 🔥 NEW: Language State
  const [language, setLanguage] = useState<"en" | "hi">("en");
  
  // Pagination States (Client-Side)
  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 15; 

  // We fetch a high limit so we can calculate all overlaps globally
  const { data, isLoading, isFetching } = useGetVoterMarkersQuery({ 
    page: 1, 
    limit: 5000, 
    sortBy: "voter_full_name_en", 
    sortOrder: "ASC" 
  });

  const voters = data?.data || [];

  // Reset page to 1 whenever search or filter changes
  useEffect(() => {
    setPage(1);
  }, [searchInput, filterType]);

  const toggleRow = (voterId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(voterId)) {
      newExpanded.delete(voterId);
    } else {
      newExpanded.add(voterId);
    }
    setExpandedRows(newExpanded);
  };

  // 1. Calculate Global Stats
  const stats = useMemo(() => {
    const rawGroups: Record<number, any[]> = {};
    
    voters.forEach((v: any) => {
      if (!rawGroups[v.voter_id]) rawGroups[v.voter_id] = [];
      rawGroups[v.voter_id].push(v);
    });

    const uniqueVoters = Object.values(rawGroups);
    const frequencyMap: Record<number, number> = {};
    
    uniqueVoters.forEach(group => {
      const count = group.length;
      frequencyMap[count] = (frequencyMap[count] || 0) + 1;
    });

    const totalAssemblyVoters = voters.length > 0 ? voters[0].total_assembly_voters : 0;

    return {
      totalAssemblyVoters,
      totalUniqueMarked: uniqueVoters.length,
      frequencyMap
    };
  }, [voters]);

  // 2. Filter the raw data based on Search and Filter Buttons
  const filteredVoters = useMemo(() => {
    let result = voters;

    if (searchInput.trim()) {
      const term = searchInput.toLowerCase();
      result = result.filter((v: any) => 
        v.voter_full_name_en?.toLowerCase().includes(term) ||
        v.voter_full_name_hi?.toLowerCase().includes(term) || // Added Hindi search support
        v.voter_id_epic_no?.toLowerCase().includes(term)
      );
    }

    if (filterType !== null) {
      const rawGroups: Record<number, any[]> = {};
      result.forEach((v: any) => {
        if (!rawGroups[v.voter_id]) rawGroups[v.voter_id] = [];
        rawGroups[v.voter_id].push(v);
      });
      
      result = result.filter((v: any) => {
        const count = rawGroups[v.voter_id].length;
        return filterType >= 4 ? count >= 4 : count === filterType;
      });
    }

    return result;
  }, [voters, searchInput, filterType]);

  // 3. Group the filtered data uniquely
  const groupedByVoter = useMemo(() => {
    const groups: Record<number, any> = {};

    filteredVoters.forEach((marker: any) => {
      const vId = marker.voter_id; 
      
      if (!groups[vId]) {
        groups[vId] = {
          voterId: vId,
          voter_full_name_en: marker.voter_full_name_en,
          voter_full_name_hi: marker.voter_full_name_hi,
          relative_full_name_en: marker.relative_full_name_en,
          relative_full_name_hi: marker.relative_full_name_hi, // 🔥 Added missing mapping for Native relative name
          voter_id_epic_no: marker.voter_id_epic_no,
          part_no: marker.part_no,
          sl_no_in_part: marker.sl_no_in_part,
          gender: marker.gender,
          age: marker.age,
          contact_number1: marker.contact_number1,
          town_village_name_eng: marker.town_village_name_eng,
          town_village_name_hin: marker.town_village_name_hin,
          district_name: marker.district_name,
          state_name: marker.state_name,
          markers: [], 
        };
      }
      
      groups[vId].markers.push(marker);
    });

    return Object.values(groups);
  }, [filteredVoters]);

  // 4. Apply Pagination to the Grouped List
  const totalItems = groupedByVoter.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedVoters = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return groupedByVoter.slice(start, start + itemsPerPage);
  }, [groupedByVoter, page]);

  // Helper Functions for Localized Data
  const getLocalizedName = (voter: any) => {
    return language === "hi" 
        ? (voter.voter_full_name_hi || voter.voter_full_name_en || "-")
        : (voter.voter_full_name_en || "-");
  };

  const getLocalizedRelative = (voter: any) => {
    const name = language === "hi" 
        ? (voter.relative_full_name_hi || voter.relative_full_name_en)
        : (voter.relative_full_name_en);
    return name ? `S/O, W/O ${name}` : '';
  };

  const getLocalizedAddress = (voter: any) => {
    return language === "hi"
        ? (voter.town_village_name_hin || voter.town_village_name_eng || 'Address Not Available')
        : (voter.town_village_name_eng || 'Address Not Available');
  };

  // Render Pagination Buttons
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            page === i
              ? "bg-indigo-600 text-white border border-indigo-600"
              : "border border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--text-color)]/5"
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-4">
        
        {/* Title and Side Toggle Array */}
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-color)] mb-1">Voter Search & Audit</h2>
            <p className="text-[var(--text-secondary)] text-sm">Analyze marking overlaps and trace which team members marked a specific voter.</p>
          </div>
          
          {/* 🔥 The Toggle placed on the side of the header description on larger screens */}
          <div className="relative inline-flex items-center bg-gray-200 rounded-full p-1 w-max shrink-0 mt-1">
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
        
        <div className="relative w-full xl:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isFetching ? (
              <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-[var(--text-secondary)]" />
            )}
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-[var(--text-color)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            placeholder="Search by voter name, EPIC ID, phone, or team member..."
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

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <div className="bg-[var(--bg-card)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm">
          <div className="text-[10px] sm:text-xs uppercase text-[var(--text-secondary)] font-bold mb-1">Total Voters</div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--text-color)]">
            {stats.totalAssemblyVoters ? stats.totalAssemblyVoters.toLocaleString() : "..."}
          </div>
        </div>
        
        <div className="bg-[var(--bg-card)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm">
          <div className="text-[10px] sm:text-xs uppercase text-indigo-600 dark:text-indigo-400 font-bold mb-1">Unique Marked</div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--text-color)]">{stats.totalUniqueMarked.toLocaleString()}</div>
        </div>

        {Object.entries(stats.frequencyMap)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([freq, count]) => {
            const f = Number(freq);
            const isActive = filterType === f;
            return (
              <button 
                key={f}
                onClick={() => setFilterType(isActive ? null : f)}
                className={`text-left p-4 rounded-lg border shadow-sm transition ${
                  isActive 
                    ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/50' 
                    : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-indigo-300'
                }`}
              >
                <div className="text-[10px] sm:text-xs uppercase text-[var(--text-secondary)] font-bold mb-1">
                  {f === 1 ? "Single Mark" : `Marked ${f}x`}
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[var(--text-color)]">{count.toLocaleString()}</div>
              </button>
            );
          })}
      </div>

      {/* List of Voters */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
           <div className="p-12 text-center text-indigo-500 flex flex-col items-center justify-center">
             <Loader2 className="w-8 h-8 animate-spin mb-4" />
             Loading voter database...
           </div>
        ) : paginatedVoters.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-secondary)] italic">
             {searchInput || filterType ? "No voters found matching your filters." : "No marked voters exist yet."}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {paginatedVoters.map((voter: any) => {
              const isExpanded = expandedRows.has(voter.voterId);
              
              let badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
              if (voter.markers.length === 2) badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
              if (voter.markers.length === 3) badgeColor = 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
              if (voter.markers.length >= 4) badgeColor = 'bg-red-500/10 text-red-600 dark:text-red-400 font-bold';

              return (
                <div key={voter.voterId} className="group transition-colors hover:bg-[var(--text-color)]/5">
                  <div 
                    onClick={() => toggleRow(voter.voterId)}
                    className="p-4 flex items-center justify-between cursor-pointer"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 items-center">
                      <div className="font-semibold text-[var(--text-color)] flex items-center gap-2">
                        <UserCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                        <div className="min-w-0">
                          {/* 🔥 Using Localized Name/Relative Helpers */}
                          <div className="text-sm truncate">{getLocalizedName(voter)}</div>
                          <div className="text-[10px] text-[var(--text-secondary)] font-normal uppercase truncate">
                            {getLocalizedRelative(voter)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-[var(--text-color)]">
                        <span className="block text-[10px] uppercase text-[var(--text-secondary)] opacity-70">EPIC / Voter ID</span>
                        {voter.voter_id_epic_no || "N/A"}
                      </div>

                      <div className="text-sm text-[var(--text-color)]">
                        <span className="block text-[10px] uppercase text-[var(--text-secondary)] opacity-70">Part & Serial</span>
                        Part {voter.part_no || "-"} • Sl {voter.sl_no_in_part || "-"}
                      </div>
                      
                      <div className="text-sm hidden md:block">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                           Marked {voter.markers.length}x {voter.markers.length === 1 ? 'Time' : 'Times'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-4 text-[var(--text-secondary)]">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-[var(--bg-main)] border-t border-[var(--border-color)] flex flex-col md:flex-row gap-8">
                      
                      <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-[var(--border-color)] pb-4 md:pb-0 md:pr-4">
                        <h4 className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-4 tracking-wider">Voter Demographics</h4>
                        
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 p-2 bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                              <UserCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Personal Info</div>
                              <div className="font-medium text-[var(--text-color)] text-sm mt-0.5">
                                {voter.gender === 'M' ? 'Male' : voter.gender === 'F' ? 'Female' : voter.gender || 'Unknown'} • {voter.age ? `${voter.age} Years Old` : 'Age N/A'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                              <Phone className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Contact</div>
                              <div className="font-medium text-[var(--text-color)] text-sm mt-0.5">
                                {voter.contact_number1 || 'Not Provided'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 p-2 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400 shrink-0">
                              <Home className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">Residence</div>
                              <div className="font-medium text-[var(--text-color)] text-sm mt-0.5">
                                {/* 🔥 Using Localized Address Helper */}
                                {getLocalizedAddress(voter)}
                              </div>
                              <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                                {voter.district_name || 'Unknown District'}, {voter.state_name || ''}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="md:w-2/3">
                         <h4 className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-4 tracking-wider flex items-center gap-2">
                           <Users className="w-3.5 h-3.5" /> Marking History Audit
                         </h4>
                         
                         <div className="space-y-3">
                           {voter.markers.map((marker: any) => (
                             <div key={marker.id} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg flex flex-col sm:flex-row sm:items-center gap-4">
                               <div className="flex-1">
                                 <div className="text-[10px] text-[var(--text-secondary)] uppercase">Assigned Team Member</div>
                                 <div className="font-medium text-[var(--text-color)] text-sm mt-0.5">
                                   {marker.marked_by_user_name}
                                 </div>
                               </div>
                               <div className="flex-1">
                                 <div className="text-[10px] text-[var(--text-secondary)] uppercase">Location Marker</div>
                                 <div className="font-medium text-[var(--text-color)] text-sm mt-0.5 flex items-center gap-1">
                                   <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                   {marker.after_assembly_name || marker.assembly_name}
                                 </div>
                                 {marker.after_assembly_id && (
                                   <div className="mt-1">
                                     <HierarchyBreadcrumb levelId={marker.after_assembly_id} />
                                   </div>
                                 )}
                               </div>
                             </div>
                           ))}
                         </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isLoading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-[var(--bg-card)] px-4 py-3 border border-[var(--border-color)] rounded-lg gap-4">
          <div className="text-sm text-[var(--text-secondary)]">
            Showing <span className="font-medium text-[var(--text-color)]">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-[var(--text-color)]">{Math.min(page * itemsPerPage, totalItems)}</span> of <span className="font-medium text-[var(--text-color)]">{totalItems}</span> unique entries
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-md border border-[var(--border-color)] disabled:opacity-50 hover:bg-[var(--text-color)]/5 transition text-[var(--text-color)]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="hidden sm:flex space-x-1">
              {renderPageNumbers()}
            </div>

            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-md border border-[var(--border-color)] disabled:opacity-50 hover:bg-[var(--text-color)]/5 transition text-[var(--text-color)]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default VoterCentricPage;