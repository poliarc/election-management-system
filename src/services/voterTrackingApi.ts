import { apiClient } from './api';

export interface VoterTrackingRecord {
  tracking_id: number;
  voter_id: number;
  voter_epic_no: string;
  assembly_id: number;
  party_id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: 'CREATE' | 'UPDATE' | 'DELETE';
  changed_by_user_id: number;
  changed_by_user_name: string;
  changed_by_user_level: string;
  change_timestamp: string;
  voter_full_name_en: string;
  part_no: string;
  assembly_name: string;
}

export interface VoterTrackingPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VoterTrackingResponse {
  success: boolean;
  data: VoterTrackingRecord[];
  pagination: VoterTrackingPagination;
}

export interface VoterTrackingSummary {
  total_changes: number;
  unique_voters_modified: number;
  unique_users_made_changes: number;
  most_changed_fields: { field_name: string; change_count: number }[];
  recent_changes: VoterTrackingRecord[];
  changes_by_date: { date: string; change_count: number }[];
}

export interface VoterTrackingFilters {
  assembly_id?: number;
  voter_id?: number;
  voter_epic_no?: string;
  field_name?: string;
  changed_by_user_id?: number;
  change_type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export const voterTrackingApi = {
  getAll: (filters: VoterTrackingFilters = {}) =>
    apiClient.get<VoterTrackingResponse>('/voters/tracking', { params: filters }),

  getByAssembly: (assembly_id: number, filters: Omit<VoterTrackingFilters, 'assembly_id'> = {}) =>
    apiClient.get<VoterTrackingResponse>(`/voters/tracking/assembly/${assembly_id}`, { params: filters }),

  getAssemblySummary: (assembly_id: number, params: { date_from?: string; date_to?: string } = {}) =>
    apiClient.get<{ success: boolean; data: VoterTrackingSummary }>(`/voters/tracking/assembly/${assembly_id}/summary`, { params }),
};
