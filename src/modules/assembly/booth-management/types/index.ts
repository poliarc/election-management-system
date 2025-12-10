// Booth Management Types
export type BoothAgentCategory =
  | "Booth Inside Team"
  | "Booth Outside Team"
  | "Polling Center Support Team";

export type BoothAgentRole =
  | "Booth Agent"
  | "Table Coordinator"
  | "Voter Field Coordination"
  | "Polling Center Incharge"
  | "Water Incharge"
  | "Food Incharge";

export interface BoothAgent {
  agent_id: number;
  category: BoothAgentCategory;
  role: BoothAgentRole;
  name: string;
  father_name?: string;
  phone: string;
  alternate_no?: string;
  email?: string;
  address?: string;
  aadhar_card?: string;
  photo?: string;
  voter_id_file?: string;
  android_phone?: "Yes" | "No";
  laptop?: "Yes" | "No";
  twoWheeler?: "Yes" | "No";
  fourWheeler?: "Yes" | "No";
  polling_center_id?: number;
  polling_center_name?: string;
  booth_id?: string;
  booth_no?: string;
  status: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
}

export interface BoothAgentFormData {
  category: BoothAgentCategory;
  role: BoothAgentRole;
  name: string;
  father_name?: string;
  phone: string;
  alternate_no?: string;
  email?: string;
  password?: string;
  address?: string;
  aadhar_card?: File | string;
  photo?: File | string;
  voter_id_file?: File | string;
  android_phone?: "Yes" | "No";
  laptop?: "Yes" | "No";
  twoWheeler?: "Yes" | "No";
  fourWheeler?: "Yes" | "No";
  polling_center_id?: number;
  booth_id?: string;
  status?: number;
}

export interface PollingCenter {
  id: number;
  levelName: string;
  displayName: string;
  parentId: number;
  parentAssemblyId: number | null;
  partyLevelId: number;
  isActive: number;
  created_at: string;
  updated_at: string;
  booths: Booth[];
  boothCount: number;
}

export interface Booth {
  id: number;
  levelName: string;
  displayName: string;
  parentId: number;
  parentAssemblyId: number | null;
  partyLevelId: number;
  isActive: number;
  created_at: string;
  updated_at: string;
  boothNo?: string; // Keep for backward compatibility
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  role?: string;
  status?: boolean | string;
  polling_center_id?: number;
  sort_by?: string;
  order?: "asc" | "desc";
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
