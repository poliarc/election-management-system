import { useParams, useLocation } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import UserManagement from "./stateLevel/UserManagement";
import { DistrictUserManagement } from "./districtLevel";
import { AssemblyUserManagement } from "./assemblyLevel";
import { SubLevelManagement, SubLevelUserAssignment } from "./subLevel";
import BoothManagement from "./subLevel/BoothManagement";
import { LevelAdminCreateUser } from "./CreateUser";

export function UserManagementRouter() {
    const { levelId } = useParams<{ levelId: string }>();
    const location = useLocation();
    const { levelAdminPanels } = useAppSelector((state) => state.auth);

    const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

    // Check if we're on the assign-users route for sub-levels
    const isAssignUsersRoute = location.pathname.includes('/assign-users');

    // Check if we're on the manage-booths route
    const isManageBoothsRoute = location.pathname.includes('/manage-booths');

    // Check if we're on the create-user route
    const isCreateUserRoute = location.pathname.includes('/create-user');

    // Show Create User page for all panels
    if (isCreateUserRoute) {
        return <LevelAdminCreateUser />;
    }

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
    // Show BoothManagement for /manage-booths route
    if (isManageBoothsRoute) {
        return <BoothManagement />;
    }

    // Show UserAssignment for /assign-users route, otherwise SubLevelManagement
    if (isAssignUsersRoute) {
        return <SubLevelUserAssignment />;
    }

    return <SubLevelManagement />;
}
