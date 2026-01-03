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

export async function deleteBoothDeletedVoterFile(
  fileId: number
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.delete(
    `/booth-deleted-voter-files/delete/${fileId}`
  );

  return response.data as { success: boolean; message?: string };
}

export async function bulkDeleteBoothDeletedVoterFiles(
  fileIds: number[]
): Promise<{ success: boolean; message?: string; deletedCount?: number }> {
  let deletedCount = 0;
  const errors: string[] = [];

  // Delete files one by one using the existing single delete endpoint
  for (const fileId of fileIds) {
    try {
      const result = await deleteBoothDeletedVoterFile(fileId);
      if (result.success) {
        deletedCount++;
      } else {
        errors.push(`Failed to delete file ${fileId}: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      errors.push(`Failed to delete file ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const success = deletedCount > 0;
  let message = '';

  if (deletedCount === fileIds.length) {
    message = `Successfully deleted ${deletedCount} file(s)`;
  } else if (deletedCount > 0) {
    message = `Deleted ${deletedCount} out of ${fileIds.length} file(s). ${errors.length} failed.`;
  } else {
    message = `Failed to delete all files. ${errors.join('; ')}`;
  }

  return {
    success,
    message,
    deletedCount,
  };
}
