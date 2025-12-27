import { Navigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

export default function RoleRedirect() {
  const { user, isPartyAdmin, isLevelAdmin, hasStateAssignments, permissions } =
    useAppSelector((s) => s.auth);

  if (!user) return <Navigate to="/login" replace />;

  // SuperAdmin goes directly to dashboard
  if (user.isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // Check for dynamic level assignments (after-assembly levels)
  const hasDynamicLevelAssignments = permissions && (
    (permissions.accessibleBlocks && permissions.accessibleBlocks.length > 0) ||
    (permissions.accessibleMandals && permissions.accessibleMandals.length > 0) ||
    (permissions.accessiblePollingCenters && permissions.accessiblePollingCenters.length > 0) ||
    (permissions.accessibleBooths && permissions.accessibleBooths.length > 0)
  );

  // Users with multiple assignments or any assignments go to panel selection
  // The panel selection page will handle auto-redirect for single assignments
  const hasAnyAssignments = isPartyAdmin || isLevelAdmin || hasStateAssignments || hasDynamicLevelAssignments;

  if (hasAnyAssignments) {
    return <Navigate to="/panels" replace />;
  }

  // Fallback: redirect to profile page if no assignments
  return <Navigate to="/profile" replace />;
}
