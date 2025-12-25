import React, { useState, useEffect, useRef } from "react";
import { Calendar, Camera, Clock, Plus, X, Eye } from "lucide-react";
import toast from "react-hot-toast";
import type { CampaignEvent } from "../../types/initative";
import { CampaignImageSlider } from "./CampaignImageSlider";

import { useCreateCampaignReportMutation } from "../../store/api/myCampaignsApi";
import { storage } from "../../utils/storage";
export interface CampaignListProps {
  notifications: CampaignEvent[];
  onEventClick: (notification: CampaignEvent) => void;
  selectedNotification?: CampaignEvent | null;
}

export const CampaignList: React.FC<CampaignListProps> = ({
  notifications,
  onEventClick,
  selectedNotification,
}) => {
  const [showReportModal, setShowReportModal] = useState(false);

  const [activeCampaign, setActiveCampaign] = useState<CampaignEvent | null>(
    null
  );

  // Get user data from localStorage
  const authState = storage.getAuthState<{
    user?: { firstName?: string; contactNo?: string };
  }>();
  const user =
    authState?.user ||
    storage.getUser<{ firstName?: string; contactNo?: string }>();
  const personName = user?.firstName || "User Name";
  const userPhone = user?.contactNo || "1234567890";

  // Mutation for creating campaign reports
  const [createReport, { isLoading: isSubmittingReport }] =
    useCreateCampaignReportMutation();

  const [reportData, setReportData] = useState({
    images: [] as File[],
    location: "",
    peopleCount: "",
    attendingDate: "",
    description: "",
    personName: personName,
    phone: userPhone,
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      imagePreviews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [imagePreviews]);

  const handleReportClick = (campaign: CampaignEvent) => {
    if (campaign.acceptance_status !== "accepted") {
      toast.error("Accept the campaign before submitting a report.");
      return;
    }
    // Use campaign_id if acceptance_id is not available
    if (!campaign.acceptance_id && !campaign.campaign_id) {
      toast.error("Missing campaign information. Try reloading campaigns.");
      return;
    }
    setActiveCampaign(campaign);
    setShowReportModal(true);
  };

  const handleViewReportsClick = (campaign: CampaignEvent) => {
    if (campaign.acceptance_status !== "accepted") {
      toast.error("Accept the campaign first to view reports.");
      return;
    }
    // Trigger the custom event to show My Reports modal
    const event = new CustomEvent("showMyReports", {
      detail: {
        campaignId: campaign.campaign_id,
        campaignName: campaign.title,
      },
    });
    window.dispatchEvent(event);
  };

  const handleReportChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const name = target.name;

    if (
      target instanceof HTMLInputElement &&
      target.type === "file" &&
      target.files
    ) {
      const newFiles = Array.from(target.files);
      const existingFiles = reportData.images;
      const combinedFiles = [...existingFiles, ...newFiles];

      // Limit to 10 images maximum
      if (combinedFiles.length > 10) {
        toast.error("Maximum 10 images allowed. Some images were not added.");
        const limitedFiles = combinedFiles.slice(0, 10);

        setReportData((prev) => ({
          ...prev,
          images: limitedFiles,
        }));

        // Create previews for limited files
        const limitedNewFiles = newFiles.slice(0, 10 - existingFiles.length);
        const newPreviews = limitedNewFiles.map((file) =>
          URL.createObjectURL(file)
        );
        setImagePreviews((prev) => [...prev, ...newPreviews]);
      } else {
        setReportData((prev) => ({
          ...prev,
          images: combinedFiles,
        }));

        // Create previews for new files only
        const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
        setImagePreviews((prev) => [...prev, ...newPreviews]);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      setReportData((prev) => ({
        ...prev,
        [name]: target.value,
      }));
    }
  };

  const handleAddMoreImages = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (index: number) => {
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index]);

    // Remove from both arrays
    setReportData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCampaign) {
      toast.error("No campaign selected.");
      return;
    }

    // Check if campaign is accepted
    if (activeCampaign.acceptance_status !== "accepted") {
      toast.error("Please accept the campaign before submitting a report.");
      return;
    }

    // Check if we have the campaign_id
    if (!activeCampaign.campaign_id) {
      toast.error(
        "Campaign ID is missing. Please refresh the page and try again."
      );
      return;
    }

    if (!user) {
      toast.error("User information not found. Please login again.");
      return;
    }

    const loadingToast = toast.loading("Submitting report...");

    try {
      const result = await createReport({
        campaign_id: activeCampaign.campaign_id,
        attendees: reportData.peopleCount
          ? parseInt(reportData.peopleCount, 10)
          : undefined,
        personName: user.firstName || "",
        personPhone: user.contactNo || "",
        report_date:
          reportData.attendingDate || new Date().toISOString().split("T")[0],
        description: reportData.description || "",
        images: reportData.images.length > 0 ? reportData.images : undefined,
      }).unwrap();

      toast.dismiss(loadingToast);
      toast.success(result.message || "Report submitted successfully!");

      setShowReportModal(false);
      setActiveCampaign(null);
      // Cleanup previews and reset form
      imagePreviews.forEach((u) => URL.revokeObjectURL(u));
      setReportData({
        images: [],
        location: "",
        peopleCount: "",
        attendingDate: "",
        description: "",
        personName: personName,
        phone: userPhone,
      });
      setImagePreviews([]);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "declined":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-orange-100 text-orange-800 border-orange-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "celebration":
        return "🎉";
      case "meeting":
        return "🤝";
      case "social":
        return "🌱";
      default:
        return "📅";
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No campaigns found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          onClick={() => onEventClick(notification)}
          className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
            selectedNotification?.id === notification.id
              ? "ring-2 ring-blue-500 shadow-lg"
              : ""
          }`}
        >
          <div className="flex gap-4">
            <div className="w-40 h-24 sm:w-56 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0">
              <CampaignImageSlider
                images={
                  Array.isArray(notification.image)
                    ? notification.image
                    : [notification.image || ""]
                }
                alt={notification.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1">
                  {notification.title}
                </h3>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {getCategoryIcon(notification.category)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                        notification.acceptance_status
                      )}`}
                    >
                      {notification.acceptance_status.charAt(0).toUpperCase() +
                        notification.acceptance_status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-600 mt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                  <span className="truncate">
                    {formatDate(notification.startDate)}
                  </span>
                  <span>to</span>
                  <span className="truncate">
                    {formatDate(notification.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>{notification.time}</span>
                </div>
                {notification.acceptance_status === "accepted" && (
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-1 bg-green-600 text-white rounded-md text-xs font-semibold hover:bg-green-700 transition-all flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewReportsClick(notification);
                      }}
                    >
                      <Eye className="w-3 h-3" />
                      My Reports
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReportClick(notification);
                      }}
                    >
                      Report
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs sm:text-sm text-gray-500 mt-2 line-clamp-1">
                {notification.description}
              </p>
            </div>
          </div>
        </div>
      ))}

      {showReportModal && activeCampaign && (
        <div
          className="fixed inset-0 z- flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4"
          style={{ left: "263px", width: "calc(100% - 258px)" }}
          onClick={() => {
            setShowReportModal(false);
            setActiveCampaign(null);
          }}
        >
          <div
            className="bg-white rounded-2xl w-full shadow-xl overflow-y-auto max-h-[90vh] p-6 sm:p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
              onClick={() => {
                setShowReportModal(false);
                setActiveCampaign(null);
              }}
            >
              <span className="text-xl text-gray-700">&times;</span>
            </button>
            <div className="p-4 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Report Event for{" "}
                <span className="text-blue-600">{activeCampaign.title}</span>
              </h2>

              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Person Name
                    </label>
                    <input
                      type="text"
                      name="personName"
                      value={reportData.personName}
                      onChange={handleReportChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
                      required
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={reportData.phone}
                      onChange={(e) => {
                        const inputValue = e.target.value.replace(/\D/g, "");
                        if (inputValue.length <= 10) {
                          setReportData((prev) => ({
                            ...prev,
                            phone: inputValue,
                          }));
                        }
                      }}
                      maxLength={10}
                      pattern="[0-9]{10}"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
                      placeholder="Enter 10 digit phone number"
                      required
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                      Image Upload
                    </label>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="images"
                      accept="image/*"
                      multiple
                      onChange={handleReportChange}
                      className="hidden"
                    />

                    {/* Image previews and upload area */}
                    <div className="space-y-3">
                      {imagePreviews.length === 0 ? (
                        // Initial upload area
                        <div
                          onClick={handleAddMoreImages}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                        >
                          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 font-medium">
                            Click to upload images
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Support multiple images (JPG, PNG, GIF) - Max 10
                            images
                          </p>
                        </div>
                      ) : (
                        // Image previews grid
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {imagePreviews.map((src, idx) => (
                            <div key={idx} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                                <img
                                  src={src}
                                  alt={`Preview ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}

                          {/* Add more images button - only show if under limit */}
                          {imagePreviews.length < 10 && (
                            <div
                              onClick={handleAddMoreImages}
                              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                            >
                              <Plus className="w-8 h-8 text-gray-400 mb-1" />
                              <span className="text-xs text-gray-500 text-center px-1">
                                Add More
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Image count indicator */}
                      {imagePreviews.length > 0 && (
                        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                          <span>
                            {imagePreviews.length} of 10 image
                            {imagePreviews.length !== 1 ? "s" : ""} selected
                          </span>
                          {imagePreviews.length < 10 && (
                            <button
                              type="button"
                              onClick={handleAddMoreImages}
                              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              Add More
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      No Of People Attended
                    </label>
                    <input
                      type="number"
                      name="peopleCount"
                      value={reportData.peopleCount}
                      onChange={handleReportChange}
                      step="1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        if (Number(target.value) < 0) {
                          target.value = ""; // negative value hata do
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Attending Date
                    </label>
                    <input
                      type="date"
                      name="attendingDate"
                      value={reportData.attendingDate}
                      onChange={handleReportChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Detail Description About Work
                  </label>
                  <textarea
                    name="description"
                    value={reportData.description}
                    onChange={handleReportChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all text-lg mt-2 disabled:opacity-60"
                >
                  {isSubmittingReport ? "Submitting..." : "Submit Report"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
