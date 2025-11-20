import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { setSelectedAssignment } from "../store/authSlice";
import type { PanelAssignment } from "../types/auth";

// All possible level types
const ALL_LEVELS = [
  { type: 'State', route: '/state', icon: '🏛️' },
  { type: 'District', route: '/district', icon: '🏙️' },
  { type: 'Assembly', route: '/assembly', icon: '🏢' },
  { type: 'Block', route: '/block', icon: '🏘️' },
  { type: 'Mandal', route: '/mandal', icon: '🏪' },
  { type: 'PollingCenter', route: '/polling-center', icon: '🗳️' },
  { type: 'Booth', route: '/booth', icon: '📍' },
];

// Panel Card Component
interface PanelCardProps {
  panel: PanelAssignment;
  onClick: () => void;
}

function PanelCard({ panel, onClick }: PanelCardProps) {
  return (
    <button
      onClick={onClick}
      className="group rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-left shadow-sm transition bg-white dark:bg-gray-800 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-900 dark:text-white font-semibold">
          {panel.displayName}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 capitalize">
          {panel.type}
        </span>
      </div>
      {panel.metadata && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          {panel.type === 'party' && panel.metadata.partyCode && (
            <div>Code: {panel.metadata.partyCode}</div>
          )}
          {panel.type === 'level' && panel.metadata.stateName && (
            <div>State: {panel.metadata.stateName}</div>
          )}
          {panel.type === 'level' && panel.metadata.stateLevelType && (
            <div>Type: {panel.metadata.stateLevelType}</div>
          )}
        </div>
      )}
      <div className="mt-3 text-indigo-600 dark:text-indigo-400 text-sm opacity-0 group-hover:opacity-100 transition">
        Open →
      </div>
    </button>
  );
}

// Level Card Component (for state assignments)
interface LevelCardProps {
  levelType: string;
  icon: string;
  route: string;
  isEnabled: boolean;
  assignmentCount: number;
  onClick: () => void;
}

function LevelCard({ levelType, icon, isEnabled, assignmentCount, onClick }: LevelCardProps) {
  return (
    <button
      onClick={isEnabled ? onClick : undefined}
      disabled={!isEnabled}
      className={[
        "group rounded-xl border p-4 text-left shadow-sm transition",
        isEnabled
          ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 cursor-pointer"
          : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed",
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div className={[
            "font-semibold",
            isEnabled ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-600"
          ].join(" ")}>
            {levelType}
          </div>
        </div>
        {isEnabled ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
            {assignmentCount} Assigned
          </span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500">
            Not Assigned
          </span>
        )}
      </div>
      {isEnabled && (
        <div className="mt-3 text-emerald-600 dark:text-emerald-400 text-sm opacity-0 group-hover:opacity-100 transition">
          Open →
        </div>
      )}
    </button>
  );
}

export default function PanelSelect() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    isPartyAdmin,
    isLevelAdmin,
    hasStateAssignments,
    partyAdminPanels,
    levelAdminPanels,
    stateAssignments,
    permissions,
  } = useAppSelector((s) => s.auth);

  // No auto-redirect - let users see and choose their panels even if they have only one

  const handlePanelClick = (redirectUrl: string) => {
    navigate(redirectUrl);
  };

  const handleLevelClick = (levelType: string, route: string) => {
    // Get all assignments for this level type from stateAssignments
    let levelAssignments = stateAssignments.filter((a) => a.levelType === levelType);

    // For Block level, also check permissions.accessibleBlocks
    if (levelType === 'Block' && permissions?.accessibleBlocks && permissions.accessibleBlocks.length > 0) {
      // Transform Block assignments to match StateAssignment structure
      levelAssignments = permissions.accessibleBlocks.map((block) => ({
        ...block,
        levelType: 'Block',
        stateMasterData_id: block.afterAssemblyData_id || 0,
        // displayName comes from API (e.g., "Badli Block")
      }));
    }

    if (levelAssignments.length === 0) return;

    // If only one assignment, select it and navigate
    if (levelAssignments.length === 1) {
      dispatch(setSelectedAssignment(levelAssignments[0]));
      navigate(route);
    } else {
      // If multiple assignments, select the first one and navigate
      // User can switch via topbar dropdown
      dispatch(setSelectedAssignment(levelAssignments[0]));
      navigate(route);
    }
  };

  const hasAnyAccess = isPartyAdmin || isLevelAdmin || hasStateAssignments;

  // Group state assignments by level type and count them
  const levelAssignmentCounts = stateAssignments.reduce((acc, assignment) => {
    acc[assignment.levelType] = (acc[assignment.levelType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Add Block assignments from permissions
  if (permissions?.accessibleBlocks && permissions.accessibleBlocks.length > 0) {
    levelAssignmentCounts['Block'] = permissions.accessibleBlocks.length;
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Choose your panel
          </h1>
          {hasAnyAccess && (
            <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 px-2.5 py-1 text-xs font-medium">
              Access available
            </span>
          )}
        </div>

        {!hasAnyAccess && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No panel access assigned. Please contact your administrator.
            </p>
          </div>
        )}

        <div className="space-y-8">
          {/* Party Admin Panels Section */}
          {isPartyAdmin && partyAdminPanels.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                Party Admin Panels
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {partyAdminPanels.map((panel) => (
                  <PanelCard
                    key={panel.id}
                    panel={panel}
                    onClick={() => handlePanelClick(panel.redirectUrl)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Level Admin Panels Section */}
          {isLevelAdmin && levelAdminPanels.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                Level Admin Panels
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {levelAdminPanels.map((panel) => (
                  <PanelCard
                    key={panel.id}
                    panel={panel}
                    onClick={() => handlePanelClick(panel.redirectUrl)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Levels Section - Show all levels with enabled/disabled state */}
          {hasStateAssignments && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                Level Access
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {ALL_LEVELS.map((level) => {
                  const assignmentCount = levelAssignmentCounts[level.type] || 0;
                  const isEnabled = assignmentCount > 0;

                  return (
                    <LevelCard
                      key={level.type}
                      levelType={level.type}
                      icon={level.icon}
                      route={level.route}
                      isEnabled={isEnabled}
                      assignmentCount={assignmentCount}
                      onClick={() => handleLevelClick(level.type, level.route)}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
