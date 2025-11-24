import { useParams, useLocation } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import UserManagement from "./stateLevel/UserManagement";
import { DistrictUserManagement } from "./districtLevel";
import { AssemblyUserManagement } from "./assemblyLevel";
import { SubLevelManagement, SubLevelUserAssignment } from "./subLevel";

export function UserManagementRouter() {
    const { levelId } = useParams<{ levelId: string }>();
    const location = useLocation();
    const { levelAdminPanels } = useAppSelector((state) => state.auth);

    const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

    // Check if we're on the assign-users route for sub-levels
    const isAssignUsersRoute = location.pathname.includes('/assign-users');

    // Determine which user management to show based on panel name
    if (currentPanel?.name === "State") {
        return <UserManagement />;
    }

    if (currentPanel?.name === "District") {
        return <DistrictUserManagement />;
    }

    if (currentPanel?.name === "Assembly") {
        return <AssemblyUserManagement />;
    }

    // All other levels (Block, Mandal, Polling Center, Booth, etc.)
    // Show UserAssignment for /assign-users route, otherwise SubLevelManagement
    if (isAssignUsersRoute) {
        return <SubLevelUserAssignment />;
    }

    return <SubLevelManagement />;
}
