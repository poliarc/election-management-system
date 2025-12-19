import { useParams } from "react-router-dom";
import { AssignedEventsPage } from "../../modules/initative/AssignedEventsPage";

export default function AfterAssemblyAssignedEvents() {
    const { levelId } = useParams<{ levelId: string }>();

    return (
        <AssignedEventsPage
            userLevelType="AFTER_ASSEMBLY"
            userLevelId={Number(levelId) || 0}
        />
    );
}


