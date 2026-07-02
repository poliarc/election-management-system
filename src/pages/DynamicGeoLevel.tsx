/**
 * DynamicGeoLevel
 *
 * Handles /:panelSlug/:geoSlug — the second-level dynamic slug.
 * For State: resolves District/Assembly display slugs → correct page
 * For District: resolves Assembly display slug → DistrictAssembly page
 */

import { useAppSelector } from "../store/hooks";
import StateGeoLevelPage from "./State/StateGeoLevelPage";
import DistrictGeoLevelPage from "./District/DistrictGeoLevelPage";

export default function DynamicGeoLevel() {
  const levelType = useAppSelector((s) => s.auth.selectedAssignment?.levelType);

  if (levelType === "District") return <DistrictGeoLevelPage />;
  return <StateGeoLevelPage />;
}
