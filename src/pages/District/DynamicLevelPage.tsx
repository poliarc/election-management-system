import { useParams } from "react-router-dom";
import { useGetSidebarLevelsQuery } from "../../store/api/partyWiseLevelApi";
import { useAppSelector } from "../../store/hooks";
import DistrictDynamicLevelList from "../../components/DistrictDynamicLevelList";

export default function DistrictDynamicLevelPage() {
    const { levelName } = useParams<{ levelName: string }>();
    const user = useAppSelector((s) => s.auth.user);
    const selectedAssignment = useAppSelector((s) => s.auth.selectedAssignment);

    // Get party and state info for API call
    const partyId = user?.partyId || 0;
    // For District panel, we need the state ID from the district's parent (which is the state)
    const stateId = selectedAssignment?.parentId || user?.state_id || 0;

    // Fetch dynamic sidebar levels from API
    const { data: sidebarLevels = [] } = useGetSidebarLevelsQuery(
        { partyId, stateId },
        { skip: !partyId || !stateId }
    );

    // Find the level info from API response
    const levelInfo = sidebarLevels.find(
        level => level.level_name.toLowerCase() === levelName?.toLowerCase()
    );

    if (!levelName) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-1">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-900">Invalid Level</h2>
                        <p className="text-gray-600 mt-2">Level name is required</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!levelInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-1">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-900">Level Not Found</h2>
                        <p className="text-gray-600 mt-2">
                            The level "{levelName}" is not available in your current context
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <DistrictDynamicLevelList
            levelName={levelInfo.level_name}
            displayLevelName={levelInfo.display_level_name}
        />
    );
}