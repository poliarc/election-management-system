import { apiClient } from "./api";
import type {
  CampaignCreateRequest,
  CampaignCreateResponse,
  CampaignDeleteResponse,
  CampaignListResponse,
  CampaignHierarchyResponse,
  CampaignDetailResponse,
  CampaignReportsResponse,
  CampaignReportsListResponse,
  CampaignReport,
  CampaignReportsApiItem,
} from "../types/campaign";

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return [value];
  }
  return [];
};

const normalizeCampaignReportFromApi = (
  report: CampaignReportsApiItem,
  fallbackCampaignId: number
): CampaignReport => {
  const images = toStringArray(report.images);
  const fallbackNameParts = [report.first_name, report.last_name].filter(
    (part): part is string => Boolean(part && part.trim())
  );
  const derivedName =
    report.personName && report.personName.trim().length > 0
      ? report.personName
      : fallbackNameParts.join(" ").trim() || null;

  const normalizedReport: CampaignReport = {
    id: report.campaignReport_id ?? `${fallbackCampaignId}-${Date.now()}`,
    campaign_id: report.campaign_id ?? fallbackCampaignId,
    campaign_acceptance_id: report.campaign_acceptance_id ?? null,
    attendees: report.attendees ?? null,
    personName: derivedName,
    personPhone: report.personPhone ?? report.contact_no ?? null,
    images,
    date: report.report_date ?? report.created_at ?? undefined,
    description: report.description ?? null,
    karyakarta_id: report.user_id ?? null,
    created_at: report.created_at,
    updated_at: report.updated_at,
    karyakarta_firstName: report.first_name ?? null,
    karyakarta_phone: report.contact_no ?? report.personPhone ?? null,
    reporter_level: report.reporter_level ?? null,
    location: report.location ?? null,
  };

  return normalizedReport;
};

export const campaignApi = {
  async fetchHierarchy(stateId: number, partyId: number) {
    const response = await apiClient.get('/campaigns/hierarchy', {
      params: { state_id: stateId, party_id: partyId }
    });
    return response.data as CampaignHierarchyResponse;
  },

  async fetchCreatedByMe() {
    const response = await apiClient.get('/campaigns/created-by-me');
    return response.data as CampaignListResponse;
  },

  async fetchCampaignById(campaignId: string | number) {
    const numericId = Number(campaignId);
    if (!Number.isFinite(numericId)) {
      throw new Error("A valid campaign id is required to load details.");
    }

    const response = await apiClient.get(`/campaigns/${numericId}`);
    return response.data as CampaignDetailResponse;
  },

  async fetchCampaignReports(campaignId: string | number) {
    const numericId = Number(campaignId);
    if (!Number.isFinite(numericId)) {
      throw new Error(
        "A valid campaign id is required to load participant reports."
      );
    }

    const response = await apiClient.get(`/campaign-reports/campaign/${numericId}`);
    const json = response.data as CampaignReportsResponse;
    const normalizedReports = Array.isArray(json.data)
      ? json.data.map((report) =>
          normalizeCampaignReportFromApi(report, numericId)
        )
      : [];

    const normalizedResponse: CampaignReportsListResponse = {
      success: json.success,
      message: json.message,
      total: json.total ?? normalizedReports.length,
      data: normalizedReports,
    };

    return normalizedResponse;
  },

  async deleteCampaign(campaignId: string | number) {
    const numericId = Number(campaignId);
    if (!Number.isFinite(numericId)) {
      throw new Error("A valid campaign id is required to delete a campaign.");
    }

    const response = await apiClient.delete(`/campaigns/${numericId}`);
    return response.data as CampaignDeleteResponse;
  },

  async createCampaign(
    payload: CampaignCreateRequest,
    imageFiles: File[] = []
  ) {
    // Step 1: Create campaign without images
    const response = await apiClient.post('/campaigns/create', payload);
    const result = response.data as CampaignCreateResponse;

    // Step 2: If images exist, upload them separately
    if (imageFiles.length > 0 && result.data?.campaign_id) {
      try {
        await this.uploadCampaignImages(
          Number(result.data.campaign_id),
          imageFiles
        );
      } catch (error) {
        console.error("Failed to upload images:", error);
        // Campaign is created, but images failed - don't throw error
      }
    }

    return result;
  },

  async uploadCampaignImages(
    campaignId: number,
    imageFiles: File[]
  ): Promise<void> {
    const formData = new FormData();
    imageFiles.forEach((file) => {
      formData.append("images", file);
    });

    await apiClient.put(`/campaigns/${campaignId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });
  },

  async updateCampaign(
    campaignId: string | number,
    payload: CampaignCreateRequest,
    imageFiles: File[] = []
  ) {
    const numericId = Number(campaignId);
    if (!Number.isFinite(numericId)) {
      throw new Error("A valid campaign id is required to update a campaign.");
    }

    // If images exist, upload them using multipart
    if (imageFiles.length > 0) {
      const formData = new FormData();
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const response = await apiClient.put(`/campaigns/${numericId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });
      return response.data as CampaignCreateResponse;
    }

    // No images - update with JSON
    const response = await apiClient.put(`/campaigns/${numericId}`, payload);
    return response.data as CampaignCreateResponse;
  },

  async completeCampaign(campaignId: string | number) {
    const numericId = Number(campaignId);
    if (!Number.isFinite(numericId)) {
      throw new Error(
        "A valid campaign id is required to complete a campaign."
      );
    }

    const response = await apiClient.patch(`/campaigns/${numericId}/complete`);
    return response.data as CampaignCreateResponse;
  },
};

export default campaignApi;
