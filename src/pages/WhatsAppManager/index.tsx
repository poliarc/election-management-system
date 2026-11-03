import { useState, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Globe,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  Check,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import { encodeCreatorCode } from "../../utils/creatorToken";
import { useAppSelector } from "../../store/hooks";
import { useGetAllStateMasterDataQuery } from "../../store/api/stateMasterApi";
import { useGetWhatsappLinksByLevelQuery } from "../../store/api/whatsappManagerApi";
import { StateLevelForm } from "./forms/StateLevelForm";
import { DistrictLevelForm } from "./forms/DistrictLevelForm";
import { AssemblyLevelForm } from "./forms/AssemblyLevelForm";
import { WhatsAppLinksTable } from "./components/WhatsAppLinksTable";

type LevelTab = "State" | "District" | "Assembly";

export default function WhatsAppManager() {
  const { levelId } = useParams<{ levelId: string }>();
  const location = useLocation();
  const locationState = (location.state as { levelId?: number } | null) ?? null;
  const { user, levelAdminPanels, selectedAssignment } = useAppSelector((state) => state.auth);

  // Identify current level panel from URL or authentication state
  const currentPanel = useMemo(() => {
    const targetId = levelId ? Number(levelId) : locationState?.levelId;
    if (targetId) {
      return levelAdminPanels.find((p) => p.id === Number(targetId)) || null;
    }
    return null;
  }, [levelAdminPanels, levelId, locationState]);

  // Initial default level strictly resolved from user's panel/role assignment
  const initialLevel: LevelTab = useMemo(() => {
    const panelName = currentPanel?.name?.toLowerCase();
    const assignmentLevel = selectedAssignment?.levelType?.toLowerCase();

    if (panelName === "district" || assignmentLevel === "district") return "District";
    if (panelName === "assembly" || assignmentLevel === "assembly") return "Assembly";
    if (panelName === "state" || assignmentLevel === "state") return "State";
    return "Assembly";
  }, [currentPanel, selectedAssignment]);

  const [selectedLevel, setSelectedLevel] = useState<LevelTab | null>(null);
  const currentLevel: LevelTab = selectedLevel || initialLevel;

  const [showCreateForm, setShowCreateForm] = useState(true);

  // Fetch all state master records for cascading dropdowns
  const { data: allStateMasterData = [], isLoading: loadingMasterData } =
    useGetAllStateMasterDataQuery();

  // Find all states in database
  const availableStates = useMemo(() => {
    return allStateMasterData.filter(
      (item) => item.levelType?.toLowerCase() === "state"
    );
  }, [allStateMasterData]);

  // Resolve target State ID and Name - Strictly FIXED for the user from starting
  const resolvedState = useMemo(() => {
    const targetStateId =
      currentPanel?.metadata?.stateId ||
      user?.state_id ||
      selectedAssignment?.parentId ||
      (availableStates.length > 0 ? availableStates[0].id : 1);

    const match = availableStates.find((s) => s.id === Number(targetStateId));
    if (match) return match;

    const fallbackName =
      currentPanel?.metadata?.stateName || user?.stateName || "State";
    return { id: Number(targetStateId), levelName: fallbackName };
  }, [availableStates, currentPanel, user, selectedAssignment]);

  const stateId = resolvedState.id;
  const stateName = resolvedState.levelName;

  // Filter districts for the target state
  const stateDistricts = useMemo(() => {
    if (!stateId) return [];
    return allStateMasterData.filter(
      (item) =>
        item.levelType?.toLowerCase() === "district" &&
        (item.ParentId === stateId || item.parentId === stateId)
    );
  }, [allStateMasterData, stateId]);

  // Resolve current District ID
  const currentDistrictId = useMemo(() => {
    if (user?.district_id) return Number(user.district_id);

    if (selectedAssignment) {
      if (selectedAssignment.levelType?.toLowerCase() === "district") {
        return Number(selectedAssignment.stateMasterData_id);
      }
      if (selectedAssignment.levelType?.toLowerCase() === "assembly" && selectedAssignment.parentId) {
        return Number(selectedAssignment.parentId);
      }
    }

    if (currentPanel?.metadata?.districtId) {
      return Number(currentPanel.metadata.districtId);
    }

    return stateDistricts.length > 0 ? stateDistricts[0].id : null;
  }, [user, selectedAssignment, currentPanel, stateDistricts]);

  // Resolve current Assembly ID
  const currentAssemblyId = useMemo(() => {
    if (selectedAssignment?.levelType?.toLowerCase() === "assembly") {
      return Number(selectedAssignment.stateMasterData_id || selectedAssignment.level_id);
    }
    if (currentPanel?.metadata?.assemblyId) {
      return Number(currentPanel.metadata.assemblyId);
    }
    return null;
  }, [selectedAssignment, currentPanel]);

  // Query WhatsApp groups STRICTLY for the active level and user's state
  const {
    data: groupsResponse,
    isLoading: loadingGroups,
    refetch,
  } = useGetWhatsappLinksByLevelQuery({
    level_type: currentLevel,
    state_id: stateId,
    party_id: user?.partyId || (user as any)?.party_id || undefined,
    limit: 100,
  });

  const groups = groupsResponse?.data || [];
  const [copiedLink, setCopiedLink] = useState(false);

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.endsWith(".local"));

  const baseUrl = isLocalhost
    ? window.location.origin
    : "https://whatsapp.peopleconnect.in";

  const userId = user?.id || (user as any)?.user_id;
  const creatorCode = userId ? encodeCreatorCode(Number(userId)) : "";
  const publicDirectoryUrl = creatorCode
    ? `${baseUrl}/u/${creatorCode}`
    : isLocalhost
    ? `${baseUrl}/whatsapp-groups`
    : baseUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicDirectoryUrl);
    setCopiedLink(true);
    toast.success("Public Directory link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--bg-main)] min-h-screen space-y-6">
      {/* Top Banner Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
              Role Assign • WhatsApp Hub
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              Party Shared Mode
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-indigo-100">
              {currentLevel} Level
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Official {currentLevel} WhatsApp Groups
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl">
            Manage your party's official {currentLevel.toLowerCase()} WhatsApp groups for {stateName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {/* State is fixed for user from starting - no dropdown/select */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 border border-white/20 text-xs font-bold text-white backdrop-blur-sm shadow-sm">
            <MapPin className="h-3.5 w-3.5 text-indigo-200" />
            <span>{stateName}</span>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            title="Copy your unique public directory link"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm border border-white/20 backdrop-blur-sm shadow transition-all active:scale-95"
          >
            {copiedLink ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
            <span>{copiedLink ? "Copied" : "Copy Link"}</span>
          </button>

          <a
            href={publicDirectoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-xs sm:text-sm shadow transition-all active:scale-95"
          >
            <Globe className="h-4 w-4 text-indigo-700" />
            <span className="text-indigo-700">Public Directory</span>
          </a>
        </div>
      </div>

      {/* Level Selection Bar - Strictly Separate Level Displays (No Mixing, No All Option) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] px-2">
            Level Scope:
          </span>
          {(["State", "District", "Assembly"] as LevelTab[]).map((tab) => {
            const isActive = currentLevel === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedLevel(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-500/20"
                    : "bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-color)] hover:bg-[var(--border-color)]/40"
                }`}
              >
                <span>{tab} Level</span>
                {isActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/25 text-white font-bold">
                    {groups.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] px-2">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          <span>Showing only links created on {currentLevel} level</span>
        </div>
      </div>

      {/* Form Card for Creating Groups - Strictly for the current level */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]/30">
          <div
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <PlusCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-[var(--text-color)]">
              Create New {currentLevel} Support Group
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-semibold">
              {currentLevel} Level
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-main)] text-[var(--text-secondary)]"
            title={showCreateForm ? "Collapse Form" : "Expand Form"}
          >
            {showCreateForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showCreateForm && (
          <div className="p-6">
            {currentLevel === "State" && (
              <StateLevelForm
                stateId={stateId}
                stateName={stateName}
                onSuccess={() => refetch()}
              />
            )}

            {currentLevel === "District" && (
              <DistrictLevelForm
                stateId={stateId}
                stateName={stateName}
                districts={stateDistricts}
                currentDistrictId={currentDistrictId}
                onSuccess={() => refetch()}
              />
            )}

            {currentLevel === "Assembly" && (
              <AssemblyLevelForm
                stateId={stateId}
                stateName={stateName}
                districts={stateDistricts}
                allStateMasterData={allStateMasterData}
                currentDistrictId={currentDistrictId}
                currentAssemblyId={currentAssemblyId}
                onSuccess={() => refetch()}
              />
            )}
          </div>
        )}
      </div>

      {/* Table Section: Strictly groups for this level */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-color)]">
              {currentLevel} Level Groups ({groups.length})
            </h3>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">
            Automatically synchronized with public directory
          </span>
        </div>

        <WhatsAppLinksTable
          groups={groups}
          isLoading={loadingGroups || loadingMasterData}
          activeLevel={currentLevel}
        />
      </div>
    </div>
  );
}
