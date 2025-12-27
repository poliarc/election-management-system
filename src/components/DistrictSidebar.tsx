import type { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout, setSelectedAssignment } from "../store/authSlice";
import { ROLE_DASHBOARD_PATH } from "../constants/routes";
import type { StateAssignment } from "../types/api";

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
  calendar: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
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
  booth: (
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
};

// Top-level items
const districtItems: NavItem[] = [

  { to: "dashboard", label: "Dashboard", icon: Icons.dashboard },
  { to: "district-team", label: "District Team", icon: Icons.team },
  { to: "assembly", label: "Assembly List", icon: Icons.assembly },
];

// Dropdown items under "List"
const listItems: NavItem[] = [
  { to: "block", label: "Block", icon: Icons.block },
  { to: "mandal", label: "Mandal", icon: Icons.mandal },
  { to: "polling-center", label: "Polling Center", icon: Icons.polling },
  { to: "booth", label: "Booth", icon: Icons.booth },
  // { to: "karyakarta", label: "Karyakarta", icon: Icons.karyakarta },
];

// Other items
const otherItems: NavItem[] = [
  { to: "campaigns", label: "Campaigns", icon: Icons.campaigns },
  //   {
  //     to: "assigned-campaigns",
  //     label: "Assigned Campaigns",
  //     icon: Icons.campaigns,
  //   },
  { to: "initiatives", label: "Assigned Events", icon: Icons.calendar },
];

export default function DistrictSidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { user, stateAssignments, selectedAssignment, permissions } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const base = ROLE_DASHBOARD_PATH["District"] || "/district";
  const firstName = user?.firstName || user?.username || "District";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    firstName
  )}&background=6366f1&color=fff&bold=true`;

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
  const [switchDropdownOpen, setSwitchDropdownOpen] = useState(false);

  // Get all District assignments
  let sameTypeAssignments: StateAssignment[] = [];

  // Get districts from stateAssignments
  const districtAssignments = stateAssignments.filter((a) => a.levelType === 'District');

  // Get districts from permissions
  if (permissions?.accessibleDistricts && permissions.accessibleDistricts.length > 0) {
    const permissionDistricts = permissions.accessibleDistricts.map((district: any) => ({
      assignment_id: district.assignment_id,
      stateMasterData_id: district.stateMasterData_id || 0,
      levelName: district.displayName || district.levelName,
      levelType: 'District',
      level_id: district.level_id,
      parentId: district.parentId,
      parentLevelName: district.parentLevelName || 'State',
      parentLevelType: 'State',
      displayName: district.displayName,
    }));
    sameTypeAssignments = [...districtAssignments, ...permissionDistricts];
  } else {
    sameTypeAssignments = districtAssignments;
  }

  // Remove duplicates by assignment_id
  const seen = new Set<number>();
  sameTypeAssignments = sameTypeAssignments.filter((a) => {
    if (seen.has(a.assignment_id)) return false;
    seen.add(a.assignment_id);
    return true;
  });

  const hasMultipleAssignments = sameTypeAssignments.length > 1;

  const handleAssignmentSwitch = (assignment: StateAssignment) => {
    dispatch(setSelectedAssignment(assignment));
    setSwitchDropdownOpen(false);

    // Dispatch custom event to trigger data refresh
    window.dispatchEvent(new Event('districtChanged'));
    window.dispatchEvent(new Event('assignmentChanged'));

    // Navigate to district dashboard
    navigate('/district/dashboard');
  };

  return (
    <aside className="w-68 shrink-0 h-full border-r border-gray-200 bg-white flex flex-col">
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
              District Level
            </p>
          </div>
        </div>

        {/* Switch Dropdown - Show when user has multiple District assignments */}
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
                  Switch District
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
      <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">
        {districtItems.map((item) => (
          <NavLink
            key={item.to}
            to={`${base}/${item.to}`}
            end={item.to === "dashboard"}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm",
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
              <span className="text-black">List</span>
            </span>
            <svg
              className={[
                "h-4 w-4 text-indigo-600 transition-transform",
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
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                      isActive
                        ? "bg-indigo-50 ring-1 ring-indigo-200"
                        : "border border-transparent hover:border-gray-200",
                    ].join(" ")
                  }
                >
                  <span className="text-indigo-600">{li.icon}</span>
                  <span className="truncate">{li.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Other items */}
        {otherItems.map((item) => (
          <NavLink
            key={item.to}
            to={`${base}/${item.to}`}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm",
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
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
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
