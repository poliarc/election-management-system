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
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location?: string | null;
  image?: string | null;
  images?: string[]; // New: Array of image URLs for multiple images
  levelType: string;
  level_id: number;
  levelOrderNo: string;
  status: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
  scope_id: number;
  scope_level_type: string;
  scope_level_id: number;
  acceptance_status: string;
  acceptance_id: number | null;
  report_count: number;
  // Keeping old fields for compatibility, but they might not be used
  title?: string;
  media?: CampaignMedia;
  participants?: CampaignParticipant[];
  totalParticipants?: number;
}

export interface CampaignReport {
  id: number;
  state: string;
  district: string;
  location: string;
  attendees: number;
  personName: string;
  personPhone: string;
  images: string | string[];
  date: string;
  description: string;
  karyakarta_id: number;
  campaign_id: number;
  created_at: string;
  updated_at: string;
  karyakarta_firstName: string;
  karyakarta_phone: string;
  reporter_level?: string;
  // Optional hierarchy data for detail modal
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
