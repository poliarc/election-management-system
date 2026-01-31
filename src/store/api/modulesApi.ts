import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface SidebarModule {
    module_id: number;
    moduleName: string;
    displayName: string;
    isDefault: number;
    isDisplay: number;
    accessActive: number;
}

export interface GetSidebarModulesParams {
    state_id: number;
    party_id: number;
    party_level_id: number;
}

export const modulesApi = createApi({
    reducerPath: "modulesApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("auth_access_token");
            if (token) headers.set("Authorization", `Bearer ${token}`);
            headers.set("Content-Type", "application/json");
            return headers;
        },
    }),
    tagTypes: ["SidebarModules"],
    endpoints: (builder) => ({
        getSidebarModules: builder.query<SidebarModule[], GetSidebarModulesParams>({
            query: ({ state_id, party_id, party_level_id }) => ({
                url: `/modules/sidebar`,
                params: {
                    state_id,
                    party_id,
                    party_level_id,
                },
            }),
            transformResponse: (response: ApiResponse<SidebarModule[]>) =>
                response.data || [],
            providesTags: (_result, _error, { state_id, party_id, party_level_id }) => [
                { type: "SidebarModules", id: `${state_id}-${party_id}-${party_level_id}` },
            ],
        }),
    }),
});

export const {
    useGetSidebarModulesQuery,
} = modulesApi;