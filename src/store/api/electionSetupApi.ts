import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4435';

export interface ElectionSetupRequest {
  state_name: string;
  district_name: string;
  assembly_name: string;
  party_id: number;
  candidate_name: string;
  election_level: string;
}

export interface ElectionSetupResponse {
  success: boolean;
  message: string;
  data?: any;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export const electionSetupApi = createApi({
  reducerPath: 'electionSetupApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('auth_access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['ElectionSetup'],
  endpoints: (builder) => ({
    createElectionSetup: builder.mutation<ElectionSetupResponse, ElectionSetupRequest>({
      query: (data) => ({
        url: 'election-setup',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ElectionSetup'],
    }),
  }),
});

export const {
  useCreateElectionSetupMutation,
} = electionSetupApi;
