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
    role_id: number | null;
    state_id?: number;
    district_id?: number;
    partyName?: string;
    role?: string | null;
    stateName?: string;
    districtName?: string;
    isActive: number; // 0 or 1
    isSuperAdmin: number; // 0 or 1
    created_on: string;
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
        role_id: backendUser.role_id || undefined,
        state_id: backendUser.state_id,
        district_id: backendUser.district_id,
        partyName: backendUser.partyName,
        role: backendUser.role || undefined,
        stateName: backendUser.stateName,
        districtName: backendUser.districtName,
        isActive: backendUser.isActive === 1,
        created_at: backendUser.created_on,
    };
}

export const partyUserApi = createApi({
    reducerPath: "partyUserApi",
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
    tagTypes: ["PartyUser", "Party", "Role"],
    endpoints: (builder) => ({
        getUsersByParty: builder.query<
            {
                data: User[];
                pagination: {
                    page: number;
                    limit: number;
                    total: number;
                    totalPages: number;
                };
            },
            { partyId: number; params: UserSearchParams }
        >({
            query: ({ partyId, params }) => ({
                url: `/users/by-party/${partyId}`,
                params: {
                    page: params.page,
                    limit: params.limit,
                    search: params.search,
                    isActive: params.isActive,
                    role_id: params.role_id,
                    state_id: params.state_id,
                    district_id: params.district_id,
                },
            }),
            transformResponse: (response: ApiListResponse<BackendUser[]>) => {
                const allUsers = response.data || [];
                const filteredUsers = allUsers.filter((user) => user.isSuperAdmin !== 1);
                const superAdminCount = allUsers.length - filteredUsers.length;

                return {
                    data: filteredUsers.map(transformUser),
                    pagination: response.pagination
                        ? {
                            ...response.pagination,
                            total: Math.max(0, response.pagination.total - superAdminCount),
                        }
                        : {
                            page: 1,
                            limit: 25,
                            total: filteredUsers.length,
                            totalPages: 1,
                        },
                };
            },
            providesTags: (result, _error, { partyId }) =>
                result
                    ? [
                        ...result.data.map((u) => ({
                            type: "PartyUser" as const,
                            id: u.user_id,
                        })),
                        { type: "PartyUser", id: `PARTY-${partyId}` },
                    ]
                    : [{ type: "PartyUser", id: `PARTY-${partyId}` }],
        }),

        getUserById: builder.query<User, number | string>({
            query: (id) => `/users/single/${id}`,
            transformResponse: (response: ApiItemResponse<BackendUser>) =>
                transformUser(response.data),
            providesTags: (result) =>
                result ? [{ type: "PartyUser", id: result.user_id }] : [],
        }),

        getParties: builder.query<Party[], void>({
            query: () => ({
                url: "/parties/all",
                params: {
                    page: 1,
                    limit: 100,
                },
            }),
            transformResponse: (response: ApiListResponse<Party[]>) =>
                (response.data || []).filter((party) => party.isActive === 1),
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
            invalidatesTags: (_result, _error, arg) => [
                { type: "PartyUser", id: `PARTY-${arg.party_id}` },
            ],
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
                    ...(data.state_id !== undefined && {
                        state_id: Number(data.state_id),
                    }),
                    ...(data.district_id !== undefined && {
                        district_id: Number(data.district_id),
                    }),
                },
            }),
            transformResponse: (response: ApiItemResponse<BackendUser>) =>
                transformUser(response.data),
            invalidatesTags: (result) =>
                result
                    ? [
                        { type: "PartyUser", id: result.user_id },
                        { type: "PartyUser", id: `PARTY-${result.party_id}` },
                    ]
                    : [],
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
                { type: "PartyUser", id },
            ],
        }),

        deleteUser: builder.mutation<ApiActionResponse, number | string>({
            query: (id) => ({
                url: `/users/delete/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [{ type: "PartyUser", id }],
        }),

        bulkUploadUsers: builder.mutation<ApiActionResponse, FormData>({
            query: (formData) => ({
                url: "/users/bulk-upload",
                method: "POST",
                body: formData,
                prepareHeaders: (headers: Headers) => {
                    headers.delete("Content-Type");
                    return headers;
                },
            }),
            invalidatesTags: [{ type: "PartyUser", id: "LIST" }],
        }),
    }),
});

export const {
    useGetUsersByPartyQuery,
    useGetUserByIdQuery,
    useGetPartiesQuery,
    useGetRolesQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useToggleUserStatusMutation,
    useDeleteUserMutation,
    useBulkUploadUsersMutation,
} = partyUserApi;
