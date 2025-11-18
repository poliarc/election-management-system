// src/store/api/partyTypeApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { PartyType } from "../../types/partyType";

// API response interface
interface PartyTypeApiResponse {
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

// Generic response for operations like activate/deactivate/delete
interface PartyTypeOperationResponse {
  success: boolean;
  message: string;
}

export const partyTypeApi = createApi({
  reducerPath: "partyTypeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://backend.peopleconnect.in/api/party-types",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["PartyType"],
  endpoints: (builder) => ({
    // GET all party types
    getPartyTypes: builder.query<PartyTypeApiResponse, void>({
      query: () => `/all`,
      providesTags: ["PartyType"],
    }),

    // GET single party type
    getPartyTypeById: builder.query<PartyType, string | number>({
      query: (id) => `/single/${id}`,
      providesTags: (_result, _error, id) => [{ type: "PartyType", id }],
    }),

    // CREATE party type
    createPartyType: builder.mutation<PartyType, { type: string }>({
      query: (body) => ({
        url: `/create-party-type`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PartyType"],
    }),

    // UPDATE party type
    updatePartyType: builder.mutation<
      PartyType,
      { id: number | string; data: { type: string } }
    >({
      query: ({ id, data }) => ({
        url: `/update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["PartyType"],
    }),

    // ACTIVATE party type
    activatePartyType: builder.mutation<PartyTypeOperationResponse, number | string>({
      query: (id) => ({
        url: `/${id}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: ["PartyType"],
    }),

    // DEACTIVATE party type
    deactivatePartyType: builder.mutation<PartyTypeOperationResponse, number | string>({
      query: (id) => ({
        url: `/${id}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["PartyType"],
    }),

    // DELETE party type
    deletePartyType: builder.mutation<PartyTypeOperationResponse, number | string>({
      query: (id) => ({
        url: `/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PartyType"],
    }),
  }),
});

export const {
  useGetPartyTypesQuery,
  useGetPartyTypeByIdQuery,
  useCreatePartyTypeMutation,
  useUpdatePartyTypeMutation,
  useActivatePartyTypeMutation,
  useDeactivatePartyTypeMutation,
  useDeletePartyTypeMutation,
} = partyTypeApi;
