import { useState } from "react";
import {
  Eye,
  X,
  User,
  Phone,
  Calendar,
  MapPin,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Campaign, CampaignReport } from "../../../../types/campaign";
import { isCampaignActive } from "../../../../utils/campaignUtils";
import { useTranslation } from "react-i18next";

interface CampaignDetailsProps {
  campaign: Campaign;
  reports: CampaignReport[];
  reportsLoading?: boolean;
  reportsError?: string | null;
  isReportsUsingFallback?: boolean;
  onReloadReports?: () => void | Promise<void>;
  onBack: () => void;
  onEditCampaign: (campaign: Campaign) => void | Promise<void>;
  onEndCampaign: (campaign: Campaign) => void;
}

export const CampaignDetails = ({
  campaign,
  reports = [],
  reportsLoading = false,
  reportsError = null,
  isReportsUsingFallback = false,
  onReloadReports,
  onBack,
  onEditCampaign,
  onEndCampaign,
}: CampaignDetailsProps) => {
  const {t} = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReport, setSelectedReport] = useState<CampaignReport | null>(
    null
  );
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleViewReport = (report: CampaignReport) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleCloseModal = () => {
    setShowReportModal(false);
    setSelectedReport(null);
  };

  const handleImageClick = (image: string, index: number) => {
    setSelectedImage(image);
    setSelectedImageIndex(index);
  };

  const handleCloseImageModal = () => {
    setSelectedImage(null);
  };

  const handleNextImage = () => {
    if (selectedReport?.images && Array.isArray(selectedReport.images)) {
      const nextIndex = (selectedImageIndex + 1) % selectedReport.images.length;
      setSelectedImageIndex(nextIndex);
      setSelectedImage(selectedReport.images[nextIndex]);
    }
  };

  const handlePrevImage = () => {
    if (selectedReport?.images && Array.isArray(selectedReport.images)) {
      const prevIndex =
        selectedImageIndex === 0
          ? selectedReport.images.length - 1
          : selectedImageIndex - 1;
      setSelectedImageIndex(prevIndex);
      setSelectedImage(selectedReport.images[prevIndex]);
    }
  };

  const isActive = isCampaignActive(campaign);

  const filteredReports = reports.filter(
    (report) =>
      !searchTerm ||
      (report.personName &&
        report.personName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.personPhone && report.personPhone.includes(searchTerm))
  );
  const participantCountLabel =
    reportsLoading && reports.length === 0
      ? "loading..."
      : `${filteredReports.length} reports`;

  return (
    <div className="space-y-6 p-4 rounded-xl shadow-md bg-[var(--bg-color)]">
      <div className="flex items-center justify-between gap-6 mb-2">
        <h1 className="text-2xl font-bold text-[var(--text-color)]">{campaign.name}</h1>
        <button
          onClick={onBack}
          className="text-[var(--text-secondary)] hover:text-[var(--text-color)] transition px-4 py-2 rounded"
        >
          {t("stateCampaign.Back")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Details Card */}
          <div className="bg-[var(--bg-color)] rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-[var(--text-color)] mb-4">
              {t("stateCampaign.Campaign_Details")}
            </h2>
            <div className="space-y-3">
              <p className="text-[var(--text-secondary)]">{campaign.description}</p>
              {campaign.location && (
                <div>
                  <span className="font-medium text-[var(--text-secondary)]">{t("stateCampaign.Location")}: </span>
                  <span className="text-[var(--text-secondary)]">{campaign.location}</span>
                </div>
              )}
              {campaign.start_date && campaign.end_date && (
                <div>
                  <span className="font-medium text-[var(--text-secondary)]">{t("stateCampaign.Duration")}: </span>
                  <span className="text-[var(--text-secondary)]">
                    {new Date(campaign.start_date).toLocaleDateString()} -{" "}
                    {new Date(campaign.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Participants Activity Table */}
          <div className="bg-[var(--bg-color)] rounded-lg shadow-sm border p-6">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-semibold text-[var(--text-color)]">
                {t("stateCampaign.Participants_Activity")} ({participantCountLabel})
              </h2>
              <div className="flex gap-2 items-center w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  className="w-full sm:w-64 px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-[var(--text-color)] shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {(reportsLoading || reportsError || isReportsUsingFallback) && (
              <div className="space-y-3 mb-4">
                {reportsLoading && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                    {t("stateCamapign.Loading_participant_activity")}
                  </div>
                )}
                {reportsError && (
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    <span>{reportsError}</span>
                    {onReloadReports && (
                      <button
                        type="button"
                        onClick={onReloadReports}
                        className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-900 hover:bg-red-100"
                      >
                        {t("stateCampaign.Retry")}
                      </button>
                    )}
                  </div>
                )}
                {isReportsUsingFallback && !reportsError && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
                    {t("stateCampaign.Desc3")}
                  </div>
                )}
              </div>
            )}

            {reportsLoading && filteredReports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--text-secondary)]">{t("stateCompaign.Loading_participant_reports")}</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[var(--text-secondary)]">
                  {searchTerm
                    ? "No reports found matching your search."
                    : "No reports available"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg-color)] border-b">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-color)]">
                        {t("stateCampaign.Person_Details")}
                      </th>
                      {/* <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-color)]">
                        Reporter Level
                      </th> */}
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-color)]">
                        {t("stateCampaign.Attendees")}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-color)]">
                        {t("stateCampaign.Date")}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--text-color)]">
                        {t("stateCampaing.Images")}
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-[var(--text-color)]">
                        {t("stateCampaign.Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-[var(--bg-color)]">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-[var(--text-color)] text-sm">
                              {report.personName || "N/A"}
                            </p>
                            <p className="text-[var(--text-secondary)] text-xs">
                              {report.personPhone || "N/A"}
                            </p>
                          </div>
                        </td>
                        {/* <td className="px-4 py-3 text-sm text-[var(--text-color)]">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {report.reporter_level || "N/A"}
                          </span>
                        </td> */}
                        <td className="px-4 py-3 text-sm text-[var(--text-color)]">
                          {report.attendees ?? 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                          {report.date
                            ? new Date(report.date).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                          {Array.isArray(report.images)
                            ? report.images.length
                            : 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleViewReport(report)}
                            className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Campaign Status Card */}
          <div className="bg-[var(--bg-color)] rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-[var(--text-color)] mb-4">
              {t("stateCampaign.Campaign_Status")}
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{t("stateCampaign.Status")}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    isActive
                      ? "bg-gray-600 text-green-800"
                      : "bg-[var(--bg-card)] text-[var(--text-color)]"
                  }`}
                >
                  {isActive ? "active" : "completed"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{t("stateCampaign.Participants_Accepted")}</span>
                <span className="font-medium text-green-600">
                  {campaign.accepted_count || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{t("stateCampaign.Pending")}</span>
                <span className="font-medium text-yellow-600">
                  {campaign.pending_count || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{t("stateCampaign.Declined")}</span>
                <span className="font-medium text-red-600">
                  {campaign.declined_count || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{t("stateCampaign.Reports")}</span>
                <span className="font-medium">{reports.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{t("stateCampaign.Created")}</span>
                <span className="font-medium">
                  {new Date(campaign.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-[var(--bg-color)] rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-[var(--text-color)] mb-4">
              {t("stateCampaign.Actions")}
            </h2>
            <div className="space-y-3">
              {isActive && (
                <>
                  <button
                    onClick={() => onEditCampaign(campaign)}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-[var(--text-secondary)] px-4 py-2 rounded-lg text-sm transition"
                  >
                    {t("stateCampaign.Edit_Campaign")}
                  </button>
                  <button
                    onClick={() => onEndCampaign(campaign)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                  >
                    {t("stateCampaign.End_Campaign")}
                  </button>
                </>
              )}
              {!isActive && (
                <div className="text-center py-4 text-[var(--text-secondary)] text-sm">
                  {t("stateCampaign.Campaign_completed")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Details Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-color)] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[var(--bg-color)] border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text-color)]">
                {t("stateCampaign.Campaign_Report")}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Reporter Information */}
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100">
                <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4 flex items-center gap-2">
                  <User size={20} className="text-blue-600" />
                  {t("stateCampaign.Reporter_Information")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">{t("stateCampaign.Name")}</p>
                    <p className="font-semibold text-[var(--text-color)]">
                      {selectedReport.karyakarta_firstName ||
                        selectedReport.personName ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">{t("stateCampaign.Contant")}</p>
                    <p className="font-semibold text-[var(--text-color)] flex items-center gap-2">
                      <Phone size={16} className="text-[var(--text-secondary)]" />
                      {selectedReport.karyakarta_phone ||
                        selectedReport.personPhone ||
                        "N/A"}
                    </p>
                  </div>
                  {selectedReport.reporter_level && (
                    <div>
                      <p className="text-sm text-[var(--text-secondary)] mb-1">{t("stateCampaign.Level")}</p>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {selectedReport.reporter_level}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Details */}
              <div className="bg-linear-to-r from-green-50 to-emerald-50 rounded-lg p-5 border border-green-100">
                <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-green-600" />
                  {t("stateCampaign.Event_Details")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">{t("stateCampaign.Person_Name")}</p>
                    <p className="font-semibold text-[var(--text-color)]">
                      {selectedReport.personName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">{t("stateCampaign.Person_Phone")}</p>
                    <p className="font-semibold text-[var(--text-color)] flex items-center gap-2">
                      <Phone size={16} className="text-[var(--text-secondary)]" />
                      {selectedReport.personPhone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">{t("stateCampaign.Attendees")}</p>
                    <p className="font-semibold text-[var(--text-color)] flex items-center gap-2">
                      <Users size={16} className="text-[var(--text-secondary)]" />
                      {selectedReport.attendees ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">{t("stateCampaign.Date")}</p>
                    <p className="font-semibold text-[var(--text-color)] flex items-center gap-2">
                      <Calendar size={16} className="text-[var(--text-secondary)]" />
                      {selectedReport.date
                        ? new Date(selectedReport.date).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  {selectedReport.location && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-[var(--text-secondary)] mb-1">{t("stateCampaign.Location")}</p>
                      <p className="font-semibold text-[var(--text-color)] flex items-center gap-2">
                        <MapPin size={16} className="text-[var(--text-secondary)]" />
                        {selectedReport.location}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedReport.description && (
                <div className="bg-[var(--bg-color)] rounded-lg p-5 border border-[var(--text-color)]/10">
                  <h3 className="text-lg font-semibold text-[var(--text-color)] mb-3">
                    {t("stateCampaign.Description")}
                  </h3>
                  <p className="text-[var(--text-secondary)] whitespace-pre-wrap">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              {/* Images */}
              {selectedReport.images &&
                Array.isArray(selectedReport.images) &&
                selectedReport.images.length > 0 && (
                  <div className="bg-[var(--bg-color)] rounded-lg p-5 border border-[var(--text-color)]/10">
                    <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4">
                      {t("stateCampaign.Event_Images")} ({selectedReport.images.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {selectedReport.images.map(
                        (image: string, index: number) => (
                          <div
                            key={index}
                            className="group relative aspect-square rounded-lg overflow-hidden border-2 border-[var(--text-color)]/10 hover:border-blue-500 transition-all cursor-pointer shadow-sm hover:shadow-md"
                            onClick={() => handleImageClick(image, index)}
                          >
                            <img
                              src={image}
                              alt={`Event image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 bg-[var(--bg-color)] p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                              <Eye size={20} className="text-blue-600" />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Metadata */}
              <div className="bg-[var(--bg-color)] rounded-lg p-5 border border-[var(--text-color)]/10">
                <h3 className="text-lg font-semibold text-[var(--text-color)] mb-3">
                  {t("stateCampaign.Report_Metadata")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[var(--text-secondary)]">{t("stateCampaign.Report_ID")}: </span>
                    <span className="font-medium text-[var(--text-color)]">
                      #{selectedReport.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">{t("stateCampaign.Created")}: </span>
                    <span className="font-medium text-[var(--text-color)]">
                      {selectedReport.created_at
                        ? new Date(selectedReport.created_at).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                  {selectedReport.updated_at && (
                    <div>
                      <span className="text-[var(--text-secondary)]">{t("stateCampaign.Updated")}: </span>
                      <span className="font-medium text-[var(--text-color)]">
                        {new Date(selectedReport.updated_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-[var(--bg-color)] border-t px-6 py-4 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-[var(--text-secondary)] rounded-lg transition-colors font-medium"
              >
                {t("stateCampaign.Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60"
          onClick={handleCloseImageModal}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button
              onClick={handleCloseImageModal}
              className="absolute top-4 right-4 p-2 bg-[var(--bg-color)] bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all z-10"
            >
              <X size={24} className="text-white" />
            </button>

            {selectedReport?.images &&
              Array.isArray(selectedReport.images) &&
              selectedReport.images.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute left-4 p-3 bg-[var(--bg-color)] bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all z-10"
                >
                  <ChevronLeft size={32} className="text-white" />
                </button>
              )}

            <div
              className="relative max-w-7xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Full size"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
              {selectedReport?.images &&
                Array.isArray(selectedReport.images) &&
                selectedReport.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-full text-sm">
                    {selectedImageIndex + 1} / {selectedReport.images.length}
                  </div>
                )}
            </div>

            {selectedReport?.images &&
              Array.isArray(selectedReport.images) &&
              selectedReport.images.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-4 p-3 bg-[var(--bg-color)] bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all z-10"
                >
                  <ChevronRight size={32} className="text-white" />
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  );
};



