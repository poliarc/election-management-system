import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import type {
  Campaign,
  CampaignDetail,
  CampaignReport,
} from "../../../types/campaign";
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
} from "../data/staticCampaignData";
import campaignApi from "../../../services/campaignApi";
import type { CampaignFormData } from "../../../schemas/campaignSchema";

const toCampaignIdString = (campaign?: Campaign | null) => {
  if (!campaign) {
    return "";
  }

  const candidate =
    campaign.id ??
    campaign.campaign_id ??
    campaign.campaignId ??
    campaign.scope_id;

  return candidate === undefined || candidate === null ? "" : String(candidate);
};

const resolveCampaignNumericId = (
  campaign?: Campaign | null,
  fallbackValue?: string | number
): number | null => {
  const candidates = [
    campaign?.id,
    campaign?.campaign_id,
    campaign?.campaignId,
    campaign?.scope_id,
    fallbackValue,
  ];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null || candidate === "") {
      continue;
    }
    const numericCandidate = Number(candidate);
    if (Number.isFinite(numericCandidate)) {
      return numericCandidate;
    }
  }

  return null;
};

const normalizeCampaignStatus = (campaign: Campaign): Campaign => {
  const hasIsActiveFlag = typeof campaign.isActive === "number";
  if (hasIsActiveFlag) {
    const normalizedStatus = campaign.isActive === 0 ? 0 : campaign.status ?? 1;
    if (campaign.status !== normalizedStatus) {
      return { ...campaign, status: normalizedStatus };
    }
  }

  if (campaign.status === undefined || campaign.status === null) {
    return { ...campaign, status: 1 };
  }

  return campaign;
};

const toImageArray = (images?: unknown): string[] => {
  if (!Array.isArray(images)) {
    return [];
  }
  return images.filter((img): img is string => typeof img === "string");
};

const mergeCampaignDetailWithCampaign = (
  detail: CampaignDetail,
  fallback: Campaign
): Campaign => {
  const normalizedImages = toImageArray(detail.images);

  const merged: Campaign = {
    ...fallback,
    id: detail.campaign_id ?? fallback.id,
    campaign_id: detail.campaign_id ?? fallback.campaign_id,
    campaignId: detail.campaign_id ?? fallback.campaignId,
    name: detail.name ?? fallback.name,
    description: detail.description ?? fallback.description,
    start_date: detail.start_date ?? fallback.start_date,
    end_date: detail.end_date ?? fallback.end_date,
    images: normalizedImages.length ? normalizedImages : fallback.images,
    image: normalizedImages.length ? normalizedImages[0] : fallback.image,
    location:
      detail.location !== undefined ? detail.location : fallback.location,
    isActive:
      detail.isActive !== undefined ? detail.isActive : fallback.isActive,
    created_at: detail.created_at ?? fallback.created_at,
    updated_at: detail.updated_at ?? fallback.updated_at,
    hierarchy_selections:
      detail.hierarchy_selections ?? fallback.hierarchy_selections,
  };

  return normalizeCampaignStatus(merged);
};

type ViewMode = "listing" | "form" | "details";

interface ModalState {
  isOpen: boolean;
  campaignId: string;
  campaignTitle: string;
  isLoading: boolean;
  campaign: Campaign | null;
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
    campaign: null,
  });
  const [endCampaignModal, setEndCampaignModal] = useState<ModalState>({
    isOpen: false,
    campaignId: "",
    campaignTitle: "",
    isLoading: false,
    campaign: null,
  });
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false);
  const [isPrefillingForm, setIsPrefillingForm] = useState(false);
  const [formPrefillError, setFormPrefillError] = useState<string | null>(null);
  const [selectedCampaignReports, setSelectedCampaignReports] = useState<
    CampaignReport[]
  >([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [isReportsUsingFallback, setIsReportsUsingFallback] = useState(false);

  const loadCampaigns = useCallback(async () => {
    setIsLoadingCampaigns(true);
    try {
      const response = await campaignApi.fetchCreatedByMe();
      const campaignsData = response?.data ?? [];
      setCampaigns(campaignsData.map(normalizeCampaignStatus));
      setCampaignsError(null);
      setIsUsingFallbackData(false);
    } catch (error) {
      console.error("Failed to load campaigns", error);
      const fallbackCampaigns = getAllCampaigns();
      setCampaigns(fallbackCampaigns.map(normalizeCampaignStatus));
      setCampaignsError(
        error instanceof Error
          ? `${error.message}. Showing demo campaigns instead.`
          : "Unable to load campaigns. Showing demo campaigns instead."
      );
      setIsUsingFallbackData(true);
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, []);

  const resetReportsState = useCallback(() => {
    setSelectedCampaignReports([]);
    setIsLoadingReports(false);
    setReportsError(null);
    setIsReportsUsingFallback(false);
  }, []);

  const fetchReportsForCampaign = useCallback(
    async (campaign: Campaign) => {
      const fallbackId = resolveCampaignNumericId(campaign);
      const fallbackReports =
        fallbackId !== null ? getReportsByCampaignId(fallbackId) : [];

      setReportsError(null);

      if (isUsingFallbackData) {
        setSelectedCampaignReports(fallbackReports);
        setIsReportsUsingFallback(true);
        setIsLoadingReports(false);
        return;
      }

      if (fallbackId === null) {
        setSelectedCampaignReports([]);
        setReportsError(
          "Unable to load participant reports because the campaign ID is missing."
        );
        setIsReportsUsingFallback(false);
        setIsLoadingReports(false);
        return;
      }

      setIsLoadingReports(true);
      setIsReportsUsingFallback(false);
      setSelectedCampaignReports([]);

      try {
        const response = await campaignApi.fetchCampaignReports(fallbackId);
        setSelectedCampaignReports(response.data);
      } catch (error) {
        console.error("Failed to load campaign reports", error);
        setReportsError(
          error instanceof Error
            ? error.message
            : "Failed to load participant activity."
        );
        if (fallbackReports.length > 0) {
          setSelectedCampaignReports(fallbackReports);
          setIsReportsUsingFallback(true);
        }
      } finally {
        setIsLoadingReports(false);
      }
    },
    [isUsingFallbackData]
  );

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Edit campaign handler
  const handleEditCampaign = useCallback(
    async (campaign: Campaign) => {
      setFormPrefillError(null);

      if (isUsingFallbackData) {
        setEditingCampaign(campaign);
        setViewMode("form");
        return;
      }

      const campaignNumericId = resolveCampaignNumericId(campaign);
      if (campaignNumericId === null) {
        setEditingCampaign(campaign);
        setFormPrefillError(
          "Unable to load campaign details because the ID is missing."
        );
        setViewMode("form");
        return;
      }

      setIsPrefillingForm(true);
      setEditingCampaign(null);
      setViewMode("form");

      try {
        const response = await campaignApi.fetchCampaignById(campaignNumericId);
        const merged = mergeCampaignDetailWithCampaign(response.data, campaign);
        setEditingCampaign(merged);
      } catch (error) {
        console.error("Failed to load campaign details", error);
        setFormPrefillError(
          error instanceof Error
            ? error.message
            : "Failed to load campaign details. Showing cached data instead."
        );
        setEditingCampaign(campaign);
      } finally {
        setIsPrefillingForm(false);
      }
    },
    [isUsingFallbackData]
  );

  // View campaign details handler
  const handleViewDetails = useCallback(
    (campaign: Campaign) => {
      setSelectedCampaign(campaign);
      setViewMode("details");
      fetchReportsForCampaign(campaign);
    },
    [fetchReportsForCampaign]
  );

  // Create new campaign handler
  const handleCreateNew = useCallback(() => {
    setEditingCampaign(null);
    setFormPrefillError(null);
    setIsPrefillingForm(false);
    resetReportsState();
    setViewMode("form");
  }, [resetReportsState]);

  // Cancel handler
  const handleCancel = useCallback(() => {
    setEditingCampaign(null);
    setSelectedCampaign(null);
    setFormPrefillError(null);
    setIsPrefillingForm(false);
    resetReportsState();
    setViewMode("listing");
  }, [resetReportsState]);

  // Form submit handler
  const handleFormSubmit = useCallback(
    async (data: CampaignFormData) => {
      try {
        // Convert File objects to data URLs for local preview/state
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

        if (editingCampaign) {
          if (isUsingFallbackData) {
            const updated = updateCampaign(String(editingCampaign.id), {
              name: data.title,
              description: data.description,
              location: data.location,
              start_date: data.start_date,
              end_date: data.end_date,
              images: imageUrls,
            });

            if (updated) {
              setCampaigns(getAllCampaigns().map(normalizeCampaignStatus));
            }
          } else {
            const campaignNumericId = resolveCampaignNumericId(editingCampaign);
            if (campaignNumericId === null) {
              throw new Error(
                "Unable to identify which campaign to update. Please refresh and try again."
              );
            }

            if (!data.stateId || !data.partyId) {
              throw new Error(
                "State or party information missing. Please refresh and try again."
              );
            }

            const payload = {
              name: data.title,
              description: data.description,
              start_date: data.start_date || undefined,
              end_date: data.end_date || undefined,
              location: data.location || undefined,
              campaign_level:
                data.campaignLevel ||
                editingCampaign.scope_level_type ||
                "State",
              state_id: data.stateId,
              party_id: data.partyId,
              hierarchy_selections: data.hierarchySelections ?? [],
            };

            await campaignApi.updateCampaign(
              campaignNumericId,
              payload,
              data.imageFiles ?? []
            );
            await loadCampaigns();
          }
        } else {
          if (isUsingFallbackData) {
            addCampaign({
              name: data.title,
              description: data.description,
              location: data.location,
              start_date: data.start_date,
              end_date: data.end_date,
              images: imageUrls,
            });

            setCampaigns(getAllCampaigns().map(normalizeCampaignStatus));
          } else {
            if (!data.stateId || !data.partyId) {
              throw new Error(
                "State or party information missing. Please refresh and try again."
              );
            }

            const payload = {
              name: data.title,
              description: data.description,
              start_date: data.start_date || undefined,
              end_date: data.end_date || undefined,
              location: data.location || undefined,
              campaign_level: data.campaignLevel || "State",
              state_id: data.stateId,
              party_id: data.partyId,
              hierarchy_selections: data.hierarchySelections ?? [],
            };

            await campaignApi.createCampaign(payload, data.imageFiles ?? []);
            await loadCampaigns();
          }
        }

        toast.success(
          editingCampaign
            ? "Campaign updated successfully."
            : "Campaign created successfully."
        );
        handleCancel();
      } catch (error) {
        console.error("Failed to submit campaign form", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to submit campaign. Please try again."
        );
      }
    },
    [editingCampaign, handleCancel, isUsingFallbackData, loadCampaigns]
  );

  // Delete campaign handlers
  const handleDeleteCampaign = useCallback((campaign: Campaign) => {
    setDeleteModal({
      isOpen: true,
      campaignId: toCampaignIdString(campaign),
      campaignTitle: campaign.name,
      isLoading: false,
      campaign,
    });
  }, []);

  const confirmDeleteCampaign = useCallback(async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));

    try {
      if (isUsingFallbackData) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const fallbackId =
          deleteModal.campaignId || toCampaignIdString(deleteModal.campaign);
        if (fallbackId) {
          deleteCampaign(fallbackId);
        }
        setCampaigns(getAllCampaigns().map(normalizeCampaignStatus));
      } else {
        const campaignNumericId = resolveCampaignNumericId(
          deleteModal.campaign,
          deleteModal.campaignId
        );
        if (campaignNumericId === null) {
          throw new Error(
            "Unable to identify which campaign to delete. Please refresh and try again."
          );
        }

        await campaignApi.deleteCampaign(campaignNumericId);
        await loadCampaigns();
      }

      setDeleteModal({
        isOpen: false,
        campaignId: "",
        campaignTitle: "",
        isLoading: false,
        campaign: null,
      });
    } catch (error) {
      console.error("Failed to delete campaign", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete campaign. Please try again."
      );
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  }, [
    deleteModal.campaign,
    deleteModal.campaignId,
    isUsingFallbackData,
    loadCampaigns,
  ]);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({
      isOpen: false,
      campaignId: "",
      campaignTitle: "",
      isLoading: false,
      campaign: null,
    });
  }, []);

  // End campaign handlers
  const handleEndCampaign = useCallback((campaign: Campaign) => {
    setEndCampaignModal({
      isOpen: true,
      campaignId: toCampaignIdString(campaign),
      campaignTitle: campaign.name,
      isLoading: false,
      campaign,
    });
  }, []);

  const confirmEndCampaign = useCallback(async () => {
    setEndCampaignModal((prev) => ({ ...prev, isLoading: true }));

    try {
      if (isUsingFallbackData) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const fallbackId =
          endCampaignModal.campaignId ||
          toCampaignIdString(endCampaignModal.campaign);
        const updated = fallbackId ? endCampaign(fallbackId) : false;
        if (updated) {
          setCampaigns(getAllCampaigns().map(normalizeCampaignStatus));
        }
      } else {
        const campaignNumericId = resolveCampaignNumericId(
          endCampaignModal.campaign,
          endCampaignModal.campaignId
        );
        if (campaignNumericId === null) {
          throw new Error(
            "Unable to identify which campaign to end. Please refresh and try again."
          );
        }

        await campaignApi.completeCampaign(campaignNumericId);
        await loadCampaigns();
      }
      toast.success("Campaign marked as completed.");
    } catch (error) {
      console.error("Failed to end campaign", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to end campaign. Please try again."
      );
    } finally {
      setEndCampaignModal({
        isOpen: false,
        campaignId: "",
        campaignTitle: "",
        isLoading: false,
        campaign: null,
      });
      setViewMode("listing");
    }
  }, [
    endCampaignModal.campaign,
    endCampaignModal.campaignId,
    isUsingFallbackData,
    loadCampaigns,
  ]);

  return (
    <div className="w-full min-h-[400px]">
      {/* Render views depending on mode */}
      {viewMode === "listing" && (
        <>
          {isLoadingCampaigns && (
            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Loading your campaigns...
            </div>
          )}
          {campaignsError && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              <span>{campaignsError}</span>
              <button
                onClick={loadCampaigns}
                className="rounded-lg border border-yellow-300 px-3 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-100"
              >
                Retry
              </button>
            </div>
          )}
          <CampaignListing
            campaigns={campaigns}
            onViewDetails={handleViewDetails}
            onEditCampaign={handleEditCampaign}
            onCreateNew={handleCreateNew}
            onDeleteCampaign={handleDeleteCampaign}
          />
        </>
      )}

      {viewMode === "form" && (
        <div className="space-y-4">
          {isPrefillingForm && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Fetching the latest campaign details...
            </div>
          )}
          {formPrefillError && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              <span>{formPrefillError}</span>
              {!isUsingFallbackData && editingCampaign && (
                <button
                  type="button"
                  onClick={() => handleEditCampaign(editingCampaign)}
                  className="rounded-md border border-yellow-400 px-3 py-1 text-xs font-medium text-yellow-900 hover:bg-yellow-100"
                >
                  Retry fetch
                </button>
              )}
            </div>
          )}
          {!isPrefillingForm && (
            <CampaignForm
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
              initialData={editingCampaign ?? undefined}
            />
          )}
        </div>
      )}

      {viewMode === "details" && selectedCampaign && (
        <CampaignDetails
          campaign={selectedCampaign}
          reports={selectedCampaignReports}
          reportsLoading={isLoadingReports}
          reportsError={reportsError}
          isReportsUsingFallback={isReportsUsingFallback}
          onReloadReports={() => fetchReportsForCampaign(selectedCampaign)}
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
