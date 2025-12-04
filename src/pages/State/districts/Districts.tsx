import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHierarchyData } from "../../../hooks/useHierarchyData";
import HierarchyTable from "../../../components/HierarchyTable";
import { fetchHierarchyChildren } from "../../../services/hierarchyApi";
import type { HierarchyChild } from "../../../types/hierarchy";

export default function StateDistricts() {
  const navigate = useNavigate();
  const [stateId, setStateId] = useState<number | null>(null);
  const [stateName, setStateName] = useState<string>("");
  const [districts, setDistricts] = useState<HierarchyChild[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");

  // Get state info from localStorage
  useEffect(() => {
    try {
      const authState = localStorage.getItem("auth_state");
      if (authState) {
        const parsed = JSON.parse(authState);
        const selectedAssignment = parsed.selectedAssignment;

        if (selectedAssignment && selectedAssignment.levelType === "State") {
          setStateId(selectedAssignment.stateMasterData_id);
          setStateName(selectedAssignment.levelName);
        }
      }
    } catch (err) {
      console.error("Error reading state info:", err);
    }
  }, []);

  // Fetch all districts for dropdown
  useEffect(() => {
    const loadDistricts = async () => {
      if (!stateId) return;

      try {
        const response = await fetchHierarchyChildren(stateId, {
          page: 1,
          limit: 1000, // Get all districts
        });

        if (response.success) {
          setDistricts(response.data.children);
        }
      } catch (err) {
        console.error("Error fetching districts:", err);
      }
    };

    loadDistricts();
  }, [stateId]);

  const {
    data,
    loading,
    error,
    totalChildren,
    parentName,
    setPage,
    setSearchInput,
    searchInput,
    setSortBy,
    setOrder,
    currentPage,
    limit,
  } = useHierarchyData(stateId, 10);

  const handleAssignUsers = (districtId: string, districtName: string) => {
    navigate(
      `/state/districts/assign?districtId=${districtId}&districtName=${encodeURIComponent(
        districtName
      )}&stateId=${stateId}`
    );
  };

  // Handle district selection
  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    setPage(1); // Reset to page 1 when filter changes
  };

  const handleSort = (
    sortBy: "location_name" | "total_users" | "active_users",
    order: "asc" | "desc"
  ) => {
    setSortBy(sortBy);
    setOrder(order);
  };

  // Filter data based on selected district
  const filteredData = selectedDistrictId
    ? data.filter((item) => item.location_id.toString() === selectedDistrictId)
    : data;

  const filteredTotal = selectedDistrictId ? filteredData.length : totalChildren;

  return (
    <div className="p-2 bg-gray-50 min-h-screen">
      <HierarchyTable
        data={filteredData}
        loading={loading}
        error={error}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onSort={handleSort}
        onPageChange={setPage}
        currentPage={currentPage}
        totalItems={filteredTotal}
        itemsPerPage={limit}
        title="District List"
        emptyMessage="No districts found for this state"
        stateName={stateName || parentName}
        districts={districts}
        selectedDistrict={selectedDistrictId}
        onDistrictChange={handleDistrictChange}
        onAssignUsers={handleAssignUsers}
        showAssignButton={true}
      />
    </div>
  );
}
