// Event Master API Service
// Handles all API calls related to event logging and retrieval

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface EventQueryParams {
  page?: number;
  limit?: number;
  event_type?: string;
  event_module?: string;
  event_action?: string;
  party_id?: number;
  state_id?: number;
  district_id?: number;
  assembly_id?: number;
  block_id?: number;
  user_id?: number;
  target_type?: string;
  target_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface EventResponse {
  success: boolean;
  message: string;
  data: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class EventApi {
  private buildQueryString(params: EventQueryParams): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    return query.toString();
  }

  // Get all events with filters and pagination
  async getEvents(params: EventQueryParams): Promise<EventResponse> {
    try {
      const queryString = this.buildQueryString(params);
      const url = `${API_BASE_URL}/api/events${queryString ? "?" + queryString : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  }

  // Get event by ID
  async getEventById(eventId: number): Promise<EventResponse> {
    try {
      const url = `${API_BASE_URL}/api/events/${eventId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching event:", error);
      throw error;
    }
  }

  // Get event statistics
  async getEventStats(params: EventQueryParams): Promise<EventResponse> {
    try {
      const queryString = this.buildQueryString(params);
      const url = `${API_BASE_URL}/api/events/stats${queryString ? "?" + queryString : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching event stats:", error);
      throw error;
    }
  }

  // Get events by party
  async getEventsByParty(partyId: number, params?: EventQueryParams): Promise<EventResponse> {
    try {
      const queryString = this.buildQueryString(params || {});
      const url = `${API_BASE_URL}/api/events/party/${partyId}${queryString ? "?" + queryString : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching party events:", error);
      throw error;
    }
  }

  // Get events by state
  async getEventsByState(stateId: number, params?: EventQueryParams): Promise<EventResponse> {
    try {
      const queryString = this.buildQueryString(params || {});
      const url = `${API_BASE_URL}/api/events/state/${stateId}${queryString ? "?" + queryString : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching state events:", error);
      throw error;
    }
  }

  // Get events by party and state
  async getEventsByPartyAndState(
    partyId: number,
    stateId: number,
    params?: EventQueryParams
  ): Promise<EventResponse> {
    try {
      const queryString = this.buildQueryString(params || {});
      const url = `${API_BASE_URL}/api/events/party/${partyId}/state/${stateId}${
        queryString ? "?" + queryString : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching party and state events:", error);
      throw error;
    }
  }

  // Get events by user
  async getEventsByUser(userId: number, params?: EventQueryParams): Promise<EventResponse> {
    try {
      const queryString = this.buildQueryString(params || {});
      const url = `${API_BASE_URL}/api/events/user/${userId}${queryString ? "?" + queryString : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching user events:", error);
      throw error;
    }
  }

  // Get JWT token from localStorage
  private getToken(): string {
    return localStorage.getItem("auth_access_token") || "";
  }
}

export default new EventApi();
