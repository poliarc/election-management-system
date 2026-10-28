import { useState, useMemo } from "react";
import { ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { useGetAllStateMasterDataQuery } from "../../store/api/stateMasterApi";
import { useGetPublicWhatsappLinksQuery } from "../../store/api/whatsappManagerApi";
import { DirectoryFilters } from "./components/DirectoryFilters";
import { GroupCard } from "./components/GroupCard";

export default function PublicWhatsAppDirectory() {
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedStateId, setSelectedStateId] = useState<number | "">("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | "">("");
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number | "">("");
  const [page, setPage] = useState(1);

  // Fetch geographic hierarchy for cascading filters
  const { data: allStateMasterData = [] } = useGetAllStateMasterDataQuery();

  const states = useMemo(() => {
    return allStateMasterData.filter(
      (item) => item.levelType?.toLowerCase() === "state"
    );
  }, [allStateMasterData]);

  const districts = useMemo(() => {
    if (!selectedStateId) {
      return allStateMasterData.filter(
        (item) => item.levelType?.toLowerCase() === "district"
      );
    }
    return allStateMasterData.filter(
      (item) =>
        item.levelType?.toLowerCase() === "district" &&
        (item.ParentId === selectedStateId || item.parentId === selectedStateId)
    );
  }, [allStateMasterData, selectedStateId]);

  const assemblies = useMemo(() => {
    if (!selectedDistrictId) return [];
    return allStateMasterData.filter(
      (item) =>
        item.levelType?.toLowerCase() === "assembly" &&
        (item.ParentId === selectedDistrictId || item.parentId === selectedDistrictId)
    );
  }, [allStateMasterData, selectedDistrictId]);

  // Query public groups with current filters
  const { data: publicResponse, isLoading } = useGetPublicWhatsappLinksQuery({
    level_type: selectedLevel,
    state_id: selectedStateId ? Number(selectedStateId) : null,
    district_id: selectedDistrictId ? Number(selectedDistrictId) : null,
    assembly_id: selectedAssemblyId ? Number(selectedAssemblyId) : null,
    search: search.trim() || null,
    page,
    limit: 30,
  });

  const groups = publicResponse?.data || [];
  const pagination = publicResponse?.pagination;

  const handleStateChange = (id: number | "") => {
    setSelectedStateId(id);
    setSelectedDistrictId("");
    setSelectedAssemblyId("");
    setPage(1);
  };

  const handleDistrictChange = (id: number | "") => {
    setSelectedDistrictId(id);
    setSelectedAssemblyId("");
    setPage(1);
  };

  const handleAssemblyChange = (id: number | "") => {
    setSelectedAssemblyId(id);
    setPage(1);
  };

  const handleLevelChange = (lvl: string) => {
    setSelectedLevel(lvl);
    if (lvl === "State") {
      setSelectedDistrictId("");
      setSelectedAssemblyId("");
    } else if (lvl === "District") {
      setSelectedAssemblyId("");
    }
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setSelectedLevel("All");
    setSelectedDistrictId("");
    setSelectedAssemblyId("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-color)] flex flex-col justify-between">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-900 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-100 text-xs font-semibold border border-white/15">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span>Official Community Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Connect With Your Local Community
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl mx-auto">
            Find and join official, verified WhatsApp groups categorized by State, District, and Assembly Constituency to stay informed on local updates and mobilization.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-8 space-y-8 flex-1 pb-16">
        {/* Filter Bar */}
        <DirectoryFilters
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          selectedLevel={selectedLevel}
          onLevelChange={handleLevelChange}
          selectedStateId={selectedStateId}
          onStateChange={handleStateChange}
          selectedDistrictId={selectedDistrictId}
          onDistrictChange={handleDistrictChange}
          selectedAssemblyId={selectedAssemblyId}
          onAssemblyChange={handleAssemblyChange}
          states={states}
          districts={districts}
          assemblies={assemblies}
          onReset={handleReset}
        />

        {/* Results Info */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {isLoading ? "Searching groups..." : `${pagination?.total ?? groups.length} Community Groups Available`}
            </span>
          </div>
          {selectedLevel !== "All" && (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Showing {selectedLevel} Level groups only
            </span>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 text-center">
            <div className="animate-spin h-9 w-9 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading verified groups...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && groups.length === 0 && (
          <div className="py-16 px-4 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
            <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              No WhatsApp Groups Found
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
              We couldn't find any groups matching your current filter criteria. Try choosing a different level or clearing your search.
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Groups Grid */}
        {!isLoading && groups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-xs font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-xs font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-card)] py-6 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} Official Election & Community Management Portal. All rights reserved.</p>
      </footer>
    </div>
  );
}
