import { API_CONFIG } from "../config/api";
import type {
    CreatePartyRequest,
    UpdatePartyRequest,
    PartyQueryParams,
    PartyResponse,
    SinglePartyResponse,
    PartyTypesResponse,
    PartyUsersResponse,
} from "../types/party";

// Get auth token from localStorage
function getAuthToken(): string | null {
    try {
        const authState = localStorage.getItem("auth_state");
        if (!authState) return null;
        const parsed = JSON.parse(authState);
        return parsed.accessToken || null;
    } catch {
        return null;
    }
}

// Build query string from params
function buildQueryString(params: PartyQueryParams): string {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.search) searchParams.append("search", params.search);
    if (params.isActive !== undefined)
        searchParams.append("isActive", params.isActive.toString());
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
}

// Fetch all parties
export async function fetchAllParties(
    params: PartyQueryParams = {}
): Promise<PartyResponse> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const queryString = buildQueryString(params);
    const url = `${API_CONFIG.BASE_URL}/api/parties/all${queryString}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to fetch parties");
    }

    return response.json();
}

// Fetch single party
export async function fetchSingleParty(id: number): Promise<SinglePartyResponse> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/parties/single/${id}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to fetch party");
    }

    return response.json();
}

// Create party
export async function createParty(
    data: CreatePartyRequest
): Promise<SinglePartyResponse> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/parties/create-party`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to create party");
    }

    return response.json();
}

// Update party
export async function updateParty(
    id: number,
    data: UpdatePartyRequest
): Promise<SinglePartyResponse> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/parties/update/${id}`;

    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to update party");
    }

    return response.json();
}

// Activate party
export async function activateParty(id: number): Promise<SinglePartyResponse> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/parties/${id}/activate`;

    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to activate party");
    }

    return response.json();
}

// Deactivate party
export async function deactivateParty(id: number): Promise<SinglePartyResponse> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/parties/${id}/deactivate`;

    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to deactivate party");
    }

    return response.json();
}

// Delete party
export async function deleteParty(id: number): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/parties/delete/${id}`;

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to delete party");
    }

    return response.json();
}

// Fetch all party types
export async function fetchPartyTypes(): Promise<PartyTypesResponse> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/party-types/all`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to fetch party types");
    }

    return response.json();
}

// Fetch users by party
export async function fetchUsersByParty(partyId: number): Promise<PartyUsersResponse> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/users/by-party/${partyId}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to fetch users");
    }

    return response.json();
}

// Fetch users by party with pagination and search
export async function fetchUsersByPartyPaginated(
    partyId: number,
    params: { page?: number; limit?: number; search?: string } = {}
): Promise<PartyUsersResponse> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.search) searchParams.append("search", params.search);
    const queryString = searchParams.toString();

    const url = `${API_CONFIG.BASE_URL}/api/users/by-party/${partyId}${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to fetch users");
    }

    return response.json();
}
