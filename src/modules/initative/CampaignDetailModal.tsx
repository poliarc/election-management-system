import React, { useState } from "react";
import { X, Calendar, Clock, MapPin, Check, FileText, AlertCircle } from "lucide-react";
import type { CampaignEvent } from "../../types/initative";
import ConfirmationModal from "../../components/ConfirmationModal";
import { CampaignImageSlider } from "./CampaignImageSlider";
import { isCampaignEventActive } from "../../utils/campaignUtils";

interface CampaignDetailModalProps {
  notification: CampaignEvent;
  onClose: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  // Added prop so parent can pass a FormData handler
  onSendReport?: (fd: FormData) => void;
  isUpdating?: boolean;
}

export const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({
  notification,
  onClose,
  onAccept,
  onDecline,
  isUpdating = false,
  onSendReport,
}) => {
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getPriorityColor = (priority: CampaignEvent["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getStatusColor = (
    acceptance_status: CampaignEvent["acceptance_status"]
  ) => {
    switch (acceptance_status) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "declined":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-orange-100 text-orange-800 border-orange-200";
    }
  };

  const getCategoryIcon = (category: CampaignEvent["category"]) => {
    switch (category) {
      case "meeting":
        return "🤝";
      case "social":
        return "🌱";
      default:
        return "📅";
    }
  };

  // Check if campaign has ended
  const campaignHasEnded = !isCampaignEventActive(notification);

  // Optional: inline minimal report sender for convenience
  // If onSendReport is provided, this builds a blank FormData shell so parent can augment if needed.
  // const handleQuickReport = () => {
  //   if (!onSendReport) return;
  //   const fd = new FormData();
  //   // parent will ensure required fields; here we at least pass acceptance_id if present
  //   if (notification.acceptance_id) {
  //     fd.append("campaign_acceptance_id", String(notification.acceptance_id));
  //   }
  //   onSendReport(fd);
  // };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 lg:left-[258px]">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header Image */}
        <div className="relative h-56 sm:h-64 md:h-80">
          <CampaignImageSlider
            images={
              Array.isArray(notification.image)
                ? notification.image
                : [notification.image || ""]
            }
            alt={notification.title}
            className="w-full h-full object-cover rounded-t-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-t-2xl" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Status and Priority Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
                notification.priority
              )}`}
            >
              {notification.priority.charAt(0).toUpperCase() +
                notification.priority.slice(1)}{" "}
              Priority
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                notification.acceptance_status
              )}`}
            >
              {notification.acceptance_status.charAt(0).toUpperCase() +
                notification.acceptance_status.slice(1)}
            </span>
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">
                {getCategoryIcon(notification.category)}
              </span>
              <span className="text-white text-sm bg-white bg-opacity-20 backdrop-blur-sm px-2 py-1 rounded-md">
                {notification.category.charAt(0).toUpperCase() +
                  notification.category.slice(1)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {notification.title}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 lg:p-8">
          {/* Event Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Date</p>
                <div className="flex items-center gap-2 text-gray-900 font-semibold">
                  <span>{formatDate(notification.startDate)}</span>
                  <span className="mx-1 text-gray-500">-</span>
                  <span>{formatDate(notification.endDate)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
              <Clock className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-green-600 font-medium">Time</p>
                <p className="text-gray-900 font-semibold">
                  {notification.time}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl sm:col-span-2 lg:col-span-1">
              <MapPin className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-600 font-medium">Location</p>
                <p className="text-gray-900 font-semibold">
                  {notification.location}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">
                  Description
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {notification.description}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {campaignHasEnded ? (
            /* Campaign has ended - show message */
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center max-w-lg mx-auto">
              <div className="flex items-center justify-center gap-3 text-gray-600 mb-2">
                <AlertCircle className="w-6 h-6" />
                <span className="font-semibold text-lg">Campaign has ended</span>
              </div>
              <p className="text-gray-500 text-sm">
                This campaign ended on {new Date(notification.endDate).toLocaleDateString()}.
                No further actions can be taken.
              </p>
            </div>
          ) : (
            /* Campaign is active - show normal actions */
            <>
              {notification.acceptance_status === "pending" &&
                onAccept &&
                onDecline && (
                  <>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                      <button
                        onClick={onAccept}
                        disabled={isUpdating}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdating ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="w-6 h-6" />
                            Accept Invitation
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowDeclineModal(true)}
                        disabled={isUpdating}
                        className="flex-1 bg-gray-100 text-gray-700 py-4 px-8 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-6 h-6" />
                        Decline
                      </button>
                    </div>
                    <ConfirmationModal
                      isOpen={showDeclineModal}
                      onClose={() => setShowDeclineModal(false)}
                      onConfirm={() => {
                        setShowDeclineModal(false);
                        onDecline?.();
                      }}
                      title="Confirm Decline"
                      message="Are you sure you want to decline this campaign invitation?"
                      confirmText="Yes, Decline"
                      cancelText="Cancel"
                    />
                  </>
                )}

              {notification.acceptance_status === "accepted" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center gap-3 text-green-700 mb-4">
                    <Check className="w-6 h-6" />
                    <span className="font-semibold text-lg">
                      You have accepted this campaign
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <button
                      onClick={() => {
                        // This will be handled by parent component
                        const event = new CustomEvent("showMyReports", {
                          detail: {
                            campaignId: notification.campaign_id,
                            campaignName: notification.title,
                          },
                        });
                        window.dispatchEvent(event);
                      }}
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      My Reports
                    </button>
                  </div>

                  {onSendReport && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 mb-4 text-center">
                        Submit New Report
                      </h4>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          onSendReport(formData);
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Attendees
                          </label>
                          <input
                            type="number"
                            name="attendees"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter number of attendees"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Report Date
                          </label>
                          <input
                            type="date"
                            name="report_date"
                            defaultValue={new Date().toISOString().split("T")[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            name="description"
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Describe the campaign event, activities, and outcomes..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Images (Optional)
                          </label>
                          <input
                            type="file"
                            name="images"
                            multiple
                            accept="image/*"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            You can select multiple images
                          </p>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-linear-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          Submit Report
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {notification.acceptance_status === "declined" && (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto mb-4">
                    <div className="flex items-center justify-center gap-3 text-red-700">
                      <X className="w-6 h-6" />
                      <span className="font-semibold text-lg">
                        You have declined this campaign
                      </span>
                    </div>
                  </div>
                  {onAccept && (
                    <button
                      onClick={onAccept}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl text-lg"
                    >
                      <Check className="w-6 h-6" />
                      Accept Again
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};