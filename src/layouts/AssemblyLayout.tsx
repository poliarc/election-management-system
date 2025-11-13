import { Outlet } from "react-router-dom";
import AssemblySidebar from "../components/AssemblySidebar";
import { Topbar } from "../components/Topbar";

export default function AssemblyLayout() {
  return (
    <div className="h-screen flex flex-col">
      <Topbar />
      <div className="flex flex-1">
  <AssemblySidebar />
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
