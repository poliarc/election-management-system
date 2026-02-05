import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { 
  Supporter, 
  CreateSupporterRequest, 
  UpdateSupporterRequest, 
  SupporterFilters, 
  SupporterStats,
  BulkOperationRequest,
  BulkOperationResponse,
  HierarchyResponse
} from '../../types/supporter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.assamnyay.com';

export const supportersApi = createApi({
  reducerPath: 'supportersApi',
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
  tagTypes: ['Supporter', 'SupporterStats'],
  endpoints: (builder) => ({
    // Get all supporters with filters
    getSupporters: builder.query<
      { data: Supporter[]; pagination: { page: number; limit: number; total: number; pages: number } },
      SupporterFilters
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
        return `supporters?${params.toString()}`;
      },
      providesTags: ['Supporter'],
    }),

    // Get supporter by ID
    getSupporterById: builder.query<Supporter, number>({
      query: (id) => `supporters/${id}`,
      providesTags: (_, __, id) => [{ type: 'Supporter', id }],
    }),

    // Create supporter
    createSupporter: builder.mutation<Supporter, CreateSupporterRequest>({
      query: (data) => ({
        url: 'supporters',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Supporter', 'SupporterStats'],
    }),

    // Update supporter
    updateSupporter: builder.mutation<Supporter, { id: number; data: UpdateSupporterRequest }>({
      query: ({ id, data }) => ({
        url: `supporters/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Supporter', id },
        'Supporter',
        'SupporterStats',
      ],
    }),

    // Toggle supporter status
    toggleSupporterStatus: builder.mutation<{ success: boolean; message: string }, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `supporters/${id}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Supporter', id },
        'Supporter',
        'SupporterStats',
      ],
    }),

    // Delete supporter
    deleteSupporter: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `supporters/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'Supporter', id },
        'Supporter',
        'SupporterStats',
      ],
    }),

    // Get supporter statistics
    getSupporterStats: builder.query<SupporterStats, SupporterFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
        return `supporters/stats?${params.toString()}`;
      },
      providesTags: ['SupporterStats'],
    }),

    // Bulk operations
    bulkOperation: builder.mutation<BulkOperationResponse, BulkOperationRequest>({
      query: (data) => ({
        url: 'supporters/bulk',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Supporter', 'SupporterStats'],
    }),

    // Get hierarchy for form dropdowns
    getHierarchy: builder.query<HierarchyResponse, { state_id: number; party_id: number }>({
      query: ({ state_id, party_id }) => `campaigns/hierarchy?state_id=${state_id}&party_id=${party_id}`,
    }),
  }),
});

export const {
  useGetSupportersQuery,
  useGetSupporterByIdQuery,
  useCreateSupporterMutation,
  useUpdateSupporterMutation,
  useToggleSupporterStatusMutation,
  useDeleteSupporterMutation,
  useGetSupporterStatsQuery,
  useBulkOperationMutation,
  useGetHierarchyQuery,
} = supportersApi;