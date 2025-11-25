import { useState } from "react";
import type { Campaign, CampaignReport } from "../../../../types/campaign";

interface CampaignDetailsProps {
  campaign: Campaign;
  reports: CampaignReport[];
  onBack: () => void;
  onEditCampaign: (campaign: Campaign) => void;
  onEndCampaign: (campaignId: string, campaignTitle: string) => void;
}

export const CampaignDetails = ({
  campaign,
  reports,
  onBack,
  onEditCampaign,
  onEndCampaign,
}: CampaignDetailsProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = reports.filter(
    (report) =>
      !searchTerm ||
      (report.personName &&
        report.personName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.personPhone && report.personPhone.includes(searchTerm))
  );

  return (
    <div className="space-y-6 p-4 rounded-xl shadow-md bg-gray-50">
      <div className="flex items-center justify-between gap-6 mb-2">
        <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 transition px-4 py-2 rounded"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Details Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Campaign Details
            </h2>
            <div className="space-y-3">
              <p className="text-gray-600">{campaign.description}</p>
              {campaign.location && (
                <div>
                  <span className="font-medium text-gray-700">Location: </span>
                  <span className="text-gray-600">{campaign.location}</span>
                </div>
              )}
              {campaign.start_date && campaign.end_date && (
                <div>
                  <span className="font-medium text-gray-700">Duration: </span>
                  <span className="text-gray-600">
                    {new Date(campaign.start_date).toLocaleDateString()} -{" "}
                    {new Date(campaign.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Participants Activity Table */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Participants Activity ({filteredReports.length} reports)
              </h2>
              <div className="flex gap-2 items-center w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  className="w-full sm:w-64 px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {searchTerm
                    ? "No reports found matching your search."
                    : "No reports available"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Person Details
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Reporter Level
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Attendees
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {report.personName}
                            </p>
                            <p className="text-gray-600 text-xs">
                              {report.personPhone}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {report.reporter_level || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {report.attendees}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(report.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {report.location}
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
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Campaign Status
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    campaign.status === 1
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {campaign.status === 1 ? "active" : "completed"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Participants</span>
                <span className="font-medium">
                  {campaign.totalParticipants || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reports</span>
                <span className="font-medium">{reports.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-medium">
                  {new Date(campaign.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Actions
            </h2>
            <div className="space-y-3">
              {campaign.status === 1 && (
                <>
                  <button
                    onClick={() => onEditCampaign(campaign)}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm transition"
                  >
                    Edit Campaign
                  </button>
                  <button
                    onClick={() => onEndCampaign(campaign.id, campaign.name)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                  >
                    End Campaign
                  </button>
                </>
              )}
              {campaign.status === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Campaign has been completed
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
