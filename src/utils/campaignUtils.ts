import type { Campaign } from "../types/campaign";
import type { CampaignEvent } from "../types/initative";

/**
 * Determines if a campaign is currently active based on status flags and end date
 * 
 * A campaign is considered active if:
 * 1. It's not manually marked as inactive (isActive !== 0 and status !== 0)
 * 2. Its end date hasn't passed (if end_date is provided)
 * 
 * @param campaign - The campaign object to check
 * @returns true if the campaign is active, false if completed
 */
export const isCampaignActive = (campaign: Campaign): boolean => {
  // First check if campaign is manually marked as inactive
  if (typeof campaign.isActive === "number") {
    if (campaign.isActive === 0) return false;
  }
  if (campaign.status === null || campaign.status === undefined) {
    // Continue to date check
  } else if (campaign.status === 0) {
    return false;
  }
  
  // Check if campaign end date has passed
  if (campaign.end_date) {
    const endDate = new Date(campaign.end_date);
    const currentDate = new Date();
    
    // Set time to end of day for end date and start of day for current date for fair comparison
    endDate.setHours(23, 59, 59, 999);
    currentDate.setHours(0, 0, 0, 0);
    
    // If end date has passed, campaign is completed
    if (endDate < currentDate) {
      return false;
    }
  }
  
  // If no end date or end date hasn't passed, and not manually deactivated, campaign is active
  return true;
};

/**
 * Determines if a campaign event is currently active based on end date
 * 
 * A campaign event is considered active if its end date hasn't passed
 * 
 * @param campaignEvent - The campaign event object to check
 * @returns true if the campaign event is active, false if ended
 */
export const isCampaignEventActive = (campaignEvent: CampaignEvent): boolean => {
  if (campaignEvent.endDate) {
    const endDate = new Date(campaignEvent.endDate);
    const currentDate = new Date();
    
    // Set time to end of day for end date and start of day for current date for fair comparison
    endDate.setHours(23, 59, 59, 999);
    currentDate.setHours(0, 0, 0, 0);
    
    // If end date has passed, campaign is ended
    if (endDate < currentDate) {
      return false;
    }
  }
  
  // If no end date or end date hasn't passed, campaign is active
  return true;
};

/**
 * Gets the appropriate status color classes for a campaign
 * 
 * @param campaign - The campaign object
 * @returns CSS classes for styling the campaign status
 */
export const getCampaignStatusColor = (campaign: Campaign): string => {
  return isCampaignActive(campaign)
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-800";
};

/**
 * Gets the status text for a campaign
 * 
 * @param campaign - The campaign object
 * @returns "active" or "completed"
 */
export const getCampaignStatusText = (campaign: Campaign): "active" | "completed" => {
  return isCampaignActive(campaign) ? "active" : "completed";
};

/**
 * Filters campaigns by status
 * 
 * @param campaigns - Array of campaigns to filter
 * @param status - Status to filter by ("all", "active", or "completed")
 * @returns Filtered array of campaigns
 */
export const filterCampaignsByStatus = (
  campaigns: Campaign[], 
  status: "all" | "active" | "completed"
): Campaign[] => {
  if (status === "all") return campaigns;
  
  return campaigns.filter(campaign => {
    const isActive = isCampaignActive(campaign);
    return status === "active" ? isActive : !isActive;
  });
};

/**
 * Filters campaign events by status (active/ended)
 * 
 * @param campaignEvents - Array of campaign events to filter
 * @param showEnded - Whether to include ended campaigns (default: true)
 * @returns Filtered array of campaign events
 */
export const filterCampaignEventsByStatus = (
  campaignEvents: CampaignEvent[], 
  showEnded: boolean = true
): CampaignEvent[] => {
  if (showEnded) return campaignEvents;
  
  return campaignEvents.filter(campaignEvent => isCampaignEventActive(campaignEvent));
};

/**
 * Gets campaign statistics
 * 
 * @param campaigns - Array of campaigns
 * @returns Object with total, active, and completed counts
 */
export const getCampaignStats = (campaigns: Campaign[]) => {
  return {
    total: campaigns.length,
    active: campaigns.filter(c => isCampaignActive(c)).length,
    completed: campaigns.filter(c => !isCampaignActive(c)).length,
  };
};