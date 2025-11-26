import React from "react";
import type { CampaignNotificationCardProps } from "../../types/initative";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { CampaignImageSlider } from "./CampaignImageSlider";

export const CampaignNotificationCard: React.FC<
  CampaignNotificationCardProps
> = ({ notification, onAccept, onDecline }) => {
  const getPriorityColor = (priority: "low" | "medium" | "high") => {
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
    acceptance_status: "pending" | "accepted" | "declined"
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

  const getCategoryIcon = (category: "meeting" | "social") => {
    switch (category) {
      case "meeting":
        return "🤝";
      case "social":
        return "🌱";
      default:
        return "📅";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getPriorityLabel = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return "High Priority";
      case "medium":
        return "Medium Priority";
      default:
        return "Normal Priority";
    }
  };

  const getStatusLabel = (status: "pending" | "accepted" | "declined") => {
    switch (status) {
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "declined":
        return "Declined";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Image Header */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <CampaignImageSlider
          images={Array.isArray(notification.image) ? notification.image : [notification.image || ""]}
          alt={notification.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex flex-wrap gap-1 sm:gap-2">
          <span
            className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold border ${getPriorityColor(
              notification.priority
            )}`}
          >
            <span className="hidden sm:inline">
              {getPriorityLabel(notification.priority)}
            </span>
            <span className="sm:hidden">
              {notification.priority.charAt(0).toUpperCase() +
                notification.priority.slice(1)}
            </span>
          </span>
          <span className="px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold bg-white bg-opacity-90 text-gray-800">
            {getCategoryIcon(notification.category)}
          </span>
        </div>
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
          <span
            className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold border ${getStatusColor(
              notification.acceptance_status
            )}`}
          >
            {getStatusLabel(notification.acceptance_status)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2">
          {notification.title}
        </h3>

        <p className="text-gray-600 text-sm mb-3 sm:mb-4 line-clamp-3">
          {notification.description}
        </p>

        {/* Event Details */}
        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="truncate">{formatDate(notification.date)}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>{notification.time}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="line-clamp-1 min-w-0">
              {notification.location}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-sm text-gray-600">
            <Users className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="whitespace-nowrap">
                {notification.attendeeCount}/{notification.maxAttendees}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-0">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{
                    width: `${notification.maxAttendees > 0
                      ? (notification.attendeeCount /
                        notification.maxAttendees) *
                      100
                      : 0
                      }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Organizer */}
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Organizer:</span>{" "}
            <span className="break-words">{notification.organizer}</span>
          </p>
        </div>

        {/* Requirements */}
        {notification.requirements.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-700">
                Requirements:
              </span>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {notification.requirements.map((req, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-md border border-amber-200 break-words"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {notification.acceptance_status === "pending" && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onAccept}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 sm:py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Check className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={onDecline}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 sm:py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <X className="w-4 h-4" />
              Decline
            </button>
          </div>
        )}

        {notification.acceptance_status === "accepted" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-semibold text-sm sm:text-base">
                You have accepted this campaign
              </span>
            </div>
          </div>
        )}

        {notification.acceptance_status === "declined" && (
          <>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 text-center mb-3">
              <div className="flex items-center justify-center gap-2 text-red-700">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-semibold text-sm sm:text-base">
                  You have declined this campaign
                </span>
              </div>
            </div>
            <button
              onClick={onAccept}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 sm:py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Check className="w-4 h-4" />
              Accept Again
            </button>
          </>
        )}
      </div>
    </div>
  );
};
