/**
 * StateGeoLevelPage
 *
 * A dynamic wrapper that resolves a URL slug (e.g. "test", "testassembly")
 * to the correct underlying page (Districts or Assembly) by matching the
 * slug against sidebarLevels' display_level_name.
 *
 * This allows the URL to reflect whatever display name is configured,
 * while still rendering the correct component.
 */

import { useParams, Navigate } from "react-router-dom";
import { useMemo } from "react";
import { useAppSelector } from "../../store/hooks";
import { useGetSidebarLevelsQuery } from "../../store/api/partyWiseLevelApi";
import StateDistrictsListing from "./districts";
import StateAssemblyListing from "./assembly";

/** Converts a display name to a URL-safe slug (lowercase, no spaces) */
export function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "");
}

export default function StateGeoLevelPage() {
  const { geoSlug } = useParams<{ geoSlug: string }>();

  const user = useAppSelector((s) => s.auth.user);
  const selectedAssignment = useAppSelector((s) => s.auth.selectedAssignment);

  const partyId = user?.partyId || 0;
  const stateId = selectedAssignment?.stateMasterData_id || 0;

  const { data: sidebarLevels = [] } = useGetSidebarLevelsQuery(
    { partyId, stateId },
    { skip: !partyId || !stateId },
  );

  // Match the slug against display_level_name for District/Assembly levels
  const matched = useMemo(() => {
    if (!geoSlug) return null;
    const slug = geoSlug.toLowerCase();

    return sidebarLevels.find(
      (l) =>
        ["District", "Assembly"].includes(l.level_name) &&
        toSlug(l.display_level_name) === slug,
    );
  }, [geoSlug, sidebarLevels]);

  // While sidebarLevels are loading, try hardcoded fallback
  if (!sidebarLevels.length) {
    // Fallback: legacy hardcoded slugs still work
    if (geoSlug === "districts") return <StateDistrictsListing />;
    if (geoSlug === "assembly") return <StateAssemblyListing />;
    // Show nothing while loading
    return null;
  }

  if (!matched) {
    // Unknown slug — fallback to hardcoded or 404
    if (geoSlug === "districts") return <StateDistrictsListing />;
    if (geoSlug === "assembly") return <StateAssemblyListing />;
    return <Navigate to="/state/dashboard" replace />;
  }

  if (matched.level_name === "District") return <StateDistrictsListing />;
  if (matched.level_name === "Assembly") return <StateAssemblyListing />;

  return <Navigate to="/state/dashboard" replace />;
}
