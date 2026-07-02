import { useAppSelector } from "../store/hooks";
import StateDynamicLevelPage from "./State/DynamicLevelPage";
import DistrictDynamicLevelPage from "./District/DynamicLevelPage";

export default function DynamicDynamicLevel() {
  const levelType = useAppSelector((s) => s.auth.selectedAssignment?.levelType);
  if (levelType === "District") return <DistrictDynamicLevelPage />;
  return <StateDynamicLevelPage />;
}
