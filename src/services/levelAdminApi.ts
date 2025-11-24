import { API_CONFIG } from "../config/api";

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

export interface User {
    user_id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    contact_no: string;
    party_id: number;
    state_id: number;
    district_id: number | null;
    partyName: string;
    stateName: string;
    districtName: string | null;
    isActive: number;
}

export interface UsersFilterResponse {
    success: boolean;
    message: string;
    data: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Fetch users by party and state
export async function fetchUsersByPartyAndState(
    partyId: number,
    stateId: number,
    page: number = 1,
    limit: number = 50
): Promise<UsersFilterResponse> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/users/filter?party_id=${partyId}&state_id=${stateId}&page=${page}&limit=${limit}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to fetch users");
    }

    return response.json();
}

// Assign user to state hierarchy
export async function assignUserToState(
    userId: number,
    hierarchyId: number
): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/create-user-state-hierarchy`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            user_id: userId,
            stateMasterData_id: hierarchyId,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to assign user");
    }

    return response.json();
}

// Assign user to district (for state-level admins)
export async function assignUserToDistrict(
    userId: number,
    districtId: number
): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/create-user-state-hierarchy`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            user_id: userId,
            stateMasterData_id: districtId,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to assign user to district");
    }

    return response.json();
}

// Unassign user from state hierarchy
export async function unassignUserFromState(
    userId: number,
    stateMasterDataId: number
): Promise<{ success: boolean; message: string; deleted?: any[]; summary?: any }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/delete-assigned-locations`;

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            userId: userId,
            stateMasterData_id: stateMasterDataId,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to unassign user");
    }

    return response.json();
}

// Get assigned users for a hierarchy location
export async function fetchAssignedUsers(
    hierarchyId: number,
    page: number = 1,
    limit: number = 10
): Promise<any> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/location/${hierarchyId}/users?page=${page}&limit=${limit}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to fetch assigned users");
    }

    return response.json();
}

// Fetch districts for a state
export async function fetchDistrictsByState(
    stateId: number
): Promise<{ success: boolean; data: Array<{ id: number; name: string }> }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/hierarchy/children/${stateId}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to fetch districts");
    }

    return response.json();
}
