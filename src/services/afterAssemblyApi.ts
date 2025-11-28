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

export interface AfterAssemblyData {
    id: number;
    levelName: string;
    displayName: string;
    parentId: number | null;
    parentAssemblyId: number;
    partyLevelId: number;
    isActive: number;
    isDelete: number;
    created_at: string;
    updated_at: string;
    assemblyName: string;
    partyLevelName: string;
}

export interface CreateAfterAssemblyDataPayload {
    levelName: string;
    displayName: string;
    partyLevelId: number;
    parentId: number | null;
    parentAssemblyId: number | null;
}

export interface UpdateAfterAssemblyDataPayload {
    levelName?: string;
    displayName?: string;
    partyLevelId?: number;
    parentId?: number | null;
}

export interface AssignUserPayload {
    user_id: number;
    afterAssemblyData_id: number;
}

export interface UnassignUserPayload {
    user_id: number;
    afterAssemblyData_ids: number[];
}

// Create after assembly data
export async function createAfterAssemblyData(
    payload: CreateAfterAssemblyDataPayload
): Promise<{ success: boolean; message: string; data?: AfterAssemblyData }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/after-assembly-data/create`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to create after assembly data");
    }

    return response.json();
}

// Get after assembly data by assembly ID
export async function fetchAfterAssemblyDataByAssembly(
    parentAssemblyId: number
): Promise<{ success: boolean; message: string; data: AfterAssemblyData[] }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/after-assembly-data/assembly/${parentAssemblyId}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to fetch after assembly data");
    }

    return response.json();
}

// Update after assembly data
export async function updateAfterAssemblyData(
    id: number,
    payload: UpdateAfterAssemblyDataPayload
): Promise<{ success: boolean; message: string; data?: AfterAssemblyData }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/after-assembly-data/update/${id}`;

    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to update after assembly data");
    }

    return response.json();
}

// Activate after assembly data
export async function activateAfterAssemblyData(
    id: number
): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/after-assembly-data/${id}/activate`;

    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to activate after assembly data");
    }

    return response.json();
}

// Deactivate after assembly data
export async function deactivateAfterAssemblyData(
    id: number
): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/after-assembly-data/${id}/deactivate`;

    const response = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to deactivate after assembly data");
    }

    return response.json();
}

// Delete after assembly data
export async function deleteAfterAssemblyData(
    id: number
): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/after-assembly-data/delete/${id}`;

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to delete after assembly data");
    }

    return response.json();
}

// Assign user to after assembly data
export async function assignUserToAfterAssembly(
    payload: AssignUserPayload
): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/user-after-assembly-hierarchy/assign`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to assign user");
    }

    return response.json();
}

// Unassign user from after assembly data
export async function unassignUserFromAfterAssembly(
    payload: UnassignUserPayload
): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/user-after-assembly-hierarchy/delete-assigned-levels`;

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to unassign user");
    }

    return response.json();
}

// Fetch booth level data by level ID
export async function fetchBoothsByLevel(
    levelId: number
): Promise<{ success: boolean; message: string; data: any[] }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/booth-level-data/level/${levelId}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to fetch booths");
    }

    return response.json();
}

// Fetch assigned users for after assembly data
export async function fetchAssignedUsersForLevel(
    afterAssemblyDataId: number
): Promise<{ success: boolean; message: string; users: any[]; level: any; total_users: number }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/user-after-assembly-hierarchy/level/${afterAssemblyDataId}/users`;

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

// Fetch child levels by parent ID
export async function fetchChildLevelsByParent(
    parentId: number
): Promise<{ success: boolean; message: string; data: AfterAssemblyData[] }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/after-assembly-data/parent/${parentId}/children`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to fetch child levels");
    }

    return response.json();
}

// Alias for fetchChildLevelsByParent for consistency
export async function fetchAfterAssemblyChildrenByParent(
    parentId: number
): Promise<{ success: boolean; message: string; data: AfterAssemblyData[] }> {
    return fetchChildLevelsByParent(parentId);
}
