import { useParams } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import LevelAdminDashboard from "./stateLevel/Dashboard";
import { DistrictLevelDashboard } from "./districtLevel";
import { AssemblyLevelDashboard } from "./assemblyLevel";
import { AfterAssemblyLevelDashboard } from "./afterAssemblyLevel";

export function LevelAdminDashboardRouter() {
    const { levelId } = useParams<{ levelId: string }>();
    const { levelAdminPanels } = useAppSelector((state) => state.auth);

    const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

    // Determine which dashboard to show based on panel name
    if (currentPanel?.name === "District") {
        return <DistrictLevelDashboard />;
    }

    if (currentPanel?.name === "Assembly") {
        return <AssemblyLevelDashboard />;
    }

    if (currentPanel?.name === "Block") {
        return <AfterAssemblyLevelDashboard />;
    }

    // Default to State level dashboard
    return <LevelAdminDashboard />;
}
