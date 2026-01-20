export interface Visitor {
  visitor_id: number;
  name: string;
  phone: string;
  email?: string;
  state_id: number;
  district_id: number;
  assembly_id: number;
  date_of_visit: string;
  place_of_visit: string;
  no_of_persons: number;
  purpose_of_visit: string;
  follow_up_date?: string;
  party_id: number;
  assembly_user_id: number;
  inserted_by: number;
  priority?: 'high' | 'medium' | 'low';
  inserted_on: string;
  updated_on: string;
  isActive: number;
  isDelete: number;
  state_name?: string;
  district_name?: string;
  assembly_name?: string;
  party_name?: string;
  assembly_user_name?: string;
  inserted_by_name?: string;
}

export interface CreateVisitorRequest {
  name: string;
  phone: string;
  email?: string;
  state_id: number;
  district_id: number;
  assembly_id: number;
  date_of_visit: string;
  place_of_visit: string;
  no_of_persons: number;
  purpose_of_visit: string;
  follow_up_date?: string;
  party_id: number;
  assembly_user_id: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface UpdateVisitorRequest {
  name?: string;
  phone?: string;
  email?: string;
  state_id?: number;
  district_id?: number;
  assembly_id?: number;
  date_of_visit?: string;
  place_of_visit?: string;
  no_of_persons?: number;
  purpose_of_visit?: string;
  follow_up_date?: string;
  assembly_user_id?: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface VisitorFilters {
  page?: number;
  limit?: number;
  search?: string;
  assembly_id?: number;
  state_id?: number;
  district_id?: number;
  assembly_user_id?: number;
  party_id?: number;
  isActive?: boolean;
  date_of_visit_from?: string;
  date_of_visit_to?: string;
  follow_up_date_from?: string;
  follow_up_date_to?: string;
  no_of_persons_min?: number;
  no_of_persons_max?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface VisitorResponse {
  success: boolean;
  message: string;
  data: Visitor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SingleVisitorResponse {
  success: boolean;
  message: string;
  data: Visitor;
}

export interface VisitorStats {
  total: number;
  active: number;
  inactive: number;
  upcomingFollowUps: number;
  overdueFollowUps: number;
  thisMonth: number;
}

export interface VisitorStatsResponse {
  success: boolean;
  message: string;
  data: VisitorStats;
}

export interface BulkOperationRequest {
  visitor_ids: number[];
  operation: 'activate' | 'deactivate' | 'delete';
}

export interface BulkOperationResponse {
  success: boolean;
  message: string;
  data: {
    successful: number;
    failed: number;
    total: number;
  };
}

export interface ToggleStatusRequest {
  isActive: boolean;
}

export interface StateMasterData {
  id: number;
  levelName: string;
  levelType: 'State' | 'District' | 'Assembly';
  ParentId: number | null;
  isActive: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
}

export interface StateMasterResponse {
  success: boolean;
  message: string;
  data: StateMasterData[];
  total: number;
}

export interface AssemblyUser {
  assignment_id: number;
  user_id: number;
  user_name: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  user_role?: string;
  user_state: string;
  user_district: string;
  party_id: number;
  party_name: string;
  is_active: boolean;
  assignment_active: boolean;
  user_active: boolean;
  assigned_at: string;
  assignment_updated_at: string;
  user_created_at: string;
  role?: string;
  role_name?: string;
  designation?: string;
}

export interface AssemblyUsersResponse {
  success: boolean;
  message: string;
  data: {
    location: {
      location_id: number;
      location_name: string;
      location_type: string;
      parent_id: number;
    };
    total_users: number;
    active_users: number;
    inactive_users: number;
    users: AssemblyUser[];
  };
}