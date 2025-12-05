export type CampaignStatus = "completed" | "active";
export type CampaignType = "ground campaign" | "event";

export interface CampaignParticipant {
  id: string;
  name: string;
  avatar: string;
  joinedAt: string;
  contributions: {
    images: number;
    videos: number;
    posts: number;
  };
}

export interface CampaignMedia {
  images: string[];
  videos: string[];
}

export interface Campaign {
  id: string | number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location?: string | null;
  image?: string | null;
  images?: string[]; // New: Array of image URLs for multiple images
  hierarchy_selections?: CampaignHierarchyScopeSelection[];
  levelType: string;
  level_id: number;
  levelOrderNo: string;
  status: number;
  isActive?: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
  scope_id: number;
  scope_level_type: string;
  scope_level_id: number;
  acceptance_status: string;
  acceptance_id: number | null;
  report_count: number;
  campaign_id?: number | string;
  campaignId?: number | string;
  // Keeping old fields for compatibility, but they might not be used
  title?: string;
  media?: CampaignMedia;
  participants?: CampaignParticipant[];
  totalParticipants?: number;
  // Acceptance counts from created-by-me API
  accepted_count?: number;
  declined_count?: number;
  pending_count?: number;
  // add fields as needed
}

// Hierarchy types for campaign form selects
export interface StateHierarchyNode {
  id: number;
  levelName: string; // e.g., Assam, Bajali, Abhayapuri
  levelType: "State" | "District" | "Assembly";
  ParentId: number | null;
  level: number; // 0 state, 1 district, 2 assembly
}

export interface AfterAssemblyHierarchyNode {
  id: number;
  levelName: string; // Provided by API (e.g., Mandal, Block, Polling Center)
  displayName: string;
  parentId: number | null; // null for top after-assembly level (e.g., Mandal)
  parentAssemblyId: number; // assembly id this subtree belongs to
  partyLevelId: number;
  isActive: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
  display_level_name: string; // e.g., "Mandal", "Block", "Polling Center"
}

export interface CampaignHierarchyData {
  stateHierarchy: StateHierarchyNode[];
  afterAssemblyHierarchy: AfterAssemblyHierarchyNode[];
}

export interface CampaignHierarchyResponse {
  success: boolean;
  message: string;
  data: CampaignHierarchyData;
}

export interface CampaignListResponse {
  success: boolean;
  message: string;
  data: Campaign[];
}

export interface CampaignHierarchySelection {
  hierarchy_type: "stateMasterData" | "afterAssemblyData";
  hierarchy_id: number;
  toggle_on: boolean;
}

export interface CampaignHierarchyScopeSelection {
  campaignScope_id: number;
  campaign_id: number;
  hierarchy_type: "stateMasterData" | "afterAssemblyData";
  hierarchy_id: number;
  toggle_on: number;
  isActive: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
  hierarchy_name?: string;
  hierarchy_level_type?: string;
}

export interface CampaignDetail {
  campaign_id: number;
  name: string;
  description: string;
  start_date?: string | null;
  end_date?: string | null;
  images?: string[];
  campaign_level: string;
  state_id: number;
  party_id: number;
  created_by: number;
  isActive: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
  location?: string | null;
  partyName?: string;
  state_name?: string;
  creator_first_name?: string;
  creator_last_name?: string;
  hierarchy_selections: CampaignHierarchyScopeSelection[];
}

export interface CampaignDetailResponse {
  success: boolean;
  message: string;
  data: CampaignDetail;
}

export interface CampaignCreateRequest {
  name: string;
  description: string;
  start_date?: string;
  end_date?: string;
  campaign_level: string;
  state_id: number;
  party_id: number;
  hierarchy_selections: CampaignHierarchySelection[];
  location?: string;
}

export interface CampaignCreateResponse {
  success: boolean;
  message: string;
  data?: Campaign;
}

export interface CampaignDeleteResponse {
  success: boolean;
  message: string;
}

export interface CampaignReport {
  id: number | string;
  state?: string | null;
  district?: string | null;
  location?: string | null;
  attendees?: number | null;
  personName?: string | null;
  personPhone?: string | null;
  images?: string | string[];
  date?: string;
  description?: string | null;
  karyakarta_id?: number | null;
  campaign_id?: number | null;
  created_at?: string;
  updated_at?: string;
  karyakarta_firstName?: string | null;
  karyakarta_phone?: string | null;
  reporter_level?: string | null;
  campaign_acceptance_id?: number | null;
  acceptance_status?: string;
  hierarchy?: {
    state?: { id: number; name: string } | null;
    district?: { id: number; name: string } | null;
    assembly?: { id: number; name: string } | null;
    block?: { id: number; name: string } | null;
    mandal?: { id: number; name: string } | null;
    booth?: { id: number; name: string; boothNo?: string | number } | null;
    karyakarta?: { id: number; name: string } | null;
  };
  hierarchyFormatted?: {
    fullPath: Array<{
      level: string;
      id: number;
      name: string;
      displayName: string;
    }>;
    pathString: string;
  };
}

export interface CampaignReportsApiItem {
  campaignReport_id: number;
  campaign_acceptance_id: number | null;
  attendees: number | null;
  personName: string | null;
  personPhone: string | null;
  images: string[];
  report_date: string | null;
  description: string | null;
  isActive: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
  user_id: number | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  contact_no: string | null;
  campaign_id?: number;
  location?: string | null;
  reporter_level?: string | null;
}

export interface CampaignReportsResponse {
  success: boolean;
  message: string;
  data: CampaignReportsApiItem[];
  total: number;
}

export interface CampaignReportsListResponse {
  success: boolean;
  message: string;
  data: CampaignReport[];
  total: number;
}

export interface AcceptanceStatsResponse {
  success: boolean;
  campaignId: number;
  campaignName: string;
  campaignCreator: {
    levelType: string;
    level_id: number;
  };
  overall: {
    totalScoped: number;
    totalResponses: number;
    totalAccepted: number;
    totalDeclined: number;
    totalPending: number;
    overallAcceptanceRate: string;
    overallResponseRate: string;
  };
}

export interface CampaignWithStats extends Campaign {
  acceptanceStats?: AcceptanceStatsResponse;
  isLoadingStats?: boolean;
  statsError?: boolean;
}

// My Campaigns API Response
export interface MyCampaignItem {
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
  isDelete: number;
  created_at: string;
  updated_at: string;
  location: string | null;
  partyName: string;
  state_name: string;
  user_acceptance_status: "pending" | "accepted" | "declined";
  accepted_on: string | null;
  declined_on: string | null;
  campaign_acceptance_id?: number | null;
}

export interface MyCampaignsResponse {
  success: boolean;
  message: string;
  data: MyCampaignItem[];
  total: number;
}
