import type {
  District,
  Mandal,
  Member,
  CampaignReport,
} from "../types/campaign-reports";

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

class CampaignReportsApi {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem("token");

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Districts API
  async getDistricts(): Promise<District[]> {
    return this.request<District[]>("/campaign-reports/districts");
  }

  async getDistrictById(id: string): Promise<District> {
    return this.request<District>(`/campaign-reports/districts/${id}`);
  }

  // Mandals API
  async getMandals(districtId?: string): Promise<Mandal[]> {
    const query = districtId ? `?districtId=${districtId}` : "";
    return this.request<Mandal[]>(`/campaign-reports/mandals${query}`);
  }

  async getMandalById(id: string): Promise<Mandal> {
    return this.request<Mandal>(`/campaign-reports/mandals/${id}`);
  }

  // Members API
  async getMembers(mandalId?: string): Promise<Member[]> {
    const query = mandalId ? `?mandalId=${mandalId}` : "";
    return this.request<Member[]>(`/campaign-reports/members${query}`);
  }

  async getMemberById(id: string): Promise<Member> {
    return this.request<Member>(`/campaign-reports/members/${id}`);
  }

  // Reports API
  async getReports(userId?: string): Promise<CampaignReport[]> {
    const query = userId ? `?userId=${userId}` : "";
    return this.request<CampaignReport[]>(`/campaign-reports/reports${query}`);
  }

  async getReportById(id: string): Promise<CampaignReport> {
    return this.request<CampaignReport>(`/campaign-reports/reports/${id}`);
  }

  async approveReport(reportId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/campaign-reports/reports/${reportId}/approve`,
      {
        method: "PATCH",
      }
    );
  }

  async rejectReport(reportId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/campaign-reports/reports/${reportId}/reject`,
      {
        method: "PATCH",
      }
    );
  }

  // Bulk operations
  async bulkApproveReports(reportIds: string[]): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      "/campaign-reports/reports/bulk-approve",
      {
        method: "PATCH",
        body: JSON.stringify({ reportIds }),
      }
    );
  }

  async bulkRejectReports(reportIds: string[]): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      "/campaign-reports/reports/bulk-reject",
      {
        method: "PATCH",
        body: JSON.stringify({ reportIds }),
      }
    );
  }

  // Analytics
  async getReportsAnalytics(
    districtId?: string,
    mandalId?: string
  ): Promise<{
    totalReports: number;
    approvedReports: number;
    pendingReports: number;
    totalEngagement: number;
  }> {
    const params = new URLSearchParams();
    if (districtId) params.append("districtId", districtId);
    if (mandalId) params.append("mandalId", mandalId);

    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/campaign-reports/analytics${query}`);
  }
}

export const campaignReportsApi = new CampaignReportsApi();
