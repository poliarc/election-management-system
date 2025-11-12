import { Navigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { ROLE_DASHBOARD_PATH } from "../constants/routes";

export default function RoleRedirect() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const user = useAppSelector((s) => s.auth.user);
  if (!role) return <Navigate to="/login" replace />;
  // Admin goes straight to Admin Panel
  if (role === "Admin")
    return <Navigate to={ROLE_DASHBOARD_PATH[role]} replace />;
  // Non-admins: if they have any panel assignments, send to panel selection
  const hasPanels =
    (user?.adminPanels?.length || 0) + (user?.userPanels?.length || 0) > 0;
  if (hasPanels) return <Navigate to="/panels" replace />;
  // Fallback: direct to their role dashboard
  return <Navigate to={ROLE_DASHBOARD_PATH[role]} replace />;
}
