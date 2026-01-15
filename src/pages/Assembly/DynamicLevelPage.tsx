import { useParams } from "react-router-dom";
import { useGetSidebarLevelsQuery } from "../../store/api/partyWiseLevelApi";
import AssemblyDynamicLevelList from "../../components/AssemblyDynamicLevelList";

export default function DynamicLevelPage() {
    const { levelName } = useParams<{ levelName: string }>();

    // Get party and state info from localStorage
    const getPartyAndStateFromStorage = () => {
        try {
            const authState = localStorage.getItem('auth_state');
            if (authState) {
                const parsed = JSON.parse(authState);
                const partyId = parsed?.user?.partyId || 0;
                const stateId = parsed?.user?.state_id || parsed?.selectedAssignment?.stateMasterData_id || 0;
                return { partyId, stateId };
            }
        } catch (error) {
            console.error('Error reading from localStorage:', error);
        }
        return { partyId: 0, stateId: 0 };
    };

    const { partyId, stateId } = getPartyAndStateFromStorage();

    // Fetch dynamic sidebar levels from API
    const { data: sidebarLevels = [], isLoading, error } = useGetSidebarLevelsQuery(
        { partyId, stateId },
        { skip: !partyId || !stateId }
    );

    // Find the level configuration
    const levelConfig = sidebarLevels.find(
        (level) => level.level_name.toLowerCase() === levelName?.toLowerCase()
    );

    if (!levelName) {
        return (
            <div className="p-6">
                <div className="text-center text-red-600">
                    <p>Level name is missing</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="text-center text-gray-600">
                    <p>Loading level configuration...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="text-center text-red-600">
                    <p>Error loading level configuration. Please try again.</p>
                </div>
            </div>
        );
    }

    if (!levelConfig) {
        return (
            <div className="p-6">
                <div className="text-center text-gray-600">
                    <p>Level configuration not found for "{levelName}"</p>
                </div>
            </div>
        );
    }

    return (
        <AssemblyDynamicLevelList
            levelName={levelConfig.level_name}
            displayLevelName={levelConfig.display_level_name}
            parentLevelName={levelConfig.parent_level_name}
        />
    );
}
