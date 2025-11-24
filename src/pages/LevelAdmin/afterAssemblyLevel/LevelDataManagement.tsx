import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import toast from "react-hot-toast";
import { fetchHierarchyChildren } from "../../../services/hierarchyApi";
import {
    fetchAfterAssemblyDataByAssembly,
    createAfterAssemblyData,
    updateAfterAssemblyData,
    deleteAfterAssemblyData,
    activateAfterAssemblyData,
    deactivateAfterAssemblyData,
    type AfterAssemblyData,
} from "../../../services/afterAssemblyApi";
import type { HierarchyChild } from "../../../types/hierarchy";
import ConfirmationModal from "../../../components/ConfirmationModal";

export default function LevelDataManagement() {
    const { levelId } = useParams<{ levelId: string }>();
    const { levelAdminPanels } = useAppSelector((state) => state.auth);

    const [districts, setDistricts] = useState<HierarchyChild[]>([]);
    const [assemblies, setAssemblies] = useState<HierarchyChild[]>([]);
    const [levelData, setLevelData] = useState<AfterAssemblyData[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<HierarchyChild | null>(null);
    const [selectedAssembly, setSelectedAssembly] = useState<HierarchyChild | null>(null);

    const [loading, setLoading] = useState(true);
    const [assembliesLoading, setAssembliesLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingData, setEditingData] = useState<AfterAssemblyData | null>(null);

    const [formData, setFormData] = useState({
        levelName: "",
        displayName: "",
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

    // Load level data when assembly is selected
    useEffect(() => {
        const loadLevelData = async () => {
            if (!selectedAssembly) {
                setLevelData([]);
                return;
            }

            try {
                setDataLoading(true);
                const response = await fetchAfterAssemblyDataByAssembly(selectedAssembly.location_id);

                if (response.success) {
                    setLevelData(response.data);
                }
            } catch (error) {
                toast.error("Failed to load level data");
            } finally {
                setDataLoading(false);
            }
        };

        loadLevelData();
    }, [selectedAssembly]);

    // Handle create
    const handleCreate = async () => {
        if (!selectedAssembly || !currentPanel) return;
        if (!formData.levelName || !formData.displayName) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            // Remove spaces from levelName
            const levelNameWithoutSpaces = formData.levelName.replace(/\s+/g, '');

            const response = await createAfterAssemblyData({
                levelName: levelNameWithoutSpaces,
                displayName: formData.displayName,
                partyLevelId: currentPanel.id,
                parentId: null,
                parentAssemblyId: selectedAssembly.location_id,
            });

            if (response.success) {
                toast.success("Level data created successfully");
                setShowCreateModal(false);
                setFormData({ levelName: "", displayName: "" });

                // Reload data
                const updatedResponse = await fetchAfterAssemblyDataByAssembly(selectedAssembly.location_id);
                if (updatedResponse.success) {
                    setLevelData(updatedResponse.data);
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create level data");
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
            // Remove spaces from levelName
            const levelNameWithoutSpaces = formData.levelName.replace(/\s+/g, '');

            const response = await updateAfterAssemblyData(editingData.id, {
                levelName: levelNameWithoutSpaces,
                displayName: formData.displayName,
            });

            if (response.success) {
                toast.success("Level data updated successfully");
                setShowEditModal(false);
                setEditingData(null);
                setFormData({ levelName: "", displayName: "" });

                // Reload data
                if (selectedAssembly) {
                    const updatedResponse = await fetchAfterAssemblyDataByAssembly(selectedAssembly.location_id);
                    if (updatedResponse.success) {
                        setLevelData(updatedResponse.data);
                    }
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update level data");
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deleteModal.id || !selectedAssembly) return;

        try {
            const response = await deleteAfterAssemblyData(deleteModal.id);

            if (response.success) {
                toast.success("Level data deleted successfully");
                setDeleteModal({ isOpen: false, id: null, name: "" });

                // Reload data
                const updatedResponse = await fetchAfterAssemblyDataByAssembly(selectedAssembly.location_id);
                if (updatedResponse.success) {
                    setLevelData(updatedResponse.data);
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete level data");
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
                toast.success(`Level data ${isActive === 1 ? "deactivated" : "activated"} successfully`);

                // Reload data
                const updatedResponse = await fetchAfterAssemblyDataByAssembly(selectedAssembly.location_id);
                if (updatedResponse.success) {
                    setLevelData(updatedResponse.data);
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to toggle status");
        }
    };

    // Open edit modal
    const openEditModal = (data: AfterAssemblyData) => {
        setEditingData(data);
        setFormData({
            levelName: data.levelName,
            displayName: data.displayName,
        });
        setShowEditModal(true);
    };

    // Open delete modal
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

    const filteredDistricts = districts.filter((d) =>
        d.location_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAssemblies = assemblies.filter((a) =>
        a.location_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredLevelData = levelData.filter((l) =>
        l.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.levelName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                    <h1 className="text-3xl font-bold text-gray-800">Level Data Management</h1>
                    <p className="text-gray-600 mt-2">
                        Create and manage sub-levels for assemblies in {currentPanel.metadata?.stateName}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search districts, assemblies, or levels..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Districts */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                            <h2 className="text-lg font-bold text-white">Districts</h2>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600 mx-auto"></div>
                                </div>
                            ) : filteredDistricts.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No districts found</div>
                            ) : (
                                filteredDistricts.map((district) => (
                                    <button
                                        key={district.location_id}
                                        onClick={() => {
                                            setSelectedDistrict(district);
                                            setSelectedAssembly(null);
                                        }}
                                        className={`w-full p-4 text-left border-b border-gray-100 hover:bg-blue-50 transition-all ${selectedDistrict?.location_id === district.location_id
                                            ? "bg-blue-50 border-l-4 border-l-blue-500"
                                            : "border-l-4 border-l-transparent"
                                            }`}
                                    >
                                        <p className={`font-semibold ${selectedDistrict?.location_id === district.location_id
                                            ? "text-blue-700"
                                            : "text-gray-900"
                                            }`}>
                                            {district.location_name}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Assemblies */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4">
                            <h2 className="text-lg font-bold text-white">Assemblies</h2>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto">
                            {!selectedDistrict ? (
                                <div className="p-8 text-center text-gray-500">Select a district</div>
                            ) : assembliesLoading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-indigo-600 mx-auto"></div>
                                </div>
                            ) : filteredAssemblies.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No assemblies found</div>
                            ) : (
                                filteredAssemblies.map((assembly) => (
                                    <button
                                        key={assembly.location_id}
                                        onClick={() => setSelectedAssembly(assembly)}
                                        className={`w-full p-4 text-left border-b border-gray-100 hover:bg-indigo-50 transition-all ${selectedAssembly?.location_id === assembly.location_id
                                            ? "bg-indigo-50 border-l-4 border-l-indigo-500"
                                            : "border-l-4 border-l-transparent"
                                            }`}
                                    >
                                        <p className={`font-semibold ${selectedAssembly?.location_id === assembly.location_id
                                            ? "text-indigo-700"
                                            : "text-gray-900"
                                            }`}>
                                            {assembly.location_name}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Level Data */}
                <div className="lg:col-span-6">
                    {!selectedAssembly ? (
                        <div className="bg-white rounded-xl shadow-lg p-16 text-center border border-gray-100">
                            <div className="max-w-md mx-auto">
                                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Select an Assembly</h3>
                                <p className="text-gray-500">Choose a district and assembly to manage level data</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
                                <div className="flex justify-between items-center">
                                    <div className="text-white">
                                        <h2 className="text-2xl font-bold">{selectedAssembly.location_name}</h2>
                                        <p className="text-purple-100 text-sm mt-1">{selectedDistrict?.location_name}</p>
                                    </div>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="flex items-center px-5 py-2.5 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-all font-semibold shadow-md"
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
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto"></div>
                                    </div>
                                ) : filteredLevelData.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <p className="text-gray-500">No level data found. Create one to get started.</p>
                                    </div>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Level Name</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Display Name</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Party Level</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredLevelData.map((data) => (
                                                <tr key={data.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{data.levelName}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{data.displayName}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{data.partyLevelName}</td>
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
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Create Level Data</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Level Name</label>
                                <input
                                    type="text"
                                    value={formData.levelName}
                                    onChange={(e) => setFormData({ ...formData, levelName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="e.g., Block, Mandal"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="e.g., Block 1, Mandal A"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setFormData({ levelName: "", displayName: "" });
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Level Data</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Level Name</label>
                                <input
                                    type="text"
                                    value={formData.levelName}
                                    onChange={(e) => setFormData({ ...formData, levelName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingData(null);
                                    setFormData({ levelName: "", displayName: "" });
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
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
                title="Delete Level Data"
                message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
}
