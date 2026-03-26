import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { ROLE_DASHBOARD_PATH } from "../constants/routes";
import { logout } from "../store/authSlice";

interface NavItem {
  to: string;
  label: string;
}

const baseItems: NavItem[] = [{ to: "overview", label: "Overview" }];

const roleExtra: Record<string, NavItem[]> = {
  Admin: [
    { to: "users", label: "Users" },
    { to: "settings", label: "Settings" },
  ],
  State: [{ to: "reports", label: "State Reports" }],
  District: [{ to: "reports", label: "District Reports" }],
  Assembly: [{ to: "reports", label: "Assembly Data" }],
  Block: [{ to: "reports", label: "Block Data" }],
  Mandal: [{ to: "reports", label: "Mandal Data" }],
  PollingCenter: [{ to: "reports", label: "Polling Center Data" }],
  Booth: [{ to: "reports", label: "Booth Metrics" }],
  Karyakarta: [{ to: "tasks", label: "My Tasks" }],
};

export function Sidebar() {
  const user = useAppSelector((s) => s.auth.user);
  const role = user?.role;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  if (!role) return null;

  const items = [...baseItems, ...(roleExtra[role] || [])];
  const root = ROLE_DASHBOARD_PATH[role];
  const firstName = user?.firstName || user?.username || role;
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    firstName
  )}&background=6366f1&color=fff&bold=true`;

  const onLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <aside className="w-64 shrink-0 h-full border-r border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-color)] flex flex-col transition-all duration-300 ease-in-out [will-change:background-color,color]">
      {/* User header */}
      <div className="px-4 py-5 border-b border-[var(--border-color)] transition-colors duration-300 ease-in-out">
        <div className="flex items-center gap-3">
          <img
            src={avatarUrl}
            alt={firstName}
            className="h-10 w-10 rounded-full ring-2 ring-indigo-500/20"
          />
          <div className="min-w-0">
            <p className="text-sm text-[var(--text-secondary)] transition-colors duration-300 ease-in-out">
              {role} Dashboard
            </p>
            <p className="truncate font-semibold text-[var(--text-color)] transition-colors duration-300 ease-in-out">
              {firstName}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={`${root}/${item.to}`}
            className={({ isActive }) =>
              [
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-300 ease-in-out",
                isActive
                  ? "bg-[var(--text-color)]/5 text-[var(--text-color)] dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-[var(--text-color)] hover:bg-[var(--text-color)]/5",
              ].join(" ")
            }
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)] group-hover:bg-[var(--text-color)] group-[.active]:bg-blue-500 transition-colors duration-300 ease-in-out" />
            <span className="group-hover:text-[var(--text-color)]">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Account section */}
      <div className="mt-auto pt-2 pb-4">
        <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition-colors duration-300 ease-in-out">
          Account
        </div>
        <div className="px-3 space-y-1">
          <NavLink
            to={`${root}/profile`}
            className={({ isActive }) =>
              [
                "group block rounded-lg px-3 py-2 text-sm transition-colors duration-300 ease-in-out",
                isActive
                  ? "bg-[var(--text-color)]/5 text-[var(--text-color)] dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 hover:text-[var(--text-color)]",
              ].join(" ")
            }
          >
            <span className="group-hover:text-[var(--text-color)]">Profile</span>
          </NavLink>

          <button
            onClick={onLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-[var(--text-color)]/5 transition-colors duration-300 ease-in-out"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

