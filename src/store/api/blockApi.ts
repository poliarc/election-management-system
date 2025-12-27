import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Types
export interface Block {
    id: number;
    levelName: string;
    displayName: string;
    parentId: number | null;
    parentAssemblyId: number;
    partyLevelId: number;
    isActive: number;
    isDelete: number;
    created_at: string;
    updated_at: string;
    assemblyName: string;
    partyLevelName: string;
    total_users?: number;
    active_users?: number;
}

export interface CreateBlockRequest {
    levelName: string; // Can be any level type (Block, Mandal, Ward, Booth, etc.)
    displayName: string;
    parentAssemblyId?: number; // Optional for Block
    parentId?: number; // Optional for Mandal
    partyLevelId?: number | null; // Optional - allows creating any level type
}

export interface BlockAssignment {
    assignment_id: number;
    user_id: number;
    afterAssemblyData_id: number;
    created_at: string;
}

export interface CreateBlockAssignmentRequest {
    user_id: number;
    afterAssemblyData_id: number;
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
    isSuperAdmin: number;
}

export interface PartyLevel {
    party_wise_id: number;
    level_name: string;
    display_level_name: string;
    parent_level: number | null;
    party_id: number;
    party_level_admin_id: number;
    state_id: number;
    isActive: number;
    party_name: string;
    admin_name: string;
    admin_email: string;
    state_name: string;
    parent_level_name: string | null;
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export const blockApi = createApi({
    reducerPath: "blockApi",
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
    tagTypes: ["Block", "BlockAssignment", "UserByParty", "PartyLevel"],
    endpoints: (builder) => ({
        createBlock: builder.mutation<Block, CreateBlockRequest>({
            query: (body) => ({
                url: "/after-assembly-data/create",
                method: "POST",
                body,
            }),
            transformResponse: (response: ApiResponse<Block>) => response.data,
            invalidatesTags: ["Block"],
        }),

        getBlocksByAssembly: builder.query<Block[], number>({
            query: (parentAssemblyId) =>
                `/after-assembly-data/assembly/${parentAssemblyId}`,
            transformResponse: (response: ApiResponse<Block[]>) => {
                console.log("=== Blocks List API Response ===");
                console.log("Blocks data:", response.data);

                // Return blocks with user counts
                const blocks = response.data || [];
                return blocks;
            },
            providesTags: ["Block"],
        }),

        getUsersByParty: builder.query<UserByParty[], number>({
            query: (partyId) => `/users/by-party/${partyId}`,
            transformResponse: (response: ApiResponse<UserByParty[]>) =>
                response.data || [],
            providesTags: ["UserByParty"],
        }),

        getUsersWithFilter: builder.query<
            { users: UserByParty[]; pagination: { page: number; limit: number; total: number; totalPages: number } },
            { stateId?: number; partyId?: number; page?: number; limit?: number; search?: string }
        >({
            query: ({ stateId, partyId, page = 1, limit = 20, search = "" }) => {
                let url = `/users/filter?page=${page}&limit=${limit}`;

                // Include party_id and state_id - ensure state_id is always included if available
                if (partyId) url += `&party_id=${partyId}`;
                if (stateId) url += `&state_id=${stateId}`;

                // If stateId is missing, log a warning
                if (!stateId) {
                    console.warn("getUsersWithFilter: state_id is missing from API call. This may limit user filtering to the correct state.");
                }

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

        getPartyLevelsByParty: builder.query<PartyLevel[], number>({
            query: (partyId) => `/party-wise-level/party/${partyId}`,
            transformResponse: (response: ApiResponse<PartyLevel[]>) =>
                response.data || [],
            providesTags: ["PartyLevel"],
        }),

        createBlockAssignment: builder.mutation<
            BlockAssignment,
            CreateBlockAssignmentRequest
        >({
            query: (body) => ({
                url: "/user-after-assembly-hierarchy/assign",
                method: "POST",
                body,
            }),
            transformResponse: (response: ApiResponse<BlockAssignment>) =>
                response.data,
            invalidatesTags: ["BlockAssignment", "Block"],
        }),

        getBlockAssignments: builder.query<any, number>({
            query: (afterAssemblyDataId) => {
                console.log("=== API Call Debug ===");
                console.log("Calling API with afterAssemblyDataId:", afterAssemblyDataId);
                console.log("Full URL:", `/user-after-assembly-hierarchy/after-assembly/${afterAssemblyDataId}`);
                return `/user-after-assembly-hierarchy/after-assembly/${afterAssemblyDataId}`;
            },
            transformResponse: (response: ApiResponse<any>) => {
                console.log("=== API Response Debug ===");
                console.log("Raw response:", response);
                console.log("response.data:", response.data);
                console.log("response.data.users:", response.data?.users);
                console.log("========================");

                // The API returns data with afterAssemblyData and users
                if (response.data && response.data.users) {
                    return response.data;
                }
                return { users: [], afterAssemblyData: null, total_users: 0 };
            },
            providesTags: ["BlockAssignment"],
        }),
    }),
});

export const {
    useCreateBlockMutation,
    useGetBlocksByAssemblyQuery,
    useGetUsersByPartyQuery,
    useGetUsersWithFilterQuery,
    useGetPartyLevelsByPartyQuery,
    useCreateBlockAssignmentMutation,
    useGetBlockAssignmentsQuery,
} = blockApi;
