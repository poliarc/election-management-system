import type {
  HierarchyChildrenResponse,
  HierarchyQueryParams,
} from "../types/hierarchy";
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

// Build query string from params
function buildQueryString(params: HierarchyQueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.search) searchParams.append("search", params.search);
  if (params.sortBy) searchParams.append("sort_by", params.sortBy);
  if (params.order) searchParams.append("order", params.order);

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// Fetch hierarchy children
export async function fetchHierarchyChildren(
  parentId: number,
  params: HierarchyQueryParams = {}
): Promise<HierarchyChildrenResponse> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Authentication required");
  }

  const queryString = buildQueryString(params);
  const url = `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/hierarchy/children/${parentId}${queryString}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: `HTTP ${response.status}` }));
      throw new Error(error.message || `Failed to fetch hierarchy data`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }
      throw error;
    }
    throw new Error("An unexpected error occurred");
  }
}

// Get selected district from localStorage
export function getSelectedDistrict(): { id: number; name: string } | null {
  try {
    const authState = localStorage.getItem("auth_state");
    if (!authState) return null;

    const parsed = JSON.parse(authState);
    const selectedAssignment = parsed.selectedAssignment;

    if (selectedAssignment && selectedAssignment.levelType === "District") {
      return {
        id: selectedAssignment.stateMasterData_id,
        name: selectedAssignment.levelName,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// Get selected state from localStorage
export function getSelectedState(): {
  id: number;
  name: string;
  stateAssignments: any[];
} | null {
  try {
    const authState = localStorage.getItem("auth_state");
    if (!authState) return null;

    const parsed = JSON.parse(authState);
    const selectedAssignment = parsed.selectedAssignment;

    if (selectedAssignment && selectedAssignment.levelType === "State") {
      return {
        id: selectedAssignment.stateMasterData_id,
        name: selectedAssignment.levelName,
        stateAssignments: parsed.stateAssignments || [],
      };
    }

    return null;
  } catch {
    return null;
  }
}
