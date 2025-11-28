import { useParams } from "react-router-dom";
import { AssignedEventsPage } from "../../modules/initative/AssignedEventsPage";

export default function SubLevelAssignedEvents() {
    const { levelId } = useParams<{ levelId: string }>();

    return (
        <AssignedEventsPage
            userLevelType="SUB_LEVEL"
            userLevelId={Number(levelId) || 0}
        />
    );
}
