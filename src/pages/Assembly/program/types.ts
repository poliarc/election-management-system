export type ProgramStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETE' | 'MISSED';

// A single manager entry (one location/date/time per program)
export interface ProgramManager {
  id?: number;
  party_id?: number;
  state_id: number;
  district_id: number;
  assembly_id: number;
  candidate_id: number;
  location: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  description: string;
  status: ProgramStatus;
  created_by?: string;
  creator_phone_no?: string;
  creator_id: number;
  isActive: number;
}

// API list item shape
export interface ProgramListItem {
  id: number;           // manager row id
  program_id: number;
  program_name: string;
  state_id: number;
  district_id: number;
  assembly_id: number;
  candidate_id: number;
  location: string;
  date: string;
  time: string;
  description: string;
  status: ProgramStatus;
  created_by: string | null;  // name string or user id as string
  creator_id: number;
  creator_phone_no: string | null;
  user_name: string | null;   // resolved user name when created_by is a user id
  isActive: number;
  created_at: string;
  updated_at: string;
  state_name: string;
  district_name: string;
  assembly_name: string;
}

export interface ProgramCreatePayload {
  program_name: string;
  isActive: number;
  managers: ProgramManager[];
}

export interface ProgramUpdatePayload {
  program_name?: string;
  isActive?: number;
  managers?: Partial<ProgramManager>[];
  deletedManagerIds: number[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
