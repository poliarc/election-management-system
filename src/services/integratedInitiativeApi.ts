import type {
  Campaign,
  CampaignListResponse,
  AcceptDeclinePayload,
  SubmitReportResponse,
} from "../types/initative";

// Base API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://backend.peopleconnect.in/api";

class IntegratedInitiativeApi {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem("accessToken");

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `API request failed: ${response.statusText}`
      );
    }

    return response.json();
  }

  // Helper to get user data from localStorage
  private getUserData() {
    const userStr = localStorage.getItem("user");
    const selectedAssignmentStr = localStorage.getItem("selectedAssignment");

    if (!userStr) {
      throw new Error("User not found in localStorage");
    }

    const user = JSON.parse(userStr);
    const selectedAssignment = selectedAssignmentStr
      ? JSON.parse(selectedAssignmentStr)
      : null;

    return { user, selectedAssignment };
  }

  // Get campaigns assigned to current user (initiative receiver)
  async getMyCampaigns(params?: {
    isActive?: number;
    sort_by?: string;
    order?: "asc" | "desc";
  }): Promise<CampaignListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.isActive !== undefined)
      searchParams.append("isActive", params.isActive.toString());
    if (params?.sort_by) searchParams.append("sort_by", params.sort_by);
    if (params?.order) searchParams.append("order", params.order);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";

    try {
      const response = await this.request<{
        success: boolean;
        message: string;
        data: any[];
        total: number;
      }>(`/campaigns/my-campaigns${query}`);

      // Transform API response to match initiative types
      const campaigns: Campaign[] = response.data.map((campaign: any) => ({
        id: campaign.campaign_id,
        name: campaign.name,
        description: campaign.description,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        image: campaign.images || null,
        location: null, // Not in new API structure
        levelType: campaign.campaign_level,
        level_id: campaign.campaign_id, // Using campaign_id as level_id for now
        acceptance_status: campaign.user_acceptance_status || "pending",
        created_at: campaign.start_date, // Using start_date as created_at
        updated_at: campaign.end_date, // Using end_date as updated_at
        scope_id: campaign.campaign_id,
        acceptance_id:
          campaign.user_acceptance_status === "accepted"
            ? campaign.campaign_id
            : undefined,
        scope_level_type: campaign.campaign_level,
        scope_level_id: campaign.campaign_id,
        report_count: 0, // Not available in new API
      }));

      return {
        success: response.success,
        campaigns,
        userContext: {
          levelType:
            this.getUserData().selectedAssignment?.levelType || "State",
          level_id: this.getUserData().selectedAssignment?.assignment_id || 1,
        },
      };
    } catch (error) {
      console.error("Failed to fetch campaigns from API:", error);

      // Return empty response on error
      return {
        success: false,
        campaigns: [],
        userContext: {
          levelType: "State",
          level_id: 1,
        },
      };
    }
  }

  // Accept or decline a campaign
  async updateCampaignAcceptance(payload: AcceptDeclinePayload): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Map to new API format
      const response = await this.request<{
        success: boolean;
        message: string;
        data: any;
      }>(`/campaign-acceptance/${payload.campaign_scope_id}`, {
        method: "POST",
        body: JSON.stringify({
          status: payload.acceptance_status,
        }),
      });

      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error("Failed to update campaign acceptance:", error);
      throw error;
    }
  }

  // Submit campaign report
  async submitCampaignReport(data: {
    campaign_acceptance_id: number;
    attendees: number;
    personName: string;
    personPhone: string;
    report_date: string;
    description: string;
    images?: File[];
  }): Promise<SubmitReportResponse> {
    try {
      // Handle image upload if needed
      let formData = new FormData();
      formData.append(
        "campaign_acceptance_id",
        data.campaign_acceptance_id.toString()
      );
      formData.append("attendees", data.attendees.toString());
      formData.append("personName", data.personName);
      formData.append("personPhone", data.personPhone);
      formData.append("report_date", data.report_date);
      formData.append("description", data.description);

      if (data.images && data.images.length > 0) {
        data.images.forEach((image) => {
          formData.append(`images`, image);
        });
      }

      const response = await fetch(`${API_BASE_URL}/campaign-reports/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit report");
      }

      const result = await response.json();

      return {
        success: result.success,
        message: result.message,
        reportId: result.data.campaignReport_id,
        campaignName: result.data.campaign_name,
        userLevelType: this.getUserData().selectedAssignment?.levelType,
        userLevelId: this.getUserData().selectedAssignment?.assignment_id,
      };
    } catch (error) {
      console.error("Failed to submit campaign report:", error);
      throw error;
    }
  }

  // Get campaign reports
  async getCampaignReports(campaignId?: number): Promise<{
    success: boolean;
    data: any[];
    total: number;
  }> {
    try {
      const query = campaignId ? `?campaign_id=${campaignId}` : "";
      const response = await this.request<{
        success: boolean;
        data: any[];
        total: number;
      }>(`/campaign-reports/all${query}`);

      return response;
    } catch (error) {
      console.error("Failed to fetch campaign reports:", error);
      return {
        success: false,
        data: [],
        total: 0,
      };
    }
  }

  // Get acceptance status for a specific campaign
  async getCampaignAcceptanceStatus(campaignId: number): Promise<{
    success: boolean;
    data: {
      status: "pending" | "accepted" | "declined";
      accepted_on?: string;
      declined_on?: string;
    };
  }> {
    try {
      const response = await this.request<{
        success: boolean;
        data: any;
      }>(`/campaign-acceptance/${campaignId}`);

      return {
        success: response.success,
        data: {
          status: response.data.status,
          accepted_on: response.data.accepted_on,
          declined_on: response.data.declined_on,
        },
      };
    } catch (error) {
      console.error("Failed to get campaign acceptance status:", error);
      return {
        success: false,
        data: {
          status: "pending",
        },
      };
    }
  }

  // Debug function to log current context
  debugContext() {
    const { user, selectedAssignment } = this.getUserData();
    console.log("=== Initiative API Context Debug ===");
    console.log("User:", user);
    console.log("Selected Assignment:", selectedAssignment);
    console.log("====================================");
  }
}

export const integratedInitiativeApi = new IntegratedInitiativeApi();
