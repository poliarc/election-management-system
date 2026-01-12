import { useParams } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { useGetSidebarLevelsQuery } from "../../store/api/partyWiseLevelApi";
import DynamicLevelList from "../../components/DynamicLevelList";

export default function DynamicLevelPage() {
    const { levelName } = useParams<{ levelName: string }>();
    const user = useAppSelector((s) => s.auth.user);
    const selectedAssignment = useAppSelector((s) => s.auth.selectedAssignment);

    // Get party and state info for API call
    const partyId = user?.partyId || 0;
    const stateId = selectedAssignment?.stateMasterData_id || 0;

    // Fetch dynamic sidebar levels from API
    const { data: sidebarLevels = [], isLoading } = useGetSidebarLevelsQuery(
        { partyId, stateId },
        { skip: !partyId || !stateId }
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 p-1">
                <div className="flex items-center justify-center h-64">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (!levelName) {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 p-1">
                <div className="text-center py-12">
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Level not specified
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Please select a valid level from the sidebar.
                    </p>
                </div>
            </div>
        );
    }

    // Find the level configuration from API response
    const levelConfig = sidebarLevels.find(
        level => level.level_name.toLowerCase() === levelName.toLowerCase()
    );

    if (!levelConfig) {
        return (
            <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 p-1">
                <div className="text-center py-12">
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Level not found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        The requested level "{levelName}" is not configured for this party and state.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <DynamicLevelList
            levelName={levelConfig.level_name}
            displayLevelName={levelConfig.display_level_name}
        />
    );
}