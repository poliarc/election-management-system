import type { Role } from "./roles";

// Expanded user model to allow phone-based authentication.
export interface User {
  id: string;
  // Email may be absent if the user authenticated with only a phone number.
  email?: string;
  // Phone number present when phone-based login used.
  phone?: string;
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

// Single identifier field supports either email address or phone number.
export interface LoginPayload {
  identifier: string; // email or phone
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
