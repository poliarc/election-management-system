import type { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout, setSelectedAssignment } from "../store/authSlice";
import { ROLE_DASHBOARD_PATH } from "../constants/routes";
import type { StateAssignment } from "../types/api";
import { navigationVisibilityManager } from "../services/navigationVisibilityManager";
import type { NavigationVisibility, HierarchyDataStatus } from "../types/dynamicNavigation";
import { useRealTimeUpdates } from "../hooks/useRealTimeUpdates";
import { RealTimeStatusIndicator } from "./RealTimeMonitoringStatus";

type NavItem = { to: string; label: string; icon: ReactNode };

const iconClass = "h-5 w-5 stroke-[1.6]";

const Icons = {
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
  block: (
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
  mandal: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 3 3 9l9 6 9-6-9-6Zm0 6v12"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  polling: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M7 12h3v8H7v-8Zm7-8h3v16h-3V4Z"
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
  karyakarta: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 8H6v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2Z"
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
  profile: (
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
  logout: (
    <svg
      className={iconClass}
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
  ),
  report: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

// Static items that are always visible
const staticItems: NavItem[] = [
  { to: "dashboard", label: "Dashboard", icon: Icons.dashboard },
  { to: "team", label: "Assembly Team", icon: Icons.team },
];

// Dynamic items that depend on data availability
const dynamicItemsConfig = [
  { to: "block", label: "Block", icon: Icons.block, requiredData: 'blocks' as const },
  { to: "mandal", label: "Mandal", icon: Icons.mandal, requiredData: 'mandals' as const },
  { to: "polling-center", label: "Polling Center", icon: Icons.polling, requiredData: 'pollingCenters' as const },
  { to: "booth", label: "Booth", icon: Icons.booths, requiredData: 'booths' as const },
];

// Items that come after dynamic items
const postDynamicItems: NavItem[] = [
  { to: "karyakarta", label: "Karyakarta", icon: Icons.karyakarta },
];

const otherItemsBefore: NavItem[] = [
  { to: "campaigns", label: "Campaigns", icon: Icons.campaigns },
  // {
  //   to: "assigned-campaigns",
  //   label: "Assigned Campaigns",
  //   icon: Icons.campaigns,
  // },
  { to: "assigned-events", label: "Assigned Events", icon: Icons.campaigns },
  { to: "search-voter", label: "Search Voter", icon: Icons.search },
];

const otherItemsAfter: NavItem[] = [];

// Booth Management dropdown items
const boothManagementItems: NavItem[] = [
  {
    to: "booth-management/dashboard",
    label: "Dashboard",
    icon: Icons.dashboard,
  },
  { to: "booth-management/agents", label: "Booth Agents", icon: Icons.team },
  {
    to: "booth-management/inside",
    label: "Booth Inside Team",
    icon: Icons.team,
  },
  {
    to: "booth-management/outside",
    label: "Booth Outside Team",
    icon: Icons.team,
  },
  {
    to: "booth-management/polling-support",
    label: "Polling Center Support Team",
    icon: Icons.team,
  },
];

// Voter Reports dropdown items
const voterReportsItems: NavItem[] = [
  {
    to: "voter-report/alphabetical",
    label: "Alphabetical List",
    icon: Icons.report,
  },
  { to: "voter-report/age-wise", label: "Age Wise List", icon: Icons.report },
  { to: "voter-report/family", label: "Family Report", icon: Icons.report },
  {
    to: "voter-report/family-head",
    label: "Family Head Report",
    icon: Icons.report,
  },
  {
    to: "voter-report/double-name",
    label: "Double Name Lists",
    icon: Icons.report,
  },
  {
    to: "voter-report/married-women",
    label: "Married Women Report",
    icon: Icons.report,
  },
  {
    to: "voter-report/single-voter",
    label: "Single Voter Report",
    icon: Icons.report,
  },
  {
    to: "voter-report/address-wise",
    label: "Address Wise List",
    icon: Icons.report,
  },
  { to: "voter-report/surname", label: "Surname Report", icon: Icons.report },
  {
    to: "voter-report/family-labels",
    label: "Family Labels",
    icon: Icons.report,
  },
  {
    to: "voter-report/caste-wise",
    label: "Caste Wise List",
    icon: Icons.report,
  },
  // { to: "voter-report/area-wise", label: "Area Wise List", icon: Icons.report },
  {
    to: "voter-report/party-wise",
    label: "Party Wise List",
    icon: Icons.report,
  },
  {
    to: "voter-report/dead-alive",
    label: "Dead/Alive List",
    icon: Icons.report,
  },
  {
    to: "voter-report/birth-wise",
    label: "Birth Wise List",
    icon: Icons.report,
  },
  {
    to: "voter-report/education-wise",
    label: "Education Wise List",
    icon: Icons.report,
  },
  {
    to: "voter-report/home-shifted",
    label: "Home Shifted List",
    icon: Icons.report,
  },
  {
    to: "voter-report/profession-wise",
    label: "Profession Wise List",
    icon: Icons.report,
  },
  {
    to: "voter-report/outside-location",
    label: "Outside Location Wise List",
    icon: Icons.report,
  },
  { to: "voter-report/labharthi", label: "Labharthi List", icon: Icons.report },
  { to: "voter-report/approach", label: "Approach List", icon: Icons.report },
  { to: "voter-report/ssr-form", label: "SSR Form Report", icon: Icons.report },
  // { to: "voter-report/survey", label: "Voter Survey List", icon: Icons.report },
];

export default function AssemblySidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { user, stateAssignments, selectedAssignment, permissions } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamic navigation state - start with all items visible for better UX
  const [navigationVisibility, setNavigationVisibility] = useState<NavigationVisibility>({
    showBlocks: true,
    showMandals: true,
    showPollingCenters: true,
    showBooths: true
  });
  const [isLoadingNavigation, setIsLoadingNavigation] = useState(false);
  const isMountedRef = useRef(true);

  // Set mounted ref to false on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const base = ROLE_DASHBOARD_PATH["Assembly"] || "/assembly";
  const firstName = user?.firstName || user?.username || "Assembly";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    firstName
  )}&background=6366f1&color=fff&bold=true`;

  const onLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Determine if any booth management item is active to default-open the dropdown
  const isBoothMgmtPathActive = useMemo(
    () =>
      boothManagementItems.some((bm) =>
        location.pathname.startsWith(`${base}/${bm.to}`)
      ),
    [location.pathname, base]
  );
  const [openBoothMgmt, setOpenBoothMgmt] = useState<boolean>(
    isBoothMgmtPathActive
  );

  // Determine if any voter report item is active to default-open the dropdown
  const isVoterReportPathActive = useMemo(
    () =>
      voterReportsItems.some((vr) =>
        location.pathname.startsWith(`${base}/${vr.to}`)
      ),
    [location.pathname, base]
  );
  const [openVoterReports, setOpenVoterReports] = useState<boolean>(
    isVoterReportPathActive
  );
  const [switchDropdownOpen, setSwitchDropdownOpen] = useState(false);

  // Get all Assembly assignments (memoized to prevent infinite re-renders)
  const sameTypeAssignments = useMemo(() => {
    // Get assemblies from stateAssignments
    const assemblyAssignments = stateAssignments.filter((a) => a.levelType === 'Assembly');

    let assignments: StateAssignment[] = [];

    // Get assemblies from permissions
    if (permissions?.accessibleAssemblies && permissions.accessibleAssemblies.length > 0) {
      const permissionAssemblies = permissions.accessibleAssemblies.map((assembly: any) => ({
        assignment_id: assembly.assignment_id,
        stateMasterData_id: assembly.stateMasterData_id || 0,
        levelName: assembly.displayName || assembly.levelName,
        levelType: 'Assembly',
        level_id: assembly.level_id,
        parentId: assembly.parentId,
        parentLevelName: assembly.parentLevelName || 'District',
        parentLevelType: 'District',
        displayName: assembly.displayName,
      }));
      assignments = [...assemblyAssignments, ...permissionAssemblies];
    } else {
      assignments = assemblyAssignments;
    }

    // Remove duplicates by assignment_id
    const seen = new Set<number>();
    return assignments.filter((a) => {
      if (seen.has(a.assignment_id)) return false;
      seen.add(a.assignment_id);
      return true;
    });
  }, [stateAssignments, permissions?.accessibleAssemblies]);

  const hasMultipleAssignments = sameTypeAssignments.length > 1;

  const handleAssignmentSwitch = (assignment: StateAssignment) => {
    dispatch(setSelectedAssignment(assignment));
    setSwitchDropdownOpen(false);

    // Dispatch custom event to trigger data refresh
    window.dispatchEvent(new Event('assignmentChanged'));

    // Refresh navigation visibility for new assembly
    if (assignment.stateMasterData_id) {
      checkNavigationVisibility(assignment.stateMasterData_id);
    }

    // Navigate to assembly dashboard
    navigate('/assembly/dashboard');
  };

  // Check navigation visibility for current assembly (memoized to prevent re-renders)
  const checkNavigationVisibility = useCallback(async (assemblyId: number) => {
    if (!isMountedRef.current) return { showBlocks: false, showMandals: false, showPollingCenters: false, showBooths: false };
    
    try {
      const visibility = await navigationVisibilityManager.checkDataAvailability(assemblyId);
      return visibility;
    } catch (error) {
      console.error('AssemblySidebar: Error checking navigation visibility:', error);
      return { showBlocks: false, showMandals: false, showPollingCenters: false, showBooths: false };
    }
  }, []);

  // Memoize assembly IDs to prevent unnecessary re-renders
  const assemblyIds = useMemo(() => {
    return sameTypeAssignments.map(a => a.stateMasterData_id).filter(id => id > 0);
  }, [sameTypeAssignments]);

  // Real-time updates for navigation data
  const { forceRefresh } = useRealTimeUpdates({
    assemblyIds,
    onDataChange: (data: HierarchyDataStatus) => {
      if (isMountedRef.current && data.assemblyId === selectedAssignment?.stateMasterData_id) {

        // The navigation visibility manager will handle the update
      }
    },
    autoStart: true,
    refreshOnMount: false
  });

  // Initialize navigation visibility manager and check data availability
  useEffect(() => {
    // Only start loading if we have a valid assembly
    if (selectedAssignment?.stateMasterData_id && assemblyIds.length > 0) {

      setIsLoadingNavigation(true);
      
      navigationVisibilityManager.initialize(assemblyIds);

      // Subscribe to navigation visibility changes with error handling
      const unsubscribe = navigationVisibilityManager.subscribeToVisibilityChanges(
        (visibility) => {
          try {
            if (isMountedRef.current) {

              // Only update if we have actual data, otherwise keep showing all items
              const hasAnyData = Object.values(visibility).some(v => v === true);
              if (hasAnyData) {
                setNavigationVisibility(visibility);
              } else {
                // Keep all items visible if no data detected
                setNavigationVisibility({
                  showBlocks: true,
                  showMandals: true,
                  showPollingCenters: true,
                  showBooths: true
                });
              }
              setIsLoadingNavigation(false);
            }
          } catch (error) {
            console.error('AssemblySidebar: Error updating navigation visibility state:', error);
            // Even on error, stop loading and show all items
            if (isMountedRef.current) {
              setNavigationVisibility({
                showBlocks: true,
                showMandals: true,
                showPollingCenters: true,
                showBooths: true
              });
              setIsLoadingNavigation(false);
            }
          }
        }
      );

      // Check initial visibility with immediate loading stop
      const checkInitialVisibility = async () => {
        try {

          const visibility = await checkNavigationVisibility(selectedAssignment.stateMasterData_id);
          if (isMountedRef.current) {

            // Only update if we have actual data, otherwise keep showing all items
            const hasAnyData = Object.values(visibility).some(v => v === true);
            if (hasAnyData) {
              setNavigationVisibility(visibility);
            } else {
              // Keep all items visible if no data detected

            }
            setIsLoadingNavigation(false);
          }
        } catch (error) {
          console.error('AssemblySidebar: Error checking initial visibility:', error);
          if (isMountedRef.current) {
            // Keep fallback visibility and stop loading

            setIsLoadingNavigation(false);
          }
        }
      };

      checkInitialVisibility();

      // Shorter fallback timeout to ensure loading state is always cleared
      const fallbackTimeout = setTimeout(() => {
        if (isMountedRef.current) {

          setIsLoadingNavigation(false);
        }
      }, 500); // Reduced to 0.5 seconds

      // Listen for assignment changes to refresh data
      const handleAssignmentChange = () => {
        if (selectedAssignment?.stateMasterData_id) {

          setIsLoadingNavigation(true);
          navigationVisibilityManager.refreshAssemblyData(selectedAssignment.stateMasterData_id);
          // Also force refresh real-time data
          forceRefresh();
        }
      };

      window.addEventListener('assignmentChanged', handleAssignmentChange);

      // Cleanup on unmount
      return () => {
        isMountedRef.current = false;
        clearTimeout(fallbackTimeout);
        unsubscribe();
        window.removeEventListener('assignmentChanged', handleAssignmentChange);
      };
    } else {
      // If no assembly selected or no assembly IDs, don't show loading

      setIsLoadingNavigation(false);
      // Keep navigation items visible even without assembly for better UX
      setNavigationVisibility({
        showBlocks: true,
        showMandals: true,
        showPollingCenters: true,
        showBooths: true
      });
    }
  }, [selectedAssignment?.stateMasterData_id, assemblyIds.length, checkNavigationVisibility, forceRefresh]); // Added missing dependencies

  // Get dynamic navigation items based on visibility
  const getDynamicNavigationItems = useMemo(() => {
    // Always show items if we have an assembly selected
    if (!selectedAssignment?.stateMasterData_id) {
      return [];
    }

    const items = dynamicItemsConfig.filter(item => {
      switch (item.requiredData) {
        case 'blocks':
          return navigationVisibility.showBlocks;
        case 'mandals':
          return navigationVisibility.showMandals;
        case 'pollingCenters':
          return navigationVisibility.showPollingCenters;
        case 'booths':
          return navigationVisibility.showBooths;
        default:
          return false;
      }
    }).map(item => ({
      to: item.to,
      label: item.label,
      icon: item.icon
    }));
    

    
    return items;
  }, [navigationVisibility, selectedAssignment?.stateMasterData_id, isLoadingNavigation]);



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
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="truncate font-semibold text-black text-sm">
                  {firstName}
                </p>
                <p className="text-xs font-medium tracking-wide text-indigo-600 uppercase">
                  Assembly Level
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Switch Dropdown - Show when user has multiple Assembly assignments */}
        {hasMultipleAssignments && selectedAssignment && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setSwitchDropdownOpen(!switchDropdownOpen)}
              className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg className="h-4 w-4 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-medium text-gray-700 truncate">
                  {selectedAssignment.displayName || selectedAssignment.levelName}
                </span>
              </div>
              <svg
                className={`h-4 w-4 text-gray-500 transition-transform shrink-0 ${switchDropdownOpen ? "rotate-180" : "rotate-0"}`}
                viewBox="0 0 20 20"
                fill="none"
              >
                <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {switchDropdownOpen && (
              <div className="mt-2 rounded-lg border border-gray-200 bg-white p-2 text-sm shadow-lg max-h-64 overflow-y-auto">
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Switch Assembly
                </div>
                {sameTypeAssignments.map((assignment) => (
                  <button
                    key={assignment.assignment_id}
                    onClick={() => handleAssignmentSwitch(assignment)}
                    className={[
                      "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                      selectedAssignment.assignment_id === assignment.assignment_id
                        ? "bg-indigo-50 text-indigo-900"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                    ].join(" ")}
                  >
                    <svg className="h-4 w-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
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
                    {selectedAssignment.assignment_id === assignment.assignment_id && (
                      <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
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

      {/* Nav */}
      <nav className="flex-1 px-4 py-5 space-y-2">


        {/* Loading state for navigation - only show briefly */}
        {isLoadingNavigation && getDynamicNavigationItems.length === 0 && selectedAssignment?.stateMasterData_id && (
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-xs text-gray-600">Loading navigation...</span>
          </div>
        )}

        {/* Static Navigation items - Always visible */}
        {staticItems.map((item) => (
          <NavLink
            key={item.to}
            to={`${base}/${item.to}`}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm no-underline",
                "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                isActive
                  ? "bg-linear-to-r from-indigo-50 to-white ring-1 ring-indigo-200"
                  : "border border-transparent hover:border-gray-200",
              ].join(" ")
            }
          >
            <span className="text-indigo-600 shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
            {/** Accent bar */}
            <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
            {/** Active indicator */}
            <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
          </NavLink>
        ))}

        {/* Dynamic Navigation items - Show when available */}
        {getDynamicNavigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={`${base}/${item.to}`}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm no-underline",
                "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                isActive
                  ? "bg-linear-to-r from-indigo-50 to-white ring-1 ring-indigo-200"
                  : "border border-transparent hover:border-gray-200",
              ].join(" ")
            }
          >
            <span className="text-indigo-600 shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
            {/** Accent bar */}
            <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
            {/** Active indicator */}
            <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
          </NavLink>
        ))}

        {/* Post-dynamic Navigation items - Always visible */}
        {postDynamicItems.map((item) => (
          <NavLink
            key={item.to}
            to={`${base}/${item.to}`}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm no-underline",
                "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                isActive
                  ? "bg-linear-to-r from-indigo-50 to-white ring-1 ring-indigo-200"
                  : "border border-transparent hover:border-gray-200",
              ].join(" ")
            }
          >
            <span className="text-indigo-600 shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
            {/** Accent bar */}
            <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
            {/** Active indicator */}
            <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
          </NavLink>
        ))}



        {/* No data message - only show when no assembly selected */}
        {!isLoadingNavigation && getDynamicNavigationItems.length === 0 && !selectedAssignment?.stateMasterData_id && (
          <div className="px-3.5 py-2.5 text-xs text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>No assembly selected</span>
            </div>
          </div>
        )}

        {/* Booth Management dropdown */}
        <div>
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={openBoothMgmt}
            onClick={() => setOpenBoothMgmt((v) => !v)}
            className={[
              "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
              "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              openBoothMgmt
                ? "bg-gray-50 ring-1 ring-indigo-200"
                : "border border-transparent hover:border-gray-200",
            ].join(" ")}
          >
            <span className="flex items-center gap-3 text-indigo-600">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-black">Booth Management</span>
            </span>
            <svg
              className={[
                "h-4 w-4 text-indigo-600 transition-transform",
                openBoothMgmt ? "rotate-180" : "rotate-0",
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
          {openBoothMgmt && (
            <div className="mt-2 ml-2 pl-2 border-l border-gray-200 space-y-1">
              {boothManagementItems.map((bm) => (
                <NavLink
                  key={bm.to}
                  to={`${base}/${bm.to}`}
                  onClick={() => onNavigate?.()}
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
                  <span className="text-indigo-600">{bm.icon}</span>
                  <span className="truncate">{bm.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Other items after Booth Management - Always visible */}
        {otherItemsBefore.map((item) => (
          <NavLink
            key={item.to}
            to={`${base}/${item.to}`}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm no-underline",
                "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                isActive
                  ? "bg-linear-to-r from-indigo-50 to-white ring-1 ring-indigo-200"
                  : "border border-transparent hover:border-gray-200",
              ].join(" ")
            }
          >
            <span className="text-indigo-600 shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
            {/** Accent bar */}
            <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
            {/** Active indicator */}
            <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
          </NavLink>
        ))}

        {/* Voter Reports dropdown */}
        <div>
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={openVoterReports}
            onClick={() => setOpenVoterReports((v) => !v)}
            className={[
              "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
              "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              openVoterReports
                ? "bg-gray-50 ring-1 ring-indigo-200"
                : "border border-transparent hover:border-gray-200",
            ].join(" ")}
          >
            <span className="flex items-center gap-3 text-indigo-600">
              {Icons.report}
              <span className="text-black">Voter Reports</span>
            </span>
            <svg
              className={[
                "h-4 w-4 text-indigo-600 transition-transform",
                openVoterReports ? "rotate-180" : "rotate-0",
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
          {openVoterReports && (
            <div className="mt-2 ml-2 pl-2 border-l border-gray-200 space-y-1 max-h-96 overflow-y-auto">
              {voterReportsItems.map((vr) => (
                <NavLink
                  key={vr.to}
                  to={`${base}/${vr.to}`}
                  onClick={() => onNavigate?.()}
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
                  <span className="text-indigo-600">{vr.icon}</span>
                  <span className="truncate">{vr.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Other items after Voter Reports */}
        {otherItemsAfter.map((item) => (
          <NavLink
            key={item.to}
            to={`${base}/${item.to}`}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm no-underline",
                "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                isActive
                  ? "bg-linear-to-r from-indigo-50 to-white ring-1 ring-indigo-200"
                  : "border border-transparent hover:border-gray-200",
              ].join(" ")
            }
          >
            <span className="text-indigo-600 shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
            {/** Accent bar */}
            <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
            {/** Active indicator */}
            <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
          </NavLink>
        ))}
      </nav>

      {/* Account section */}
      <div className="mt-auto pt-3 pb-5">
        <div className="px-5 mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Account
        </div>
        <div className="px-4 space-y-2">
          <NavLink
            to={`${base}/profile`}
            onClick={() => onNavigate?.()}
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
            <span className="text-indigo-600">{Icons.profile}</span>
            <span>Profile</span>
          </NavLink>
          <button
            onClick={onLogout}
            className="group w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 transition"
          >
            <span>{Icons.logout}</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
