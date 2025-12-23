import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const vicReportsApi = createApi({
    reducerPath: 'vicReportsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/vic-reports',
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as any).auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['VICReport', 'UserHierarchy', 'ForwardLevels'],
    endpoints: (builder) => ({
        getVICReportById: builder.query<any, number>({
            query: (id) => `/${id}`,
            providesTags: ['VICReport'],
        }),
        takeActionOnReport: builder.mutation<any, { id: number; action: any }>({
            query: ({ id, action }) => ({
                url: `/${id}/action`,
                method: 'POST',
                body: action,
            }),
            invalidatesTags: ['VICReport'],
        }),
        getUserHierarchy: builder.query<any, void>({
            query: () => '/user-hierarchy',
            providesTags: ['UserHierarchy'],
        }),
        getForwardLevels: builder.query<any, void>({
            query: () => '/forward-levels',
            providesTags: ['ForwardLevels'],
        }),
    }),
});

export const {
    useGetVICReportByIdQuery,
    useTakeActionOnReportMutation,
    useGetUserHierarchyQuery,
    useGetForwardLevelsQuery,
} = vicReportsApi;