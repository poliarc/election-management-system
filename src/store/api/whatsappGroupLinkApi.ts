import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface WhatsAppGroupLink {
  id: number;
  title: string;
  group_link: string;
  party_id: number;
  state_id: number;
  district_id: number;
  assembly_id: number;
  target_level: string;
  target_node_id: number | null;
  created_by: number;
  creator_first_name: string;
  creator_last_name: string;
  isActive: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
  selected_users?: { user_id: number; first_name: string; last_name: string; contact_no: string }[];
}

interface ListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: WhatsAppGroupLink[];
}

interface SingleResponse {
  success: boolean;
  data: WhatsAppGroupLink;
}

interface CreatePayload {
  title: string;
  group_link: string;
  party_id: number;
  state_id: number;
  district_id: number;
  assembly_id: number;
  target_level: string;
  user_ids?: number[];
  target_node_id?: number;
}

interface UpdatePayload {
  title?: string;
  group_link?: string;
  isActive?: boolean;
  user_ids?: number[];
  target_node_id?: number;
}

export const whatsappGroupLinkApi = createApi({
  reducerPath: "whatsappGroupLinkApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("auth_access_token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["WhatsAppLink"],
  endpoints: (builder) => ({
    getLinks: builder.query<ListResponse, { assembly_id?: number; party_id?: number; target_node_id?: number; page?: number; limit?: number }>({
      query: (params) => ({ url: "/whatsapp-group-links", params }),
      providesTags: ["WhatsAppLink"],
    }),
    getLinkById: builder.query<SingleResponse, number>({
      query: (id) => `/whatsapp-group-links/${id}`,
      providesTags: ["WhatsAppLink"],
    }),
    createLink: builder.mutation<SingleResponse, CreatePayload>({
      query: (body) => ({ url: "/whatsapp-group-links", method: "POST", body }),
      invalidatesTags: ["WhatsAppLink"],
    }),
    updateLink: builder.mutation<SingleResponse, { id: number; body: UpdatePayload }>({
      query: ({ id, body }) => ({ url: `/whatsapp-group-links/${id}`, method: "PUT", body }),
      invalidatesTags: ["WhatsAppLink"],
    }),
    deleteLink: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({ url: `/whatsapp-group-links/${id}`, method: "DELETE" }),
      invalidatesTags: ["WhatsAppLink"],
    }),
  }),
});

export const {
  useGetLinksQuery,
  useGetLinkByIdQuery,
  useCreateLinkMutation,
  useUpdateLinkMutation,
  useDeleteLinkMutation,
} = whatsappGroupLinkApi;
