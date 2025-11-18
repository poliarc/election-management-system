import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Role, RoleForm } from "../../types/role";

// API response wrappers (assumed structure)
interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: T;
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

// Backend role structure from API response
interface BackendRole {
  role_id: number;
  role: string;
  isActive: number; // 0 or 1
  isDelete: number;
  created_at: string;
  updated_at: string;
}

// Transform backend role to frontend Role type
function transformRole(backendRole: BackendRole): Role {
  return {
    role_id: backendRole.role_id,
    roleName: backendRole.role, // Map 'role' field to 'roleName'
    isActive: backendRole.isActive === 1, // Convert number to boolean
    created_at: backendRole.created_at,
  };
}

export const roleApi = createApi({
  reducerPath: "roleApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${
      import.meta.env.VITE_API_BASE_URL || "https://backend.peopleconnect.in"
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
  tagTypes: ["Role"],
  endpoints: (builder) => ({
    getRoles: builder.query<Role[], void>({
      query: () => "/roles/all",
      transformResponse: (response: ApiListResponse<BackendRole[]>) =>
        (response.data || []).map(transformRole),
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: "Role" as const, id: r.role_id })),
              { type: "Role", id: "LIST" },
            ]
          : [{ type: "Role", id: "LIST" }],
    }),
    getRoleById: builder.query<Role, number | string>({
      query: (id) => `/roles/single/${id}`,
      transformResponse: (response: ApiItemResponse<BackendRole>) =>
        transformRole(response.data),
      providesTags: (result) =>
        result ? [{ type: "Role", id: result.role_id }] : [],
    }),
    createRole: builder.mutation<Role, RoleForm>({
      query: (body) => ({
        url: "/roles/create-role",
        method: "POST",
        body: { role: body.roleName, isActive: body.isActive },
      }),
      transformResponse: (response: ApiItemResponse<BackendRole>) =>
        transformRole(response.data),
      invalidatesTags: [{ type: "Role", id: "LIST" }],
    }),
    updateRole: builder.mutation<Role, { id: number | string; data: RoleForm }>(
      {
        query: ({ id, data }) => ({
          url: `/roles/update/${id}`,
          method: "PUT",
          body: { role: data.roleName, isActive: data.isActive },
        }),
        transformResponse: (response: ApiItemResponse<BackendRole>) =>
          transformRole(response.data),
        invalidatesTags: (result) =>
          result
            ? [
                { type: "Role", id: result.role_id },
                { type: "Role", id: "LIST" },
              ]
            : [{ type: "Role", id: "LIST" }],
      }
    ),
    activateRole: builder.mutation<ApiActionResponse, number | string>({
      query: (id) => ({
        url: `/roles/${id}/activate`,
        method: "PATCH",
        body: {},
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Role", id },
        { type: "Role", id: "LIST" },
      ],
    }),
    deactivateRole: builder.mutation<ApiActionResponse, number | string>({
      query: (id) => ({
        url: `/roles/${id}/deactivate`,
        method: "PATCH",
        body: {},
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Role", id },
        { type: "Role", id: "LIST" },
      ],
    }),
    deleteRole: builder.mutation<ApiActionResponse, number | string>({
      query: (id) => ({
        url: `/roles/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Role", id },
        { type: "Role", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useActivateRoleMutation,
  useDeactivateRoleMutation,
  useDeleteRoleMutation,
} = roleApi;
