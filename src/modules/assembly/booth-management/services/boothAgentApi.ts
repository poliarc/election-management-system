import axios from "axios";
import { handleTokenExpiration } from "../../../../utils/tokenValidator";
import type {
  BoothAgent,
  BoothAgentFormData,
  PaginationParams,
  ApiResponse,
  PollingCenter,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE_PATH = "/api/booth-agents";

const getAuthToken = () => {
  const token = localStorage.getItem("auth_access_token");
  if (token) {
    return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }
  return "";
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = token;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) handleTokenExpiration();
    return Promise.reject(error);
  }
);

export const boothAgentApi = {
  // Create booth agent (JSON - no files)
  createAgent: async (data: BoothAgentFormData): Promise<ApiResponse<BoothAgent>> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, String(value));
      }
    });
    const response = await axios.post(`${API_BASE_URL}${BASE_PATH}`, formData, {
      headers: { Authorization: getAuthToken() },
    });
    return response.data;
  },

  // Create booth agent with files (FormData) — single multipart request
  createAgentWithFiles: async (formData: FormData): Promise<ApiResponse<BoothAgent>> => {
    // Send as multipart/form-data — do NOT set Content-Type manually
    // Browser sets it automatically with correct boundary
    const response = await axios.post(`${API_BASE_URL}${BASE_PATH}`, formData, {
      headers: { Authorization: getAuthToken() },
    });
    return response.data;
  },

  // Get all booth agents
  getAllAgents: async (params?: PaginationParams): Promise<ApiResponse<BoothAgent[]>> => {
    const response = await apiClient.get(`${BASE_PATH}`, { params });
    return response.data;
  },

  // Get agents by assembly with party filter
  getAgentsByAssembly: async (assemblyId: number, params?: PaginationParams): Promise<ApiResponse<BoothAgent[]>> => {
    const response = await apiClient.get(`${BASE_PATH}/assembly/${assemblyId}`, { params });
    return response.data;
  },

  // Get agents by category
  getAgentsByCategory: async (category: string, params?: PaginationParams): Promise<ApiResponse<BoothAgent[]>> => {
    const response = await apiClient.get(`${BASE_PATH}`, { params: { ...params, category } });
    return response.data;
  },

  // Get single booth agent
  getAgentById: async (id: number): Promise<ApiResponse<BoothAgent>> => {
    const response = await apiClient.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  // Update booth agent (JSON - no files)
  updateAgent: async (id: number, data: Partial<BoothAgentFormData>): Promise<ApiResponse<BoothAgent>> => {
    const jsonData: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) jsonData[key] = value;
    });
    const response = await axios.put(`${API_BASE_URL}${BASE_PATH}/${id}`, jsonData, {
      headers: { "Content-Type": "application/json", Authorization: getAuthToken() },
    });
    return response.data;
  },

  // Update booth agent with files
  updateAgentWithFiles: async (id: number, formData: FormData): Promise<ApiResponse<BoothAgent>> => {
    const response = await axios.put(`${API_BASE_URL}${BASE_PATH}/${id}`, formData, {
      headers: { Authorization: getAuthToken() },
    });
    return response.data;
  },

  // Toggle agent status
  toggleStatus: async (id: number, status: number): Promise<ApiResponse<BoothAgent>> => {
    const response = await apiClient.patch(`${BASE_PATH}/${id}/status`, { status });
    return response.data;
  },

  // Delete booth agent
  deleteAgent: async (id: number): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`${BASE_PATH}/${id}`);
    return response.data;
  },

  // Get polling centers by assembly
  getPollingCentersByAssembly: async (assemblyId: number): Promise<ApiResponse<PollingCenter[]>> => {
    const response = await apiClient.get(`${BASE_PATH}/polling-centers/${assemblyId}`);

    const rawData = response.data;
    let allChildren: Record<string, unknown>[] = [];

    if (Array.isArray(rawData)) {
      allChildren = rawData;
    } else if (Array.isArray(rawData?.data?.polling_centers)) {
      allChildren = rawData.data.polling_centers;
    } else if (Array.isArray(rawData?.polling_centers)) {
      allChildren = rawData.polling_centers;
    } else if (Array.isArray(rawData?.data)) {
      allChildren = rawData.data;
    } else if (Array.isArray(rawData?.children)) {
      allChildren = rawData.children;
    }

    return {
      success: true,
      message: "Polling centers retrieved",
      data: allChildren.map((pc) => ({
        id: pc.id as number,
        displayName: String(pc.name || pc.displayName || pc.levelName || ""),
        levelName: String(pc.levelName || pc.name || ""),
        parentId: (pc.parentId as number) || 0,
        parentAssemblyId: (pc.parentAssemblyId as number) || null,
        partyLevelId: (pc.partyLevelId as number) || 0,
        isActive: (pc.isActive as number) || 1,
        created_at: String(pc.created_at || ""),
        updated_at: String(pc.updated_at || ""),
        booths: Array.isArray(pc.booths)
          ? (pc.booths as Record<string, unknown>[]).map((b) => ({
              id: b.id as number,
              displayName: String(b.name || b.displayName || b.levelName || ""),
              levelName: String(b.levelName || "Booth"),
              parentId: (b.polling_center_id as number) || (b.parentId as number) || 0,
              parentAssemblyId: null,
              partyLevelId: 0,
              isActive: 1,
              created_at: "",
              updated_at: "",
            }))
          : [],
        boothCount: (pc.booth_count as number) || 0,
      })),
    };
  },

  // Get booths by polling center - uses hierarchy children API
  getBoothsByPollingCenter: async (pollingCenterId: number): Promise<ApiResponse<PollingCenter[]>> => {
    const response = await apiClient.get(
      `/user-after-assembly-hierarchy/hierarchy/children/${pollingCenterId}`
    );

    const rawData = response.data;
    let children: Record<string, unknown>[] = [];

    if (Array.isArray(rawData)) {
      children = rawData;
    } else if (Array.isArray(rawData?.children)) {
      children = rawData.children;
    } else if (Array.isArray(rawData?.data)) {
      children = rawData.data;
    }

    return {
      success: true,
      message: "Booths retrieved",
      data: children.map((booth) => ({
        id: booth.id as number,
        displayName: String(booth.displayName || booth.levelName || ""),
        levelName: String(booth.levelName || ""),
        parentId: (booth.parentId as number) || 0,
        parentAssemblyId: (booth.parentAssemblyId as number) || null,
        partyLevelId: (booth.partyLevelId as number) || 0,
        isActive: (booth.isActive as number) || 1,
        created_at: String(booth.created_at || ""),
        updated_at: String(booth.updated_at || ""),
        booths: [],
        boothCount: 0,
      })),
    };
  },

  // Get dashboard stats
  getStats: async (assemblyId: number, partyId: number): Promise<{
    total_agents: number;
    booth_inside_team: number;
    booth_outside_team: number;
    polling_support_team: number;
    active_agents: number;
    inactive_agents: number;
  }> => {
    const response = await apiClient.get(`${BASE_PATH}/stats/${assemblyId}/${partyId}`);
    return response.data.data;
  },

  // Get polling centers hierarchy
  getPollingCentersHierarchy: async (assemblyId: number): Promise<ApiResponse<PollingCenter[]>> => {
    const response = await apiClient.get(`/user-after-assembly-hierarchy/after-assembly/${assemblyId}`);
    const rawData = response.data;
    const data = Array.isArray(rawData) ? rawData : (rawData?.data || rawData?.children || []);
    return { success: true, message: "Hierarchy retrieved", data };
  },
};
