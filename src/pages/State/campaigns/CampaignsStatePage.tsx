import { useState, useCallback, useEffect } from "react";
import type { Campaign } from "../../../types/campaign";
import ConfirmationModal from "../../../components/ConfirmationModal";
import { CampaignListing } from "./components/CampaignListing";
import { CampaignForm } from "./components/CampaignForm";
import { CampaignDetails } from "./components/CampaignDetails";
import {
  getAllCampaigns,
  addCampaign,
  updateCampaign,
  deleteCampaign,
  endCampaign,
  getReportsByCampaignId,
} from "../../../modules/campaigns/data/staticCampaignData";

type ViewMode = "listing" | "form" | "details";

interface ModalState {
  isOpen: boolean;
  campaignId: string;
  campaignTitle: string;
  isLoading: boolean;
}

export const CampaignsStatePage = () => {
  // Local state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("listing");
  const [deleteModal, setDeleteModal] = useState<ModalState>({
    isOpen: false,
    campaignId: "",
    campaignTitle: "",
    isLoading: false,
  });
  const [endCampaignModal, setEndCampaignModal] = useState<ModalState>({
    isOpen: false,
    campaignId: "",
    campaignTitle: "",
    isLoading: false,
  });

  // Load campaigns from static data
  useEffect(() => {
    const loadedCampaigns = getAllCampaigns();
    setCampaigns(loadedCampaigns);
  }, []);

  // Edit campaign handler
  const handleEditCampaign = useCallback((campaign: Campaign) => {
    setEditingCampaign(campaign);
    setViewMode("form");
  }, []);

  // View campaign details handler
  const handleViewDetails = useCallback((campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setViewMode("details");
  }, []);

  // Create new campaign handler
  const handleCreateNew = useCallback(() => {
    setEditingCampaign(null);
    setViewMode("form");
  }, []);

  // Cancel handler
  const handleCancel = useCallback(() => {
    setEditingCampaign(null);
    setSelectedCampaign(null);
    setViewMode("listing");
  }, []);

  // Form submit handler
  const handleFormSubmit = useCallback(
    async (data: {
      title: string;
      description: string;
      location?: string;
      start_date?: string;
      end_date?: string;
      images?: string[];
    }) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (editingCampaign) {
        // Update existing campaign
        const updated = updateCampaign(editingCampaign.id, {
          name: data.title,
          description: data.description,
          location: data.location,
          start_date: data.start_date,
          end_date: data.end_date,
          images: data.images || [],
        });

        if (updated) {
          setCampaigns(getAllCampaigns());
        }
      } else {
        // Create new campaign
        addCampaign({
          name: data.title,
          description: data.description,
          location: data.location,
          start_date: data.start_date,
          end_date: data.end_date,
          images: data.images || [],
        });

        setCampaigns(getAllCampaigns());
      }

      handleCancel();
    },
    [editingCampaign, handleCancel]
  );

  // Delete campaign handlers
  const handleDeleteCampaign = useCallback(
    (campaignId: string, campaignTitle: string) => {
      setDeleteModal({
        isOpen: true,
        campaignId,
        campaignTitle,
        isLoading: false,
      });
    },
    []
  );

  const confirmDeleteCampaign = useCallback(async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    deleteCampaign(deleteModal.campaignId);
    setCampaigns(getAllCampaigns());

    setDeleteModal({
      isOpen: false,
      campaignId: "",
      campaignTitle: "",
      isLoading: false,
    });
  }, [deleteModal.campaignId]);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({
      isOpen: false,
      campaignId: "",
      campaignTitle: "",
      isLoading: false,
    });
  }, []);

  // End campaign handlers
  const handleEndCampaign = useCallback(
    (campaignId: string, campaignTitle: string) => {
      setEndCampaignModal({
        isOpen: true,
        campaignId,
        campaignTitle,
        isLoading: false,
      });
    },
    []
  );

  const confirmEndCampaign = useCallback(async () => {
    setEndCampaignModal((prev) => ({ ...prev, isLoading: true }));

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const updated = endCampaign(endCampaignModal.campaignId);
    if (updated) {
      setCampaigns(getAllCampaigns());
    }

    setEndCampaignModal({
      isOpen: false,
      campaignId: "",
      campaignTitle: "",
      isLoading: false,
    });
    setViewMode("listing");
  }, [endCampaignModal.campaignId]);

  return (
    <div className="w-full min-h-[400px]">
      {/* Render views depending on mode */}
      {viewMode === "listing" && (
        <CampaignListing
          campaigns={campaigns}
          onViewDetails={handleViewDetails}
          onEditCampaign={handleEditCampaign}
          onCreateNew={handleCreateNew}
          onDeleteCampaign={handleDeleteCampaign}
        />
      )}

      {viewMode === "form" && (
        <CampaignForm
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          initialData={editingCampaign ?? undefined}
        />
      )}

      {viewMode === "details" && selectedCampaign && (
        <CampaignDetails
          campaign={selectedCampaign}
          reports={getReportsByCampaignId(Number(selectedCampaign.id))}
          onBack={handleCancel}
          onEditCampaign={handleEditCampaign}
          onEndCampaign={handleEndCampaign}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteCampaign}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${deleteModal.campaignTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteModal.isLoading}
      />

      {/* End Campaign Confirmation Modal */}
      <ConfirmationModal
        isOpen={endCampaignModal.isOpen}
        onClose={() =>
          setEndCampaignModal((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={confirmEndCampaign}
        title="End Campaign"
        message={`Are you sure you want to end "${endCampaignModal.campaignTitle}"? This will change the campaign status to completed and stop all activities.`}
        confirmText="End Campaign"
        cancelText="Cancel"
        isLoading={endCampaignModal.isLoading}
      />
    </div>
  );
};
