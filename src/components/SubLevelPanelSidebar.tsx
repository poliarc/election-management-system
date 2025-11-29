import type { ReactNode } from "react";
import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout } from "../store/authSlice";

type NavItem = { to: string; label: string; icon: ReactNode };

const iconClass = "h-5 w-5 stroke-[1.6]";

const Icons = {
    dashboard: (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-18v6h8V3h-8Z" strokeWidth={1.5} strokeLinejoin="round" />
        </svg>
    ),
    team: (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 13c2.761 0 5-2.239 5-5S14.761 3 12 3 7 5.239 7 8s2.239 5 5 5Zm6 1H6a4 4 0 0 0-4 4v3h20v-3a4 4 0 0 0-4-4Z" strokeWidth={1.4} strokeLinejoin="round" />
        </svg>
    ),
    hierarchy: (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 8h18M3 16h18M8 21V3m8 0v18" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    booths: (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M4 7h16v12H4V7Zm4 0V5h8v2" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    chat: (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    search: (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    campaigns: (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 3v6m0 0c-3.314 0-6 2.686-6 6a6 6 0 1 0 12 0c0-3.314-2.686-6-6-6Zm0 0V3m0 6 4.5-4.5M12 9 7.5 4.5" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
};

export default function SubLevelPanelSidebar({ onNavigate }: { onNavigate?: () => void }) {
    const { levelId } = useParams<{ levelId: string }>();
    const { user, selectedAssignment } = useAppSelector((s) => s.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [levelInfo, setLevelInfo] = useState<any>(null);

    useEffect(() => {
        if (selectedAssignment) {
            setLevelInfo(selectedAssignment);
        }
    }, [selectedAssignment]);

    const base = `/sublevel/${levelId}`;
    const firstName = user?.firstName || user?.username || "User";
    const levelName = levelInfo?.partyLevelName || levelInfo?.levelType || "Sub Level";
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=14b8a6&color=fff&bold=true`;

    // Check if current level is Booth type to hide child hierarchy
    const isBooth = levelInfo?.levelType === "Booth" || levelInfo?.partyLevelName === "Booth";

    const navItems: NavItem[] = [
        { to: "dashboard", label: "Dashboard", icon: Icons.dashboard },
        { to: "team", label: "Team", icon: Icons.team },
        // Only show Child Levels if not a Booth
        ...(!isBooth ? [{ to: "child-hierarchy", label: "Child Levels", icon: Icons.hierarchy }] : []),
        { to: "booths", label: "Booths", icon: Icons.booths },
        { to: "assigned-events", label: "Assigned Events", icon: Icons.campaigns },
        // { to: "search-voter", label: "Search Voter", icon: Icons.search },
        // { to: "chat", label: "Chat", icon: Icons.chat },
    ];

    return (
        <aside className="w-68 shrink-0 h-full border-r border-gray-200 bg-white flex flex-col overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
            {/* User header */}
            <div className="px-5 py-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <img
                        src={avatarUrl}
                        alt={firstName}
                        className="h-11 w-11 rounded-full ring-2 ring-teal-500/25 shadow-sm"
                    />
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-black dark:text-white text-sm">
                            {firstName}
                        </p>
                        <p className="text-xs font-medium tracking-wide text-teal-600 dark:text-teal-400 uppercase">
                            {levelName} lavel
                        </p>
                        
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={`${base}/${item.to}`}
                        onClick={() => onNavigate?.()}
                        className={({ isActive }) =>
                            [
                                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm no-underline",
                                "text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400",
                                isActive
                                    ? "bg-gradient-to-r from-teal-50 to-white dark:from-teal-900/30 dark:to-gray-800 ring-1 ring-teal-200 dark:ring-teal-700"
                                    : "border border-transparent hover:border-gray-200 dark:hover:border-gray-600",
                            ].join(" ")
                        }
                    >
                        <span className="text-teal-600 dark:text-teal-400 shrink-0">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                        <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-teal-500/0 group-hover:bg-teal-500/30" />
                        <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-teal-500/70 opacity-0 group-[.active]:opacity-100" />
                    </NavLink>
                ))}
            </nav>

            {/* Account section */}
            <div className="mt-auto pt-3 pb-5 border-t border-gray-200 dark:border-gray-700">
                <div className="px-5 mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Account
                </div>
                <div className="px-4 space-y-2">
                    <NavLink
                        to={`${base}/profile`}
                        onClick={() => onNavigate?.()}
                        className={({ isActive }) =>
                            [
                                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition no-underline",
                                "text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400",
                                isActive
                                    ? "bg-teal-50 dark:bg-teal-900/30 ring-1 ring-teal-200 dark:ring-teal-700"
                                    : "border border-transparent hover:border-gray-200 dark:hover:border-gray-600",
                            ].join(" ")
                        }
                    >
                        <svg
                            className="h-5 w-5 stroke-[1.6] text-teal-600 dark:text-teal-400"
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
                        <span>Profile</span>
                    </NavLink>
                    <button
                        onClick={() => {
                            dispatch(logout());
                            navigate("/login");
                        }}
                        className="group w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 transition border border-transparent hover:border-red-200 dark:hover:border-red-800"
                    >
                        <svg
                            className="h-5 w-5 stroke-[1.6]"
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
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
