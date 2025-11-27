// Campaign API Types based on the provided documentation

export interface HierarchySelection {
  hierarchy_type: "stateMasterData" | "afterAssemblyData";
  hierarchy_id: number;
  toggle_on: boolean;
}

export interface CreateCampaignRequest {
  name: string;
  description: string;
  start_date: string; // YYYY-MM-DD format
  end_date: string; // YYYY-MM-DD format
  campaign_level: "State" | "District" | "Assembly" | "Block" | "Mandal";
  state_id?: number; // Will be auto-populated from user context
  party_id?: number; // Will be auto-populated from user context
  hierarchy_selections: HierarchySelection[];
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  hierarchy_selections?: HierarchySelection[];
}

export interface CampaignData {
  campaign_id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  images: string[];
  campaign_level: string;
  state_id: number;
  party_id: number;
  created_by: number;
  isActive: number;
  partyName: string;
  state_name: string;
  creator_first_name?: string;
  creator_last_name?: string;
  hierarchy_selections?: HierarchySelection[];
  user_acceptance_status?: "pending" | "accepted" | "declined";
  accepted_on?: string | null;
  declined_on?: string | null;
  accepted_count?: number;
  declined_count?: number;
  pending_count?: number;
}

export interface CreateCampaignResponse {
  success: boolean;
  message: string;
  data: CampaignData;
}

export interface CampaignDetailResponse {
  success: boolean;
  message: string;
  data: CampaignData;
}

export interface CampaignListResponse {
  success: boolean;
  message: string;
  data: CampaignData[];
  total: number;
}

// Hierarchy Data Types
export interface StateHierarchyItem {
  id: number;
  levelName: string;
  levelType: "State" | "District" | "Assembly";
  ParentId: number | null;
  level: number;
}

export interface AfterAssemblyHierarchyItem {
  id: number;
  levelName: string;
  displayName: string;
  parentId: number | null;
  parentAssemblyId: number | null;
  display_level_name: string;
}

export interface CampaignHierarchyResponse {
  success: boolean;
  message: string;
  data: {
    stateHierarchy: StateHierarchyItem[];
    afterAssemblyHierarchy: AfterAssemblyHierarchyItem[];
  };
}

// Campaign Acceptance Types
export interface CampaignAcceptanceRequest {
  status: "accepted" | "declined";
}

export interface CampaignAcceptanceData {
  campaignAcceptance_id: number;
  campaign_id: number;
  user_id: number;
  status: "accepted" | "declined" | "pending";
  accepted_on: string | null;
  declined_on: string | null;
  campaign_name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  images?: string[];
}

export interface CampaignAcceptanceResponse {
  success: boolean;
  message: string;
  data: CampaignAcceptanceData;
}

// Acceptance Details Types (for campaign creators)
export interface AcceptanceUser {
  campaignAcceptance_id: number;
  campaign_id: number;
  user_id: number;
  status: "accepted" | "declined" | "pending";
  accepted_on: string | null;
  declined_on: string | null;
  first_name: string;
  last_name: string;
  email: string;
  contact_no: string;
}

export interface AcceptanceSummary {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
}

export interface AcceptanceDetailsResponse {
  success: boolean;
  message: string;
  data: {
    campaign: {
      campaign_id: number;
      name: string;
      description: string;
      start_date: string;
      end_date: string;
      campaign_level: string;
      isActive: number;
    };
    acceptances: AcceptanceUser[];
    summary: AcceptanceSummary;
  };
}

// Form Data Types for UI
export interface CampaignFormData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  campaign_level: "State" | "District" | "Assembly" | "Block" | "Mandal";
  hierarchy_selections: HierarchySelection[];
  images?: File[];
}

// Helper types for hierarchy selection UI
export interface HierarchyTreeNode {
  id: number;
  name: string;
  type: string;
  parentId: number | null;
  level: number;
  children?: HierarchyTreeNode[];
  selected?: boolean;
  expanded?: boolean;
}
