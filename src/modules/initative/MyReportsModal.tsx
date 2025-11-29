import React, { useState } from "react";
import {
  X,
  Calendar,
  Users,
  FileText,
  Clock,
  Edit,
  Image as ImageIcon,
} from "lucide-react";
import { useGetMyReportsQuery } from "../../store/api/myCampaignsApi";
import { EditReportModal } from "./EditReportModal";
import type { CampaignEvent } from "../../types/initative";

interface MyReportsModalProps {
  campaignId: number;
  campaignName: string;
  onClose: () => void;
}

interface ReportData {
  campaignReport_id: number;
  campaign_acceptance_id: number;
  attendees: number;
  personName: string;
  personPhone: string;
  images: string[];
  report_date: string;
  description: string;
  isActive: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
  campaign_id: number;
  acceptance_status: string;
  campaign_name: string;
  campaign_description: string;
  campaign_start_date: string;
  campaign_end_date: string;
  campaign_active: number;
}

export const MyReportsModal: React.FC<MyReportsModalProps> = ({
  campaignId,
  campaignName,
  onClose,
}) => {
  const { data, isLoading, error, refetch } = useGetMyReportsQuery(campaignId);
  const [editingReport, setEditingReport] = useState<{
    id: number;
    campaign_acceptance_id: number;
    attendees: number;
    personName: string;
    personPhone: string;
    images: string[];
    date: string;
    description: string;
    campaign_id: number;
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingImages, setViewingImages] = useState<string[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(
    new Set()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEditReport = (report: ReportData) => {
    // Convert the API report format to the format expected by EditReportModal
    const editableReport = {
      id: report.campaignReport_id,
      campaign_acceptance_id: report.campaign_acceptance_id,
      attendees: report.attendees,
      personName: report.personName,
      personPhone: report.personPhone,
      images: report.images || [],
      date: report.report_date,
      description: report.description,
      campaign_id: report.campaign_id,
    };

    console.log("Opening edit modal for report:", {
      reportId: report.campaignReport_id,
      campaignId: report.campaign_id,
      personName: report.personName,
      attendees: report.attendees,
    });

    setEditingReport(editableReport);
    setShowEditModal(true);
  };

  const handleViewImages = (images: string[]) => {
    setViewingImages(images);
    setShowImageModal(true);
  };

  const toggleDescriptionExpansion = (reportId: number) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  const createCampaignEvent = (): CampaignEvent => {
    if (!data) {
      throw new Error("No campaign data available");
    }

    return {
      id: String(data.data.campaign.campaign_id),
      title: campaignName,
      description: "",
      date: data.data.campaign.start_date,
      startDate: data.data.campaign.start_date,
      endDate: data.data.campaign.end_date,
      time: "",
      location: "",
      category: "meeting" as const,
      priority: "medium" as const,
      attendeeCount: 0,
      maxAttendees: 0,
      acceptance_status: "accepted" as const,
      image: [],
      organizer: "",
      requirements: [],
      createdAt: "",
      updatedAt: "",
      campaign_id: data.data.campaign.campaign_id,
      scope_id: 0,
      acceptance_id: data.data.acceptance.campaignAcceptance_id,
      levelType: "",
      level_id: 0,
      scope_level_type: "",
      scope_level_id: 0,
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 lg:left-[258px]">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">My Reports</h2>
              <p className="text-blue-100 mt-1">{campaignName}</p>
            </div>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading reports...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Failed to Load Reports
              </h3>
              <p className="text-gray-600">Please try again later.</p>
            </div>
          )}

          {data && (
            <>
              {/* Campaign Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Start Date</p>
                      <p className="font-semibold">
                        {formatDate(data.data.campaign.start_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">End Date</p>
                      <p className="font-semibold">
                        {formatDate(data.data.campaign.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Reports</p>
                      <p className="font-semibold">{data.data.total_reports}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reports Table */}
              {data.data.reports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">
                    No Reports Yet
                  </h3>
                  <p className="text-gray-500 mt-2">
                    You haven't submitted any reports for this campaign.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Report ID
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Submitter
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attendees
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Report Date
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Submitted
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Images
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.data.reports.map((report) => (
                          <tr
                            key={report.campaignReport_id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="bg-blue-100 rounded-full p-2 mr-3">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  #{report.campaignReport_id}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {report.personName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {report.personPhone}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 text-green-600 mr-2" />
                                <span className="text-sm font-medium text-gray-900">
                                  {report.attendees}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(report.report_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 text-purple-600 mr-2" />
                                <span className="text-sm text-gray-900">
                                  {formatDateTime(report.created_at)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 max-w-xs">
                              {report.description ? (
                                <div className="text-sm text-gray-900">
                                  {report.description.length > 50 ? (
                                    <div>
                                      <p
                                        className={
                                          expandedDescriptions.has(
                                            report.campaignReport_id
                                          )
                                            ? ""
                                            : "truncate"
                                        }
                                      >
                                        {expandedDescriptions.has(
                                          report.campaignReport_id
                                        )
                                          ? report.description
                                          : `${report.description.substring(
                                              0,
                                              50
                                            )}...`}
                                      </p>
                                      <button
                                        onClick={() =>
                                          toggleDescriptionExpansion(
                                            report.campaignReport_id
                                          )
                                        }
                                        className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1"
                                      >
                                        {expandedDescriptions.has(
                                          report.campaignReport_id
                                        )
                                          ? "Show less"
                                          : "Show more"}
                                      </button>
                                    </div>
                                  ) : (
                                    <p>{report.description}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">
                                  No description
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {report.images && report.images.length > 0 ? (
                                <button
                                  onClick={() =>
                                    handleViewImages(report.images)
                                  }
                                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  <ImageIcon className="w-4 h-4 mr-1" />
                                  <span className="text-sm font-medium">
                                    {report.images.length} image
                                    {report.images.length !== 1 ? "s" : ""}
                                  </span>
                                </button>
                              ) : (
                                <span className="text-sm text-gray-400">
                                  No images
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleEditReport(report)}
                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Report Modal */}
      {showEditModal && editingReport && (
        <EditReportModal
          report={editingReport}
          campaign={createCampaignEvent()}
          onClose={() => {
            setShowEditModal(false);
            setEditingReport(null);
          }}
          onSuccess={() => {
            refetch(); // Refresh the reports data after successful edit
          }}
        />
      )}

      {/* Image Viewer Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-70">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Report Images</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {viewingImages.map((image, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <img
                      src={image}
                      alt={`Report image ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
