import { Outlet, useParams } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import AdminSidebar from "../components/AdminSidebar";

export default function PanelAdminLayout() {
  // panelRole is the role being administered (e.g., district, state)
  const { panelRole } = useParams();
  return (
    <div className="h-screen flex flex-col">
      <Topbar />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-1">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
              Admin Panel: {panelRole}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Dedicated administrative view for the {panelRole} level.
              (Placeholder content.)
            </p>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
