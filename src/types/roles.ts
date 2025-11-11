export const roles = [
  "Admin",
  "State",
  "District",
  "Assembly",
  "Block",
  "Mandal",
  "PollingCenter",
  "Booth",
  "Karyakarta",
] as const;

export type Role = (typeof roles)[number];

export const RoleLabel: Record<Role, string> = {
  Admin: "Admin",
  State: "State",
  District: "District",
  Assembly: "Assembly",
  Block: "Block",
  Mandal: "Mandal",
  PollingCenter: "Polling Center",
  Booth: "Booth",
  Karyakarta: "Karyakarta",
};
