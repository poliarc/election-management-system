import { Navigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

export default function RoleRedirect() {
  const { user, isPartyAdmin, isLevelAdmin, hasStateAssignments } = 
    useAppSelector((s) => s.auth);
  
  if (!user) return <Navigate to="/login" replace />;
  
  // SuperAdmin goes directly to dashboard
  if (user.isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  // Users with multiple assignments or any assignments go to panel selection
  // The panel selection page will handle auto-redirect for single assignments
  const hasAnyAssignments = isPartyAdmin || isLevelAdmin || hasStateAssignments;
  
  if (hasAnyAssignments) {
    return <Navigate to="/panels" replace />;
  }
  
  // Fallback: redirect to login if no assignments
  return <Navigate to="/login" replace />;
}
