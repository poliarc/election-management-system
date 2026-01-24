import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreateVisitorRequest,
  UpdateVisitorRequest,
  VisitorFilters,
  VisitorResponse,
  SingleVisitorResponse,
  VisitorStatsResponse,
  BulkOperationRequest,
  BulkOperationResponse,
  ToggleStatusRequest,
  StateMasterResponse,
  AssemblyUsersResponse,
} from '../../types/visitor';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.assamnyay.com';

export const visitorsApi = createApi({
  reducerPath: 'visitorsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("auth_access_token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Visitor', 'VisitorStats', 'StateMaster', 'AssemblyUsers'],
  endpoints: (builder) => ({
    // Get all visitors with filters
    getVisitors: builder.query<VisitorResponse, VisitorFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
        return `visitors?${params.toString()}`;
      },
      providesTags: ['Visitor'],
    }),

    // Get visitor by ID
    getVisitorById: builder.query<SingleVisitorResponse, number>({
      query: (id) => `visitors/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Visitor', id }],
    }),

    // Create visitor
    createVisitor: builder.mutation<SingleVisitorResponse, CreateVisitorRequest>({
      query: (visitor) => ({
        url: 'visitors',
        method: 'POST',
        body: visitor,
      }),
      invalidatesTags: ['Visitor', 'VisitorStats'],
    }),

    // Update visitor
    updateVisitor: builder.mutation<SingleVisitorResponse, { id: number; visitor: UpdateVisitorRequest }>({
      query: ({ id, visitor }) => ({
        url: `visitors/${id}`,
        method: 'PUT',
        body: visitor,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Visitor', id },
        'Visitor',
        'VisitorStats',
      ],
    }),

    // Toggle visitor status
    toggleVisitorStatus: builder.mutation<{ success: boolean; message: string }, { id: number; status: ToggleStatusRequest }>({
      query: ({ id, status }) => ({
        url: `visitors/${id}/status`,
        method: 'PATCH',
        body: status,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Visitor', id },
        'Visitor',
        'VisitorStats',
      ],
    }),

    // Delete visitor (soft delete)
    deleteVisitor: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `visitors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Visitor', id },
        'Visitor',
        'VisitorStats',
      ],
    }),

    // Get visitors by assembly
    getVisitorsByAssembly: builder.query<VisitorResponse, { assemblyId: number; page?: number; limit?: number }>({
      query: ({ assemblyId, page = 1, limit = 10 }) => 
        `visitors/assembly/${assemblyId}?page=${page}&limit=${limit}`,
      providesTags: ['Visitor'],
    }),

    // Get visitors by state
    getVisitorsByState: builder.query<VisitorResponse, { stateId: number; page?: number; limit?: number }>({
      query: ({ stateId, page = 1, limit = 10 }) => 
        `visitors/state/${stateId}?page=${page}&limit=${limit}`,
      providesTags: ['Visitor'],
    }),

    // Get visitors by district
    getVisitorsByDistrict: builder.query<VisitorResponse, { districtId: number; page?: number; limit?: number }>({
      query: ({ districtId, page = 1, limit = 10 }) => 
        `visitors/district/${districtId}?page=${page}&limit=${limit}`,
      providesTags: ['Visitor'],
    }),

    // Get visitors by assembly user
    getVisitorsByAssemblyUser: builder.query<VisitorResponse, { assemblyUserId: number; page?: number; limit?: number }>({
      query: ({ assemblyUserId, page = 1, limit = 10 }) => 
        `visitors/assembly-user/${assemblyUserId}?page=${page}&limit=${limit}`,
      providesTags: ['Visitor'],
    }),

    // Get upcoming follow-ups
    getUpcomingFollowUps: builder.query<VisitorResponse, { 
      follow_up_date_from?: string; 
      follow_up_date_to?: string; 
      assembly_id?: number;
      page?: number;
      limit?: number;
    }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
          }
        });
        return `visitors/follow-ups?${searchParams.toString()}`;
      },
      providesTags: ['Visitor'],
    }),

    // Get visitor statistics
    getVisitorStats: builder.query<VisitorStatsResponse, { assembly_id?: number }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.assembly_id) {
          searchParams.append('assembly_id', String(params.assembly_id));
        }
        return `visitors/stats?${searchParams.toString()}`;
      },
      providesTags: ['VisitorStats'],
    }),

    // Bulk operations
    bulkVisitorOperation: builder.mutation<BulkOperationResponse, BulkOperationRequest>({
      query: (operation) => ({
        url: 'visitors/bulk',
        method: 'POST',
        body: operation,
      }),
      invalidatesTags: ['Visitor', 'VisitorStats'],
    }),

    // Get state master data
    getStateMasterData: builder.query<StateMasterResponse, void>({
      query: () => 'state-master-data/all',
      providesTags: ['StateMaster'],
    }),

    // Get assembly users by assembly ID - using the same endpoint as AssemblyTeam
    getAssemblyUsers: builder.query<AssemblyUsersResponse, number>({
      query: (assemblyId) => `user-state-hierarchies/location/${assemblyId}/users`,
      providesTags: (_result, _error, assemblyId) => [{ type: 'AssemblyUsers', id: assemblyId }],
    }),
  }),
});

export const {
  useGetVisitorsQuery,
  useGetVisitorByIdQuery,
  useCreateVisitorMutation,
  useUpdateVisitorMutation,
  useToggleVisitorStatusMutation,
  useDeleteVisitorMutation,
  useGetVisitorsByAssemblyQuery,
  useGetVisitorsByStateQuery,
  useGetVisitorsByDistrictQuery,
  useGetVisitorsByAssemblyUserQuery,
  useGetUpcomingFollowUpsQuery,
  useGetVisitorStatsQuery,
  useBulkVisitorOperationMutation,
  useGetStateMasterDataQuery,
  useGetAssemblyUsersQuery,
} = visitorsApi;