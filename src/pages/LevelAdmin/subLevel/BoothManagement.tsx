import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import toast from "react-hot-toast";
import { fetchHierarchyChildren } from "../../../services/hierarchyApi";
import { fetchAfterAssemblyDataByAssembly, type AfterAssemblyData } from "../../../services/afterAssemblyApi";
import type { HierarchyChild } from "../../../types/hierarchy";
import {
    createBoothLevelData,
    fetchBoothLevelDataByLevel,
    updateBoothLevelData,
    activateBoothLevelData,
    deactivateBoothLevelData,
    deleteBoothLevelData,
    type BoothLevelData,
} from "../../../services/boothApi";
import ConfirmationModal from "../../../components/ConfirmationModal";

export default function BoothManagement() {
    const { levelId } = useParams<{ levelId: string }>();
    const { levelAdminPanels } = useAppSelector((state) => state.auth);

    const [districts, setDistricts] = useState<HierarchyChild[]>([]);
    const [assemblies, setAssemblies] = useState<HierarchyChild[]>([]);
    const [levelData, setLevelData] = useState<AfterAssemblyData[]>([]);
    const [boothData, setBoothData] = useState<BoothLevelData[]>([]);

    const [selectedDistrict, setSelectedDistrict] = useState<HierarchyChild | null>(null);
    const [selectedAssembly, setSelectedAssembly] = useState<HierarchyChild | null>(null);

    // Dynamic hierarchy path
    const [hierarchyPath, setHierarchyPath] = useState<AfterAssemblyData[]>([]);
    const [levelOptions, setLevelOptions] = useState<AfterAssemblyData[][]>([]);

    const [loading, setLoading] = useState(true);
    const [assembliesLoading, setAssembliesLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [boothsLoading, setBoothsLoading] = useState(false);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingBooth, setEditingBooth] = useState<BoothLevelData | null>(null);

    const [formData, setFormData] = useState({
        boothFrom: "",
        boothTo: "",
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

    const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

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

    // Load assemblies
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

    // Load level data
    useEffect(() => {
        const loadLevelData = async () => {
            if (!selectedAssembly) {
                setLevelData([]);
                setHierarchyPath([]);
                setLevelOptions([]);
                return;
            }

            try {
                setDataLoading(true);
                const response = await fetchAfterAssemblyDataByAssembly(selectedAssembly.location_id);

                if (response.success) {
                    setLevelData(response.data);
                    const rootLevels = response.data.filter((l: AfterAssemblyData) => l.parentId === null);
                    setLevelOptions([rootLevels]);
                    setHierarchyPath([]);
                }
            } catch (error) {
                toast.error("Failed to load level data");
            } finally {
                setDataLoading(false);
            }
        };

        loadLevelData();
    }, [selectedAssembly]);

    // Load booth data when a level is selected
    useEffect(() => {
        const loadBoothData = async () => {
            const selectedLevel = hierarchyPath.length > 0 ? hierarchyPath[hierarchyPath.length - 1] : null;

            if (!selectedLevel) {
                setBoothData([]);
                return;
            }

            try {
                setBoothsLoading(true);
                const response = await fetchBoothLevelDataByLevel(selectedLevel.id);

                if (response.success) {
                    setBoothData(response.data);
                }
            } catch (error) {
                console.error("Failed to load booth data:", error);
                setBoothData([]);
            } finally {
                setBoothsLoading(false);
            }
        };

        loadBoothData();
    }, [hierarchyPath]);

    const handleLevelSelect = (levelIndex: number, selectedLevel: AfterAssemblyData | null) => {
        if (!selectedLevel) {
            setHierarchyPath(prev => prev.slice(0, levelIndex));
            setLevelOptions(prev => prev.slice(0, levelIndex + 1));
            return;
        }

        const newPath = [...hierarchyPath.slice(0, levelIndex), selectedLevel];
        setHierarchyPath(newPath);

        const children = levelData.filter(l => l.parentId === selectedLevel.id);
        if (children.length > 0) {
            setLevelOptions(prev => [...prev.slice(0, levelIndex + 1), children]);
        } else {
            setLevelOptions(prev => prev.slice(0, levelIndex + 1));
        }
    };

    const handleCreate = async () => {
        if (!currentPanel) return;
        const selectedLevel = hierarchyPath.length > 0 ? hierarchyPath[hierarchyPath.length - 1] : null;

        if (!selectedLevel) {
            toast.error("Please select a level");
            return;
        }

        if (!formData.boothFrom || !formData.boothTo) {
            toast.error("Please fill all fields");
            return;
        }

        const boothFrom = parseInt(formData.boothFrom);
        const boothTo = parseInt(formData.boothTo);

        if (boothFrom > boothTo) {
            toast.error("Booth From must be less than or equal to Booth To");
            return;
        }

        try {
            const response = await createBoothLevelData({
                parentLevelId: selectedLevel.id,
                boothFrom,
                boothTo,
                partyLevelId: currentPanel.id,
            });

            if (response.success) {
                toast.success("Booth data created successfully");
                setShowCreateModal(false);
                setFormData({ boothFrom: "", boothTo: "" });

                // Reload booth data
                const updatedResponse = await fetchBoothLevelDataByLevel(selectedLevel.id);
                if (updatedResponse.success) {
                    setBoothData(updatedResponse.data);
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create booth data");
        }
    };

    const handleUpdate = async () => {
        if (!editingBooth) return;

        if (!formData.boothFrom || !formData.boothTo) {
            toast.error("Please fill all fields");
            return;
        }

        const boothFrom = parseInt(formData.boothFrom);
        const boothTo = parseInt(formData.boothTo);

        if (boothFrom > boothTo) {
            toast.error("Booth From must be less than or equal to Booth To");
            return;
        }

        try {
            const response = await updateBoothLevelData(editingBooth.id, {
                boothFrom,
                boothTo,
            });

            if (response.success) {
                toast.success("Booth data updated successfully");
                setShowEditModal(false);
                setEditingBooth(null);
                setFormData({ boothFrom: "", boothTo: "" });

                // Reload booth data
                const selectedLevel = hierarchyPath.length > 0 ? hierarchyPath[hierarchyPath.length - 1] : null;
                if (selectedLevel) {
                    const updatedResponse = await fetchBoothLevelDataByLevel(selectedLevel.id);
                    if (updatedResponse.success) {
                        setBoothData(updatedResponse.data);
                    }
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update booth data");
        }
    };

    const handleToggleActive = async (booth: BoothLevelData) => {
        try {
            const response = booth.isActive
                ? await deactivateBoothLevelData(booth.id)
                : await activateBoothLevelData(booth.id);

            if (response.success) {
                toast.success(`Booth data ${booth.isActive ? "deactivated" : "activated"} successfully`);

                // Reload booth data
                const selectedLevel = hierarchyPath.length > 0 ? hierarchyPath[hierarchyPath.length - 1] : null;
                if (selectedLevel) {
                    const updatedResponse = await fetchBoothLevelDataByLevel(selectedLevel.id);
                    if (updatedResponse.success) {
                        setBoothData(updatedResponse.data);
                    }
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to toggle booth status");
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.id) return;

        try {
            const response = await deleteBoothLevelData(deleteModal.id);

            if (response.success) {
                toast.success("Booth data deleted successfully");
                setDeleteModal({ isOpen: false, id: null, name: "" });

                // Reload booth data
                const selectedLevel = hierarchyPath.length > 0 ? hierarchyPath[hierarchyPath.length - 1] : null;
                if (selectedLevel) {
                    const updatedResponse = await fetchBoothLevelDataByLevel(selectedLevel.id);
                    if (updatedResponse.success) {
                        setBoothData(updatedResponse.data);
                    }
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete booth data");
        }
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

    const selectedLevel = hierarchyPath.length > 0 ? hierarchyPath[hierarchyPath.length - 1] : null;

    return (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <h1 className="text-3xl font-bold text-gray-800">Manage Booths</h1>
                    <p className="text-gray-600 mt-2">
                        Create and manage booth data for {currentPanel.metadata?.stateName}
                    </p>
                </div>
            </div>

            {/* Selection Dropdowns */}
            <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* District Select */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            {districts.map((district) => (
                                <option key={district.location_id} value={district.location_id}>
                                    {district.location_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Assembly Select */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                            {assemblies.map((assembly) => (
                                <option key={assembly.location_id} value={assembly.location_id}>
                                    {assembly.location_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Dynamic Hierarchy Selects */}
                {selectedAssembly && levelOptions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {levelOptions.map((options, index) => {
                            const selectedValue = hierarchyPath[index]?.id || "";
                            const levelLabel = index === 0 ? "Root Level" : `Level ${index + 1}`;

                            return (
                                <div key={index}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        {levelLabel}
                                    </label>
                                    <select
                                        value={selectedValue}
                                        onChange={(e) => {
                                            const level = options.find(l => l.id === Number(e.target.value));
                                            handleLevelSelect(index, level || null);
                                        }}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white"
                                    >
                                        <option value="">-- Select {levelLabel} --</option>
                                        {options.map((level) => (
                                            <option key={level.id} value={level.id}>
                                                {level.displayName} ({level.levelName})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Loading States */}
                {(loading || assembliesLoading || dataLoading) && (
                    <div className="mt-4 flex items-center justify-center text-gray-500">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm">Loading...</span>
                    </div>
                )}
            </div>

            {/* Booth Data Section */}
            {selectedLevel && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
                        <div className="flex justify-between items-center">
                            <div className="text-white">
                                <h2 className="text-2xl font-bold">Booth Data</h2>
                                <p className="text-blue-100 text-sm mt-1">
                                    {selectedLevel.displayName} ({selectedLevel.levelName})
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setFormData({ boothFrom: "", boothTo: "" });
                                    setShowCreateModal(true);
                                }}
                                className="flex items-center px-5 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-semibold shadow-md"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create Booth Data
                            </button>
                        </div>
                    </div>

                    {boothsLoading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Booth Range</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Total Booths</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {boothData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <p className="text-gray-500">No booth data found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        boothData.map((booth) => (
                                            <tr key={booth.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-900">{booth.id}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {booth.boothFrom} - {booth.boothTo}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {booth.boothNumbers?.length || (booth.boothTo - booth.boothFrom + 1)}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booth.isActive
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                        }`}>
                                                        {booth.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingBooth(booth);
                                                                setFormData({
                                                                    boothFrom: booth.boothFrom.toString(),
                                                                    boothTo: booth.boothTo.toString(),
                                                                });
                                                                setShowEditModal(true);
                                                            }}
                                                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleActive(booth)}
                                                            className={`px-3 py-1 rounded-lg transition-colors ${booth.isActive
                                                                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                                                : "bg-green-500 text-white hover:bg-green-600"
                                                                }`}
                                                        >
                                                            {booth.isActive ? "Deactivate" : "Activate"}
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteModal({
                                                                isOpen: true,
                                                                id: booth.id,
                                                                name: `Booth ${booth.boothFrom}-${booth.boothTo}`,
                                                            })}
                                                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Create Booth Data</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Booth From</label>
                                <input
                                    type="number"
                                    value={formData.boothFrom}
                                    onChange={(e) => setFormData({ ...formData, boothFrom: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Booth To</label>
                                <input
                                    type="number"
                                    value={formData.boothTo}
                                    onChange={(e) => setFormData({ ...formData, boothTo: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., 12"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCreate}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setFormData({ boothFrom: "", boothTo: "" });
                                }}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingBooth && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Booth Data</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Booth From</label>
                                <input
                                    type="number"
                                    value={formData.boothFrom}
                                    onChange={(e) => setFormData({ ...formData, boothFrom: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Booth To</label>
                                <input
                                    type="number"
                                    value={formData.boothTo}
                                    onChange={(e) => setFormData({ ...formData, boothTo: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleUpdate}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                            >
                                Update
                            </button>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingBooth(null);
                                    setFormData({ boothFrom: "", boothTo: "" });
                                }}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                            >
                                Cancel
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
                title="Delete Booth Data"
                message={`Are you sure you want to delete ${deleteModal.name}? This action cannot be undone.`}
            />
        </div>
    );
}
