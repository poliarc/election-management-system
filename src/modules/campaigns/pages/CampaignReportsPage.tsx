import { useState } from "react";
import { getAllCampaigns, getAllReports } from "../data/staticCampaignData";

export const CampaignReportsPage = () => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");

  const campaigns = getAllCampaigns();
  const allReports = getAllReports();

  // Filter reports based on selected campaign
  const filteredReports = selectedCampaignId
    ? allReports.filter((r) => r.campaign_id === Number(selectedCampaignId))
    : allReports;

  // Further filter by search term
  const searchedReports = filteredReports.filter(
    (report) =>
      !searchTerm ||
      report.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.personPhone.includes(searchTerm) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  // Calculate stats
  const stats = {
    totalReports: filteredReports.length,
    totalAttendees: filteredReports.reduce((sum, r) => sum + r.attendees, 0),
    avgAttendees: filteredReports.length
      ? Math.round(
          filteredReports.reduce((sum, r) => sum + r.attendees, 0) /
            filteredReports.length
        )
      : 0,
  };

  return (
    <div className="space-y-6 p-4 rounded-xl shadow-md bg-gray-50">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campaign Reports</h1>
        <p className="text-gray-600 mt-1">
          View and analyze campaign activity reports from all levels
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Campaign
            </label>
            <select
              value={selectedCampaignId || ""}
              onChange={(e) => setSelectedCampaignId(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Campaigns</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} (
                  {campaign.status === 1 ? "Active" : "Completed"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Reports
            </label>
            <input
              type="text"
              placeholder="Search by name, phone, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {selectedCampaignId && (
        <div className="bg-linear-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">
            {selectedCampaign?.name}
          </h2>
          <p className="text-blue-100">{selectedCampaign?.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div>
            <p className="text-sm text-gray-600">Total Reports</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalReports}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div>
            <p className="text-sm text-gray-600">Total Attendees</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.totalAttendees}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div>
            <p className="text-sm text-gray-600">Avg Attendees/Report</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.avgAttendees}
            </p>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Activity Reports ({searchedReports.length})
          </h2>
        </div>
        <div className="p-6">
          {searchedReports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Campaign
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Reporter
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Level
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Attendees
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {searchedReports.map((report) => {
                    const campaign = campaigns.find(
                      (c) => c.id === String(report.campaign_id)
                    );
                    return (
                      <tr key={report.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {campaign?.name || "Unknown Campaign"}
                        </td>
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
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {report.reporter_level || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {report.location}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {report.attendees}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(report.date).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
