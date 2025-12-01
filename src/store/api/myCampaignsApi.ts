import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { MyCampaignsResponse } from "../../types/campaign";

interface CampaignAcceptanceResponse {
  success: boolean;
  message: string;
  data?: {
    campaignAcceptance_id: number;
    campaign_id: number;
    user_id: number;
    status: string;
    accepted_on: string | null;
    declined_on: string | null;
    isActive: number;
    isDelete: number;
    created_at: string;
    updated_at: string;
    campaign_name: string;
  };
}

interface CampaignReportPayload {
  campaign_id: number;
  attendees?: number;
  personName: string;
  personPhone: string;
  report_date?: string;
  description?: string;
  images?: File[];
}

interface UpdateCampaignReportPayload {
  reportId: number;
  attendees?: number;
  personName: string;
  personPhone: string;
  report_date?: string;
  description?: string;
  images?: File[];
  existingImages?: string[];
}

interface CampaignReportResponse {
  success: boolean;
  message: string;
  data?: {
    campaignReport_id: number;
    campaign_acceptance_id: number;
    attendees: number;
    personName: string;
    personPhone: string;
    images: string[];
    report_date: string;
    description: string;
    isActive: number;
    isDelete: number;
    created_at: string;
    updated_at: string;
    campaign_id: number;
    user_id: number;
    campaign_name: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface MyReportItem {
  campaignReport_id: number;
  campaign_acceptance_id: number;
  attendees: number;
  personName: string;
  personPhone: string;
  images: string[];
  report_date: string;
  description: string;
  isActive: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
  campaign_id: number;
  acceptance_status: string;
  campaign_name: string;
  campaign_description: string;
  campaign_start_date: string;
  campaign_end_date: string;
  campaign_active: number;
}

interface MyReportsResponse {
  success: boolean;
  message: string;
  data: {
    campaign: {
      campaign_id: number;
      name: string;
      start_date: string;
      end_date: string;
      isActive: number;
    };
    acceptance: {
      campaignAcceptance_id: number;
      status: string;
    };
    reports: MyReportItem[];
    total_reports: number;
  };
}

export const myCampaignsApi = createApi({
  reducerPath: "myCampaignsApi",
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
  tagTypes: ["MyCampaigns"],
  endpoints: (builder) => ({
    getMyCampaigns: builder.query<MyCampaignsResponse, void>({
      query: () => "/campaigns/my-campaigns",
      providesTags: ["MyCampaigns"],
    }),
    updateCampaignAcceptance: builder.mutation<
      CampaignAcceptanceResponse,
      { campaignId: number; status: "accepted" | "declined" }
    >({
      query: ({ campaignId, status }) => ({
        url: `/campaign-acceptance/${campaignId}`,
        method: "POST",
        body: { status },
      }),
      // Optimistically update the cache with the acceptance_id
      async onQueryStarted(
        { campaignId, status },
        { dispatch, queryFulfilled }
      ) {
        try {
          const { data } = await queryFulfilled;

          // Update the campaigns list cache with the new acceptance_id
          if (data?.data?.campaignAcceptance_id) {
            dispatch(
              myCampaignsApi.util.updateQueryData(
                "getMyCampaigns",
                undefined,
                (draft) => {
                  const campaign = draft.data.find(
                    (c) => c.campaign_id === campaignId
                  );
                  if (campaign) {
                    campaign.user_acceptance_status = status;
                    campaign.campaign_acceptance_id =
                      data.data?.campaignAcceptance_id || undefined;
                  }
                }
              )
            );
          }
        } catch {
          // If the mutation fails, the cache will not be updated
        }
      },
      invalidatesTags: ["MyCampaigns"],
    }),
    createCampaignReport: builder.mutation<
      CampaignReportResponse,
      CampaignReportPayload
    >({
      query: (payload) => {
        const { images, ...restPayload } = payload;

        // If there are images, use FormData
        if (images && images.length > 0) {
          const formData = new FormData();

          // Append all fields
          Object.entries(restPayload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(key, String(value));
            }
          });

          // Append images
          images.forEach((file) => {
            formData.append("images[]", file);
          });

          return {
            url: "/campaign-reports/create",
            method: "POST",
            body: formData,
          };
        }

        // No images, use JSON
        return {
          url: "/campaign-reports/create",
          method: "POST",
          body: restPayload,
        };
      },
      invalidatesTags: ["MyCampaigns"],
    }),
    getMyReports: builder.query<MyReportsResponse, number>({
      query: (campaignId) => `/campaign-reports/my-reports/${campaignId}`,
      providesTags: (_, __, campaignId) => [
        { type: "MyCampaigns", id: `reports-${campaignId}` },
      ],
    }),
    updateCampaignReport: builder.mutation<
      CampaignReportResponse,
      UpdateCampaignReportPayload
    >({
      query: (payload) => {
        const { reportId, images, existingImages, ...restPayload } = payload;

        // If there are images, use FormData
        if (images && images.length > 0) {
          const formData = new FormData();

          // Append all fields
          Object.entries(restPayload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(key, String(value));
            }
          });

          // Append existing images
          if (existingImages) {
            existingImages.forEach((imageUrl, index) => {
              formData.append(`existingImages[${index}]`, imageUrl);
            });
          }

          // Append new images
          images.forEach((file) => {
            formData.append("images[]", file);
          });

          return {
            url: `/campaign-reports/${reportId}`,
            method: "PUT",
            body: formData,
          };
        }

        // No images, use JSON
        return {
          url: `/campaign-reports/${reportId}`,
          method: "PUT",
          body: { ...restPayload, existingImages },
        };
      },
      invalidatesTags: (_, __, { reportId }) => [
        "MyCampaigns",
        { type: "MyCampaigns", id: `reports-${reportId}` },
      ],
    }),
  }),
});

export const {
  useGetMyCampaignsQuery,
  useUpdateCampaignAcceptanceMutation,
  useCreateCampaignReportMutation,
  useGetMyReportsQuery,
  useUpdateCampaignReportMutation,
} = myCampaignsApi;
