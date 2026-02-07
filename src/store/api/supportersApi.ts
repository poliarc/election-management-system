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
      { success: boolean; message: string; data: Supporter[]; pagination: { page: number; limit: number; total: number; pages: number } },
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
      transformResponse: (response: any) => {
        // Handle the API response structure
        if (response.success) {
          return {
            success: response.success,
            message: response.message,
            data: response.data,
            pagination: response.pagination
          };
        }
        throw new Error(response.message || 'Failed to fetch supporters');
      },
    }),

    // Get supporter by ID
    getSupporterById: builder.query<Supporter, number>({
      query: (id) => `supporters/${id}`,
      providesTags: (_, __, id) => [{ type: 'Supporter', id }],
      transformResponse: (response: any) => {
        // Handle the API response structure
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch supporter');
      },
    }),

    // Create supporter
    createSupporter: builder.mutation<Supporter, CreateSupporterRequest>({
      query: (data) => ({
        url: 'supporters',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Supporter', 'SupporterStats'],
      transformResponse: (response: any) => {
        // Handle the API response structure
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to create supporter');
      },
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
      transformResponse: (response: any) => {
        // Handle the API response structure
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to update supporter');
      },
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
      transformResponse: (response: any) => {
        // Handle the API response structure
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch supporter stats');
      },
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

    // Get supporters by state
    getSupportersByState: builder.query<
      { success: boolean; message: string; data: Supporter[]; pagination: { page: number; limit: number; total: number; pages: number } },
      { stateId: number; page?: number; limit?: number; search?: string; districtId?: number; assemblyId?: number; blockId?: number; userId?: number }
    >({
      query: ({ stateId, page = 1, limit = 10, search, districtId, assemblyId, blockId, userId }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        
        if (search) {
          params.append('search', search);
        }
        
        if (districtId) {
          params.append('district_id', districtId.toString());
        }
        
        if (assemblyId) {
          params.append('assembly_id', assemblyId.toString());
        }
        
        if (blockId) {
          params.append('block_id', blockId.toString());
        }
        
        if (userId) {
          params.append('created_by', userId.toString());
        }
        
        return `supporters/state/${stateId}?${params.toString()}`;
      },
      providesTags: ['Supporter'],
      transformResponse: (response: any) => {
        // Handle the API response structure
        if (response.success) {
          return {
            success: response.success,
            message: response.message,
            data: response.data,
            pagination: response.pagination
          };
        }
        throw new Error(response.message || 'Failed to fetch supporters');
      },
    }),

    // Get supporters by district
    getSupportersByDistrict: builder.query<
      { success: boolean; message: string; data: Supporter[]; pagination: { page: number; limit: number; total: number; pages: number } },
      { districtId: number; page?: number; limit?: number; search?: string; assemblyId?: number; blockId?: number; userId?: number }
    >({
      query: ({ districtId, page = 1, limit = 10, search, assemblyId, blockId, userId }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        
        if (search) {
          params.append('search', search);
        }
        
        if (assemblyId) {
          params.append('assembly_id', assemblyId.toString());
        }
        
        if (blockId) {
          params.append('block_id', blockId.toString());
        }
        
        if (userId) {
          params.append('created_by', userId.toString());
        }
        
        return `supporters/district/${districtId}?${params.toString()}`;
      },
      providesTags: ['Supporter'],
      transformResponse: (response: any) => {
        // Handle the API response structure
        if (response.success) {
          return {
            success: response.success,
            message: response.message,
            data: response.data,
            pagination: response.pagination
          };
        }
        throw new Error(response.message || 'Failed to fetch supporters');
      },
    }),

    // Get supporters by assembly
    getSupportersByAssembly: builder.query<
      { success: boolean; message: string; data: Supporter[]; pagination: { page: number; limit: number; total: number; pages: number } },
      { assemblyId: number; page?: number; limit?: number; search?: string; blockId?: number; userId?: number }
    >({
      query: ({ assemblyId, page = 1, limit = 10, search, blockId, userId }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        
        if (search) {
          params.append('search', search);
        }
        
        if (blockId) {
          params.append('block_id', blockId.toString());
        }
        
        if (userId) {
          params.append('created_by', userId.toString());
        }
        
        return `supporters/assembly/${assemblyId}?${params.toString()}`;
      },
      providesTags: ['Supporter'],
      transformResponse: (response: any) => {
        // Handle the API response structure
        if (response.success) {
          return {
            success: response.success,
            message: response.message,
            data: response.data,
            pagination: response.pagination
          };
        }
        throw new Error(response.message || 'Failed to fetch supporters');
      },
    }),

    // Get supporters by created_by user
    getSupportersByCreatedBy: builder.query<
      { success: boolean; message: string; data: Supporter[]; pagination: { page: number; limit: number; total: number; pages: number } },
      { createdBy: number; page?: number; limit?: number }
    >({
      query: ({ createdBy, page = 1, limit = 10 }) =>
        `supporters/created-by/${createdBy}?page=${page}&limit=${limit}`,
      providesTags: ['Supporter'],
      transformResponse: (response: any) => {
        // Handle the API response structure
        if (response.success) {
          return {
            success: response.success,
            message: response.message,
            data: response.data,
            pagination: response.pagination
          };
        }
        throw new Error(response.message || 'Failed to fetch supporters');
      },
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
  useGetSupportersByStateQuery,
  useLazyGetSupportersByStateQuery,
  useGetSupportersByDistrictQuery,
  useLazyGetSupportersByDistrictQuery,
  useGetSupportersByAssemblyQuery,
  useLazyGetSupportersByAssemblyQuery,
  useGetSupportersByCreatedByQuery,
  useCreateSupporterMutation,
  useUpdateSupporterMutation,
  useToggleSupporterStatusMutation,
  useDeleteSupporterMutation,
  useGetSupporterStatsQuery,
  useBulkOperationMutation,
  useGetHierarchyQuery,
} = supportersApi;