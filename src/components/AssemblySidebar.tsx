import type { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/authSlice";
import { ROLE_DASHBOARD_PATH } from "../constants/routes";

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
};

// Top-level items
const primaryItems: NavItem[] = [
  { to: "team", label: "Assembly Team", icon: Icons.team },
  { to: "dashboard", label: "Dashboard", icon: Icons.dashboard },
  { to: "block/overview", label: "Block", icon: Icons.block },
  { to: "mandal/overview", label: "Mandal", icon: Icons.mandal },
  { to: "polling-center/overview", label: "Polling Center", icon: Icons.polling },
  { to: "booth/overview", label: "Booth", icon: Icons.booths },
  { to: "karyakarta/overview", label: "Karyakarta", icon: Icons.karyakarta },
];

const otherItems: NavItem[] = [
  { to: "campaigns", label: "Campaigns", icon: Icons.campaigns },
  { to: "assigned-campaigns", label: "Assigned Campaigns", icon: Icons.campaigns },
  { to: "search-voter", label: "Search Voter", icon: Icons.search },
];

// Booth Management dropdown items
const boothManagementItems: NavItem[] = [
  { to: "booth-management/dashboard", label: "Dashboard", icon: Icons.dashboard },
  { to: "booth-management/agents", label: "Booth Agents", icon: Icons.team },
  { to: "booth-management/inside", label: "Booth Inside Team", icon: Icons.team },
  { to: "booth-management/outside", label: "Booth Outside Team", icon: Icons.team },
  { to: "booth-management/polling-support", label: "Polling Center Support Team", icon: Icons.team },
];

export default function AssemblySidebar() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const base = ROLE_DASHBOARD_PATH["Assembly"] || "/assembly";
  const firstName = (user?.name || "Assembly").split(" ")[0];
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
      boothManagementItems.some((bm) => location.pathname.startsWith(`${base}/${bm.to}`)),
    [location.pathname, base]
  );
  const [openBoothMgmt, setOpenBoothMgmt] = useState<boolean>(isBoothMgmtPathActive);

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
            <p className="text-xs font-medium tracking-wide text-indigo-600 uppercase">
              Assembly Panel
            </p>
            <p className="truncate font-semibold text-black text-sm">
              {firstName}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-5 space-y-2">
        {/* Primary items */}
        {primaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={`${base}/${item.to}`}
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
                  <span className="text-indigo-600">{bm.icon}</span>
                  <span className="truncate">{bm.label}</span>
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
