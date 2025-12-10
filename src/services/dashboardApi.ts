import { API_CONFIG, getApiUrl } from '../config/api';

export interface DashboardCard {
    title: string;
    count: number;
    userCount: number;
    color: string;
}

export interface LevelInfo {
    id: number;
    name: string;
    type: string;
}

export interface DashboardLevelResponse {
    success: boolean;
    message: string;
    data: {
        levelInfo: LevelInfo;
        cards: DashboardCard[];
    };
}

export interface DashboardStatsResponse {
    success: boolean;
    message: string;
    data: {
        totalUsers: number;
        totalLevels: number;
        stateHierarchy: {
            districts: number;
            assemblies: number;
            totalUsers: number;
        };
        afterAssemblyHierarchy: {
            blocks: number;
            mandals: number;
            sectors: number;
            zones: number;
            wards: number;
            pollingCenters: number;
            booths: number;
            totalUsers: number;
        };
    };
}

export interface DashboardLevelParams {
    state_id: number;
    party_id: number;
    level_id?: number;
    level_type?: 'State' | 'District' | 'Assembly';
}

export interface DashboardStatsParams {
    state_id: number;
    party_id: number;
}

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
    try {
        const authState = localStorage.getItem('auth_state');
        if (authState) {
            const parsed = JSON.parse(authState);
            return parsed.accessToken || localStorage.getItem('auth_access_token');
        }
        return localStorage.getItem('auth_access_token');
    } catch (error) {
        console.error('Error getting auth token:', error);
        return localStorage.getItem('auth_access_token');
    }
};

/**
 * Get level-specific dashboard cards with counts and user counts
 */
export const fetchDashboardLevel = async (params: DashboardLevelParams): Promise<DashboardLevelResponse> => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const queryParams = new URLSearchParams();
        queryParams.append('state_id', params.state_id.toString());
        queryParams.append('party_id', params.party_id.toString());

        if (params.level_id) {
            queryParams.append('level_id', params.level_id.toString());
        }

        if (params.level_type) {
            queryParams.append('level_type', params.level_type);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

        const response = await fetch(
            getApiUrl(`/api/dashboard/level?${queryParams.toString()}`),
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
            const errorMessage = errorData.message || `HTTP ${response.status}`;
            throw new Error(errorMessage);
        }

        return response.json();
    } catch (error: any) {
        console.error('Error fetching dashboard level data:', error);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }
        throw new Error(error.message || 'Failed to fetch dashboard level data');
    }
};

/**
 * Get dashboard statistics for cards and summary views
 */
export const fetchDashboardStats = async (params: DashboardStatsParams): Promise<DashboardStatsResponse> => {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const queryParams = new URLSearchParams();
        queryParams.append('state_id', params.state_id.toString());
        queryParams.append('party_id', params.party_id.toString());

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

        const response = await fetch(
            getApiUrl(`/api/dashboard/stats?${queryParams.toString()}`),
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
            const errorMessage = errorData.message || `HTTP ${response.status}`;
            throw new Error(errorMessage);
        }

        return response.json();
    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }
        throw new Error(error.message || 'Failed to fetch dashboard stats');
    }
};