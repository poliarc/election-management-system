import { Outlet } from "react-router-dom";
import LevelAdminSidebar from "../components/LevelAdminSidebar";
import { Topbar } from "../components/Topbar";
import { useState } from "react";

export default function LevelAdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

    return (
        <div className="h-screen flex flex-col">
            <Topbar onToggleSidebar={() => setSidebarOpen((s) => !s)} />

            <div className="flex flex-1 overflow-hidden">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block w-68 shrink-0 h-full overflow-y-auto">
                    <LevelAdminSidebar />
                </div>

                {/* Mobile Sidebar Drawer */}
                <div
                    className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 
          ${sidebarOpen
                            ? "opacity-100 pointer-events-auto"
                            : "opacity-0 pointer-events-none"
                        }`}
                >
                    {/* Fade Overlay */}
                    <div
                        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
                        onClick={() => setSidebarOpen(false)}
                    />

                    {/* Slide + Fade Sidebar */}
                    <div
                        className={`
              absolute left-0 top-0 bottom-0 w-68 bg-white shadow-lg overflow-y-auto
              transform transition-all duration-300 
              ease-[cubic-bezier(0.22,1,0.36,1)]
              ${sidebarOpen
                                ? "translate-x-0 opacity-100"
                                : "-translate-x-4 opacity-0"
                            }
            `}
                    >
                        <LevelAdminSidebar onNavigate={() => setSidebarOpen(false)} />
                    </div>
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-4">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
