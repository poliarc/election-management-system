import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/authSlice";
import { ROLE_DASHBOARD_PATH } from "../constants/routes";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

type NavItem = { to: string; label: string };

const primaryItems: NavItem[] = [
  { to: "team", label: "Assembly Team" },
  { to: "dashboard", label: "Dashboard" },
  { to: "block/overview", label: "Block" },
  { to: "mandal/overview", label: "Mandal" },
  { to: "polling-center/overview", label: "Polling Center" },
  { to: "booth/overview", label: "Booth" },
  { to: "karyakarta/overview", label: "Karyakarta" },
];

const otherItems: NavItem[] = [
  { to: "campaigns", label: "Campaigns" },
  { to: "assigned-campaigns", label: "Assigned Campaigns" },
  { to: "search-voter", label: "Search Voter" },
];

const boothManagementItems: NavItem[] = [
  { to: "booth-management/dashboard", label: "Dashboard" },
  { to: "booth-management/agents", label: "Booth Agents" },
  { to: "booth-management/inside", label: "Booth Inside Team" },
  { to: "booth-management/outside", label: "Booth Outside Team" },
  { to: "booth-management/polling-support", label: "Polling Center Support Team" },
];

export default function AssemblySidebar() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [openBoothMgmt, setOpenBoothMgmt] = useState(true);

  const base = ROLE_DASHBOARD_PATH["Assembly"] || "/assembly";
  const firstName = (user?.name || "Assembly").split(" ")[0];
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    firstName
  )}&background=6366f1&color=fff&bold=true`;

  const onLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <aside className="w-64 shrink-0 h-full border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col">
      {/* User header */}
      <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <img
            src={avatarUrl}
            alt={firstName}
            className="h-10 w-10 rounded-full ring-2 ring-indigo-500/20"
          />
          <div className="min-w-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">Assembly</p>
            <p className="truncate font-semibold text-gray-900 dark:text-white">{firstName}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {/* Primary items */}
        <div className="space-y-1">
          {primaryItems.map((it) => (
            <NavLink
              key={it.to}
              to={`${base}/${it.to}`}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800",
                ].join(" ")
              }
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 group-hover:bg-indigo-500" />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Booth Management (collapsible) */}
        <div className="mt-4">
          <button
            onClick={() => setOpenBoothMgmt((s) => !s)}
            className="group w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-expanded={openBoothMgmt}
            aria-controls="booth-management-list"
          >
            <span className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 group-hover:bg-indigo-500" />
              <span>Booth Management</span>
            </span>
            <span className="flex items-center">
              {/* Chevron that rotates smoothly based on state and animates on hover */}
              <ChevronDown
                className={`h-4 w-4 text-gray-500 transition-transform duration-200 ease-in-out transform ${
                  openBoothMgmt ? "rotate-180" : "rotate-0"
                } group-hover:-translate-y-0.5`}
              />
            </span>
          </button>

          {openBoothMgmt && (
            <div id="booth-management-list" className="mt-2 ml-4 space-y-1">
              {boothManagementItems.map((bm) => (
                <NavLink
                  key={bm.to}
                  to={`${base}/${bm.to}`}
                  className={({ isActive }) =>
                    [
                      "block rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800",
                    ].join(" ")
                  }
                >
                  {bm.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Other items */}
        <div className="mt-4 space-y-1">
          {otherItems.map((it) => (
            <NavLink
              key={it.to}
              to={`${base}/${it.to}`}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800",
                ].join(" ")
              }
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 group-hover:bg-indigo-500" />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Account section */}
      <div className="mt-auto pt-2 pb-4">
        <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Account</div>
        <div className="px-3 space-y-1">
          <NavLink
            to={`${base}/profile`}
            className={({ isActive }) =>
              [
                "block rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800",
              ].join(" ")
            }
          >
            Profile
          </NavLink>

          <button
            onClick={onLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
