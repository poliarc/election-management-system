import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// API response wrappers
interface ApiListResponse<T> {
    success: boolean;
    message: string;
    data: {
        results: T[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}

interface ApiItemResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

interface ApiActionResponse {
    success: boolean;
    message: string;
    data?: any;
}

// Result Analysis types
interface CandidateDetail {
    candidateName: string;
    candidateVotes: number;
    candidateParty: string;
    position?: number;
}

interface ResultAnalysis {
    id: number;
    partyId: number;
    stateId: number;
    districtId: number;
    assemblyId: number;
    boothId: number;
    stateName: string;
    districtName: string;
    assemblyName: string;
    boothNo: string;
    validVotes: number;
    rejectedVotes: number;
    notaVotes: number;
    totalVotes: number;
    candidateDetails: CandidateDetail[];
    partyName?: string;
    uploadedBy: number;
    fileName: string;
    uploadedAt: string;
}

interface UploadExcelRequest {
    excelFile: File;
    assemblyId: number;
    boothId: number;
}

interface CreateResultRequest {
    partyId?: number;
    assemblyId: number;
    boothId: number;
    stateName: string;
    districtName: string;
    assemblyName: string;
    boothNo: string;
    validVotes: number;
    rejectedVotes: number;
    notaVotes: number;
    totalVotes: number;
    candidateDetails: CandidateDetail[];
}

export const resultAnalysisApi = createApi({
    reducerPath: "resultAnalysisApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api/result-analysis`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("auth_access_token");
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ["ResultAnalysis"],
    endpoints: (builder) => ({
        uploadExcelFile: builder.mutation<ApiActionResponse, UploadExcelRequest>({
            query: ({ excelFile, assemblyId, boothId }) => {
                const formData = new FormData();
                formData.append('excelFile', excelFile);
                formData.append('assemblyId', assemblyId.toString());
                formData.append('boothId', boothId.toString());
                
                return {
                    url: "/upload-excel",
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: [{ type: "ResultAnalysis", id: "LIST" }],
        }),

        createResult: builder.mutation<ApiItemResponse<ResultAnalysis>, CreateResultRequest>({
            query: (body) => ({
                url: "/",
                method: "POST",
                body,
            }),
            invalidatesTags: [{ type: "ResultAnalysis", id: "LIST" }],
        }),

        getResults: builder.query<
            {
                results: ResultAnalysis[];
                pagination: {
                    page: number;
                    limit: number;
                    total: number;
                    pages: number;
                };
            },
            {
                assemblyId?: number;
                boothId?: number;
                partyId?: number;
                stateId?: number;
                districtId?: number;
                page?: number;
                limit?: number;
            }
        >({
            query: (params) => ({
                url: "/",
                params,
            }),
            transformResponse: (response: ApiListResponse<ResultAnalysis>) => ({
                results: response.data.results || [],
                pagination: response.data.pagination || {
                    page: 1,
                    limit: 10,
                    total: 0,
                    pages: 0,
                },
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.results.map((r) => ({
                            type: "ResultAnalysis" as const,
                            id: r.id,
                        })),
                        { type: "ResultAnalysis", id: "LIST" },
                    ]
                    : [{ type: "ResultAnalysis", id: "LIST" }],
        }),

        getResultById: builder.query<ResultAnalysis, number>({
            query: (id) => `/${id}`,
            transformResponse: (response: ApiItemResponse<ResultAnalysis>) =>
                response.data,
            providesTags: (result) =>
                result ? [{ type: "ResultAnalysis", id: result.id }] : [],
        }),

        getResultsByAssembly: builder.query<ResultAnalysis[], number>({
            query: (assemblyId) => `/assembly/${assemblyId}`,
            transformResponse: (response: { success: boolean; data: ResultAnalysis[] }) =>
                response.data || [],
            providesTags: (result, _error, assemblyId) =>
                result
                    ? [
                        ...result.map((r) => ({
                            type: "ResultAnalysis" as const,
                            id: r.id,
                        })),
                        { type: "ResultAnalysis", id: `ASSEMBLY-${assemblyId}` },
                    ]
                    : [{ type: "ResultAnalysis", id: `ASSEMBLY-${assemblyId}` }],
        }),

        getResultsByBooth: builder.query<ResultAnalysis[], number>({
            query: (boothId) => `/booth/${boothId}`,
            transformResponse: (response: { success: boolean; data: ResultAnalysis[] }) =>
                response.data || [],
            providesTags: (result, _error, boothId) =>
                result
                    ? [
                        ...result.map((r) => ({
                            type: "ResultAnalysis" as const,
                            id: r.id,
                        })),
                        { type: "ResultAnalysis", id: `BOOTH-${boothId}` },
                    ]
                    : [{ type: "ResultAnalysis", id: `BOOTH-${boothId}` }],
        }),

        updateResult: builder.mutation<
            ApiItemResponse<ResultAnalysis>,
            { id: number; data: Partial<CreateResultRequest> }
        >({
            query: ({ id, data }) => ({
                url: `/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "ResultAnalysis", id },
                { type: "ResultAnalysis", id: "LIST" },
            ],
        }),

        deleteResult: builder.mutation<ApiActionResponse, number>({
            query: (id) => ({
                url: `/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: "ResultAnalysis", id },
                { type: "ResultAnalysis", id: "LIST" },
            ],
        }),
    }),
});

export const {
    useUploadExcelFileMutation,
    useCreateResultMutation,
    useGetResultsQuery,
    useGetResultByIdQuery,
    useGetResultsByAssemblyQuery,
    useGetResultsByBoothQuery,
    useUpdateResultMutation,
    useDeleteResultMutation,
} = resultAnalysisApi;