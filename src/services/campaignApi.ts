import type {
  CreateCampaignRequest,
  CreateCampaignResponse,
  CampaignListResponse,
  CampaignDetailResponse,
  CampaignHierarchyResponse,
  UpdateCampaignRequest,
  CampaignAcceptanceRequest,
  CampaignAcceptanceResponse,
  AcceptanceDetailsResponse,
} from "../types/campaign-api";

// Base API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://backend.peopleconnect.in/api";

class CampaignApi {
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

  // Helper to determine state_id and party_id based on user context
  private getContextualIds(campaignLevel: string, hierarchySelections?: any[]) {
    const { user, selectedAssignment } = this.getUserData();

    let state_id: number;
    let party_id: number = user.partyId;

    if (campaignLevel === "State" || !selectedAssignment) {
      // For state level campaigns or when no assignment is selected, use stateMasterData_id
      state_id = selectedAssignment?.stateMasterData_id || 1;
    } else {
      // For district/assembly level campaigns, extract state_id from hierarchy
      if (hierarchySelections && hierarchySelections.length > 0) {
        // Find the state in the hierarchy chain
        const stateHierarchy = hierarchySelections.find(
          (h) => h.hierarchy_type === "stateMasterData"
        );
        state_id =
          stateHierarchy?.hierarchy_id ||
          selectedAssignment?.stateMasterData_id ||
          1;
      } else {
        state_id = selectedAssignment?.stateMasterData_id || 1;
      }
    }

    return { state_id, party_id };
  }

  // Create Campaign
  async createCampaign(
    data: CreateCampaignRequest
  ): Promise<CreateCampaignResponse> {
    // Auto-populate state_id and party_id based on user context
    const { state_id, party_id } = this.getContextualIds(
      data.campaign_level,
      data.hierarchy_selections
    );

    const requestData = {
      ...data,
      state_id,
      party_id,
    };

    return this.request<CreateCampaignResponse>("/campaigns/create", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
  }

  // Get Campaign by ID
  async getCampaignById(campaignId: number): Promise<CampaignDetailResponse> {
    return this.request<CampaignDetailResponse>(`/campaigns/${campaignId}`);
  }

  // List My Campaigns
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
    return this.request<CampaignListResponse>(
      `/campaigns/my-campaigns${query}`
    );
  }

  // List Created Campaigns
  async getCreatedCampaigns(): Promise<CampaignListResponse> {
    return this.request<CampaignListResponse>("/campaigns/created-by-me");
  }

  // Get Hierarchy Data
  async getHierarchyData(
    state_id?: number,
    party_id?: number
  ): Promise<CampaignHierarchyResponse> {
    // Use contextual IDs if not provided
    const contextualIds = this.getContextualIds("State");
    const finalStateId = state_id || contextualIds.state_id;
    const finalPartyId = party_id || contextualIds.party_id;

    return this.request<CampaignHierarchyResponse>(
      `/campaigns/hierarchy?state_id=${finalStateId}&party_id=${finalPartyId}`
    );
  }

  // Update Campaign
  async updateCampaign(
    campaignId: number,
    data: UpdateCampaignRequest
  ): Promise<CampaignDetailResponse> {
    return this.request<CampaignDetailResponse>(`/campaigns/${campaignId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Get Acceptance Details (Campaign Creator Only)
  async getAcceptanceDetails(
    campaignId: number
  ): Promise<AcceptanceDetailsResponse> {
    return this.request<AcceptanceDetailsResponse>(
      `/campaigns/${campaignId}/acceptance-details`
    );
  }

  // Mark Campaign Complete
  async markCampaignComplete(
    campaignId: number
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/campaigns/${campaignId}/complete`,
      {
        method: "PATCH",
      }
    );
  }

  // Delete Campaign
  async deleteCampaign(
    campaignId: number
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      `/campaigns/${campaignId}`,
      {
        method: "DELETE",
      }
    );
  }

  // Accept/Decline Campaign
  async respondToCampaign(
    campaignId: number,
    data: CampaignAcceptanceRequest
  ): Promise<CampaignAcceptanceResponse> {
    return this.request<CampaignAcceptanceResponse>(
      `/campaign-acceptance/${campaignId}`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  }

  // Get Acceptance Status
  async getAcceptanceStatus(
    campaignId: number
  ): Promise<CampaignAcceptanceResponse> {
    return this.request<CampaignAcceptanceResponse>(
      `/campaign-acceptance/${campaignId}`
    );
  }
}

export const campaignApi = new CampaignApi();
