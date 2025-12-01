import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Block Level Info
export interface BlockLevelInfo {
    id: number;
    levelName: string;
    displayName: string;
    parentId: number | null;
    parentAssemblyId: number;
    partyLevelId: number;
    isActive: number;
    created_at: string;
    updated_at: string;
    assembly_id: number;
    assemblyName: string;
    assemblyType: string;
    assemblyParentId: number;
    party_wise_id: number;
    partyLevelName: string;
    partyLevelDisplayName: string;
    partyLevelPartyId: number;
}

// Block Team User
export interface BlockTeamUser {
    assignment_id: number;
    user_id: number;
    afterAssemblyData_id: number;
    assignment_active: number;
    assigned_at: string;
    assignment_updated_at: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    contact_no: string;
    dob: string | null;
    sex: string | null;
    party_id: number;
    role_id: number | null;
    state_id: number;
    district_id: number;
    profileImage: string | null;
    user_active: number;
    isSuperAdmin: number;
    is_youth: number;
    is_women: number;
    is_employee: number;
    is_minority: number;
    is_sc: number;
    is_st: number;
    is_obc: number;
    user_created_at: string;
    partyName: string;
    partyCode: string;
    party_type_id: number;
    party_type: string;
    party_admin_id: number;
    role_name: string | null;
    stateName: string;
    districtName: string;
    levelName: string;
    displayName: string;
    parentId: number | null;
    parentAssemblyId: number;
    assemblyName: string;
    assemblyType: string;
}

// Block Team Response
export interface BlockTeamResponse {
    success: boolean;
    message: string;
    level: BlockLevelInfo;
    users: BlockTeamUser[];
    total_users: number;
}

// Block Hierarchy Child (Mandal)
export interface BlockHierarchyChild {
    id: number;
    levelName: string;
    displayName: string;
    parentId: number;
    parentAssemblyId: number | null;
    partyLevelId: number;
    isActive: number;
    created_at: string;
    updated_at: string;
    assemblyName: string | null;
    assemblyType: string | null;
    partyLevelName: string;
    partyLevelDisplayName: string;
    partyLevelPartyId: number;
    assigned_users: any[];
    user_count: number;
}

// Block Hierarchy Parent Info
export interface BlockHierarchyParent {
    id: number;
    levelName: string;
    displayName: string;
    parentId: number | null;
    parentAssemblyId: number;
    partyLevelId: number;
    isActive: number;
    created_at: string;
    updated_at: string;
    assemblyName: string;
    assemblyType: string;
    partyLevelName: string;
    partyLevelDisplayName: string;
    partyLevelPartyId: number;
}

// Block Hierarchy Response
export interface BlockHierarchyResponse {
    success: boolean;
    message: string;
    parent: BlockHierarchyParent;
    children: BlockHierarchyChild[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export const blockTeamApi = createApi({
    reducerPath: 'blockTeamApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('auth_access_token');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['BlockTeam', 'BlockHierarchy'],
    endpoints: (builder) => ({
        getBlockTeam: builder.query<BlockTeamResponse, number>({
            query: (levelId) => `/user-after-assembly-hierarchy/level/${levelId}/users`,
            providesTags: ['BlockTeam'],
        }),
        getBlockHierarchy: builder.query<BlockHierarchyResponse, number>({
            query: (levelId) => `/user-after-assembly-hierarchy/hierarchy/children/${levelId}`,
            providesTags: ['BlockHierarchy'],
        }),
    }),
});

export const { useGetBlockTeamQuery, useGetBlockHierarchyQuery } = blockTeamApi;
