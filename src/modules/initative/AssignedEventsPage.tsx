import type { CampaignEvent } from "../../types/initative";
import type { MyCampaignItem } from "../../types/campaign";
import React, { useState, useMemo, useEffect } from "react";
import { Calendar, Bell, Plus, TrendingUp } from "lucide-react";
import { CampaignSlider } from "./CampaignSlider";
import { CampaignList } from "./CampaignList";
import { CampaignDetailModal } from "./CampaignDetailModal";
import { MyReportsModal } from "./MyReportsModal";
import {
  useGetMyCampaignsQuery,
  useUpdateCampaignAcceptanceMutation,
  useCreateCampaignReportMutation,
} from "../../store/api/myCampaignsApi";
import { storage } from "../../utils/storage";

interface AssignedEventsPageProps {
  userLevelType:
    | "DISTRICT"
    | "ASSEMBLY"
    | "BLOCK"
    | "AFTER_ASSEMBLY"
    | "SUB_LEVEL";
  userLevelId: number;
}

export const AssignedEventsPage: React.FC<AssignedEventsPageProps> = () => {
  const [selectedCampaign, setSelectedCampaign] =
    useState<CampaignEvent | null>(null);
  const [selectedNotificationForDetail, setSelectedNotificationForDetail] =
    useState<CampaignEvent | null>(null);
  const [filter, setFilter] = useState<
    "all" | "pending" | "accepted" | "declined"
  >("all");
  const [showMyReports, setShowMyReports] = useState(false);
  const [myReportsData, setMyReportsData] = useState<{
    campaignId: number;
    campaignName: string;
  } | null>(null);

  // Fetch campaigns from API
  const { data: apiResponse, isLoading, error } = useGetMyCampaignsQuery();

  // Mutation for accepting/declining campaigns
  const [updateAcceptance, { isLoading: isUpdating }] =
    useUpdateCampaignAcceptanceMutation();

  // Mutation for creating campaign reports
  const [createReport] = useCreateCampaignReportMutation();

  // Listen for My Reports events
  useEffect(() => {
    const handleShowMyReports = (event: CustomEvent) => {
      const { campaignId, campaignName } = event.detail;
      setMyReportsData({ campaignId, campaignName });
      setShowMyReports(true);
    };

    window.addEventListener(
      "showMyReports",
      handleShowMyReports as EventListener
    );

    return () => {
      window.removeEventListener(
        "showMyReports",
        handleShowMyReports as EventListener
      );
    };
  }, []);

  // Map API campaigns to CampaignEvent format
  const mapApiCampaignToEvent = (campaign: MyCampaignItem): CampaignEvent => {
    // Log if acceptance_id is missing for accepted campaigns (for debugging)
    if (
      campaign.user_acceptance_status === "accepted" &&
      !campaign.campaign_acceptance_id
    ) {
      console.warn(
        `Campaign ${campaign.campaign_id} is accepted but missing campaign_acceptance_id. Full campaign data:`,
        campaign
      );
    }

    return {
      id: String(campaign.campaign_id),
      title: campaign.name,
      description: campaign.description,
      date: campaign.start_date,
      startDate: campaign.start_date,
      endDate: campaign.end_date,
      time: "",
      location: campaign.location || "",
      category: "meeting" as const,
      priority: "medium" as const,
      attendeeCount: 0,
      maxAttendees: 0,
      acceptance_status: campaign.user_acceptance_status,
      image: campaign.images || [],
      organizer: "",
      requirements: [],
      createdAt: campaign.created_at,
      updatedAt: campaign.updated_at,
      campaign_id: campaign.campaign_id,
      scope_id: 0,
      acceptance_id: campaign.campaign_acceptance_id || undefined,
      levelType: campaign.campaign_level,
      level_id: campaign.state_id,
      scope_level_type: campaign.campaign_level,
      scope_level_id: campaign.state_id,
    };
  };

  // Get campaigns from API response
  const campaigns = useMemo(() => {
    if (!apiResponse?.data) return [];
    return apiResponse.data.map(mapApiCampaignToEvent);
  }, [apiResponse]);

  // Calculate counts
  const pendingCount = campaigns.filter(
    (n) => n.acceptance_status === "pending"
  ).length;
  const acceptedCount = campaigns.filter(
    (n) => n.acceptance_status === "accepted"
  ).length;
  const declinedCount = campaigns.filter(
    (n) => n.acceptance_status === "declined"
  ).length;

  const handleEventClick = (notification: CampaignEvent) => {
    setSelectedNotificationForDetail(notification);
  };

  const handleCloseDetail = () => {
    setSelectedNotificationForDetail(null);
  };

  const handleAcceptInvitation = async () => {
    const campaignId = selectedNotificationForDetail?.campaign_id;
    if (!campaignId) {
      alert("Invalid campaign.");
      return;
    }

    try {
      const result = await updateAcceptance({
        campaignId,
        status: "accepted",
      }).unwrap();

      console.log("Acceptance API response:", result);

      if (result.data?.campaign_acceptance_id) {
        console.log(
          "Received campaign_acceptance_id:",
          result.data.campaign_acceptance_id
        );
      } else {
        console.warn(
          "Acceptance API did not return campaign_acceptance_id. Full response:",
          result
        );
      }

      alert(result.message || "You have accepted this campaign.");
      setSelectedNotificationForDetail(null);
    } catch (error) {
      console.error("Failed to accept campaign:", error);
      alert("Failed to accept campaign. Please try again.");
    }
  };

  const handleDeclineInvitation = async () => {
    const campaignId = selectedNotificationForDetail?.campaign_id;
    if (!campaignId) {
      alert("Invalid campaign.");
      return;
    }

    try {
      const result = await updateAcceptance({
        campaignId,
        status: "declined",
      }).unwrap();

      alert(result.message || "You have declined this campaign.");
      setSelectedNotificationForDetail(null);
    } catch (error) {
      console.error("Failed to decline campaign:", error);
      alert("Failed to decline campaign. Please try again.");
    }
  };

  const handleSendReport = async (formData: FormData) => {
    if (!selectedCampaign) {
      alert("No campaign selected");
      return;
    }

    // Check if campaign is accepted
    if (selectedCampaign.acceptance_status !== "accepted") {
      alert("Please accept the campaign before submitting a report.");
      return;
    }

    // Check if we have the acceptance_id
    if (!selectedCampaign.acceptance_id) {
      alert(
        "Campaign acceptance ID is missing. Please refresh the page and try again."
      );
      return;
    }

    // Get user data from localStorage
    const authState = storage.getAuthState<{
      user?: { firstName?: string; contactNo?: string };
    }>();
    const user =
      authState?.user ||
      storage.getUser<{ firstName?: string; contactNo?: string }>();

    if (!user) {
      alert("User information not found. Please login again.");
      return;
    }

    // Get form data
    const description = formData.get("description") as string;
    const attendees = formData.get("attendees") as string;
    const reportDate = formData.get("report_date") as string;
    const imageFiles = formData.getAll("images") as File[];

    try {
      const result = await createReport({
        campaign_acceptance_id: selectedCampaign.acceptance_id,
        attendees: attendees ? parseInt(attendees, 10) : undefined,
        personName: user.firstName || "",
        personPhone: user.contactNo || "",
        report_date: reportDate || new Date().toISOString().split("T")[0],
        description: description || "",
        images: imageFiles.length > 0 ? imageFiles : undefined,
      }).unwrap();

      alert(result.message || "Report submitted successfully");
      setSelectedCampaign(null);
    } catch (error) {
      console.error("Failed to submit report:", error);
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error.data as { error?: { message?: string } })?.error?.message
          : "Failed to submit report. Please try again.";
      alert(errorMessage || "Failed to submit report. Please try again.");
    }
  };

  const filteredNotifications = campaigns.filter(
    (n) => filter === "all" || n.acceptance_status === filter
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 rounded-2xl shadow-md p-2 sm:p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 rounded-2xl shadow-md p-2 sm:p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to Load Campaigns
          </h3>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 rounded-2xl shadow-md p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-linear-to-br from-orange-500 to-pink-600 rounded-2xl w-fit">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <span>Assigned Events</span>
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                View your assigned events and invitations
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
                      {pendingCount} Events pending
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    Total Events
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {campaigns.length}
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
        </div>

        {/* Filter Tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white rounded-2xl p-1.5 sm:p-2 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
              {[
                {
                  key: "all" as const,
                  label: "All",
                  count: campaigns.length,
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
                      ? "bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-lg"
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
              No Events Found
            </h3>
            <p className="text-gray-500 mt-2">
              {filter === "all"
                ? "There are no events assigned to your level yet."
                : `No ${filter} events found.`}
            </p>
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
          isUpdating={isUpdating}
        />
      )}

      {/* My Reports Modal */}
      {showMyReports && myReportsData && (
        <MyReportsModal
          campaignId={myReportsData.campaignId}
          campaignName={myReportsData.campaignName}
          onClose={() => {
            setShowMyReports(false);
            setMyReportsData(null);
          }}
        />
      )}
    </div>
  );
};
