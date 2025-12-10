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
    <aside className="w-64 shrink-0 h-full border-r border-gray-200 bg-white text-gray-800 flex flex-col">
      {/* User header */}
      <div className="px-4 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src={avatarUrl}
            alt={firstName}
            className="h-10 w-10 rounded-full ring-2 ring-indigo-500/20"
          />
          <div className="min-w-0">
            <p className="text-sm text-gray-500">
              {role} Dashboard
            </p>
            <p className="truncate font-semibold text-gray-900">
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
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
              ].join(" ")
            }
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 group-hover:bg-indigo-500 group-[.active]:bg-indigo-600" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Account section */}
      <div className="mt-auto pt-2 pb-4">
        <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Account
        </div>
        <div className="px-3 space-y-1">
          <NavLink
            to={`${root}/profile`}
            className={({ isActive }) =>
              [
                "block rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
              ].join(" ")
            }
          >
            Profile
          </NavLink>

          <button
            onClick={onLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
