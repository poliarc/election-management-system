import { Outlet } from "react-router-dom";
import DistrictSidebar from "../components/DistrictSidebar";
import { Topbar } from "../components/Topbar";

export default function DistrictLayout() {
  return (
    <div className="h-screen flex flex-col">
      <Topbar />
      <div className="flex flex-1">
        <DistrictSidebar />
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
