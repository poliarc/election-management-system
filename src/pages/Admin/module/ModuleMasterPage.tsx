import { useState, useEffect } from 'react';
import { useModules } from '../../../hooks/useModules';
import { ModuleStatusBadge } from '../../../components/ModuleStatusBadge';
import { ToggleButton } from '../../../components/ToggleButton';
import ConfirmationModal from '../../../components/ConfirmationModal';
import type { Module } from '../../../services/moduleApi';

interface CreateModuleData {
    moduleName: string;
    displayName: string;
    isActive: boolean;
    isDefault: boolean;
}

export function ModuleMasterPage() {
    const {
        modules,
        loading,
        fetchModules,
        createModule,
        updateModule,
        toggleModuleStatus,
        deleteModule
    } = useModules();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });

    const [filters, setFilters] = useState({
        search: '',
        isActive: undefined as boolean | undefined,
    });

    const [formData, setFormData] = useState<CreateModuleData>({
        moduleName: '',
        displayName: '',
        isActive: true,
        isDefault: false,
    });

    useEffect(() => {
        loadModules();
    }, [pagination.page, filters]);

    const loadModules = async () => {
        try {
            const response = await fetchModules({
                page: pagination.page,
                limit: pagination.limit,
                search: filters.search || undefined,
                isActive: filters.isActive,
            });

            if (response?.pagination) {
                setPagination(prev => ({
                    ...prev,
                    ...response.pagination,
                }));
            }
        } catch (error) {
            console.error('Error loading modules:', error);
        }
    };

    const handleCreateModule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createModule(formData);
            setShowCreateModal(false);
            resetForm();
            loadModules();
        } catch (error) {
            console.error('Error creating module:', error);
        }
    };

    const handleUpdateModule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingModule) return;

        try {
            await updateModule(editingModule.module_id, {
                displayName: formData.displayName,
                isDefault: formData.isDefault,
            });
            setEditingModule(null);
            setShowCreateModal(false);
            resetForm();
            loadModules();
        } catch (error) {
            console.error('Error updating module:', error);
        }
    };

    const handleToggleStatus = async (module: Module) => {
        try {
            await toggleModuleStatus(module.module_id, Boolean(module.isActive));
            loadModules();
        } catch (error) {
            console.error('Error toggling module status:', error);
        }
    };

    const handleDeleteClick = (module: Module) => {
        setModuleToDelete(module);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!moduleToDelete) return;

        try {
            await deleteModule(moduleToDelete.module_id);
            setShowDeleteModal(false);
            setModuleToDelete(null);
            loadModules();
        } catch (error) {
            console.error('Error deleting module:', error);
        }
    };

    const openEditModal = (module: Module) => {
        setEditingModule(module);
        setFormData({
            moduleName: module.moduleName,
            displayName: module.displayName,
            isActive: Boolean(module.isActive),
            isDefault: Boolean(module.isDefault),
        });
        setShowCreateModal(true);
    };

    const resetForm = () => {
        setFormData({
            moduleName: '',
            displayName: '',
            isActive: true,
            isDefault: false,
        });
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setEditingModule(null);
        resetForm();
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Module Master</h1>
                <p className="text-gray-600">Manage system modules</p>
            </div>

            {/* Filters and Actions */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Search modules..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                        value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                        onChange={(e) => setFilters(prev => ({
                            ...prev,
                            isActive: e.target.value === '' ? undefined : e.target.value === 'true'
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    Create Module
                </button>
            </div>

            {/* Modules Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Module Name
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Display Name
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Default
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Toggle Status
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created At
                                </th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : modules.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                        No modules found
                                    </td>
                                </tr>
                            ) : (
                                modules.map((module) => (
                                    <tr key={module.module_id}>
                                        <td className="px-3 py-4 text-sm font-medium text-gray-900">
                                            <div className="truncate max-w-[150px]" title={module.moduleName}>
                                                {module.moduleName}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-sm text-gray-500">
                                            <div className="truncate max-w-[120px]" title={module.displayName}>
                                                {module.displayName}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <ModuleStatusBadge isActive={Boolean(module.isActive)} type="status" />
                                        </td>
                                        <td className="px-3 py-4">
                                            <ModuleStatusBadge isDefault={Boolean(module.isDefault)} type="default" />
                                        </td>
                                        <td className="px-3 py-4">
                                            <ToggleButton
                                                isActive={Boolean(module.isActive)}
                                                onToggle={() => handleToggleStatus(module)}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="px-3 py-4 text-sm text-gray-500">
                                            <div className="truncate max-w-[100px]" title={new Date(module.created_at).toLocaleDateString()}>
                                                {new Date(module.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => openEditModal(module)}
                                                    className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteClick(module)}
                                                    className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-gray-700">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} results
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1 bg-indigo-600 text-white rounded-md">
                            {pagination.page}
                        </span>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">
                            {editingModule ? 'Edit Module' : 'Create Module'}
                        </h2>
                        <form onSubmit={editingModule ? handleUpdateModule : handleCreateModule}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Module Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.moduleName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, moduleName: e.target.value }))}
                                    disabled={!!editingModule}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            {!editingModule && (
                                <div className="mb-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                            className="mr-2"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Active</span>
                                    </label>
                                </div>
                            )}
                            <div className="mb-6">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.isDefault}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                                        className="mr-2"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Default Module</span>
                                </label>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    {editingModule ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                title="Delete Module"
                message={`Are you sure you want to delete "${moduleToDelete?.moduleName}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteConfirm}
                onClose={() => {
                    setShowDeleteModal(false);
                    setModuleToDelete(null);
                }}
                type="danger"
            />
        </div>
    );
}