import { useState, useCallback } from "react";
import { campaignApi } from "../services/campaignApi";
import type {
  CreateCampaignRequest,
  CampaignFormData,
} from "../types/campaign-api";

export const useCampaign = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCampaign = useCallback(async (formData: CampaignFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Transform form data to API request format
      const requestData: CreateCampaignRequest = {
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        campaign_level: formData.campaign_level,
        hierarchy_selections: formData.hierarchy_selections,
        // state_id and party_id will be auto-populated by the API service
      };

      const response = await campaignApi.createCampaign(requestData);
      return response.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create campaign";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCampaignById = useCallback(async (campaignId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await campaignApi.getCampaignById(campaignId);
      return response.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch campaign";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMyCampaigns = useCallback(
    async (params?: {
      isActive?: number;
      sort_by?: string;
      order?: "asc" | "desc";
    }) => {
      setLoading(true);
      setError(null);

      try {
        const response = await campaignApi.getMyCampaigns(params);
        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch campaigns";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getCreatedCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await campaignApi.getCreatedCampaigns();
      return response.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch created campaigns";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getHierarchyData = useCallback(
    async (state_id?: number, party_id?: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await campaignApi.getHierarchyData(state_id, party_id);
        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch hierarchy data";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const acceptCampaign = useCallback(async (campaignId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await campaignApi.respondToCampaign(campaignId, {
        status: "accepted",
      });
      return response.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to accept campaign";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const declineCampaign = useCallback(async (campaignId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await campaignApi.respondToCampaign(campaignId, {
        status: "declined",
      });
      return response.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to decline campaign";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAcceptanceDetails = useCallback(async (campaignId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await campaignApi.getAcceptanceDetails(campaignId);
      return response.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch acceptance details";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markCampaignComplete = useCallback(async (campaignId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await campaignApi.markCampaignComplete(campaignId);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to mark campaign complete";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCampaign = useCallback(async (campaignId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await campaignApi.deleteCampaign(campaignId);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete campaign";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createCampaign,
    getCampaignById,
    getMyCampaigns,
    getCreatedCampaigns,
    getHierarchyData,
    acceptCampaign,
    declineCampaign,
    getAcceptanceDetails,
    markCampaignComplete,
    deleteCampaign,
  };
};
