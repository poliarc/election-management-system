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
    const jsonData: Record<string, unknown> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") jsonData[key] = value;
    });
    const response = await axios.post(`${API_BASE_URL}${BASE_PATH}`, jsonData, {
      headers: { "Content-Type": "application/json", Authorization: getAuthToken() },
    });
    return response.data;
  },

  // Create booth agent with files (FormData)
  createAgentWithFiles: async (formData: FormData): Promise<ApiResponse<BoothAgent>> => {
    const jsonData: Record<string, unknown> = {};
    const fileFormData = new FormData();
    let hasFiles = false;

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        fileFormData.append(key, value);
        hasFiles = true;
      } else if (key === "polling_center_id" || key === "booth_id") {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue > 0) jsonData[key] = numValue;
      } else {
        if (value !== undefined && value !== null && value !== "") jsonData[key] = value;
      }
    }

    if (hasFiles) {
      const createResponse = await axios.post(`${API_BASE_URL}${BASE_PATH}`, jsonData, {
        headers: { "Content-Type": "application/json", Authorization: getAuthToken() },
      });
      const agentId = createResponse.data.data?.agent_id;
      if (!agentId) throw new Error("Failed to get agent ID from create response");

      const updateResponse = await axios.put(`${API_BASE_URL}${BASE_PATH}/${agentId}`, fileFormData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: getAuthToken() },
      });
      return updateResponse.data;
    } else {
      const response = await axios.post(`${API_BASE_URL}${BASE_PATH}`, jsonData, {
        headers: { "Content-Type": "application/json", Authorization: getAuthToken() },
      });
      return response.data;
    }
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
    const jsonData: Record<string, unknown> = {};
    const fileFormData = new FormData();
    let hasFiles = false;

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        fileFormData.append(key, value);
        hasFiles = true;
      } else if (key === "polling_center_id" || key === "booth_id") {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue > 0) jsonData[key] = numValue;
      } else {
        if (value !== undefined && value !== null && value !== "") jsonData[key] = value;
      }
    }

    if (hasFiles) {
      fileFormData.append("data", JSON.stringify(jsonData));
      try {
        const response = await axios.put(`${API_BASE_URL}${BASE_PATH}/${id}`, fileFormData, {
          headers: { "Content-Type": "multipart/form-data", Authorization: getAuthToken() },
        });
        return response.data;
      } catch {
        if (Object.keys(jsonData).length > 0) {
          await axios.put(`${API_BASE_URL}${BASE_PATH}/${id}`, jsonData, {
            headers: { "Content-Type": "application/json", Authorization: getAuthToken() },
          });
        }
        const response = await axios.put(`${API_BASE_URL}${BASE_PATH}/${id}`, fileFormData, {
          headers: { "Content-Type": "multipart/form-data", Authorization: getAuthToken() },
        });
        return response.data;
      }
    } else {
      const response = await axios.put(`${API_BASE_URL}${BASE_PATH}/${id}`, jsonData, {
        headers: { "Content-Type": "application/json", Authorization: getAuthToken() },
      });
      return response.data;
    }
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
    } else if (Array.isArray(rawData?.data)) {
      allChildren = rawData.data;
    } else if (Array.isArray(rawData?.children)) {
      allChildren = rawData.children;
    }

    const pollingCenters = allChildren.filter((item) => {
      const name = String(item.levelName || item.display_level_name || "").toLowerCase();
      return name.includes("polling");
    });

    return {
      success: true,
      message: "Polling centers retrieved",
      data: pollingCenters.map((pc) => ({
        id: pc.id as number,
        displayName: String(pc.displayName || pc.levelName || ""),
        levelName: String(pc.levelName || ""),
        parentId: (pc.parentId as number) || 0,
        parentAssemblyId: (pc.parentAssemblyId as number) || null,
        partyLevelId: (pc.partyLevelId as number) || 0,
        isActive: (pc.isActive as number) || 1,
        created_at: String(pc.created_at || ""),
        updated_at: String(pc.updated_at || ""),
        booths: [],
        boothCount: 0,
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

  // Get polling centers hierarchy
  getPollingCentersHierarchy: async (assemblyId: number): Promise<ApiResponse<PollingCenter[]>> => {
    const response = await apiClient.get(`/user-after-assembly-hierarchy/after-assembly/${assemblyId}`);
    const rawData = response.data;
    const data = Array.isArray(rawData) ? rawData : (rawData?.data || rawData?.children || []);
    return { success: true, message: "Hierarchy retrieved", data };
  },
};
