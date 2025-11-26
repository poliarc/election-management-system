import { AssignedEventsPage } from "../../../modules/initative/AssignedEventsPage";

export default function AssemblyAssignedEvents() {
  // For static implementation, using hardcoded assembly ID
  // In real app, this would come from user context/auth
  const userLevelId = 10; // Assembly ID

  return (
    <AssignedEventsPage userLevelType="ASSEMBLY" userLevelId={userLevelId} />
  );
}
