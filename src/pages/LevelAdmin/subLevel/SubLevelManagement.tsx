import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import toast from "react-hot-toast";
import { fetchHierarchyChildren } from "../../../services/hierarchyApi";
import {
    fetchAfterAssemblyDataByAssembly,
    fetchChildLevelsByParent,
    createAfterAssemblyData,
    updateAfterAssemblyData,
    deleteAfterAssemblyData,
    activateAfterAssemblyData,
    deactivateAfterAssemblyData,
    type AfterAssemblyData,
} from "../../../services/afterAssemblyApi";
import type { HierarchyChild } from "../../../types/hierarchy";
import ConfirmationModal from "../../../components/ConfirmationModal";

export default function SubLevelManagement() {
    const { levelId } = useParams<{ levelId: string }>();
    const { levelAdminPanels } = useAppSelector((state) => state.auth);

    const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

    const [districts, setDistricts] = useState<HierarchyChild[]>([]);
    const [assemblies, setAssemblies] = useState<HierarchyChild[]>([]);
    const [levelData, setLevelData] = useState<AfterAssemblyData[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<HierarchyChild | null>(null);
    const [selectedAssembly, setSelectedAssembly] = useState<HierarchyChild | null>(null);

    // Dynamic hierarchy path: array of selected levels from root to current
    const [hierarchyPath, setHierarchyPath] = useState<AfterAssemblyData[]>([]);
    // Available options for each level in the hierarchy
    const [levelOptions, setLevelOptions] = useState<AfterAssemblyData[][]>([]);

    const [loading, setLoading] = useState(true);
    const [assembliesLoading, setAssembliesLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingData, setEditingData] = useState<AfterAssemblyData | null>(null);

    const [formData, setFormData] = useState({
        levelName: currentPanel?.name || "",
        displayName: "",
        parentId: null as number | null,
    });

    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        id: number | null;
        name: string;
    }>({
        isOpen: false,
        id: null,
        name: "",
    });

    // Check if parent level is Assembly
    const isParentAssembly = currentPanel?.metadata?.parentLevelName?.toLowerCase() === "assembly";

    // Update levelName when panel changes
    useEffect(() => {
        if (currentPanel?.name) {
            setFormData(prev => ({
                ...prev,
                levelName: currentPanel.name
            }));
        }
    }, [currentPanel]);

    // Load districts
    useEffect(() => {
        const loadDistricts = async () => {
            const metadata = currentPanel?.metadata;
            if (!metadata?.stateId) return;

            try {
                setLoading(true);
                const response = await fetchHierarchyChildren(metadata.stateId, {
                    page: 1,
                    limit: 1000
                });

                if (response.success && response.data?.children) {
                    setDistricts(response.data.children);
                }
            } catch (error) {
                toast.error("Failed to load districts");
            } finally {
                setLoading(false);
            }
        };

        loadDistricts();
    }, [currentPanel]);

    // Load assemblies when district is selected
    useEffect(() => {
        const loadAssemblies = async () => {
            if (!selectedDistrict) {
                setAssemblies([]);
                return;
            }

            try {
                setAssembliesLoading(true);
                const response = await fetchHierarchyChildren(selectedDistrict.location_id, {
                    page: 1,
                    limit: 1000
                });

                if (response.success && response.data?.children) {
                    setAssemblies(response.data.children);
                }
            } catch (error) {
                toast.error("Failed to load assemblies");
            } finally {
                setAssembliesLoading(false);
            }
        };

        loadAssemblies();
    }, [selectedDistrict]);

    // Load initial level data when assembly is selected - direct children of assembly
    useEffect(() => {
        const loadInitialLevelData = async () => {
            if (!selectedAssembly) {
                setLevelData([]);
                setLevelOptions([]);
                setHierarchyPath([]);
                return;
            }

            try {
                setDataLoading(true);
                const response = await fetchAfterAssemblyDataByAssembly(selectedAssembly.location_id);

                if (response.success) {
                    // Store all level data for reference
                    setLevelData(response.data);

                    // Show all direct children of assembly (not filtered by panel name yet)
                    if (response.data.length > 0) {
                        setLevelOptions([response.data]);
                    } else {
                        setLevelOptions([]);
                    }
                } else {
                    setLevelData([]);
                    setLevelOptions([]);
                }
                setHierarchyPath([]);
            } catch (error) {
                toast.error("Failed to load level data");
                setLevelData([]);
                setLevelOptions([]);
            } finally {
                setDataLoading(false);
            }
        };

        loadInitialLevelData();
    }, [selectedAssembly]);

    // Handle selecting a level in the hierarchy - dynamically load children
    const handleLevelSelect = async (levelIndex: number, selectedLevel: AfterAssemblyData | null) => {
        if (!selectedLevel) {
            // Clear from this level onwards
            setHierarchyPath(prev => prev.slice(0, levelIndex));
            setLevelOptions(prev => prev.slice(0, levelIndex + 1));
            return;
        }

        // Update hierarchy path
        const newPath = [...hierarchyPath.slice(0, levelIndex), selectedLevel];
        setHierarchyPath(newPath);

        // Check if this is the panel's level - if so, don't load children
        if (selectedLevel.levelName === currentPanel?.name) {
            // This is the final level, don't show more options
            setLevelOptions(prev => prev.slice(0, levelIndex + 1));
            return;
        }

        // Load children for the next level using the parent API
        try {
            setDataLoading(true);
            const response = await fetchChildLevelsByParent(selectedLevel.id);

            if (response.success && response.data.length > 0) {
                // Update levelData with new children
                setLevelData(prev => {
                    const existingIds = new Set(prev.map(l => l.id));
                    const newLevels = response.data.filter((l: AfterAssemblyData) => !existingIds.has(l.id));
                    return [...prev, ...newLevels];
                });

                // Show all children (don't filter yet - let user navigate through hierarchy)
                setLevelOptions(prev => [...prev.slice(0, levelIndex + 1), response.data]);
            } else {
                // No children
                setLevelOptions(prev => prev.slice(0, levelIndex + 1));
            }
        } catch (error) {
            console.error("Failed to load child levels:", error);
            setLevelOptions(prev => prev.slice(0, levelIndex + 1));
        } finally {
            setDataLoading(false);
        }
    };

    // Get the current parent for creating new levels
    const currentParent = hierarchyPath.length > 0 ? hierarchyPath[hierarchyPath.length - 1] : null;

    // Handle create
    const handleCreate = async () => {
        if (!currentPanel) return;
        if (!formData.levelName || !formData.displayName) {
            toast.error("Please fill all fields");
            return;
        }

        if (!selectedAssembly) {
            toast.error("Please select an assembly");
            return;
        }

        try {
            const levelNameWithoutSpaces = formData.levelName.replace(/\s+/g, '');

            // Determine parentAssemblyId and parentId based on context:
            // - If formData.parentId is null: creating direct child of Assembly → use parentAssemblyId
            // - If formData.parentId is set: creating child of another level → use parentId
            const payload = {
                levelName: levelNameWithoutSpaces,
                displayName: formData.displayName,
                partyLevelId: currentPanel.id,
                parentId: formData.parentId,
                parentAssemblyId: formData.parentId === null ? selectedAssembly.location_id : null,
            };

            console.log("Creating level with:", payload);

            const response = await createAfterAssemblyData(payload);

            if (response.success) {
                toast.success("Level created successfully");
                setShowCreateModal(false);
                setFormData({ levelName: currentPanel?.name || "", displayName: "", parentId: null });

                // Reload data using the selected assembly
                const updatedResponse = await fetchAfterAssemblyDataByAssembly(selectedAssembly.location_id);
                if (updatedResponse.success) {
                    setLevelData(updatedResponse.data);
                    // Rebuild hierarchy options
                    const rootLevels = updatedResponse.data.filter((l: AfterAssemblyData) => l.parentId === null);
                    setLevelOptions([rootLevels]);
                    setHierarchyPath([]);
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create level");
        }
    };

    // Handle update
    const handleUpdate = async () => {
        if (!editingData) return;
        if (!formData.levelName || !formData.displayName) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            const levelNameWithoutSpaces = formData.levelName.replace(/\s+/g, '');

            const response = await updateAfterAssemblyData(editingData.id, {
                levelName: levelNameWithoutSpaces,
                displayName: formData.displayName,
                parentId: formData.parentId,
            });

            if (response.success) {
                toast.success("Level updated successfully");
                setShowEditModal(false);
                setEditingData(null);
                setFormData({ levelName: "", displayName: "", parentId: null });

                if (selectedAssembly) {
                    const updatedResponse = await fetchAfterAssemblyDataByAssembly(selectedAssembly.location_id);
                    if (updatedResponse.success) {
                        setLevelData(updatedResponse.data);
                    }
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update level");
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deleteModal.id || !selectedAssembly) return;

        try {
            const response = await deleteAfterAssemblyData(deleteModal.id);

            if (response.success) {
                toast.success("Level deleted successfully");
                setDeleteModal({ isOpen: false, id: null, name: "" });

                const updatedResponse = await fetchAfterAssemblyDataByAssembly(selectedAssembly.location_id);
                if (updatedResponse.success) {
                    setLevelData(updatedResponse.data);
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete level");
        }
    };

    // Handle toggle active
    const handleToggleActive = async (id: number, isActive: number) => {
        if (!selectedAssembly) return;

        try {
            const response = isActive === 1
                ? await deactivateAfterAssemblyData(id)
                : await activateAfterAssemblyData(id);

            if (response.success) {
                toast.success(`Level ${isActive === 1 ? "deactivated" : "activated"} successfully`);

                const updatedResponse = await fetchAfterAssemblyDataByAssembly(selectedAssembly.location_id);
                if (updatedResponse.success) {
                    setLevelData(updatedResponse.data);
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to toggle status");
        }
    };

    const openEditModal = (data: AfterAssemblyData) => {
        setEditingData(data);
        setFormData({
            levelName: data.levelName,
            displayName: data.displayName,
            parentId: data.parentId,
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (id: number, name: string) => {
        setDeleteModal({
            isOpen: true,
            id,
            name,
        });
    };

    if (!currentPanel) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
                    <p className="text-red-700">Level admin panel not found</p>
                </div>
            </div>
        );
    }

    // Get child levels for the currently selected parent in hierarchy
    const currentLevelChildren = currentParent
        ? levelData.filter(l => l.parentId === currentParent.id)
        : levelData.filter(l => l.parentId === null);

    const filteredLevelData = currentLevelChildren.filter((l) =>
        l.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.levelName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-1 bg-gradient-to-br from-gray-50 to-teal-50 min-h-screen">
            <div className="mb-1">
                <div className="bg-white rounded-xl shadow-lg p-3 sm:p-3 border-l-4 border-teal-500">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Sub-Level Management</h1>
                            <p className="text-gray-600 mt-2 text-sm sm:text-base">
                                Create hierarchical sub-levels for assemblies in {currentPanel.metadata?.stateName}
                            </p>
                        </div>
                        <div className="w-full lg:w-96">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Select Dropdowns */}
            <div className="mb-1 bg-white rounded-xl shadow-lg p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* District Select */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Select District
                        </label>
                        <select
                            value={selectedDistrict?.location_id || ""}
                            onChange={(e) => {
                                const district = districts.find(d => d.location_id === Number(e.target.value));
                                setSelectedDistrict(district || null);
                                setSelectedAssembly(null);
                                setHierarchyPath([]);
                                setLevelOptions([]);
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                            disabled={loading}
                        >
                            <option value="">-- Select District --</option>
                            {(districts || []).map((district) => (
                                <option key={district.location_id} value={district.location_id}>
                                    {district.location_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Assembly Select */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Select Assembly
                        </label>
                        <select
                            value={selectedAssembly?.location_id || ""}
                            onChange={(e) => {
                                const assembly = assemblies.find(a => a.location_id === Number(e.target.value));
                                setSelectedAssembly(assembly || null);
                                setHierarchyPath([]);
                                setLevelOptions([]);
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                            disabled={!selectedDistrict || assembliesLoading}
                        >
                            <option value="">-- Select Assembly --</option>
                            {(assemblies || []).map((assembly) => (
                                <option key={assembly.location_id} value={assembly.location_id}>
                                    {assembly.location_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Dynamic Parent Level Selects - Only show if parent is NOT Assembly */}
                    {!isParentAssembly && levelOptions.map((options, index) => (
                        <div key={index}>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {options.length > 0 ? `${options[0].levelName}` : `Level ${index + 1}`}
                            </label>
                            <select
                                value={hierarchyPath[index]?.id || ""}
                                onChange={(e) => {
                                    const level = options.find(l => l.id === Number(e.target.value));
                                    handleLevelSelect(index, level || null);
                                }}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all bg-white"
                                disabled={!selectedAssembly || dataLoading}
                            >
                                <option value="">-- Select Level --</option>
                                {options.map((level) => (
                                    <option key={level.id} value={level.id}>
                                        {level.displayName} ({level.levelName})
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                {/* Loading State */}
                {(loading || assembliesLoading || dataLoading) && (
                    <div className="mt-4 flex items-center justify-center text-gray-500">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600 mr-2"></div>
                        <span className="text-sm">Loading...</span>
                    </div>
                )}
            </div>

            {/* Level Data Table */}
            <div>
                {!selectedAssembly ? (
                    <div className="bg-white rounded-xl shadow-lg p-16 text-center border border-gray-100">
                        <div className="max-w-md mx-auto">
                            <div className="bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Select an Assembly</h3>
                            <p className="text-gray-500">Choose a district and assembly to manage sub-levels</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6">
                            <div className="flex justify-between items-center">
                                <div className="text-white">
                                    <h2 className="text-2xl font-bold">{selectedAssembly.location_name}</h2>
                                    <p className="text-teal-100 text-sm mt-1">
                                        {currentParent ? `Child of: ${currentParent.displayName}` : "Root Levels"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setFormData({ levelName: currentPanel?.name || "", displayName: "", parentId: currentParent?.id || null });
                                        setShowCreateModal(true);
                                    }}
                                    className="flex items-center px-5 py-2.5 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-all font-semibold shadow-md"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Create Level
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {dataLoading ? (
                                <div className="p-12 text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-teal-600 mx-auto"></div>
                                </div>
                            ) : filteredLevelData.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-gray-500">No levels found. Create one to get started.</p>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Level Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Display Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Parent</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredLevelData.map((data) => {
                                            const parent = levelData.find(l => l.id === data.parentId);
                                            return (
                                                <tr key={data.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{data.levelName}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{data.displayName}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {parent ? parent.displayName : "Root"}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${data.isActive === 1
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                            }`}>
                                                            {data.isActive === 1 ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => openEditModal(data)}
                                                                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleToggleActive(data.id, data.isActive)}
                                                                className={`px-3 py-1 rounded-lg transition-colors ${data.isActive === 1
                                                                    ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                                                    : "bg-green-500 text-white hover:bg-green-600"
                                                                    }`}
                                                            >
                                                                {data.isActive === 1 ? "Deactivate" : "Activate"}
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal(data.id, data.displayName)}
                                                                className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Create Sub-Level</h3>
                        {formData?.parentId && (() => {
                            const parent = levelData.find(l => l.id === formData.parentId);
                            return parent ? (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-600 mt-1">
                                        <span className="font-semibold">Assembly:</span> {parent?.assemblyName || selectedAssembly?.location_name || "Inherited"}
                                    </p>
                                    <p className="text-sm text-blue-800">
                                        <span className="font-semibold">Parent:</span> {parent?.displayName}
                                    </p>
                                </div>
                            ) : null;
                        })()}
                        {!formData.parentId && selectedAssembly && (
                            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">
                                    <span className="font-semibold">Creating root level for:</span> {selectedAssembly?.location_name}
                                </p>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Level Name</label>
                                <input
                                    type="text"
                                    value={formData.levelName}
                                    readOnly
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                    placeholder="e.g., Mandal, Booth"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="e.g., Mandal 1, Booth A"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Parent Level</label>
                                <select
                                    value={formData.parentId || ""}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed appearance-none"
                                >
                                    <option value="">-- Root Level (No Parent) --</option>
                                    {levelData.map((level) => (
                                        <option key={level.id} value={level.id}>
                                            {level.displayName} ({level.levelName})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setFormData({ levelName: currentPanel?.name || "", displayName: "", parentId: null });
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Sub-Level</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Level Name</label>
                                <input
                                    type="text"
                                    value={formData.levelName}
                                    readOnly
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Parent Level</label>
                                <select
                                    value={formData.parentId || ""}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed appearance-none"
                                >
                                    <option value="">-- Root Level (No Parent) --</option>
                                    {levelData.filter(l => l.id !== editingData?.id).map((level) => (
                                        <option key={level.id} value={level.id}>
                                            {level.displayName} ({level.levelName})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingData(null);
                                    setFormData({ levelName: "", displayName: "", parentId: null });
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null, name: "" })}
                onConfirm={handleDelete}
                title="Delete Level"
                message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
}
