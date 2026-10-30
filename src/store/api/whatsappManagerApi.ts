import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "../baseQuery";

export interface WhatsAppGroupItem {
  id: number;
  link: string;
  group_name: string;
  group_type?: string | null;
  level_type: "State" | "District" | "Assembly" | "SubLevel";
  description?: string | null;
  is_active: number;
  created_at: string;
  state_id: number;
  state_name?: string | null;
  district_id?: number | null;
  district_name?: string | null;
  assembly_id?: number | null;
  assembly_name?: string | null;
  sub_level_name?: string | null;
  created_by?: number | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatorInfo {
  user_id: number;
  name: string;
  state_id: number;
  state_name: string;
  district_id?: number | null;
  district_name?: string | null;
  assembly_id?: number | null;
  assembly_name?: string | null;
  primary_level_type?: "State" | "District" | "Assembly" | "All";
  creator_code?: string;
}

export interface WhatsAppGroupsResponse {
  success: boolean;
  message: string;
  data: WhatsAppGroupItem[];
  pagination: PaginationMeta;
  creator_info?: CreatorInfo | null;
}

export interface CreateWhatsAppGroupRequest {
  state_id: number;
  district_id?: number | null;
  assembly_id?: number | null;
  stateMasterData_id?: number | null;
  group_name: string;
  link: string;
  group_type?: string | null;
  level_type: "State" | "District" | "Assembly";
  description?: string | null;
  created_by?: number | null;
}

export interface UpdateWhatsAppGroupRequest {
  id: number;
  group_name?: string;
  link?: string;
  group_type?: string | null;
  description?: string | null;
  is_active?: boolean | number;
}

export interface WhatsAppFilterParams {
  level_type?: string | null;
  state_id?: number | null;
  district_id?: number | null;
  assembly_id?: number | null;
  search?: string | null;
  page?: number | null;
  limit?: number | null;
  creator?: string | null;
}

export const whatsappManagerApi = createApi({
  reducerPath: "whatsappManagerApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["WhatsAppGroups"],
  endpoints: (builder) => ({
    // Public directory listing (used on the sub-domain & /whatsapp-groups)
    getPublicWhatsappLinks: builder.query<WhatsAppGroupsResponse, WhatsAppFilterParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.level_type && params.level_type !== "All") {
          queryParams.append("level_type", params.level_type);
        }
        if (params.state_id) queryParams.append("state_id", params.state_id.toString());
        if (params.district_id) queryParams.append("district_id", params.district_id.toString());
        if (params.assembly_id) queryParams.append("assembly_id", params.assembly_id.toString());
        if (params.search && params.search.trim()) {
          queryParams.append("search", params.search.trim());
        }
        if (params.creator && params.creator.trim()) {
          queryParams.append("creator", params.creator.trim());
        }
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());

        return {
          url: `/whatsapp/public-links?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["WhatsAppGroups"],
    }),

    // Management list filtered by level for logged-in users
    getWhatsappLinksByLevel: builder.query<WhatsAppGroupsResponse, WhatsAppFilterParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.level_type && params.level_type !== "All") {
          queryParams.append("level_type", params.level_type);
        }
        if (params.state_id) queryParams.append("state_id", params.state_id.toString());
        if (params.district_id) queryParams.append("district_id", params.district_id.toString());
        if (params.assembly_id) queryParams.append("assembly_id", params.assembly_id.toString());
        if (params.search && params.search.trim()) {
          queryParams.append("search", params.search.trim());
        }
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());

        return {
          url: `/whatsapp/support-groups?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["WhatsAppGroups"],
    }),

    // Create a new WhatsApp group
    createWhatsappLink: builder.mutation<{ success: boolean; message: string; data: any }, CreateWhatsAppGroupRequest>({
      query: (body) => ({
        url: "/whatsapp/create-whatsapp-link",
        method: "POST",
        body,
      }),
      invalidatesTags: ["WhatsAppGroups"],
    }),

    // Update an existing WhatsApp group
    updateWhatsappLink: builder.mutation<{ success: boolean; message: string; data: any }, UpdateWhatsAppGroupRequest>({
      query: ({ id, ...body }) => ({
        url: `/whatsapp/update-whatsapp-link/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["WhatsAppGroups"],
    }),

    // Delete a WhatsApp group
    deleteWhatsappLink: builder.mutation<{ success: boolean; message: string; data: any }, number>({
      query: (id) => ({
        url: `/whatsapp/delete-whatsapp-link/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WhatsAppGroups"],
    }),
  }),
});

export const {
  useGetPublicWhatsappLinksQuery,
  useGetWhatsappLinksByLevelQuery,
  useCreateWhatsappLinkMutation,
  useUpdateWhatsappLinkMutation,
  useDeleteWhatsappLinkMutation,
} = whatsappManagerApi;
