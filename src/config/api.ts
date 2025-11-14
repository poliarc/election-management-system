export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://backend.peopleconnect.in',
  ENDPOINTS: {
    LOGIN: '/api/users/login',
    REFRESH: '/api/users/refresh',
    PASSWORD_RESET_SEND_OTP: '/api/password-reset/send-otp',
    PASSWORD_RESET_VERIFY_OTP: '/api/password-reset/verify-otp',
    PASSWORD_RESET_RESEND_OTP: '/api/password-reset/resend-otp',
    PASSWORD_RESET_RESET: '/api/password-reset/reset-password',
  },
  TIMEOUT: 30000,
} as const;

export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}
