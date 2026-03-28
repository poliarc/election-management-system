import React, { useState } from "react";
import {
  X,
  Edit,
  Calendar,
  User,
  Phone,
  Users,
  FileText,
  Image as ImageIcon,
  Eye,
} from "lucide-react";
import type { CampaignEvent } from "../../types/initative";
import { getReportsByCampaignAcceptanceId } from "./data/staticInitiativeData";
import { EditReportModal } from "./EditReportModal";

interface ViewReportsModalProps {
  campaign: CampaignEvent;
  onClose: () => void;
}

interface CampaignReport {
  id: number;
  campaign_acceptance_id: number;
  attendees: number;
  personName: string;
  personPhone: string;
  images: string[];
  date: string;
  description: string;
  isDelete: number;
  created_at: string;
  updated_at: string;
  campaign_name: string;
  campaign_id: number;
  acceptance_status: string;
}

export const ViewReportsModal: React.FC<ViewReportsModalProps> = ({
  campaign,
  onClose,
}) => {
  const [selectedReport, setSelectedReport] = useState<CampaignReport | null>(
    null
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Get reports from static data
  const reports = campaign.acceptance_id
    ? getReportsByCampaignAcceptanceId(campaign.acceptance_id)
    : [];
  const isLoading = false;
  const error = null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleEditReport = (report: CampaignReport) => {
    setSelectedReport(report);
    setShowEditModal(true);
  };

  const handleViewReport = (report: CampaignReport) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedReport(null);
    // No need to refetch for static data
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedReport(null);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 lg:left-[258px]">
        <div className="bg-[var(--bg-color)] rounded-2xl p-8">
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  // Check for missing campaign ID
  if (!campaign.campaign_id) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 lg:left-[258px]">
        <div className="bg-[var(--bg-color)] rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Invalid Campaign
            </h3>
            <p className="text-[var(--text-secondary)] mb-4">
              Campaign ID is missing. Cannot load reports.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-[var(--text-secondary)] rounded-lg hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 lg:left-[258px]">
        <div className="bg-[var(--bg-color)] rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Campaign Not Found
            </h3>
            <p className="text-[var(--text-secondary)] mb-4">
              The requested campaign could not be found.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-[var(--text-secondary)] rounded-lg hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 lg:left-[258px]">
        <div className="bg-[var(--bg-color)] rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 text-white p-6 border-b border-[var(--text-color)]/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">My Campaign Reports</h2>
                <p className="text-gray-300">{campaign.title}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  My Reports: {reports.length} | Campaign ID:{" "}
                  {campaign.campaign_id}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: "calc(90vh - 140px)" }}
          >
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">
                  No Reports Found
                </h3>
                <p className="text-[var(--text-secondary)]">
                  You haven't submitted any reports for this campaign yet.
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-2">
                  Click the "Report" button to submit your first report.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--bg-color)] border-b border-[var(--text-color)]/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Person Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Attendees
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Images
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--bg-color)] divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-[var(--bg-color)]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-[var(--text-secondary)]" />
                                <div className="text-sm font-medium text-[var(--text-color)]">
                                  {report.personName}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3 text-[var(--text-secondary)]" />
                                <div className="text-sm text-[var(--text-secondary)]">
                                  {report.personPhone}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
                            <div className="text-sm text-[var(--text-color)]">
                              {formatDate(report.date)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-[var(--text-secondary)]" />
                            <span className="text-sm font-medium text-[var(--text-color)]">
                              {report.attendees}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <ImageIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                            <span className="text-sm text-[var(--text-color)]">
                              {report.images?.length || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewReport(report)}
                              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:bg-gray-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditReport(report)}
                              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit Report"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Report Modal */}
      {showEditModal && selectedReport && (
        <EditReportModal
          report={selectedReport}
          campaign={campaign}
          onClose={handleCloseEditModal}
        />
      )}

      {/* Report Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] lg:left-[258px]">
          <div className="bg-[var(--bg-color)] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gray-800 text-white p-6 border-b border-[var(--text-color)]/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Report Details</h2>
                  <p className="text-gray-300">{selectedReport.personName}</p>
                </div>
                <button
                  onClick={handleCloseDetailModal}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 140px)" }}
            >
              <div className="space-y-6">
                {/* Person Information */}
                <div className="border border-[var(--text-color)]/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-[var(--text-secondary)]" />
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Name</p>
                        <p className="font-medium text-[var(--text-color)]">
                          {selectedReport.personName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-[var(--text-secondary)]" />
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Phone</p>
                        <p className="font-medium text-[var(--text-color)]">
                          {selectedReport.personPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="border border-[var(--text-color)]/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4">
                    Event Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[var(--text-secondary)]" />
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Date</p>
                        <p className="font-medium text-[var(--text-color)]">
                          {formatDate(selectedReport.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-[var(--text-secondary)]" />
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Attendees</p>
                        <p className="font-medium text-[var(--text-color)]">
                          {selectedReport.attendees} people
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedReport.description && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-[var(--text-secondary)]" />
                      <h3 className="text-lg font-semibold text-[var(--text-color)]">
                        Description
                      </h3>
                    </div>
                    <div className="border border-[var(--text-color)]/10 rounded-lg p-4">
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                        {selectedReport.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Images */}
                {selectedReport.images && selectedReport.images.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                      <h3 className="text-lg font-semibold text-[var(--text-color)]">
                        Images ({selectedReport.images.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedReport.images.map((imageUrl, index) => (
                        <div
                          key={index}
                          className="aspect-square rounded-lg overflow-hidden border border-[var(--text-color)]/10"
                        >
                          <img
                            src={imageUrl}
                            alt={`Report image ${index + 1}`}
                            className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                            onClick={() => window.open(imageUrl, "_blank")}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="border-t border-[var(--text-color)]/10 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[var(--text-secondary)]">
                    <div>
                      <p className="font-medium">Created</p>
                      <p>{formatDate(selectedReport.created_at)}</p>
                    </div>
                    {selectedReport.updated_at !==
                      selectedReport.created_at && (
                      <div>
                        <p className="font-medium">Last Updated</p>
                        <p>{formatDate(selectedReport.updated_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};




