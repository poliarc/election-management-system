import { useState, useMemo, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ShieldCheck, Sparkles, AlertCircle, User } from "lucide-react";
import { useGetAllStateMasterDataQuery } from "../../store/api/stateMasterApi";
import { useGetPublicWhatsappLinksQuery } from "../../store/api/whatsappManagerApi";
import { DirectoryFilters } from "./components/DirectoryFilters";
import { GroupCard } from "./components/GroupCard";

export default function PublicWhatsAppDirectory() {
  const { creatorCode } = useParams<{ creatorCode?: string }>();
  const [searchParams] = useSearchParams();
  const effectiveCreator = creatorCode || searchParams.get("u") || searchParams.get("creator") || null;

  // Redirect to dedicated public subdomain if accessed via main election domain
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "election.peopleconnect.in"
    ) {
      const redirectPath = effectiveCreator ? `/u/${effectiveCreator}` : "/";
      window.location.replace(`https://whatsapp.peopleconnect.in${redirectPath}`);
    }
  }, [effectiveCreator]);

  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedStateId, setSelectedStateId] = useState<number | "">("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | "">("");
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Query public groups only if a creator code is present
  const { data: publicResponse, isLoading } = useGetPublicWhatsappLinksQuery(
    {
      level_type: selectedLevel,
      state_id: selectedStateId ? Number(selectedStateId) : null,
      district_id: selectedDistrictId ? Number(selectedDistrictId) : null,
      assembly_id: selectedAssemblyId ? Number(selectedAssemblyId) : null,
      search: search.trim() || null,
      page,
      limit: 30,
      creator: effectiveCreator,
    },
    { skip: !effectiveCreator }
  );

  const groups = publicResponse?.data || [];
  const pagination = publicResponse?.pagination;
  const creatorInfo = publicResponse?.creator_info;

  // Auto-select level, fix state, and pre-select district/assembly from coordinator
  useEffect(() => {
    if (creatorInfo && !isInitialized) {
      if (creatorInfo.state_id) {
        setSelectedStateId(Number(creatorInfo.state_id));
      }
      if (creatorInfo.primary_level_type && creatorInfo.primary_level_type !== "All") {
        setSelectedLevel(creatorInfo.primary_level_type);
      }
      if (creatorInfo.district_id) {
        setSelectedDistrictId(Number(creatorInfo.district_id));
      }
      if (creatorInfo.assembly_id) {
        setSelectedAssemblyId(Number(creatorInfo.assembly_id));
      }
      setIsInitialized(true);
    }
  }, [creatorInfo, isInitialized]);

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
    if (creatorInfo) {
      setSelectedLevel(creatorInfo.primary_level_type || "Assembly");
      setSelectedDistrictId(creatorInfo.district_id ? Number(creatorInfo.district_id) : "");
      setSelectedAssemblyId(creatorInfo.assembly_id ? Number(creatorInfo.assembly_id) : "");
      setSelectedStateId(creatorInfo.state_id ? Number(creatorInfo.state_id) : "");
    } else {
      setSelectedLevel("All");
      setSelectedDistrictId("");
      setSelectedAssemblyId("");
    }
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-color)] flex flex-col justify-between">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-900 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-100 text-xs font-semibold border border-white/15">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <span>Official Community Portal</span>
            </div>
            {effectiveCreator && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold border border-white/25">
                <User className="h-4 w-4 text-emerald-200" />
                <span>{creatorInfo?.name ? `${creatorInfo.name}'s Groups` : "Personal Directory"}</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Connect With Your Local Community
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl mx-auto">
            Find and join official, verified WhatsApp groups categorized by State, District, and Assembly Constituency to stay informed on local updates and mobilization.
          </p>
        </div>
      </div>

      {/* If no creator code is provided or removed, show secure access notice */}
      {!effectiveCreator ? (
        <main className="max-w-xl mx-auto w-full px-4 sm:px-6 -mt-8 flex-1 pb-16">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-8 text-center shadow-sm space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Coordinator Link Required
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Official community WhatsApp groups are accessible only via valid, unique coordinator links. If you received a link from your representative, please ensure you open the complete link.
            </p>
            <div className="pt-3 text-xs text-gray-400 dark:text-gray-500 border-t border-[var(--border-color)]">
              Format: <span className="font-mono text-gray-700 dark:text-gray-300">whatsapp.peopleconnect.in/u/&lt;code&gt;</span>
            </div>
          </div>
        </main>
      ) : (
        /* Main Content Area for valid creator code */
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
          fixedStateName={creatorInfo?.state_name || (states.find((s) => s.id === selectedStateId)?.levelName)}
          defaultDistrictId={creatorInfo?.district_id}
          defaultAssemblyId={creatorInfo?.assembly_id}
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
          <div className="py-16 px-4 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm">
            <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              No WhatsApp Groups Found
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
              This link is either invalid, expired, or has no active WhatsApp support groups assigned to it.
            </p>
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
      )}

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-card)] py-6 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} Official Election & Community Management Portal. All rights reserved.</p>
      </footer>
    </div>
  );
}
