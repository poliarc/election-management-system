import type { ReactNode } from "react";
import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout, setSelectedAssignment } from "../store/authSlice";
import type { StateAssignment } from "../types/api";
import { fetchAfterAssemblyChildrenByParent } from "../services/afterAssemblyApi";
import { useGetSidebarModulesQuery } from "../store/api/modulesApi";

type NavItem = { to: string; label: string; icon: ReactNode };

const iconClass = "h-5 w-5 stroke-[1.6]";

const Icons = {
  dashboard: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-18v6h8V3h-8Z"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  ),
  team: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 13c2.761 0 5-2.239 5-5S14.761 3 12 3 7 5.239 7 8s2.239 5 5 5Zm6 1H6a4 4 0 0 0-4 4v3h20v-3a4 4 0 0 0-4-4Z"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  ),
  hierarchy: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M3 8h18M3 16h18M8 21V3m8 0v18"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  booths: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M4 7h16v12H4V7Zm4 0V5h8v2"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  chat: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  search: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  vic: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  campaigns: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 3v6m0 0c-3.314 0-6 2.686-6 6a6 6 0 1 0 12 0c0-3.314-2.686-6-6-6Zm0 0V3m0 6 4.5-4.5M12 9 7.5 4.5"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export default function AfterAssemblyPanelSidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { levelId } = useParams<{ levelId: string }>();
  const { user, selectedAssignment, permissions } = useAppSelector(
    (s) => s.auth
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [levelInfo, setLevelInfo] = useState<any>(null);
  const [switchDropdownOpen, setSwitchDropdownOpen] = useState(false);
  const [childLevelLabel, setChildLevelLabel] = useState("Below");
  const [vicDropdownOpen, setVicDropdownOpen] = useState(false);
  const switchDropdownRef = useRef<HTMLDivElement>(null);
  const vicDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedAssignment) {
      setLevelInfo(selectedAssignment);
    }
  }, [selectedAssignment]);

  useEffect(() => {
    let isActive = true;

    const loadChildLevelLabel = async () => {
      if (!levelId) {
        setChildLevelLabel("Below");
        return;
      }

      try {
        const response = await fetchAfterAssemblyChildrenByParent(
          Number(levelId)
        );
        const nextLevel = response?.data?.[0];

        if (isActive) {
          setChildLevelLabel(
            nextLevel?.partyLevelName || nextLevel?.levelName || "Below"
          );
        }
      } catch (err) {
        console.error("Failed to load child level label", err);
        if (isActive) {
          setChildLevelLabel("Below");
        }
      }
    };

    loadChildLevelLabel();

    return () => {
      isActive = false;
    };
  }, [levelId]);

  const base = `/afterassembly/${levelId}`;
  const firstName = user?.firstName || user?.username || "User";

  // Get party and state info for API call from localStorage
  const getPartyAndStateFromStorage = () => {
    try {
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        const user = JSON.parse(authUser);
        return {
          partyId: user?.partyId || 0,
          stateId: user?.state_id || 0,
        };
      }
    } catch (error) {
      console.error('Error reading auth_user from localStorage:', error);
    }
    return { partyId: 0, stateId: 0 };
  };

  const { partyId, stateId } = getPartyAndStateFromStorage();

  // Get correct partyLevelId from permissions data instead of selectedAssignment
  const getCorrectPartyLevelId = () => {
    if (!selectedAssignment || !permissions) {
      return selectedAssignment?.partyLevelId || 0;
    }

    // Check in all accessible levels for matching assignment (sub-levels only)
    const accessibleLevels = [
      { data: permissions.accessibleBooths, idField: 'booth_assignment_id' },
      { data: permissions.accessiblePollingCenters, idField: 'assignment_id' },
      { data: permissions.accessibleMandals, idField: 'assignment_id' },
      { data: permissions.accessibleBlocks, idField: 'assignment_id' },
      { data: permissions.accessibleSectors, idField: 'assignment_id' },
      { data: permissions.accessibleWards, idField: 'assignment_id' },
      { data: permissions.accessibleZones, idField: 'assignment_id' },
    ];

    for (const level of accessibleLevels) {
      if (level.data && Array.isArray(level.data)) {
        const matchingItem = level.data.find(
          (item: any) => item[level.idField] === selectedAssignment.assignment_id
        );
        if (matchingItem && matchingItem.partyLevelId) {
          return matchingItem.partyLevelId;
        }
      }
    }

    // Fallback to selectedAssignment
    return selectedAssignment.partyLevelId || 0;
  };

  const partyLevelId = getCorrectPartyLevelId();

  // Debug logging to check the values
  console.log('AfterAssemblyPanelSidebar API params:', {
    state_id: stateId,
    party_id: partyId,
    party_level_id: partyLevelId,
    selectedAssignment
  });

  // Fetch dynamic sidebar modules from API
  const { data: sidebarModules = [] } = useGetSidebarModulesQuery(
    {
      state_id: stateId,
      party_id: partyId,
      party_level_id: partyLevelId
    },
    { skip: !partyId || !stateId || !partyLevelId }
  );

  // Check if Team module is accessible
  const hasTeamAccess = useMemo(() => {
    return sidebarModules.some(module => 
      module.moduleName.toLowerCase().includes('team')
    );
  }, [sidebarModules]);

  const formatLevelName = (name?: string | null): string => {
    if (!name) return "After Assembly";
    // PollingCenter → Polling Center
    if (name === "PollingCenter" || name === "pollingCenter")
      return "Polling Center";
    // Add more formatting as needed
    return name;
  };

  const levelName = formatLevelName(
    levelInfo?.levelType || levelInfo?.levelName
  );
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    firstName
  )}&background=6366f1&color=fff&bold=true`;

  // Check if current level is Booth type
  const isBooth =
    levelInfo?.levelType === "Booth" || levelInfo?.partyLevelName === "Booth";

  // Get assignments of the same type as currently selected
  const currentLevelName = selectedAssignment?.levelType;
  let sameTypeAssignments: StateAssignment[] = [];

  if (currentLevelName) {
    const allAfterAssemblyAssignments = [
      ...(permissions?.accessibleBlocks || []),
      ...(permissions?.accessiblePollingCenters || []),
      ...(permissions?.accessibleMandals || []),
      ...(permissions?.accessibleBooths || []),
    ];

    sameTypeAssignments = allAfterAssemblyAssignments
      .filter((a: any) => a.levelName === currentLevelName)
      .map((a: any) => ({
        assignment_id: a.assignment_id || a.booth_assignment_id,
        stateMasterData_id: a.afterAssemblyData_id || a.parentLevelId || 0,
        afterAssemblyData_id: a.afterAssemblyData_id,
        levelName: a.displayName || a.levelName,
        levelType: a.levelName,
        level_id: a.level_id,
        parentId: a.parentId || a.parentAssemblyId || a.parentLevelId,
        parentLevelName: a.assemblyName || a.parentLevelName || "Unknown",
        parentLevelType: a.parentLevelType || "Unknown",
        displayName: a.displayName,
        assemblyName: a.assemblyName,
        partyLevelName: a.partyLevelName,
        partyLevelDisplayName: a.partyLevelDisplayName,
        partyLevelId: a.partyLevelId,
        boothFrom: a.boothFrom,
        boothTo: a.boothTo,
      }));
  }

  // Get booth range for current assignment if it's a booth
  const currentBoothRange =
    isBooth && selectedAssignment
      ? (selectedAssignment as any).boothFrom &&
        (selectedAssignment as any).boothTo
        ? `${(selectedAssignment as any).boothFrom} - ${(selectedAssignment as any).boothTo
        }`
        : null
      : null;

  const hasMultipleAssignments = sameTypeAssignments.length > 1;

  // Auto-scroll to selected item when dropdown opens
  useEffect(() => {
    if (switchDropdownOpen && switchDropdownRef.current) {
      const selectedButton = switchDropdownRef.current.querySelector('.bg-indigo-50');
      if (selectedButton) {
        selectedButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [switchDropdownOpen]);

  // Auto-scroll to VIC dropdown when it opens
  useEffect(() => {
    if (vicDropdownOpen && vicDropdownRef.current) {
      vicDropdownRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [vicDropdownOpen]);

  const handleAssignmentSwitch = (assignment: StateAssignment) => {
    dispatch(setSelectedAssignment(assignment));
    // Don't close dropdown - let user select multiple items if needed
    // setSwitchDropdownOpen(false);

    // Dispatch custom event to trigger data refresh
    window.dispatchEvent(new Event("assignmentChanged"));

    // Navigate to the new assignment
    navigate(
      `/afterassembly/${assignment.afterAssemblyData_id || assignment.stateMasterData_id
      }/dashboard`
    );
  };

  const childLevelNavLabel = childLevelLabel
    ? `${childLevelLabel} level`
    : "Below Levels";

  // Helper function to get appropriate icon for module
  function getIconForModule(moduleName: string): ReactNode {
    const lowerModuleName = moduleName.toLowerCase();

    if (lowerModuleName.includes('campaign')) return Icons.campaigns;
    if (lowerModuleName.includes('user')) return Icons.team;
    if (lowerModuleName.includes('event')) return Icons.campaigns;
    if (lowerModuleName.includes('search')) return Icons.search;
    if (lowerModuleName.includes('vic')) return Icons.vic;
    if (lowerModuleName.includes('chat')) return Icons.chat;

    // Default icon for unknown modules
    return Icons.campaigns;
  }

  // Helper function to get appropriate route for module
  function getModuleRoute(moduleName: string): string {
    const lowerModuleName = moduleName.toLowerCase();

    // Map specific module names to their correct routes for AfterAssembly
    if (lowerModuleName.includes('campaign')) return 'campaigns';
    if (lowerModuleName.includes('assigned event') || lowerModuleName.includes('event')) return 'assigned-events';
    if (lowerModuleName.includes('user management') || lowerModuleName.includes('user')) return 'users';
    if (lowerModuleName.includes('search')) return 'search-voter';
    if (lowerModuleName.includes('vic')) return 'vic';
    if (lowerModuleName.includes('chat')) return 'chat';

    // Default: convert module name to kebab-case
    return moduleName.toLowerCase().replace(/\s+/g, '-');
  }

  const staticNavItems: NavItem[] = [
    { to: "dashboard", label: "Dashboard", icon: Icons.dashboard },
    // Team is now dynamic based on module access
    ...(hasTeamAccess ? [{ to: "team", label: "Team", icon: Icons.team }] : []),
    { to: "child-hierarchy", label: childLevelNavLabel, icon: Icons.hierarchy },
    { to: "booths", label: "Booths", icon: Icons.booths },
  ];

  const dynamicModuleItems: NavItem[] = sidebarModules
    .filter(module => !module.moduleName.toLowerCase().includes('team')) // Filter out Team module as it's handled in static items
    .map((module) => ({
      to: getModuleRoute(module.moduleName),
      label: module.displayName,
      icon: getIconForModule(module.moduleName),
    }));


  const navItems: NavItem[] = [
    ...staticNavItems,
    ...dynamicModuleItems,
  ];

  const vicMenuItems = [
    { to: "vic/send-report", label: "Send Report" },
    { to: "vic/my-reports", label: "My Reports" },
    { to: "vic/assigned-reports", label: "Assigned Reports" },
    { to: "vic/under-hierarchy-reports", label: "Under Hierarchy Reports" },
  ];

  return (
    <aside className="w-68 shrink-0 h-full border-r border-gray-200 bg-white flex flex-col overflow-y-auto">
      {/* User header */}
      <div className="px-5 py-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl}
            alt={firstName}
            className="h-11 w-11 rounded-full ring-2 ring-indigo-500/25 shadow-sm"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-black text-sm">
              {firstName}
            </p>
            <p className="text-xs font-medium tracking-wide text-indigo-600 uppercase">
              {levelName} level
            </p>
            {currentBoothRange && (
              <p className="text-xs font-medium text-gray-600 mt-0.5">
                Booth: {currentBoothRange}
              </p>
            )}
          </div>
        </div>

        {/* Switch Dropdown - Show when user has multiple assignments of same type */}
        {hasMultipleAssignments && selectedAssignment && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setSwitchDropdownOpen(!switchDropdownOpen)}
              className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  className="h-4 w-4 text-indigo-600 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-medium text-gray-700 truncate">
                  {selectedAssignment.displayName ||
                    selectedAssignment.levelName}
                </span>
              </div>
              <svg
                className={`h-4 w-4 text-gray-500 transition-transform shrink-0 ${switchDropdownOpen ? "rotate-180" : "rotate-0"
                  }`}
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M6 8l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {switchDropdownOpen && (
              <div
                ref={switchDropdownRef}
                className="mt-2 rounded-lg border border-gray-200 bg-white p-2 text-sm shadow-lg max-h-64 overflow-y-auto"
              >
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Switch{" "}
                  {selectedAssignment?.partyLevelDisplayName ||
                    selectedAssignment?.partyLevelName ||
                    levelName}
                </div>
                {sameTypeAssignments.map((assignment) => (
                  <button
                    key={assignment.assignment_id}
                    onClick={() => handleAssignmentSwitch(assignment)}
                    className={[
                      "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                      selectedAssignment.assignment_id ===
                        assignment.assignment_id
                        ? "bg-indigo-50 text-indigo-900"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                    ].join(" ")}
                  >
                    <svg
                      className="h-4 w-4 mt-0.5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-xs">
                        {assignment.displayName || assignment.levelName}
                      </div>
                      {assignment.parentLevelName && (
                        <div className="text-xs text-gray-500 truncate">
                          {assignment.parentLevelName}
                        </div>
                      )}
                    </div>
                    {selectedAssignment.assignment_id ===
                      assignment.assignment_id && (
                        <svg
                          className="h-4 w-4 shrink-0"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={`${base}/${item.to}`}
            onClick={() => {
              onNavigate?.();
              setVicDropdownOpen(false); // Close VIC dropdown when clicking other nav items
            }}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm no-underline",
                "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                isActive
                  ? "bg-gradient-to-r from-indigo-50 to-white ring-1 ring-indigo-200"
                  : "border border-transparent hover:border-gray-200",
              ].join(" ")
            }
          >
            <span className="text-indigo-600 shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
            <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
            <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
          </NavLink>
        ))}

        {/* VIC Dropdown */}
        <div ref={vicDropdownRef}>
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={vicDropdownOpen}
            onClick={() => setVicDropdownOpen(!vicDropdownOpen)}
            className={[
              "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
              "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              vicDropdownOpen
                ? "bg-gray-50 ring-1 ring-indigo-200"
                : "border border-transparent hover:border-gray-200",
            ].join(" ")}
          >
            <span className="flex items-center gap-3 text-indigo-600">
              {Icons.vic}
              <span className="text-black">VIC</span>
            </span>
            <svg
              className={[
                "h-4 w-4 text-indigo-600 transition-transform",
                vicDropdownOpen ? "rotate-180" : "rotate-0",
              ].join(" ")}
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M6 8l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {vicDropdownOpen && (
            <div className="mt-2 ml-2 pl-2 border-l border-gray-200 space-y-1">
              {vicMenuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={`${base}/${item.to}`}
                  onClick={() => {
                    onNavigate?.();
                    // Don't close VIC dropdown - let user browse multiple items
                    // setVicDropdownOpen(false);
                  }}
                  className={({ isActive }) =>
                    [
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                      "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                      isActive
                        ? "bg-indigo-50 ring-1 ring-indigo-200"
                        : "border border-transparent hover:border-gray-200",
                    ].join(" ")
                  }
                >
                  <span className="text-indigo-600">{Icons.vic}</span>
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Account section */}
      <div className="mt-auto pt-3 pb-5 border-t border-gray-200">
        <div className="px-5 mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Account
        </div>
        <div className="px-4 space-y-2">
          <NavLink
            to={`${base}/profile`}
            onClick={() => {
              onNavigate?.();
              setVicDropdownOpen(false); // Close VIC dropdown when clicking Profile
            }}
            className={({ isActive }) =>
              [
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition no-underline",
                "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                isActive
                  ? "bg-indigo-50 ring-1 ring-indigo-200"
                  : "border border-transparent hover:border-gray-200",
              ].join(" ")
            }
          >
            <svg
              className="h-5 w-5 stroke-[1.6] text-indigo-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M12 13c2.761 0 5-2.239 5-5S14.761 3 12 3 7 5.239 7 8s2.239 5 5 5Zm6 1H6a4 4 0 0 0-4 4v3h20v-3a4 4 0 0 0-4-4Z"
                strokeWidth={1.4}
                strokeLinejoin="round"
              />
            </svg>
            <span>Profile</span>
          </NavLink>
          <button
            onClick={() => {
              setVicDropdownOpen(false); // Close VIC dropdown when logging out
              dispatch(logout());
              navigate("/login");
            }}
            className="group w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 transition border border-transparent hover:border-red-200"
          >
            <svg
              className="h-5 w-5 stroke-[1.6]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M15 3H6v18h9M10 12h11m0 0-4-4m4 4-4 4"
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
