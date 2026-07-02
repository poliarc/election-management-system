/**
 * DynamicDashboard
 *
 * Renders the correct dashboard based on the user's current level type.
 * Used as the index/dashboard child route inside /:panelSlug.
 */

import { useAppSelector } from "../store/hooks";
import StateOverview from "./State/Dashboard";
import DistrictDashboard from "./District/Dashboard";

export default function DynamicDashboard() {
  const levelType = useAppSelector((s) => s.auth.selectedAssignment?.levelType);

  if (levelType === "District") return <DistrictDashboard />;
  return <StateOverview />;
}
