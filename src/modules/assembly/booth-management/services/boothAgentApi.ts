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
  // Create booth agent (JSON only - no files)
  createAgent: async (
    data: BoothAgentFormData
  ): Promise<ApiResponse<BoothAgent>> => {
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
  },

  // Create booth agent with files (FormData) - Hybrid approach
  createAgentWithFiles: async (
    formData: FormData
  ): Promise<ApiResponse<BoothAgent>> => {
    // Log FormData for debugging
    console.log("🔍 API: Sending FormData to backend:");
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value, typeof value);
    }

    // Extract numeric fields and non-file fields to send as JSON
    const jsonData: Record<string, unknown> = {};
    const fileFormData = new FormData();
    let hasFiles = false;

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        // Keep files in FormData
        fileFormData.append(key, value);
        hasFiles = true;
        console.log(`📁 File field: ${key}`);
      } else if (key === "polling_center_id" || key === "booth_id") {
        // Convert numeric fields to actual numbers for JSON
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue > 0) {
          jsonData[key] = numValue; // Store as actual number
          console.log(
            `🔢 Numeric field: ${key} = ${numValue} (${typeof numValue})`
          );
        } else {
          console.log(`⚠️ Skipping invalid ${key}: ${value}`);
        }
      } else {
        // Add other fields to JSON
        if (value !== undefined && value !== null && value !== "") {
          jsonData[key] = value;
          console.log(`📝 Text field: ${key} = ${value}`);
        }
      }
    }

    // If we have files, create agent first with JSON, then upload files
    if (hasFiles) {
      console.log("🔧 Step 1: Creating agent with JSON data:", jsonData);

      // Step 1: Create agent with JSON data (no files)
      const createResponse = await axios.post(
        `${API_BASE_URL}${BASE_PATH}/create`,
        jsonData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: getAuthToken(),
          },
        }
      );

      const agentId = createResponse.data.data?.agent_id;
      if (!agentId) {
        throw new Error("Failed to get agent ID from create response");
      }

      console.log("🔧 Step 2: Uploading files for agent ID:", agentId);

      // Step 2: Upload files using update endpoint
      const updateResponse = await axios.put(
        `${API_BASE_URL}${BASE_PATH}/update/${agentId}`,
        fileFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: getAuthToken(),
          },
        }
      );

      return updateResponse.data;
    } else {
      // No files, send as pure JSON
      console.log("🔧 No files, sending as JSON:", jsonData);
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

  // Update booth agent (JSON only - no files)
  updateAgent: async (
    id: number,
    data: Partial<BoothAgentFormData>
  ): Promise<ApiResponse<BoothAgent>> => {
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
  },

  // Update booth agent with files (FormData) - Hybrid approach
  updateAgentWithFiles: async (
    id: number,
    formData: FormData
  ): Promise<ApiResponse<BoothAgent>> => {
    // Log FormData for debugging
    console.log("🔍 API: Sending FormData to backend for update:");
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value, typeof value);
    }

    // Extract numeric fields and non-file fields to send as JSON
    const jsonData: Record<string, unknown> = {};
    const fileFormData = new FormData();
    let hasFiles = false;

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        // Keep files in FormData
        fileFormData.append(key, value);
        hasFiles = true;
        console.log(`📁 File field: ${key}`);
      } else if (key === "polling_center_id" || key === "booth_id") {
        // Convert numeric fields to actual numbers for JSON
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue > 0) {
          jsonData[key] = numValue; // Store as actual number
          console.log(
            `🔢 Numeric field: ${key} = ${numValue} (${typeof numValue})`
          );
        } else {
          console.log(`⚠️ Skipping invalid ${key}: ${value}`);
        }
      } else {
        // Add other fields to JSON
        if (value !== undefined && value !== null && value !== "") {
          jsonData[key] = value;
          console.log(`📝 Text field: ${key} = ${value}`);
        }
      }
    }

    // For updates, try the hybrid approach first, fallback to two-step if needed
    if (hasFiles && Object.keys(jsonData).length > 0) {
      // Try hybrid approach: JSON data + files in FormData
      fileFormData.append("data", JSON.stringify(jsonData));
      console.log("🔧 Sending hybrid FormData + JSON for update:", jsonData);

      try {
        const response = await axios.put(
          `${API_BASE_URL}${BASE_PATH}/update/${id}`,
          fileFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: getAuthToken(),
            },
          }
        );
        return response.data;
      } catch (error) {
        console.log("🔧 Hybrid approach failed, trying two-step update...");

        // Fallback: Update JSON data first, then files
        if (Object.keys(jsonData).length > 0) {
          await axios.put(
            `${API_BASE_URL}${BASE_PATH}/update/${id}`,
            jsonData,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: getAuthToken(),
              },
            }
          );
        }

        // Then update files
        const response = await axios.put(
          `${API_BASE_URL}${BASE_PATH}/update/${id}`,
          fileFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: getAuthToken(),
            },
          }
        );
        return response.data;
      }
    } else if (hasFiles) {
      // Only files, no other data
      console.log("🔧 Sending only files for update");
      const response = await axios.put(
        `${API_BASE_URL}${BASE_PATH}/update/${id}`,
        fileFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: getAuthToken(),
          },
        }
      );
      return response.data;
    } else {
      // No files, send as pure JSON
      console.log("🔧 No files, sending update as JSON:", jsonData);
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
