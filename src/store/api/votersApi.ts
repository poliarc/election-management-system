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
  townVillage?: string;
  education?: string;
  married?: string;
  shifted?: boolean;
  shiftedState?: string;
  shiftedCity?: string;
  labharthiStatus?: string;
  professionType?: string;
  voterDOB?: string;
  expiredAliveStatus?: string;
  outsideCountry?: string;
  politicalParty?: string;
  stayingOutside?: string;
  address?: string;
  marriedRelation?: string;
  headRelation?: string;
  caste?: string;
  ageTo?: number;
  ageFrom?: number;
  partFrom?: number;
  partTo?: number;
  eu_ssr_form_submitted?: string | null;
}
interface GetDuplicateVotersParams {
  assembly_id: number;
  limit: number;
  page: number;
  search?: string;
  partFrom?: number;
  partTo?: number;
  eu_ssr_form_submitted?: string;
}

interface UpdateVoterRequest extends Partial<VoterListCandidate> {
  id: number;
  party_id?: number;
  change_reason?: string;
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

interface GetDistinctFieldsParams {
  field: string;
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
      queryFn: async ({ state_id, district_id, assembly_id, file }) => {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("state_id", state_id.toString());
          formData.append("district_id", district_id.toString());
          formData.append("assembly_id", assembly_id.toString());

          const token = localStorage.getItem("auth_access_token");

          // 10 minute timeout for large Excel uploads
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);

          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/voters/upload-excel?state_id=${state_id}&district_id=${district_id}&assembly_id=${assembly_id}`,
            {
              method: "POST",
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: formData,
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
            return {
              error: {
                status: response.status,
                data: errorData,
              },
            };
          }

          const data = await response.json();
          return { data: data.data ?? data };
        } catch (err: any) {
          if (err?.name === "AbortError") {
            return {
              error: {
                status: "TIMEOUT_ERROR" as const,
                error: "Upload timed out. The file may be too large. Please try again.",
              },
            };
          }
          return {
            error: {
              status: "FETCH_ERROR" as const,
              error: err?.message || "Upload failed",
            },
          };
        }
      },
      invalidatesTags: ["Voters"],
    }),
    uploadDraftVoters: builder.mutation<
      UploadVotersResponse,
      UploadDraftVotersRequest
    >({
      queryFn: async ({ state_id, district_id, assembly_id, party_id, file }) => {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("state_id", state_id.toString());
          if (district_id !== undefined) {
            formData.append("district_id", district_id.toString());
          }
          formData.append("assembly_id", assembly_id.toString());
          formData.append("party_id", party_id.toString());

          const token = localStorage.getItem("auth_access_token");

          const queryString = `party_id=${party_id}&assembly_id=${assembly_id}&state_id=${state_id}${district_id ? `&district_id=${district_id}` : ""}`;

          // 10 minute timeout for large draft uploads
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);

          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/draft-voters/upload?${queryString}`,
            {
              method: "POST",
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: formData,
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
            return {
              error: {
                status: response.status,
                data: errorData,
              },
            };
          }

          const data = await response.json();
          return { data: data.data ?? data };
        } catch (err: any) {
          if (err?.name === "AbortError") {
            return {
              error: {
                status: "TIMEOUT_ERROR" as const,
                error: "Upload timed out. The file may be too large. Please try again.",
              },
            };
          }
          return {
            error: {
              status: "FETCH_ERROR" as const,
              error: err?.message || "Upload failed",
            },
          };
        }
      },
    }),
    getDistinctFields: builder.query<VoterApiResponse, GetDistinctFieldsParams>(
      {
        query: ({ field }) => {
          const params = new URLSearchParams({});
          if (field) {
            params.append("field", field);
          }

          return {
            url: `/voters/get-distinct-fields?${params.toString()}`,
            method: "GET",
          };
        },
        providesTags: ["Voters"],
      },
    ),
    getDuplicateVotersPaginated: builder.query<
      VoterApiResponse,
      GetDuplicateVotersParams
    >({
      query: ({
        assembly_id,
        limit,
        page,
        search,
        partFrom,
        partTo,
        eu_ssr_form_submitted,
      }) => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          page: page.toString(),
        });

        if (assembly_id) params.append("assembly_id", assembly_id.toString());
        if (search) params.append("search", search);
        if (partFrom !== undefined)
          params.append("partFrom", partFrom.toString());
        if (partTo !== undefined) params.append("partTo", partTo.toString());
        if (eu_ssr_form_submitted)
          params.append("eu_ssr_form_submitted", eu_ssr_form_submitted);

        return {
          url: `/voters/duplicatevoters/paginated?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Voters"],
    }),
    getVotersByAssembly: builder.query<VoterApiResponse, any>({
      query: ({ assembly_id }) => {
        return {
          url: `/voters/assembly/${assembly_id}`,
          method: "GET",
        };
      },
      providesTags: ["Voters"],
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
        townVillage,
        caste,
        shifted,
        marriedRelation,
        headRelation,
        voterDOB,
        shiftedState,
        shiftedCity,
        professionType,
        labharthiStatus,
        stayingOutside,
        outsideCountry,
        politicalParty,
        expiredAliveStatus,
        ageTo,
        ageFrom,
        married,
        education,
        partFrom,
        partTo,
        eu_ssr_form_submitted,
      }) => {
        const params = new URLSearchParams({
          limit: limit.toString(),
          page: page.toString(),
        });

        if (search) params.append("search", search);
        if (townVillage) params.append("townVillage", townVillage);
        if (education) params.append("education", education);
        if (married) params.append("married", married);
        if (marriedRelation) params.append("marriedRelation", marriedRelation);
        if (headRelation) params.append("headRelation", headRelation);
        if (caste) params.append("caste", caste);
        if (fatherName) params.append("fatherName", fatherName);
        if (shifted) params.append("shifted", shifted.toString());
        if (voterDOB) params.append("voterDOB", voterDOB.toString());
        if (outsideCountry) params.append("outsideCountry", outsideCountry);
        if (stayingOutside) params.append("stayingOutside", stayingOutside);
        if (politicalParty) params.append("politicalParty", politicalParty);
        if (shiftedState) params.append("shiftedState", shiftedState);
        if (shiftedCity) params.append("shiftedCity", shiftedCity);
        if (professionType) params.append("professionType", professionType);
        if (expiredAliveStatus)
          params.append("expiredAliveStatus", expiredAliveStatus);
        if (labharthiStatus) params.append("labharthiStatus", labharthiStatus);
        if (ageTo !== undefined) params.append("ageTo", ageTo.toString());
        if (ageFrom !== undefined) params.append("ageFrom", ageFrom.toString());
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
      query: ({ id, party_id: _party_id, change_reason, ...voterData }) => {
        let partyId: number | undefined;
        try {
          const authState = localStorage.getItem('auth_state');
          if (authState) {
            const parsed = JSON.parse(authState);
            partyId = parsed?.user?.partyId || undefined;
          }
        } catch { /* ignore */ }

        const params = partyId ? `?party_id=${partyId}` : '';
        return {
          url: `/voters/update/${id}${params}`,
          method: "PUT",
          body: {
            ...voterData,
            ...(change_reason ? { change_reason } : {}),
          },
        };
      },
      invalidatesTags: ["Voters"],
    }),

    // --- Voter Marker Endpoints ---
    
    // UPDATED: Added after_assembly_id mapping to fully map the hierarchy
    createVoterMarker: builder.mutation<ApiResponse<any>, { 
      voter_id: number; 
      state_id?: number; 
      district_id?: number; 
      assembly_id?: number;
      after_assembly_id?: number;
    }>({
      query: (body) => ({
        url: `/voter-marker/create-voter-marker`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Voters"],
    }),

    // UPDATED: Added after_assembly_id to query params for filtering based on hierarchy
    getAfterAssemblyLevelUsers: builder.query<any, number>({
      query: (levelId) => ({
        url: `/user-after-assembly-hierarchy/level/${levelId}/users`,
        method: "GET",
      }),
    }),


    // Inside votersApi.ts -> getVoterMarkers
    getVoterMarkers: builder.query<any, { 
      page: number; 
      limit: number; 
      user_id?: number; 
      assembly_id?: number; 
      district_id?: number; 
      state_id?: number; 
      after_assembly_id?: number; // NEW: Added to type
      sortBy?: string; 
      sortOrder?: string; 
      search?: string 
    }>({
      query: ({ page, limit, user_id, assembly_id, district_id, state_id, after_assembly_id, sortBy, sortOrder, search }) => { 
        let url = `/voter-marker/get-voter-marker?page=${page}&limit=${limit}`;
        if (user_id) url += `&user_id=${user_id}`;
        if (assembly_id) url += `&assembly_id=${assembly_id}`; 
        if (district_id) url += `&district_id=${district_id}`; 
        if (state_id) url += `&state_id=${state_id}`; 
        
        // NEW: Pass to URL
        if (after_assembly_id) url += `&after_assembly_id=${after_assembly_id}`; 
        
        if (sortBy) url += `&sortBy=${sortBy}`;
        if (sortOrder) url += `&sortOrder=${sortOrder}`;
        if (search) url += `&search=${encodeURIComponent(search)}`; 
        return { url, method: "GET" };
      },
      providesTags: ["Voters"],
    }),

    
    deleteVoterMarker: builder.mutation<ApiResponse<any>, number>({
      query: (id) => ({
        url: `/voter-marker/delete-voter-marker/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Voters"],
    }),

    // Fetch the Parent hierarchy explicitly mapped
    getParentLevels: builder.query<ApiResponse<any>, number>({
      query: (id) => ({
        url: `/voter-marker/parents/${id}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useUploadVotersMutation,
  useUploadDraftVotersMutation,
  useGetVotersByAssemblyQuery,
  useGetDistinctFieldsQuery,
  useGetDuplicateVotersPaginatedQuery,
  useGetVotersByAssemblyPaginatedQuery,
  useUpdateVoterMutation,
  useGetDraftCompareSummaryQuery,
  useGetDraftCompareNewQuery,
  useGetDraftCompareMissingQuery,
  useGetDraftCompareModifiedQuery,
  useGetDraftCompareMatchedQuery,
  useCreateVoterMarkerMutation,
  useGetVoterMarkersQuery,
  useGetAfterAssemblyLevelUsersQuery,
  useDeleteVoterMarkerMutation,
  useGetParentLevelsQuery,
} = votersApi;