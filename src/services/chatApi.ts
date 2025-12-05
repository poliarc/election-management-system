import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/chat`;

export interface User {
    user_id: number;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    email: string;
    profileImage: string | null;
    party_id: number;
    state_id?: number;
    created_on: string;
}

export interface ChatMessage {
    chat_id?: number;
    Id?: number;
    sender_id: number;
    receiver_id?: number;
    GroupId?: number;
    message: string;
    message_type: "text" | "image" | "video" | "audio" | "document" | "file";
    files: Array<{
        url: string;
        name: string;
        size: number;
        type: string;
    }> | null;
    read_at: string | null;
    isDelete: number;
    created_at: string;
    sender_name: string;
    sender_email: string;
    sender_image: string | null;
    receiver_name?: string;
    receiver_email?: string;
    receiver_image?: string | null;
    group_name?: string;
}

export interface Group {
    Id: number;
    Name: string;
    IsDelete: number;
    created_by: number;
    created_on: string;
    created_by_name: string;
    member_count: number;
}

export interface RecentChat {
    other_user_id?: number;
    group_id?: number;
    chat_name: string;
    chat_image: string | null;
    chat_type: "direct" | "group";
    last_message: string;
    last_message_type: string;
    last_message_time: string;
    read_at: string | null;
    has_unread: number;
    unread_count?: number;
}

// Get auth token from localStorage
function getAuthToken(): string | null {
    try {
        const authState = localStorage.getItem("auth_state");
        if (!authState) return null;
        const parsed = JSON.parse(authState);
        return parsed.accessToken || null;
    } catch {
        return null;
    }
}

export const chatApi = createApi({
    reducerPath: "chatApi",
    baseQuery: fetchBaseQuery({
        baseUrl: BASE_URL,
        prepareHeaders: (headers) => {
            const token = getAuthToken();
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ["PartyUsers", "Groups", "DirectMessages", "GroupMessages", "RecentChats"],
    endpoints: (builder) => ({
        getPartyUsers: builder.query<User[], { party_id?: number; state_id?: number; page?: number; limit?: number; search?: string }>({
            query: ({ party_id, state_id, page = 1, limit = 100, search }) => {
                const params = new URLSearchParams();
                if (party_id) params.append("party_id", party_id.toString());
                if (state_id) params.append("state_id", state_id.toString());
                params.append("page", page.toString());
                params.append("limit", limit.toString());
                if (search) params.append("search", search);
                return {
                    url: `${import.meta.env.VITE_API_BASE_URL}/api/users/filter?${params.toString()}`,
                    method: "GET",
                };
            },
            transformResponse: (response: { data: User[]; pagination?: any }) => response.data,
            providesTags: ["PartyUsers"],
        }),

        sendDirectMessage: builder.mutation<ChatMessage, { receiver_id: number; message: string; files?: File[] }>({
            query: ({ receiver_id, message, files }) => {
                const formData = new FormData();
                formData.append("receiver_id", receiver_id.toString());
                formData.append("message", message);
                if (files) {
                    files.forEach((file) => formData.append("files", file));
                }
                return {
                    url: "/direct/send",
                    method: "POST",
                    body: formData,
                };
            },
            transformResponse: (response: { data: ChatMessage }) => response.data,
            invalidatesTags: (_result, _error, arg) => [
                { type: "DirectMessages", id: arg.receiver_id },
                "RecentChats"
            ],
        }),

        getDirectConversation: builder.query<ChatMessage[], { other_user_id: number; page?: number; limit?: number }>({
            query: ({ other_user_id, page = 1, limit = 50 }) =>
                `/direct/conversation?other_user_id=${other_user_id}&page=${page}&limit=${limit}`,
            transformResponse: (response: { data: ChatMessage[] }) => response.data,
            providesTags: (_result, _error, arg) => [{ type: "DirectMessages", id: arg.other_user_id }],
            keepUnusedDataFor: 0, // Don't cache, always fetch fresh
        }),

        markDirectMessageAsRead: builder.mutation<void, number>({
            query: (chat_id) => ({
                url: "/direct/mark-read",
                method: "POST",
                body: { chat_id },
            }),
            invalidatesTags: ["DirectMessages", "RecentChats"],
        }),

        deleteDirectMessage: builder.mutation<void, number>({
            query: (chat_id) => ({
                url: `/direct/${chat_id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["DirectMessages", "RecentChats"],
        }),

        createGroup: builder.mutation<Group, { name: string; member_ids: number[] }>({
            query: (body) => ({
                url: "/groups",
                method: "POST",
                body,
            }),
            transformResponse: (response: { data: Group }) => response.data,
            invalidatesTags: ["Groups"],
        }),

        getUserGroups: builder.query<Group[], void>({
            query: () => "/groups",
            transformResponse: (response: { data: Group[] }) => response.data,
            providesTags: ["Groups"],
        }),

        getGroupMembers: builder.query<any[], number>({
            query: (groupId) => `/groups/${groupId}/members`,
            transformResponse: (response: { data: any[] }) => response.data,
        }),

        addGroupMembers: builder.mutation<void, { groupId: number; member_ids: number[] }>({
            query: ({ groupId, member_ids }) => ({
                url: `/groups/${groupId}/members`,
                method: "POST",
                body: { member_ids },
            }),
            invalidatesTags: ["Groups"],
        }),

        removeGroupMember: builder.mutation<void, { groupId: number; user_id: number }>({
            query: ({ groupId, user_id }) => ({
                url: `/groups/${groupId}/members`,
                method: "DELETE",
                body: { user_id },
            }),
            invalidatesTags: ["Groups"],
        }),

        leaveGroup: builder.mutation<void, number>({
            query: (groupId) => ({
                url: `/groups/${groupId}/leave`,
                method: "POST",
            }),
            invalidatesTags: ["Groups"],
        }),

        deleteGroup: builder.mutation<void, number>({
            query: (groupId) => ({
                url: `/groups/${groupId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Groups"],
        }),

        sendGroupMessage: builder.mutation<ChatMessage, { group_id: number; message: string; files?: File[] }>({
            query: ({ group_id, message, files }) => {
                const formData = new FormData();
                formData.append("group_id", group_id.toString());
                formData.append("message", message);
                if (files) {
                    files.forEach((file) => formData.append("files", file));
                }
                return {
                    url: "/group/send",
                    method: "POST",
                    body: formData,
                };
            },
            transformResponse: (response: { data: ChatMessage }) => response.data,
            invalidatesTags: (_result, _error, arg) => [
                { type: "GroupMessages", id: arg.group_id },
                "RecentChats"
            ],
        }),

        getGroupConversation: builder.query<ChatMessage[], { group_id: number; page?: number; limit?: number }>({
            query: ({ group_id, page = 1, limit = 50 }) =>
                `/group/conversation?group_id=${group_id}&page=${page}&limit=${limit}`,
            transformResponse: (response: { data: ChatMessage[] }) => response.data,
            providesTags: (_result, _error, arg) => [{ type: "GroupMessages", id: arg.group_id }],
            keepUnusedDataFor: 0, // Don't cache, always fetch fresh
        }),

        markGroupMessageAsRead: builder.mutation<void, number>({
            query: (message_id) => ({
                url: "/group/mark-read",
                method: "POST",
                body: { message_id },
            }),
            invalidatesTags: ["GroupMessages", "RecentChats"],
        }),

        deleteGroupMessage: builder.mutation<void, number>({
            query: (message_id) => ({
                url: `/group/${message_id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["GroupMessages", "RecentChats"],
        }),

        getRecentChats: builder.query<RecentChat[], void>({
            query: () => "/recent-chats",
            transformResponse: (response: { data: RecentChat[] }) => response.data,
            providesTags: ["RecentChats"],
        }),

        getUnreadCount: builder.query<{ direct_unread: number; group_unread: number; total_unread: number }, void>({
            query: () => "/unread-count",
            transformResponse: (response: { data: any }) => response.data,
        }),
    }),
});

export const {
    useGetPartyUsersQuery,
    useLazyGetPartyUsersQuery,
    useSendDirectMessageMutation,
    useGetDirectConversationQuery,
    useMarkDirectMessageAsReadMutation,
    useDeleteDirectMessageMutation,
    useCreateGroupMutation,
    useGetUserGroupsQuery,
    useGetGroupMembersQuery,
    useAddGroupMembersMutation,
    useRemoveGroupMemberMutation,
    useLeaveGroupMutation,
    useDeleteGroupMutation,
    useSendGroupMessageMutation,
    useGetGroupConversationQuery,
    useMarkGroupMessageAsReadMutation,
    useDeleteGroupMessageMutation,
    useGetRecentChatsQuery,
    useGetUnreadCountQuery,
} = chatApi;
