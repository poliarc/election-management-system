import type { LoginPayload, LoginResponse, User } from "../types/auth";
import type { Role } from "../types/roles";

// Very basic phone number heuristic (international +10-15 digits)
const phoneRegex = /^\+?\d{10,15}$/;

// Demo user directory to ensure the same account can login with email OR phone.
const DEMO_USERS: Array<
  Required<Pick<User, "id" | "name" | "role">> & {
    email: string;
    phone: string;
    adminPanels?: Role[];
    userPanels?: Role[];
  }
> = [
  {
    id: "u-admin-001",
    name: "Admin User",
    role: "Admin",
    email: "admin@demo.io",
    phone: "+15550000001",
    adminPanels: [
      "State",
      "District",
      "Assembly",
      "Block",
      "Mandal",
      "PollingCenter",
      "Booth",
      "Karyakarta",
    ],
    userPanels: [],
  },
  {
    id: "u-state-001",
    name: "State User",
    role: "State",
    email: "state@demo.io",
    phone: "+15550000002",
    adminPanels: ["District", "Assembly"],
    userPanels: ["State", "Block"],
  },
  {
    id: "u-district-001",
    name: "District User",
    role: "District",
    email: "district@demo.io",
    phone: "+15550000003",
    adminPanels: ["Block", "Mandal"],
    userPanels: ["District", "PollingCenter"],
  },
  {
    id: "u-assembly-001",
    name: "Assembly User",
    role: "Assembly",
    email: "assembly@demo.io",
    phone: "+15550000004",
    adminPanels: ["Booth"],
    userPanels: ["Assembly", "Mandal"],
  },
  {
    id: "u-block-001",
    name: "Block User",
    role: "Block",
    email: "block@demo.io",
    phone: "+15550000005",
    adminPanels: ["Mandal"],
    userPanels: ["Block", "Booth"],
  },
  {
    id: "u-mandal-001",
    name: "Mandal User",
    role: "Mandal",
    email: "mandal@demo.io",
    phone: "+15550000006",
    adminPanels: ["PollingCenter"],
    userPanels: ["Mandal", "Booth"],
  },
  {
    id: "u-pc-001",
    name: "Polling Center User",
    role: "PollingCenter",
    email: "pc@demo.io",
    phone: "+15550000007",
    adminPanels: ["Booth"],
    userPanels: ["PollingCenter"],
  },
  {
    id: "u-booth-001",
    name: "Booth User",
    role: "Booth",
    email: "booth@demo.io",
    phone: "+15550000008",
    adminPanels: [],
    userPanels: ["Booth"],
  },
  {
    id: "u-karyakarta-001",
    name: "Karyakarta User",
    role: "Karyakarta",
    email: "karyakarta@demo.io",
    phone: "+15550000009",
    adminPanels: [],
    userPanels: ["Karyakarta"],
  },
];

function findDemoUser(identifier: string) {
  const idLower = identifier.toLowerCase();
  return DEMO_USERS.find(
    (u) => u.email.toLowerCase() === idLower || u.phone === identifier
  );
}

// Mock login function with hardcoded credentials supporting email OR phone identifier.
export async function mockLogin(payload: LoginPayload): Promise<LoginResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const { identifier, password } = payload;

  // Mock validation
  if (password !== "password") {
    throw new Error("Invalid credentials");
  }

  // First try to resolve against demo users for deterministic identity mapping.
  const demo = findDemoUser(identifier);
  if (demo) {
    const user: User = {
      id: demo.id,
      email: demo.email,
      phone: demo.phone,
      name: demo.name,
      role: demo.role as Role,
      adminPanels: demo.adminPanels ?? [],
      userPanels: demo.userPanels ?? [],
    };
    return { token: "mock-jwt-token", user };
  }

  // Otherwise, fallback to heuristic validation and role inference
  const isEmail = identifier.includes("@");
  const isPhone = phoneRegex.test(identifier);
  if (!isEmail && !isPhone) {
    throw new Error("Identifier must be a valid email or phone number");
  }

  let role: Role = "Karyakarta";
  let email: string | undefined;
  let phone: string | undefined;
  let name: string;
  if (isEmail) {
    email = identifier.toLowerCase();
    role = email.startsWith("admin@")
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
      : "Karyakarta";
    name = email.split("@")[0];
  } else {
    phone = identifier;
    name = phone;
  }

  const user: User = {
    id: Math.random().toString(36).slice(2, 11),
    email,
    phone,
    name,
    role,
    // Fallback: ensure Admin has full admin panel access; others get their own panel as user-assigned
    adminPanels:
      role === "Admin"
        ? [
            "State",
            "District",
            "Assembly",
            "Block",
            "Mandal",
            "PollingCenter",
            "Booth",
            "Karyakarta",
          ]
        : [],
    userPanels: role === "Admin" ? [] : [role],
  };

  return {
    token: "mock-jwt-token",
    user,
  };
}
