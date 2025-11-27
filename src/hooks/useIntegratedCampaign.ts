import { useState, useCallback } from "react";
import { integratedCampaignApi } from "../services/integratedCampaignApi";
import type { LegacyCampaignFormData } from "../schemas/campaignSchema";
import type { CampaignFormData } from "../types/campaign-api";

export const useIntegratedCampaign = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create campaign from legacy form data (for existing UI)
  const createCampaignFromLegacyForm = useCallback(
    async (formData: LegacyCampaignFormData) => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await integratedCampaignApi.createCampaignFromLegacyForm(formData);
        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create campaign";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Create campaign with new API format
  const createCampaign = useCallback(async (formData: CampaignFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await integratedCampaignApi.createCampaign({
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        campaign_level: formData.campaign_level,
        hierarchy_selections: formData.hierarchy_selections,
      });
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
      const response = await integratedCampaignApi.getCampaignById(campaignId);
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
        const response = await integratedCampaignApi.getMyCampaigns(params);
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
      const response = await integratedCampaignApi.getCreatedCampaigns();
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
        const response = await integratedCampaignApi.getHierarchyData(
          state_id,
          party_id
        );
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
      const response = await integratedCampaignApi.respondToCampaign(
        campaignId,
        { status: "accepted" }
      );
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
      const response = await integratedCampaignApi.respondToCampaign(
        campaignId,
        { status: "declined" }
      );
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
      const response = await integratedCampaignApi.getAcceptanceDetails(
        campaignId
      );
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
      const response = await integratedCampaignApi.markCampaignComplete(
        campaignId
      );
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
      const response = await integratedCampaignApi.deleteCampaign(campaignId);
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

  // Debug function
  const debugContext = useCallback(() => {
    integratedCampaignApi.debugContext();
  }, []);

  // Update campaign
  const updateCampaign = useCallback(
    async (campaignId: number, data: unknown) => {
      setLoading(true);
      setError(null);

      try {
        const response = await integratedCampaignApi.updateCampaign(
          campaignId,
          data
        );
        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update campaign";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    createCampaign,
    createCampaignFromLegacyForm,
    updateCampaign,
    getCampaignById,
    getMyCampaigns,
    getCreatedCampaigns,
    getHierarchyData,
    acceptCampaign,
    declineCampaign,
    getAcceptanceDetails,
    markCampaignComplete,
    deleteCampaign,
    debugContext,
  };
};
