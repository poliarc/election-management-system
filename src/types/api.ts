// Login Request
export interface LoginRequest {
  email?: string;      // for email
  contact_no?: string; // for phone number
  password: string;
}

// User object from API
export interface ApiUser {
  user_id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  contact_no: string;
  dob: string | null;
  sex: string | null;
  party_id: number;
  role_id: number;
  modules: string | null;
  profileImage: string | null;
  isActive: number;
  isDelete: number;
  is_youth: number;
  is_women: number;
  is_employee: number;
  is_minority: number;
  is_sc: number;
  is_st: number;
  is_obc: number;
  is_it_media: number;
  is_kisan: number;
  is_majdoor: number;
  is_student: number;
  isSuperAdmin: number;
  created_on: string;
  created_by: number | null;
  updated_on: string;
  updated_by: number | null;
  father: string | null;
  mother: string | null;
  citizenship: string | null;
  married: string | null;
  marriageAnniversary: string | null;
  partyJoiningDate: string | null;
  education: string | null;
  professionalExp: string | null;
  children: string | null;
  positionHeld: string | null;
  vehicle: string | null;
  partyName: string;
  role: string;
}

// Party Admin Details
export interface PartyAdminDetail {
  party_id: number;
  partyName: string;
  partyCode: string;
  party_type_id: number;
  party_type: string;
  redirectUrl: string;
}

// Level Admin Details
export interface LevelAdminDetail {
  party_wise_id: number;
  level_name: string;
  display_level_name: string;
  parent_level: number | null;
  parent_level_name: string | null;
  parent_display_level_name: string | null;
  party_id: number;
  partyName: string;
  state_id: number;
  state_name: string;
  state_level_type: string;
  redirectUrl: string;
}

// State Assignment
export interface StateAssignment {
  assignment_id: number;
  stateMasterData_id: number;
  levelName: string;
  levelType: string;
  parentId: number | null;
  parentLevelName: string | null;
  parentLevelType: string | null;
}

// Permissions
export interface ApiPermissions {
  isSuperAdmin: boolean;
  isPartyAdmin: boolean;
  isLevelAdmin: boolean;
  hasStateAccess: boolean;
  canManageParties: boolean;
  canManageLevels: boolean;
  accessibleStates: StateAssignment[];
  accessibleDistricts: StateAssignment[];
  accessibleAssemblies: StateAssignment[];
  accessibleBlocks: StateAssignment[];
  accessibleMandals: StateAssignment[];
  accessiblePollingCenters: StateAssignment[];
}

// Login Response Data
export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
  userType: 'superadmin' | 'partyadmin' | 'leveladmin' | 'user';
  isSuperAdmin: boolean;
  isPartyAdmin: boolean;
  isLevelAdmin: boolean;
  hasStateAssignments: boolean;
  partyAdminDetails: PartyAdminDetail[] | null;
  levelAdminDetails: LevelAdminDetail[] | null;
  stateAssignments: StateAssignment[];
  permissions: ApiPermissions;
  redirectUrl: string;
  message: string;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type LoginResponse = ApiResponse<LoginResponseData>;
