import axios from 'axios';

const API_BASE_URL = 'https://backend.peopleconnect.in/api';

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
    const response = await axios.post(`${API_BASE_URL}/booth-level-data/create`, data);
    return response.data;
};

export const fetchBoothLevelDataByLevel = async (levelId: number) => {
    const response = await axios.get(`${API_BASE_URL}/booth-level-data/level/${levelId}`);
    return response.data;
};

export const updateBoothLevelData = async (id: number, data: UpdateBoothRequest) => {
    const response = await axios.patch(`${API_BASE_URL}/booth-level-data/update/${id}`, data);
    return response.data;
};

export const activateBoothLevelData = async (id: number) => {
    const response = await axios.patch(`${API_BASE_URL}/booth-level-data/${id}/activate`);
    return response.data;
};

export const deactivateBoothLevelData = async (id: number) => {
    const response = await axios.patch(`${API_BASE_URL}/booth-level-data/${id}/deactivate`);
    return response.data;
};

export const deleteBoothLevelData = async (id: number) => {
    const response = await axios.delete(`${API_BASE_URL}/booth-level-data/delete/${id}`);
    return response.data;
};
