// Banner Images API Service

export interface BannerImage {
  id: number;
  userId: number;
  userName: string;
  assemblyId: number;
  assemblyName: string;
  webBannerImage: string | null;
  appBannerImage: string | null;
  partyId: number;
  createdAt: string;
  updatedAt: string;
}

export interface BannerImagesResponse {
  success: boolean;
  message: string;
  data: {
    assemblyId: number;
    totalImages: number;
    images: BannerImage[];
  };
}

export interface UploadBannerResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    imageUrl: string;
    imageType: "web" | "app";
    assemblyId: number;
    userId: number;
    partyId: number;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Get authorization header
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
});

/**
 * Fetch banner images for a specific assembly
 */
export const fetchBannerImages = async (assemblyId: number): Promise<BannerImagesResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/user-state-hierarchies/banner-images/${assemblyId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Fetch banner images for a specific assembly with user access check
 */
export const fetchBannerImagesWithUserCheck = async (
  assemblyId: number,
  userId: number
): Promise<BannerImagesResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/user-state-hierarchies/banner-images/${assemblyId}/${userId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Upload a banner image
 */
export const uploadBannerImage = async (
  file: File,
  imageType: "web" | "app",
  userStateHierarchyId: number
): Promise<UploadBannerResponse> => {
  const formData = new FormData();
  formData.append("bannerImage", file);
  formData.append("imageType", imageType);
  formData.append("userStateHierarchyId", userStateHierarchyId.toString());

  const response = await fetch(
    `${API_BASE_URL}/api/user-state-hierarchies/upload-banner-image`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Validate file before upload
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Please select a valid image file (JPEG, PNG, GIF, WebP)",
    };
  }

  // Check file size (50MB max)
  const maxSize = 50 * 1024 * 1024; // 50MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size must be less than 50MB",
    };
  }

  return { isValid: true };
};