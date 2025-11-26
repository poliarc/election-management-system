import type { CampaignEvent } from "../../types/initative";
import React, { useState, useMemo } from "react";
import { Calendar, Bell, Plus, TrendingUp } from "lucide-react";
import { CampaignSlider } from "./CampaignSlider";
import { CampaignList } from "./CampaignList";
import { CampaignDetailModal } from "./CampaignDetailModal";
import {
  getCampaignsByLevel,
  updateCampaignAcceptanceStatus,
  addCampaignReport,
  mapCampaignToEvent,
} from "./data/staticInitiativeData";

interface AssignedEventsPageProps {
  userLevelType: "DISTRICT" | "ASSEMBLY" | "BLOCK";
  userLevelId: number;
}

export const AssignedEventsPage: React.FC<AssignedEventsPageProps> = ({
  userLevelType,
  userLevelId,
}) => {
  const [selectedCampaign, setSelectedCampaign] =
    useState<CampaignEvent | null>(null);
  const [selectedNotificationForDetail, setSelectedNotificationForDetail] =
    useState<CampaignEvent | null>(null);
  const [filter, setFilter] = useState<
    "all" | "pending" | "accepted" | "declined"
  >("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Get campaigns for this level from static data
  const campaigns = useMemo(() => {
    const levelCampaigns = getCampaignsByLevel(userLevelType, userLevelId);
    return levelCampaigns.map(mapCampaignToEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLevelType, userLevelId, refreshKey]);

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

  const handleAcceptInvitation = () => {
    const scopeId = selectedNotificationForDetail?.scope_id;
    if (!scopeId) {
      alert("Invalid campaign scope.");
      return;
    }

    const updated = updateCampaignAcceptanceStatus(scopeId, "accepted");
    if (updated) {
      alert("You have accepted this campaign.");
      setRefreshKey((prev) => prev + 1);
      setSelectedNotificationForDetail(null);
    }
  };

  const handleDeclineInvitation = () => {
    const scopeId = selectedNotificationForDetail?.scope_id;
    if (!scopeId) {
      alert("Invalid campaign scope.");
      return;
    }

    const updated = updateCampaignAcceptanceStatus(scopeId, "declined");
    if (updated) {
      alert("You declined this campaign.");
      setRefreshKey((prev) => prev + 1);
      setSelectedNotificationForDetail(null);
    }
  };

  const handleSendReport = async (formData: FormData) => {
    if (!selectedCampaign) {
      alert("No campaign selected");
      return;
    }

    const reportText = formData.get("report_text") as string;
    const imageUrls: string[] = [];

    // Convert uploaded image files to data URLs
    const imageFiles = formData.getAll("images") as File[];
    for (const file of imageFiles) {
      if (file instanceof File) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        imageUrls.push(dataUrl);
      }
    }

    const report = addCampaignReport({
      campaign_acceptance_id: selectedCampaign.acceptance_id || 0,
      campaign_id: selectedCampaign.campaign_id,
      campaign_name: selectedCampaign.title,
      report_text: reportText || "Report submitted",
      images: imageUrls,
      userLevelType,
      userLevelId,
    });

    if (report) {
      alert("Report submitted successfully");
      setRefreshKey((prev) => prev + 1);
      setSelectedCampaign(null);
    }
  };

  const filteredNotifications = campaigns.filter(
    (n) => filter === "all" || n.acceptance_status === filter
  );

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
                View your assigned events and invitations for{" "}
                {userLevelType.toLowerCase()} level
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
        />
      )}
    </div>
  );
};
