import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Types
export interface Assembly {
    stateMasterData_id: number;
    levelName: string;
    levelType: string;
    parentId: number;
    parentLevelName?: string;
    parentLevelType?: string;
    created_at?: string;
}

export interface CreateAssemblyRequest {
    levelName: string;
    levelType: "Assembly";
    ParentId: number;
}

export interface AssemblyAssignment {
    assignment_id: number;
    user_id: number;
    stateMasterData_id: number;
    levelName: string;
    levelType: string;
    created_at: string;
}

export interface CreateAssemblyAssignmentRequest {
    user_id: number;
    stateMasterData_id: number;
}

export interface UserByParty {
    districtName: string;
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    contact_no: string;
    party_id: number;
    role_id: number;
    partyName: string;
    role: string;
    isActive: number;
    stateName: string;
    isSuperAdmin?: number;
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export const assemblyApi = createApi({
    reducerPath: "assemblyApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("auth_access_token");
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            headers.set("Content-Type", "application/json");
            return headers;
        },
    }),
    tagTypes: ["Assembly", "AssemblyAssignment", "UserByParty"],
    endpoints: (builder) => ({
        createAssembly: builder.mutation<Assembly, CreateAssemblyRequest>({
            query: (body) => ({
                url: "/state-master-data/create-state-master-data",
                method: "POST",
                body,
            }),
            transformResponse: (response: ApiResponse<Assembly>) => response.data,
            invalidatesTags: ["Assembly"],
        }),

        getUsersByParty: builder.query<UserByParty[], number>({
            query: (partyId) => `/users/by-party/${partyId}`,
            transformResponse: (response: ApiResponse<UserByParty[]>) =>
                response.data || [],
            providesTags: ["UserByParty"],
        }),

        getUsersByPartyAndState: builder.query<
            { users: UserByParty[]; pagination: { page: number; limit: number; total: number; totalPages: number } },
            { partyId?: number; stateId?: number; page?: number; limit?: number; search?: string }
        >({
            query: ({ partyId, stateId, page = 1, limit = 20, search = "" }) => {
                let url = `/users/filter?page=${page}&limit=${limit}`;
                if (partyId) url += `&party_id=${partyId}`;
                if (stateId) url += `&state_id=${stateId}`;
                if (search) url += `&search=${encodeURIComponent(search)}`;

                // Log warning if state_id is missing
                if (!stateId) {
                    console.warn("API Call: state_id is missing from /users/filter call. This may limit user filtering.");
                }

                return url;
            },
            transformResponse: (response: ApiResponse<UserByParty[]> & { pagination?: any }) => {
                const users = response.data || [];
                // Filter out super admin users by both isSuperAdmin flag and role name
                const filteredUsers = users.filter(user => {
                    // Check isSuperAdmin flag
                    if (user.isSuperAdmin === 1) {
                        return false;
                    }
                    // Also check role name as fallback
                    const roleName = (user.role || "").toLowerCase().replace(/\s+/g, "");
                    return roleName !== "superadmin";
                });
                return {
                    users: filteredUsers,
                    pagination: response.pagination || { page: 1, limit: 20, total: filteredUsers.length, totalPages: 1 }
                };
            },
            providesTags: ["UserByParty"],
        }),

        getAllUsersWithFilter: builder.query<
            { users: UserByParty[]; pagination: { page: number; limit: number; total: number; totalPages: number } },
            { page?: number; limit?: number; search?: string; stateId?: number; partyId?: number }
        >({
            query: ({ page = 1, limit = 20, search = "", stateId, partyId }) => {
                let url = `/users/filter?page=${page}&limit=${limit}`;

                // Include state_id and party_id only if they have valid values
                if (partyId) url += `&party_id=${partyId}`;
                if (stateId) url += `&state_id=${stateId}`;

                if (search) url += `&search=${encodeURIComponent(search)}`;
                return url;
            },
            transformResponse: (response: ApiResponse<UserByParty[]> & { pagination?: any }) => {
                const users = response.data || [];
                // Filter out super admin users
                const filteredUsers = users.filter(user => {
                    if (user.isSuperAdmin === 1) return false;
                    const roleName = (user.role || "").toLowerCase().replace(/\s+/g, "");
                    return roleName !== "superadmin";
                });
                return {
                    users: filteredUsers,
                    pagination: response.pagination || { page: 1, limit: 20, total: filteredUsers.length, totalPages: 1 }
                };
            },
            providesTags: ["UserByParty"],
        }),

        getAssemblyByState: builder.query<
            { success: boolean; message: string; data: { stateHierarchy: Assembly[]; afterAssemblyHierarchy: any[] } },
            { state_id: number; party_id: number }
        >({
            query: ({ state_id, party_id }) => `/campaigns/hierarchy?state_id=${state_id}&party_id=${party_id}`,
            transformResponse: (response: any) => {
                if (response.success) {
                    return response;
                }
                throw new Error(response.message || 'Failed to fetch assemblies');
            },
            providesTags: ["Assembly"],
        }),

        createAssemblyAssignment: builder.mutation<
            AssemblyAssignment,
            CreateAssemblyAssignmentRequest
        >({
            query: (body) => ({
                url: "/user-state-hierarchies/create-user-state-hierarchy",
                method: "POST",
                body,
            }),
            transformResponse: (response: ApiResponse<AssemblyAssignment>) =>
                response.data,
            invalidatesTags: ["AssemblyAssignment"],
        }),
    }),
});

export const {
    useCreateAssemblyMutation,
    useGetUsersByPartyQuery,
    useGetUsersByPartyAndStateQuery,
    useGetAllUsersWithFilterQuery,
    useGetAssemblyByStateQuery,
    useCreateAssemblyAssignmentMutation,
} = assemblyApi;
