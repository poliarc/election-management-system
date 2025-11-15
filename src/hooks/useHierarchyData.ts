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
  const [limit] = useState(initialLimit);
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] =
    useState<HierarchyQueryParams["sortBy"]>("location_name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const debouncedSearch = useDebounce(searchInput, 500);

  // -----------------------
  // FETCH FUNCTION
  // -----------------------
  const fetchData = useCallback(async () => {
    if (parentId === null) return;

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

        const total =
          response.pagination?.total ??
          response.data.total_children ??
          response.data.children.length;

        setTotalChildren(total);
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

  // Fetch on mount and changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page on search change
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

// ----------------------------------------------------------
// Hook to get selected district ID (clean & fixed version)
// ----------------------------------------------------------
export function useSelectedDistrictId(): number | null {
  const [districtId, setDistrictId] = useState<number | null>(null);

  useEffect(() => {
    const updateDistrict = () => {
      const district = getSelectedDistrict();
      setDistrictId(district?.id || null);
    };

    // Initial load
    updateDistrict();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_state" || e.key === null) {
        updateDistrict();
      }
    };

    // Custom event for same-tab updates
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("districtChanged", updateDistrict);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("districtChanged", updateDistrict);
    };
  }, []);

  return districtId;
}
