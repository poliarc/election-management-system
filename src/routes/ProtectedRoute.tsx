import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { ROUTES } from "../constants/routes";

export default function ProtectedRoute() {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }
  return <Outlet />;
}
