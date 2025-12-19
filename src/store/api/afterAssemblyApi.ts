import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface DeleteAssignedLevelsRequest {
    user_id: number;
    afterAssemblyData_ids: number[];
}

export interface DeleteAssignedLevelsResponse {
    success: boolean;
    message: string;
    deleted: Array<{
        id: number;
        afterAssemblyDataId: number;
        user_id: number;
    }>;
    errors: Array<{
        afterAssemblyDataId: number;
        error: string;
    }>;
    summary: {
        total: number;
        success: number;
        failed: number;
    };
}

export const afterAssemblyApi = createApi({
    reducerPath: "afterAssemblyApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("auth_access_token");
            if (token) headers.set("Authorization", `Bearer ${token}`);
            headers.set("Content-Type", "application/json");
            return headers;
        },
    }),
    tagTypes: ["AfterAssemblyHierarchy", "BlockAssignment"],
    endpoints: (builder) => ({
        deleteAssignedLevels: builder.mutation<
            DeleteAssignedLevelsResponse,
            DeleteAssignedLevelsRequest
        >({
            query: (body) => ({
                url: "/user-after-assembly-hierarchy/delete-assigned-levels",
                method: "DELETE",
                body,
            }),
            invalidatesTags: ["AfterAssemblyHierarchy", "BlockAssignment"],
        }),
    }),
});

export const { useDeleteAssignedLevelsMutation } = afterAssemblyApi;
