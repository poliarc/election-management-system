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
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export const assemblyApi = createApi({
    reducerPath: "assemblyApi",
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
    useCreateAssemblyAssignmentMutation,
} = assemblyApi;
