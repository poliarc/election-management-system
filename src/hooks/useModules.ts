import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { moduleApi, moduleAccessApi, sidebarApi, type Module, type ModuleAccess } from '../services/moduleApi';

export function useModules() {
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchModules = async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        isActive?: boolean;
    }) => {
        try {
            setLoading(true);
            setError(null);
            const response = await moduleApi.getAllModules(params);

            if (response.data.success) {
                setModules(response.data.data);
                return response.data;
            } else {
                throw new Error(response.data.message);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch modules';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveModules = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await moduleApi.getActiveModules();

            if (response.data.success) {
                setModules(response.data.data);
                return response.data.data;
            } else {
                throw new Error(response.data.message);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch active modules';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createModule = async (data: {
        moduleName: string;
        displayName: string;
        isActive?: boolean;
        isDefault?: boolean;
    }) => {
        try {
            const response = await moduleApi.createModule(data);
            if (response.data.success) {
                toast.success('Module created successfully');
                return response.data.data;
            } else {
                throw new Error(response.data.message);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create module';
            toast.error(errorMessage);
            throw err;
        }
    };

    const updateModule = async (id: number, data: {
        displayName?: string;
        isDefault?: boolean;
    }) => {
        try {
            const response = await moduleApi.updateModule(id, data);
            if (response.data.success) {
                toast.success('Module updated successfully');
                return response.data.data;
            } else {
                throw new Error(response.data.message);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update module';
            toast.error(errorMessage);
            throw err;
        }
    };

    const toggleModuleStatus = async (id: number, currentStatus: boolean) => {
        try {
            const response = currentStatus
                ? await moduleApi.deactivateModule(id)
                : await moduleApi.activateModule(id);

            if (response.data.success) {
                toast.success(`Module ${currentStatus ? 'deactivated' : 'activated'} successfully`);
                return response.data.data;
            } else {
                throw new Error(response.data.message);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to toggle module status';
            toast.error(errorMessage);
            throw err;
        }
    };

    const deleteModule = async (id: number) => {
        try {
            await moduleApi.deleteModule(id);
            toast.success('Module deleted successfully');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to delete module';
            toast.error(errorMessage);
            throw err;
        }
    };

    return {
        modules,
        loading,
        error,
        fetchModules,
        fetchActiveModules,
        createModule,
        updateModule,
        toggleModuleStatus,
        deleteModule,
    };
}

export function useModuleAccess() {
    const [moduleAccess, setModuleAccess] = useState<ModuleAccess[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchModuleAccess = async (params?: {
        page?: number;
        limit?: number;
        state_id?: number;
        party_id?: number;
    }) => {
        try {
            setLoading(true);
            setError(null);
            const response = await moduleAccessApi.getAllAccess(params);

            if (response.data.success) {
                setModuleAccess(response.data.data);
                return response.data;
            } else {
                throw new Error(response.data.message);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch module access';
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createModuleAccess = async (data: {
        module_id: number;
        state_id: number;
        party_id: number;
        party_level_id: number;
        isDisplay?: boolean;
        isActive?: boolean;
    }) => {
        try {
            const response = await moduleAccessApi.createAccess(data);
            if (response.data.success) {
                toast.success('Module access created successfully');
                return response.data.data;
            } else {
                throw new Error(response.data.message);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to create module access';
            toast.error(errorMessage);
            throw err;
        }
    };

    const updateModuleAccess = async (id: number, data: {
        isDisplay?: boolean;
        isActive?: boolean;
    }) => {
        try {
            const response = await moduleAccessApi.updateAccess(id, data);
            if (response.data.success) {
                toast.success('Module access updated successfully');
                return response.data.data;
            } else {
                throw new Error(response.data.message);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update module access';
            toast.error(errorMessage);
            throw err;
        }
    };

    const toggleAccessStatus = async (id: number, currentStatus: boolean) => {
        try {
            const response = currentStatus
                ? await moduleAccessApi.deactivateAccess(id)
                : await moduleAccessApi.activateAccess(id);

            if (response.data.success) {
                toast.success(`Module access ${currentStatus ? 'deactivated' : 'activated'} successfully`);
                return response.data.data;
            } else {
                throw new Error(response.data.message);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to toggle access status';
            toast.error(errorMessage);
            throw err;
        }
    };

    const deleteModuleAccess = async (id: number) => {
        try {
            await moduleAccessApi.deleteAccess(id);
            toast.success('Module access deleted successfully');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to delete module access';
            toast.error(errorMessage);
            throw err;
        }
    };

    return {
        moduleAccess,
        loading,
        error,
        fetchModuleAccess,
        createModuleAccess,
        updateModuleAccess,
        toggleAccessStatus,
        deleteModuleAccess,
    };
}

export function useSidebarModules() {
    const [sidebarModules, setSidebarModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSidebarModules = async (params: {
        state_id: number;
        party_id: number;
        party_level_id: number;
    }) => {
        try {
            setLoading(true);
            setError(null);
            const response = await sidebarApi.getSidebarModules(params);

            if (response.data.success) {
                setSidebarModules(response.data.data);
                return response.data.data;
            } else {
                throw new Error(response.data.message);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch sidebar modules';
            setError(errorMessage);
            console.error('Error fetching sidebar modules:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        sidebarModules,
        loading,
        error,
        fetchSidebarModules,
    };
}