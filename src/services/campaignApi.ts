import { API_CONFIG, getApiUrl } from "../config/api";
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
import { storage } from "../utils/storage";

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
    const token = storage.getToken("access");
    if (!token) {
      throw new Error("Access token required");
    }
    const endpoint = "/api/campaigns/hierarchy";
    const url = new URL(getApiUrl(endpoint));
    url.searchParams.set("state_id", String(stateId));
    url.searchParams.set("party_id", String(partyId));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: `HTTP ${response.status}` }));
      const errorMessage =
        errorData.error?.message ||
        errorData.message ||
        `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return (await response.json()) as CampaignHierarchyResponse;
  },

  async fetchCreatedByMe() {
    const token = storage.getToken("access");
    if (!token) {
      throw new Error("Access token required");
    }

    const endpoint = "/api/campaigns/created-by-me";
    const url = getApiUrl(endpoint);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: `HTTP ${response.status}` }));
      const errorMessage =
        errorData.error?.message ||
        errorData.message ||
        `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return (await response.json()) as CampaignListResponse;
  },

  async fetchCampaignById(campaignId: string | number) {
    const numericId = Number(campaignId);
    if (!Number.isFinite(numericId)) {
      throw new Error("A valid campaign id is required to load details.");
    }

    const token = storage.getToken("access");
    if (!token) {
      throw new Error("Access token required");
    }

    const endpoint = `/api/campaigns/${numericId}`;
    const url = getApiUrl(endpoint);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: `HTTP ${response.status}` }));
      const errorMessage =
        errorData.error?.message ||
        errorData.message ||
        `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return (await response.json()) as CampaignDetailResponse;
  },

  async fetchCampaignReports(campaignId: string | number) {
    const numericId = Number(campaignId);
    if (!Number.isFinite(numericId)) {
      throw new Error(
        "A valid campaign id is required to load participant reports."
      );
    }

    const token = storage.getToken("access");
    if (!token) {
      throw new Error("Access token required");
    }

    const endpoint = `/api/campaign-reports/campaign/${numericId}`;
    const url = getApiUrl(endpoint);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: `HTTP ${response.status}` }));
      const errorMessage =
        errorData.error?.message ||
        errorData.message ||
        `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    const json = (await response.json()) as CampaignReportsResponse;
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

    const token = storage.getToken("access");
    if (!token) {
      throw new Error("Access token required");
    }

    const endpoint = `/api/campaigns/${numericId}`;
    const url = getApiUrl(endpoint);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: `HTTP ${response.status}` }));
      const errorMessage =
        errorData.error?.message ||
        errorData.message ||
        `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return (await response.json()) as CampaignDeleteResponse;
  },

  async createCampaign(
    payload: CampaignCreateRequest,
    imageFiles: File[] = []
  ) {
    const token = storage.getToken("access");
    if (!token) {
      throw new Error("Access token required");
    }

    // Step 1: Create campaign without images (using JSON to avoid validation errors)
    const endpoint = "/api/campaigns/create";
    const url = getApiUrl(endpoint);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: `HTTP ${response.status}` }));
      const errorMessage =
        errorData.error?.message ||
        errorData.message ||
        `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    const result = (await response.json()) as CampaignCreateResponse;

    // Step 2: If images exist, upload them separately
    if (imageFiles.length > 0 && result.data?.campaign_id) {
      try {
        await this.uploadCampaignImages(
          Number(result.data.campaign_id),
          imageFiles,
          token
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
    imageFiles: File[],
    token: string
  ): Promise<void> {
    const endpoint = `/api/campaigns/${campaignId}`;
    const url = getApiUrl(endpoint);

    const formData = new FormData();
    imageFiles.forEach((file) => {
      formData.append("images", file);
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: `HTTP ${response.status}` }));
      throw new Error(
        errorData.error?.message ||
          errorData.message ||
          "Failed to upload images"
      );
    }
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

    const token = storage.getToken("access");
    if (!token) {
      throw new Error("Access token required");
    }

    // If images exist, upload them using multipart
    if (imageFiles.length > 0) {
      const endpoint = `/api/campaigns/${numericId}`;
      const url = getApiUrl(endpoint);

      const formData = new FormData();
      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `HTTP ${response.status}` }));
        const errorMessage =
          errorData.error?.message ||
          errorData.message ||
          `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      return (await response.json()) as CampaignCreateResponse;
    }

    // No images - update with JSON
    const endpoint = `/api/campaigns/${numericId}`;
    const url = getApiUrl(endpoint);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: `HTTP ${response.status}` }));
      const errorMessage =
        errorData.error?.message ||
        errorData.message ||
        `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return (await response.json()) as CampaignCreateResponse;
  },

  async completeCampaign(campaignId: string | number) {
    const numericId = Number(campaignId);
    if (!Number.isFinite(numericId)) {
      throw new Error(
        "A valid campaign id is required to complete a campaign."
      );
    }

    const token = storage.getToken("access");
    if (!token) {
      throw new Error("Access token required");
    }

    const endpoint = `/api/campaigns/${numericId}/complete`;
    const url = getApiUrl(endpoint);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: `HTTP ${response.status}` }));
      const errorMessage =
        errorData.error?.message ||
        errorData.message ||
        `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return (await response.json()) as CampaignCreateResponse;
  },
};

export default campaignApi;
