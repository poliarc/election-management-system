export type User = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  contact_no: string;
  party_id: number;
  role_id: number;
  state_id?: number;
  district_id?: number;
  partyName?: string;
  role?: string;
  stateName?: string;
  districtName?: string;
  isActive: boolean;
  created_at: string;
};

export type UserForm = {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  contact_no?: string;
  party_id: number;
  role_id?: number;
  state_id?: number;
  district_id?: number;
  isActive?: boolean;
};

export type UserSearchParams = {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
  party_id?: number;
  role_id?: number;
};

export type Party = {
  party_id: number;
  partyName: string;
  partyCode: string;
  party_type_id: number;
  adminId: number | null;
  party_type_name: string;
  admin_name: string;
  admin_email: string | null;
  isActive: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
};

export type Role = {
  role_id: number;
  role: string;
  isActive: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
};
