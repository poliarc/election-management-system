import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  AuthState,
  LoginPayload,
} from "../types/auth";
import type { LoginResponseData, StateAssignment } from "../types/api";
import { storage } from "../utils/storage";
import * as authApi from "../services/authApi";

// Try to restore auth state from localStorage
const savedAuthState = storage.getAuthState<Partial<AuthState>>();

const initialState: AuthState = {
  user: savedAuthState?.user || storage.getUser(),
  accessToken: savedAuthState?.accessToken || storage.getToken('access'),
  refreshToken: savedAuthState?.refreshToken || storage.getToken('refresh'),
  loading: false,
  error: null,
  isPartyAdmin: savedAuthState?.isPartyAdmin || false,
  isLevelAdmin: savedAuthState?.isLevelAdmin || false,
  hasStateAssignments: savedAuthState?.hasStateAssignments || false,
  partyAdminPanels: savedAuthState?.partyAdminPanels || [],
  levelAdminPanels: savedAuthState?.levelAdminPanels || [],
  stateAssignments: savedAuthState?.stateAssignments || [],
  permissions: savedAuthState?.permissions || null,
  selectedAssignment: savedAuthState?.selectedAssignment || null,
};

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
          
          // Transform and store user
          state.user = authApi.transformApiUser(data.user, data.userType);
          
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

export const { logout, setSelectedAssignment } = authSlice.actions;
export default authSlice.reducer;
