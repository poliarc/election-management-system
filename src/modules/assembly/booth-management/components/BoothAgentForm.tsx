import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import type {
  BoothAgentFormData,
  BoothAgentCategory,
  BoothAgentRole,
  PollingCenter,
  Booth,
} from "../types";
import { boothAgentApi } from "../services/boothAgentApi";
import { useAppSelector } from "../../../../store/hooks";

interface BoothAgentFormProps {
  initialData?: Partial<BoothAgentFormData> & { agent_id?: number };
  onSuccess: () => void;
  onCancel: () => void;
}

const rolesByCategory: Record<BoothAgentCategory, BoothAgentRole[]> = {
  "Booth Inside Team": ["Booth Agent"],
  "Booth Outside Team": ["Table Coordinator", "Voter Field Coordination"],
  "Polling Center Support Team": [
    "Polling Center Incharge",
    "Water Incharge",
    "Food Incharge",
  ],
};

export const BoothAgentForm: React.FC<BoothAgentFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const isEditMode = !!initialData?.agent_id;
  const [loading, setLoading] = useState(false);
  const [pollingCenters, setPollingCenters] = useState<PollingCenter[]>([]);
  const [selectedBoothId, setSelectedBoothId] = useState<number | null>(null);
  const [availableBooths, setAvailableBooths] = useState<Booth[]>([]);
  // File upload states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [voterIdFile, setVoterIdFile] = useState<File | null>(null);
  // Preview URLs for existing images in edit mode
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aadharPreview, setAadharPreview] = useState<string | null>(null);
  const [voterIdPreview, setVoterIdPreview] = useState<string | null>(null);

  const { selectedAssignment } = useAppSelector((s) => s.auth);

  // Get assembly ID from selected assignment
  // For assembly-level: use stateMasterData_id (when levelType is 'Assembly')
  // For block-level: use parentAssemblyId or afterAssemblyData_id
  const assemblyId =
    selectedAssignment?.levelType === "Assembly"
      ? selectedAssignment?.stateMasterData_id
      : selectedAssignment?.parentAssemblyId ||
        selectedAssignment?.afterAssemblyData_id;

  // Form type that uses strings for HTML form compatibility
  type FormData = Omit<BoothAgentFormData, "polling_center_id" | "booth_id"> & {
    polling_center_id?: string;
    booth_id?: string;
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      android_phone: "No",
      laptop: "No",
      twoWheeler: "No",
      fourWheeler: "No",
      ...(initialData
        ? {
            ...initialData,
            polling_center_id: initialData.polling_center_id
              ? String(initialData.polling_center_id)
              : undefined,
            booth_id: initialData.booth_id
              ? String(initialData.booth_id)
              : undefined,
          }
        : {}),
    },
  });

  // Debug: Log the current form values
  const currentPollingCenterId = watch("polling_center_id");
  console.log("🔍 Current polling_center_id in form:", currentPollingCenterId);
  console.log(
    "🔍 Initial data polling_center_id:",
    initialData?.polling_center_id
  );
  console.log("🔍 Polling centers loaded:", pollingCenters.length);

  const category = watch("category");
  const pollingCenterId = watch("polling_center_id");

  // Fetch polling centers
  useEffect(() => {
    if (assemblyId) {
      boothAgentApi
        .getPollingCentersHierarchy(assemblyId)
        .then((res) => {
          setPollingCenters(res.data);
          toast.success(`Loaded ${res.data.length} polling centers`);

          // If in edit mode and we have initial data, reset the form to ensure proper values
          if (isEditMode && initialData) {
            console.log("🔄 Resetting form after polling centers loaded");
            const formData: Partial<FormData> = {
              android_phone: initialData.android_phone || "No",
              laptop: initialData.laptop || "No",
              twoWheeler: initialData.twoWheeler || "No",
              fourWheeler: initialData.fourWheeler || "No",
              category: initialData.category,
              role: initialData.role,
              name: initialData.name,
              father_name: initialData.father_name,
              phone: initialData.phone,
              alternate_no: initialData.alternate_no,
              email: initialData.email,
              address: initialData.address,
              password: initialData.password,
              polling_center_id: initialData.polling_center_id
                ? String(initialData.polling_center_id)
                : undefined,
              booth_id: initialData.booth_id
                ? String(initialData.booth_id)
                : undefined,
            };
            console.log("🔄 Form data for reset:", formData);
            reset(formData);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch polling centers:", err);
          toast.error("Failed to load polling centers");
        });
    }
  }, [assemblyId, isEditMode, initialData, reset]);

  // Update available booths when polling center changes
  useEffect(() => {
    if (pollingCenterId) {
      const pc = pollingCenters.find((p) => p.id === Number(pollingCenterId));
      const booths = pc?.booths || [];
      setAvailableBooths(booths);

      // Only reset selectedBoothId if not in edit mode or if booth doesn't exist in new polling center
      if (!isEditMode) {
        setSelectedBoothId(null);
      } else if (initialData?.booth_id) {
        const boothExists = booths.some(
          (booth) => booth.id === initialData.booth_id
        );
        if (!boothExists) {
          setSelectedBoothId(null);
        }
      }

      if (booths.length > 0) {
        toast.success(`Loaded ${booths.length} booths for ${pc?.displayName}`);
      } else {
        toast(`No booths found for ${pc?.displayName}`, {
          icon: "⚠️",
        });
      }
    } else {
      setAvailableBooths([]);
      if (!isEditMode) {
        setSelectedBoothId(null);
      }
    }
  }, [pollingCenterId, pollingCenters, isEditMode, initialData?.booth_id]);

  // Reset role when category changes (but not in edit mode with initial data)
  useEffect(() => {
    if (category && !isEditMode) {
      setValue("role", undefined as unknown as BoothAgentRole);
    }
  }, [category, setValue, isEditMode]);

  // Initialize form values in edit mode - wait for polling centers to load
  useEffect(() => {
    if (isEditMode && initialData && pollingCenters.length > 0) {
      console.log("🔧 Edit mode - initialData:", initialData);
      console.log("🔧 Available polling centers:", pollingCenters.length);

      // Set form values that might not be set by defaultValues
      if (initialData.category) {
        console.log("🔧 Setting category:", initialData.category);
        setValue("category", initialData.category);
      }
      if (initialData.role) {
        console.log("🔧 Setting role:", initialData.role);
        setValue("role", initialData.role);
      }
      if (initialData.polling_center_id) {
        console.log(
          "🔧 Setting polling center ID:",
          initialData.polling_center_id
        );

        // Explicitly set the polling center value as string
        setValue("polling_center_id", String(initialData.polling_center_id));

        // Find the polling center and load its booths
        const pc = pollingCenters.find(
          (p) => p.id === initialData.polling_center_id
        );
        if (pc) {
          console.log("🔧 Found polling center:", pc.displayName);
          setAvailableBooths(pc.booths || []);

          // Set booth selection if booth_id exists
          if (initialData.booth_id) {
            console.log("🔧 Setting booth ID:", initialData.booth_id);
            setSelectedBoothId(initialData.booth_id);
          }
        }
      } else if (initialData.booth_id) {
        // If booth_id exists but no polling_center_id, still try to set it
        console.log(
          "🔧 Setting booth ID (no polling center):",
          initialData.booth_id
        );
        setSelectedBoothId(initialData.booth_id);
      }
    }
  }, [isEditMode, initialData, setValue, pollingCenters]);

  // Set existing image previews in edit mode - separate effect to ensure it runs
  useEffect(() => {
    if (isEditMode && initialData) {
      console.log("🖼️ Setting up image previews for edit mode");
      console.log("🖼️ Photo:", initialData.photo);
      console.log("🖼️ Aadhar:", initialData.aadhar_card);
      console.log("🖼️ Voter ID:", initialData.voter_id_file);

      // Helper function to construct full image URL
      const getImageUrl = (imagePath: string | undefined) => {
        if (!imagePath) return null;

        // If it's already a full URL (starts with http), return as is
        if (imagePath.startsWith("http")) {
          return imagePath;
        }

        // If it's a data URL (base64), return as is
        if (imagePath.startsWith("data:")) {
          return imagePath;
        }

        // If it's a relative path, construct full URL
        const baseUrl =
          import.meta.env.VITE_API_BASE_URL || window.location.origin;
        // Remove leading slash if present to avoid double slashes
        const cleanPath = imagePath.startsWith("/")
          ? imagePath.slice(1)
          : imagePath;
        const fullUrl = `${baseUrl}/${cleanPath}`;

        console.log("🔗 Constructed image URL:", {
          imagePath,
          baseUrl,
          fullUrl,
        });
        return fullUrl;
      };

      // Set existing image previews in edit mode
      if (initialData.photo && typeof initialData.photo === "string") {
        const photoUrl = getImageUrl(initialData.photo);
        console.log("🖼️ Setting photo preview:", photoUrl);
        setPhotoPreview(photoUrl);
      }

      if (
        initialData.aadhar_card &&
        typeof initialData.aadhar_card === "string"
      ) {
        const aadharUrl = getImageUrl(initialData.aadhar_card);
        console.log("🖼️ Setting aadhar preview:", aadharUrl);
        setAadharPreview(aadharUrl);
      }

      if (
        initialData.voter_id_file &&
        typeof initialData.voter_id_file === "string"
      ) {
        const voterIdUrl = getImageUrl(initialData.voter_id_file);
        console.log("🖼️ Setting voter ID preview:", voterIdUrl);
        setVoterIdPreview(voterIdUrl);
      }
    }
  }, [isEditMode, initialData]);

  // Initialize form values in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      // Set booth selection if booth_id exists
      if (initialData.booth_id) {
        setSelectedBoothId(initialData.booth_id);
      }

      // Set form values that might not be set by defaultValues
      if (initialData.category) {
        setValue("category", initialData.category);
      }
      if (initialData.role) {
        setValue("role", initialData.role);
      }
    }
  }, [isEditMode, initialData, setValue]);

  const onSubmit = async (data: Record<string, unknown>) => {
    setLoading(true);

    // Show loading toast
    const loadingToast = toast.loading(
      isEditMode ? "Updating booth agent..." : "Creating booth agent..."
    );

    try {
      // Check if we have any files to upload
      const hasFiles = photoFile || aadharFile || voterIdFile;

      console.log("🔍 File upload check:", {
        hasFiles,
        photoFile: !!photoFile,
        aadharFile: !!aadharFile,
        voterIdFile: !!voterIdFile,
      });

      if (hasFiles) {
        // Use FormData for file uploads
        const formData = new FormData();

        // Add text fields
        formData.append("category", data.category as string);
        formData.append("role", data.role as string);
        formData.append("name", data.name as string);
        formData.append("phone", data.phone as string);

        // Add optional string fields
        if (data.father_name)
          formData.append("father_name", data.father_name as string);
        if (data.alternate_no)
          formData.append("alternate_no", data.alternate_no as string);
        if (data.email) formData.append("email", data.email as string);
        if (data.address) formData.append("address", data.address as string);
        if (data.password) formData.append("password", data.password as string);

        // Add optional enum fields
        if (data.android_phone)
          formData.append("android_phone", data.android_phone as string);
        if (data.laptop) formData.append("laptop", data.laptop as string);
        if (data.twoWheeler)
          formData.append("twoWheeler", data.twoWheeler as string);
        if (data.fourWheeler)
          formData.append("fourWheeler", data.fourWheeler as string);

        // Add polling_center_id if valid - ensure it's a clean integer string
        if (
          data.polling_center_id &&
          data.polling_center_id !== "" &&
          data.polling_center_id !== "0"
        ) {
          const pcId = parseInt(String(data.polling_center_id), 10);
          if (!isNaN(pcId) && pcId > 0) {
            console.log(
              "🔍 Adding polling_center_id:",
              pcId,
              "as string:",
              pcId.toString()
            );
            formData.append("polling_center_id", pcId.toString());
          } else {
            console.warn(
              "⚠️ Invalid polling_center_id:",
              data.polling_center_id
            );
          }
        } else {
          console.log("🔍 No polling_center_id to add");
        }

        // Add booth_id if valid - ensure it's a clean integer string
        if (selectedBoothId !== null && selectedBoothId > 0) {
          const boothId = parseInt(String(selectedBoothId), 10);
          if (!isNaN(boothId) && boothId > 0) {
            console.log(
              "🔍 Adding booth_id:",
              boothId,
              "as string:",
              boothId.toString()
            );
            formData.append("booth_id", boothId.toString());
          } else {
            console.warn("⚠️ Invalid booth_id:", selectedBoothId);
          }
        } else {
          console.log("🔍 No booth_id to add");
        }

        // Add files
        if (photoFile) {
          formData.append("photo", photoFile);
        }
        if (aadharFile) {
          formData.append("aadhar_card", aadharFile);
        }
        if (voterIdFile) {
          formData.append("voter_id_file", voterIdFile);
        }

        console.log("📤 FormData being sent with files");

        // Log FormData contents for debugging
        console.log("📤 FormData contents:");
        for (const [key, value] of formData.entries()) {
          console.log(`  ${key}:`, value, typeof value);
        }

        if (isEditMode && initialData?.agent_id) {
          await boothAgentApi.updateAgentWithFiles(
            initialData.agent_id,
            formData
          );
          toast.dismiss(loadingToast);
          toast.success("Booth agent updated successfully!");
        } else {
          await boothAgentApi.createAgentWithFiles(formData);
          toast.dismiss(loadingToast);
          toast.success("Booth agent created successfully!");
        }
      } else {
        // No files - use JSON payload
        const payload: Partial<BoothAgentFormData> = {
          category: data.category as BoothAgentCategory,
          role: data.role as BoothAgentRole,
          name: data.name as string,
          phone: data.phone as string,
        };

        // Add optional string fields
        if (data.father_name) payload.father_name = data.father_name as string;
        if (data.alternate_no)
          payload.alternate_no = data.alternate_no as string;
        if (data.email) payload.email = data.email as string;
        if (data.address) payload.address = data.address as string;
        if (data.password) payload.password = data.password as string;

        // Add optional enum fields
        if (data.android_phone)
          payload.android_phone = data.android_phone as "Yes" | "No";
        if (data.laptop) payload.laptop = data.laptop as "Yes" | "No";
        if (data.twoWheeler)
          payload.twoWheeler = data.twoWheeler as "Yes" | "No";
        if (data.fourWheeler)
          payload.fourWheeler = data.fourWheeler as "Yes" | "No";

        // Only add polling_center_id if it's a valid number
        if (data.polling_center_id && data.polling_center_id !== "") {
          const pcId = Number(data.polling_center_id);
          if (!isNaN(pcId) && pcId > 0) {
            payload.polling_center_id = pcId;
          }
        }

        // Only add booth_id if it's a valid number
        if (selectedBoothId !== null && selectedBoothId > 0) {
          payload.booth_id = selectedBoothId;
        }

        console.log("📤 JSON Payload being sent:", payload);
        console.log("📤 Payload types:", {
          polling_center_id: typeof payload.polling_center_id,
          booth_id: typeof payload.booth_id,
          polling_center_id_value: payload.polling_center_id,
          booth_id_value: payload.booth_id,
        });

        if (isEditMode && initialData?.agent_id) {
          await boothAgentApi.updateAgent(initialData.agent_id, payload);
          toast.dismiss(loadingToast);
          toast.success("Booth agent updated successfully!");
        } else {
          await boothAgentApi.createAgent(payload as BoothAgentFormData);
          toast.dismiss(loadingToast);
          toast.success("Booth agent created successfully!");
        }
      }

      // Reset file states on success
      resetFileStates();
      onSuccess();
    } catch (error: unknown) {
      const err = error as {
        response?: {
          data?: {
            error?: {
              message?: string;
              details?: Array<{ path: string; message: string }>;
            };
            success?: boolean;
            message?: string;
          };
        };
      };
      console.error("❌ Failed to save agent:", error);
      console.error("❌ Error response:", err.response?.data);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      const errorMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        (isEditMode ? "Failed to update agent" : "Failed to create agent");

      const errorDetails = err.response?.data?.error?.details;

      if (errorDetails && Array.isArray(errorDetails)) {
        // Show validation errors as individual toasts
        errorDetails.forEach((detail) => {
          toast.error(`${detail.path}: ${detail.message}`);
        });
        toast.error(errorMessage);
      } else {
        // Show general error message
        toast.error(errorMessage);
      }

      if (errorDetails) {
        console.error("❌ Validation details:", errorDetails);
      }
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === "object" && "message" in error) {
      return String(error.message);
    }
    return "";
  };

  // File handling functions
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: "photo" | "aadhar" | "voterId"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      event.target.value = ""; // Clear the input
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (fileType === "aadhar" || fileType === "voterId") {
      allowedTypes.push("application/pdf");
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPG, PNG, GIF) or PDF");
      event.target.value = ""; // Clear the input
      return;
    }

    // Set file and create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;

      switch (fileType) {
        case "photo":
          setPhotoFile(file);
          setPhotoPreview(result);
          break;
        case "aadhar":
          setAadharFile(file);
          setAadharPreview(result);
          break;
        case "voterId":
          setVoterIdFile(file);
          setVoterIdPreview(result);
          break;
      }
    };

    reader.onerror = () => {
      toast.error("Error reading file. Please try again.");
      event.target.value = ""; // Clear the input
    };

    reader.readAsDataURL(file);
  };

  const removeFile = (fileType: "photo" | "aadhar" | "voterId") => {
    switch (fileType) {
      case "photo":
        setPhotoFile(null);
        setPhotoPreview(null);
        console.log("🗑️ Removed photo file and preview");
        break;
      case "aadhar":
        setAadharFile(null);
        setAadharPreview(null);
        console.log("🗑️ Removed aadhar file and preview");
        break;
      case "voterId":
        setVoterIdFile(null);
        setVoterIdPreview(null);
        console.log("🗑️ Removed voter ID file and preview");
        break;
    }
  };

  const resetFileStates = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setAadharFile(null);
    setAadharPreview(null);
    setVoterIdFile(null);
    setVoterIdPreview(null);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <select
            {...register("category", { required: "Category is required" })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Select Category</option>
            <option value="Booth Inside Team">Booth Inside Team</option>
            <option value="Booth Outside Team">Booth Outside Team</option>
            <option value="Polling Center Support Team">
              Polling Center Support Team
            </option>
          </select>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage(errors.category)}
            </p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium mb-1">Role *</label>
          <select
            {...register("role", { required: "Role is required" })}
            disabled={!category}
            className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
          >
            <option value="">Select Role</option>
            {category &&
              rolesByCategory[category as BoothAgentCategory]?.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
          </select>
          {errors.role && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage(errors.role)}
            </p>
          )}
        </div>

        {/* Polling Center */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Polling Center (Optional)
          </label>
          <select
            {...register("polling_center_id")}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Select Polling Center</option>
            {pollingCenters.map((pc) => (
              <option key={pc.id} value={String(pc.id)}>
                {pc.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Booth Selection - Show for Inside and Outside teams only */}
        {category !== "Polling Center Support Team" && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Booth No (Optional)
            </label>
            <select
              value={selectedBoothId || ""}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedBoothId(value ? Number(value) : null);
              }}
              disabled={!pollingCenterId || availableBooths.length === 0}
              className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">
                {pollingCenterId
                  ? availableBooths.length > 0
                    ? "Select Booth"
                    : "No booths available"
                  : "Select polling center first"}
              </option>
              {availableBooths.map((booth) => (
                <option key={booth.id} value={booth.id}>
                  {booth.displayName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            {...register("name", { required: "Name is required" })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage(errors.name)}
            </p>
          )}
        </div>

        {/* Father Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Father Name</label>
          <input
            {...register("father_name")}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter father name"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1">Phone *</label>
          <input
            {...register("phone", {
              required: "Phone is required",
              pattern: {
                value: /^\d{10}$/,
                message: "Phone must be 10 digits",
              },
            })}
            maxLength={10}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter phone number"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage(errors.phone)}
            </p>
          )}
        </div>

        {/* Alternate Phone */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Alternate Phone
          </label>
          <input
            {...register("alternate_no", {
              pattern: {
                value: /^\d{10}$/,
                message: "Alternate number must be 10 digits",
              },
            })}
            maxLength={10}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter alternate number"
          />
          {errors.alternate_no && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage(errors.alternate_no)}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            {...register("email", {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email",
              },
            })}
            type="email"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter email"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage(errors.email)}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Password {!isEditMode && "*"}
          </label>
          <input
            {...register("password", {
              required: isEditMode ? false : "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters",
              },
              validate: (value) => {
                if (!value && isEditMode) return true; // Skip validation in edit mode if empty
                if (!value) return "Password is required";

                const hasUpperCase = /[A-Z]/.test(value);
                const hasLowerCase = /[a-z]/.test(value);
                const hasNumber = /[0-9]/.test(value);
                const hasSpecialChar = /[@$_\-*#]/.test(value);

                if (!hasUpperCase)
                  return "Password must contain at least one uppercase letter";
                if (!hasLowerCase)
                  return "Password must contain at least one lowercase letter";
                if (!hasNumber)
                  return "Password must contain at least one number";
                if (!hasSpecialChar)
                  return "Password must contain at least one special character (@$_-*#)";

                return true;
              },
            })}
            type="password"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder={
              isEditMode ? "Leave blank to keep current" : "Enter password"
            }
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {getErrorMessage(errors.password)}
            </p>
          )}
          {!isEditMode && (
            <p className="text-xs text-gray-500 mt-1">
              Must contain uppercase, lowercase, number, and special character
              (@$_-*#)
            </p>
          )}
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Address</label>
          <textarea
            {...register("address")}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter address"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "photo")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          {photoPreview && (
            <div className="mt-2">
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Photo preview"
                  className="w-20 h-20 object-cover rounded border"
                  onError={() => {
                    console.error("Failed to load photo:", photoPreview);
                    // If image fails to load, remove the preview
                    setPhotoPreview(null);
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeFile("photo")}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  title="Remove photo"
                >
                  ×
                </button>
              </div>
              <div className="mt-1">
                {photoFile ? (
                  <p className="text-xs text-green-600 truncate max-w-32">
                    New: {photoFile.name}
                  </p>
                ) : (
                  <p className="text-xs text-blue-600">Current photo</p>
                )}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Max 5MB. Supported: JPG, PNG, GIF
          </p>
        </div>

        {/* Aadhar Card Upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Aadhar Card</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileChange(e, "aadhar")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          {aadharPreview && (
            <div className="mt-2">
              <div className="relative inline-block">
                {aadharFile?.type === "application/pdf" ||
                aadharPreview.includes(".pdf") ? (
                  <div className="w-20 h-20 bg-gray-100 border rounded flex items-center justify-center">
                    <span className="text-xs text-gray-600">PDF</span>
                  </div>
                ) : (
                  <img
                    src={aadharPreview}
                    alt="Aadhar preview"
                    className="w-20 h-20 object-cover rounded border"
                    onError={() => {
                      console.error(
                        "Failed to load aadhar image:",
                        aadharPreview
                      );
                      setAadharPreview(null);
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeFile("aadhar")}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  title="Remove aadhar card"
                >
                  ×
                </button>
              </div>
              <div className="mt-1">
                {aadharFile ? (
                  <p className="text-xs text-green-600 truncate max-w-32">
                    New: {aadharFile.name}
                  </p>
                ) : (
                  <p className="text-xs text-blue-600">Current aadhar card</p>
                )}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Max 5MB. Supported: JPG, PNG, GIF, PDF
          </p>
        </div>

        {/* Voter ID Card Upload */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Voter ID Card
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileChange(e, "voterId")}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          {voterIdPreview && (
            <div className="mt-2">
              <div className="relative inline-block">
                {voterIdFile?.type === "application/pdf" ||
                voterIdPreview.includes(".pdf") ? (
                  <div className="w-20 h-20 bg-gray-100 border rounded flex items-center justify-center">
                    <span className="text-xs text-gray-600">PDF</span>
                  </div>
                ) : (
                  <img
                    src={voterIdPreview}
                    alt="Voter ID preview"
                    className="w-20 h-20 object-cover rounded border"
                    onError={() => {
                      console.error(
                        "Failed to load voter ID image:",
                        voterIdPreview
                      );
                      setVoterIdPreview(null);
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeFile("voterId")}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  title="Remove voter ID card"
                >
                  ×
                </button>
              </div>
              <div className="mt-1">
                {voterIdFile ? (
                  <p className="text-xs text-green-600 truncate max-w-32">
                    New: {voterIdFile.name}
                  </p>
                ) : (
                  <p className="text-xs text-blue-600">Current voter ID card</p>
                )}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Max 5MB. Supported: JPG, PNG, GIF, PDF
          </p>
        </div>

        {/* Android Phone */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Android Phone
          </label>
          <select
            {...register("android_phone")}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>

        {/* Laptop */}
        <div>
          <label className="block text-sm font-medium mb-1">Laptop</label>
          <select
            {...register("laptop")}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>

        {/* Two Wheeler */}
        <div>
          <label className="block text-sm font-medium mb-1">Two Wheeler</label>
          <select
            {...register("twoWheeler")}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>

        {/* Four Wheeler */}
        <div>
          <label className="block text-sm font-medium mb-1">Four Wheeler</label>
          <select
            {...register("fourWheeler")}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={() => {
            resetFileStates();
            toast("Form cancelled", {
              icon: "ℹ️",
            });
            onCancel();
          }}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : isEditMode ? "Update Agent" : "Create Agent"}
        </button>
      </div>
    </form>
  );
};
