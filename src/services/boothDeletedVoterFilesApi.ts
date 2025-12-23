import { apiClient } from "./api";

export type BoothDeletedVoterFile = {
  id: number;
  stateId?: number;
  stateName?: string;
  districtName?: string;
  assemblyName?: string;
  boothId?: number;
  filePath: string;
  stateNameFromMaster?: string;
  boothNameFromMaster?: string;
  created_at?: string;
  updated_at?: string;
};

export type BoothDeletedVoterFilesResponse = {
  success: boolean;
  message?: string;
  data?: BoothDeletedVoterFile[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function fetchBoothDeletedVoterFiles(
  boothId: number,
  params?: { page?: number; limit?: number; search?: string }
): Promise<BoothDeletedVoterFilesResponse> {
  const { page = 1, limit = 12, search } = params || {};

  const response = await apiClient.get(
    `/booth-deleted-voter-files/booth/${boothId}`,
    {
      params: {
        page,
        limit,
        search: search?.trim() || undefined,
      },
    }
  );

  return response.data as BoothDeletedVoterFilesResponse;
}
