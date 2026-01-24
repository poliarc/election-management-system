import type { CampaignEvent } from "../../types/initative";
import type { MyCampaignItem } from "../../types/campaign";
import React, { useState, useMemo, useEffect } from "react";
import { Calendar, Bell, Plus, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { CampaignSlider } from "./CampaignSlider";
import { CampaignList } from "./CampaignList";
import { CampaignDetailModal } from "./CampaignDetailModal";
import { MyReportsModal } from "./MyReportsModal";
import { isCampaignEventActive } from "../../utils/campaignUtils";
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
    // Log campaign mapping for debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`Mapping campaign ${campaign.campaign_id}:`, {
        status: campaign.user_acceptance_status,
        name: campaign.name,
      });
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
      toast.error("Invalid campaign.");
      return;
    }

    // Check if campaign has ended
    if (selectedNotificationForDetail && !isCampaignEventActive(selectedNotificationForDetail)) {
      toast.error("This campaign has ended. You can no longer accept it.");
      return;
    }

    const loadingToast = toast.loading("Accepting campaign...");

    try {
      const result = await updateAcceptance({
        campaignId,
        status: "accepted",
      }).unwrap();

      console.log("Acceptance API response:", result);

      if (result.data?.campaignAcceptance_id) {
        console.log(
          "Received campaignAcceptance_id:",
          result.data.campaignAcceptance_id
        );
      } else {
        console.warn(
          "Acceptance API did not return campaignAcceptance_id. Full response:",
          result
        );
      }

      toast.dismiss(loadingToast);
      toast.success(result.message || "Campaign accepted successfully!");
      setSelectedNotificationForDetail(null);
    } catch (error) {
      console.error("Failed to accept campaign:", error);
      toast.dismiss(loadingToast);
      
      // Check if the error is about campaign ending
      const errorMessage = error && typeof error === "object" && "data" in error
        ? (error.data as { error?: { message?: string } })?.error?.message
        : "Failed to accept campaign. Please try again.";
      
      toast.error(errorMessage || "Failed to accept campaign. Please try again.");
    }
  };

  const handleDeclineInvitation = async () => {
    const campaignId = selectedNotificationForDetail?.campaign_id;
    if (!campaignId) {
      toast.error("Invalid campaign.");
      return;
    }

    // Check if campaign has ended
    if (selectedNotificationForDetail && !isCampaignEventActive(selectedNotificationForDetail)) {
      toast.error("This campaign has ended. You can no longer decline it.");
      return;
    }

    const loadingToast = toast.loading("Declining campaign...");

    try {
      const result = await updateAcceptance({
        campaignId,
        status: "declined",
      }).unwrap();

      toast.dismiss(loadingToast);
      toast.success(result.message || "Campaign declined successfully.");
      setSelectedNotificationForDetail(null);
    } catch (error) {
      console.error("Failed to decline campaign:", error);
      toast.dismiss(loadingToast);
      
      // Check if the error is about campaign ending
      const errorMessage = error && typeof error === "object" && "data" in error
        ? (error.data as { error?: { message?: string } })?.error?.message
        : "Failed to decline campaign. Please try again.";
      
      toast.error(errorMessage || "Failed to decline campaign. Please try again.");
    }
  };

  const handleSendReport = async (formData: FormData) => {
    if (!selectedCampaign) {
      toast.error("No campaign selected");
      return;
    }

    // Check if campaign is accepted
    if (selectedCampaign.acceptance_status !== "accepted") {
      toast.error("Please accept the campaign before submitting a report.");
      return;
    }

    // Check if we have the campaign_id
    if (!selectedCampaign.campaign_id) {
      toast.error(
        "Campaign ID is missing. Please refresh the page and try again."
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
      toast.error("User information not found. Please login again.");
      return;
    }

    // Get form data
    const description = formData.get("description") as string;
    const attendees = formData.get("attendees") as string;
    const reportDate = formData.get("report_date") as string;
    const imageFiles = formData.getAll("images") as File[];

    const loadingToast = toast.loading("Submitting report...");

    try {
      const result = await createReport({
        campaign_id: selectedCampaign.campaign_id,
        attendees: attendees ? parseInt(attendees, 10) : undefined,
        personName: user.firstName || "",
        personPhone: user.contactNo || "",
        report_date: reportDate || new Date().toISOString().split("T")[0],
        description: description || "",
        images: imageFiles.length > 0 ? imageFiles : undefined,
      }).unwrap();

      toast.dismiss(loadingToast);
      toast.success(result.message || "Report submitted successfully!");
      setSelectedCampaign(null);
    } catch (error) {
      console.error("Failed to submit report:", error);
      toast.dismiss(loadingToast);
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error.data as { error?: { message?: string } })?.error?.message
          : "Failed to submit report. Please try again.";
      toast.error(errorMessage || "Failed to submit report. Please try again.");
    }
  };

  const filteredNotifications = campaigns.filter(
    (n) => filter === "all" || n.acceptance_status === filter
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl shadow-md p-2 sm:p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-700 font-medium animate-pulse">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-2xl shadow-md p-2 sm:p-4 md:p-6 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <div className="bg-red-100 rounded-full p-4 w-fit mx-auto mb-4 animate-bounce">
            <Calendar className="w-12 h-12 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
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
                <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl w-fit hover:scale-110 hover:rotate-6 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <span className="bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">Assigned Events</span>
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                View your assigned events and invitations
              </p>
            </div>

            {pendingCount > 0 && (
              <div className="bg-gradient-to-r from-red-100 to-pink-100 border border-red-200 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 w-full lg:w-auto hover:shadow-xl hover:scale-105 hover:from-red-200 hover:to-pink-200 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 group-hover:animate-bounce" />
                    <div className="absolute -top-2 -right-2 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse group-hover:scale-125 transition-transform">
                      <span className="text-white text-xs font-bold">
                        {pendingCount}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-red-800 text-sm sm:text-base group-hover:text-red-900 transition-colors">
                      New Invitations
                    </p>
                    <p className="text-xs sm:text-sm text-red-600 group-hover:text-red-700 transition-colors">
                      {pendingCount} Events pending
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-3 sm:p-4 shadow-sm border border-blue-100 hover:shadow-xl hover:scale-105 hover:border-blue-300 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate group-hover:text-blue-600 transition-colors">
                    Total Events
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 group-hover:scale-110 transition-all">
                    {campaigns.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-3 sm:p-4 shadow-sm border border-orange-100 hover:shadow-xl hover:scale-105 hover:border-orange-300 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg group-hover:bg-orange-600 group-hover:scale-110 transition-all duration-300">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate group-hover:text-orange-600 transition-colors">
                    Pending
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-orange-600 group-hover:scale-110 transition-all">
                    {pendingCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-3 sm:p-4 shadow-sm border border-green-100 hover:shadow-xl hover:scale-105 hover:border-green-300 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg group-hover:bg-green-600 group-hover:scale-110 transition-all duration-300">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate group-hover:text-green-600 transition-colors">
                    Accepted
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-green-600 group-hover:scale-110 transition-all">
                    {acceptedCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-3 sm:p-4 shadow-sm border border-purple-100 hover:shadow-xl hover:scale-105 hover:border-purple-300 transition-all duration-300 cursor-pointer group col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg group-hover:bg-purple-600 group-hover:scale-110 transition-all duration-300">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 truncate group-hover:text-purple-600 transition-colors">
                    Declined
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-purple-600 group-hover:scale-110 transition-all">
                    {declinedCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white rounded-2xl p-1.5 sm:p-2 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
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
                  className={`group flex-1 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base ${
                    filter === tab.key
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105"
                      : "text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:scale-105 hover:shadow-md"
                  }`}
                >
                  <span className="truncate">{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-bold transition-all duration-300 ${
                        filter === tab.key
                          ? "bg-white text-blue-600 shadow-md"
                          : "bg-gray-200 text-gray-700 group-hover:bg-blue-500 group-hover:text-white group-hover:scale-110"
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
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-6 w-fit mx-auto mb-4 hover:scale-110 hover:rotate-12 transition-all duration-300">
              <Calendar className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
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
