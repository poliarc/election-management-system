import { useState, useMemo, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Globe,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
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
  const { user, levelAdminPanels, selectedAssignment } = useAppSelector((state) => state.auth);

  // Identify current level panel from URL or authentication state
  const currentPanel = useMemo(() => {
    if (levelId) {
      return levelAdminPanels.find((p) => p.id === Number(levelId)) || null;
    }
    return null;
  }, [levelAdminPanels, levelId]);

  // Determine initial active tab based on selected role assign level
  const [activeTab, setActiveTab] = useState<LevelTab>(() => {
    const panelName = currentPanel?.name?.toLowerCase();
    const assignmentLevel = selectedAssignment?.levelType?.toLowerCase();

    if (panelName === "district" || assignmentLevel === "district") return "District";
    if (panelName === "assembly" || assignmentLevel === "assembly") return "Assembly";
    return "State";
  });

  // Sync activeTab when panel changes
  useEffect(() => {
    if (currentPanel) {
      const name = currentPanel.name?.toLowerCase();
      if (name === "district") setActiveTab("District");
      else if (name === "assembly") setActiveTab("Assembly");
      else if (name === "state") setActiveTab("State");
    }
  }, [currentPanel]);

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

  // Resolve target State ID and Name
  const resolvedState = useMemo(() => {
    const targetStateId =
      currentPanel?.metadata?.stateId ||
      user?.state_id ||
      selectedAssignment?.parentId ||
      (availableStates.length > 0 ? availableStates[0].id : 1);

    const match = availableStates.find((s) => s.id === targetStateId);
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
    // 1. From user's direct district_id
    if (user?.district_id) return Number(user.district_id);

    // 2. From selectedAssignment
    if (selectedAssignment) {
      if (selectedAssignment.levelType?.toLowerCase() === "district") {
        return Number(selectedAssignment.stateMasterData_id);
      }
      if (selectedAssignment.levelType?.toLowerCase() === "assembly" && selectedAssignment.parentId) {
        return Number(selectedAssignment.parentId);
      }
    }

    // 3. From panel metadata
    if (currentPanel?.metadata?.districtId) {
      return Number(currentPanel.metadata.districtId);
    }

    // 4. Default to first district in the state if available
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

  // Query WhatsApp groups for the active level
  const {
    data: groupsResponse,
    isLoading: loadingGroups,
    refetch,
  } = useGetWhatsappLinksByLevelQuery({
    level_type: activeTab,
    state_id: stateId,
    limit: 100,
  });

  const groups = groupsResponse?.data || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--bg-main)] min-h-screen space-y-6">
      {/* Top Banner Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
              Role Assign • WhatsApp Hub
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
            Create official support groups .
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <Link
            to="/whatsapp-groups"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-xs sm:text-sm shadow transition-all active:scale-95"
          >
            <Globe className="h-4 w-4 text-[var(--text-color)]" />
            <span className="text-[var(--text-color)]">Public Directory</span>
          </Link>
        </div>
      </div>


      {/* Form Card for Active Level */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
        <div
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--bg-main)]/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <PlusCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-[var(--text-color)]">
              Create New {activeTab} Level Support Group
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-semibold">
              Support Only
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium">
            <span>{showCreateForm ? "Collapse Form" : "Expand Form"}</span>
            {showCreateForm ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
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

      {/* Table Section: Existing groups for this level */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Active {activeTab} Groups ({groups.length})
            </h3>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">
            Automatically synchronized with public directory
          </span>
        </div>

        <WhatsAppLinksTable
          groups={groups}
          isLoading={loadingGroups || loadingMasterData}
          activeLevel={activeTab}
        />
      </div>
    </div>
  );
}
