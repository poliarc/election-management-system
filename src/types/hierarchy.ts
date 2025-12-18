// Hierarchy API Types

export interface HierarchyUser {
  user_role?: string;
  assignment_id: number;
  user_id: number;
  user_name: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  party?: {
    party_name: string;
    party_code: string;
  };
  party_name: string;
  user_state: string;
  user_district: string;
  party_id: number;
  is_active: boolean;
  assignment_active: boolean;
  assigned_at: string;
  assignment_updated_at: string;
  user_created_at: string;
  role?: string; // Designation/Role field
  role_name?: string; // Role name from API
  contact_no?: string;
  phone?: string;
  designation?: string;
  partyName?: string;
  status?: string | number | boolean;
  active?: boolean;
  user_active?: number | boolean | string; // Common field variation
}

export interface HierarchyChild {
  location_id: number;
  location_name: string;
  location_type:
    | "State"
    | "District"
    | "Assembly"
    | "Block"
    | "Mandal"
    | "Booth";
  parent_id: number | null;
  total_users: number;
  active_users: number;
  users: HierarchyUser[];
}

export interface HierarchyParent {
  location_id: number;
  location_name: string;
  location_type: string;
  parent_id: number | null;
}

export interface HierarchyChildrenResponse {
  success: boolean;
  message: string;
  data: {
    parent: HierarchyParent;
    children: HierarchyChild[];
    total_children?: number; // Optional for backward compatibility
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query parameters for fetching hierarchy
export interface HierarchyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "location_name" | "total_users" | "active_users";
  order?: "asc" | "desc";
}

// Transformed data for UI
export interface HierarchyListItem extends HierarchyChild {
  id: number; // alias for location_id
  name: string; // alias for location_name
  type: string; // alias for location_type
}

// Enhanced hierarchy child with district information for all-districts view
export interface EnhancedHierarchyChild extends HierarchyChild {
  district_name: string;
  district_id: number;
  has_users: boolean;
}
