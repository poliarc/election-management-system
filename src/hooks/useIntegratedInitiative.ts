import { useState, useCallback } from "react";
import { integratedInitiativeApi } from "../services/integratedInitiativeApi";
import type {
  CampaignListResponse,
  AcceptDeclinePayload,
  SubmitReportResponse,
} from "../types/initative";

export const useIntegratedInitiative = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get campaigns assigned to current user
  const getMyCampaigns = useCallback(
    async (params?: {
      isActive?: number;
      sort_by?: string;
      order?: "asc" | "desc";
    }): Promise<CampaignListResponse> => {
      setLoading(true);
      setError(null);

      try {
        const response = await integratedInitiativeApi.getMyCampaigns(params);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch campaigns";
        setError(errorMessage);

        // Return empty response on error
        return {
          success: false,
          campaigns: [],
          userContext: {
            levelType: "State",
            level_id: 1,
          },
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Accept a campaign
  const acceptCampaign = useCallback(
    async (campaignId: number, scopeId?: number) => {
      setLoading(true);
      setError(null);

      try {
        const payload: AcceptDeclinePayload = {
          campaign_scope_id: scopeId || campaignId,
          acceptance_status: "accepted",
        };

        const response = await integratedInitiativeApi.updateCampaignAcceptance(
          payload
        );
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to accept campaign";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Decline a campaign
  const declineCampaign = useCallback(
    async (campaignId: number, scopeId?: number) => {
      setLoading(true);
      setError(null);

      try {
        const payload: AcceptDeclinePayload = {
          campaign_scope_id: scopeId || campaignId,
          acceptance_status: "declined",
        };

        const response = await integratedInitiativeApi.updateCampaignAcceptance(
          payload
        );
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to decline campaign";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Submit campaign report
  const submitCampaignReport = useCallback(
    async (data: {
      campaign_acceptance_id: number;
      attendees: number;
      personName: string;
      personPhone: string;
      report_date: string;
      description: string;
      images?: File[];
    }): Promise<SubmitReportResponse> => {
      setLoading(true);
      setError(null);

      try {
        const response = await integratedInitiativeApi.submitCampaignReport(
          data
        );
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to submit report";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get campaign reports
  const getCampaignReports = useCallback(async (campaignId?: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await integratedInitiativeApi.getCampaignReports(
        campaignId
      );
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch reports";
      setError(errorMessage);
      return {
        success: false,
        data: [],
        total: 0,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get campaign acceptance status
  const getCampaignAcceptanceStatus = useCallback(
    async (campaignId: number) => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await integratedInitiativeApi.getCampaignAcceptanceStatus(campaignId);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to get acceptance status";
        setError(errorMessage);
        return {
          success: false,
          data: {
            status: "pending" as const,
          },
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debug function
  const debugContext = useCallback(() => {
    integratedInitiativeApi.debugContext();
  }, []);

  return {
    loading,
    error,
    getMyCampaigns,
    acceptCampaign,
    declineCampaign,
    submitCampaignReport,
    getCampaignReports,
    getCampaignAcceptanceStatus,
    debugContext,
  };
};
