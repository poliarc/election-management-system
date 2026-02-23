import type { ReactNode } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout } from "../store/authSlice";

interface PartyAdminSidebarProps {
    partyId: number;
    onNavigate?: () => void;
}

type NavItem = {
    to: string;
    label: string;
    icon: ReactNode;
    children?: { to: string; label: string }[];
};

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
    link: (
        <svg
            className={iconClass}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
        >
            <path
                d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),
    chevronDown: (
        <svg
            className="h-4 w-4 stroke-[1.6]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
        >
            <path
                d="M6 9l6 6 6-6"
                strokeWidth={1.4}
                strokeLinecap="round"
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
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <polyline
                points="14 2 14 8 20 8"
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16 13H8M16 17H8M10 9H8"
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
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedDropdowns, setExpandedDropdowns] = useState<string[]>([]);

    const base = `/partyadmin/${partyId}`;
    const firstName = user?.firstName || user?.username || "Admin";
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        firstName
    )}&background=6366f1&color=fff&bold=true`;

    const onLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    const toggleDropdown = (itemTo: string) => {
        setExpandedDropdowns(prev =>
            prev.includes(itemTo)
                ? prev.filter(item => item !== itemTo)
                : [...prev, itemTo]
        );
    };

    const isDropdownExpanded = (itemTo: string) => expandedDropdowns.includes(itemTo);

    const isChildActive = (children: { to: string; label: string }[]) => {
        return children.some(child => location.pathname.includes(`${base}/${child.to}`));
    };

    const navItems: NavItem[] = [
        { to: "dashboard", label: "Dashboard", icon: Icons.dashboard },
        { to: "levels", label: "Levels", icon: Icons.levels },
        { to: "users", label: "Users", icon: Icons.users },
        { to: "login-report", label: "Login Report", icon: Icons.report },
        {
            to: "registration-links", label: "Manage Links", icon: Icons.link,
        },
        { to: "roles", label: "Roles", icon: Icons.levels },
        {
            to: "other",
            label: "Other",
            icon: (
                <svg
                    className={iconClass}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                >
                    <path
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        strokeWidth={1.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            ),
            children: [
                { to: "export-supporters", label: "Export" },
            ],
        },
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
                            {"National Level"}
                        </p>

                    </div>
                </div>
            </div>

            {/* Nav - Scrollable content */}
            <div>
                <nav className="px-4 py-5 space-y-2">
                    {navItems.map((item) => (
                        <div key={item.to}>
                            {item.children ? (
                                // Dropdown item
                                <div>
                                    <button
                                        onClick={() => toggleDropdown(item.to)}
                                        className={[
                                            "w-full group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm",
                                            "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                                            isChildActive(item.children) || isDropdownExpanded(item.to)
                                                ? "bg-gradient-to-r from-indigo-50 to-white ring-1 ring-indigo-200"
                                                : "border border-transparent hover:border-gray-200",
                                        ].join(" ")}
                                    >
                                        <span className="text-indigo-600 shrink-0">{item.icon}</span>
                                        <span className="truncate flex-1 text-left">{item.label}</span>
                                        <span
                                            className={`text-indigo-600 shrink-0 transition-transform duration-200 ${isDropdownExpanded(item.to) ? 'rotate-180' : ''
                                                }`}
                                        >
                                            {Icons.chevronDown}
                                        </span>
                                        {/* Accent bar */}
                                        <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
                                        {/* Active indicator */}
                                        <span className={`pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 ${isChildActive(item.children) ? 'opacity-100' : 'opacity-0'
                                            }`} />
                                    </button>

                                    {/* Dropdown content */}
                                    <div className={`overflow-hidden transition-all duration-200 ${isDropdownExpanded(item.to) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                        }`}>
                                        <div className="ml-4 mt-1 space-y-1">
                                            {item.children.map((child) => (
                                                child.to === 'export-supporters' ? (
                                                    // Navigate to export page
                                                    <NavLink
                                                        key={child.to}
                                                        to={`${base}/${child.to}`}
                                                        onClick={() => onNavigate?.()}
                                                        className={({ isActive }) =>
                                                            [
                                                                "no-underline group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                                                                "text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                                                                isActive
                                                                    ? "bg-indigo-50 text-indigo-700 border-l-2 border-indigo-500"
                                                                    : "border-l-2 border-transparent hover:border-gray-200",
                                                            ].join(" ")
                                                        }
                                                    >
                                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            <polyline points="7,10 12,15 17,10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                        <span className="truncate">{child.label}</span>
                                                    </NavLink>
                                                ) : (
                                                    // Regular NavLink for other children
                                                    <NavLink
                                                        key={child.to}
                                                        to={`${base}/${child.to}`}
                                                        onClick={() => onNavigate?.()}
                                                        className={({ isActive }) =>
                                                            [
                                                                "no-underline group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                                                                "text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                                                                isActive
                                                                    ? "bg-indigo-50 text-indigo-700 border-l-2 border-indigo-500"
                                                                    : "border-l-2 border-transparent hover:border-gray-200",
                                                            ].join(" ")
                                                        }
                                                    >
                                                        <span className="truncate">{child.label}</span>
                                                    </NavLink>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Regular nav item
                                <NavLink
                                    to={`${base}/${item.to}`}
                                    onClick={() => onNavigate?.()}
                                    className={({ isActive }) =>
                                        [
                                            "no-underline group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm",
                                            "text-black hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                                            isActive
                                                ? "bg-gradient-to-r from-indigo-50 to-white ring-1 ring-indigo-200"
                                                : "border border-transparent hover:border-gray-200",
                                        ].join(" ")
                                    }
                                >
                                    <span className="text-indigo-600 shrink-0">{item.icon}</span>
                                    <span className="truncate">{item.label}</span>
                                    {/* Accent bar */}
                                    <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
                                    {/* Active indicator */}
                                    <span className={`pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 ${location.pathname.includes(`${base}/${item.to}`) ? 'opacity-100' : 'opacity-0'}`} />
                                </NavLink>
                            )}
                        </div>
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
