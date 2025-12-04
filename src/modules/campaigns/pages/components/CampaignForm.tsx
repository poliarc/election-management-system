import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Send, Plus, X } from "lucide-react";
import React from "react";
import toast from "react-hot-toast";
import campaignApi from "../../../../services/campaignApi";
import type {
  AfterAssemblyHierarchyNode,
  CampaignHierarchyResponse,
  CampaignHierarchySelection,
  CampaignHierarchyScopeSelection,
  StateHierarchyNode,
} from "../../../../types/campaign";
import { storage } from "../../../../utils/storage";
import {
  campaignSchema,
  type CampaignFormData,
} from "../../../../schemas/campaignSchema";
import type { Campaign } from "../../../../types/campaign";

interface CampaignFormProps {
  onSubmit: (data: CampaignFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Campaign>;
}

type SelectorState = {
  district_ids: string[];
  assembly_ids: string[];
  assembly_child_ids: string[]; // First level after assembly
  level2_ids: string[]; // Second level (children of assembly_child)
  level3_ids: string[]; // Third level (children of level2)
  level4_ids: string[]; // Fourth level (children of level3)
  // Legacy fields for backward compatibility
  block_ids: string[];
  mandal_ids: string[];
  booth_ids: string[];
  autoInclude: boolean;
  districtOpen: boolean;
  assemblyOpen: boolean;
  assemblyChildOpen: boolean; // First level after assembly
  level2Open: boolean; // Second level
  level3Open: boolean; // Third level
  level4Open: boolean; // Fourth level
  // Legacy dropdown states
  blockOpen: boolean;
  mandalOpen: boolean;
  boothOpen: boolean;
};

const createEmptySelector = (): SelectorState => ({
  district_ids: [],
  assembly_ids: [],
  assembly_child_ids: [],
  level2_ids: [],
  level3_ids: [],
  level4_ids: [],
  // Legacy fields
  block_ids: [],
  mandal_ids: [],
  booth_ids: [],
  autoInclude: false,
  districtOpen: false,
  assemblyOpen: false,
  assemblyChildOpen: false,
  level2Open: false,
  level3Open: false,
  level4Open: false,
  // Legacy dropdown states
  blockOpen: false,
  mandalOpen: false,
  boothOpen: false,
});

const convertHierarchySelectionsToSelectors = (
  selections?: CampaignHierarchyScopeSelection[],
  afterAssemblyHierarchy?: AfterAssemblyHierarchyNode[]
): SelectorState[] => {
  if (!selections || selections.length === 0) {
    return [createEmptySelector()];
  }

  const selector = createEmptySelector();
  const pushIfMissing = (bucket: string[], value: string) => {
    if (!bucket.includes(value)) {
      bucket.push(value);
    }
  };

  // Helper to determine depth of a node in afterAssemblyHierarchy
  const getNodeDepth = (nodeId: number): number => {
    if (!afterAssemblyHierarchy) return -1;

    const node = afterAssemblyHierarchy.find((n) => n.id === nodeId);
    if (!node) return -1;

    // If parentId is null, it's depth 0 (first level after assembly)
    if (node.parentId === null) return 0;

    // Otherwise, find parent and add 1
    const parentDepth = getNodeDepth(node.parentId);
    return parentDepth >= 0 ? parentDepth + 1 : -1;
  };

  selections.forEach((selection) => {
    if (
      selection?.hierarchy_id === undefined ||
      selection.hierarchy_id === null
    ) {
      return;
    }

    const idString = String(selection.hierarchy_id);
    const normalizedLevel = selection.hierarchy_level_type
      ? selection.hierarchy_level_type.replace(/\s+/g, "_").toUpperCase()
      : null;

    // Handle stateMasterData (District, Assembly)
    if (selection.hierarchy_type === "stateMasterData") {
      switch (normalizedLevel) {
        case "DISTRICT":
          pushIfMissing(selector.district_ids, idString);
          break;
        case "ASSEMBLY":
          pushIfMissing(selector.assembly_ids, idString);
          break;
        default:
          // Fallback: if no level type, assume district
          pushIfMissing(selector.district_ids, idString);
      }
    }
    // Handle afterAssemblyData (Mandal, Block, PollingCenter, etc.)
    else if (selection.hierarchy_type === "afterAssemblyData") {
      // Determine depth to populate correct dynamic field
      const depth = getNodeDepth(selection.hierarchy_id);

      if (depth === 0) {
        // First level after assembly
        pushIfMissing(selector.assembly_child_ids, idString);
      } else if (depth === 1) {
        // Second level
        pushIfMissing(selector.level2_ids, idString);
      } else if (depth === 2) {
        // Third level
        pushIfMissing(selector.level3_ids, idString);
      } else if (depth === 3) {
        // Fourth level
        pushIfMissing(selector.level4_ids, idString);
      }

      // Also populate legacy fields for backward compatibility
      switch (normalizedLevel) {
        case "BLOCK":
          pushIfMissing(selector.block_ids, idString);
          break;
        case "MANDAL":
          pushIfMissing(selector.mandal_ids, idString);
          break;
        case "POLLING_CENTER":
        case "POLLINGCENTER":
        case "POLLING_CENTRE":
        case "POLLINGCENTRE":
        case "BOOTH":
          pushIfMissing(selector.booth_ids, idString);
          break;
      }
    }

    const toggleValue =
      typeof selection.toggle_on === "number"
        ? selection.toggle_on === 1
        : Boolean(selection.toggle_on);
    if (toggleValue) {
      selector.autoInclude = true;
    }
  });

  return [selector];
};

export const CampaignForm = ({
  onSubmit,
  onCancel,
  initialData,
}: CampaignFormProps) => {
  const [selectedImages, setSelectedImages] = React.useState<Array<File>>([]);
  const [imagePreviews, setImagePreviews] = React.useState<Array<string>>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Cascading dropdown states - Multi-selector support
  const maxSelectors = 5;
  const [districtSelectors, setDistrictSelectors] = React.useState<
    SelectorState[]
  >([createEmptySelector()]);

  // Dynamic data from API for District and Assembly
  const [stateId, setStateId] = React.useState<number | null>(null);
  const [partyId, setPartyId] = React.useState<number | null>(null);
  const [campaignLevel, setCampaignLevel] = React.useState<string>("State");
  const [hierarchy, setHierarchy] = React.useState<
    CampaignHierarchyResponse["data"] | null
  >(null);
  const [loadingHierarchy, setLoadingHierarchy] = React.useState(false);
  const [hierarchyError, setHierarchyError] = React.useState<string | null>(
    null
  );

  // Get user's current level type from localStorage
  const [userLevelType, setUserLevelType] = React.useState<string>("State");
  const [userParentId, setUserParentId] = React.useState<number | null>(null);
  const [actualStateIdForApi, setActualStateIdForApi] = React.useState<
    number | null
  >(null);

  React.useEffect(() => {
    // Read localStorage auth_state using storage helper
    const auth = storage.getAuthState<{
      selectedAssignment?: {
        stateMasterData_id?: number;
        levelType?: string;
        parentId?: number;
        stateId?: number; // Some assignments might have this
      };
      user?: { partyId?: number };
    }>();
    const sId: number | null =
      auth?.selectedAssignment?.stateMasterData_id ?? null;
    const pId: number | null = auth?.user?.partyId ?? null;
    const levelType = auth?.selectedAssignment?.levelType ?? "State";
    const parentId = auth?.selectedAssignment?.parentId ?? null;

    // Determine the actual state ID for API calls
    let apiStateId = sId;
    if (levelType === "District" && parentId !== null) {
      // For District users, parentId is the state ID
      apiStateId = parentId;
    } else if (levelType === "Assembly" && parentId !== null) {
      // For Assembly users, parentId is the district ID
      // We need to fetch the district's parent (state ID)
      // First, try to get it from stored stateId
      if (auth?.selectedAssignment?.stateId) {
        apiStateId = auth.selectedAssignment.stateId;
      } else {
        // If not stored, we'll need to fetch it
        // For now, use parentId and we'll handle it in a separate effect
        apiStateId = parentId;
      }
    }

    setStateId(sId);
    setPartyId(pId);
    setCampaignLevel(levelType);
    setUserLevelType(levelType);
    setUserParentId(parentId);
    setActualStateIdForApi(apiStateId);
  }, []);

  // For Assembly users, if actualStateIdForApi is a district ID, fetch its parent (state ID)
  React.useEffect(() => {
    if (
      userLevelType === "Assembly" &&
      actualStateIdForApi &&
      userParentId &&
      actualStateIdForApi === userParentId
    ) {
      // actualStateIdForApi is the district ID, we need to find the state ID
      // We'll fetch a minimal hierarchy to get the district's parent
      campaignApi
        .fetchHierarchy(actualStateIdForApi, partyId!)
        .then((res) => {
          // Find the district in the hierarchy and get its parent (state)
          const district = res.data.stateHierarchy.find(
            (n) => n.id === actualStateIdForApi && n.levelType === "District"
          );
          if (district && district.ParentId) {
            setActualStateIdForApi(district.ParentId);
          }
        })
        .catch((e) => {
          console.error("Failed to fetch district parent:", e);
        });
    }
  }, [userLevelType, actualStateIdForApi, userParentId, partyId]);

  React.useEffect(() => {
    if (!actualStateIdForApi || !partyId) return;

    setLoadingHierarchy(true);
    setHierarchyError(null);
    campaignApi
      .fetchHierarchy(actualStateIdForApi, partyId)
      .then((res) => setHierarchy(res.data))
      .catch((e) => setHierarchyError(e?.message ?? "Failed to load hierarchy"))
      .finally(() => setLoadingHierarchy(false));
  }, [actualStateIdForApi, partyId]);

  const stateHierarchy = React.useMemo(
    () => hierarchy?.stateHierarchy ?? [],
    [hierarchy]
  );
  const districtsData = React.useMemo(() => {
    // For District-level users, we need to fetch districts under the parent state (parentId)
    // For State-level users, fetch districts under their state (stateId)
    const parentStateId =
      userLevelType === "District" && userParentId !== null
        ? userParentId
        : stateId;

    const allDistricts = stateHierarchy.filter(
      (n) => n.levelType === "District" && n.ParentId === parentStateId
    );

    // If user is at District level, only show their own district (stateMasterData_id)
    if (userLevelType === "District" && stateId !== null) {
      return allDistricts.filter((n) => n.id === stateId);
    }

    return allDistricts;
  }, [stateHierarchy, stateId, userLevelType, userParentId]);
  // Auto-select district for District-level users
  React.useEffect(() => {
    if (
      userLevelType === "District" &&
      stateId !== null &&
      districtsData.length > 0
    ) {
      setDistrictSelectors((prev) => {
        // Check if district is not already selected
        const currentDistrictIds = prev[0]?.district_ids || [];
        if (currentDistrictIds.length === 0) {
          // Auto-select the user's district (stateMasterData_id)
          return [
            {
              ...prev[0],
              district_ids: [String(stateId)],
            },
          ];
        }
        return prev;
      });
    }
  }, [userLevelType, stateId, districtsData]);

  const assembliesByDistrict = React.useCallback(
    (districtId: string) =>
      stateHierarchy.filter(
        (n) => n.levelType === "Assembly" && n.ParentId === Number(districtId)
      ),
    [stateHierarchy]
  );

  // After-assembly chaining derived dynamically from API response
  const afterAssemblyHierarchy = React.useMemo(
    () => hierarchy?.afterAssemblyHierarchy ?? [],
    [hierarchy]
  );

  // Get first level children of assembly (parentAssemblyId match, parentId is null)
  const getAssemblyChildren = React.useCallback(
    (assemblyId: string) =>
      afterAssemblyHierarchy.filter((node) => {
        return (
          node.parentAssemblyId === Number(assemblyId) && node.parentId === null
        );
      }),
    [afterAssemblyHierarchy]
  );

  // Get children of a specific parent node (parentId match)
  const getNodeChildren = React.useCallback(
    (parentId: string) =>
      afterAssemblyHierarchy.filter((node) => {
        return node.parentId === Number(parentId);
      }),
    [afterAssemblyHierarchy]
  );

  // Get dynamic hierarchy levels and their labels
  const hierarchyLevels = React.useMemo(() => {
    if (!afterAssemblyHierarchy.length) {
      return [];
    }

    const nodeMap = new Map<number, AfterAssemblyHierarchyNode>();
    afterAssemblyHierarchy.forEach((node) => nodeMap.set(node.id, node));

    const depthMap = new Map<number, number>();
    const labelMap = new Map<number, string>();

    const getDepth = (node: AfterAssemblyHierarchyNode): number => {
      if (depthMap.has(node.id)) {
        return depthMap.get(node.id)!;
      }

      if (node.parentId === null) {
        depthMap.set(node.id, 0);
        if (!labelMap.has(0) && node.levelName) {
          labelMap.set(0, node.levelName);
        }
        return 0;
      }

      const parentNode = node.parentId ? nodeMap.get(node.parentId) : undefined;
      const parentDepth = parentNode ? getDepth(parentNode) : 0;
      const depth = parentDepth + 1;
      depthMap.set(node.id, depth);
      if (!labelMap.has(depth) && node.levelName) {
        labelMap.set(depth, node.levelName);
      }
      return depth;
    };

    afterAssemblyHierarchy.forEach(getDepth);

    // Create array of levels with their labels
    const levels = [];
    const maxDepth = Math.max(...Array.from(depthMap.values()));

    for (let i = 0; i <= maxDepth; i++) {
      levels.push({
        depth: i,
        label: labelMap.get(i) || `Level ${i + 1}`,
      });
    }

    console.log("=== Hierarchy Calculation ===");
    console.log("afterAssemblyHierarchy:", afterAssemblyHierarchy);
    console.log("depthMap:", Array.from(depthMap.entries()));
    console.log("labelMap:", Array.from(labelMap.entries()));
    console.log("Calculated levels:", levels);
    console.log("============================");
    return levels;
  }, [afterAssemblyHierarchy]);

  const handleSelectorChange = (
    idx: number,
    field: string,
    value: string | boolean | string[]
  ) => {
    setDistrictSelectors((prev) =>
      prev.map((sel, i) =>
        i === idx
          ? {
              ...sel,
              [field]: value,
              // Reset dependent fields when parent changes
              ...(field === "district_ids"
                ? {
                    assembly_ids: [],
                    assembly_child_ids: [],
                    level2_ids: [],
                    level3_ids: [],
                    level4_ids: [],
                    // Legacy fields
                    block_ids: [],
                    mandal_ids: [],
                    booth_ids: [],
                  }
                : field === "assembly_ids"
                ? {
                    assembly_child_ids: [],
                    level2_ids: [],
                    level3_ids: [],
                    level4_ids: [],
                    // Legacy fields
                    block_ids: [],
                    mandal_ids: [],
                    booth_ids: [],
                  }
                : field === "assembly_child_ids"
                ? {
                    level2_ids: [],
                    level3_ids: [],
                    level4_ids: [],
                    // Legacy fields
                    mandal_ids: [],
                    booth_ids: [],
                  }
                : field === "level2_ids"
                ? {
                    level3_ids: [],
                    level4_ids: [],
                    // Legacy fields
                    booth_ids: [],
                  }
                : field === "level3_ids"
                ? {
                    level4_ids: [],
                  }
                : // Legacy field handling
                field === "block_ids"
                ? { mandal_ids: [], booth_ids: [] }
                : field === "mandal_ids"
                ? { booth_ids: [] }
                : {}),
            }
          : sel
      )
    );
  };

  const toggleCheckbox = (idx: number, field: string, itemId: string) => {
    const selector = districtSelectors[idx];
    const currentArray = selector[field as keyof typeof selector] as string[];
    const newArray = currentArray.includes(itemId)
      ? currentArray.filter((id) => id !== itemId)
      : [...currentArray, itemId];
    handleSelectorChange(idx, field, newArray);
  };

  const toggleDropdown = (idx: number, dropdownField: string) => {
    setDistrictSelectors((prev) =>
      prev.map((sel, i) =>
        i === idx
          ? { ...sel, [dropdownField]: !sel[dropdownField as keyof typeof sel] }
          : sel
      )
    );
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setDistrictSelectors((prev) =>
        prev.map((sel) => ({
          ...sel,
          districtOpen: false,
          assemblyOpen: false,
          assemblyChildOpen: false,
          level2Open: false,
          level3Open: false,
          level4Open: false,
          // Legacy dropdown states
          blockOpen: false,
          mandalOpen: false,
          boothOpen: false,
        }))
      );
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleAddSelector = () => {
    if (districtSelectors.length >= maxSelectors) {
      toast.error(`Maximum ${maxSelectors} selectors allowed`);
      return;
    }
    setDistrictSelectors((prev) => [...prev, createEmptySelector()]);
  };

  const handleRemoveSelector = (idx: number) => {
    setDistrictSelectors((prev) => prev.filter((_, i) => i !== idx));
  };

  const formatDateForInput = React.useCallback((dateString?: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const userOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - userOffset);
    return localDate.toISOString().split("T")[0];
  }, []);

  const buildDefaultValues = React.useCallback(
    (data?: Partial<Campaign>): CampaignFormData => ({
      title: data?.name ?? "",
      description: data?.description ?? "",
      location: data?.location ?? "",
      start_date: data?.start_date ? formatDateForInput(data.start_date) : "",
      end_date: data?.end_date ? formatDateForInput(data.end_date) : "",
      images:
        data?.images && Array.isArray(data.images)
          ? data.images
          : data?.image
          ? [data.image]
          : [],
      target_levels: [],
    }),
    [formatDateForInput]
  );

  const formDefaults = React.useMemo(
    () => buildDefaultValues(initialData),
    [buildDefaultValues, initialData]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CampaignFormData>({
    resolver: yupResolver(campaignSchema),
    defaultValues: formDefaults,
  });

  React.useEffect(() => {
    reset(buildDefaultValues(initialData));
  }, [buildDefaultValues, initialData, reset]);

  const isEditing = Boolean(initialData?.id);

  React.useEffect(() => {
    if (!initialData?.hierarchy_selections?.length) {
      setDistrictSelectors([createEmptySelector()]);
      return;
    }
    setDistrictSelectors(
      convertHierarchySelectionsToSelectors(
        initialData.hierarchy_selections,
        afterAssemblyHierarchy
      )
    );
  }, [initialData, afterAssemblyHierarchy]);

  React.useEffect(() => {
    if (!initialData) {
      setImagePreviews([]);
      setSelectedImages([]);
      return;
    }

    if (Array.isArray(initialData.images) && initialData.images.length > 0) {
      setImagePreviews(initialData.images);
      setSelectedImages([]);
      return;
    }

    if (initialData.image) {
      setImagePreviews([initialData.image]);
      setSelectedImages([]);
      return;
    }

    setImagePreviews([]);
    setSelectedImages([]);
  }, [initialData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedImages((prev) => [...prev, ...files]);

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImagePreviews((prev) => [
              ...prev,
              event.target!.result as string,
            ]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    if (e.target) e.target.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  React.useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [imagePreviews]);

  const handleFormSubmit = async (data: CampaignFormData) => {
    if (!stateId || !partyId) {
      toast.error(
        "Assignment context missing. Please reselect your state/party and try again."
      );
      return;
    }

    const hierarchySelections: CampaignHierarchySelection[] = [];

    const pushSelections = (
      ids: string[],
      hierarchyType: CampaignHierarchySelection["hierarchy_type"],
      toggle_on: boolean
    ) => {
      ids.forEach((id) => {
        if (!id) return;
        hierarchySelections.push({
          hierarchy_type: hierarchyType,
          hierarchy_id: Number(id),
          toggle_on,
        });
      });
    };

    districtSelectors.forEach((selector) => {
      pushSelections(
        selector.district_ids,
        "stateMasterData",
        selector.autoInclude
      );
      pushSelections(
        selector.assembly_ids,
        "stateMasterData",
        selector.autoInclude
      );
      // New dynamic fields
      pushSelections(
        selector.assembly_child_ids,
        "afterAssemblyData",
        selector.autoInclude
      );
      pushSelections(
        selector.level2_ids,
        "afterAssemblyData",
        selector.autoInclude
      );
      pushSelections(
        selector.level3_ids,
        "afterAssemblyData",
        selector.autoInclude
      );
      pushSelections(
        selector.level4_ids,
        "afterAssemblyData",
        selector.autoInclude
      );
      // Legacy fields for backward compatibility
      pushSelections(
        selector.mandal_ids,
        "afterAssemblyData",
        selector.autoInclude
      );
      pushSelections(
        selector.block_ids,
        "afterAssemblyData",
        selector.autoInclude
      );
      pushSelections(
        selector.booth_ids,
        "afterAssemblyData",
        selector.autoInclude
      );
    });

    const targetScopes: { levelType: string; level_id: string }[] = [];
    districtSelectors.forEach((selector) => {
      selector.district_ids.forEach((id) => {
        targetScopes.push({ levelType: "DISTRICT", level_id: id });
      });
      selector.assembly_ids.forEach((id) => {
        targetScopes.push({ levelType: "ASSEMBLY", level_id: id });
      });
      // New dynamic fields - determine level type from hierarchy data
      selector.assembly_child_ids.forEach((id) => {
        const node = afterAssemblyHierarchy.find((n) => n.id === Number(id));
        const levelType =
          node?.levelName?.toUpperCase() || "AFTER_ASSEMBLY_LEVEL_1";
        targetScopes.push({ levelType, level_id: id });
      });
      selector.level2_ids.forEach((id) => {
        const node = afterAssemblyHierarchy.find((n) => n.id === Number(id));
        const levelType =
          node?.levelName?.toUpperCase() || "AFTER_ASSEMBLY_LEVEL_2";
        targetScopes.push({ levelType, level_id: id });
      });
      selector.level3_ids.forEach((id) => {
        const node = afterAssemblyHierarchy.find((n) => n.id === Number(id));
        const levelType =
          node?.levelName?.toUpperCase() || "AFTER_ASSEMBLY_LEVEL_3";
        targetScopes.push({ levelType, level_id: id });
      });
      selector.level4_ids.forEach((id) => {
        const node = afterAssemblyHierarchy.find((n) => n.id === Number(id));
        const levelType =
          node?.levelName?.toUpperCase() || "AFTER_ASSEMBLY_LEVEL_4";
        targetScopes.push({ levelType, level_id: id });
      });
      // Legacy fields for backward compatibility
      selector.block_ids.forEach((id) => {
        targetScopes.push({ levelType: "BLOCK", level_id: id });
      });
      selector.mandal_ids.forEach((id) => {
        targetScopes.push({ levelType: "MANDAL", level_id: id });
      });
      selector.booth_ids.forEach((id) => {
        targetScopes.push({ levelType: "POLLING_CENTER", level_id: id });
      });
    });

    const hasAutoInclude = districtSelectors.some((sel) => sel.autoInclude);

    // Use the actual state ID that we calculated for API calls
    // This ensures we always use the root state ID, not district or assembly ID
    const campaignStateId = actualStateIdForApi || stateId;

    await onSubmit({
      ...data,
      imageFiles: selectedImages,
      targetScopes,
      autoInclude: hasAutoInclude,
      hierarchySelections,
      campaignLevel,
      stateId: campaignStateId,
      partyId,
    });
  };

  return (
    <div className="space-y-6 p-4 rounded-xl shadow-md bg-gray-50">
      <div className="flex items-center justify-between gap-6 mb-2">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Edit Campaign" : "Create New Campaign"}
        </h1>
        <button
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-900 transition px-4 py-2 rounded"
        >
          ← Back
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              {...register("title")}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter campaign title..."
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Describe your campaign goals..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                {...register("start_date")}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.start_date ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.start_date && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.start_date.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                {...register("end_date")}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.end_date ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.end_date && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.end_date.message}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              {...register("location")}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.location ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter campaign location..."
            />
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">
                {errors.location.message}
              </p>
            )}
          </div>

          {/* Cascading Dropdowns for Category Selection */}
          <div className="p-4 border rounded-xl bg-gray-100 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-800">
                Select Categories
              </span>
              <button
                type="button"
                onClick={handleAddSelector}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"
              >
                <span className="text-lg font-bold">+</span> Add
              </button>
            </div>
            {districtSelectors.map((sel, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-lg shadow-sm border mb-4"
              >
                {/* Individual Auto-Include Toggle */}
                <div className="flex items-center justify-between mb-4 p-3 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Auto-Include Subordinates (Row {idx + 1})
                    </h4>
                    <p className="text-xs text-gray-600">
                      Auto-include all users under selected levels in this row
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={sel.autoInclude}
                      onChange={(e) =>
                        handleSelectorChange(
                          idx,
                          "autoInclude",
                          e.target.checked
                        )
                      }
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Cascading Dropdowns */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start relative">
                  {/* District Dropdown with Checkboxes - Hide if user is at District level or below */}
                  {userLevelType !== "District" &&
                    userLevelType !== "Assembly" && (
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          District ({sel.district_ids.length})
                        </label>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(idx, "districtOpen");
                          }}
                          className="w-full px-3 py-2 border rounded-lg text-left bg-white hover:bg-gray-50"
                        >
                          {sel.district_ids.length > 0
                            ? `${sel.district_ids.length} selected`
                            : "Select Districts"}
                        </button>
                        {sel.districtOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                          >
                            {(loadingHierarchy || hierarchyError) && (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                {loadingHierarchy ? "Loading…" : hierarchyError}
                              </div>
                            )}
                            {!loadingHierarchy &&
                              !hierarchyError &&
                              districtsData.length > 0 && (
                                <label className="flex items-center px-3 py-2 bg-blue-50 border-b border-blue-200 hover:bg-blue-100 cursor-pointer sticky top-0">
                                  <input
                                    type="checkbox"
                                    checked={
                                      sel.district_ids.length ===
                                      districtsData.length
                                    }
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        handleSelectorChange(
                                          idx,
                                          "district_ids",
                                          districtsData.map((d) => String(d.id))
                                        );
                                      } else {
                                        handleSelectorChange(
                                          idx,
                                          "district_ids",
                                          []
                                        );
                                      }
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm font-semibold text-blue-700">
                                    Select All
                                  </span>
                                </label>
                              )}
                            {districtsData.map((district) => (
                              <label
                                key={district.id}
                                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={sel.district_ids.includes(
                                    String(district.id)
                                  )}
                                  onChange={() =>
                                    toggleCheckbox(
                                      idx,
                                      "district_ids",
                                      String(district.id)
                                    )
                                  }
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm">
                                  {district.levelName}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  {/* Assembly Dropdown with Checkboxes - Hide if user is at Assembly level */}
                  {userLevelType !== "Assembly" && (
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assembly ({sel.assembly_ids.length})
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(idx, "assemblyOpen");
                        }}
                        disabled={
                          userLevelType !== "District" &&
                          sel.district_ids.length === 0
                        }
                        className="w-full px-3 py-2 border rounded-lg text-left bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {sel.assembly_ids.length > 0
                          ? `${sel.assembly_ids.length} selected`
                          : userLevelType === "District"
                          ? "Select Assemblies"
                          : sel.district_ids.length === 0
                          ? "Select District first"
                          : "Select Assemblies"}
                      </button>
                      {sel.assemblyOpen &&
                        (userLevelType === "District" ||
                          sel.district_ids.length > 0) && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                          >
                            {(() => {
                              const assemblies =
                                userLevelType === "District"
                                  ? assembliesByDistrict(String(stateId))
                                  : sel.district_ids.flatMap((dId) =>
                                      assembliesByDistrict(dId)
                                    );
                              return (
                                <>
                                  {assemblies.length > 0 && (
                                    <label className="flex items-center px-3 py-2 bg-blue-50 border-b border-blue-200 hover:bg-blue-100 cursor-pointer sticky top-0">
                                      <input
                                        type="checkbox"
                                        checked={
                                          sel.assembly_ids.length ===
                                          assemblies.length
                                        }
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            handleSelectorChange(
                                              idx,
                                              "assembly_ids",
                                              assemblies.map((a) =>
                                                String(a.id)
                                              )
                                            );
                                          } else {
                                            handleSelectorChange(
                                              idx,
                                              "assembly_ids",
                                              []
                                            );
                                          }
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                      />
                                      <span className="ml-2 text-sm font-semibold text-blue-700">
                                        Select All
                                      </span>
                                    </label>
                                  )}
                                  {assemblies.map(
                                    (assembly: StateHierarchyNode) => (
                                      <label
                                        key={assembly.id}
                                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={sel.assembly_ids.includes(
                                            String(assembly.id)
                                          )}
                                          onChange={() =>
                                            toggleCheckbox(
                                              idx,
                                              "assembly_ids",
                                              String(assembly.id)
                                            )
                                          }
                                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm">
                                          {assembly.levelName}
                                        </span>
                                      </label>
                                    )
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                    </div>
                  )}

                  {/* Dynamic after-assembly dropdowns */}
                  {hierarchyLevels.map((level, levelIndex) => {
                    const isFirstLevel = levelIndex === 0;
                    const fieldName = isFirstLevel
                      ? "assembly_child_ids"
                      : `level${levelIndex + 1}_ids`;
                    const dropdownName = isFirstLevel
                      ? "assemblyChildOpen"
                      : `level${levelIndex + 1}Open`;

                    const selectedCount = isFirstLevel
                      ? sel.assembly_child_ids.length
                      : levelIndex === 1
                      ? sel.level2_ids.length
                      : levelIndex === 2
                      ? sel.level3_ids.length
                      : levelIndex === 3
                      ? sel.level4_ids.length
                      : 0;

                    const isDropdownOpen = isFirstLevel
                      ? sel.assemblyChildOpen
                      : levelIndex === 1
                      ? sel.level2Open
                      : levelIndex === 2
                      ? sel.level3Open
                      : levelIndex === 3
                      ? sel.level4Open
                      : false;

                    const parentSelected =
                      levelIndex === 0
                        ? sel.assembly_ids
                        : levelIndex === 1
                        ? sel.assembly_child_ids
                        : levelIndex === 2
                        ? sel.level2_ids
                        : levelIndex === 3
                        ? sel.level3_ids
                        : [];

                    const isDisabled =
                      (levelIndex === 0 &&
                        userLevelType !== "Assembly" &&
                        sel.assembly_ids.length === 0) ||
                      (levelIndex > 0 && parentSelected.length === 0);

                    const getOptionsForLevel = () => {
                      if (levelIndex === 0) {
                        // First level: children of assembly (parentAssemblyId match, parentId null)
                        if (userLevelType === "Assembly") {
                          const options = getAssemblyChildren(String(stateId));
                          console.log(
                            `Level ${levelIndex} (Assembly user) - stateId: ${stateId}, options:`,
                            options
                          );
                          return options;
                        } else {
                          const options = sel.assembly_ids.flatMap((aId) => {
                            const children = getAssemblyChildren(aId);
                            console.log(
                              `Level ${levelIndex} - Assembly ${aId} children:`,
                              children
                            );
                            return children;
                          });
                          console.log(
                            `Level ${levelIndex} - Total options:`,
                            options
                          );
                          return options;
                        }
                      } else {
                        // Subsequent levels: children of parent nodes (parentId match)
                        const options = parentSelected.flatMap((parentId) => {
                          const children = getNodeChildren(parentId);
                          console.log(
                            `Level ${levelIndex} - Parent ${parentId} children:`,
                            children
                          );
                          return children;
                        });
                        console.log(
                          `Level ${levelIndex} - Total options:`,
                          options
                        );
                        return options;
                      }
                    };

                    // Get dynamic label from available options
                    const availableOptions = getOptionsForLevel();
                    const dynamicLabel =
                      availableOptions.length > 0
                        ? availableOptions[0].levelName ||
                          availableOptions[0].display_level_name ||
                          level.label
                        : level.label;

                    console.log(`Dropdown Level ${levelIndex}:`, {
                      staticLabel: level.label,
                      dynamicLabel,
                      availableOptionsCount: availableOptions.length,
                      firstOption: availableOptions[0],
                    });

                    return (
                      <div key={levelIndex} className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {dynamicLabel} ({selectedCount})
                        </label>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(idx, dropdownName);
                          }}
                          disabled={isDisabled}
                          className="w-full px-3 py-2 border rounded-lg text-left bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          {selectedCount > 0
                            ? `${selectedCount} selected`
                            : isDisabled
                            ? levelIndex === 0
                              ? "Select Assembly first"
                              : `Select ${
                                  hierarchyLevels[levelIndex - 1]?.label ||
                                  "parent"
                                } first`
                            : `Select ${dynamicLabel}`}
                        </button>
                        {isDropdownOpen && !isDisabled && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                          >
                            {availableOptions.length > 0 && (
                              <label className="flex items-center px-3 py-2 bg-blue-50 border-b border-blue-200 hover:bg-blue-100 cursor-pointer sticky top-0">
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedCount === availableOptions.length
                                  }
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      handleSelectorChange(
                                        idx,
                                        fieldName,
                                        availableOptions.map((n) =>
                                          String(n.id)
                                        )
                                      );
                                    } else {
                                      handleSelectorChange(idx, fieldName, []);
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm font-semibold text-blue-700">
                                  Select All
                                </span>
                              </label>
                            )}
                            {availableOptions.map((node) => (
                              <label
                                key={node.id}
                                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    isFirstLevel
                                      ? sel.assembly_child_ids.includes(
                                          String(node.id)
                                        )
                                      : levelIndex === 1
                                      ? sel.level2_ids.includes(String(node.id))
                                      : levelIndex === 2
                                      ? sel.level3_ids.includes(String(node.id))
                                      : levelIndex === 3
                                      ? sel.level4_ids.includes(String(node.id))
                                      : false
                                  }
                                  onChange={() =>
                                    toggleCheckbox(
                                      idx,
                                      fieldName,
                                      String(node.id)
                                    )
                                  }
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm">
                                  {node.displayName}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Remove Button */}
                  {districtSelectors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSelector(idx)}
                      className="absolute top-0 right-0 text-red-500 hover:text-red-700 text-xl font-bold bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-md"
                      title="Remove this selector"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Auto-inclusion indicator */}
                {sel.autoInclude && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-700 font-medium">
                      ✓ Auto-inclusion enabled for this row - will include all
                      subordinates under selected levels
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Campaign Photos Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Campaign Photos
            </label>

            {/* Upload Area */}
            <div
              onClick={openFileSelector}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 cursor-pointer mb-4"
            >
              <div className="mx-auto w-16 h-16 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Add Campaign Photos
              </h3>
              <p className="text-sm text-gray-500 mb-1">
                Click to select multiple photos or drag and drop
              </p>
              <p className="text-xs text-gray-400">
                Support for JPEG, PNG, WebP files up to 10MB each
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Images Preview Grid */}
            {imagePreviews.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      Campaign Images ({imagePreviews.length})
                    </h4>
                    <p className="text-sm text-gray-500">
                      {imagePreviews.length} new (
                      {(
                        selectedImages.reduce(
                          (sum, file) => sum + file.size,
                          0
                        ) /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImages([]);
                      setImagePreviews([]);
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Clear All Images
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={`new-${index}`}
                      className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={preview}
                          alt={`New image ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />

                        {/* New Image Badge */}
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          New
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 hover:scale-100 shadow-lg"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="p-3">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {selectedImages[index]?.name || `Image ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedImages[index]
                            ? (
                                selectedImages[index].size /
                                1024 /
                                1024
                              ).toFixed(2) + " MB"
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Send size={20} />
              {isSubmitting
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Update Campaign"
                : "Launch Campaign"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
