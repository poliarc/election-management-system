import type { LoginPayload, LoginResponse } from "../types/auth";
import type { Role } from "../types/roles";

// Mock login function with hardcoded credentials
export async function mockLogin(payload: LoginPayload): Promise<LoginResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const { email, password } = payload;

  // Mock validation
  if (password !== "password") {
    throw new Error("Invalid credentials");
  }

  // Extract role from email prefix
  const role: Role = email.startsWith("admin@")
    ? "Admin"
    : email.startsWith("state@")
    ? "State"
    : email.startsWith("district@")
    ? "District"
    : email.startsWith("assembly@")
    ? "Assembly"
    : email.startsWith("block@")
    ? "Block"
    : email.startsWith("mandal@")
    ? "Mandal"
    : email.startsWith("pc@")
    ? "PollingCenter"
    : email.startsWith("booth@")
    ? "Booth"
    : "Karyakarta"; // default

  const user = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    name: email.split("@")[0],
    role,
  };

  return {
    token: "mock-jwt-token",
    user,
  };
}
