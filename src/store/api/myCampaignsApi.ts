import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { MyCampaignsResponse } from "../../types/campaign";

interface CampaignAcceptanceResponse {
  success: boolean;
  message: string;
  data?: {
    campaign_acceptance_id?: number;
    campaign_id?: number;
    status?: string;
  };
}

interface CampaignReportPayload {
  campaign_acceptance_id: number;
  attendees?: number;
  personName: string;
  personPhone: string;
  report_date?: string;
  description?: string;
  images?: File[];
}

interface CampaignReportResponse {
  success: boolean;
  message: string;
  data?: {
    campaignReport_id: number;
    campaign_acceptance_id: number;
  };
}

export const myCampaignsApi = createApi({
  reducerPath: "myCampaignsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://backend.peopleconnect.in/api",
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
          if (data?.data?.campaign_acceptance_id) {
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
                      data.data?.campaign_acceptance_id || undefined;
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
  }),
});

export const {
  useGetMyCampaignsQuery,
  useUpdateCampaignAcceptanceMutation,
  useCreateCampaignReportMutation,
} = myCampaignsApi;
