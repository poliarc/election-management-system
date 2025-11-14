import type { ApiPermissions, StateAssignment } from "./api";

// Enhanced User type to match API response
export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  contactNo: string;
  partyId: number;
  roleId: number;
  isSuperAdmin: boolean;
  partyName: string;
  role: string;
  userType: 'superadmin' | 'partyadmin' | 'leveladmin' | 'user';
}

// Panel assignment types
export interface PanelAssignment {
  id: number;
  name: string;
  displayName: string;
  type: 'party' | 'level' | 'state';
  redirectUrl: string;
  metadata?: Record<string, any>;
}

// Enhanced AuthState
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  // Role assignments
  isPartyAdmin: boolean;
  isLevelAdmin: boolean;
  hasStateAssignments: boolean;
  partyAdminPanels: PanelAssignment[];
  levelAdminPanels: PanelAssignment[];
  stateAssignments: StateAssignment[];
  permissions: ApiPermissions | null;
  // Currently selected assignment (for users with multiple assignments of same type)
  selectedAssignment: StateAssignment | null;
}

// Login payload (unchanged)
export interface LoginPayload {
  identifier: string;
  password: string;
}
