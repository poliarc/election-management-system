import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Profile data structure from backend
export interface ProfileData {
  email: string;
  user_id: number;
  first_name: string;
  last_name: string;
  contact_no: string;
  father: string;
  mother: string;
  citizenship: string;
  voterIdNo: string;
  dob: string | null;
  married: string;
  marriageAnniversary: string | null;
  partyJoiningDate: string | null;
  state: string;
  district: string;
  assembly: string;
  is_youth: number;
  is_women: number;
  is_employee: number;
  is_minority: number;
  is_sc: number;
  is_st: number;
  is_obc: number;
  is_it_media: number;
  is_kisan: number;
  is_majdoor: number;
  is_student: number;
  education: Array<{
    std: string;
    institute: string;
    boardUniversity: string;
    year: string;
  }>;
  professionalExp: Array<{
    designation: string;
    organization: string;
    years: string;
    durationFrom: string;
    durationTo: string;
  }>;
  children: Array<{
    name: string;
    age: string;
    gender: string;
    dob: string;
  }>;
  positionHeld: Array<{
    title: string;
    designation: string;
    state: string;
    district: string;
    durationFrom: string;
    durationTo: string;
  }>;
  electionContested: Array<{
    electionName: string;
    year: string;
    result: string;
    state: string;
    district: string;
    assembly: string;
  }>;
  publicRepresentativeDetails: Array<{
    electionName: string;
    year: string;
    result: string;
    state: string;
    district: string;
    assembly: string;
  }>;
  vehicle: Array<{
    type: string;
    count: string;
  }>;
  profileImage?: string;
  partyName?: string;
  role?: string;
  role_name: string
}

// Update profile payload structure
export interface UpdateProfilePayload {
  first_name: string;
  last_name: string;
  contact_no: string;
  father: string;
  mother: string;
  citizenship: string;
  voterIdNo: string;
  dob: string;
  married: string;
  marriageAnniversary: string;
  partyJoiningDate: string;
  state: string;
  district: string;
  assembly: string;
  is_youth: number;
  is_women: number;
  is_employee: number;
  is_minority: number;
  is_sc: number;
  is_st: number;
  is_obc: number;
  is_it_media: number;
  is_kisan: number;
  is_majdoor: number;
  is_student: number;
  education: Array<{
    std: string;
    institute: string;
    boardUniversity: string;
    year: string;
  }>;
  professionalExp: Array<{
    designation: string;
    organization: string;
    years: string;
    durationFrom: string;
    durationTo: string;
  }>;
  children: Array<{
    name: string;
    age: string;
    gender: string;
    dob: string;
  }>;
  positionHeld: Array<{
    title: string;
    designation: string;
    state: string;
    district: string;
    durationFrom: string;
    durationTo: string;
  }>;
  electionContested: Array<{
    electionName: string;
    year: string;
    result: string;
    state: string;
    district: string;
    assembly: string;
  }>;
  publicRepresentativeDetails: Array<{
    electionName: string;
    year: string;
    result: string;
    state: string;
    district: string;
    assembly: string;
  }>;
  vehicle: Array<{
    type: string;
    count: string;
  }>;
}

export const profileApi = createApi({
  reducerPath: 'profileApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('auth_access_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Profile'],
  endpoints: (builder) => ({
    getProfile: builder.query<ProfileData, void>({
      query: () => '/users/profile',
      transformResponse: (response: { success: boolean; message: string; data: ProfileData }) => response.data,
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<ProfileData, { id: number | string; data: UpdateProfilePayload | FormData }>({
      query: ({ id, data }) => {
        // Check if data is FormData (for image uploads)
        const isFormData = data instanceof FormData;

        return {
          url: `/users/update/${id}`,
          method: 'PUT',
          body: data,
          // Let the browser set Content-Type for FormData
          headers: isFormData ? {} : { 'Content-Type': 'application/json' },
        };
      },
      transformResponse: (response: { success: boolean; message: string; data: ProfileData }) => response.data,
      invalidatesTags: ['Profile'],
    }),
    toggleUserStatus: builder.mutation<{ success: boolean; message: string; data: any }, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/users/${id}/toggle-status`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['Profile'],
    }),
  }),
});

export const { useGetProfileQuery, useUpdateProfileMutation, useToggleUserStatusMutation } = profileApi;
