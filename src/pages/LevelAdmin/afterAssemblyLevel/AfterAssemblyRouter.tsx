import { useLocation } from "react-router-dom";
import LevelDataManagement from "./LevelDataManagement";
import UserAssignment from "./UserAssignment";

export function AfterAssemblyRouter() {
    const location = useLocation();

    // Check if we're on the users route
    if (location.pathname.includes('/users')) {
        return <UserAssignment />;
    }

    // Default to level data management
    return <LevelDataManagement />;
}
