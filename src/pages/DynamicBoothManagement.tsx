import { useAppSelector } from "../store/hooks";
import StateBoothManagementDashboard from "./State/booth-management/BoothManagementDashboard";
import DistrictBoothManagementDashboard from "./District/booth-management/BoothManagementDashboard";

export default function DynamicBoothManagement() {
  const levelType = useAppSelector((s) => s.auth.selectedAssignment?.levelType);
  if (levelType === "District") return <DistrictBoothManagementDashboard />;
  return <StateBoothManagementDashboard />;
}
