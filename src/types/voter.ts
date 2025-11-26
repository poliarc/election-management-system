// Voter types for the application

export interface VoterListCandidate {
    state_code?: string;
    state_name_eng?: string;
    distt_name_en?: string;
    pc_no?: string;
    pc_name_en?: string;
    pc_name_v1?: string;
    ac_no?: string;
    ac_name_en?: string;
    ac_name_v1?: string;
    part_no?: string;
    section_no?: string;
    ps_name_eng?: string;
    ps_name_en?: string;
    ps_loc_en?: string;
    ps_loc_hin?: string;
    town_village_name_eng?: string;
    ward_no?: string;
    tehsil_eng?: string;
    police_station_en?: string;
    pincode?: string;
    sl_no_in_part?: string;
    ward_elec_id?: string;
    voter_id_epic_no?: string;
    voter_full_name_en?: string;
    voter_full_name_hi?: string;
    relative_full_name_en?: string;
    relative_full_name_hi?: string;
    house_no_eng?: string;
    gender?: string;
    age?: number;
    birth_date_eng?: string;
    m_section_name?: string;
    voter_first_name_en?: string;
    voter_last_name_en?: string;
    voter_last_name_hi?: string;
    relative_first_name_en?: string;
    relative_last_name_en?: string;
    relation?: string;
    contact_number1?: string;
    contact_number2?: string;
    family_id?: string;
    aadhar?: string;
    religion?: string;
    caste?: string;
    influecial_type?: string;
    influencial_catg?: string;
    profession_type?: string;
    profession_sub_catg?: string;
    married?: string;
    voter_preference_rank?: number;
    politcal_party?: string;
    relative_in_part_no?: string;
    relative_sl_in_part?: string;
    expired_alive?: string;
    education?: string;
    shifted?: boolean;
    shifted_address?: string;
    shifted_country?: string;
    shifted_state?: string;
    shifted_city?: string;
    staying_outside?: boolean;
    staying_within?: boolean;
    staying_address?: string;
    staying_country?: string;
    staying_state?: string;
    staying_city?: string;
    labarthi_in_person?: boolean;
    labarthi_state?: string;
    labarthi_center?: string;
    approch_count?: number;
    approach_reason?: string;
    assembly_id?: number;
}

export interface VoterList extends VoterListCandidate {
    id: number;
    created_at?: string;
    updated_at?: string;
}

export interface VoterPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface VoterApiResponse {
    success: boolean;
    data: VoterList[];
    pagination: VoterPagination;
}
