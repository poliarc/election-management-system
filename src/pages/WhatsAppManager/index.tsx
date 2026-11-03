import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Globe,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  Check,
  MapPin,
  Layers,
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
type FilterLevel = "All" | "State" | "District" | "Assembly";

export default function WhatsAppManager() {
  const { levelId } = useParams<{ levelId: string }>();
  const { user, levelAdminPanels, selectedAssignment } = useAppSelector((state) => state.auth);

  // Identify current level panel from URL or authentication state
  const currentPanel = useMemo(() => {
    if (levelId) {
      return levelAdminPanels.find((p) => p.id === Number(levelId)) || null;
    }
    return null;
  }, [levelAdminPanels, levelId]);

  // Active form creation level
  const [activeTab, setActiveTab] = useState<LevelTab>(() => {
    const panelName = currentPanel?.name?.toLowerCase();
    const assignmentLevel = selectedAssignment?.levelType?.toLowerCase();

    if (panelName === "district" || assignmentLevel === "district") return "District";
    if (panelName === "assembly" || assignmentLevel === "assembly") return "Assembly";
    return "State";
  });

  // Table display filter: Defaults to "All" so all party groups are immediately visible
  const [levelFilter, setLevelFilter] = useState<FilterLevel>("All");
  const [showCreateForm, setShowCreateForm] = useState(true);

  // Sync activeTab when panel changes
  useEffect(() => {
    if (currentPanel) {
      const name = currentPanel.name?.toLowerCase();
      if (name === "district") setActiveTab("District");
      else if (name === "assembly") setActiveTab("Assembly");
      else if (name === "state") setActiveTab("State");
    }
  }, [currentPanel]);

  // Fetch all state master records for cascading dropdowns
  const { data: allStateMasterData = [], isLoading: loadingMasterData } =
    useGetAllStateMasterDataQuery();

  // Find all states in database
  const availableStates = useMemo(() => {
    return allStateMasterData.filter(
      (item) => item.levelType?.toLowerCase() === "state"
    );
  }, [allStateMasterData]);

  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  // Resolve target State ID and Name
  const resolvedState = useMemo(() => {
    const targetStateId =
      selectedStateId ||
      currentPanel?.metadata?.stateId ||
      user?.state_id ||
      selectedAssignment?.parentId ||
      (availableStates.length > 0 ? availableStates[0].id : 1);

    const match = availableStates.find((s) => s.id === Number(targetStateId));
    if (match) return match;

    const fallbackName =
      currentPanel?.metadata?.stateName || user?.stateName || "State";
    return { id: Number(targetStateId), levelName: fallbackName };
  }, [selectedStateId, availableStates, currentPanel, user, selectedAssignment]);

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

  // Query WhatsApp groups for the party and target state
  const {
    data: groupsResponse,
    isLoading: loadingGroups,
    refetch,
  } = useGetWhatsappLinksByLevelQuery({
    level_type: levelFilter === "All" ? null : levelFilter,
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
            {currentPanel && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-indigo-100">
                {currentPanel.displayName || currentPanel.name} Level
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Official WhatsApp Support Groups
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl">
            Manage your party's official WhatsApp support groups. All links created by you and your teammates are shared across your party.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {availableStates.length > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-medium text-white">
              <MapPin className="h-3.5 w-3.5" />
              <select
                value={stateId}
                onChange={(e) => setSelectedStateId(Number(e.target.value))}
                className="bg-transparent text-white border-none outline-none cursor-pointer font-semibold"
              >
                {availableStates.map((st) => (
                  <option key={st.id} value={st.id} className="text-gray-900">
                    {st.levelName}
                  </option>
                ))}
              </select>
            </div>
          )}

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

      {/* Form Card for Creating Groups */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-[var(--border-color)] gap-3 bg-[var(--bg-main)]/30">
          <div
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <PlusCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-[var(--text-color)]">
              Create New Support Group
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-semibold">
              {activeTab} Level
            </span>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Form Level Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setActiveTab("State"); setShowCreateForm(true); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "State"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-color)]"
                }`}
              >
                State
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("District"); setShowCreateForm(true); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "District"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-color)]"
                }`}
              >
                District
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("Assembly"); setShowCreateForm(true); }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "Assembly"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-color)]"
                }`}
              >
                Assembly
              </button>
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
        </div>

        {showCreateForm && (
          <div className="p-6">
            {activeTab === "State" && (
              <StateLevelForm
                stateId={stateId}
                stateName={stateName}
                onSuccess={() => refetch()}
              />
            )}

            {activeTab === "District" && (
              <DistrictLevelForm
                stateId={stateId}
                stateName={stateName}
                districts={stateDistricts}
                currentDistrictId={currentDistrictId}
                onSuccess={() => refetch()}
              />
            )}

            {activeTab === "Assembly" && (
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

      {/* Table Section: Existing groups with Level Filter Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-color)]">
              Party WhatsApp Groups in {stateName} ({groups.length})
            </h3>
          </div>

          {/* Level Filter Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-semibold self-start sm:self-auto shadow-sm">
            <button
              type="button"
              onClick={() => setLevelFilter("All")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                levelFilter === "All"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-color)]"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All Levels</span>
            </button>
            <button
              type="button"
              onClick={() => setLevelFilter("State")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                levelFilter === "State"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-color)]"
              }`}
            >
              State
            </button>
            <button
              type="button"
              onClick={() => setLevelFilter("District")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                levelFilter === "District"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-color)]"
              }`}
            >
              District
            </button>
            <button
              type="button"
              onClick={() => setLevelFilter("Assembly")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                levelFilter === "Assembly"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-color)]"
              }`}
            >
              Assembly
            </button>
          </div>
        </div>

        <WhatsAppLinksTable
          groups={groups}
          isLoading={loadingGroups || loadingMasterData}
          activeLevel={levelFilter}
        />
      </div>
    </div>
  );
}
