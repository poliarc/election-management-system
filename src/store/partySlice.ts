import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
    Party,
    PartyType,
    PartyUser,
    CreatePartyRequest,
    UpdatePartyRequest,
    PartyQueryParams,
} from "../types/party";
import * as partyApi from "../services/partyApi";

interface PartyState {
    parties: Party[];
    partyTypes: PartyType[];
    partyUsers: PartyUser[];
    selectedParty: Party | null;
    loading: boolean;
    error: string | null;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    queryParams: PartyQueryParams;
    usersPagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    usersQueryParams: {
        page: number;
        limit: number;
        search?: string;
    };
}

const initialState: PartyState = {
    parties: [],
    partyTypes: [],
    partyUsers: [],
    selectedParty: null,
    loading: false,
    error: null,
    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    },
    queryParams: {
        page: 1,
        limit: 10,
    },
    usersPagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    },
    usersQueryParams: {
        page: 1,
        limit: 10,
    },
};

// Async thunks
export const fetchParties = createAsyncThunk(
    "party/fetchParties",
    async (params: PartyQueryParams = {}) => {
        const response = await partyApi.fetchAllParties(params);
        return response;
    }
);

export const fetchParty = createAsyncThunk(
    "party/fetchParty",
    async (id: number) => {
        const response = await partyApi.fetchSingleParty(id);
        return response.data;
    }
);

export const createParty = createAsyncThunk(
    "party/createParty",
    async (data: CreatePartyRequest) => {
        const response = await partyApi.createParty(data);
        return response.data;
    }
);

export const updateParty = createAsyncThunk(
    "party/updateParty",
    async ({ id, data }: { id: number; data: UpdatePartyRequest }) => {
        const response = await partyApi.updateParty(id, data);
        return response.data;
    }
);

export const activateParty = createAsyncThunk(
    "party/activateParty",
    async (id: number) => {
        const response = await partyApi.activateParty(id);
        return response.data;
    }
);

export const deactivateParty = createAsyncThunk(
    "party/deactivateParty",
    async (id: number) => {
        const response = await partyApi.deactivateParty(id);
        return response.data;
    }
);

export const deleteParty = createAsyncThunk(
    "party/deleteParty",
    async (id: number) => {
        await partyApi.deleteParty(id);
        return id;
    }
);

export const fetchPartyTypes = createAsyncThunk(
    "party/fetchPartyTypes",
    async () => {
        const response = await partyApi.fetchPartyTypes();
        return response.data;
    }
);

export const fetchUsersByParty = createAsyncThunk(
    "party/fetchUsersByParty",
    async (partyId: number) => {
        const response = await partyApi.fetchUsersByParty(partyId);
        return response.data;
    }
);

export const fetchUsersByPartyPaginated = createAsyncThunk(
    "party/fetchUsersByPartyPaginated",
    async ({ partyId, params }: { partyId: number; params?: { page?: number; limit?: number; search?: string } }) => {
        const response = await partyApi.fetchUsersByPartyPaginated(partyId, params);
        return response;
    }
);

const partySlice = createSlice({
    name: "party",
    initialState,
    reducers: {
        setQueryParams: (state, action: PayloadAction<PartyQueryParams>) => {
            state.queryParams = { ...state.queryParams, ...action.payload };
        },
        setUsersQueryParams: (state, action: PayloadAction<{ page?: number; limit?: number; search?: string }>) => {
            state.usersQueryParams = { ...state.usersQueryParams, ...action.payload };
        },
        clearError: (state) => {
            state.error = null;
        },
        clearSelectedParty: (state) => {
            state.selectedParty = null;
        },
        clearPartyUsers: (state) => {
            state.partyUsers = [];
            state.usersPagination = {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
            };
            state.usersQueryParams = {
                page: 1,
                limit: 10,
            };
        },
    },
    extraReducers: (builder) => {
        // Fetch parties
        builder
            .addCase(fetchParties.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchParties.fulfilled, (state, action) => {
                state.loading = false;
                state.parties = action.payload.data;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchParties.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch parties";
            });

        // Fetch single party
        builder
            .addCase(fetchParty.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchParty.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedParty = action.payload;
            })
            .addCase(fetchParty.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch party";
            });

        // Create party
        builder
            .addCase(createParty.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createParty.fulfilled, (state, action) => {
                state.loading = false;
                state.parties.unshift(action.payload);
                state.pagination.total += 1;
            })
            .addCase(createParty.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to create party";
            });

        // Update party
        builder
            .addCase(updateParty.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateParty.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.parties.findIndex(
                    (p) => p.party_id === action.payload.party_id
                );
                if (index !== -1) {
                    state.parties[index] = action.payload;
                }
                if (state.selectedParty?.party_id === action.payload.party_id) {
                    state.selectedParty = action.payload;
                }
            })
            .addCase(updateParty.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to update party";
            });

        // Activate party
        builder
            .addCase(activateParty.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(activateParty.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.parties.findIndex(
                    (p) => p.party_id === action.payload.party_id
                );
                if (index !== -1) {
                    state.parties[index] = action.payload;
                }
            })
            .addCase(activateParty.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to activate party";
            });

        // Deactivate party
        builder
            .addCase(deactivateParty.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deactivateParty.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.parties.findIndex(
                    (p) => p.party_id === action.payload.party_id
                );
                if (index !== -1) {
                    state.parties[index] = action.payload;
                }
            })
            .addCase(deactivateParty.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to deactivate party";
            });

        // Delete party
        builder
            .addCase(deleteParty.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteParty.fulfilled, (state, action) => {
                state.loading = false;
                state.parties = state.parties.filter((p) => p.party_id !== action.payload);
                state.pagination.total -= 1;
            })
            .addCase(deleteParty.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to delete party";
            });

        // Fetch party types
        builder
            .addCase(fetchPartyTypes.pending, (state) => {
                state.error = null;
            })
            .addCase(fetchPartyTypes.fulfilled, (state, action) => {
                state.partyTypes = action.payload;
            })
            .addCase(fetchPartyTypes.rejected, (state, action) => {
                state.error = action.error.message || "Failed to fetch party types";
            });

        // Fetch users by party
        builder
            .addCase(fetchUsersByParty.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsersByParty.fulfilled, (state, action) => {
                state.loading = false;
                state.partyUsers = action.payload;
            })
            .addCase(fetchUsersByParty.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch users";
            });

        // Fetch users by party paginated
        builder
            .addCase(fetchUsersByPartyPaginated.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsersByPartyPaginated.fulfilled, (state, action) => {
                state.loading = false;
                state.partyUsers = action.payload.data;
                if (action.payload.pagination) {
                    state.usersPagination = action.payload.pagination;
                }
            })
            .addCase(fetchUsersByPartyPaginated.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch users";
            });
    },
});

export const { setQueryParams, setUsersQueryParams, clearError, clearSelectedParty, clearPartyUsers } =
    partySlice.actions;

export default partySlice.reducer;
