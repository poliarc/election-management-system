import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface PartyWiseLevel {
    party_wise_id: number;
    level_name: string;
    display_level_name: string;
    parent_level: number | null;
    party_id: number;
    party_level_admin_id: number | null;
    state_id: number;
    isActive: number;
    isDelete: number;
    created_at: string;
    updated_at: string;
    party_name: string;
    admin_name: string;
    admin_email: string | null;
    state_name: string;
    parent_level_name: string | null;
}

export interface CreatePartyWiseLevelRequest {
    level_name: string;
    display_level_name: string;
    party_id: number;
    state_id: number;
    parent_level?: number | null;
}

export interface AddAdminToLevelRequest {
    level_name: string;
    display_level_name: string;
    parent_level?: number | null;
    party_id: number;
    party_level_admin_id: number;
    state_id: number;
}

export interface UpdatePartyWiseLevelRequest {
    level_name?: string;
    display_level_name?: string;
    parent_level?: number | null;
    party_level_admin_id?: number | null;
    state_id?: number;
}

export const partyWiseLevelApi = createApi({
    reducerPath: "partyWiseLevelApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_BASE_URL || "https://backend.peopleconnect.in"
            }/api`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("auth_access_token");
            if (token) headers.set("Authorization", `Bearer ${token}`);
            headers.set("Content-Type", "application/json");
            return headers;
        },
    }),
    tagTypes: ["PartyWiseLevel"],
    endpoints: (builder) => ({
        getPartyWiseLevelsByParty: builder.query<PartyWiseLevel[], number>({
            query: (partyId) => ({
                url: `/party-wise-level/party/${partyId}`,
                params: {
                    includeInactive: true, // Try to request inactive levels too
                },
            }),
            transformResponse: (response: ApiResponse<PartyWiseLevel[]>) =>
                response.data || [],
            providesTags: (_result, _error, partyId) => [
                { type: "PartyWiseLevel", id: `PARTY-${partyId}` },
                { type: "PartyWiseLevel", id: "LIST" },
            ],
        }),

        createPartyWiseLevel: builder.mutation<
            PartyWiseLevel,
            CreatePartyWiseLevelRequest
        >({
            query: (body) => ({
                url: "/party-wise-level/create",
                method: "POST",
                body,
            }),
            transformResponse: (response: ApiResponse<PartyWiseLevel>) =>
                response.data,
            invalidatesTags: (_result, _error, arg) => [
                { type: "PartyWiseLevel", id: `PARTY-${arg.party_id}` },
                { type: "PartyWiseLevel", id: "LIST" },
            ],
        }),

        updatePartyWiseLevel: builder.mutation<
            PartyWiseLevel,
            { id: number; data: UpdatePartyWiseLevelRequest }
        >({
            query: ({ id, data }) => ({
                url: `/party-wise-level/update/${id}`,
                method: "PUT",
                body: data,
            }),
            transformResponse: (response: ApiResponse<PartyWiseLevel>) =>
                response.data,
            invalidatesTags: (result) =>
                result
                    ? [
                        { type: "PartyWiseLevel", id: `PARTY-${result.party_id}` },
                        { type: "PartyWiseLevel", id: "LIST" },
                    ]
                    : [{ type: "PartyWiseLevel", id: "LIST" }],
        }),

        deletePartyWiseLevel: builder.mutation<void, number>({
            query: (id) => ({
                url: `/party-wise-level/delete/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "PartyWiseLevel", id: "LIST" }],
        }),

        activatePartyWiseLevel: builder.mutation<PartyWiseLevel, number>({
            query: (id) => ({
                url: `/party-wise-level/${id}/activate`,
                method: "PATCH",
            }),
            async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
                // Optimistically update the cache
                const patchResults: any[] = [];

                // Find all queries for party levels and update them
                const state = getState() as any;
                const queries = state.partyWiseLevelApi?.queries || {};

                Object.keys(queries).forEach((key) => {
                    if (key.startsWith('getPartyWiseLevelsByParty')) {
                        const patchResult = dispatch(
                            partyWiseLevelApi.util.updateQueryData(
                                'getPartyWiseLevelsByParty',
                                queries[key]?.originalArgs,
                                (draft) => {
                                    const level = draft.find((l) => l.party_wise_id === id);
                                    if (level) {
                                        level.isActive = 1;
                                    }
                                }
                            )
                        );
                        patchResults.push(patchResult);
                    }
                });

                try {
                    await queryFulfilled;
                } catch {
                    // Revert optimistic update on error
                    patchResults.forEach((patchResult) => patchResult.undo());
                }
            },
        }),

        deactivatePartyWiseLevel: builder.mutation<PartyWiseLevel, number>({
            query: (id) => ({
                url: `/party-wise-level/${id}/deactivate`,
                method: "PATCH",
            }),
            async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
                // Optimistically update the cache
                const patchResults: any[] = [];

                // Find all queries for party levels and update them
                const state = getState() as any;
                const queries = state.partyWiseLevelApi?.queries || {};

                Object.keys(queries).forEach((key) => {
                    if (key.startsWith('getPartyWiseLevelsByParty')) {
                        const patchResult = dispatch(
                            partyWiseLevelApi.util.updateQueryData(
                                'getPartyWiseLevelsByParty',
                                queries[key]?.originalArgs,
                                (draft) => {
                                    const level = draft.find((l) => l.party_wise_id === id);
                                    if (level) {
                                        level.isActive = 0;
                                    }
                                }
                            )
                        );
                        patchResults.push(patchResult);
                    }
                });

                try {
                    await queryFulfilled;
                } catch {
                    // Revert optimistic update on error
                    patchResults.forEach((patchResult) => patchResult.undo());
                }
            },
        }),

        // DEPRECATED: Use updatePartyWiseLevel instead to assign admins
        // addAdminToLevel: builder.mutation<PartyWiseLevel, AddAdminToLevelRequest>({
        //     query: (body) => ({
        //         url: "/party-wise-level/add-admin",
        //         method: "POST",
        //         body,
        //     }),
        //     transformResponse: (response: ApiResponse<PartyWiseLevel>) =>
        //         response.data,
        //     invalidatesTags: (result, error, arg) => [
        //         { type: "PartyWiseLevel", id: `PARTY-${arg.party_id}` },
        //         { type: "PartyWiseLevel", id: "LIST" },
        //     ],
        // }),

        removeAdminFromLevel: builder.mutation<void, number>({
            query: (id) => ({
                url: `/party-wise-level/remove-admin/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: [{ type: "PartyWiseLevel", id: "LIST" }],
        }),
    }),
});

export const {
    useGetPartyWiseLevelsByPartyQuery,
    useCreatePartyWiseLevelMutation,
    useUpdatePartyWiseLevelMutation,
    useDeletePartyWiseLevelMutation,
    useActivatePartyWiseLevelMutation,
    useDeactivatePartyWiseLevelMutation,
    // useAddAdminToLevelMutation, // DEPRECATED: Use useUpdatePartyWiseLevelMutation instead
    useRemoveAdminFromLevelMutation,
} = partyWiseLevelApi;
