import { Outlet } from "react-router-dom";
import { useState } from "react";
import { useAppSelector } from "../store/hooks";
import { Topbar } from "../components/Topbar";
import SubLevelPanelSidebar from "../components/SubLevelPanelSidebar";
import GlobalChat from "../components/GlobalChat";

export default function SubLevelPanelLayout() {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const selectedAssignment = useAppSelector((s) => s.auth.selectedAssignment);

    return (
        <div className="h-screen flex flex-col">
            <Topbar onToggleSidebar={() => setSidebarOpen((s) => !s)} />

            <div className="flex flex-1 overflow-hidden">
                {/* Desktop sidebar */}
                <div className="hidden lg:block w-68 shrink-0 h-full overflow-y-auto">
                    <SubLevelPanelSidebar key={selectedAssignment?.assignment_id} />
                </div>

                {/* Mobile Sidebar Drawer */}
                <div
                    className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300
                    ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                >
                    {/* Fade Overlay */}
                    <div
                        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
                        onClick={() => setSidebarOpen(false)}
                    />

                    {/* Slide + Fade Sidebar */}
                    <div
                        className={`
                            absolute left-0 top-0 bottom-0 w-68 bg-white dark:bg-gray-800 shadow-lg overflow-y-auto
                            transform transition-all duration-300 
                            ease-[cubic-bezier(0.22,_1,_0.36,_1)]
                            ${sidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"}
                        `}
                    >
                        <SubLevelPanelSidebar key={selectedAssignment?.assignment_id} onNavigate={() => setSidebarOpen(false)} />
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
                    <Outlet />
                </main>
            </div>
            <GlobalChat />
        </div>
    );
}
