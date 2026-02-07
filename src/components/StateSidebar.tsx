import type { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/authSlice";
import { ROLE_DASHBOARD_PATH } from "../constants/routes";
import { useGetSidebarLevelsQuery } from "../store/api/partyWiseLevelApi";
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
  district: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 7v-7h7v7h-7Z"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  ),
  assembly: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M3 21h18M4 18h16l-1-9H5l-1 9Zm3 0v-9m4 9v-9m4 9v-9m4 9v-9M8 6l4-3 4 3"
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
  vic: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M4 4h16v4H4V4Zm2 4v12m12-12v12M8 16h8"
        strokeWidth={1.4}
        strokeLinecap="round"
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
  // karyakarta: (
  //   <svg
  //     className={iconClass}
  //     viewBox="0 0 24 24"
  //     fill="none"
  //     stroke="currentColor"
  //   >
  //     <path
  //       d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 8H6v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2Z"
  //       strokeWidth={1.4}
  //       strokeLinecap="round"
  //       strokeLinejoin="round"
  //     />
  //   </svg>
  // ),
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
  supporters: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d="m22 21-3-3m0 0a2 2 0 1 1-2.83-2.83 2 2 0 0 1 2.83 2.83Z" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
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
};

// Top-level items (excluding team - will be dynamic)
const stateItems: NavItem[] = [
  { to: "dashboard", label: "Dashboard", icon: Icons.dashboard },
  { to: "districts", label: "District", icon: Icons.district },
  { to: "assembly", label: "Assembly", icon: Icons.assembly },
  { to: "supporters", label: "Supporters", icon: Icons.supporters },
  // { to: "vic", label: "VIC", icon: Icons.vic },
];

// Dropdown items - These will be replaced by dynamic levels from API
const staticListItems: NavItem[] = [
  { to: "block", label: "Block", icon: Icons.block },
  { to: "mandal", label: "Mandal", icon: Icons.mandal },
  { to: "polling-center", label: "Polling Center", icon: Icons.polling },
  { to: "booth", label: "Booth", icon: Icons.booths },
  // { to: "karyakarta", label: "Karyakarta", icon: Icons.karyakarta },
];

export default function StateSidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const user = useAppSelector((s) => s.auth.user);
  const selectedAssignment = useAppSelector((s) => s.auth.selectedAssignment);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const base = ROLE_DASHBOARD_PATH["State"] || "/state";
  const firstName = user?.firstName || user?.username || "State";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    firstName
  )}&background=6366f1&color=fff&bold=true`;

  // Get party and state info for API call
  const partyId = user?.partyId || 0;
  const stateId = selectedAssignment?.stateMasterData_id || 0;
  const partyLevelId = selectedAssignment?.partyLevelId || 0;

  // Fetch dynamic sidebar levels from API
  const { data: sidebarLevels = [] } = useGetSidebarLevelsQuery(
    { partyId, stateId },
    { skip: !partyId || !stateId }
  );

  // Fetch dynamic sidebar modules from API
  const { data: sidebarModules = [] } = useGetSidebarModulesQuery(
    {
      state_id: stateId,
      party_id: partyId,
      party_level_id: partyLevelId
    },
    { skip: !partyId || !stateId || !partyLevelId }
  );

  // Check if State Team module is accessible
  const hasStateTeamAccess = useMemo(() => {
    return sidebarModules.some(module => 
      module.moduleName.toLowerCase().includes('state team') ||
      module.moduleName.toLowerCase().includes('team')
    );
  }, [sidebarModules]);

  // Create dynamic list items from API response
  const dynamicListItems: NavItem[] = useMemo(() => {
    if (!sidebarLevels.length) return staticListItems;

    // Filter levels that come after Assembly
    const afterAssemblyLevels = sidebarLevels.filter(level =>
      !["State", "District", "Assembly"].includes(level.level_name)
    );

    return afterAssemblyLevels.map(level => ({
      to: `dynamic-level/${level.level_name.toLowerCase()}`,
      label: level.display_level_name,
      icon: getIconForLevel(level.level_name),
    }));
  }, [sidebarLevels]);

  // Use dynamic levels if available, otherwise fall back to static
  const listItems = dynamicListItems.length > 0 ? dynamicListItems : staticListItems;

  // Helper function to get appropriate icon for level
  function getIconForLevel(levelName: string): ReactNode {
    const lowerLevelName = levelName.toLowerCase();

    if (lowerLevelName.includes('block')) return Icons.block;
    if (lowerLevelName.includes('mandal')) return Icons.mandal;
    if (lowerLevelName.includes('polling') || lowerLevelName.includes('center')) return Icons.polling;
    if (lowerLevelName.includes('booth')) return Icons.booths;
    if (lowerLevelName.includes('ward')) return Icons.district; // Use district icon for ward

    // Default icon for unknown levels
    return Icons.mandal;
  }

  // Helper function to get appropriate icon for module
  function getIconForModule(moduleName: string): ReactNode {
    const lowerModuleName = moduleName.toLowerCase();

    if (lowerModuleName.includes('campaign')) return Icons.campaigns;
    if (lowerModuleName.includes('user')) return Icons.team;
    if (lowerModuleName.includes('district')) return Icons.district;
    if (lowerModuleName.includes('assembly')) return Icons.assembly;
    if (lowerModuleName.includes('block')) return Icons.block;
    if (lowerModuleName.includes('mandal')) return Icons.mandal;
    if (lowerModuleName.includes('polling') || lowerModuleName.includes('center')) return Icons.polling;
    if (lowerModuleName.includes('booth')) return Icons.booths;
    if (lowerModuleName.includes('vic')) return Icons.vic;

    // Default icon for unknown modules
    return Icons.campaigns;
  }

  // Helper function to get appropriate route for module
  function getModuleRoute(moduleName: string): string {
    const lowerModuleName = moduleName.toLowerCase();

    // Map specific module names to their correct routes
    if (lowerModuleName.includes('campaign')) return 'campaigns';
    if (lowerModuleName.includes('assigned event') || lowerModuleName.includes('event')) return 'initiatives';
    if (lowerModuleName.includes('user management') || lowerModuleName.includes('user')) return 'users';

    // Default: convert module name to kebab-case
    return moduleName.toLowerCase().replace(/\s+/g, '-');
  }

  const onLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Determine if any list item is active to default-open the dropdown
  const isListPathActive = useMemo(
    () =>
      listItems.some((li) => location.pathname.startsWith(`${base}/${li.to}`)),
    [location.pathname, base]
  );
  const [listOpen, setListOpen] = useState<boolean>(isListPathActive);

  return (
    <aside className="w-68 shrink-0 h-full border-r border-gray-200 bg-white flex flex-col overflow-y-auto">
      {/* User header */}
      <div className="px-5 py-6 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl}
            alt={firstName}
            className="h-11 w-11 rounded-full ring-2 ring-indigo-500/25 shadow-sm shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-black text-sm">
              {firstName}
            </p>
            <p className="text-xs font-medium tracking-wide text-indigo-600 uppercase">
              State Level
            </p>

          </div>
        </div>
      </div>

      {/* Nav - Scrollable content */}
      <div className="flex-1">
        <nav className="px-4 py-5 space-y-2">
          {stateItems.map((item) => (
            <NavLink
              key={item.to}
              to={`${base}/${item.to}`}
              onClick={() => onNavigate?.()}
              className={({ isActive }) =>
                [
                  "no-underline group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm",
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

          {/* State Team - Dynamic based on module access */}
          {hasStateTeamAccess && (
            <NavLink
              to={`${base}/team`}
              onClick={() => onNavigate?.()}
              className={({ isActive }) =>
                [
                  "no-underline group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm",
                  "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                  isActive
                    ? "bg-linear-to-r from-indigo-50 to-white ring-1 ring-indigo-200"
                    : "border border-transparent hover:border-gray-200",
                ].join(" ")
              }
            >
              <span className="text-indigo-600 shrink-0">{Icons.team}</span>
              <span className="truncate">State Team</span>
              {/** Accent bar */}
              <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
              {/** Active indicator */}
              <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
            </NavLink>
          )}

          {/* List dropdown */}
          <div>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={listOpen}
              onClick={() => setListOpen((v) => !v)}
              className={[
                "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                listOpen
                  ? "bg-gray-50 ring-1 ring-indigo-200"
                  : "border border-transparent hover:border-gray-200",
              ].join(" ")}
            >
              <span className="flex items-center gap-3 text-indigo-600">
                <svg
                  className="h-5 w-5 shrink-0"
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
                <span className="text-black truncate">List</span>
              </span>
              <svg
                className={[
                  "h-4 w-4 text-indigo-600 transition-transform shrink-0",
                  listOpen ? "rotate-180" : "rotate-0",
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
            {listOpen && (
              <div className="mt-2 ml-2 pl-2 border-l border-gray-200 space-y-1">
                {listItems.map((li) => (
                  <NavLink
                    key={li.to}
                    to={`${base}/${li.to}`}
                    onClick={() => onNavigate?.()}
                    className={({ isActive }) =>
                      [
                        "no-underline group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                        "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                        isActive
                          ? "bg-indigo-50 ring-1 ring-indigo-200"
                          : "border border-transparent hover:border-gray-200",
                      ].join(" ")
                    }
                  >
                    <span className="text-indigo-600 shrink-0">{li.icon}</span>
                    <span className="truncate">{li.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Modules */}
          {sidebarModules
            .filter(module => !module.moduleName.toLowerCase().includes('team')) // Filter out Team modules as they're handled separately
            .map((module) => (
            <div key={module.module_id} className="mt-2">
              <NavLink
                to={`${base}/${getModuleRoute(module.moduleName)}`}
                onClick={() => onNavigate?.()}
                className={({ isActive }) =>
                  [
                    "no-underline group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm",
                    "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                    isActive
                      ? "bg-linear-to-r from-indigo-50 to-white ring-1 ring-indigo-200"
                      : "border border-transparent hover:border-gray-200",
                  ].join(" ")
                }
              >
                <span className="text-indigo-600 shrink-0">{getIconForModule(module.moduleName)}</span>
                <span className="truncate">{module.displayName}</span>
                <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
                <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
              </NavLink>
            </div>
          ))}
        </nav>
      </div>

      {/* Account section - Fixed at bottom */}
      <div className="mt-auto pt-3 pb-5">
        <div className="px-5">
          <div className="mb-3">
            <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Account
            </div>
          </div>
        </div>
        <div className="px-4 space-y-1">
          <NavLink
            to={`${base}/profile`}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "no-underline group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                isActive
                  ? "bg-gray-50 ring-1 ring-indigo-200"
                  : "border border-transparent hover:border-gray-200",
              ].join(" ")
            }
          >
            <span className="text-indigo-600 shrink-0">{Icons.profile}</span>
            <span className="truncate">Profile</span>
          </NavLink>
          <button
            onClick={onLogout}
            className="group w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 transition border border-transparent hover:border-red-200"
          >
            <span className="shrink-0">{Icons.logout}</span>
            <span className="truncate">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
