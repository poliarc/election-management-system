// Campaign Configuration
export const CAMPAIGN_CONFIG = {
  // Set to true to only use backend API data (no static fallback)
  API_ONLY: true,

  // Set to true to show data source indicators in UI
  SHOW_DATA_SOURCE: true,

  // API endpoints
  API_BASE_URL:
    import.meta.env.VITE_API_URL || "https://backend.peopleconnect.in/api",

  // Debug mode
  DEBUG_MODE: import.meta.env.NODE_ENV === "development",
};
