/**
 * DynamicPanelRouter
 *
 * Single entry point for /:panelSlug/* routes.
 * Determines if the slug belongs to State or District
 * by matching against sidebarLevels display names.
 */

import { useParams, Navigate } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import { useAppSelector } from "../store/hooks";
import { useGetSidebarLevelsQuery } from "../store/api/partyWiseLevelApi";
import { toStateSlug } from "./State/StateDynamicLayout";
import { toDistrictSlug } from "./District/DistrictDynamicLayout";
import StateDynamicLayout from "./State/StateDynamicLayout";
import DistrictDynamicLayout from "./District/DistrictDynamicLayout";

export default function DynamicPanelRouter() {
  const { panelSlug } = useParams<{ panelSlug: string }>();
  const [timedOut, setTimedOut] = useState(false);

  const user = useAppSelector((s) => s.auth.user);
  const selectedAssignment = useAppSelector((s) => s.auth.selectedAssignment);
  const stateAssignments = useAppSelector((s) => s.auth.stateAssignments);

  const partyId = user?.partyId || 0;

  // Resolve correct stateId for the sidebarLevels API call:
  // - State user: stateMasterData_id IS the state id
  // - District user: parentId is the state id (stateMasterData_id is district id)
  // Try multiple sources in priority order
  const stateId = useMemo(() => {
    const levelType = selectedAssignment?.levelType;

    if (levelType === "State") {
      return selectedAssignment?.stateMasterData_id || 0;
    }

    if (levelType === "District") {
      // parentId is the state id for district assignments
      if (selectedAssignment?.parentId) return selectedAssignment.parentId;
      // Fallback: find a State assignment in stateAssignments
      const stateAssign = stateAssignments.find((a) => a.levelType === "State");
      if (stateAssign) return stateAssign.stateMasterData_id;
      // Last fallback: user.state_id
      return user?.state_id || 0;
    }

    // Generic fallback
    return (
      selectedAssignment?.stateMasterData_id ||
      selectedAssignment?.parentId ||
      user?.state_id ||
      0
    );
  }, [selectedAssignment, stateAssignments, user]);

  const { data: sidebarLevels = [], isLoading, isError } = useGetSidebarLevelsQuery(
    { partyId, stateId },
    { skip: !partyId || !stateId },
  );

  // Safety timeout — if still loading after 5s, stop waiting and use fallback
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(t);
  }, [isLoading]);

  const match = useMemo(() => {
    if (!panelSlug || !sidebarLevels.length) return null;

    const stateLevel = sidebarLevels.find((l) => l.level_name === "State");
    if (stateLevel && toStateSlug(stateLevel.display_level_name) === panelSlug) {
      return "state" as const;
    }

    const districtLevel = sidebarLevels.find((l) => l.level_name === "District");
    if (districtLevel && toDistrictSlug(districtLevel.display_level_name) === panelSlug) {
      return "district" as const;
    }

    return "nomatch" as const;
  }, [panelSlug, sidebarLevels]);

  // Show spinner only while genuinely loading and not timed out
  if (isLoading && !timedOut && sidebarLevels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-color)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Render correct layout based on match
  if (match === "state") return <StateDynamicLayout />;
  if (match === "district") return <DistrictDynamicLayout />;

  // No match or error/timeout — fallback based on user's level type
  if (isError || timedOut || match === "nomatch") {
    const levelType = selectedAssignment?.levelType;
    if (levelType === "District") return <Navigate to="/district/dashboard" replace />;
    if (levelType === "State") return <Navigate to="/state/dashboard" replace />;
  }

  // Still resolving (sidebarLevels empty but not loading = skip condition hit)
  // Use level type to decide which layout to render directly
  const levelType = selectedAssignment?.levelType;
  if (levelType === "District") return <DistrictDynamicLayout />;
  if (levelType === "State") return <StateDynamicLayout />;

  return <Navigate to="/state/dashboard" replace />;
}
