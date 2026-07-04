import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface StateMasterData {
  id: number;
  stateMasterData_id?: number;
  levelName: string;
  levelType: string;
  ParentId: number | null;
  parentId?: number;
  isActive: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
}

export interface CreateStateMasterDataRequest {
  levelName: string;
  levelType: string; // e.g., "DISTRICT", "Assembly", etc.
  ParentId: number;
}

export interface CreateUserHierarchyAssignmentRequest {
  user_id: number;
  stateMasterData_id: number;
}

export interface DeleteAssignedLocationsRequest {
  userId: number;
  stateMasterData_id: number;
}

export interface DeleteAssignedLocationsResponse {
  success: boolean;
  message: string;
  deleted: Array<{
    id: number;
    locationId: number;
    user_id: number;
  }>;
  errors: any[];
  summary: {
    total: number;
    success: number;
    failed: number;
  };
}

export interface StateLevelDashboardParams {
  state_id: number;
  districtId?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: string;
  search?: string;
}

export interface DistrictUser {
  assignment_id: number;
  user_id: number;
  user_name: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  dob: string | null;
  sex: string | null;
  profileImage: string | null;
  role_id: number | null;
  role_name: string | null;
  is_super_admin: boolean;
  party: {
    party_id: number;
    party_name: string;
    party_code: string;
  };
  is_active: boolean;
  assignment_active: boolean;
  user_active: boolean;
  assigned_at: string;
  assignment_updated_at: string;
  user_created_at: string;
}

export interface DistrictChild {
  location_id: number;
  location_name: string;
  location_type: string;
  parent_id: number;
  total_users: number;
  active_users: number;
  users: DistrictUser[];
}

export interface DistrictListItem {
  id: number;
  levelName: string;
  levelType: string;
  ParentId: number;
}

export interface StateLevelDashboardResponse {
  success: boolean;
  data: {
    data: {
      parent: {
        location_id: number;
        location_name: string;
        location_type: string;
        parent_id: number | null;
      };
      children: DistrictChild[];
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    districtList: DistrictListItem[];
    totalCount: {
      districtTotal: number;
      userCount: number;
      districtWithoutUserCount: number;
    };
  };
}

export interface AssemblyLevelDashboardParams {
  state_id: number;
  districtId?: number;
  page?: number;
  limit?: number;
  search?: string;
}

export interface AssemblyUser {
  dob: string | null;
  sex: string | null;
  email: string;
  party: {
    party_id: number;
    party_code: string;
    party_name: string;
  };
  role_id: number | null;
  user_id: number;
  username: string;
  is_active: boolean;
  last_name: string;
  role_name: string | null;
  user_name: string;
  first_name: string;
  assigned_at: string;
  user_active: boolean;
  profileImage: string | null;
  assignment_id: number;
  mobile_number: string;
  is_super_admin: boolean;
  assignment_active: boolean;
  assignment_updated_at: string;
}

export interface AssemblyItem {
  assemblyId: number;
  assemblyName: string;
  districtId: number;
  districtName: string;
  userCount: number;
  activeUserCount: number;
  inactiveUserCount: number;
  users: AssemblyUser[];
}

export interface DistrictItem {
  districtId: number;
  districtName: string;
}

export interface AssemblyLevelDashboardResponse {
  success: boolean;
  data: {
    metaData: {
      stateId: number;
      stateName: string;
      totalAssemblies: number;
      totalUsers: number;
      totalActiveUsers: number;
      totalInactiveUsers: number;
      assembliesWithoutUsers: number;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    districts: DistrictItem[];
    assemblies: AssemblyItem[];
  };
}

export const stateMasterApi = createApi({
  reducerPath: "stateMasterApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("auth_access_token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["StateMaster", "UserHierarchyAssignment"],
  endpoints: (builder) => ({
    getAllStateMasterData: builder.query<StateMasterData[], void>({
      query: () => "/state-master-data/all",
      transformResponse: (response: any) => {
        console.log("State Master API Full Response:", response);
        // Handle both array and object responses
        if (Array.isArray(response)) {
          return response;
        }
        // If response has data property
        if (response?.data) {
          console.log("State Master Data:", response.data);
          return Array.isArray(response.data) ? response.data : [];
        }
        return [];
      },
      providesTags: ["StateMaster"],
    }),

    createStateMasterData: builder.mutation<
      StateMasterData,
      CreateStateMasterDataRequest
    >({
      query: (body) => ({
        url: "/state-master-data/create-state-master-data",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<StateMasterData>) =>
        response.data,
      invalidatesTags: ["StateMaster"],
    }),

    createUserHierarchyAssignment: builder.mutation<
      { assignment_id: number },
      CreateUserHierarchyAssignmentRequest
    >({
      query: (body) => ({
        url: "/user-state-hierarchies/create-user-state-hierarchy",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<{ assignment_id: number }>) =>
        response.data,
      invalidatesTags: ["UserHierarchyAssignment"],
    }),

    deleteAssignedLocations: builder.mutation<
      DeleteAssignedLocationsResponse,
      DeleteAssignedLocationsRequest
    >({
      query: (body) => ({
        url: "/user-state-hierarchies/delete-assigned-locations",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["UserHierarchyAssignment", "StateMaster"],
    }),

    getStateLevelDashboard: builder.query<
      StateLevelDashboardResponse,
      StateLevelDashboardParams
    >({
      query: ({ state_id, districtId, page = 1, limit = 10, sort_by, order, search }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        
        if (districtId) {
          params.append('districtId', districtId.toString());
        }
        
        if (sort_by) {
          params.append('sort_by', sort_by);
        }
        
        if (order) {
          params.append('order', order);
        }
        
        if (search) {
          params.append('search', search);
        }
        
        return `/v2/dash/statelevel/${state_id}?${params.toString()}`;
      },
      providesTags: ["StateMaster"],
    }),

    getAssemblyLevelDashboard: builder.query<
      AssemblyLevelDashboardResponse,
      AssemblyLevelDashboardParams
    >({
      query: ({ state_id, districtId, page = 1, limit = 10, search }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        
        if (districtId) {
          params.append('districtId', districtId.toString());
        }
        
        if (search) {
          params.append('search', search);
        }
        
        return `/v2/dash/assemblyLevel/${state_id}?${params.toString()}`;
      },
      providesTags: ["StateMaster"],
    }),
  }),
});

export const {
  useGetAllStateMasterDataQuery,
  useCreateStateMasterDataMutation,
  useCreateUserHierarchyAssignmentMutation,
  useDeleteAssignedLocationsMutation,
  useGetStateLevelDashboardQuery,
  useGetAssemblyLevelDashboardQuery,
} = stateMasterApi;
