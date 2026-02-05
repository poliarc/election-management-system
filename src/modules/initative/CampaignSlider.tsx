import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import type { CampaignEvent } from "../../types/initative";
import { CampaignImageSlider } from "./CampaignImageSlider";

export interface CampaignSliderProps {
  notifications: CampaignEvent[];
  onEventClick: (notification: CampaignEvent) => void;
}

export const CampaignSlider: React.FC<CampaignSliderProps> = ({
  notifications,
  onEventClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide functionality
  useEffect(() => {
    if (notifications.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === notifications.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Auto-slide every 5 seconds

    return () => clearInterval(interval);
  }, [notifications.length]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid Date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateRange = (dateString: string) => {
    if (!dateString) {
      return { from: 'Invalid Date', to: 'Invalid Date' };
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { from: 'Invalid Date', to: 'Invalid Date' };
    }
    
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 1); // Assuming events are single day, you can modify this logic

    return {
      from: formatDate(dateString),
      to: formatDate(endDate.toISOString().split("T")[0]),
    };
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === notifications.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? notifications.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No events to display</p>
      </div>
    );
  }

  // Guard against out-of-bounds index
  const currentNotification = notifications[currentIndex] || notifications[0];
  const dateRange = (() => {
    try {
      return currentNotification && currentNotification.date
        ? formatDateRange(currentNotification.date)
        : { from: "", to: "" };
    } catch (error) {
      console.error('Date formatting error:', error);
      return { from: "Invalid Date", to: "Invalid Date" };
    }
  })();

  return (
    <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Main Slider */}
      <div className="relative h-80 sm:h-96 md:h-[28rem] overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="w-full flex-shrink-0 relative cursor-pointer"
              onClick={() => onEventClick(notification)}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <CampaignImageSlider
                  images={Array.isArray(notification.image) ? notification.image : [notification.image || ""]}
                  alt={notification.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white">
                <div className="max-w-4xl">
                  {/* Date Range */}
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      {dateRange.from} to {dateRange.to}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 line-clamp-2">
                    {notification.title}
                  </h2>

                  {/* Quick Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base opacity-90">
                    <span>{notification.time}</span>
                    <span>•</span>
                    <span className="line-clamp-1">
                      {notification.location}
                    </span>
                    <span>•</span>
                    <span>
                      {notification.attendeeCount}/{notification.maxAttendees}{" "}
                      attending
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${notification.acceptance_status === "accepted"
                    ? "bg-green-500 text-white"
                    : notification.acceptance_status === "declined"
                      ? "bg-red-500 text-white"
                      : "bg-orange-500 text-white"
                    }`}
                >
                  {notification.acceptance_status.charAt(0).toUpperCase() +
                    notification.acceptance_status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {notifications.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-2 sm:p-3 transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-2 sm:p-3 transition-all duration-200"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {notifications.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {notifications.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${index === currentIndex
                ? "bg-white"
                : "bg-white/50 hover:bg-white/75"
                }`}
            />
          ))}
        </div>
      )}

      {/* Mini Navigation Thumbnails (Mobile Hidden) */}
      {notifications.length > 1 && (
        <div className="hidden md:flex absolute bottom-4 right-4 gap-2">
          {notifications.slice(0, 4).map((notification, index) => (
            <button
              key={notification.id}
              onClick={() => goToSlide(index)}
              className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${index === currentIndex
                ? "border-white"
                : "border-white/50 hover:border-white/75"
                }`}
            >
              <img
                src={
                  Array.isArray(notification.image)
                    ? notification.image[0] || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=100"
                    : notification.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=100"
                }
                alt={notification.title}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
          {notifications.length > 4 && (
            <div className="w-16 h-12 rounded-lg bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                +{notifications.length - 4}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
