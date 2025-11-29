import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/authSlice";

interface PartyAdminSidebarProps {
    partyId: number;
    onNavigate?: () => void;
}

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
    levels: (
        <svg
            className={iconClass}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
        >
            <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),
    users: (
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

export const PartyAdminSidebar: React.FC<PartyAdminSidebarProps> = ({
    partyId,
    onNavigate,
}) => {
    const user = useAppSelector((s) => s.auth.user);
    const { partyAdminPanels } = useAppSelector((s) => s.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const currentParty = partyAdminPanels?.find((panel) => panel.id === partyId);
    const base = `/partyadmin/${partyId}`;
    const firstName = user?.firstName || user?.username || "Admin";
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        firstName
    )}&background=6366f1&color=fff&bold=true`;

    const onLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    const navItems: NavItem[] = [
        { to: "dashboard", label: "Dashboard", icon: Icons.dashboard },
        { to: "levels", label: "Levels", icon: Icons.levels },
        { to: "users", label: "Users", icon: Icons.users },
        { to: "roles", label: "Roles", icon: Icons.levels },
    ];

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
                            { "National Lavel"}
                        </p>
                        
                    </div>
                </div>
            </div>

            {/* Nav - Scrollable content */}
            <div>
                <nav className="px-4 py-5 space-y-2">
                    {navItems.map((item) => (
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
                            {/* Accent bar */}
                            <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
                            {/* Active indicator */}
                            <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Account section - Immediately after nav */}
            <div className="pt-2 pb-5">
                <div className="px-5">
                    <div className="mb-3">
                        <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                            Account
                        </div>
                    </div>
                </div>
                <div className="px-4 space-y-1">
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
};
