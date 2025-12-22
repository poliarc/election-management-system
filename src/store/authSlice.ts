import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  AuthState,
  LoginPayload,
} from "../types/auth";
import type { LoginResponseData, StateAssignment } from "../types/api";
import { storage } from "../utils/storage";
import { isTokenValid } from "../utils/tokenValidator";
import * as authApi from "../services/authApi";

// Try to restore auth state from localStorage
const savedAuthState = storage.getAuthState<Partial<AuthState>>();
const savedAccessToken = savedAuthState?.accessToken || localStorage.getItem('auth_access_token');

// Validate token before restoring state
const isValidToken = isTokenValid(savedAccessToken);

const initialState: AuthState = {
  user: isValidToken ? (savedAuthState?.user || storage.getUser()) : null,
  accessToken: isValidToken ? savedAccessToken : null,
  refreshToken: isValidToken ? (savedAuthState?.refreshToken || localStorage.getItem('auth_refresh_token')) : null,
  loading: false,
  error: null,
  isPartyAdmin: isValidToken ? (savedAuthState?.isPartyAdmin || false) : false,
  isLevelAdmin: isValidToken ? (savedAuthState?.isLevelAdmin || false) : false,
  hasStateAssignments: isValidToken ? (savedAuthState?.hasStateAssignments || false) : false,
  partyAdminPanels: isValidToken ? (savedAuthState?.partyAdminPanels || []) : [],
  levelAdminPanels: isValidToken ? (savedAuthState?.levelAdminPanels || []) : [],
  stateAssignments: isValidToken ? (savedAuthState?.stateAssignments || []) : [],
  permissions: isValidToken ? (savedAuthState?.permissions || null) : null,
  selectedAssignment: isValidToken ? (savedAuthState?.selectedAssignment || null) : null,
};

// Clear invalid tokens from storage
if (!isValidToken && savedAccessToken) {
  localStorage.removeItem('auth_access_token');
  localStorage.removeItem('auth_refresh_token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('auth_state');
}

export const login = createAsyncThunk<LoginResponseData, LoginPayload>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Login failed'
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isPartyAdmin = false;
      state.isLevelAdmin = false;
      state.hasStateAssignments = false;
      state.partyAdminPanels = [];
      state.levelAdminPanels = [];
      state.stateAssignments = [];
      state.permissions = null;
      state.selectedAssignment = null;
      storage.clearToken();
      storage.clearUser();
      storage.clearAuthState();
    },
    setSelectedAssignment: (state, action: PayloadAction<StateAssignment>) => {
      state.selectedAssignment = action.payload;

      // Persist updated state
      storage.setAuthState({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isPartyAdmin: state.isPartyAdmin,
        isLevelAdmin: state.isLevelAdmin,
        hasStateAssignments: state.hasStateAssignments,
        partyAdminPanels: state.partyAdminPanels,
        levelAdminPanels: state.levelAdminPanels,
        stateAssignments: state.stateAssignments,
        permissions: state.permissions,
        selectedAssignment: state.selectedAssignment,
      });
    },
    clearSelectedAssignment: (state) => {
      state.selectedAssignment = null;

      // Persist updated state
      storage.setAuthState({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isPartyAdmin: state.isPartyAdmin,
        isLevelAdmin: state.isLevelAdmin,
        hasStateAssignments: state.hasStateAssignments,
        partyAdminPanels: state.partyAdminPanels,
        levelAdminPanels: state.levelAdminPanels,
        stateAssignments: state.stateAssignments,
        permissions: state.permissions,
        selectedAssignment: state.selectedAssignment,
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<LoginResponseData>) => {
          const data = action.payload;

          // Transform and store user (includes state_id if available in user data)
          state.user = authApi.transformApiUser(data.user, data.userType);

          // Extract state_id from additional sources if not already present
          if (!state.user.state_id) {
            let extractedStateId: number | undefined;

            // 1. For level admins: get from levelAdminDetails
            if (data.levelAdminDetails && data.levelAdminDetails.length > 0) {
              const firstLevelAdmin = data.levelAdminDetails[0];
              extractedStateId = firstLevelAdmin.state_id;
            }

            // 2. For users with state assignments: get from stateAssignments
            if (!extractedStateId && data.stateAssignments && data.stateAssignments.length > 0) {
              const firstStateAssignment = data.stateAssignments[0];
              extractedStateId = firstStateAssignment.stateMasterData_id;
            }

            // Add state_id to user object if found from additional sources
            if (extractedStateId) {
              state.user = {
                ...state.user,
                state_id: extractedStateId
              };
            }
          }

          // Store tokens
          state.accessToken = data.accessToken;
          state.refreshToken = data.refreshToken;

          // Store role flags
          state.isPartyAdmin = data.isPartyAdmin;
          state.isLevelAdmin = data.isLevelAdmin;
          state.hasStateAssignments = data.hasStateAssignments;

          // Transform and store panel assignments
          state.partyAdminPanels = authApi.transformPartyAdminPanels(data.partyAdminDetails);
          state.levelAdminPanels = authApi.transformLevelAdminPanels(data.levelAdminDetails);
          state.stateAssignments = data.stateAssignments;

          // Store permissions
          state.permissions = data.permissions;

          // Persist to storage (tokens and user for backward compatibility)
          storage.setToken('access', data.accessToken);
          storage.setToken('refresh', data.refreshToken);
          storage.setUser(state.user);

          // Persist complete auth state
          storage.setAuthState({
            user: state.user,
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
            isPartyAdmin: state.isPartyAdmin,
            isLevelAdmin: state.isLevelAdmin,
            hasStateAssignments: state.hasStateAssignments,
            partyAdminPanels: state.partyAdminPanels,
            levelAdminPanels: state.levelAdminPanels,
            stateAssignments: state.stateAssignments,
            permissions: state.permissions,
            selectedAssignment: state.selectedAssignment,
          });

          state.loading = false;
          state.error = null;
        }
      )
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Login failed";
      });
  },
});

export const { logout, setSelectedAssignment, clearSelectedAssignment } = authSlice.actions;
export default authSlice.reducer;
