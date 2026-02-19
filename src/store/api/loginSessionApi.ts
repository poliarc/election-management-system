import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface LoginSession {
    id: number;
    user_id: number;
    username: string;
    ip_address: string;
    user_agent: string;
    status_message: string;
    created_at: string;
    session_id: string;
    country_code: string;
    device_fingerprint: string;
    login_status: "SUCCESS" | "FAILED" | "BLOCKED";
    failure_reason: string | null;
    party_id: number;
    state_id: number;
    district_id?: number | null;
    partyName: string;
    stateName: string;
    first_name?: string;
    last_name?: string;
    user_email?: string;
    user_role?: string;
}

interface LoginSessionsResponse {
    success: boolean;
    message: string;
    data: LoginSession[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface LoginSessionParams {
    page?: number;
    limit?: number;
    login_status?: "SUCCESS" | "FAILED" | "BLOCKED";
    date_from?: string;
    date_to?: string;
    user_id?: number;
    state_id?: number;
    district_id?: number;
}

interface UserLoginReportData {
    report_date: string;
    hour?: number;        // For daily report
    day?: number;         // For monthly report
    day_name?: string;    // For weekly report
    total_logins: number;
    successful_logins: number;
    failed_logins: number;
    blocked_logins: number;
    unique_users: number;
    unique_ips: number;
}

interface UserReportResponse {
    success: boolean;
    message: string;
    report_type: "daily" | "weekly" | "monthly";
    date: string;
    user: {
        user_id: number;
        first_name: string;
        last_name: string;
        email: string;
        username: string;
        last_login_time?: string;
    };
    data: UserLoginReportData[];
}

export const loginSessionApi = createApi({
    reducerPath: "loginSessionApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api`,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem("auth_access_token");
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ["LoginSession"],
    endpoints: (builder) => ({
        getLoginSessionsByParty: builder.query<
            LoginSessionsResponse,
            { partyId: number; params?: LoginSessionParams }
        >({
            query: ({ partyId, params }) => {
                const queryParams: Record<string, any> = {};
                if (params?.page) queryParams.page = params.page;
                if (params?.limit) queryParams.limit = params.limit;
                if (params?.login_status) queryParams.login_status = params.login_status;
                if (params?.date_from) queryParams.date_from = params.date_from;
                if (params?.date_to) queryParams.date_to = params.date_to;
                if (params?.user_id) queryParams.user_id = params.user_id;
                if (params?.district_id) queryParams.district_id = params.district_id;

                let url = `/login-sessions/by-party/${partyId}`;

                // If state_id is provided, use the party-state endpoint
                if (params?.state_id) {
                    url = `/login-sessions/by-party-state/${partyId}/${params.state_id}`;
                }

                return {
                    url,
                    params: queryParams,
                };
            },
            providesTags: ["LoginSession"],
        }),
        getUserLoginReport: builder.query<
            UserReportResponse,
            { userId: number; reportType: "daily" | "weekly" | "monthly"; date?: string }
        >({
            query: ({ userId, reportType, date }) => ({
                url: `/login-sessions/report/${userId}`,
                params: {
                    report_type: reportType,
                    ...(date && { date }),
                },
            }),
        }),
    }),
});

export const {
    useGetLoginSessionsByPartyQuery,
    useGetUserLoginReportQuery
} = loginSessionApi;
