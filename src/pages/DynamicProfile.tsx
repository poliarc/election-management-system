import { useAppSelector } from "../store/hooks";
import { StateProfile } from "./State/profile";
import { DistrictProfile } from "./District/profile/Profile";

export default function DynamicProfile() {
  const levelType = useAppSelector((s) => s.auth.selectedAssignment?.levelType);
  if (levelType === "District") return <DistrictProfile />;
  return <StateProfile />;
}
