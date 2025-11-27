import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Send, Plus, X } from "lucide-react";
import React from "react";
import {
  legacyCampaignSchema,
  type LegacyCampaignFormData,
} from "../../../../schemas/campaignSchema";
import type { Campaign } from "../../../../types/campaign";

interface CampaignFormProps {
  onSubmit: (data: LegacyCampaignFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<Campaign>;
}

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
  const [districtSelectors, setDistrictSelectors] = React.useState([
    {
      district_ids: [] as string[],
      assembly_ids: [] as string[],
      block_ids: [] as string[],
      mandal_ids: [] as string[],
      booth_ids: [] as string[],
      karyakarta_ids: [] as string[],
      autoInclude: false,
      // Dropdown open states
      districtOpen: false,
      assemblyOpen: false,
      blockOpen: false,
      mandalOpen: false,
      boothOpen: false,
      karyakartaOpen: false,
    },
  ]);

  // Static data for dropdowns
  const staticData = {
    districts: [
      { id: "1", name: "Kamrup Metropolitan" },
      { id: "2", name: "Kamrup" },
      { id: "3", name: "Nagaon" },
      { id: "4", name: "Sonitpur" },
      { id: "5", name: "Dibrugarh" },
    ],
    assemblies: [
      { id: "1", name: "Dispur", districtId: "1" },
      { id: "2", name: "Gauhati East", districtId: "1" },
      { id: "3", name: "Gauhati West", districtId: "1" },
      { id: "4", name: "Rangia", districtId: "2" },
      { id: "5", name: "Hojai", districtId: "3" },
      { id: "6", name: "Tezpur", districtId: "4" },
      { id: "7", name: "Dibrugarh East", districtId: "5" },
    ],
    blocks: [
      { id: "1", name: "Block A", assemblyId: "1" },
      { id: "2", name: "Block B", assemblyId: "1" },
      { id: "3", name: "Block C", assemblyId: "2" },
      { id: "4", name: "Block D", assemblyId: "3" },
      { id: "5", name: "Block E", assemblyId: "4" },
    ],
    mandals: [
      { id: "1", name: "Mandal 1", blockId: "1" },
      { id: "2", name: "Mandal 2", blockId: "1" },
      { id: "3", name: "Mandal 3", blockId: "2" },
      { id: "4", name: "Mandal 4", blockId: "3" },
      { id: "5", name: "Mandal 5", blockId: "4" },
    ],
    booths: [
      { id: "1", name: "Booth 101", assemblyId: "1" },
      { id: "2", name: "Booth 102", assemblyId: "1" },
      { id: "3", name: "Booth 103", assemblyId: "2" },
      { id: "4", name: "Booth 104", assemblyId: "3" },
      { id: "5", name: "Booth 105", assemblyId: "4" },
    ],
    karyakartas: [
      { id: "1", name: "Rajesh Kumar", assemblyId: "1" },
      { id: "2", name: "Priya Sharma", assemblyId: "1" },
      { id: "3", name: "Amit Singh", assemblyId: "2" },
      { id: "4", name: "Sneha Patel", assemblyId: "3" },
      { id: "5", name: "Rahul Verma", assemblyId: "4" },
    ],
  };

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
                    block_ids: [],
                    mandal_ids: [],
                    booth_ids: [],
                    karyakarta_ids: [],
                  }
                : field === "assembly_ids"
                ? {
                    block_ids: [],
                    mandal_ids: [],
                    booth_ids: [],
                    karyakarta_ids: [],
                  }
                : field === "block_ids"
                ? { mandal_ids: [], booth_ids: [], karyakarta_ids: [] }
                : field === "mandal_ids"
                ? { booth_ids: [], karyakarta_ids: [] }
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
          blockOpen: false,
          mandalOpen: false,
          boothOpen: false,
          karyakartaOpen: false,
        }))
      );
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleAddSelector = () => {
    if (districtSelectors.length >= maxSelectors) {
      alert(`Maximum ${maxSelectors} selectors allowed`);
      return;
    }
    setDistrictSelectors((prev) => [
      ...prev,
      {
        district_ids: [],
        assembly_ids: [],
        block_ids: [],
        mandal_ids: [],
        booth_ids: [],
        karyakarta_ids: [],
        autoInclude: false,
        districtOpen: false,
        assemblyOpen: false,
        blockOpen: false,
        mandalOpen: false,
        boothOpen: false,
        karyakartaOpen: false,
      },
    ]);
  };

  const handleRemoveSelector = (idx: number) => {
    setDistrictSelectors((prev) => prev.filter((_, i) => i !== idx));
  };

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LegacyCampaignFormData>({
    resolver: yupResolver(legacyCampaignSchema),
    defaultValues: {
      title: initialData?.name || "",
      description: initialData?.description || "",
      location: initialData?.location || "",
      start_date: initialData?.start_date || "",
      end_date: initialData?.end_date || "",
    },
  });

  const isEditing = Boolean(initialData?.id);

  // Fix timezone issue for date inputs
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const userOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - userOffset);
    return localDate.toISOString().split("T")[0];
  };

  React.useEffect(() => {
    if (isEditing && initialData) {
      if (initialData.start_date) {
        setValue("start_date", formatDateForInput(initialData.start_date));
      }
      if (initialData.end_date) {
        setValue("end_date", formatDateForInput(initialData.end_date));
      }
    }
  }, [isEditing, initialData, setValue]);

  // Cleanup image previews on unmount
  React.useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        if (preview.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [imagePreviews]);

  const handleFormSubmit = async (data: LegacyCampaignFormData) => {
    // Transform districtSelectors into targetScopes
    const targetScopes: { levelType: string; level_id: string }[] = [];
    districtSelectors.forEach((selector) => {
      // Add all selected districts
      selector.district_ids.forEach((id) => {
        targetScopes.push({ levelType: "DISTRICT", level_id: id });
      });
      // Add all selected assemblies
      selector.assembly_ids.forEach((id) => {
        targetScopes.push({ levelType: "ASSEMBLY", level_id: id });
      });
      // Add all selected blocks
      selector.block_ids.forEach((id) => {
        targetScopes.push({ levelType: "BLOCK", level_id: id });
      });
      // Add all selected mandals
      selector.mandal_ids.forEach((id) => {
        targetScopes.push({ levelType: "MANDAL", level_id: id });
      });
      // Add all selected booths
      selector.booth_ids.forEach((id) => {
        targetScopes.push({ levelType: "BOOTH", level_id: id });
      });
      // Add all selected karyakartas
      selector.karyakarta_ids.forEach((id) => {
        targetScopes.push({ levelType: "KARYAKARTA", level_id: id });
      });
    });

    const hasAutoInclude = districtSelectors.some((sel) => sel.autoInclude);

    await onSubmit({
      ...data,
      imageFiles: selectedImages,
      targetScopes,
      autoInclude: hasAutoInclude,
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
                  {/* District Dropdown with Checkboxes */}
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
                        {staticData.districts.map((district) => (
                          <label
                            key={district.id}
                            className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={sel.district_ids.includes(district.id)}
                              onChange={() =>
                                toggleCheckbox(idx, "district_ids", district.id)
                              }
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm">
                              {district.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assembly Dropdown with Checkboxes */}
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
                      disabled={sel.district_ids.length === 0}
                      className="w-full px-3 py-2 border rounded-lg text-left bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {sel.assembly_ids.length > 0
                        ? `${sel.assembly_ids.length} selected`
                        : sel.district_ids.length === 0
                        ? "Select District first"
                        : "Select Assemblies"}
                    </button>
                    {sel.assemblyOpen && sel.district_ids.length > 0 && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                      >
                        {staticData.assemblies
                          .filter((assembly) =>
                            sel.district_ids.includes(assembly.districtId)
                          )
                          .map((assembly) => (
                            <label
                              key={assembly.id}
                              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={sel.assembly_ids.includes(assembly.id)}
                                onChange={() =>
                                  toggleCheckbox(
                                    idx,
                                    "assembly_ids",
                                    assembly.id
                                  )
                                }
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm">
                                {assembly.name}
                              </span>
                            </label>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Block Dropdown with Checkboxes */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Block ({sel.block_ids.length})
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(idx, "blockOpen");
                      }}
                      disabled={sel.assembly_ids.length === 0}
                      className="w-full px-3 py-2 border rounded-lg text-left bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {sel.block_ids.length > 0
                        ? `${sel.block_ids.length} selected`
                        : sel.assembly_ids.length === 0
                        ? "Select Assembly first"
                        : "Select Blocks"}
                    </button>
                    {sel.blockOpen && sel.assembly_ids.length > 0 && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                      >
                        {staticData.blocks
                          .filter((block) =>
                            sel.assembly_ids.includes(block.assemblyId)
                          )
                          .map((block) => (
                            <label
                              key={block.id}
                              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={sel.block_ids.includes(block.id)}
                                onChange={() =>
                                  toggleCheckbox(idx, "block_ids", block.id)
                                }
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm">{block.name}</span>
                            </label>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Mandal Dropdown with Checkboxes */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mandal ({sel.mandal_ids.length})
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(idx, "mandalOpen");
                      }}
                      disabled={sel.block_ids.length === 0}
                      className="w-full px-3 py-2 border rounded-lg text-left bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {sel.mandal_ids.length > 0
                        ? `${sel.mandal_ids.length} selected`
                        : sel.block_ids.length === 0
                        ? "Select Block first"
                        : "Select Mandals"}
                    </button>
                    {sel.mandalOpen && sel.block_ids.length > 0 && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                      >
                        {staticData.mandals
                          .filter((mandal) =>
                            sel.block_ids.includes(mandal.blockId)
                          )
                          .map((mandal) => (
                            <label
                              key={mandal.id}
                              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={sel.mandal_ids.includes(mandal.id)}
                                onChange={() =>
                                  toggleCheckbox(idx, "mandal_ids", mandal.id)
                                }
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm">
                                {mandal.name}
                              </span>
                            </label>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Booth Dropdown with Checkboxes */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Booth ({sel.booth_ids.length})
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(idx, "boothOpen");
                      }}
                      disabled={sel.assembly_ids.length === 0}
                      className="w-full px-3 py-2 border rounded-lg text-left bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {sel.booth_ids.length > 0
                        ? `${sel.booth_ids.length} selected`
                        : sel.assembly_ids.length === 0
                        ? "Select Assembly first"
                        : "Select Booths"}
                    </button>
                    {sel.boothOpen && sel.assembly_ids.length > 0 && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                      >
                        {staticData.booths
                          .filter((booth) =>
                            sel.assembly_ids.includes(booth.assemblyId)
                          )
                          .map((booth) => (
                            <label
                              key={booth.id}
                              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={sel.booth_ids.includes(booth.id)}
                                onChange={() =>
                                  toggleCheckbox(idx, "booth_ids", booth.id)
                                }
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm">{booth.name}</span>
                            </label>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Karyakarta Dropdown with Checkboxes */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Karyakarta ({sel.karyakarta_ids.length})
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(idx, "karyakartaOpen");
                      }}
                      disabled={sel.assembly_ids.length === 0}
                      className="w-full px-3 py-2 border rounded-lg text-left bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {sel.karyakarta_ids.length > 0
                        ? `${sel.karyakarta_ids.length} selected`
                        : sel.assembly_ids.length === 0
                        ? "Select Assembly first"
                        : "Select Karyakartas"}
                    </button>
                    {sel.karyakartaOpen && sel.assembly_ids.length > 0 && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                      >
                        {staticData.karyakartas
                          .filter((karyakarta) =>
                            sel.assembly_ids.includes(karyakarta.assemblyId)
                          )
                          .map((karyakarta) => (
                            <label
                              key={karyakarta.id}
                              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={sel.karyakarta_ids.includes(
                                  karyakarta.id
                                )}
                                onChange={() =>
                                  toggleCheckbox(
                                    idx,
                                    "karyakarta_ids",
                                    karyakarta.id
                                  )
                                }
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm">
                                {karyakarta.name}
                              </span>
                            </label>
                          ))}
                      </div>
                    )}
                  </div>

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
