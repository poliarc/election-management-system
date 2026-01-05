import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Types for Registration Links
export interface RegistrationLink {
    link_id: number;
    link_token: string;
    party_id: number;
    party_name: string;
    state_id: number;
    state_name: string;
    district_id?: number | null;
    district_name?: string | null;
    created_by: number;
    isActive: number;
    isDelete: number;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
    party_full_name?: string;
    state_full_name?: string;
    district_full_name?: string | null;
    first_name?: string;
    last_name?: string;
    created_by_email?: string;
    registration_url: string;
}

export interface CreateRegistrationLinkRequest {
    party_id: number;
    party_name: string;
    state_id: number;
    state_name: string;
    district_id?: number | null;
    district_name?: string | null;
    expires_at?: string | null;
}

export interface UpdateRegistrationLinkRequest {
    party_id?: number;
    party_name?: string;
    state_id?: number;
    state_name?: string;
    district_id?: number | null;
    district_name?: string | null;
    isActive?: boolean;
    expires_at?: string | null;
}

export interface RegistrationLinkSearchParams {
    page?: number;
    limit?: number;
    search?: string;
    party_id?: number;
    state_id?: number;
    district_id?: number;
    isActive?: boolean;
    created_by?: number;
    sort_by?: 'created_at' | 'updated_at' | 'expires_at' | 'party_name' | 'state_name' | 'district_name';
    order?: 'asc' | 'desc';
}

interface ApiActionResponse {
    success: boolean;
    message: string;
}

export const registrationLinksApi = createApi({
    reducerPath: "registrationLinksApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api`,
        prepareHeaders: (headers, { getState: _ }) => {
            const token = localStorage.getItem("auth_access_token");
            console.log("Registration Links API - Preparing headers:", {
                baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api`,
                hasToken: !!token,
                token: token ? `${token.substring(0, 20)}...` : null
            });

            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            headers.set("Content-Type", "application/json");
            return headers;
        },
    }),
    tagTypes: ["RegistrationLink"],
    endpoints: (builder) => ({
        // Create a new registration link
        createRegistrationLink: builder.mutation<
            { success: boolean; message: string; data: RegistrationLink },
            CreateRegistrationLinkRequest
        >({
            query: (body) => {
                console.log("Creating registration link with data:", body);
                return {
                    url: "/registration-links/create",
                    method: "POST",
                    body,
                };
            },
            transformResponse: (response: any, _meta, _arg) => {
                console.log("Create registration link response:", response);
                return response;
            },
            transformErrorResponse: (response: any, _meta, _arg) => {
                console.error("Create registration link error:", response);
                return response;
            },
            invalidatesTags: (_result, _error, arg) => [
                { type: "RegistrationLink", id: "LIST" },
                { type: "RegistrationLink", id: `PARTY-${arg.party_id}` },
            ],
        }),

        // Get registration links by party ID
        getRegistrationLinksByParty: builder.query<
            {
                data: RegistrationLink[];
                pagination: {
                    page: number;
                    limit: number;
                    total: number;
                    totalPages: number;
                };
            },
            { partyId: number; params?: Partial<RegistrationLinkSearchParams> }
        >({
            query: ({ partyId, params = {} }) => {
                const queryParams: Record<string, any> = {
                    party_id: partyId,
                };

                if (params.page) queryParams.page = params.page;
                if (params.limit) queryParams.limit = params.limit;
                if (params.search) queryParams.search = params.search;
                if (params.state_id) queryParams.state_id = params.state_id;
                if (params.district_id) queryParams.district_id = params.district_id;
                if (params.isActive !== undefined) queryParams.isActive = params.isActive;
                if (params.created_by) queryParams.created_by = params.created_by;
                if (params.sort_by) queryParams.sort_by = params.sort_by;
                if (params.order) queryParams.order = params.order;

                console.log("Fetching registration links with params:", { partyId, params, queryParams });

                return {
                    url: "/registration-links/all",
                    params: queryParams,
                };
            },
            transformResponse: (response: any, _meta, _arg) => {
                console.log("Get registration links response:", response);
                return {
                    data: response.data || [],
                    pagination: response.pagination || {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0,
                    },
                };
            },
            transformErrorResponse: (response: any, _meta, _arg) => {
                console.error("Get registration links error:", response);
                return response;
            },
            providesTags: (result, _error, { partyId }) =>
                result
                    ? [
                        ...result.data.map((link) => ({
                            type: "RegistrationLink" as const,
                            id: link.link_id,
                        })),
                        { type: "RegistrationLink", id: `PARTY-${partyId}` },
                        { type: "RegistrationLink", id: "LIST" },
                    ]
                    : [{ type: "RegistrationLink", id: `PARTY-${partyId}` }],
        }),

        // Get registration link by token (public endpoint)
        getRegistrationLinkByToken: builder.query<RegistrationLink, string>({
            query: (token) => `/registration-links/token/${token}`,
            transformResponse: (response: any) => response.data,
        }),

        // Get registration link by ID
        getRegistrationLinkById: builder.query<RegistrationLink, number>({
            query: (id) => `/registration-links/single/${id}`,
            transformResponse: (response: any) => response.data,
            providesTags: (_result, _error, id) => [{ type: "RegistrationLink", id }],
        }),

        // Update a registration link
        updateRegistrationLink: builder.mutation<
            ApiActionResponse,
            { id: number; data: UpdateRegistrationLinkRequest }
        >({
            query: ({ id, data }) => ({
                url: `/registration-links/update/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "RegistrationLink", id },
                { type: "RegistrationLink", id: "LIST" },
            ],
        }),

        // Delete a registration link
        deleteRegistrationLink: builder.mutation<ApiActionResponse, number>({
            query: (id) => ({
                url: `/registration-links/delete/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "RegistrationLink", id },
                { type: "RegistrationLink", id: "LIST" },
            ],
        }),

        // Toggle registration link status
        toggleRegistrationLinkStatus: builder.mutation<
            ApiActionResponse,
            { id: number; isActive: boolean }
        >({
            query: ({ id, isActive }) => ({
                url: `/registration-links/update/${id}`,
                method: "PUT",
                body: { isActive },
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "RegistrationLink", id },
                { type: "RegistrationLink", id: "LIST" },
            ],
        }),
    }),
});

export const {
    useCreateRegistrationLinkMutation,
    useGetRegistrationLinksByPartyQuery,
    useGetRegistrationLinkByTokenQuery,
    useGetRegistrationLinkByIdQuery,
    useUpdateRegistrationLinkMutation,
    useDeleteRegistrationLinkMutation,
    useToggleRegistrationLinkStatusMutation,
} = registrationLinksApi;