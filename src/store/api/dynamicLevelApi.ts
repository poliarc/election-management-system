import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export interface DynamicLevelMetaData {
    stateId: number;
    levelName: string;
    parentLevelName: string;
    totalItems: number;
    totalUsers: number;
    totalActiveUsers: number;
    totalInactiveUsers: number;
    levelWithoutUsers: number;
}

export interface DistrictItem {
    id: number;
    levelName: string;
    ParentId: number;
}

export interface AssemblyItem {
    id: number;
    levelName: string;
    ParentId: number;
}

export interface HierarchicalItem {
    id: number;
    name: string;
    parentId: number | null;
}

export interface HierarchicalList {
    levelName: string;
    list: HierarchicalItem[];
}

export interface DynamicLevelItem {
    itemId: number;
    itemName: string;
    itemLevelType: string;
    parentItemId: number | null;
    parentItemName: string | null;
    parentItemLevelType: string | null;
    assemblyId: number;
    assemblyName: string;
    districtId: number;
    districtName: string;
    users: any[];
    userCount: number;
}

export interface DynamicLevelPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface DynamicLevelData {
    metaData: DynamicLevelMetaData;
    districtList: DistrictItem[];
    assemblyList: AssemblyItem[];
    hierarchicalList: HierarchicalList[];
    items: DynamicLevelItem[];
    pagination?: DynamicLevelPagination;
}

export interface DynamicLevelQueryParams {
    stateId: number;
    partyId: number;
    levelName: string;
    districtId?: number;
    assemblyId?: number;
    blockId?: number;
    mandalId?: number;
    page?: number;
    limit?: number;
}

export const dynamicLevelApi = createApi({
    reducerPath: "dynamicLevelApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api/v2/dash`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("auth_access_token");
            if (token) headers.set("Authorization", `Bearer ${token}`);
            headers.set("Content-Type", "application/json");
            return headers;
        },
    }),
    tagTypes: ["DynamicLevel"],
    endpoints: (builder) => ({
        getDynamicLevelData: builder.query<DynamicLevelData, DynamicLevelQueryParams>({
            query: ({ stateId, partyId, levelName, districtId, assemblyId, blockId, mandalId, page = 1, limit = 20 }) => {
                const params: Record<string, any> = {
                    partyId,
                    levelName,
                    page,
                    limit,
                };
                
                // Add optional filter parameters
                if (districtId && districtId > 0) params.districtId = districtId;
                if (assemblyId && assemblyId > 0) params.assemblyId = assemblyId;
                
                // After assembly, use afterAssemblyId for any after-assembly level
                // Priority: mandalId > blockId (last selected level wins)
                // This works for any level after assembly (Block, Mandal, PollingCenter, Ward, Zone, Sector, etc.)
                if (mandalId && mandalId > 0) {
                    params.afterAssemblyId = mandalId;
                } else if (blockId && blockId > 0) {
                    params.afterAssemblyId = blockId;
                }
                
                return {
                    url: `/dynamicLevelV2/${stateId}`,
                    params,
                };
            },
            transformResponse: (response: ApiResponse<DynamicLevelData> & { pagination?: DynamicLevelPagination }) => ({
                ...response.data,
                pagination: response.pagination
            }),
            providesTags: (_result, _error, { stateId, partyId, levelName, districtId, assemblyId, blockId, mandalId, page }) => [
                { 
                    type: "DynamicLevel", 
                    id: `${stateId}-${partyId}-${levelName}-${districtId || 0}-${assemblyId || 0}-${blockId || 0}-${mandalId || 0}-${page || 1}` 
                },
                { type: "DynamicLevel", id: "LIST" },
            ],
        }),
    }),
});

export const {
    useGetDynamicLevelDataQuery,
    useLazyGetDynamicLevelDataQuery,
} = dynamicLevelApi;
