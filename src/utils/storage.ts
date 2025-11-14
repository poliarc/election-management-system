const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const USER_KEY = "auth_user";
const AUTH_STATE_KEY = "auth_state";
const THEME_KEY = "theme";

export const storage = {
  setToken: (type: 'access' | 'refresh', token: string) => {
    const key = type === 'access' ? ACCESS_TOKEN_KEY : REFRESH_TOKEN_KEY;
    localStorage.setItem(key, token);
  },
  
  getToken: (type: 'access' | 'refresh') => {
    const key = type === 'access' ? ACCESS_TOKEN_KEY : REFRESH_TOKEN_KEY;
    return localStorage.getItem(key);
  },
  
  clearToken: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  setUser: (user: unknown) =>
    localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getUser: <T>() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  clearUser: () => localStorage.removeItem(USER_KEY),

  // Store complete auth state (role assignments, permissions, etc.)
  setAuthState: (state: unknown) =>
    localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(state)),
  getAuthState: <T>() => {
    const raw = localStorage.getItem(AUTH_STATE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  clearAuthState: () => localStorage.removeItem(AUTH_STATE_KEY),

  setTheme: (theme: "light" | "dark") => localStorage.setItem(THEME_KEY, theme),
  getTheme: (): "light" | "dark" =>
    (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light",
};
