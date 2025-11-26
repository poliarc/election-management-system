import { AssignedEventsPage } from "../../../modules/initative/AssignedEventsPage";

export default function DistrictInitiatives() {
  // For static implementation, using hardcoded district ID
  // In real app, this would come from user context/auth
  const userLevelId = 1; // District ID

  return (
    <AssignedEventsPage userLevelType="DISTRICT" userLevelId={userLevelId} />
  );
}
