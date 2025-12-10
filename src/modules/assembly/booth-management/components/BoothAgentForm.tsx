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
  // File upload states temporarily disabled
  // const [photoFile, setPhotoFile] = useState<File | null>(null);
  // const [aadharFile, setAadharFile] = useState<File | null>(null);
  // const [voterIdFile, setVoterIdFile] = useState<File | null>(null);

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
      // Build properly typed payload
      const payload: Partial<BoothAgentFormData> = {
        category: data.category as BoothAgentCategory,
        role: data.role as BoothAgentRole,
        name: data.name as string,
        phone: data.phone as string,
      };

      // Add optional string fields
      if (data.father_name) payload.father_name = data.father_name as string;
      if (data.alternate_no) payload.alternate_no = data.alternate_no as string;
      if (data.email) payload.email = data.email as string;
      if (data.address) payload.address = data.address as string;
      if (data.password) payload.password = data.password as string;

      // Add optional enum fields
      if (data.android_phone)
        payload.android_phone = data.android_phone as "Yes" | "No";
      if (data.laptop) payload.laptop = data.laptop as "Yes" | "No";
      if (data.twoWheeler) payload.twoWheeler = data.twoWheeler as "Yes" | "No";
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

      console.log("📤 Payload being sent:", payload);
      console.log("📤 Types:", {
        polling_center_id: typeof payload.polling_center_id,
        booth_id: typeof payload.booth_id,
      });

      // File uploads temporarily disabled
      // TODO: Re-enable file uploads after fixing FormData type conversion

      if (isEditMode && initialData?.agent_id) {
        await boothAgentApi.updateAgent(initialData.agent_id, payload);
        toast.dismiss(loadingToast);
        toast.success("Booth agent updated successfully!");
      } else {
        await boothAgentApi.createAgent(payload as BoothAgentFormData);
        toast.dismiss(loadingToast);
        toast.success("Booth agent created successfully!");
      }

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

        {/* Photo Upload - Temporarily Disabled */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Photo (Temporarily Disabled)
          </label>
          <input
            type="file"
            accept="image/*"
            disabled
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-orange-600 mt-1">
            File uploads temporarily disabled while fixing API issues
          </p>
        </div>

        {/* Aadhar Card Upload - Temporarily Disabled */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Aadhar Card (Temporarily Disabled)
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            disabled
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-orange-600 mt-1">
            File uploads temporarily disabled while fixing API issues
          </p>
        </div>

        {/* Voter ID Card Upload - Temporarily Disabled */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Voter ID Card (Temporarily Disabled)
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            disabled
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-orange-600 mt-1">
            File uploads temporarily disabled while fixing API issues
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
