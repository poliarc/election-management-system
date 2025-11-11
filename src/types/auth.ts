import type { Role } from "./roles";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  theme: "light" | "dark";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
