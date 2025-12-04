import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

// Configure axios instance with authentication
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
});

// Add auth token to all requests
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface BoothLevelData {
    id: number;
    parentLevelId: number;
    boothFrom: number;
    boothTo: number;
    partyLevelId: number;
    isActive: number;
    isDelete: number;
    created_at: string;
    updated_at: string;
    parentLevelName?: string;
    parentLevelType?: string;
    partyLevelName?: string;
    boothNumbers?: number[];
}

export interface CreateBoothRequest {
    parentLevelId: number;
    boothFrom: number;
    boothTo: number;
    partyLevelId: number;
}

export interface UpdateBoothRequest {
    boothFrom: number;
    boothTo: number;
}

export const createBoothLevelData = async (data: CreateBoothRequest) => {
    const response = await axiosInstance.post('/booth-level-data/create', data);
    return response.data;
};

export const fetchBoothLevelDataByLevel = async (levelId: number) => {
    const response = await axiosInstance.get(`/booth-level-data/level/${levelId}`);
    return response.data;
};

export const updateBoothLevelData = async (id: number, data: UpdateBoothRequest) => {
    const response = await axiosInstance.put(`/booth-level-data/update/${id}`, data);
    return response.data;
};

export const activateBoothLevelData = async (id: number) => {
    const response = await axiosInstance.patch(`/booth-level-data/${id}/activate`);
    return response.data;
};

export const deactivateBoothLevelData = async (id: number) => {
    const response = await axiosInstance.patch(`/booth-level-data/${id}/deactivate`);
    return response.data;
};

export const deleteBoothLevelData = async (id: number) => {
    const response = await axiosInstance.delete(`/booth-level-data/delete/${id}`);
    return response.data;
};

// Voter interfaces for booth level
export interface BoothVoterData {
    id: number;
    state_id: number;
    district_id: number;
    assembly_id: number;
    booth_id: number;
    part_no: string;
    sl_no_in_part: string;
    voter_id_epic_no: string;
    voter_full_name_en: string;
    voter_full_name_hi?: string;
    relative_full_name_en: string;
    relative_full_name_hi?: string;
    house_no_eng?: string;
    house_no_hi?: string;
    gender: string;
    age: number;
    contact_number1?: string;
    contact_number2?: string;
    family_id?: string;
    aadhar?: string;
    religion?: string;
    caste?: string;
    education?: string;
    profession_type?: string;
    married?: string;
    politcal_party?: string;
    voters_isAlive: number;
    voter_dob?: string;
    relation?: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
}

export interface BoothVotersPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface BoothVotersResponse {
    success: boolean;
    data: BoothVoterData[];
    pagination: BoothVotersPagination;
    boothRange?: {
        boothFrom: number;
        boothTo: number;
    };
}

export interface BoothVotersQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    gender?: string;
    ageFrom?: number;
    ageTo?: number;
}

// Get voters for booth level with filters
export const fetchVotersByBoothLevel = async (
    boothLevelId: number,
    params: BoothVotersQueryParams = {}
): Promise<BoothVotersResponse> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.gender) queryParams.append('gender', params.gender);
    if (params.ageFrom) queryParams.append('ageFrom', params.ageFrom.toString());
    if (params.ageTo) queryParams.append('ageTo', params.ageTo.toString());

    const url = `/booth-level-data/${boothLevelId}/voters${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    console.log('🌐 Full API URL:', `${API_BASE_URL}${url}`);
    console.log('📤 Query params:', Object.fromEntries(queryParams.entries()));

    const response = await axiosInstance.get(url);
    return response.data;
};
