import { NavLink } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useState, useEffect } from "react";

interface LevelAdminSidebarProps {
    onNavigate?: () => void;
}

export default function LevelAdminSidebar({ onNavigate }: LevelAdminSidebarProps) {
    const { levelAdminPanels } = useAppSelector((state) => state.auth);
    const [selectedPanel, setSelectedPanel] = useState<any>(null);

    useEffect(() => {
        // Get selected panel from URL or use first panel
        const path = window.location.pathname;
        const match = path.match(/\/leveladmin\/(\d+)/);
        if (match) {
            const panelId = parseInt(match[1]);
            const panel = levelAdminPanels.find((p) => p.id === panelId);
            setSelectedPanel(panel || levelAdminPanels[0]);
        } else {
            setSelectedPanel(levelAdminPanels[0]);
        }
    }, [levelAdminPanels]);

    if (!selectedPanel) return null;

    const baseUrl = `/leveladmin/${selectedPanel.id}`;

    const navItems = [
        {
            to: `${baseUrl}/dashboard`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            label: "Dashboard",
        },
        // Add "Manage Levels" for Block level panels
        ...(selectedPanel.name === "Block" ? [{
            to: `${baseUrl}/levels`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            ),
            label: "Manage Levels",
        }] : []),
        {
            to: `${baseUrl}/users`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            label: selectedPanel.name === "Block" ? "Assign Users" : "User Management",
        },
    ];

    return (
        <aside className="bg-white border-r border-gray-200 h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">{selectedPanel.displayName}</h2>
                <p className="text-sm text-gray-600 mt-1">
                    {selectedPanel.metadata?.stateName || "Level Admin"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    {selectedPanel.metadata?.partyName || ""}
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                ? "bg-blue-50 text-blue-700 font-semibold shadow-sm"
                                : "text-gray-700 hover:bg-gray-100"
                            }`
                        }
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 text-center">
                    Level Admin Panel
                </div>
            </div>
        </aside>
    );
}
