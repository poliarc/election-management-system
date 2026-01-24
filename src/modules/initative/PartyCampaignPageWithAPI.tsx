import type { Campaign, CampaignEvent } from "../../types/initative";
import React, { useState } from "react";
import { Calendar, Bell, Plus, TrendingUp } from "lucide-react";
import { CampaignSlider } from "./CampaignSlider";
import { CampaignList } from "./CampaignList";
import { CampaignDetailModal } from "./CampaignDetailModal";
import { isCampaignEventActive } from "../../utils/campaignUtils";
import {
  getCampaignsByLevel,
  updateCampaignAcceptanceStatus,
  addCampaignReport,
} from "./data/staticInitiativeData";

// Helper function to validate campaign scope relevance
const isCampaignRelevantToDistrict = (
  campaign: Campaign,
  districtId: number
): boolean => {
  // Hide campaigns created by this district
  if (campaign.levelType === "DISTRICT" && campaign.level_id === districtId) {
    return false;
  }

  // Show campaigns targeted/scoped to this district
  if (
    campaign.scope_level_type === "DISTRICT" &&
    campaign.scope_level_id === districtId
  ) {
    return true;
  }

  // For other levels (ASSEMBLY, BLOCK, etc.), we need backend filtering
  // as we don't have geographical hierarchy data on frontend
  return false;
};

export const PartyCampaignPage: React.FC = () => {
  // Using static district_id for demo
  const district_id: number = 1;

  const deduplicateCampaigns = (campaigns: Campaign[]) => {
    const map = new Map<number, Campaign & { scopes: unknown[] }>();

    // Filter campaigns to only include those with scopes relevant to the user's district
    const relevantCampaigns = campaigns.filter((c) => {
      const isRelevant = isCampaignRelevantToDistrict(c, district_id);

      if (!isRelevant) {
        console.log(
          `Filtering out campaign ${c.id} - scope: ${c.scope_level_type}:${c.scope_level_id}`
        );
      }

      return isRelevant;
    });

    console.log("Total campaigns from API:", campaigns.length);
    console.log(
      "Relevant campaigns after filtering:",
      relevantCampaigns.length
    );
    console.log("User district_id:", district_id);

    relevantCampaigns.forEach((c) => {
      if (!map.has(c.id)) {
        map.set(c.id, { ...c, scopes: [] });
      }
      const existing = map.get(c.id)!;

      // Add scope information
      existing.scopes.push({
        scope_id: c.scope_id,
        scope_level_type: c.scope_level_type,
        scope_level_id: c.scope_level_id,
        acceptance_status: c.acceptance_status,
        acceptance_id: c.acceptance_id,
      });

      // Update the main campaign's acceptance status to the most relevant one
      // Priority: accepted > pending > declined
      const currentStatus = existing.acceptance_status;
      const newStatus = c.acceptance_status;

      if (
        newStatus === "accepted" ||
        (newStatus === "pending" && currentStatus === "declined")
      ) {
        existing.acceptance_status = newStatus;
        existing.acceptance_id = c.acceptance_id;
        existing.scope_id = c.scope_id;
      }
    });

    return Array.from(map.values());
  };

  // Helper function to parse image data
  const parseImageData = (
    imageData: string | string[] | null | undefined
  ): string[] => {
    if (!imageData) return [];

    if (Array.isArray(imageData)) {
      return imageData;
    }

    if (typeof imageData === "string") {
      try {
        // Try to parse as JSON array first
        const parsed = JSON.parse(imageData);
        return Array.isArray(parsed) ? parsed : [imageData];
      } catch {
        // If parsing fails, treat as single URL
        return [imageData];
      }
    }

    return [];
  };

  // Map API Campaign to CampaignEvent used by UI widgets
  const mapApiCampaignToEvent = (campaign: Campaign): CampaignEvent => {
    const images = parseImageData(campaign.image);

    return {
      id: String(campaign.id),
      title: campaign.name,
      description: campaign.description,
      date: campaign.start_date,
      startDate: campaign.start_date,
      endDate: campaign.end_date,
      time: "",
      location: campaign.location || "",
      category: (campaign.description?.toLowerCase().includes("ground") ||
      ("campaign_type" in campaign &&
        (campaign as { campaign_type?: string }).campaign_type ===
          "ground campaign")
        ? "social"
        : "meeting") as CampaignEvent["category"],
      priority: "medium",
      attendeeCount: 0,
      maxAttendees: 0,
      // Persist backend-provided acceptance status so UI can filter by it directly
      acceptance_status: campaign.acceptance_status as
        | "pending"
        | "accepted"
        | "declined",
      image: images,
      organizer: "",
      requirements: [],
      createdAt: campaign.created_at,
      updatedAt: campaign.updated_at,
      campaign_id: campaign.id,
      scope_id: campaign.scope_id,
      acceptance_id: campaign.acceptance_id,
      levelType: campaign.levelType,
      level_id: campaign.level_id,
      scope_level_type: campaign.scope_level_type,
      scope_level_id: campaign.scope_level_id,
    };
  };

  // Get static campaigns for district level
  const staticCampaigns = getCampaignsByLevel("DISTRICT", district_id);
  const campaigns = deduplicateCampaigns(staticCampaigns);
  const [selectedCampaign, setSelectedCampaign] =
    useState<CampaignEvent | null>(null);

  const notifications: CampaignEvent[] = campaigns.map(mapApiCampaignToEvent);

  // Calculate accurate counts
  const pendingCount = notifications.filter(
    (n) => n.acceptance_status === "pending"
  ).length;
  const acceptedCount = notifications.filter(
    (n) => n.acceptance_status === "accepted"
  ).length;
  const declinedCount = notifications.filter(
    (n) => n.acceptance_status === "declined"
  ).length;

  console.log("Campaign counts:", {
    total: notifications.length,
    pending: pendingCount,
    accepted: acceptedCount,
    declined: declinedCount,
  });

  const [selectedNotificationForDetail, setSelectedNotificationForDetail] =
    useState<CampaignEvent | null>(null);

  const [filter, setFilter] = useState<
    "all" | "pending" | "accepted" | "declined"
  >("all");

  const handleEventClick = (notification: CampaignEvent) => {
    setSelectedNotificationForDetail(notification);
  };

  const handleCloseDetail = () => {
    setSelectedNotificationForDetail(null);
  };

  const handleAcceptInvitation = async () => {
    const acceptanceId = selectedNotificationForDetail?.acceptance_id;
    if (!acceptanceId) {
      alert("Invalid campaign scope.");
      return;
    }

    // Check if campaign has ended
    if (selectedNotificationForDetail && !isCampaignEventActive(selectedNotificationForDetail)) {
      alert("This campaign has ended. You can no longer accept it.");
      return;
    }

    updateCampaignAcceptanceStatus(acceptanceId, "accepted");
    alert("You have accepted this campaign.");
    setSelectedNotificationForDetail(null);
    // In a real app, you would refresh the data here
  };

  const handleDeclineInvitation = async () => {
    const acceptanceId = selectedNotificationForDetail?.acceptance_id;
    if (!acceptanceId) {
      alert("Invalid campaign scope.");
      return;
    }

    // Check if campaign has ended
    if (selectedNotificationForDetail && !isCampaignEventActive(selectedNotificationForDetail)) {
      alert("This campaign has ended. You can no longer decline it.");
      return;
    }

    updateCampaignAcceptanceStatus(acceptanceId, "declined");
    alert("You declined this campaign.");
    setSelectedNotificationForDetail(null);
    // In a real app, you would refresh the data here
  };

  // Expects a FormData from the modal/form
  const handleSendReport = async (formData: FormData) => {
    if (!selectedCampaign) {
      alert("No campaign selected");
      return;
    }

    const reportData = {
      campaign_acceptance_id: selectedCampaign.acceptance_id || 0,
      campaign_id: selectedCampaign.campaign_id || 0,
      campaign_name: selectedCampaign.title || "",
      report_text: (formData.get("description") as string) || "",
      images: [] as string[], // Images would be processed from FormData in real implementation
      userLevelType: "DISTRICT",
      userLevelId: district_id,
    };

    addCampaignReport(reportData);
    alert("Report submitted successfully");
    setSelectedCampaign(null);
  };

  const filteredNotifications: CampaignEvent[] = notifications.filter(
    (n) => filter === "all" || n.acceptance_status === filter
  );

  // No loading or error states needed with static data

  return (
    <div className="min-h-screen bg-gray-50 rounded-2xl shadow-md p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl w-fit">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <span>Party Campaigns</span>
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                View your Campaigns and invitations
              </p>
            </div>

            {pendingCount > 0 && (
              <div className="bg-red-100 border border-red-200 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 w-full lg:w-auto">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    <div className="absolute -top-2 -right-2 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {pendingCount}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-red-800 text-sm sm:text-base">
                      New Invitations
                    </p>
                    <p className="text-xs sm:text-sm text-red-600">
                      {pendingCount} Campaigns pending
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    Total Campaigns
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {notifications.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    Pending
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {pendingCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    Accepted
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {acceptedCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    Declined
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {declinedCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">

              <p className="text-xs sm:text-sm text-gray-600">Total Campaigns</p>
              <p className="text-lg font-bold">{notifications.length}</p>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
              <p className="text-xs sm:text-sm text-gray-600">Pending</p>
              <p className="text-lg font-bold">{pendingCount}</p>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
              <p className="text-xs sm:text-sm text-gray-600">Accepted</p>
              <p className="text-lg font-bold">
                {notifications.filter((n) => n.acceptance_status === "accepted").length}
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
              <p className="text-xs sm:text-sm text-gray-600">Declined</p>
              <p className="text-lg font-bold">
                {notifications.filter((n) => n.acceptance_status === "declined").length}
              </p>
            </div>
          </div> */}
        </div>

        {/* Filter Tabs - integrate if you have UI for setFilter */}
        {/* Filter Tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white rounded-2xl p-1.5 sm:p-2 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
              {[
                {
                  key: "all" as const,
                  label: "All",
                  count: notifications.length,
                },
                {
                  key: "pending" as const,
                  label: "Pending",
                  count: pendingCount,
                },
                {
                  key: "accepted" as const,
                  label: "Accepted",
                  count: acceptedCount,
                },
                {
                  key: "declined" as const,
                  label: "Declined",
                  count: declinedCount,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base ${
                    filter === tab.key
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="truncate">{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs ${
                        filter === tab.key
                          ? "bg-white bg-opacity-25 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Event Slider */}
        <CampaignSlider
          notifications={filteredNotifications}
          onEventClick={handleEventClick}
        />

        {/* Event List Header */}
        <div className="mb-4 sm:mb-6 mt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            All Events
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Click on any event to view complete details
          </p>
        </div>

        {/* Event List */}
        <CampaignList
          notifications={filteredNotifications}
          onEventClick={handleEventClick}
          selectedNotification={selectedNotificationForDetail}
        />

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">
              No Campaigns Found
            </h3>
          </div>
        )}
      </div>

      {/* Campaign Detail Modal */}
      {selectedNotificationForDetail && (
        <CampaignDetailModal
          notification={selectedNotificationForDetail}
          onClose={handleCloseDetail}
          onAccept={handleAcceptInvitation}
          onDecline={handleDeclineInvitation}
          onSendReport={handleSendReport}
        />
      )}
    </div>
  );
};
