import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Topbar } from "../components/Topbar";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="h-screen flex flex-col">
      {/* Topbar with toggle */}
      <Topbar onToggleSidebar={() => setSidebarOpen((s) => !s)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-68 shrink-0 h-full overflow-y-auto">
          <AdminSidebar />
        </div>

        {/* Mobile Sidebar Drawer */}
        <div
          className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300
          ${
            sidebarOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Background Overlay */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Slide Drawer */}
          <div
            className={`
              absolute left-0 top-0 bottom-0 w-68 bg-white shadow-lg overflow-y-auto
              transform transition-all duration-300
              ease-[cubic-bezier(0.22,1,0.36,1)]
              ${
                sidebarOpen
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-4 opacity-0"
              }
            `}
          >
            <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
