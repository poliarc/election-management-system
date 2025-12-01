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

export interface PartNoAssignment {
    id: number;
    state_id: number | null;
    district_id: number | null;
    assembly_id: number | null;
    afterAssembly_id: number | null;
    part_no_from: string;
    part_no_to: string;
    assigned_by: number;
    isActive: number;
    isDelete: number;
    created_at: string;
    updated_at: string;
}

export interface AssignPartNoPayload {
    levelType: "state" | "district" | "assembly" | "afterAssembly";
    levelId: number;
    part_no_from: string;
    part_no_to: string;
    state_id?: number;
    district_id?: number;
    assembly_id?: number;
}

// Get available part numbers for a level
export async function fetchAvailablePartNos(
    assemblyId?: number,
    districtId?: number
): Promise<{ success: boolean; data: string[]; count: number }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    let url = `${API_CONFIG.BASE_URL}/api/level-part-no-assignments/available-part-nos`;
    const params = new URLSearchParams();

    if (assemblyId) params.append("assembly_id", assemblyId.toString());
    if (districtId) params.append("district_id", districtId.toString());

    if (params.toString()) {
        url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to fetch available part numbers");
    }

    const result = await response.json();

    // Sort part numbers numerically instead of lexicographically
    if (result.success && Array.isArray(result.data)) {
        result.data = result.data.sort((a: string, b: string) => {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            return numA - numB;
        });
    }

    return result;
}

// Assign part number range to a level
export async function assignPartNoRange(
    payload: AssignPartNoPayload
): Promise<{ success: boolean; message: string; data: { id: number } }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/level-part-no-assignments/assign`;

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
        throw new Error(error.message || "Failed to assign part number range");
    }

    return response.json();
}

// Get part number assignments for a level
export async function fetchPartNoAssignments(
    levelType: "state" | "district" | "assembly" | "afterAssembly",
    levelId: number
): Promise<{ success: boolean; data: PartNoAssignment[]; count: number }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/level-part-no-assignments/level/${levelType}/${levelId}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to fetch part number assignments");
    }

    return response.json();
}

// Delete part number assignment
export async function deletePartNoAssignment(
    id: number
): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const url = `${API_CONFIG.BASE_URL}/api/level-part-no-assignments/${id}`;

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to delete part number assignment");
    }

    return response.json();
}

// Voter interfaces
export interface PartNoRange {
    part_no_from: string;
    part_no_to: string;
}

export interface VoterData {
    id: number;
    state_id: number;
    district_id: number;
    assembly_id: number;
    booth_id: number;
    part_no: string;
    sl_no_in_part: string;
    voter_id_epic_no: string;
    voter_full_name_en: string;
    voter_full_name_hi?: string;
    relative_full_name_en: string;
    relative_full_name_hi?: string;
    house_no_eng?: string;
    house_no_hi?: string;
    gender: string;
    age: number;
    contact_number1?: string;
    contact_number2?: string;
    family_id?: string;
    aadhar?: string;
    religion?: string;
    caste?: string;
    education?: string;
    profession_type?: string;
    married?: string;
    politcal_party?: string;
    voters_isAlive: number;
    voter_dob?: string;
    relation?: string;
    created_at: string;
    updated_at: string;
    [key: string]: any; // For additional fields
}

export interface VotersPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface VotersResponse {
    success: boolean;
    data: VoterData[];
    pagination: VotersPagination;
    partNoRanges: PartNoRange[];
}

export interface VotersQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    gender?: string;
    ageFrom?: number;
    ageTo?: number;
}

// Get voters for afterAssembly level with filters
export async function fetchVotersByAfterAssembly(
    afterAssemblyId: number,
    params: VotersQueryParams = {}
): Promise<VotersResponse> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required");

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.gender) queryParams.append("gender", params.gender);
    if (params.ageFrom) queryParams.append("ageFrom", params.ageFrom.toString());
    if (params.ageTo) queryParams.append("ageTo", params.ageTo.toString());

    const url = `${API_CONFIG.BASE_URL}/api/level-part-no-assignments/voters/after-assembly/${afterAssemblyId}?${queryParams.toString()}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(error.message || "Failed to fetch voters");
    }

    return response.json();
}
