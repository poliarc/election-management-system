import { Outlet } from "react-router-dom";
import StateSidebar from "../components/StateSidebar";
import { Topbar } from "../components/Topbar";

export default function StateLayout() {
  return (
    <div className="h-screen flex flex-col">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-68 shrink-0 h-full overflow-y-auto">
          <StateSidebar />
        </div>
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
