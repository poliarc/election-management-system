import { AssignedEventsPage } from "../../../modules/initative/AssignedEventsPage";

export default function BlockAssignedEvents() {
  // For static implementation, using hardcoded block ID
  // In real app, this would come from user context/auth
  const userLevelId = 50; // Block ID

  return <AssignedEventsPage userLevelType="BLOCK" userLevelId={userLevelId} />;
}
