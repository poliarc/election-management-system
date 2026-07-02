/**
 * DistrictGeoLevelPage
 *
 * Handles dynamic Assembly slug under /:panelSlug/:assemblySlug
 * e.g. /testdist/yrteerter → renders DistrictAssembly page
 *
 * Matches the slug against Assembly display_level_name.
 * Falls back to /district/assembly if no match.
 */

import { useParams, Navigate } from "react-router-dom";
import { useMemo } from "react";
import { useAppSelector } from "../../store/hooks";
import { useGetSidebarLevelsQuery } from "../../store/api/partyWiseLevelApi";
import DistrictAssembly from "./assembly/Assembly";

export default function DistrictGeoLevelPage() {
  const { geoSlug } = useParams<{ geoSlug: string }>();

  const user = useAppSelector((s) => s.auth.user);
  const selectedAssignment = useAppSelector((s) => s.auth.selectedAssignment);

  const partyId = user?.partyId || 0;
  const stateId =
    selectedAssignment?.parentId || user?.state_id || 0;

  const { data: sidebarLevels = [], isLoading } = useGetSidebarLevelsQuery(
    { partyId, stateId },
    { skip: !partyId || !stateId },
  );

  const matched = useMemo(() => {
    if (!geoSlug || !sidebarLevels.length) return null;
    const slug = geoSlug.toLowerCase().replace(/\s+/g, "");

    return sidebarLevels.find(
      (l) =>
        l.level_name === "Assembly" &&
        l.display_level_name.toLowerCase().replace(/\s+/g, "") === slug,
    );
  }, [geoSlug, sidebarLevels]);

  if (isLoading && !sidebarLevels.length) return null;

  // Legacy fallback
  if (!sidebarLevels.length) {
    if (geoSlug === "assembly") return <DistrictAssembly />;
    return <Navigate to="/district/assembly" replace />;
  }

  if (matched) return <DistrictAssembly />;

  // Unknown slug
  if (geoSlug === "assembly") return <DistrictAssembly />;
  return <Navigate to="/district/assembly" replace />;
}
