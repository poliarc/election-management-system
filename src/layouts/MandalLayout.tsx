import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";

export default function MandalLayout() {
  return (
    <div className="h-screen flex flex-col transition-all duration-300 ease-in-out">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto p-1 transition-all duration-300 ease-in-out">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

