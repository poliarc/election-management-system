export const ROUTES = {
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  DASHBOARD: "/dashboard",
} as const;

export const ROLE_DASHBOARD_PATH: Record<string, string> = {
  Admin: "/admin",
  State: "/state",
  District: "/district",
  Assembly: "/assembly",
  Block: "/block",
  Mandal: "/mandal",
  PollingCenter: "/polling-center",
  Booth: "/booth",
  Karyakarta: "/karyakarta",
  // Map backend admin labels to nearest UI dashboard when needed
  "State Admin": "/state",
  "District Admin": "/district",
};
