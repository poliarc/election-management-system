/**
 * DistrictDynamicLayout
 *
 * Wraps DistrictLayout for dynamic district-slug routes.
 * Route: /:districtSlug/*  (e.g. /saharanpur/dashboard, /saharanpur/assembly)
 *
 * Resolves slug from sidebarLevels District display_level_name.
 * If slug matches → renders DistrictLayout (sidebar + outlet).
 * If slug doesn't match → redirects to /district (legacy fallback).
 */

import { Outlet } from "react-router-dom";
import { useState } from "react";
import DistrictSidebar from "../../components/DistrictSidebar";
import { Topbar } from "../../components/Topbar";
import GlobalChat from "../../components/GlobalChat";

/** Convert display name to URL slug: "Saharanpur District" → "saharanpur-district" */
export function toDistrictSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function DistrictDynamicLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col transition-all duration-300 ease-in-out">
      <Topbar onToggleSidebar={() => setSidebarOpen((s) => !s)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-68 shrink-0 h-full overflow-y-auto">
          <DistrictSidebar />
        </div>

        {/* Mobile Sidebar Drawer */}
        <div
          className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 
          ${sidebarOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
            }`}
        >
          <div
            className="absolute inset-0 bg-black/40 transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className={`
              absolute left-0 top-0 bottom-0 w-68 bg-[var(--bg-color)] shadow-lg overflow-y-auto
              transform transition-all duration-300 
              ease-[cubic-bezier(0.22,1,0.36,1)]
              ${sidebarOpen
                ? "translate-x-0 opacity-100"
                : "-translate-x-4 opacity-0"
              }
            `}
          >
            <DistrictSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-1 transition-all duration-300 ease-in-out">
          <Outlet />
        </main>
      </div>

      <GlobalChat />
    </div>
  );
}
