import { useMemo } from "react";

export const usePartFilterPagination = ({
  data,
  partFrom,
  partTo,
  currentPage,
  itemsPerPage,
}: {
  data: any[];
  partFrom?: number;
  partTo?: number;
  currentPage: number;
  itemsPerPage: number;
}) => {
  console.log(currentPage, 'c');
  
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const partNo = Number(item.part_no || item.partNo);

      if (isNaN(partNo)) return false;

      if (partFrom !== undefined && partTo !== undefined) {
        return partNo >= partFrom && partNo <= partTo;
      }

      if (partFrom !== undefined) {
        return partNo >= partFrom;
      }

      if (partTo !== undefined) {
        return partNo <= partTo;
      }

      return true;
    });
  }, [data, partFrom, partTo]);

  const paginatedVoters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return {
    filteredData,
    paginatedVoters,
    totalPages,
  };
};