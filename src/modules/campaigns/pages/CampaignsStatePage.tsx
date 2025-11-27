import { useState, useCallback, useEffect } from "react";
import type { Campaign } from "../../../types/campaign";
import ConfirmationModal from "../../../components/ConfirmationModal";
import { CampaignListing } from "./components/CampaignListing";
import { CampaignForm } from "./components/CampaignForm";
import { CampaignDetails } from "./components/CampaignDetails";
import { useIntegratedCampaign } from "../../../hooks/useIntegratedCampaign";
import { CAMPAIGN_CONFIG } from "../../../config/campaignConfig";
import {
  getAllCampaigns,
  addCampaign,
  updateCampaign,
  deleteCampaign,
  endCampaign,
  getReportsByCampaignId,
} from "../data/staticCampaignData";

type ViewMode = "listing" | "form" | "details";

interface ModalState {
  isOpen: boolean;
  campaignId: string;
  campaignTitle: string;
  isLoading: boolean;
}

export const CampaignsStatePage = () => {
  // Integrated campaign hook
  const {
    createCampaignFromLegacyForm,
    updateCampaign: updateCampaignApi,
    markCampaignComplete: markCampaignCompleteApi,
    deleteCampaign: deleteCampaignApi,
    getMyCampaigns,
    getCreatedCampaigns,
    loading: apiLoading,
    error: apiError,
    debugContext,
  } = useIntegratedCampaign();

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

  // Load campaigns from API
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        debugContext();

        // Try to load campaigns from API first
        const [myCampaignsResponse, createdCampaignsResponse] =
          await Promise.all([
            getMyCampaigns({ isActive: 1 }),
            getCreatedCampaigns(),
          ]);

        // Transform API data to match existing Campaign type
        const transformApiCampaign = (apiCampaign: unknown): Campaign => ({
          id: String(apiCampaign.campaign_id),
          name: apiCampaign.name,
          description: apiCampaign.description,
          start_date: apiCampaign.start_date,
          end_date: apiCampaign.end_date,
          location: null,
          image: apiCampaign.images?.[0] || null,
          images: apiCampaign.images || [],
          levelType: apiCampaign.campaign_level,
          level_id: apiCampaign.campaign_id,
          levelOrderNo: "1",
          status: apiCampaign.isActive,
          isDelete: 0,
          created_at: apiCampaign.start_date,
          updated_at: apiCampaign.end_date,
          scope_id: apiCampaign.campaign_id,
          scope_level_type: apiCampaign.campaign_level,
          scope_level_id: apiCampaign.campaign_id,
          acceptance_status: apiCampaign.user_acceptance_status || "PENDING",
          acceptance_id:
            apiCampaign.user_acceptance_status === "accepted"
              ? apiCampaign.campaign_id
              : null,
          report_count: 0,
          totalParticipants: 0,
          media: {
            images: apiCampaign.images || [],
            videos: [],
          },
        });

        const allCampaigns = [
          ...myCampaignsResponse.map(transformApiCampaign),
          ...createdCampaignsResponse.map(transformApiCampaign),
        ];

        // Remove duplicates based on campaign ID
        const uniqueCampaigns = allCampaigns.filter(
          (campaign, index, self) =>
            index === self.findIndex((c) => c.id === campaign.id)
        );

        setCampaigns(uniqueCampaigns);
        console.log("Loaded campaigns from API:", uniqueCampaigns);
      } catch (error) {
        console.error("Failed to load campaigns from API:", error);

        if (!CAMPAIGN_CONFIG.API_ONLY) {
          console.log("Falling back to static data");
          // Fallback to static data only if API_ONLY is false
          const loadedCampaigns = getAllCampaigns();
          setCampaigns(loadedCampaigns);
        } else {
          console.log("API_ONLY mode: No fallback to static data");
          setCampaigns([]); // Empty array if API fails and API_ONLY is true
        }
      }
    };

    loadCampaigns();
  }, [debugContext, getMyCampaigns, getCreatedCampaigns]);

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
      images?: (string | undefined)[];
      imageFiles?: File[];
      targetScopes?: { levelType: string; level_id: string }[];
      autoInclude?: boolean;
    }) => {
      try {
        if (editingCampaign) {
          // Update existing campaign (use static data for now)
          // Convert File objects to data URLs
          let imageUrls: string[] = [];

          if (data.imageFiles && data.imageFiles.length > 0) {
            const fileToDataUrl = (file: File): Promise<string> => {
              return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
            };

            imageUrls = await Promise.all(data.imageFiles.map(fileToDataUrl));
          } else {
            imageUrls = (data.images ?? []).filter(
              (img): img is string => typeof img === "string"
            );
          }

          // Update campaign using integrated API
          console.log("Updating campaign with data:", data);

          // Debug context before API call
          debugContext();

          try {
            const updateData = {
              name: data.title,
              description: data.description,
              isActive: true, // Keep campaign active
            };

            const updatedCampaign = await updateCampaignApi(
              parseInt(editingCampaign.id),
              updateData
            );
            console.log("Campaign updated successfully:", updatedCampaign);

            // Refresh campaigns from API
            const [myCampaignsResponse, createdCampaignsResponse] =
              await Promise.all([
                getMyCampaigns({ isActive: 1 }),
                getCreatedCampaigns(),
              ]);

            // Transform and update campaigns list (reuse the same transform logic)
            const transformApiCampaign = (apiCampaign: unknown): Campaign => ({
              id: String(apiCampaign.campaign_id),
              name: apiCampaign.name,
              description: apiCampaign.description,
              start_date: apiCampaign.start_date,
              end_date: apiCampaign.end_date,
              location: null,
              image: apiCampaign.images?.[0] || null,
              images: apiCampaign.images || [],
              levelType: apiCampaign.campaign_level,
              level_id: apiCampaign.campaign_id,
              levelOrderNo: "1",
              status: apiCampaign.isActive,
              isDelete: 0,
              created_at: apiCampaign.start_date,
              updated_at: apiCampaign.end_date,
              scope_id: apiCampaign.campaign_id,
              scope_level_type: apiCampaign.campaign_level,
              scope_level_id: apiCampaign.campaign_id,
              acceptance_status:
                apiCampaign.user_acceptance_status || "PENDING",
              acceptance_id:
                apiCampaign.user_acceptance_status === "accepted"
                  ? apiCampaign.campaign_id
                  : null,
              report_count: 0,
              totalParticipants: 0,
              media: {
                images: apiCampaign.images || [],
                videos: [],
              },
            });

            const allCampaigns = [
              ...myCampaignsResponse.map(transformApiCampaign),
              ...createdCampaignsResponse.map(transformApiCampaign),
            ];

            const uniqueCampaigns = allCampaigns.filter(
              (campaign, index, self) =>
                index === self.findIndex((c) => c.id === campaign.id)
            );

            setCampaigns(uniqueCampaigns);
          } catch (apiError) {
            console.error(
              "API update failed, falling back to static data:",
              apiError
            );

            // Fallback to static data if API fails
            const updated = updateCampaign(editingCampaign.id, {
              name: data.title,
              description: data.description,
              location: data.location,
              start_date: data.start_date,
              end_date: data.end_date,
              images: imageUrls,
            });

            if (updated) {
              setCampaigns(getAllCampaigns());
            }
          }
        } else {
          // Create new campaign using integrated API
          console.log("Creating campaign with data:", data);

          // Debug context before API call
          debugContext();

          try {
            const legacyData = {
              title: data.title,
              description: data.description,
              location: data.location || "",
              start_date: data.start_date || "",
              end_date: data.end_date || "",
              images: data.images || [],
              target_levels: [],
              imageFiles: data.imageFiles,
              targetScopes: data.targetScopes,
              autoInclude: data.autoInclude,
            };

            const newCampaign = await createCampaignFromLegacyForm(legacyData);
            console.log("Campaign created successfully:", newCampaign);

            // Also add to static data for UI consistency
            addCampaign({
              name: data.title,
              description: data.description,
              location: data.location,
              start_date: data.start_date,
              end_date: data.end_date,
              images: data.imageFiles
                ? []
                : (data.images ?? []).filter(
                    (img): img is string => typeof img === "string"
                  ),
            });

            setCampaigns(getAllCampaigns());
          } catch (apiError) {
            console.error(
              "API call failed, falling back to static data:",
              apiError
            );

            // Fallback to static data if API fails
            addCampaign({
              name: data.title,
              description: data.description,
              location: data.location,
              start_date: data.start_date,
              end_date: data.end_date,
              images: [],
            });

            setCampaigns(getAllCampaigns());
          }
        }

        handleCancel();
      } catch (error) {
        console.error("Failed to submit campaign:", error);
        // Handle error appropriately
      }
    },
    [
      editingCampaign,
      handleCancel,
      debugContext,
      createCampaignFromLegacyForm,
      updateCampaignApi,
      getMyCampaigns,
      getCreatedCampaigns,
    ]
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

    try {
      console.log("Deleting campaign:", deleteModal.campaignId);

      // Call API to delete campaign
      const response = await deleteCampaignApi(
        parseInt(deleteModal.campaignId)
      );
      console.log("Campaign deleted successfully:", response);

      // Refresh campaigns from API
      const [myCampaignsResponse, createdCampaignsResponse] = await Promise.all(
        [getMyCampaigns({ isActive: 1 }), getCreatedCampaigns()]
      );

      // Transform and update campaigns list
      const transformApiCampaign = (apiCampaign: any): Campaign => ({
        id: String(apiCampaign.campaign_id),
        name: apiCampaign.name,
        description: apiCampaign.description,
        start_date: apiCampaign.start_date,
        end_date: apiCampaign.end_date,
        location: null,
        image: apiCampaign.images?.[0] || null,
        images: apiCampaign.images || [],
        levelType: apiCampaign.campaign_level,
        level_id: apiCampaign.campaign_id,
        levelOrderNo: "1",
        status: apiCampaign.isActive,
        isDelete: 0,
        created_at: apiCampaign.start_date,
        updated_at: apiCampaign.end_date,
        scope_id: apiCampaign.campaign_id,
        scope_level_type: apiCampaign.campaign_level,
        scope_level_id: apiCampaign.campaign_id,
        acceptance_status: apiCampaign.user_acceptance_status || "PENDING",
        acceptance_id:
          apiCampaign.user_acceptance_status === "accepted"
            ? apiCampaign.campaign_id
            : null,
        report_count: 0,
        totalParticipants: 0,
        media: {
          images: apiCampaign.images || [],
          videos: [],
        },
      });

      const allCampaigns = [
        ...myCampaignsResponse.map(transformApiCampaign),
        ...createdCampaignsResponse.map(transformApiCampaign),
      ];

      const uniqueCampaigns = allCampaigns.filter(
        (campaign, index, self) =>
          index === self.findIndex((c) => c.id === campaign.id)
      );

      setCampaigns(uniqueCampaigns);
    } catch (error) {
      console.error("API delete failed, falling back to static data:", error);

      // Fallback to static data if API fails
      deleteCampaign(deleteModal.campaignId);
      setCampaigns(getAllCampaigns());
    }

    setDeleteModal({
      isOpen: false,
      campaignId: "",
      campaignTitle: "",
      isLoading: false,
    });
  }, [
    deleteModal.campaignId,
    deleteCampaignApi,
    getMyCampaigns,
    getCreatedCampaigns,
  ]);

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

    try {
      console.log("Ending campaign:", endCampaignModal.campaignId);

      // Call API to mark campaign complete
      const response = await markCampaignCompleteApi(
        parseInt(endCampaignModal.campaignId)
      );
      console.log("Campaign marked complete successfully:", response);

      // Refresh campaigns from API
      const [myCampaignsResponse, createdCampaignsResponse] = await Promise.all(
        [getMyCampaigns({ isActive: 1 }), getCreatedCampaigns()]
      );

      // Transform and update campaigns list
      const transformApiCampaign = (apiCampaign: unknown): Campaign => ({
        id: String(apiCampaign.campaign_id),
        name: apiCampaign.name,
        description: apiCampaign.description,
        start_date: apiCampaign.start_date,
        end_date: apiCampaign.end_date,
        location: null,
        image: apiCampaign.images?.[0] || null,
        images: apiCampaign.images || [],
        levelType: apiCampaign.campaign_level,
        level_id: apiCampaign.campaign_id,
        levelOrderNo: "1",
        status: apiCampaign.isActive,
        isDelete: 0,
        created_at: apiCampaign.start_date,
        updated_at: apiCampaign.end_date,
        scope_id: apiCampaign.campaign_id,
        scope_level_type: apiCampaign.campaign_level,
        scope_level_id: apiCampaign.campaign_id,
        acceptance_status: apiCampaign.user_acceptance_status || "PENDING",
        acceptance_id:
          apiCampaign.user_acceptance_status === "accepted"
            ? apiCampaign.campaign_id
            : null,
        report_count: 0,
        totalParticipants: 0,
        media: {
          images: apiCampaign.images || [],
          videos: [],
        },
      });

      const allCampaigns = [
        ...myCampaignsResponse.map(transformApiCampaign),
        ...createdCampaignsResponse.map(transformApiCampaign),
      ];

      const uniqueCampaigns = allCampaigns.filter(
        (campaign, index, self) =>
          index === self.findIndex((c) => c.id === campaign.id)
      );

      setCampaigns(uniqueCampaigns);
    } catch (error) {
      console.error(
        "API end campaign failed, falling back to static data:",
        error
      );

      // Fallback to static data if API fails
      const updated = endCampaign(endCampaignModal.campaignId);
      if (updated) {
        setCampaigns(getAllCampaigns());
      }
    }

    setEndCampaignModal({
      isOpen: false,
      campaignId: "",
      campaignTitle: "",
      isLoading: false,
    });
    setViewMode("listing");
  }, [
    endCampaignModal.campaignId,
    markCampaignCompleteApi,
    getMyCampaigns,
    getCreatedCampaigns,
  ]);

  return (
    <div className="w-full min-h-[400px]">
      {/* API Error Display */}
      {apiError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          API Error: {apiError}
        </div>
      )}

      {/* API Loading Indicator */}
      {apiLoading && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          Processing campaign request...
        </div>
      )}

      {/* Configuration Indicator */}
      {CAMPAIGN_CONFIG.SHOW_DATA_SOURCE && (
        <div className="mb-4 p-2 bg-gray-100 border border-gray-300 text-gray-700 rounded text-sm">
          Mode:{" "}
          {CAMPAIGN_CONFIG.API_ONLY
            ? "API Only (No Static Fallback)"
            : "API with Static Fallback"}
          {campaigns.length > 0 && ` | ${campaigns.length} campaigns loaded`}
        </div>
      )}

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
