import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  User,
  UserForm,
  UserSearchParams,
  Party,
  Role,
} from "../../types/user";

// API response wrappers
interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
interface ApiItemResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
interface ApiActionResponse {
  success: boolean;
  message: string;
}

// Backend user structure from API response
interface BackendUser {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  contact_no: string;
  party_id: number;
  role_id: number;
  state_id?: number;
  district_id?: number;
  partyName?: string;
  role?: string;
  stateName?: string;
  districtName?: string;
  isActive: number; // 0 or 1
  isSuperAdmin: number; // 0 or 1
  created_at: string;
}

// Transform backend user to frontend User type
function transformUser(backendUser: BackendUser): User {
  return {
    user_id: backendUser.user_id,
    first_name: backendUser.first_name,
    last_name: backendUser.last_name,
    email: backendUser.email,
    contact_no: backendUser.contact_no,
    party_id: backendUser.party_id,
    role_id: backendUser.role_id,
    state_id: backendUser.state_id,
    district_id: backendUser.district_id,
    partyName: backendUser.partyName,
    role: backendUser.role,
    stateName: backendUser.stateName,
    districtName: backendUser.districtName,
    isActive: backendUser.isActive === 1,
    created_at: backendUser.created_at,
  };
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL || "https://backend.peopleconnect.in"
      }/api`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("auth_access_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["User", "Party", "Role"],
  endpoints: (builder) => ({
    getUsers: builder.query<{ data: User[]; pagination: { page: number; limit: number; total: number; totalPages: number } }, UserSearchParams>({
      query: (params) => ({
        url: "/users/all",
        params: {
          page: params.page,
          limit: params.limit,
          search: params.search,
          isActive: params.isActive,
          party_id: params.party_id,
          role_id: params.role_id,
        },
      }),
      transformResponse: (response: ApiListResponse<BackendUser[]>) => ({
        data: (response.data || [])
          .filter((user) => user.isSuperAdmin !== 1) // Exclude super admin users
          .map(transformUser),
        pagination: response.pagination || { page: 1, limit: 25, total: 0, totalPages: 0 },
      }),
      providesTags: (result) =>
        result
          ? [
            ...result.data.map((u) => ({ type: "User" as const, id: u.user_id })),
            { type: "User", id: "LIST" },
          ]
          : [{ type: "User", id: "LIST" }],
    }),
    getUserById: builder.query<User, number | string>({
      query: (id) => `/users/single/${id}`,
      transformResponse: (response: ApiItemResponse<BackendUser>) =>
        transformUser(response.data),
      providesTags: (result) =>
        result ? [{ type: "User", id: result.user_id }] : [],
    }),
    getParties: builder.query<Party[], void>({
      query: () => ({
        url: "/parties/all",
        params: {
          page: 1,
          limit: 100, // Get enough parties for dropdown
        },
      }),
      transformResponse: (response: ApiListResponse<Party[]>) =>
        (response.data || []).filter((party) => party.isActive === 1), // Only active parties
      providesTags: [{ type: "Party", id: "LIST" }],
    }),
    getRoles: builder.query<Role[], void>({
      query: () => "/roles/all",
      transformResponse: (response: ApiListResponse<Role[]>) =>
        response.data || [],
      providesTags: [{ type: "Role", id: "LIST" }],
    }),
    createUser: builder.mutation<User, UserForm>({
      query: (body) => ({
        url: "/users/create-user",
        method: "POST",
        body: {
          ...body,
          party_id: Number(body.party_id),
          ...(body.role_id && { role_id: Number(body.role_id) }),
          ...(body.state_id && { state_id: Number(body.state_id) }),
          ...(body.district_id && { district_id: Number(body.district_id) }),
        },
      }),
      transformResponse: (response: ApiItemResponse<BackendUser>) =>
        transformUser(response.data),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
    updateUser: builder.mutation<
      User,
      { id: number | string; data: Partial<UserForm> }
    >({
      query: ({ id, data }) => ({
        url: `/users/update/${id}`,
        method: "PUT",
        body: {
          ...data,
          ...(data.party_id !== undefined && {
            party_id: Number(data.party_id),
          }),
          ...(data.role_id !== undefined && { role_id: Number(data.role_id) }),
          ...(data.state_id !== undefined && { state_id: Number(data.state_id) }),
          ...(data.district_id !== undefined && { district_id: Number(data.district_id) }),
        },
      }),
      transformResponse: (response: ApiItemResponse<BackendUser>) =>
        transformUser(response.data),
      invalidatesTags: (result) =>
        result
          ? [
            { type: "User", id: result.user_id },
            { type: "User", id: "LIST" },
          ]
          : [{ type: "User", id: "LIST" }],
    }),
    toggleUserStatus: builder.mutation<
      ApiActionResponse,
      { id: number | string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/users/${id}/toggle-status`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
    deleteUser: builder.mutation<ApiActionResponse, number | string>({
      query: (id) => ({
        url: `/users/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
    bulkUploadUsers: builder.mutation<ApiActionResponse, FormData>({
      query: (formData) => ({
        url: "/users/bulk-upload",
        method: "POST",
        body: formData,
        prepareHeaders: (headers: Headers) => {
          // Remove Content-Type header to let browser set it with boundary
          headers.delete("Content-Type");
          return headers;
        },
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetPartiesQuery,
  useGetRolesQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useToggleUserStatusMutation,
  useDeleteUserMutation,
  useBulkUploadUsersMutation,
} = userApi;
