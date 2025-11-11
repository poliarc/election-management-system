const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const THEME_KEY = "theme";

export const storage = {
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),

  setUser: (user: unknown) =>
    localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getUser: <T>() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  clearUser: () => localStorage.removeItem(USER_KEY),

  setTheme: (theme: "light" | "dark") => localStorage.setItem(THEME_KEY, theme),
  getTheme: (): "light" | "dark" =>
    (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light",
};
