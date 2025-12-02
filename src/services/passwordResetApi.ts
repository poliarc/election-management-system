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

// Helper to determine if identifier is email or phone
function isEmail(identifier: string): boolean {
  return identifier.includes("@");
}

// Helper to determine if identifier is phone number (digits only)
function isPhoneNumber(identifier: string): boolean {
  return /^\d+$/.test(identifier);
}

// Transform identifier to API format (email or contact_no)
function transformIdentifierToApiFormat(
  identifier: string
): Record<string, string> {
  if (isEmail(identifier)) {
    return { email: identifier };
  }
  return { contact_no: identifier };
}

async function apiRequest<T>(
  endpoint: string,
  body: Record<string, string>
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
      throw new Error(data.message || `HTTP ${response.status}`);
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
  // Use phone-based API if identifier is phone number (digits only)
  if (isPhoneNumber(request.identifier)) {
    const apiPayload = { phone_number: request.identifier };
    return apiRequest<SendOtpResponse>(
      API_CONFIG.ENDPOINTS.PHONE_PASSWORD_RESET_SEND_OTP,
      apiPayload
    );
  }

  // Use email-based API (existing flow)
  const apiPayload = transformIdentifierToApiFormat(request.identifier);
  return apiRequest<SendOtpResponse>(
    API_CONFIG.ENDPOINTS.PASSWORD_RESET_SEND_OTP,
    apiPayload
  );
}

export async function verifyOtp(
  request: VerifyOtpRequest
): Promise<VerifyOtpResponse> {
  // Use phone-based API if identifier is phone number (digits only)
  if (isPhoneNumber(request.identifier)) {
    const apiPayload = {
      phone_number: request.identifier,
      otp: request.otp,
    };
    return apiRequest<VerifyOtpResponse>(
      API_CONFIG.ENDPOINTS.PHONE_PASSWORD_RESET_VERIFY_OTP,
      apiPayload
    );
  }

  // Use email-based API (existing flow)
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
  // Use phone-based API if identifier is phone number (digits only)
  if (isPhoneNumber(request.identifier)) {
    const apiPayload = { phone_number: request.identifier };
    return apiRequest<ResendOtpResponse>(
      API_CONFIG.ENDPOINTS.PHONE_PASSWORD_RESET_RESEND_OTP,
      apiPayload
    );
  }

  // Use email-based API (existing flow)
  const apiPayload = transformIdentifierToApiFormat(request.identifier);
  return apiRequest<ResendOtpResponse>(
    API_CONFIG.ENDPOINTS.PASSWORD_RESET_RESEND_OTP,
    apiPayload
  );
}

export async function resetPassword(
  request: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  // Use phone-based API if identifier is phone number (digits only)
  if (isPhoneNumber(request.identifier)) {
    const apiPayload = {
      phone_number: request.identifier,
      new_password: request.newPassword,
      confirm_password: request.confirmPassword,
    };
    return apiRequest<ResetPasswordResponse>(
      API_CONFIG.ENDPOINTS.PHONE_PASSWORD_RESET_RESET,
      apiPayload
    );
  }

  // Use email-based API (existing flow)
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
