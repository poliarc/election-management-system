// Party Master Types

export interface Party {
    party_id: number;
    partyName: string;
    partyCode: string;
    party_type_id: number;
    party_type_name: string;
    adminId: number | null;
    admin_name: string | null;
    admin_email: string | null;
    isActive: number;
    isDelete: number;
    created_at: string;
    updated_at: string;
}

export interface PartyType {
    party_type_id: number;
    type: string;
    isActive: number;
    isDelete: number;
    created_at: string;
    updated_at: string;
}

export interface PartyUser {
    user_id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    contact_no: string;
    party_id: number;
    role_id: number;
    role: string;
    partyName: string;
    isActive: number;
    isSuperAdmin: number;
    created_on: string;
}

export interface CreatePartyRequest {
    party_type_id: number;
    partyName: string;
    partyCode: string;
}

export interface UpdatePartyRequest {
    party_type_id?: number;
    partyName?: string;
    partyCode?: string;
    adminId?: number;
}

export interface PartyQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: number;
}

export interface PartyResponse {
    success: boolean;
    message: string;
    data: Party[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface SinglePartyResponse {
    success: boolean;
    message: string;
    data: Party;
}

export interface PartyTypesResponse {
    success: boolean;
    message: string;
    data: PartyType[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface PartyUsersResponse {
    success: boolean;
    message: string;
    data: PartyUser[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
