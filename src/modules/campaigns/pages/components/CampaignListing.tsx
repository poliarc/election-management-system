import { useState } from "react";
import React from "react";
import {
  Calendar,
  Eye,
  Edit,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  // FileText,
} from "lucide-react";
import type { Campaign } from "../../../../types/campaign";
import { isCampaignActive, getCampaignStatusColor, getCampaignStats } from "../../../../utils/campaignUtils";
// import { useNavigate } from "react-router-dom";

interface CampaignListingProps {
  campaigns: Campaign[];
  onViewDetails: (campaign: Campaign) => void;
  onEditCampaign: (campaign: Campaign) => void | Promise<void>;
  onCreateNew: () => void;
  onDeleteCampaign: (campaign: Campaign) => void;
}

// Full-screen image modal component
const FullScreenImageModal = ({
  images,
  campaignName,
  isOpen,
  onClose,
  initialIndex = 0,
}: {
  images: string[];
  campaignName: string;
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  React.useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images.length, onClose]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const hasMultipleImages = images.length > 1;

  return (
    <div className="fixed inset-0 z-9999 bg-black bg-opacity-90 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200"
      >
        <X size={24} />
      </button>

      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
        <div className="text-sm font-medium">{campaignName}</div>
        <div className="text-xs opacity-75">
          {currentIndex + 1} of {images.length}
        </div>
      </div>

      {hasMultipleImages && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all duration-200"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all duration-200"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <div className="relative max-w-full max-h-full p-4">
        <img
          src={images[currentIndex]}
          alt={`${campaignName} - Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain transition-opacity duration-300"
          style={{ maxHeight: "90vh", maxWidth: "90vw" }}
        />
      </div>

      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

// Simple inline carousel component
const CampaignImageSlider = ({
  images,
  campaignName,
  onImageClick,
}: {
  images: string[];
  campaignName: string;
  onImageClick: (index: number) => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const hasMultipleImages = images.length > 1;

  return (
    <div
      className="relative w-full h-full rounded-lg border shadow-sm overflow-hidden group cursor-pointer"
      style={{ minHeight: "120px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onImageClick(currentIndex)}
    >
      <img
        src={images[currentIndex]}
        alt={`${campaignName} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
        style={{ minHeight: "120px", maxHeight: "100%" }}
      />

      <div
        className={`absolute top-2 left-2 bg-black bg-opacity-50 text-white rounded-full p-1 transition-all duration-200 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <ZoomIn size={12} />
      </div>

      {hasMultipleImages && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className={`absolute left-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1 transition-all duration-200 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <ChevronLeft size={14} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className={`absolute right-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1 transition-all duration-200 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <ChevronRight size={14} />
          </button>

          <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded">
            {currentIndex + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
};

// Helper function to extract images from campaign
const extractCampaignImages = (campaign: Campaign): string[] => {
  const images: string[] = [];

  if (campaign.images && campaign.images.length > 0) {
    images.push(...campaign.images);
  } else if (campaign.image) {
    images.push(campaign.image);
  } else if (campaign.media?.images && campaign.media.images.length > 0) {
    images.push(...campaign.media.images);
  }

  return images;
};

export const CampaignListing = ({
  campaigns,
  onViewDetails,
  onEditCampaign,
  onCreateNew,
  onDeleteCampaign,
}: CampaignListingProps) => {
  // const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed"
  >("all");
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    images: [] as string[],
    campaignName: "",
    initialIndex: 0,
  });

  const openImageModal = (
    images: string[],
    campaignName: string,
    initialIndex: number = 0
  ) => {
    setImageModal({
      isOpen: true,
      images,
      campaignName,
      initialIndex,
    });
  };

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      images: [],
      campaignName: "",
      initialIndex: 0,
    });
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && isCampaignActive(campaign)) ||
      (statusFilter === "completed" && !isCampaignActive(campaign));

    return matchesSearch && matchesStatus;
  });

  const stats = {
    ...getCampaignStats(campaigns),
    totalParticipants: campaigns.reduce(
      (sum, c) => sum + (c.totalParticipants ?? 0),
      0
    ),
  };

  const getStatusColor = (campaign: Campaign) => {
    return getCampaignStatusColor(campaign);
  };

  return (
    <div className="space-y-1 p-1 rounded-2xl bg-gray-50 shadow-md w-full">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">
            Manage your political campaigns and team activities
          </p>
        </div>
        <div className="flex gap-2">
          {/* <button
            onClick={() => navigate("/state/campaigns/reports")}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <FileText size={20} />
            View Reports
          </button> */}
          <button
            onClick={onCreateNew}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <Plus size={20} />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-sm border border-blue-100 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">Total Campaigns</p>
              <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300">
              <Calendar className="text-blue-600 group-hover:text-white transition-colors" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl shadow-sm border border-green-100 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 group-hover:text-green-600 transition-colors">Active Campaigns</p>
              <p className="text-3xl font-bold text-green-600 group-hover:scale-110 transition-transform">
                {stats.active}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-600 group-hover:scale-110 transition-all duration-300">
              <Eye className="text-green-600 group-hover:text-white transition-colors" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">Completed</p>
              <p className="text-3xl font-bold text-gray-600 group-hover:scale-110 transition-transform">
                {stats.completed}
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full group-hover:bg-gray-600 group-hover:scale-110 transition-all duration-300">
              <Calendar className="text-gray-600 group-hover:text-white transition-colors" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-3 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Campaigns ({filteredCampaigns.length})
          </h2>
        </div>
        <div className="p-6">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {campaigns.length === 0
                  ? "No campaigns yet"
                  : "No campaigns match your filters"}
              </h3>
              <p className="text-gray-600 mb-4">
                {campaigns.length === 0
                  ? "Create your first campaign to engage your team"
                  : "Try adjusting your search or filter criteria"}
              </p>
              {campaigns.length === 0 && (
                <button
                  onClick={onCreateNew}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Create Campaign
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => {
                const images = extractCampaignImages(campaign);

                return (
                  <div
                    key={campaign.id}
                    className="border border-gray-200 rounded-xl p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row gap-0 group"
                  >
                    {/* Campaign Images */}
                    {images.length > 0 && (
                      <div className="flex items-stretch sm:mr-4 mb-4 sm:mb-0 w-full sm:w-40">
                        <CampaignImageSlider
                          images={images}
                          campaignName={campaign.name}
                          onImageClick={(index) =>
                            openImageModal(images, campaign.name, index)
                          }
                        />
                      </div>
                    )}

                    {/* Info & Actions */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex gap-2 justify-end mb-2">
                        <button
                          onClick={() => onViewDetails(campaign)}
                          className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {isCampaignActive(campaign) && (
                          <button
                            onClick={() => onEditCampaign(campaign)}
                            className="p-2 text-gray-600 hover:bg-gray-600 hover:text-white rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
                            title="Edit Campaign"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteCampaign(campaign)}
                          className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
                          title="Delete Campaign"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {campaign.name}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                              campaign
                            )}`}
                          >
                            {isCampaignActive(campaign)
                              ? "active"
                              : "completed"}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3 truncate w-full min-w-0">
                          {campaign.description.length > 75
                            ? campaign.description.substring(0, 75) + "..."
                            : campaign.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          {campaign.totalParticipants !== undefined && (
                            <span>
                              👥 {campaign.totalParticipants} participants
                            </span>
                          )}
                          {campaign.location && (
                            <span className="truncate">
                              📍 {campaign.location}
                            </span>
                          )}
                          {campaign.start_date && campaign.end_date && (
                            <span>
                              {new Date(
                                campaign.start_date
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(campaign.end_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <FullScreenImageModal
        images={imageModal.images}
        campaignName={imageModal.campaignName}
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
        initialIndex={imageModal.initialIndex}
      />
    </div>
  );
};
