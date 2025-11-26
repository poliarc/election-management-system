import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

interface UploadVotersRequest {
    state_id: number;
    district_id: number;
    assembly_id: number;
    file: File;
}

interface UploadVotersResponse {
    message: string;
    uploadedCount?: number;
}

export const votersApi = createApi({
    reducerPath: "votersApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_BASE_URL || "https://backend.peopleconnect.in"}/api`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("auth_access_token");
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            // Don't set Content-Type for FormData, browser will set it with boundary
            return headers;
        },
    }),
    tagTypes: ["Voters"],
    endpoints: (builder) => ({
        uploadVoters: builder.mutation<UploadVotersResponse, UploadVotersRequest>({
            query: ({ state_id, district_id, assembly_id, file }) => {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("state_id", state_id.toString());
                formData.append("district_id", district_id.toString());
                formData.append("assembly_id", assembly_id.toString());

                console.log("FormData being sent:", {
                    state_id,
                    district_id,
                    assembly_id,
                    fileName: file.name,
                });

                // Try sending IDs both in FormData AND as query params
                return {
                    url: `/voters/upload-excel?state_id=${state_id}&district_id=${district_id}&assembly_id=${assembly_id}`,
                    method: "POST",
                    body: formData,
                };
            },
            transformResponse: (response: ApiResponse<UploadVotersResponse>) => response.data,
            invalidatesTags: ["Voters"],
        }),
    }),
});

export const { useUploadVotersMutation } = votersApi;
