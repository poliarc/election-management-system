export type Role = {
  role_id: number;
  roleName: string;
  isActive: boolean;
  created_at: string;
};

export type RoleForm = {
  roleName: string;
  isActive: boolean;
};

export type RoleSearchParams = {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
};
