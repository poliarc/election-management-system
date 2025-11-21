import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface StateMasterData {
  stateMasterData_id: number;
  levelName: string;
  levelType: string;
  parentId: number;
  created_at?: string;
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

export const stateMasterApi = createApi({
  reducerPath: "stateMasterApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL || "https://backend.peopleconnect.in"
      }/api`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("auth_access_token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["StateMaster", "UserHierarchyAssignment"],
  endpoints: (builder) => ({
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
  }),
});

export const {
  useCreateStateMasterDataMutation,
  useCreateUserHierarchyAssignmentMutation,
  useDeleteAssignedLocationsMutation,
} = stateMasterApi;
