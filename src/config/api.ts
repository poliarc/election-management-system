export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://backend.peopleconnect.in',
  ENDPOINTS: {
    LOGIN: '/api/users/login',
    REFRESH: '/api/users/refresh',
  },
  TIMEOUT: 30000,
} as const;

export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}
