import { useState, useEffect } from 'react';
import {
    externalApi,
    type ModuleAccess,
    type Module,
    type State,
    type Party,
    type PartyLevel
} from '../../../services/moduleApi';
import { useModules, useModuleAccess } from '../../../hooks/useModules';
import { ModuleStatusBadge } from '../../../components/ModuleStatusBadge';
import { ToggleButton } from '../../../components/ToggleButton';
import ConfirmationModal from '../../../components/ConfirmationModal';

interface CreateAccessData {
    module_id: number;
    state_id: number;
    party_id: number;
    party_level_id: number;
    isDisplay: boolean;
    isActive: boolean;
}

export function ModuleAccessPage() {
    const { fetchActiveModules } = useModules();
    const {
        moduleAccess,
        loading,
        fetchModuleAccess,
        createModuleAccess,
        updateModuleAccess,
        toggleAccessStatus,
        deleteModuleAccess
    } = useModuleAccess();

    const [modules, setModules] = useState<Module[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [parties, setParties] = useState<Party[]>([]);
    const [allParties, setAllParties] = useState<Party[]>([]);
    const [partyLevels, setPartyLevels] = useState<PartyLevel[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAccess, setEditingAccess] = useState<ModuleAccess | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [accessToDelete, setAccessToDelete] = useState<ModuleAccess | null>(null);
    const [partyPage, setPartyPage] = useState(1);
    const [partyHasMore, setPartyHasMore] = useState(true);
    const [loadingParties, setLoadingParties] = useState(false);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });

    const [filters, setFilters] = useState({
        state_id: undefined as number | undefined,
        party_id: undefined as number | undefined,
    });

    const [formData, setFormData] = useState<CreateAccessData>({
        module_id: 0,
        state_id: 0,
        party_id: 0,
        party_level_id: 0,
        isDisplay: true,
        isActive: true,
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        loadModuleAccess();
    }, [pagination.page, filters]);

    useEffect(() => {
        if (formData.party_id > 0 && formData.state_id > 0) {
            fetchPartyLevels(formData.party_id, formData.state_id);
        } else {
            setPartyLevels([]);
        }
    }, [formData.party_id, formData.state_id]);

    const fetchInitialData = async () => {
        try {
            const [modulesRes, statesRes] = await Promise.all([
                fetchActiveModules(),
                externalApi.getStates(),
            ]);

            if (modulesRes) {
                setModules(modulesRes);
            }
            if (statesRes.data.success) {
                setStates(statesRes.data.data);
            }

            // Load initial parties
            await loadMoreParties(true);
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    };

    const loadMoreParties = async (reset = false) => {
        try {
            setLoadingParties(true);
            const currentPage = reset ? 1 : partyPage;
            const partiesRes = await externalApi.getParties({ page: currentPage, limit: 10 });

            if (partiesRes.data.success) {
                const newParties = partiesRes.data.data;
                const hasMore = partiesRes.data.pagination.page < partiesRes.data.pagination.totalPages;

                if (reset) {
                    setParties(newParties);
                    setAllParties(newParties);
                    setPartyPage(2);
                } else {
                    const updatedParties = [...allParties, ...newParties];
                    setParties(updatedParties);
                    setAllParties(updatedParties);
                    setPartyPage(currentPage + 1);
                }

                setPartyHasMore(hasMore);
            }
        } catch (error) {
            console.error('Error loading parties:', error);
        } finally {
            setLoadingParties(false);
        }
    };

    const loadModuleAccess = async () => {
        try {
            const response = await fetchModuleAccess({
                page: pagination.page,
                limit: pagination.limit,
                state_id: filters.state_id,
                party_id: filters.party_id,
            });

            if (response?.pagination) {
                setPagination(prev => ({
                    ...prev,
                    ...response.pagination,
                }));
            }
        } catch (error) {
            console.error('Error loading module access:', error);
        }
    };

    const fetchPartyLevels = async (partyId: number, stateId: number) => {
        try {
            const response = await externalApi.getPartyLevelsByState(partyId, stateId);
            if (response.data.success) {
                setPartyLevels(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching party levels:', error);
            setPartyLevels([]);
        }
    };

    const handleCreateAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Set isDisplay to true by default since we removed the checkbox
            const accessData = {
                ...formData,
                isDisplay: true
            };
            await createModuleAccess(accessData);
            setShowCreateModal(false);
            resetForm();
            loadModuleAccess();
        } catch (error) {
            console.error('Error creating module access:', error);
        }
    };

    const handleUpdateAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAccess) return;

        try {
            // Update only the fields that the API supports for updates
            await updateModuleAccess(editingAccess.id, {
                isDisplay: true, // Always set to true since we removed the checkbox
                isActive: formData.isActive,
            });
            setEditingAccess(null);
            setShowCreateModal(false);
            resetForm();
            loadModuleAccess();
        } catch (error) {
            console.error('Error updating module access:', error);
        }
    };

    const handleToggleStatus = async (access: ModuleAccess) => {
        try {
            await toggleAccessStatus(access.id, Boolean(access.isActive));
            loadModuleAccess();
        } catch (error) {
            console.error('Error toggling access status:', error);
        }
    };

    const handleDeleteClick = (access: ModuleAccess) => {
        setAccessToDelete(access);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!accessToDelete) return;

        try {
            await deleteModuleAccess(accessToDelete.id);
            setShowDeleteModal(false);
            setAccessToDelete(null);
            loadModuleAccess();
        } catch (error) {
            console.error('Error deleting module access:', error);
        }
    };

    const openEditModal = (access: ModuleAccess) => {
        setEditingAccess(access);
        setFormData({
            module_id: access.module_id,
            state_id: access.state_id,
            party_id: access.party_id,
            party_level_id: access.party_level_id,
            isDisplay: Boolean(access.isDisplay),
            isActive: Boolean(access.isActive),
        });
        fetchPartyLevels(access.party_id, access.state_id);
        setShowCreateModal(true);
    };

    const resetForm = () => {
        setFormData({
            module_id: 0,
            state_id: 0,
            party_id: 0,
            party_level_id: 0,
            isDisplay: true,
            isActive: true,
        });
        setPartyLevels([]);
        // Reset party pagination when closing modal
        setPartyPage(1);
        setPartyHasMore(true);
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setEditingAccess(null);
        resetForm();
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Module Access Management</h1>
                <p className="text-gray-600">Manage module access for different parties and levels</p>
            </div>

            {/* Filters and Actions */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-4">
                    <select
                        value={filters.state_id || ''}
                        onChange={(e) => setFilters(prev => ({
                            ...prev,
                            state_id: e.target.value ? Number(e.target.value) : undefined
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All States</option>
                        {states.map((state) => (
                            <option key={state.id} value={state.id}>
                                {state.levelName}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.party_id || ''}
                        onChange={(e) => setFilters(prev => ({
                            ...prev,
                            party_id: e.target.value ? Number(e.target.value) : undefined
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Parties</option>
                        {parties.map((party) => (
                            <option key={party.party_id} value={party.party_id}>
                                {party.partyName}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    Create Access
                </button>
            </div>

            {/* Module Access Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Module
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    State
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Party
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Level
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Display
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Toggle Status
                                </th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : moduleAccess.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                        No module access found
                                    </td>
                                </tr>
                            ) : (
                                moduleAccess.map((access) => (
                                    <tr key={access.id}>
                                        <td className="px-3 py-4 text-sm font-medium text-gray-900">
                                            <div className="truncate max-w-[120px]" title={access.moduleDisplayName || access.moduleName}>
                                                {access.moduleDisplayName || access.moduleName}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-sm text-gray-500">
                                            <div className="truncate max-w-[100px]" title={access.state_name}>
                                                {access.state_name}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-sm text-gray-500">
                                            <div className="truncate max-w-[100px]" title={access.partyName}>
                                                {access.partyName}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4 text-sm text-gray-500">
                                            <div className="truncate max-w-[100px]" title={access.display_level_name || access.level_name}>
                                                {access.display_level_name || access.level_name}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <ModuleStatusBadge isDisplay={Boolean(access.isDisplay)} type="display" />
                                        </td>
                                        <td className="px-3 py-4">
                                            <ModuleStatusBadge isActive={Boolean(access.isActive)} type="status" />
                                        </td>
                                        <td className="px-3 py-4">
                                            <ToggleButton
                                                isActive={Boolean(access.isActive)}
                                                onToggle={() => handleToggleStatus(access)}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => openEditModal(access)}
                                                    className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteClick(access)}
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-semibold mb-4">
                            {editingAccess ? 'Edit Module Access' : 'Create Module Access'}
                        </h2>
                        <form onSubmit={editingAccess ? handleUpdateAccess : handleCreateAccess}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Module
                                </label>
                                <select
                                    value={formData.module_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, module_id: Number(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value={0}>Select Module</option>
                                    {modules.map((module) => (
                                        <option key={module.module_id} value={module.module_id}>
                                            {module.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    State
                                </label>
                                <select
                                    value={formData.state_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, state_id: Number(e.target.value), party_level_id: 0 }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value={0}>Select State</option>
                                    {states.map((state) => (
                                        <option key={state.id} value={state.id}>
                                            {state.levelName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Party
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.party_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, party_id: Number(e.target.value), party_level_id: 0 }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value={0}>Select Party</option>
                                        {parties.map((party) => (
                                            <option key={party.party_id} value={party.party_id}>
                                                {party.partyName}
                                            </option>
                                        ))}
                                    </select>
                                    {partyHasMore && !editingAccess && (
                                        <button
                                            type="button"
                                            onClick={() => loadMoreParties()}
                                            disabled={loadingParties}
                                            className="mt-2 w-full px-3 py-2 text-sm text-indigo-600 border border-indigo-300 rounded-md hover:bg-indigo-50 disabled:opacity-50"
                                        >
                                            {loadingParties ? 'Loading...' : 'Load More Parties'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Party Level
                                </label>
                                <select
                                    value={formData.party_level_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, party_level_id: Number(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    disabled={!formData.state_id || !formData.party_id}
                                    required
                                >
                                    <option value={0}>
                                        {!formData.state_id || !formData.party_id
                                            ? 'Select State and Party first'
                                            : 'Select Party Level'}
                                    </option>
                                    {partyLevels.map((level) => (
                                        <option key={level.party_wise_id} value={level.party_wise_id}>
                                            {level.display_level_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-6">
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
                                    {editingAccess ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                title="Delete Module Access"
                message="Are you sure you want to delete this module access? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteConfirm}
                onClose={() => {
                    setShowDeleteModal(false);
                    setAccessToDelete(null);
                }}
                type="danger"
            />
        </div>
    );
}