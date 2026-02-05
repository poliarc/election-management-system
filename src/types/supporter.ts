export interface Supporter {
  supporter_id: number;
  party_id: number;
  state_id: number;
  district_id: number;
  assembly_id: number;
  block_id?: number;
  mandal_id?: number;
  booth_id?: number;
  initials: string;
  first_name: string;
  last_name: string;
  father_name: string;
  date_of_birth: string;
  age?: number;
  gender: 'Male' | 'Female' | 'Other';
  phone_no: string;
  whatsapp_no?: string;
  voter_epic_id?: string;
  address: string;
  language: string | string[] | { primary: string; secondary?: string[] };
  religion: string;
  category: string;
  caste?: string;
  remarks?: string;
  created_by: number;
  isActive: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
  party_name?: string;
  state_name?: string;
  district_name?: string;
  assembly_name?: string;
  block_name?: string;
  mandal_name?: string;
  booth_name?: string;
  created_by_name?: string;
}

export interface CreateSupporterRequest {
  party_id: number;
  state_id: number;
  district_id: number;
  assembly_id: number;
  block_id?: number;
  mandal_id?: number;
  booth_id?: number;
  initials: string;
  first_name: string;
  last_name: string;
  father_name: string;
  date_of_birth: string;
  age?: number;
  gender: 'Male' | 'Female' | 'Other';
  phone_no: string;
  whatsapp_no?: string;
  voter_epic_id?: string;
  address: string;
  language: string | string[] | { primary: string; secondary?: string[] };
  religion: string;
  category: string;
  caste?: string;
  remarks?: string;
}

export interface UpdateSupporterRequest {
  initials?: string;
  first_name?: string;
  last_name?: string;
  father_name?: string;
  date_of_birth?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  phone_no?: string;
  whatsapp_no?: string;
  voter_epic_id?: string;
  address?: string;
  language?: string | string[] | { primary: string; secondary?: string[] };
  religion?: string;
  category?: string;
  caste?: string;
  remarks?: string;
  // Hierarchy fields
  party_id?: number;
  state_id?: number;
  district_id?: number;
  assembly_id?: number;
  block_id?: number;
  mandal_id?: number;
  booth_id?: number;
}

export interface SupporterFilters {
  page?: number;
  limit?: number;
  search?: string;
  party_id?: number;
  state_id?: number;
  district_id?: number;
  assembly_id?: number;
  block_id?: number;
  mandal_id?: number;
  booth_id?: number;
  created_by?: number;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
  gender?: string;
  ageFrom?: string;
  ageTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface SupporterStats {
  overview: {
    total_supporters: number;
    active_supporters: number;
    inactive_supporters: number;
    supporters_with_epic: number;
    supporters_with_whatsapp: number;
    today_supporters: number;
    week_supporters: number;
    month_supporters: number;
  };
  by_location: Array<{
    state_id: number;
    state_name: string;
    supporter_count: number;
  }>;
  top_contributors: Array<{
    created_by: number;
    contributor_name: string;
    supporter_count: number;
  }>;
  demographics?: {
    by_gender: Array<{ gender: string; count: number }>;
    by_age_group: Array<{ age_group: string; count: number }>;
    by_religion: Array<{ religion: string; count: number }>;
    by_category: Array<{ category: string; count: number }>;
    by_language: Array<{ language: string; count: number }>;
  };
}

export interface SupporterResponse {
  success: boolean;
  message: string;
  data: Supporter | Supporter[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SupporterStatsResponse {
  success: boolean;
  message: string;
  data: SupporterStats;
}

export interface BulkOperationRequest {
  supporter_ids: number[];
  operation: 'activate' | 'deactivate' | 'delete';
}

export interface BulkOperationResponse {
  success: boolean;
  message: string;
  data: {
    processed: number;
    success: number;
    failed: number;
  };
}

export interface HierarchyLevel {
  id: number;
  levelName: string;
  levelType: string;
  ParentId: number | null;
  level: number;
}

export interface AfterAssemblyLevel {
  id: number;
  levelName: string;
  displayName: string;
  parentId: number | null;
  parentAssemblyId: number | null;
  partyLevelId: number;
  isActive: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
  display_level_name: string;
}

export interface HierarchyResponse {
  success: boolean;
  message: string;
  data: {
    stateHierarchy: HierarchyLevel[];
    afterAssemblyHierarchy: AfterAssemblyLevel[];
  };
}