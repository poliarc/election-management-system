export interface Campaign {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  image?: string | string[] | null;
  location?: string | null;
  levelType: string;
  level_id: number;
  acceptance_status: "pending" | "accepted" | "declined"; // DB or normalized
  created_at: string;
  updated_at: string;
  scope_id: number;
  acceptance_id?: number; // For report submission when accepted
  scope_level_type: string;
  scope_level_id: number;
  report_count: number;
}

export interface CampaignListResponse {
  success: boolean;
  campaigns: Campaign[];
  userContext: {
    levelType: string;
    level_id: number;
  };
}

export interface CampaignEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startDate: string;
  endDate: string;
  time: string;
  location: string;
  category: "social" | "meeting";
  priority: "low" | "medium" | "high";
  attendeeCount: number;
  maxAttendees: number;
  acceptance_status: "pending" | "accepted" | "declined";
  image: string | string[];
  organizer: string;
  requirements: string[];
  createdAt: string;
  updatedAt: string;
  levelType: string;
  level_id: number;
  scope_level_type: string;
  scope_level_id: number;
  campaign_id: number;
  scope_id?: number;
  acceptance_id?: number;
}

export interface CampaignFormData {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  additionalGuests?: number;
  specialRequirements?: string;
  transportNeeded?: boolean;
  accommodationNeeded?: boolean;
  dietaryRestrictions?: string;
  images?: File[];
}

export interface AcceptDeclinePayload {
  campaign_scope_id: number;
  acceptance_status: "accepted" | "declined";
  // Optional if backend uses district_id for audits; controller derives actual user from context
  district_id?: number;
  userLevelType?: string;
  userLevelId?: number;
}

export interface SubmitReportResponse {
  success: boolean;
  message: string;
  reportId: number;
  campaignName: string;
  userLevelType?: string;
  userLevelId?: number;
}

export interface CampaignNotificationCardProps {
  notification: CampaignEvent;
  onAccept?: () => void;
  onDecline?: () => void;
}
