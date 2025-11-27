import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useCampaign } from "../hooks/useCampaign";
import type {
  CampaignFormData,
  HierarchySelection,
  StateHierarchyItem,
  AfterAssemblyHierarchyItem,
} from "../types/campaign-api";

// Validation schema
const campaignSchema = yup.object().shape({
  name: yup
    .string()
    .required("Campaign name is required")
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must not exceed 100 characters"),
  description: yup
    .string()
    .required("Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must not exceed 500 characters"),
  start_date: yup.string().required("Start date is required"),
  end_date: yup
    .string()
    .required("End date is required")
    .test("date-order", "End date must be after start date", function (value) {
      const { start_date } = this.parent;
      if (!start_date || !value) return true;
      return new Date(value) >= new Date(start_date);
    }),
  campaign_level: yup
    .string()
    .oneOf(["State", "District", "Assembly", "Block", "Mandal"])
    .required("Campaign level is required"),
});

interface CampaignFormProps {
  onSuccess?: (campaign: any) => void;
  onCancel?: () => void;
}

export const CampaignForm: React.FC<CampaignFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { createCampaign, getHierarchyData, loading, error } = useCampaign();

  const [hierarchyData, setHierarchyData] = useState<{
    stateHierarchy: StateHierarchyItem[];
    afterAssemblyHierarchy: AfterAssemblyHierarchyItem[];
  } | null>(null);

  const [selectedHierarchy, setSelectedHierarchy] = useState<
    HierarchySelection[]
  >([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(campaignSchema),
    defaultValues: {
      campaign_level: "State",
    },
  });

  const campaignLevel = watch("campaign_level");

  // Load hierarchy data when component mounts
  useEffect(() => {
    const loadHierarchy = async () => {
      setLoadingHierarchy(true);
      try {
        const data = await getHierarchyData();
        setHierarchyData(data);
      } catch (err) {
        console.error("Failed to load hierarchy data:", err);
      } finally {
        setLoadingHierarchy(false);
      }
    };

    loadHierarchy();
  }, [getHierarchyData]);

  // Reset hierarchy selections when campaign level changes
  useEffect(() => {
    setSelectedHierarchy([]);
  }, [campaignLevel]);

  const handleHierarchyToggle = (
    hierarchyType: "stateMasterData" | "afterAssemblyData",
    hierarchyId: number,
    isSelected: boolean
  ) => {
    setSelectedHierarchy((prev) => {
      if (isSelected) {
        // Add selection
        return [
          ...prev,
          {
            hierarchy_type: hierarchyType,
            hierarchy_id: hierarchyId,
            toggle_on: true,
          },
        ];
      } else {
        // Remove selection
        return prev.filter(
          (item) =>
            !(
              item.hierarchy_type === hierarchyType &&
              item.hierarchy_id === hierarchyId
            )
        );
      }
    });
  };

  const onSubmit = async (data: any) => {
    try {
      const formData: CampaignFormData = {
        ...data,
        hierarchy_selections: selectedHierarchy,
      };

      const campaign = await createCampaign(formData);

      // Reset form
      reset();
      setSelectedHierarchy([]);

      // Call success callback
      onSuccess?.(campaign);
    } catch (err) {
      console.error("Failed to create campaign:", err);
    }
  };

  const renderHierarchySelection = () => {
    if (!hierarchyData) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Select Target Areas</h3>

        {/* State Hierarchy */}
        <div>
          <h4 className="font-medium mb-2">State Hierarchy</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
            {hierarchyData.stateHierarchy.map((item) => {
              const isSelected = selectedHierarchy.some(
                (h) =>
                  h.hierarchy_type === "stateMasterData" &&
                  h.hierarchy_id === item.id
              );

              return (
                <label key={item.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) =>
                      handleHierarchyToggle(
                        "stateMasterData",
                        item.id,
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">
                    {item.levelName} ({item.levelType})
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* After Assembly Hierarchy */}
        {hierarchyData.afterAssemblyHierarchy.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">After Assembly Hierarchy</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
              {hierarchyData.afterAssemblyHierarchy.map((item) => {
                const isSelected = selectedHierarchy.some(
                  (h) =>
                    h.hierarchy_type === "afterAssemblyData" &&
                    h.hierarchy_id === item.id
                );

                return (
                  <label key={item.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) =>
                        handleHierarchyToggle(
                          "afterAssemblyData",
                          item.id,
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">
                      {item.displayName} ({item.display_level_name})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Create New Campaign</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Name *
          </label>
          <input
            {...register("name")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter campaign name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter campaign description"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Campaign Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Level *
          </label>
          <select
            {...register("campaign_level")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="State">State</option>
            <option value="District">District</option>
            <option value="Assembly">Assembly</option>
            <option value="Block">Block</option>
            <option value="Mandal">Mandal</option>
          </select>
          {errors.campaign_level && (
            <p className="mt-1 text-sm text-red-600">
              {errors.campaign_level.message}
            </p>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              {...register("start_date")}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.start_date && (
              <p className="mt-1 text-sm text-red-600">
                {errors.start_date.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              {...register("end_date")}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.end_date && (
              <p className="mt-1 text-sm text-red-600">
                {errors.end_date.message}
              </p>
            )}
          </div>
        </div>

        {/* Hierarchy Selection */}
        {loadingHierarchy ? (
          <div className="text-center py-4">Loading hierarchy data...</div>
        ) : (
          renderHierarchySelection()
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </form>
    </div>
  );
};
