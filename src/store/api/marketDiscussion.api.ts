// Location: store/api/marketDiscussion.api.ts
import { API_CONFIG } from "../../config/api"; // Adjust this path to your api config if needed

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

export interface MarketDiscussionPayload {
  market_id: number;
  status?: "PENDING" | "DISCUSS LATER" | "INTERESTED" | "NOT INTERESTED";
  discussion_remarks?: string;
  updated_by?: number;
  discussion_scheduled_on?: string; 
  contact_person_id?: number;
  current_party_associated?: string;
  person_influenced?: number;
}

export interface MarketDiscussionData extends MarketDiscussionPayload {
  id: number;
  updated_on?: string;
  created_at?: string;
  updated_by_name?: string;     
  contact_person_name?: string; 
}

export interface MarketDiscussionFetchParams {
  leader_id?: number;
  updated_by?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}

export interface MarketDiscussionResponse {
  success: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: MarketDiscussionData[];
}

export async function createMarketDiscussion(
  payload: MarketDiscussionPayload
): Promise<{ success: boolean; id: number; message: string }> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_CONFIG.BASE_URL}/api/market-discussion/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to create market discussion");
  }
  return response.json();
}

export async function fetchMarketDiscussions(
  params: MarketDiscussionFetchParams = {}
): Promise<MarketDiscussionResponse> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });

  const response = await fetch(`${API_CONFIG.BASE_URL}/api/market-discussion/get-market-discussion?${query.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to fetch market discussions");
  }
  return response.json();
}

export async function updateMarketDiscussion(
  id: number,
  payload: Partial<MarketDiscussionPayload>
): Promise<{ success: boolean; message: string }> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_CONFIG.BASE_URL}/api/market-discussion/update/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to update market discussion");
  }
  return response.json();
}

export async function deleteMarketDiscussion(
  id: number
): Promise<{ success: boolean; message: string }> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(`${API_CONFIG.BASE_URL}/api/market-discussion/delete/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to delete market discussion");
  }
  return response.json();
}