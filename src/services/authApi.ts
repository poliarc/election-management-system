import type { LoginPayload } from "../types/auth";
import type { LoginRequest, LoginResponse, ApiUser, PartyAdminDetail, LevelAdminDetail } from "../types/api";
import type { User, PanelAssignment } from "../types/auth";
import { API_CONFIG, getApiUrl } from "../config/api";

// Determine if identifier is email or phone
function isEmail(identifier: string): boolean {
  return identifier.includes('@');
}

// Build login request payload
function buildLoginRequest(identifier: string, password: string): LoginRequest {
  if (isEmail(identifier)) {
    return { email: identifier, password };
  }
  return { contact_no: identifier, password };
}

// Main login function
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const request = buildLoginRequest(payload.identifier, payload.password);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
      // Handle nested error structure: { success: false, error: { message, code, timestamp } }
      const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

// Transform API user to app user
export function transformApiUser(apiUser: ApiUser, userType: string): User {
  return {
    id: apiUser.user_id,
    email: apiUser.email,
    username: apiUser.username,
    firstName: apiUser.first_name,
    lastName: apiUser.last_name,
    contactNo: apiUser.contact_no,
    partyId: apiUser.party_id,
    roleId: apiUser.role_id,
    isSuperAdmin: apiUser.isSuperAdmin === 1,
    partyName: apiUser.partyName,
    role: apiUser.role,
    userType: userType as any,
  };
}

// Transform party admin details to panel assignments
export function transformPartyAdminPanels(
  details: PartyAdminDetail[] | null
): PanelAssignment[] {
  if (!details) return [];

  return details.map(detail => ({
    id: detail.party_id,
    name: detail.partyName,
    displayName: detail.partyName,
    type: 'party' as const,
    redirectUrl: detail.redirectUrl,
    metadata: {
      partyCode: detail.partyCode,
      partyTypeId: detail.party_type_id,
      partyType: detail.party_type,
    },
  }));
}

// Transform level admin details to panel assignments
export function transformLevelAdminPanels(
  details: LevelAdminDetail[] | null
): PanelAssignment[] {
  if (!details) return [];

  return details.map(detail => ({
    id: detail.party_wise_id,
    name: detail.level_name,
    displayName: detail.display_level_name,
    type: 'level' as const,
    redirectUrl: detail.redirectUrl,
    metadata: {
      parentLevel: detail.parent_level,
      parentLevelName: detail.parent_level_name,
      partyId: detail.party_id,
      partyName: detail.partyName,
      stateId: detail.state_id,
      stateName: detail.state_name,
      stateLevelType: detail.state_level_type,
    },
  }));
}
