import { apiClient } from './api';
import axios from 'axios';
import type {
  ProgramCreatePayload,
  ProgramUpdatePayload,
  ProgramListItem,
  PaginationMeta,
  ProgramStatus,
} from '../pages/Assembly/program/types';

// Unauthenticated client for public pages (no token required)
const publicClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  timeout: 30000,
});

export interface GetProgramsParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'id' | 'date' | 'status' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
  assembly_id?: number;
  state_id?: number;
  district_id?: number;
}

export interface GetProgramsResponse {
  success: boolean;
  data: ProgramListItem[];
  pagination: PaginationMeta;
}

export interface UpdateProgramStatusPayload {
  status: ProgramStatus;
  candidateId?: number;
}

export interface ProgramLink {
  id: number;
  party_id: number;
  state_id: number;
  district_id: number;
  assembly_id: number;
  candidate_id: number;
  creator_id: number;
  party?: { id: number; name: string };
  state?: { id: number; name: string };
  district?: { id: number; name: string };
  assembly?: { id: number; name: string };
  candidate?: { id: number; first_name: string; last_name: string };
  creator?: { id: number; first_name: string; last_name: string };
  created_at?: string;
}

export const getPrograms = async (params: GetProgramsParams = {}): Promise<GetProgramsResponse> => {
  const res = await apiClient.get('/program/get-program', { params });
  return res.data;
};

export const createProgram = async (payload: ProgramCreatePayload) => {
  const res = await apiClient.post('/program/create-program', payload);
  return res.data;
};

export const updateProgram = async (programId: number, payload: ProgramUpdatePayload) => {
  const res = await apiClient.patch(`/program/update-program/${programId}`, payload);
  return res.data;
};

export const updateProgramStatus = async (managerId: number, payload: UpdateProgramStatusPayload) => {
  const res = await apiClient.patch(`/program/update-status/${managerId}`, payload);
  return res.data;
};

export const deleteProgram = async (programId: number) => {
  const res = await apiClient.delete(`/program/delete-program/${programId}`);
  return res.data;
};

// Program Links
export const createProgramLink = async (payload: {
  party_id: number; state_id: number; district_id: number;
  assembly_id: number; candidate_id: number; creator_id: number;
}) => {
  const res = await apiClient.post('/program-links/create-program-links', payload);
  return res.data;
};

export const getProgramLinks = async (params?: { program_id?: number; assembly_id?: number; state_id?: number; district_id?: number }) => {
  const res = await apiClient.get('/program-links/get-program-links', { params });
  return res.data as { success: boolean; data: ProgramLink[] };
};

export const getProgramLinkById = async (linkId: number) => {
  // Use publicClient — no auth token needed for public form
  const res = await publicClient.get('/program-links/get-program-links', { params: {} });
  const all = res.data as { success: boolean; data: ProgramLink[] };
  return all.data?.find(l => l.id === linkId) || null;
};

export const createProgramPublic = async (payload: ProgramCreatePayload) => {
  // Use publicClient — no auth token for public form submissions
  const res = await publicClient.post('/program/create-program', payload);
  return res.data;
};

export const deleteProgramLink = async (linkId: number) => {
  const res = await apiClient.delete(`/program-links/delete-program-links/${linkId}`);
  return res.data;
};

export interface ProgramStats {
  total: number;
  today_total: number;
  pending: number;
  approved: number;
  rejected: number;
  complete: number;
  missed: number;
}

export const getProgramStats = async (params?: { assembly_id?: number; state_id?: number; district_id?: number }) => {
  const res = await apiClient.get('/program/program-stats', { params });
  return res.data as { success: boolean; data: ProgramStats };
};
