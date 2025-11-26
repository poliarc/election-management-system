import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CampaignEvent } from "../../types/initative";

interface CampaignState {
  campaigns: CampaignEvent[];
  loading: boolean;
  error: string | null;
  editingCampaign: CampaignEvent | null;
  selectedCampaign: CampaignEvent | null;
  searchTerm: string;
  filterStatus: "all" | "active" | "completed" | "draft";
  acceptanceStatusFilter: "all" | "pending" | "accepted" | "declined";
}

const initialState: CampaignState = {
  campaigns: [],
  loading: false,
  error: null,
  editingCampaign: null,
  selectedCampaign: null,
  searchTerm: "",
  filterStatus: "all",
  acceptanceStatusFilter: "all",
};

const campaignSlice = createSlice({
  name: "campaign",
  initialState,
  reducers: {
    setEditingCampaign(state, action: PayloadAction<CampaignEvent | null>) {
      state.editingCampaign = action.payload;
    },
    setSelectedCampaign(state, action: PayloadAction<CampaignEvent | null>) {
      state.selectedCampaign = action.payload;
    },
    setSearchTerm(state, action: PayloadAction<string>) {
      state.searchTerm = action.payload;
    },
    setFilterStatus(
      state,
      action: PayloadAction<CampaignState["filterStatus"]>
    ) {
      state.filterStatus = action.payload;
    },
    setAcceptanceStatusFilter(
      state,
      action: PayloadAction<CampaignState["acceptanceStatusFilter"]>
    ) {
      state.acceptanceStatusFilter = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    setCampaignEvents(state, action: PayloadAction<CampaignEvent[]>) {
      state.campaigns = action.payload ?? [];
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setEditingCampaign,
  setSelectedCampaign,
  setSearchTerm,
  setFilterStatus,
  setAcceptanceStatusFilter,
  clearError,
  setCampaignEvents,
  setLoading,
  setError,
} = campaignSlice.actions;

export default campaignSlice.reducer;
