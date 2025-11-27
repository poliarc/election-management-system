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
  HierarchySelection,
} from "../types/campaign-api";
import type { LegacyCampaignFormData } from "../schemas/campaignSchema";

// Base API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://backend.peopleconnect.in/api";

class IntegratedCampaignApi {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    // Get access token from auth_state (same place as user data)
    let token = null;

    try {
      const authStateStr = localStorage.getItem("auth_state");
      if (authStateStr) {
        const authState = JSON.parse(authStateStr);
        token = authState.accessToken;
        console.log(
          "Debug - Got token from auth_state:",
          token ? "Token found" : "No token in auth_state"
        );
      }
    } catch (error) {
      console.error("Error getting token from auth_state:", error);
    }

    // Fallback to other possible keys
    if (!token) {
      token = localStorage.getItem("accessToken");
      console.log(
        "Debug - Fallback to accessToken:",
        token ? "Token found" : "No accessToken"
      );
    }
    if (!token) {
      token = localStorage.getItem("token");
      console.log(
        "Debug - Fallback to token:",
        token ? "Token found" : "No token"
      );
    }

    console.log(
      "Debug - Final token being used:",
      token ? `${token.substring(0, 20)}...` : "No token found"
    );

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
    // Debug localStorage contents
    console.log("=== localStorage Debug ===");
    console.log("All localStorage keys:", Object.keys(localStorage));

    // Get auth state from localStorage (correct path: auth_state.user.partyId)
    const authStateStr = localStorage.getItem("auth_state");
    const selectedAssignmentStr = localStorage.getItem("selectedAssignment");

    console.log("Raw auth_state string:", authStateStr);
    console.log("Raw selectedAssignment string:", selectedAssignmentStr);

    if (!authStateStr) {
      console.error("Available localStorage keys:", Object.keys(localStorage));
      throw new Error("auth_state not found in localStorage");
    }

    const authState = JSON.parse(authStateStr);
    // Get selectedAssignment from separate key or from auth_state
    let selectedAssignment = null;
    if (selectedAssignmentStr) {
      selectedAssignment = JSON.parse(selectedAssignmentStr);
    } else if (authState.selectedAssignment) {
      selectedAssignment = authState.selectedAssignment;
    }

    console.log("Debug - Retrieved authState from localStorage:", authState);

    // Extract user data directly from auth_state.user (known structure)
    const userData = authState.user;
    console.log("Debug - Extracted user data from auth_state.user:", userData);

    console.log("Debug - User partyId:", userData?.partyId);

    // Ensure we have the user data and partyId
    if (!userData) {
      console.error("User data not found in auth_state.user:", authState);
      throw new Error("User data not found in auth_state.user");
    }

    if (!userData.partyId) {
      console.error("partyId not found in user data:", userData);
      console.error("Full auth state structure:", authState);
      throw new Error("partyId not found in user data");
    }

    return { user: userData, selectedAssignment };
  }

  // Helper to determine state_id, party_id, and user_id based on user context
  private getContextualIds(
    campaignLevel: string,
    hierarchySelections?: HierarchySelection[]
  ) {
    const { user, selectedAssignment } = this.getUserData();

    console.log("Debug - User data:", user);
    console.log("Debug - Selected assignment:", selectedAssignment);

    let state_id: number;
    const party_id: number = user.partyId;
    const user_id: number = user.id;

    console.log("Debug - Extracted party_id:", party_id);
    console.log("Debug - Extracted user_id:", user_id);
    console.log("Debug - party_id type:", typeof party_id);
    console.log("Debug - user_id type:", typeof user_id);
    console.log("Debug - Campaign level:", campaignLevel);

    // Ensure party_id is a valid number
    if (!party_id || typeof party_id !== "number") {
      console.error("Invalid party_id:", party_id);
      throw new Error(`Invalid party_id: ${party_id}. Expected a number.`);
    }

    // Ensure user_id is a valid number
    if (!user_id || typeof user_id !== "number") {
      console.error("Invalid user_id:", user_id);
      throw new Error(`Invalid user_id: ${user_id}. Expected a number.`);
    }

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

    // Ensure state_id is a valid number
    if (!state_id || typeof state_id !== "number") {
      console.error("Invalid state_id:", state_id);
      throw new Error(`Invalid state_id: ${state_id}. Expected a number.`);
    }

    console.log("Debug - Final contextual IDs:", {
      state_id,
      party_id,
      user_id,
    });
    return { state_id, party_id, user_id };
  }

  // Transform legacy form data to new API format
  private transformLegacyToNewFormat(
    data: LegacyCampaignFormData
  ): CreateCampaignRequest {
    // Convert targetScopes to hierarchy_selections
    const hierarchy_selections: HierarchySelection[] = [];

    if (data.targetScopes) {
      data.targetScopes.forEach((scope) => {
        // Map legacy level types to new hierarchy types
        let hierarchy_type: "stateMasterData" | "afterAssemblyData";

        if (
          scope.levelType === "DISTRICT" ||
          scope.levelType === "ASSEMBLY" ||
          scope.levelType === "STATE"
        ) {
          hierarchy_type = "stateMasterData";
        } else {
          hierarchy_type = "afterAssemblyData";
        }

        hierarchy_selections.push({
          hierarchy_type,
          hierarchy_id: parseInt(scope.level_id),
          toggle_on: true,
        });
      });
    }

    // If no hierarchy selections, create a default state-level selection
    if (hierarchy_selections.length === 0) {
      const { state_id } = this.getContextualIds("State");
      hierarchy_selections.push({
        hierarchy_type: "stateMasterData",
        hierarchy_id: state_id,
        toggle_on: true,
      });
    }

    // Determine campaign level based on targetScopes
    let campaign_level: "State" | "District" | "Assembly" | "Block" | "Mandal" =
      "State";
    if (data.targetScopes && data.targetScopes.length > 0) {
      const firstScope = data.targetScopes[0];
      switch (firstScope.levelType) {
        case "DISTRICT":
          campaign_level = "District";
          break;
        case "ASSEMBLY":
          campaign_level = "Assembly";
          break;
        case "BLOCK":
          campaign_level = "Block";
          break;
        case "MANDAL":
          campaign_level = "Mandal";
          break;
        default:
          campaign_level = "State";
      }
    }

    return {
      name: data.title,
      description: data.description,
      start_date: data.start_date || new Date().toISOString().split("T")[0],
      end_date: data.end_date || new Date().toISOString().split("T")[0],
      campaign_level,
      hierarchy_selections,
    };
  }

  // Create Campaign (with legacy form data support)
  async createCampaignFromLegacyForm(
    data: LegacyCampaignFormData
  ): Promise<CreateCampaignResponse> {
    const transformedData = this.transformLegacyToNewFormat(data);

    // Auto-populate state_id, party_id, and user_id based on user context
    const { state_id, party_id, user_id } = this.getContextualIds(
      transformedData.campaign_level,
      transformedData.hierarchy_selections
    );

    const requestData = {
      ...transformedData,
      state_id,
      party_id,
      // user_id should come from JWT token, not request body
    };

    console.log("Debug - Final request data:", requestData);

    return this.request<CreateCampaignResponse>("/campaigns/create", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
  }

  // Create Campaign (with new API format)
  async createCampaign(
    data: CreateCampaignRequest
  ): Promise<CreateCampaignResponse> {
    // Auto-populate state_id, party_id, and user_id based on user context
    const { state_id, party_id, user_id } = this.getContextualIds(
      data.campaign_level,
      data.hierarchy_selections
    );

    const requestData = {
      ...data,
      state_id,
      party_id,
      // user_id should come from JWT token, not request body
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

  // Debug function to log current context
  debugContext() {
    try {
      const { user, selectedAssignment } = this.getUserData();
      console.log("=== Campaign API Context Debug ===");
      console.log("User:", user);
      console.log("Selected Assignment:", selectedAssignment);

      if (user && selectedAssignment) {
        console.log(
          "Contextual IDs for State campaign:",
          this.getContextualIds("State")
        );
      }
      console.log("==============================");
    } catch (error) {
      console.error("Debug context failed:", error);
    }
  }
}

export const integratedCampaignApi = new IntegratedCampaignApi();
