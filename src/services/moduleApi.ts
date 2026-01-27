import { apiClient } from './api';

// Types
export interface Module {
    module_id: number;
    moduleName: string;
    displayName: string;
    isActive: number;
    isDelete: number;
    isDefault: number;
    created_at: string;
    updated_at: string;
}

export interface ModuleAccess {
    id: number;
    module_id: number;
    state_id: number;
    party_id: number;
    party_level_id: number;
    isDisplay: number;
    isActive: number;
    isDelete: number;
    created_at: string;
    updated_at: string;
    moduleName?: string;
    moduleDisplayName?: string;
    state_name?: string;
    partyName?: string;
    level_name?: string;
    display_level_name?: string;
}

export interface State {
    id: number;
    levelName: string;
    levelType: string;
    ParentId: number | null;
    isActive: number;
    isDelete: number;
    created_at: string;
    updated_at: string;
}

export interface Party {
    party_id: number;
    partyName: string;
    partyCode: string;
    party_type_id: number;
    adminId: number;
    party_type_name: string;
    admin_name: string;
    admin_email: string;
    isActive: number;
    isDelete: number;
    created_at: string;
    updated_at: string;
}

export interface PartyLevel {
    party_wise_id: number;
    level_name: string;
    display_level_name: string;
    parent_level: number | null;
    party_id: number;
    party_level_admin_id: number;
    state_id: number;
    isActive: number;
    isDelete: number;
    created_at: string;
    updated_at: string;
    party_name: string;
    admin_name: string;
    admin_email: string;
    state_name: string;
    parent_level_name: string | null;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Module Master APIs
export const moduleApi = {
    // Create module
    createModule: (data: {
        moduleName: string;
        displayName: string;
        isActive?: boolean;
        isDefault?: boolean;
    }) => apiClient.post<ApiResponse<Module>>('/modules/master/create', data),

    // Get all modules with pagination and filters
    getAllModules: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        isActive?: boolean;
    }) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

        return apiClient.get<ApiResponse<Module[]>>(`/modules/master/all?${queryParams.toString()}`);
    },

    // Get active modules
    getActiveModules: () => apiClient.get<ApiResponse<Module[]>>('/modules/master/active'),

    // Get module by ID
    getModuleById: (id: number) => apiClient.get<ApiResponse<Module>>(`/modules/master/${id}`),

    // Update module
    updateModule: (id: number, data: {
        displayName?: string;
        isDefault?: boolean;
    }) => apiClient.put<ApiResponse<Module>>(`/modules/master/${id}`, data),

    // Activate module
    activateModule: (id: number) => apiClient.patch<ApiResponse<Module>>(`/modules/master/${id}/activate`),

    // Deactivate module
    deactivateModule: (id: number) => apiClient.patch<ApiResponse<Module>>(`/modules/master/${id}/deactivate`),

    // Delete module
    deleteModule: (id: number) => apiClient.delete<ApiResponse<void>>(`/modules/master/${id}`),
};

// Module Access APIs
export const moduleAccessApi = {
    // Create module access
    createAccess: (data: {
        module_id: number;
        state_id: number;
        party_id: number;
        party_level_id: number;
        isDisplay?: boolean;
        isActive?: boolean;
    }) => apiClient.post<ApiResponse<ModuleAccess>>('/modules/access/create', data),

    // Get all module access with pagination and filters
    getAllAccess: (params?: {
        page?: number;
        limit?: number;
        state_id?: number;
        party_id?: number;
    }) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.state_id) queryParams.append('state_id', params.state_id.toString());
        if (params?.party_id) queryParams.append('party_id', params.party_id.toString());

        return apiClient.get<ApiResponse<ModuleAccess[]>>(`/modules/access/all?${queryParams.toString()}`);
    },

    // Get module access by ID
    getAccessById: (id: number) => apiClient.get<ApiResponse<ModuleAccess>>(`/modules/access/${id}`),

    // Update module access
    updateAccess: (id: number, data: {
        isDisplay?: boolean;
        isActive?: boolean;
    }) => apiClient.put<ApiResponse<ModuleAccess>>(`/modules/access/${id}`, data),

    // Activate module access
    activateAccess: (id: number) => apiClient.patch<ApiResponse<ModuleAccess>>(`/modules/access/${id}/activate`),

    // Deactivate module access
    deactivateAccess: (id: number) => apiClient.patch<ApiResponse<ModuleAccess>>(`/modules/access/${id}/deactivate`),

    // Delete module access
    deleteAccess: (id: number) => apiClient.delete<ApiResponse<void>>(`/modules/access/${id}`),
};

// Sidebar API
export const sidebarApi = {
    getSidebarModules: (params: {
        state_id: number;
        party_id: number;
        party_level_id: number;
    }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('state_id', params.state_id.toString());
        queryParams.append('party_id', params.party_id.toString());
        queryParams.append('party_level_id', params.party_level_id.toString());

        return apiClient.get<ApiResponse<Module[]>>(`/modules/sidebar?${queryParams.toString()}`);
    },
};

// External APIs (for dropdowns) - using fetch directly since these are external URLs
export const externalApi = {
    // Get all states - filter only State level
    getStates: () => {
        const token = localStorage.getItem('auth_access_token');
        return fetch('https://backend.assamnyay.com/api/state-master-data/all', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => ({
                data: {
                    ...data,
                    data: data.data?.filter((state: State) => state.levelType === 'State') || []
                }
            }));
    },

    // Get all parties with pagination
    getParties: (params?: {
        page?: number;
        limit?: number;
    }) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const token = localStorage.getItem('auth_access_token');
        return fetch(`https://backend.assamnyay.com/api/parties/all?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => ({ data }));
    },

    // Get party levels by party ID
    getPartyLevels: (partyId: number, includeInactive = true) => {
        const queryParams = new URLSearchParams();
        if (includeInactive) queryParams.append('includeInactive', 'true');

        const token = localStorage.getItem('auth_access_token');
        return fetch(`https://backend.assamnyay.com/api/party-wise-level/party/${partyId}?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => ({ data }));
    },
};