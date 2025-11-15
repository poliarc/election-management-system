import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchHierarchyChildren,
  getSelectedDistrict,
} from "../services/hierarchyApi";
import type { HierarchyChild, HierarchyQueryParams } from "../types/hierarchy";
import { useDebounce } from "./useDebounce";

interface UseHierarchyDataResult {
  data: HierarchyChild[];
  loading: boolean;
  error: string | null;
  totalChildren: number;
  parentName: string;
  refetch: () => void;
  setPage: (page: number) => void;
  setSearchInput: (search: string) => void;
  searchInput: string;
  setSortBy: (sortBy: HierarchyQueryParams["sortBy"]) => void;
  setOrder: (order: "asc" | "desc") => void;
  currentPage: number;
  limit: number;
}

export function useHierarchyData(
  parentId: number | null,
  initialLimit: number = 10
): UseHierarchyDataResult {
  const [data, setData] = useState<HierarchyChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalChildren, setTotalChildren] = useState(0);
  const [parentName, setParentName] = useState("");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [sortBy, setSortBy] =
    useState<HierarchyQueryParams["sortBy"]>("location_name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const limit = initialLimit;

  const fetchData = useCallback(async () => {
    if (!parentId) {
      setLoading(false);
      setError("No parent location selected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: HierarchyQueryParams = {
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy,
        order,
      };

      const response = await fetchHierarchyChildren(parentId, params);

      if (response.success) {
        setData(response.data.children);
        setTotalChildren(response.data.total_children);
        setParentName(response.data.parent.location_name);
      } else {
        setError(response.message || "Failed to fetch data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [parentId, page, limit, debouncedSearch, sortBy, order]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when debounced search changes
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearch]);

  return {
    data,
    loading,
    error,
    totalChildren,
    parentName,
    refetch: fetchData,
    setPage,
    setSearchInput,
    searchInput,
    setSortBy,
    setOrder,
    currentPage: page,
    limit,
  };
}

// Hook to get district ID from localStorage
export function useSelectedDistrictId(): number | null {
  const [districtId, setDistrictId] = useState<number | null>(null);

  useEffect(() => {
    const district = getSelectedDistrict();
    setDistrictId(district?.id || null);
  }, []);

  return districtId;
}

// Hook to get state ID from localStorage
export function useSelectedStateId(): number | null {
  const [stateId, setStateId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const authState = localStorage.getItem("auth_state");
      if (authState) {
        const parsed = JSON.parse(authState);
        const selectedAssignment = parsed.selectedAssignment;
        if (selectedAssignment && selectedAssignment.levelType === "State") {
          setStateId(selectedAssignment.stateMasterData_id);
        }
      }
    } catch (err) {
      console.error("Error reading state info:", err);
    }
  }, []);

  return stateId;
}
