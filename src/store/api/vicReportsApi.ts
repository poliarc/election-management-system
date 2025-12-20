import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Types
export interface VICReport {
    id: number;
    voter_id_epic_no: string;
    voter_first_name: string;
    voter_last_name?: string; // Made optional
    part_no: string;
    voter_relative_name: string;
    user_id: number;
    report_content: string;
    report_type: "Complaint" | "Feedback" | "Issue" | "Other";
    priority: "Low" | "Medium" | "High" | "Critical";
    status: "Pending" | "In_Progress" | "Approved" | "Rejected" | "Resolved";
    current_level_id: number;
    submitted_at: string;
    resolved_at: string | null;
    resolution_notes: string | null;
    resolved_by: number | null;
    isActive: number;
    isDelete: number;
    created_at: string;
    updated_at: string;
    submitted_by_first_name: string;
    submitted_by_last_name: string;
    submitted_by_email: string;
    submitted_by_contact: string;
    resolved_by_first_name: string | null;
    resolved_by_last_name: string | null;
    current_level_name: string;
    current_level_display_name: string;
    hierarchy?: VICReportHierarchy[];
}

export interface VICReportHierarchy {
    id: number;
    report_id: number;
    level_id: number;
    level_name: string;
    assigned_user_id: number;
    status: "Pending" | "Forwarded" | "Approved" | "Rejected";
    action_taken_at: string | null;
    action_notes: string | null;
    forwarded_to_level_id: number | null;
    hierarchy_order: number;
    isActive: number;
    created_at: string;
    updated_at: string;
    level_display_name: string;
    assigned_user_first_name: string;
    assigned_user_last_name: string;
    assigned_user_email: string;
}

export interface CreateVICReportRequest {
    voter_id_epic_no: string;
    voter_first_name: string;
    voter_last_name?: string; // Made optional
    part_no: string;
    voter_relative_name: string;
    report_content: string;
    report_type: "Complaint" | "Feedback" | "Issue" | "Other";
    priority: "Low" | "Medium" | "High" | "Critical";
}

export interface UpdateVICReportRequest {
    voter_id_epic_no?: string;
    voter_first_name?: string;
    voter_last_name?: string;
    part_no?: string;
    voter_relative_name?: string;
    report_content?: string;
    report_type?: "Complaint" | "Feedback" | "Issue" | "Other";
    priority?: "Low" | "Medium" | "High" | "Critical";
}

export interface VICReportListParams {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    report_type?: string;
    user_id?: number;
    voter_id_epic_no?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
    sort_by?: string;
    order?: "asc" | "desc";
}

export interface VICReportActionRequest {
    action: "approve" | "reject" | "forward" | "resolve";
    action_notes: string;
    forward_to_level_id?: number;
}

export interface VICReportStatistics {
    myReportsCount: number;
    assignedReportsCount: number;
    pendingCount: number;
    inProgressCount: number;
    approvedCount: number;
    rejectedCount: number;
}

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const vicReportsApi = createApi({
    reducerPath: "vicReportsApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api/vic-reports`,
        prepareHeaders: (headers, { getState }) => {
            // Try to get token from Redux state first, then fallback to localStorage
            const state = getState() as any;
            const token = state.auth?.accessToken || localStorage.getItem("auth_access_token");

            console.log("VIC API Token:", token ? "Token found" : "No token found");
            console.log("Redux auth state:", state.auth);

            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            headers.set("Content-Type", "application/json");
            return headers;
        },
    }),
    tagTypes: ["VICReports", "VICStatistics"],
    endpoints: (builder) => ({
        // Create VIC Report
        createVICReport: builder.mutation<ApiResponse<{ id: number }>, CreateVICReportRequest>({
            query: (data) => ({
                url: "",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ["VICReports", "VICStatistics"],
        }),

        // Get VIC Report by ID
        getVICReportById: builder.query<ApiResponse<VICReport>, number>({
            query: (id) => `/${id}`,
            providesTags: (_result, _error, id) => [{ type: "VICReports", id }],
        }),

        // List VIC Reports with filters
        listVICReports: builder.query<ApiResponse<VICReport[]>, VICReportListParams>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        queryParams.append(key, String(value));
                    }
                });
                return `?${queryParams.toString()}`;
            },
            providesTags: ["VICReports"],
        }),

        // Get My Reports
        getMyReports: builder.query<ApiResponse<VICReport[]>, VICReportListParams>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        queryParams.append(key, String(value));
                    }
                });
                return `/my-reports?${queryParams.toString()}`;
            },
            providesTags: ["VICReports"],
        }),

        // Get Assigned Reports
        getAssignedReports: builder.query<ApiResponse<VICReport[]>, VICReportListParams>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        queryParams.append(key, String(value));
                    }
                });
                return `/assigned?${queryParams.toString()}`;
            },
            providesTags: ["VICReports"],
        }),

        // Get Under-Hierarchy Reports
        getUnderHierarchyReports: builder.query<ApiResponse<VICReport[]>, VICReportListParams>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        queryParams.append(key, String(value));
                    }
                });
                return `/under-hierarchy?${queryParams.toString()}`;
            },
            providesTags: (_result, _error, _arg) => [
                { type: "VICReports", id: "UNDER_HIERARCHY" },
                "VICReports"
            ],
            transformResponse: (response: ApiResponse<VICReport[]>) => {
                // Log the raw response for debugging
                console.log('Under-hierarchy API response:', response);

                // Ensure we have unique reports by ID
                if (response.data && Array.isArray(response.data)) {
                    const uniqueReports = response.data.filter((report, index, self) =>
                        index === self.findIndex(r => r.id === report.id)
                    );

                    if (uniqueReports.length !== response.data.length) {
                        console.warn(`Removed ${response.data.length - uniqueReports.length} duplicate reports from API response`);
                    }

                    return {
                        ...response,
                        data: uniqueReports
                    };
                }

                return response;
            },
        }),

        // Get User Hierarchy
        getUserHierarchy: builder.query<ApiResponse<any[]>, void>({
            query: () => "/hierarchy",
        }),

        // Get Available Forward Levels
        getForwardLevels: builder.query<ApiResponse<any[]>, void>({
            query: () => "/forward-levels",
        }),

        // Get Report Statistics
        getReportStatistics: builder.query<ApiResponse<VICReportStatistics>, void>({
            query: () => "/statistics",
            providesTags: ["VICStatistics"],
        }),

        // Get Reports by Level
        getReportsByLevel: builder.query<ApiResponse<VICReport[]>, { level_id: number } & VICReportListParams>({
            query: ({ level_id, ...params }) => {
                const queryParams = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        queryParams.append(key, String(value));
                    }
                });
                return `/level/${level_id}?${queryParams.toString()}`;
            },
            providesTags: ["VICReports"],
        }),

        // Take Action on Report
        takeActionOnReport: builder.mutation<ApiResponse<void>, { id: number; data: VICReportActionRequest }>({
            query: ({ id, data }) => ({
                url: `/${id}/action`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "VICReports", id },
                "VICReports",
                "VICStatistics",
            ],
        }),

        // Update VIC Report
        updateVICReport: builder.mutation<ApiResponse<void>, { id: number; data: UpdateVICReportRequest }>({
            query: ({ id, data }) => ({
                url: `/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: "VICReports", id },
                "VICReports",
            ],
        }),

        // Delete VIC Report
        deleteVICReport: builder.mutation<ApiResponse<void>, number>({
            query: (id) => ({
                url: `/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["VICReports", "VICStatistics"],
        }),
    }),
});

export const {
    useCreateVICReportMutation,
    useGetVICReportByIdQuery,
    useListVICReportsQuery,
    useGetMyReportsQuery,
    useGetAssignedReportsQuery,
    useGetUnderHierarchyReportsQuery,
    useGetUserHierarchyQuery,
    useGetForwardLevelsQuery,
    useGetReportStatisticsQuery,
    useGetReportsByLevelQuery,
    useTakeActionOnReportMutation,
    useUpdateVICReportMutation,
    useDeleteVICReportMutation,
} = vicReportsApi;
