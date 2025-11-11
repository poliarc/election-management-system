import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  AuthState,
  LoginPayload,
  LoginResponse,
  User,
} from "../types/auth";
import { storage } from "../utils/storage";
import { mockLogin } from "../services/authApi";

const initialState: AuthState = {
  user: storage.getUser<User>(),
  token: storage.getToken(),
  loading: false,
  error: null,
  theme: storage.getTheme(),
};

export const login = createAsyncThunk<LoginResponse, LoginPayload>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await mockLogin(credentials);
      return res;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Login failed";
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      storage.clearToken();
      storage.clearUser();
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
      storage.setTheme(state.theme);
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
        (state, action: PayloadAction<LoginResponse>) => {
          state.loading = false;
          state.user = action.payload.user;
          state.token = action.payload.token;
          storage.setToken(action.payload.token);
          storage.setUser(action.payload.user);
        }
      )
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Login failed";
      });
  },
});

export const { logout, toggleTheme } = authSlice.actions;
export default authSlice.reducer;
