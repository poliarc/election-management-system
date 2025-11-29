import { useEffect, useRef, useState, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout, setSelectedAssignment, clearSelectedAssignment } from "../store/authSlice";
import { ThemeToggle } from "./ThemeToggle";
import type { StateAssignment } from "../types/api";
import type { PanelAssignment } from "../types/auth";

export function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const user = useAppSelector((s) => s.auth.user);
  const { stateAssignments, selectedAssignment, permissions, partyAdminPanels, levelAdminPanels } = useAppSelector(
    (s) => s.auth
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [assignmentMenuOpen, setAssignmentMenuOpen] = useState(false);
  // split into three menus
  const [partyPanelsOpen, setPartyPanelsOpen] = useState(false);
  const [levelAdminPanelsOpen, setLevelAdminPanelsOpen] = useState(false);
  const [levelAccessOpen, setLevelAccessOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const assignmentMenuRef = useRef<HTMLDivElement | null>(null);
  const partyPanelsRef = useRef<HTMLDivElement | null>(null);
  const levelAdminPanelsRef = useRef<HTMLDivElement | null>(null);
  const levelAccessRef = useRef<HTMLDivElement | null>(null);

  // Determine which admin panel is currently active based on URL
  const currentAdminPanel = useMemo(() => {
    const allPanels = [...(levelAdminPanels || []), ...(partyAdminPanels || [])];
    return allPanels.find(p => p.redirectUrl && location.pathname.startsWith(p.redirectUrl));
  }, [location.pathname, levelAdminPanels, partyAdminPanels]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (
        assignmentMenuRef.current &&
        !assignmentMenuRef.current.contains(e.target as Node)
      ) {
        setAssignmentMenuOpen(false);
      }
      if (partyPanelsRef.current && !partyPanelsRef.current.contains(e.target as Node)) {
        setPartyPanelsOpen(false);
      }
      if (levelAdminPanelsRef.current && !levelAdminPanelsRef.current.contains(e.target as Node)) {
        setLevelAdminPanelsOpen(false);
      }
      if (levelAccessRef.current && !levelAccessRef.current.contains(e.target as Node)) {
        setLevelAccessOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setAssignmentMenuOpen(false);
        setPartyPanelsOpen(false);
        setLevelAdminPanelsOpen(false);
        setLevelAccessOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Determine if we're in AfterAssembly or SubLevel panel
  const isAfterAssemblyPanel = location.pathname.startsWith('/afterassembly/');
  const isSubLevelPanel = location.pathname.startsWith('/sublevel/');

  // Determine if we're in an admin panel (hide profile link)
  const isAdminPanel = location.pathname.startsWith('/admin');
  const isLevelAdminPanel = location.pathname.startsWith('/leveladmin');
  const isPartyAdminPanel = location.pathname.startsWith('/partyadmin');
  const shouldHideProfile = isAdminPanel || isLevelAdminPanel || isPartyAdminPanel;

  // Get assignments of the same type as currently selected
  const currentLevelType = selectedAssignment?.levelType;
  let sameTypeAssignments: StateAssignment[] = [];
  let panelType: 'afterassembly' | 'sublevel' | 'standard' = 'standard';

  if (isAfterAssemblyPanel || isSubLevelPanel) {
    // For AfterAssembly and SubLevel panels, get all assignments at the same level
    panelType = isAfterAssemblyPanel ? 'afterassembly' : 'sublevel';

    // Get the current level type from selectedAssignment
    const currentLevelName = selectedAssignment?.levelType;

    if (isAfterAssemblyPanel) {
      // For AfterAssembly panel, get all assignments with same levelName
      const allAfterAssemblyAssignments = [
        ...(permissions?.accessibleBlocks || []),
        ...(permissions?.accessiblePollingCenters || []),
        ...(permissions?.accessibleMandals || []),
      ];

      // Filter by the same levelName (e.g., all "PollingCenter" or all "Block")
      if (currentLevelName) {
        sameTypeAssignments = allAfterAssemblyAssignments
          .filter((a: any) => a.levelName === currentLevelName)
          .map((a: any) => ({
            assignment_id: a.assignment_id,
            stateMasterData_id: a.afterAssemblyData_id || 0,
            afterAssemblyData_id: a.afterAssemblyData_id,
            levelName: a.displayName || a.levelName,
            levelType: a.levelName,
            level_id: a.level_id,
            parentId: a.parentId || a.parentAssemblyId,
            parentLevelName: a.assemblyName || a.parentLevelName || 'Unknown',
            parentLevelType: a.parentLevelType || 'Unknown',
            displayName: a.displayName,
            assemblyName: a.assemblyName,
            partyLevelName: a.partyLevelName,
            partyLevelDisplayName: a.partyLevelDisplayName,
            partyLevelId: a.partyLevelId,
          }));
      }
    } else if (isSubLevelPanel) {
      // For SubLevel panel, get all assignments with same levelName
      const allSubLevelAssignments = [
        ...(permissions?.accessiblePollingCenters || []),
        ...(permissions?.accessibleBooths || []),
      ];

      // Filter by the same levelName
      if (currentLevelName) {
        sameTypeAssignments = allSubLevelAssignments
          .filter((a: any) => a.levelName === currentLevelName)
          .map((a: any) => ({
            assignment_id: a.assignment_id || a.booth_assignment_id,
            stateMasterData_id: a.afterAssemblyData_id || a.parentLevelId || 0,
            afterAssemblyData_id: a.afterAssemblyData_id,
            levelName: a.displayName || a.levelName,
            levelType: a.levelName,
            level_id: a.level_id,
            parentId: a.parentId || a.parentLevelId,
            parentLevelName: a.parentLevelName || 'Unknown',
            parentLevelType: a.parentLevelType || 'Unknown',
            displayName: a.displayName,
            partyLevelName: a.partyLevelName,
            partyLevelDisplayName: a.partyLevelDisplayName,
            partyLevelId: a.partyLevelId,
          }));
      }
    }
  } else {
    // Standard panel logic
    if (currentLevelType) {
      if (currentLevelType === 'Block' && permissions?.accessibleBlocks) {
        // For Block level, use permissions.accessibleBlocks
        sameTypeAssignments = permissions.accessibleBlocks.map((block: any) => ({
          ...block,
          levelType: 'Block',
          stateMasterData_id: block.afterAssemblyData_id || 0,
          displayName: block.displayName,
          partyLevelName: block.partyLevelName,
        }));
      } else {
        sameTypeAssignments = stateAssignments.filter((a) => a.levelType === currentLevelType);
      }
    }
  }

  const hasMultipleAssignments = sameTypeAssignments.length > 1;

  // Build a flattened list of all assignments (state + dynamic from permissions)
  let allAssignments: StateAssignment[] = [];

  // include state assignments
  if (stateAssignments && stateAssignments.length > 0) {
    allAssignments.push(...stateAssignments);
  }

  // include dynamic assignments from permissions (blocks, mandals, polling centers, booths)
  if (permissions) {
    const pushMaybe = (a: any) => {
      const mapped: StateAssignment = {
        assignment_id: a.assignment_id || a.booth_assignment_id,
        stateMasterData_id: a.afterAssemblyData_id || a.stateMasterData_id || 0,
        afterAssemblyData_id: a.afterAssemblyData_id,
        levelName: a.displayName || a.levelName || a.partyLevelName,
        levelType: a.levelName || a.partyLevelName || 'Unknown',
        level_id: a.level_id || a.booth_assignment_id,
        parentId: a.parentId || a.parentLevelId || a.parentAssemblyId,
        parentLevelName: a.parentLevelName || a.assemblyName || null,
        parentLevelType: a.parentLevelType || null,
        displayName: a.displayName || a.partyLevelDisplayName,
        assemblyName: a.assemblyName,
        partyLevelName: a.partyLevelName,
        partyLevelDisplayName: a.partyLevelDisplayName,
        partyLevelId: a.partyLevelId,
      };
      allAssignments.push(mapped);
    };

    if (permissions.accessibleBlocks) permissions.accessibleBlocks.forEach(pushMaybe);
    if (permissions.accessibleMandals) permissions.accessibleMandals.forEach(pushMaybe);
    if (permissions.accessiblePollingCenters) permissions.accessiblePollingCenters.forEach(pushMaybe);
    if (permissions.accessibleBooths) permissions.accessibleBooths.forEach(pushMaybe);
  }

  // remove duplicates by assignment_id
  const seen = new Set<number>();
  allAssignments = allAssignments.filter((a) => {
    if (!a || a.assignment_id == null) return false;
    if (seen.has(a.assignment_id)) return false;
    seen.add(a.assignment_id);
    return true;
  });

  const hasAnyAssignments = allAssignments.length > 0;
  const hasAnyAdminPanels = (partyAdminPanels && partyAdminPanels.length > 0) || (levelAdminPanels && levelAdminPanels.length > 0);

  // Debug logging for dynamic panels
  if ((isAfterAssemblyPanel || isSubLevelPanel) && process.env.NODE_ENV === 'development') {
    console.log('🔍 Assignment Selector Debug:', {
      panelType,
      currentLevelType,
      selectedAssignment,
      sameTypeAssignments,
      hasMultipleAssignments,
      pathname: location.pathname
    });
  }

  const handleAssignmentSwitch = (assignment: StateAssignment) => {
    dispatch(setSelectedAssignment(assignment));
    setAssignmentMenuOpen(false);
    setPartyPanelsOpen(false);
    setLevelAdminPanelsOpen(false);
    setLevelAccessOpen(false);

    // Dispatch custom event to trigger data refresh in dashboards
    window.dispatchEvent(new Event('districtChanged'));
    window.dispatchEvent(new Event('assignmentChanged'));

    // Determine route based on the target assignment (inspect assignment itself)
    if (assignment.afterAssemblyData_id) {
      // dynamic after-assembly / sublevel logic: decide whether to go to afterassembly or sublevel
      if (assignment.parentId === null || assignment.parentLevelType === 'Assembly') {
        navigate(`/afterassembly/${assignment.afterAssemblyData_id || assignment.stateMasterData_id}/dashboard`);
      } else {
        navigate(`/sublevel/${assignment.afterAssemblyData_id || assignment.stateMasterData_id}/dashboard`);
      }
      return;
    }

    // Standard navigation
    const levelTypeRoutes: Record<string, string> = {
      State: "/state",
      District: "/district",
      Assembly: "/assembly",
      Block: "/block",
      Mandal: "/mandal",
      PollingCenter: "/polling-center",
      Booth: "/booth",
    };

    const route = levelTypeRoutes[assignment.levelType];
    if (route) {
      navigate(route);
    }
  };

  const handleAdminPanelNavigate = (panel: PanelAssignment) => {
    setAssignmentMenuOpen(false);
    setPartyPanelsOpen(false);
    setLevelAdminPanelsOpen(false);
    setLevelAccessOpen(false);
    // Clear any Team Levels selection so other dropdowns don't show a stale selection
    dispatch(clearSelectedAssignment());
    navigate(panel.redirectUrl);
  };

  const firstName = user?.firstName || user?.username || "User";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    firstName
  )}&background=ffffff&color=111827&bold=true`;

  // Get profile route based on current level type
  const getProfileRoute = () => {
    if (!currentLevelType) return "/profile";

    // Check if it's a dynamic level (after assembly)
    if (selectedAssignment?.afterAssemblyData_id) {
      const levelId = selectedAssignment.afterAssemblyData_id;

      // Determine if it's a direct child of Assembly or a deeper level
      if (selectedAssignment.parentId === null || selectedAssignment.parentLevelType === 'Assembly') {
        return `/afterassembly/${levelId}/profile`;
      } else {
        return `/sublevel/${levelId}/profile`;
      }
    }

    const profileRoutes: Record<string, string> = {
      State: "/state/profile",
      District: "/district/profile",
      Assembly: "/assembly/profile",
      Block: "/block/profile",
      Mandal: "/mandal/profile",
      PollingCenter: "/polling-center/profile",
      Booth: "/booth/profile",
    };

    return profileRoutes[currentLevelType] || "/profile";
  };

  // Helper: map a permissions item into a full StateAssignment
  const mapPermissionToAssignment = (item: any, source?: string): StateAssignment => {
    if (!item) return {} as StateAssignment;
    // For fixed types (District, Assembly), do NOT set afterAssemblyData_id
    const isFixed = source === 'District' || source === 'Assembly';
    const isDirectChildOfAssembly = item.parentId == null || item.parentLevelId == null;
    return {
      assignment_id: item.assignment_id || item.booth_assignment_id,
      stateMasterData_id: item.stateMasterData_id || 0,
      afterAssemblyData_id: isFixed ? undefined : (item.afterAssemblyData_id || item.booth_assignment_id),
      levelName: item.displayName || item.levelName || source,
      levelType: source || item.levelName || item.partyLevelName || 'Unknown',
      level_id: item.level_id || item.booth_assignment_id,
      parentId: item.parentId || item.parentLevelId || null,
      parentLevelName: item.parentLevelName || item.assemblyName || (isDirectChildOfAssembly ? 'Assembly' : 'Unknown'),
      parentLevelType: item.parentLevelType || (isDirectChildOfAssembly ? 'Assembly' : 'Unknown'),
      displayName: item.partyLevelDisplayName || item.displayName || item.levelName || item.name,
      assemblyName: item.assemblyName,
      partyLevelName: item.partyLevelName,
      partyLevelDisplayName: item.partyLevelDisplayName,
      partyLevelId: item.partyLevelId,
    } as StateAssignment;
  };

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
      <div className="container-page flex items-center justify-between py-2 sm:py-3 px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          {/* Mobile hamburger to open sidebar */}
          <button
            type="button"
            onClick={() => onToggleSidebar?.()}
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition shrink-0"
            aria-label="Open sidebar"
          >
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Home Icon Button - Navigate to /panels */}
          <button
            type="button"
            onClick={() => navigate("/panels")}
            className="group inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition shrink-0 relative"
            aria-label="Go to assigned panels"
            title="Assigned Panels"
          >
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            {/* Tooltip */}
           
          </button>

           {/* <div className="font-semibold text-sm sm:text-base truncate" aria-label="Current level">
            {user?.role || "Dashboard"}
          </div>  */}

          {/* Assignment Switcher - Show when user has multiple assignments of same type */}
          {hasMultipleAssignments && selectedAssignment && (
            <div className="relative hidden md:block" ref={assignmentMenuRef}>
              <button
                type="button"
                onClick={() => {
                  // Open assignment menu and close other dropdowns to avoid accidental clicks
                  setAssignmentMenuOpen((s) => !s);
                  setPartyPanelsOpen(false);
                  setLevelAdminPanelsOpen(false);
                  setLevelAccessOpen(false);
                }}
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 sm:px-3 py-1.5 text-xs sm:text-sm hover:bg-gray-100 transition dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 max-w-[200px]"
              >
                <svg
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 shrink-0"
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
                <span className="font-medium text-gray-700 dark:text-gray-200 truncate">
                  {selectedAssignment.displayName || selectedAssignment.levelName}
                </span>
                <svg
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 transition-transform shrink-0 ${assignmentMenuOpen ? "rotate-180" : "rotate-0"
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

              {assignmentMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 sm:w-64 rounded-2xl border border-gray-200 bg-white p-2 text-sm shadow-xl dark:border-gray-700 dark:bg-gray-800 max-h-80 overflow-y-auto z-50">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Switch {selectedAssignment?.partyLevelDisplayName || selectedAssignment?.partyLevelName || currentLevelType}
                  </div>
                  {sameTypeAssignments.map((assignment) => (
                    <button
                      key={assignment.assignment_id}
                      onClick={() => handleAssignmentSwitch(assignment)}
                      className={[
                        "flex w-full items-start gap-2 sm:gap-3 rounded-xl px-2 sm:px-3 py-2 text-left transition-colors",
                        selectedAssignment.assignment_id ===
                          assignment.assignment_id
                          ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700",
                      ].join(" ")}
                    >
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 shrink-0"
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
                        <div className="font-medium truncate text-xs sm:text-sm">
                          {assignment.displayName || assignment.levelName}
                        </div>
                        {assignment.parentLevelName && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {assignment.parentLevelName}
                          </div>
                        )}
                      </div>
                      {selectedAssignment.assignment_id ===
                        assignment.assignment_id && (
                          <svg
                            className="h-4 w-4 sm:h-5 sm:w-5 shrink-0"
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

          {/* Three separate dropdowns: Level Access, Level Admin, Party Admin */}
          {(hasAnyAssignments || hasAnyAdminPanels) && user && (
            <div className="flex items-center gap-2 ml-2">
              {/* Level Access dropdown (fixed + dynamic types) */}
              {hasAnyAssignments && (
                <div className="relative" ref={levelAccessRef}>
                  <button
                    type="button"
                    onClick={() => {
                      // Open Level Access and close other menus
                      setLevelAccessOpen((s) => !s);
                      setPartyPanelsOpen(false);
                      setLevelAdminPanelsOpen(false);
                      setAssignmentMenuOpen(false);
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 sm:px-3 py-1.5 text-xs sm:text-sm hover:bg-gray-100 transition dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <svg className="h-4 w-4 text-gray-600 dark:text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-xs text-gray-700 dark:text-gray-200">Team Levels</span>
                    <svg
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 transition-transform shrink-0 ${levelAccessOpen ? "rotate-180" : "rotate-0"}`}
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {levelAccessOpen && (
                    <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl border border-gray-200 bg-white p-2 text-sm shadow-xl dark:border-gray-700 dark:bg-gray-800 max-h-80 overflow-y-auto z-50">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Team Levels</div>

                      {/* Fixed Level types (State/District/Assembly) */}
                      {allAssignments.length > 0 && (() => {
                        const FIXED = [
                          { type: 'State', route: '/state' },
                          { type: 'District', route: '/district' },
                          { type: 'Assembly', route: '/assembly' },
                        ];

                        const available = FIXED.filter(f => {
                          const inState = allAssignments.some(a => a.levelType === f.type);
                          const inPermissions = (
                            (f.type === 'District' && permissions?.accessibleDistricts && permissions.accessibleDistricts.length > 0) ||
                            (f.type === 'Assembly' && permissions?.accessibleAssemblies && permissions.accessibleAssemblies.length > 0) ||
                            (f.type === 'State' && allAssignments.some(a => a.levelType === 'State'))
                          );
                          return inState || inPermissions;
                        });

                        return (
                          <div>
                            {available.map(f => {
                              let repr = allAssignments.find(a => a.levelType === f.type);
                              if (!repr) {
                                if (f.type === 'District' && permissions?.accessibleDistricts && permissions.accessibleDistricts.length > 0) {
                                  repr = mapPermissionToAssignment(permissions.accessibleDistricts[0], 'District');
                                } else if (f.type === 'Assembly' && permissions?.accessibleAssemblies && permissions.accessibleAssemblies.length > 0) {
                                  repr = mapPermissionToAssignment(permissions.accessibleAssemblies[0], 'Assembly');
                                }
                              }

                              return (
                                <button
                                  key={`fixed-${f.type}`}
                                  onClick={() => {
                                    if (repr) {
                                      dispatch(setSelectedAssignment(repr));
                                      navigate(f.route);
                                      setLevelAccessOpen(false);
                                    }
                                  }}
                                  className={[
                                    "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors",
                                    selectedAssignment?.levelType === f.type
                                      ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200"
                                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700",
                                  ].join(' ')}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate text-xs sm:text-sm">{f.type}</div>
                                  </div>
                                  {selectedAssignment?.levelType === f.type && (
                                    <svg className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}

                      <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

                      {/* Dynamic types (Block/Mandal/PollingCenter/Booth) */}
                      {(() => {
                        const collect = (source: any[] | undefined, type: string) => {
                          if (!source || source.length === 0) return [] as StateAssignment[];
                          return source.map((item: any) => {
                            if (type === 'Booth') {
                              return {
                                assignment_id: item.booth_assignment_id || item.assignment_id,
                                afterAssemblyData_id: item.booth_assignment_id || item.afterAssemblyData_id,
                                levelName: item.partyLevelName || item.levelName || 'Booth',
                                levelType: item.partyLevelName || item.levelName || 'Booth',
                                displayName: item.partyLevelDisplayName || item.displayName || (`Booth ${item.boothFrom || ''}-${item.boothTo || ''}`),
                                level_id: item.booth_assignment_id || item.level_id,
                                parentId: item.parentLevelId || item.parentId,
                                parentLevelName: item.parentLevelName || 'PollingCenter',
                                parentLevelType: item.parentLevelType || 'PollingCenter',
                              } as StateAssignment;
                            }
                            const isDirectChildOfAssembly = item.parentId == null;
                            return {
                              assignment_id: item.assignment_id,
                              afterAssemblyData_id: item.afterAssemblyData_id,
                              levelName: item.displayName || item.levelName,
                              levelType: item.levelName || type,
                              displayName: item.displayName || item.levelName,
                              level_id: item.level_id,
                              parentId: item.parentId,
                              parentLevelName: isDirectChildOfAssembly ? 'Assembly' : (item.parentLevelName || 'Unknown'),
                              parentLevelType: isDirectChildOfAssembly ? 'Assembly' : (item.parentLevelType || 'Unknown'),
                              assemblyName: item.assemblyName,
                            } as StateAssignment;
                          });
                        };

                        const groups = [
                          { type: 'Block', items: collect(permissions?.accessibleBlocks || [], 'Block') },
                          { type: 'Mandal', items: collect(permissions?.accessibleMandals || [], 'Mandal') },
                          { type: 'PollingCenter', items: collect(permissions?.accessiblePollingCenters || [], 'PollingCenter') },
                          { type: 'Booth', items: collect(permissions?.accessibleBooths || [], 'Booth') },
                        ];

                        return (
                          <div>
                            {groups.map((g) =>
                              g.items.length === 0 ? null : (
                                <button
                                  key={`dyn-${g.type}`}
                                  onClick={() => handleAssignmentSwitch(g.items[0])}
                                  className={[
                                    "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors",
                                    selectedAssignment?.levelType === g.type || selectedAssignment?.levelName === g.type
                                      ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200"
                                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700",
                                  ].join(' ')}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate text-xs sm:text-sm">{g.type}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{g.items.length} Assigned</div>
                                  </div>
                                  {(selectedAssignment?.levelType === g.type || selectedAssignment?.levelName === g.type) && (
                                    <svg className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </button>
                              )
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Level Admin Panels dropdown */}
              {levelAdminPanels && levelAdminPanels.length > 0 && (
                <div className="relative" ref={levelAdminPanelsRef}>
                  <button
                    type="button"
                    onClick={() => {
                      // Open Level Admin and close other menus
                      setLevelAdminPanelsOpen((s) => !s);
                      setPartyPanelsOpen(false);
                      setLevelAccessOpen(false);
                      setAssignmentMenuOpen(false);
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 sm:px-3 py-1.5 text-xs sm:text-sm hover:bg-gray-100 transition dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <svg className="h-4 w-4 text-gray-600 dark:text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-xs text-gray-700 dark:text-gray-200">Role Assign</span>
                    <svg className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 transition-transform shrink-0 ${levelAdminPanelsOpen ? "rotate-180" : "rotate-0"}`} viewBox="0 0 20 20" fill="none">
                      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {levelAdminPanelsOpen && (
                    <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-2 text-sm shadow-xl dark:border-gray-700 dark:bg-gray-800 max-h-80 overflow-y-auto z-50">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Role Assign</div>
                      {levelAdminPanels.map((panel: PanelAssignment) => (
                        <button
                          key={`levelpanel-${panel.id}`}
                          onClick={() => { setLevelAdminPanelsOpen(false); handleAdminPanelNavigate(panel); }}
                          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-xs sm:text-sm">{panel.displayName || panel.name}</div>
                          </div>
                          {currentAdminPanel?.id === panel.id && (
                            <svg className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Party Admin Panels dropdown */}
              {partyAdminPanels && partyAdminPanels.length > 0 && (
                <div className="relative" ref={partyPanelsRef}>
                  <button
                    type="button"
                    onClick={() => {
                      // Open Party Admin and close other menus
                      setPartyPanelsOpen((s) => !s);
                      setLevelAdminPanelsOpen(false);
                      setLevelAccessOpen(false);
                      setAssignmentMenuOpen(false);
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 sm:px-3 py-1.5 text-xs sm:text-sm hover:bg-gray-100 transition dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    <svg className="h-4 w-4 text-gray-600 dark:text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-xs text-gray-700 dark:text-gray-200">National Levels</span>
                    <svg className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 transition-transform shrink-0 ${partyPanelsOpen ? "rotate-180" : "rotate-0"}`} viewBox="0 0 20 20" fill="none">
                      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {partyPanelsOpen && (
                    <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-2 text-sm shadow-xl dark:border-gray-700 dark:bg-gray-800 max-h-80 overflow-y-auto z-50">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">National Levels</div>
                      {partyAdminPanels.map((panel: PanelAssignment) => (
                        <button
                          key={`party-${panel.id}`}
                          onClick={() => { setPartyPanelsOpen(false); handleAdminPanelNavigate(panel); }}
                          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-xs sm:text-sm">{panel.displayName || panel.name}</div>
                            {panel.metadata?.partyCode && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Code: {panel.metadata.partyCode}</div>
                            )}
                          </div>
                          {currentAdminPanel?.id === panel.id && (
                            <svg className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0" ref={menuRef}>
          <ThemeToggle />
          {user && (
            <div className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((s) => !s)}
                className="flex items-center gap-1.5 sm:gap-3 rounded-2xl border border-gray-200 bg-white px-2 sm:px-3 py-1.5 shadow-sm hover:shadow transition text-xs sm:text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <span className="text-gray-700 dark:text-gray-200 hidden sm:inline">
                  Hello, <span className="font-medium">{firstName}</span>
                </span>
                <svg
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 transition-transform ${open ? "rotate-180" : "rotate-0"
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
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="h-7 w-7 sm:h-9 sm:w-9 rounded-full ring-1 ring-gray-200 object-cover"
                />
              </button>
              {open && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 sm:w-64 rounded-2xl border border-gray-200 bg-white p-2 text-sm shadow-xl dark:border-gray-700 dark:bg-gray-800 z-50"
                >
                  {/* Only show profile link if not in admin panels */}
                  {!shouldHideProfile && (
                    <NavLink
                      to={`${getProfileRoute()}`}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-2 sm:gap-3 rounded-xl px-2 sm:px-3 py-2 transition-colors",
                          isActive
                            ? "bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700",
                        ].join(" ")
                      }
                    >
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm-7 9a7 7 0 0 1 14 0"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-xs sm:text-sm">My Profile</span>
                    </NavLink>
                  )}

                  {/* Assignment Switcher in Profile Menu - Mobile Only */}
                  {hasMultipleAssignments && selectedAssignment && (
                    <>
                      <div className="my-2 border-t border-gray-200 dark:border-gray-700 md:hidden" />
                      <div className="px-2 sm:px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide md:hidden">
                        Switch {selectedAssignment?.partyLevelDisplayName || selectedAssignment?.partyLevelName || currentLevelType}
                      </div>
                      <div className="max-h-48 overflow-y-auto md:hidden">
                        {sameTypeAssignments.map((assignment) => (
                          <button
                            key={assignment.assignment_id}
                            onClick={() => {
                              handleAssignmentSwitch(assignment);
                              setOpen(false);
                            }}
                            className={[
                              "flex w-full items-start gap-2 rounded-xl px-2 sm:px-3 py-2 text-left transition-colors",
                              selectedAssignment.assignment_id === assignment.assignment_id
                                ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200"
                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700",
                            ].join(" ")}
                          >
                            <svg className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate text-xs sm:text-sm">{assignment.displayName || assignment.levelName}</div>
                              {assignment.parentLevelName && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {assignment.parentLevelName}
                                </div>
                              )}
                            </div>
                            {selectedAssignment.assignment_id === assignment.assignment_id && (
                              <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="my-2 border-t border-gray-200 dark:border-gray-700 md:hidden" />
                    </>
                  )}

                  <button
                    onClick={() => {
                      setOpen(false);
                      dispatch(logout());
                    }}
                    className="flex w-full items-center gap-2 sm:gap-3 rounded-xl px-2 sm:px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        d="M9 12h10m0 0-3-3m3 3-3 3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-xs sm:text-sm">Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
