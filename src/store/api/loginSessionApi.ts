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

                // If state_id is provided, use the specific endpoint if API requires it, 
                // or just pass as param. Based on docs 'Get Login Sessions by Party and State' is strict /party-state/:partyId/:stateId
                // But generally filtering is easier with params. 
                // Let's stick to the /by-party endpoint and add state_id as query param if the backend supports it,
                // OR conditionally switch format. 
                // The prompt says "perticlae state select pe ske login sessions nikle".
                // Looking at docs: 
                // # 7. Get Login Sessions by Party and State -> /by-party-state/:party_id/:state_id
                // So we should probably use that endpoint if state_id is present.
                // However, switching URLs dynamically in one query definition is tricky with keeping types clean.
                // Let's modify the URL construction logic.

                let url = `/login-sessions/by-party/${partyId}`;

                // Check if the caller passed state_id in params (we need to add it to LoginSessionParams interface first)
                // TypeScript hack: we will cast params to any for now inside the function, assume it's there. 
                // Proper way is to update interface.
                const stateId = (params as any)?.state_id;

                if (stateId) {
                    url = `/login-sessions/by-party-state/${partyId}/${stateId}`;
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
