import React, { useState, useEffect } from "react";
import { useCampaign } from "../hooks/useCampaign";
import { CampaignForm } from "./CampaignForm";
import {
  debugCampaignContext,
  getUserFromStorage,
  getSelectedAssignmentFromStorage,
  getHierarchyPath,
} from "../utils/campaignDataMapper";
import type {
  CampaignData,
  AcceptanceDetailsResponse,
} from "../types/campaign-api";

export const CampaignExample: React.FC = () => {
  const {
    getMyCampaigns,
    getCreatedCampaigns,
    acceptCampaign,
    declineCampaign,
    getAcceptanceDetails,
    loading,
    error,
  } = useCampaign();

  const [showForm, setShowForm] = useState(false);
  const [myCampaigns, setMyCampaigns] = useState<CampaignData[]>([]);
  const [createdCampaigns, setCreatedCampaigns] = useState<CampaignData[]>([]);
  const [acceptanceDetails, setAcceptanceDetails] = useState<
    AcceptanceDetailsResponse["data"] | null
  >(null);
  const [, setSelectedCampaignId] = useState<number | null>(null);

  // Get user context for display
  const user = getUserFromStorage();
  const selectedAssignment = getSelectedAssignmentFromStorage();

  useEffect(() => {
    loadCampaigns();
    // Debug current context
    debugCampaignContext();
  }, []);

  const loadCampaigns = async () => {
    try {
      const [myData, createdData] = await Promise.all([
        getMyCampaigns({ isActive: 1 }),
        getCreatedCampaigns(),
      ]);
      setMyCampaigns(myData);
      setCreatedCampaigns(createdData);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    }
  };

  const handleCampaignCreated = (campaign: CampaignData) => {
    setShowForm(false);
    loadCampaigns(); // Refresh the lists
    alert(`Campaign "${campaign.name}" created successfully!`);
  };

  const handleAcceptCampaign = async (campaignId: number) => {
    try {
      await acceptCampaign(campaignId);
      loadCampaigns(); // Refresh to show updated status
      alert("Campaign accepted successfully!");
    } catch (err) {
      console.error("Failed to accept campaign:", err);
    }
  };

  const handleDeclineCampaign = async (campaignId: number) => {
    try {
      await declineCampaign(campaignId);
      loadCampaigns(); // Refresh to show updated status
      alert("Campaign declined successfully!");
    } catch (err) {
      console.error("Failed to decline campaign:", err);
    }
  };

  const handleViewAcceptanceDetails = async (campaignId: number) => {
    try {
      const details = await getAcceptanceDetails(campaignId);
      setAcceptanceDetails(details);
      setSelectedCampaignId(campaignId);
    } catch (err) {
      console.error("Failed to get acceptance details:", err);
    }
  };

  const renderUserContext = () => (
    <div className="bg-blue-50 p-4 rounded-lg mb-6">
      <h3 className="font-semibold text-blue-900 mb-2">Current User Context</h3>
      <div className="text-sm text-blue-800 space-y-1">
        <p>
          <strong>User:</strong> {user?.firstName} {user?.lastName} (
          {user?.userType})
        </p>
        <p>
          <strong>Party:</strong> {user?.partyName} (ID: {user?.partyId})
        </p>
        <p>
          <strong>Assignment:</strong> {getHierarchyPath(selectedAssignment)}
        </p>
        <p>
          <strong>State ID:</strong> {selectedAssignment?.stateMasterData_id}
        </p>
      </div>
    </div>
  );

  const renderCampaignCard = (
    campaign: CampaignData,
    isCreated: boolean = false
  ) => (
    <div
      key={campaign.campaign_id}
      className="border rounded-lg p-4 bg-white shadow-sm"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-lg">{campaign.name}</h4>
        <span
          className={`px-2 py-1 rounded text-xs ${
            campaign.isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {campaign.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-3">{campaign.description}</p>

      <div className="text-xs text-gray-500 space-y-1 mb-3">
        <p>
          <strong>Level:</strong> {campaign.campaign_level}
        </p>
        <p>
          <strong>Duration:</strong> {campaign.start_date} to{" "}
          {campaign.end_date}
        </p>
        <p>
          <strong>Party:</strong> {campaign.partyName}
        </p>
        <p>
          <strong>State:</strong> {campaign.state_name}
        </p>
      </div>

      {!isCreated && campaign.user_acceptance_status && (
        <div className="mb-3">
          <span
            className={`px-2 py-1 rounded text-xs ${
              campaign.user_acceptance_status === "accepted"
                ? "bg-green-100 text-green-800"
                : campaign.user_acceptance_status === "declined"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            Status: {campaign.user_acceptance_status}
          </span>
        </div>
      )}

      {isCreated && (
        <div className="mb-3 text-xs text-gray-500">
          <p>
            <strong>Accepted:</strong> {campaign.accepted_count || 0}
          </p>
          <p>
            <strong>Declined:</strong> {campaign.declined_count || 0}
          </p>
          <p>
            <strong>Pending:</strong> {campaign.pending_count || 0}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {!isCreated && campaign.user_acceptance_status === "pending" && (
          <>
            <button
              onClick={() => handleAcceptCampaign(campaign.campaign_id)}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              disabled={loading}
            >
              Accept
            </button>
            <button
              onClick={() => handleDeclineCampaign(campaign.campaign_id)}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
              disabled={loading}
            >
              Decline
            </button>
          </>
        )}

        {isCreated && (
          <button
            onClick={() => handleViewAcceptanceDetails(campaign.campaign_id)}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            disabled={loading}
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );

  const renderAcceptanceDetails = () => {
    if (!acceptanceDetails) return null;

    const { campaign, acceptances, summary } = acceptanceDetails;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Acceptance Details: {campaign.name}
              </h3>
              <button
                onClick={() => setAcceptanceDetails(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.total}
                </div>
                <div className="text-sm text-blue-800">Total</div>
              </div>
              <div className="bg-green-50 p-3 rounded text-center">
                <div className="text-2xl font-bold text-green-600">
                  {summary.accepted}
                </div>
                <div className="text-sm text-green-800">Accepted</div>
              </div>
              <div className="bg-red-50 p-3 rounded text-center">
                <div className="text-2xl font-bold text-red-600">
                  {summary.declined}
                </div>
                <div className="text-sm text-red-800">Declined</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {summary.pending}
                </div>
                <div className="text-sm text-yellow-800">Pending</div>
              </div>
            </div>

            {/* User List */}
            <div className="space-y-2">
              <h4 className="font-medium">User Responses</h4>
              <div className="max-h-60 overflow-y-auto">
                {acceptances.map((acceptance) => (
                  <div
                    key={acceptance.campaignAcceptance_id}
                    className="flex justify-between items-center p-2 border rounded"
                  >
                    <div>
                      <span className="font-medium">
                        {acceptance.first_name} {acceptance.last_name}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({acceptance.email})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          acceptance.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : acceptance.status === "declined"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {acceptance.status}
                      </span>
                      {acceptance.accepted_on && (
                        <span className="text-xs text-gray-500">
                          {new Date(
                            acceptance.accepted_on
                          ).toLocaleDateString()}
                        </span>
                      )}
                      {acceptance.declined_on && (
                        <span className="text-xs text-gray-500">
                          {new Date(
                            acceptance.declined_on
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (showForm) {
    return (
      <CampaignForm
        onSuccess={handleCampaignCreated}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Campaign Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Campaign
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {renderUserContext()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Campaigns */}
        <div>
          <h2 className="text-xl font-semibold mb-4">My Campaigns</h2>
          <div className="space-y-4">
            {myCampaigns.length === 0 ? (
              <p className="text-gray-500">No campaigns assigned to you.</p>
            ) : (
              myCampaigns.map((campaign) => renderCampaignCard(campaign, false))
            )}
          </div>
        </div>

        {/* Created Campaigns */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Created by Me</h2>
          <div className="space-y-4">
            {createdCampaigns.length === 0 ? (
              <p className="text-gray-500">
                You haven't created any campaigns yet.
              </p>
            ) : (
              createdCampaigns.map((campaign) =>
                renderCampaignCard(campaign, true)
              )
            )}
          </div>
        </div>
      </div>

      {acceptanceDetails && renderAcceptanceDetails()}
    </div>
  );
};
