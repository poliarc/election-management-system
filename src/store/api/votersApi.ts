import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  VoterApiResponse,
  VoterList,
  VoterListCandidate,
} from "../../types/voter";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface UploadVotersRequest {
  state_id: number;
  district_id: number;
  assembly_id: number;
  file: File;
}

interface UploadDraftVotersRequest {
  state_id: number;
  district_id?: number;
  assembly_id: number;
  party_id: number;
  file: File;
}

interface UploadVotersResponse {
  message: string;
  uploadedCount?: number;
}

interface GetVotersByAssemblyParams {
  assembly_id: number;
  limit: number;
  page: number;
  search?: string;
  fatherName?: string;
  address?: string;
  partFrom?: number;
  partTo?: number;
  eu_ssr_form_submitted?: string;
}

interface UpdateVoterRequest extends Partial<VoterListCandidate> {
  id: number;
}

interface DraftCompareSummaryPayload {
  summary: {
    total_master_voters: number;
    total_draft_voters: number;
    matched_voters: number;
    new_in_draft: number;
    missing_in_draft: number;
    modified_voters: number;
  };
  // Details are intentionally empty in summary response; specific endpoints provide records.
  details: {
    matched: unknown[];
    new_in_draft: unknown[];
    missing_in_draft: unknown[];
    modified: unknown[];
  };
}

interface DraftCompareListBase {
  voter_id_epic_no: string;
  part_no?: string;
  assembly_id: number;
}

interface DraftCompareNew extends DraftCompareListBase {
  draft_id: number;
  draft_name?: string;
  draft_contact?: string;
  draft_house?: string;
  upload_batch_id?: string;
  status: "new_voter";
  uploaded_by?: number;
  created_at?: string;
}

interface DraftCompareMissing extends DraftCompareListBase {
  master_id: number;
  master_name?: string;
  master_contact?: string;
  master_house?: string;
  status: "missing_voter";
  last_updated?: string;
}

interface DraftCompareModified extends DraftCompareListBase {
  master_id: number;
  draft_id: number;
  master_name?: string;
  draft_name?: string;
  master_contact?: string;
  draft_contact?: string;
  master_house?: string;
  draft_house?: string;
  status: "modified_voter";
  differences?: string[];
}

interface DraftCompareMatched extends DraftCompareListBase {
  master_id: number;
  draft_id: number;
  voter_name?: string;
  contact?: string;
  house_no?: string;
  match_type?: string;
}

interface DraftCompareListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const votersApi = createApi({
  reducerPath: "votersApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("auth_access_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Voters"],
  endpoints: (builder) => ({
    uploadVoters: builder.mutation<UploadVotersResponse, UploadVotersRequest>({
      query: ({ state_id, district_id, assembly_id, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("state_id", state_id.toString());
        formData.append("district_id", district_id.toString());
        formData.append("assembly_id", assembly_id.toString());

        console.log("FormData being sent:", {
          state_id,
          district_id,
          assembly_id,
          fileName: file.name,
        });

        return {
          url: `/voters/upload-excel?state_id=${state_id}&district_id=${district_id}&assembly_id=${assembly_id}`,
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: ApiResponse<UploadVotersResponse>) =>
        response.data,
      invalidatesTags: ["Voters"],
    }),
    uploadDraftVoters: builder.mutation<
      UploadVotersResponse,
      UploadDraftVotersRequest
    >({
      query: ({ state_id, district_id, assembly_id, party_id, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("state_id", state_id.toString());
        if (district_id !== undefined) {
          formData.append("district_id", district_id.toString());
        }
        formData.append("assembly_id", assembly_id.toString());
        formData.append("party_id", party_id.toString());

        return {
          url: `/draft-voters/upload?party_id=${party_id}&assembly_id=${assembly_id}&state_id=${state_id}${
            district_id ? `&district_id=${district_id}` : ""
          }`,
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: ApiResponse<UploadVotersResponse>) =>
        response.data,
    }),
    getVotersByAssemblyPaginated: builder.query<
      VoterApiResponse,
      GetVotersByAssemblyParams
    >({
      query: ({
        assembly_id,
        limit,
        page,
        search,
        fatherName,
        address,
        partFrom,
        partTo,
        eu_ssr_form_submitted,
      }) => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          page: page.toString(),
        });

        if (search) params.append("search", search);
        if (fatherName) params.append("fatherName", fatherName);
        if (address) params.append("address", address);
        if (partFrom !== undefined)
          params.append("partFrom", partFrom.toString());
        if (partTo !== undefined) params.append("partTo", partTo.toString());
        if (eu_ssr_form_submitted)
          params.append("eu_ssr_form_submitted", eu_ssr_form_submitted);

        return {
          url: `/voters/assembly/${assembly_id}/paginated?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Voters"],
    }),
    getDraftCompareSummary: builder.query<
      DraftCompareSummaryPayload,
      { assembly_id: number; party_id?: number; upload_batch_id?: string }
    >({
      query: ({ assembly_id, party_id, upload_batch_id }) => {
        const params = new URLSearchParams();
        if (party_id) params.append("party_id", party_id.toString());
        if (upload_batch_id) params.append("upload_batch_id", upload_batch_id);

        const queryString = params.toString();
        const suffix = queryString ? `?${queryString}` : "";
        return {
          url: `/draft-voters/assembly/${assembly_id}/compare${suffix}`,
          method: "GET",
        };
      },
      transformResponse: (response: ApiResponse<DraftCompareSummaryPayload>) =>
        response.data,
    }),
    getDraftCompareNew: builder.query<
      DraftCompareListResponse<DraftCompareNew>,
      { assembly_id: number; page: number; limit: number; party_id?: number }
    >({
      query: ({ assembly_id, page, limit, party_id }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (party_id) params.append("party_id", party_id.toString());
        return {
          url: `/draft-voters/assembly/${assembly_id}/compare/new_in_draft?${params.toString()}`,
          method: "GET",
        };
      },
    }),
    getDraftCompareMissing: builder.query<
      DraftCompareListResponse<DraftCompareMissing>,
      { assembly_id: number; page: number; limit: number }
    >({
      query: ({ assembly_id, page, limit }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        return {
          url: `/draft-voters/assembly/${assembly_id}/compare/missing_in_draft?${params.toString()}`,
          method: "GET",
        };
      },
    }),
    getDraftCompareModified: builder.query<
      DraftCompareListResponse<DraftCompareModified>,
      { assembly_id: number; page: number; limit: number }
    >({
      query: ({ assembly_id, page, limit }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        return {
          url: `/draft-voters/assembly/${assembly_id}/compare/modified?${params.toString()}`,
          method: "GET",
        };
      },
    }),
    getDraftCompareMatched: builder.query<
      DraftCompareListResponse<DraftCompareMatched>,
      { assembly_id: number; page: number; limit: number }
    >({
      query: ({ assembly_id, page, limit }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        return {
          url: `/draft-voters/assembly/${assembly_id}/compare/matched?${params.toString()}`,
          method: "GET",
        };
      },
    }),
    updateVoter: builder.mutation<VoterList, UpdateVoterRequest>({
      query: ({ id, ...data }) => ({
        url: `/voters/update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Voters"],
    }),
  }),
});

export const {
  useUploadVotersMutation,
  useUploadDraftVotersMutation,
  useGetVotersByAssemblyPaginatedQuery,
  useUpdateVoterMutation,
  useGetDraftCompareSummaryQuery,
  useGetDraftCompareNewQuery,
  useGetDraftCompareMissingQuery,
  useGetDraftCompareModifiedQuery,
  useGetDraftCompareMatchedQuery,
} = votersApi;
