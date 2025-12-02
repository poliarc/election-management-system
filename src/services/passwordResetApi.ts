import { API_CONFIG, getApiUrl } from "../config/api";

export interface SendOtpRequest {
  identifier: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  data?: {
    maskedIdentifier?: string;
  };
}

export interface VerifyOtpRequest {
  identifier: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data?: {
    verified?: boolean;
    resetToken?: string;
  };
}

export interface ResendOtpRequest {
  identifier: string;
}

export interface ResendOtpResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  identifier: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
  resetToken?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// Transform identifier to API format (phone_number for phone-based reset)
function transformIdentifierToApiFormat(
  identifier: string
): Record<string, string> {
  // For phone-based password reset, always use phone_number field
  return { phone_number: identifier };
}

async function apiRequest<T>(
  endpoint: string,
  body: Record<string, any>
): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(getApiUrl(endpoint), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      // Handle error response structure: { success: false, error: { message: "..." } }
      const errorMessage =
        data.error?.message || data.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }
      throw error;
    }
    throw new Error("An unexpected error occurred");
  }
}

export async function sendOtp(
  request: SendOtpRequest
): Promise<SendOtpResponse> {
  const apiPayload = transformIdentifierToApiFormat(request.identifier);
  return apiRequest<SendOtpResponse>(
    API_CONFIG.ENDPOINTS.PASSWORD_RESET_SEND_OTP,
    apiPayload
  );
}

export async function verifyOtp(
  request: VerifyOtpRequest
): Promise<VerifyOtpResponse> {
  const apiPayload = {
    ...transformIdentifierToApiFormat(request.identifier),
    otp: request.otp,
  };
  return apiRequest<VerifyOtpResponse>(
    API_CONFIG.ENDPOINTS.PASSWORD_RESET_VERIFY_OTP,
    apiPayload
  );
}

export async function resendOtp(
  request: ResendOtpRequest
): Promise<ResendOtpResponse> {
  const apiPayload = transformIdentifierToApiFormat(request.identifier);
  return apiRequest<ResendOtpResponse>(
    API_CONFIG.ENDPOINTS.PASSWORD_RESET_RESEND_OTP,
    apiPayload
  );
}

export async function resetPassword(
  request: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  const apiPayload = {
    ...transformIdentifierToApiFormat(request.identifier),
    otp: request.otp,
    new_password: request.newPassword,
    confirm_password: request.confirmPassword,
    ...(request.resetToken && { resetToken: request.resetToken }),
  };
  return apiRequest<ResetPasswordResponse>(
    API_CONFIG.ENDPOINTS.PASSWORD_RESET_RESET,
    apiPayload
  );
}
