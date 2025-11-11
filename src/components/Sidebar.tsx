import { NavLink } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { ROLE_DASHBOARD_PATH } from "../constants/routes";

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
  const role = useAppSelector((s) => s.auth.user?.role);
  if (!role) return null;
  const items = [...baseItems, ...(roleExtra[role] || [])];
  const root = ROLE_DASHBOARD_PATH[role];

  return (
    <aside className="w-60 border-r bg-gray-50 dark:bg-gray-900 h-full flex flex-col">
      <div className="px-4 py-4 font-semibold">{role} Dashboard</div>
      <nav className="flex-1 space-y-1 px-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={`${root}/${item.to}`}
            className={({ isActive }) =>
              `block rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
                isActive
                  ? "bg-indigo-500 text-white hover:bg-indigo-600"
                  : "text-gray-700 dark:text-gray-200"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
