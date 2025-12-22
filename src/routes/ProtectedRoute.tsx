import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { ROUTES } from "../constants/routes";
import { validateCurrentToken } from "../utils/tokenValidator";

export default function ProtectedRoute() {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const location = useLocation();

  // Check if token exists and is valid
  if (!accessToken || !validateCurrentToken()) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
