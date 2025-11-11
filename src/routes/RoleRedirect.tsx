import { Navigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { ROLE_DASHBOARD_PATH } from "../constants/routes";

export default function RoleRedirect() {
  const role = useAppSelector((s) => s.auth.user?.role);
  if (!role) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_DASHBOARD_PATH[role]} replace />;
}
