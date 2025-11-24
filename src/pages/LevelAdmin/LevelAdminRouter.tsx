import { useParams } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import LevelAdminDashboard from "./stateLevel/Dashboard";
import { DistrictLevelDashboard } from "./districtLevel";
import { AssemblyLevelDashboard } from "./assemblyLevel";
import { SubLevelDashboard } from "./subLevel";

export function LevelAdminDashboardRouter() {
    const { levelId } = useParams<{ levelId: string }>();
    const { levelAdminPanels } = useAppSelector((state) => state.auth);

    const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

    // Determine which dashboard to show based on panel name
    if (currentPanel?.name === "State") {
        return <LevelAdminDashboard />;
    }

    if (currentPanel?.name === "District") {
        return <DistrictLevelDashboard />;
    }

    if (currentPanel?.name === "Assembly") {
        return <AssemblyLevelDashboard />;
    }

    // All other levels (Block, Mandal, Polling Center, Booth, etc.) use SubLevel
    return <SubLevelDashboard />;
}
