import axios from "axios";
import type {
  BoothAgent,
  BoothAgentFormData,
  PaginationParams,
  ApiResponse,
  PollingCenter,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE_PATH = "/api/booth-agents";

// Get auth token from localStorage
const getAuthToken = () => {
  // Try to get token from localStorage (same key as other APIs in the app)
  let token = localStorage.getItem("auth_access_token");

  // If no token, try alternative keys
  if (!token) {
    token = localStorage.getItem("token");
  }

  // If still no token, try to get from user object
  if (!token) {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        token = user.token || user.accessToken;
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
    }
  }

  // Return token with Bearer prefix if exists
  if (token) {
    // If token already has Bearer prefix, return as is
    if (token.startsWith("Bearer ")) {
      return token;
    }
    return `Bearer ${token}`;
  }

  return "";
};

// Create axios instance with auth
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

export const boothAgentApi = {
  // Create booth agent
  createAgent: async (
    data: BoothAgentFormData
  ): Promise<ApiResponse<BoothAgent>> => {
    // File uploads temporarily disabled
    // const hasFiles =
    //   data.photo instanceof File ||
    //   data.aadhar_card instanceof File ||
    //   data.voter_id_file instanceof File;

    // For now, always send as JSON to avoid FormData type conversion issues
    // TODO: Implement proper file upload handling later
    // if (hasFiles) {
    //   console.warn("File uploads temporarily disabled - sending JSON only");
    // }

    {
      // No files - send as JSON to preserve number types
      const jsonData: Record<string, unknown> = {};

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          jsonData[key] = value;
        }
      });

      const response = await axios.post(
        `${API_BASE_URL}${BASE_PATH}/create`,
        jsonData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: getAuthToken(),
          },
        }
      );
      return response.data;
    }
  },

  // Get all booth agents with filters
  getAllAgents: async (
    params?: PaginationParams
  ): Promise<ApiResponse<BoothAgent[]>> => {
    const response = await apiClient.get(`${BASE_PATH}/all`, { params });
    return response.data;
  },

  // Get agents by category
  getAgentsByCategory: async (
    category: string,
    params?: PaginationParams
  ): Promise<ApiResponse<BoothAgent[]>> => {
    const response = await apiClient.get(
      `${BASE_PATH}/category/${encodeURIComponent(category)}`,
      {
        params,
      }
    );
    return response.data;
  },

  // Get single booth agent
  getAgentById: async (id: number): Promise<ApiResponse<BoothAgent>> => {
    const response = await apiClient.get(`${BASE_PATH}/single/${id}`);
    return response.data;
  },

  // Update booth agent
  updateAgent: async (
    id: number,
    data: Partial<BoothAgentFormData>
  ): Promise<ApiResponse<BoothAgent>> => {
    // File uploads temporarily disabled
    // const hasFiles =
    //   data.photo instanceof File ||
    //   data.aadhar_card instanceof File ||
    //   data.voter_id_file instanceof File;

    // For now, always send as JSON to avoid FormData type conversion issues
    // TODO: Implement proper file upload handling later
    // if (hasFiles) {
    //   console.warn("File uploads temporarily disabled - sending JSON only");
    // }

    {
      // No files - send as JSON to preserve number types
      const jsonData: Record<string, unknown> = {};

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          jsonData[key] = value;
        }
      });

      const response = await axios.put(
        `${API_BASE_URL}${BASE_PATH}/update/${id}`,
        jsonData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: getAuthToken(),
          },
        }
      );
      return response.data;
    }
  },

  // Toggle agent status
  toggleStatus: async (
    id: number,
    status: number
  ): Promise<ApiResponse<BoothAgent>> => {
    const response = await apiClient.patch(`${BASE_PATH}/${id}/toggle-status`, {
      status,
    });
    return response.data;
  },

  // Delete booth agent
  deleteAgent: async (id: number): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`${BASE_PATH}/delete/${id}`);
    return response.data;
  },

  // Get polling centers hierarchy
  getPollingCentersHierarchy: async (
    assemblyId: number
  ): Promise<ApiResponse<PollingCenter[]>> => {
    const response = await apiClient.get(
      `${BASE_PATH}/hierarchy/${assemblyId}`
    );
    return response.data;
  },
};
