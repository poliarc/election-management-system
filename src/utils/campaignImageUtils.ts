import type { Campaign } from "../types/campaign";

/**
 * Extract images from campaign data
 * Handles JSON array format stored in campaign.image field
 */
export const extractCampaignImages = (campaign: Campaign): string[] => {
  const images: string[] = [];

  // Check if campaign.image contains JSON array string
  if (campaign.image) {
    try {
      // Try to parse as JSON array first
      const parsedImages = JSON.parse(campaign.image);
      if (Array.isArray(parsedImages)) {
        parsedImages.forEach((img: string) => {
          if (img && typeof img === "string") {
            images.push(img);
          }
        });
      }
    } catch (e) {
      // If not JSON, treat as single image URL
      images.push(campaign.image);
    }
  }

  // Also check campaign.images array (if exists)
  if (campaign.images && Array.isArray(campaign.images)) {
    campaign.images.forEach((img) => {
      if (img && typeof img === "string" && !images.includes(img)) {
        images.push(img);
      }
    });
  }

  return images;
};

/**
 * Get the primary image (first image) from campaign
 */
export const getPrimaryCampaignImage = (campaign: Campaign): string | null => {
  const images = extractCampaignImages(campaign);
  return images.length > 0 ? images[0] : null;
};

/**
 * Check if campaign has multiple images
 */
export const hasMultipleCampaignImages = (campaign: Campaign): boolean => {
  return extractCampaignImages(campaign).length > 1;
};
