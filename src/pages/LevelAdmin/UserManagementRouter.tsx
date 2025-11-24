import { useParams } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import UserManagement from "./stateLevel/UserManagement";
import { DistrictUserManagement } from "./districtLevel";
import { AssemblyUserManagement } from "./assemblyLevel";

export function UserManagementRouter() {
    const { levelId } = useParams<{ levelId: string }>();
    const { levelAdminPanels } = useAppSelector((state) => state.auth);

    const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

    // Determine which user management to show based on panel name
    if (currentPanel?.name === "District") {
        return <DistrictUserManagement />;
    }

    if (currentPanel?.name === "Assembly") {
        return <AssemblyUserManagement />;
    }

    // Default to State level user management
    return <UserManagement />;
}
