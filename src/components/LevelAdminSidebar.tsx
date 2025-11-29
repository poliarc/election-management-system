import { NavLink, useLocation } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useState, useEffect } from "react";

interface LevelAdminSidebarProps {
    onNavigate?: () => void;
}

export default function LevelAdminSidebar({ onNavigate }: LevelAdminSidebarProps) {
    const { levelAdminPanels } = useAppSelector((state) => state.auth);
    const [selectedPanel, setSelectedPanel] = useState<any>(null);

    const location = useLocation();

    useEffect(() => {
        // Update selected panel when panels list or URL changes
        const path = location.pathname;
        const match = path.match(/\/leveladmin\/(\d+)/);
        if (match) {
            const panelId = parseInt(match[1]);
            const panel = levelAdminPanels.find((p) => p.id === panelId);
            setSelectedPanel(panel || levelAdminPanels[0]);
        } else {
            setSelectedPanel(levelAdminPanels[0]);
        }
    }, [levelAdminPanels, location.pathname]);

    if (!selectedPanel) return null;

    const baseUrl = `/leveladmin/${selectedPanel.id}`;

    // Check if this is a Booth level panel
    const isBoothLevel = selectedPanel.name?.toLowerCase() === "booth";

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
        {
            to: `${baseUrl}/chat`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            label: "Chat",
        },

        {
            to: `${baseUrl}/users`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            label: (selectedPanel.name !== "State" && selectedPanel.name !== "District" && selectedPanel.name !== "Assembly") ? "Manage Levels" : "User Management",
        },
        // Add "Manage Booths" for Booth level panels
        ...(isBoothLevel ? [{
            to: `${baseUrl}/manage-booths`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            label: "Manage Booths",
        }] : []),
        // Add "Assign Users" for sub-level panels
        ...(selectedPanel.name !== "State" && selectedPanel.name !== "District" && selectedPanel.name !== "Assembly" ? [{
            to: `${baseUrl}/assign-users`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
            ),
            label: "Assign Users",
        }] : []),
        // Add "Create User" for all level admin panels
        {
            to: `${baseUrl}/create-user`,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
            ),
            label: "Create User",
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
