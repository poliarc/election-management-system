import { Outlet } from "react-router-dom";
import AssemblySidebar from "../components/AssemblySidebar";
import { Topbar } from "../components/Topbar";

export default function AssemblyLayout() {
  return (
    <div className="h-screen flex flex-col">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-68 shrink-0 h-full overflow-y-auto"><AssemblySidebar /></div>
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
