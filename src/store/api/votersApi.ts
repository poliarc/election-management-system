import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { VoterApiResponse, VoterList, VoterListCandidate } from "../../types/voter";

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

interface GetVotersByAssemblyParams {
    assembly_id: number;
    limit: number;
    page: number;
    search?: string;
    fatherName?: string;
    address?: string;
    partFrom?: number;
    partTo?: number;
}

interface UpdateVoterRequest extends Partial<VoterListCandidate> {
    id: number;
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

                return {
                    url: `/voters/upload-excel?state_id=${state_id}&district_id=${district_id}&assembly_id=${assembly_id}`,
                    method: "POST",
                    body: formData,
                };
            },
            transformResponse: (response: ApiResponse<UploadVotersResponse>) => response.data,
            invalidatesTags: ["Voters"],
        }),
        getVotersByAssemblyPaginated: builder.query<VoterApiResponse, GetVotersByAssemblyParams>({
            query: ({ assembly_id, limit, page, search, fatherName, address, partFrom, partTo }) => {
                const params = new URLSearchParams({
                    limit: limit.toString(),
                    page: page.toString(),
                });

                if (search) params.append("search", search);
                if (fatherName) params.append("fatherName", fatherName);
                if (address) params.append("address", address);
                if (partFrom !== undefined) params.append("partFrom", partFrom.toString());
                if (partTo !== undefined) params.append("partTo", partTo.toString());

                return {
                    url: `/voters/assembly/${assembly_id}/paginated?${params.toString()}`,
                    method: "GET",
                };
            },
            providesTags: ["Voters"],
        }),
        updateVoter: builder.mutation<VoterList, UpdateVoterRequest>({
            query: ({ id, ...data }) => ({
                url: `/voters/update/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Voters"],
        }),
    }),
});

export const {
    useUploadVotersMutation,
    useGetVotersByAssemblyPaginatedQuery,
    useUpdateVoterMutation,
} = votersApi;
