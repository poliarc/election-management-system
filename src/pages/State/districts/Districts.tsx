import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHierarchyData } from "../../../hooks/useHierarchyData";
import HierarchyTable from "../../../components/HierarchyTable";

export default function StateDistricts() {
  const navigate = useNavigate();
  const [stateId, setStateId] = useState<number | null>(null);
  const [stateName, setStateName] = useState<string>("");

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

  const handleSort = (
    sortBy: "location_name" | "total_users" | "active_users",
    order: "asc" | "desc"
  ) => {
    setSortBy(sortBy);
    setOrder(order);
  };

  return (
    <div className="p-2 bg-gray-50 min-h-screen">
      <HierarchyTable
        data={data}
        loading={loading}
        error={error}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onSort={handleSort}
        onPageChange={setPage}
        currentPage={currentPage}
        totalItems={totalChildren}
        itemsPerPage={limit}
        title="District List"
        emptyMessage="No districts found for this state"
        stateName={stateName || parentName}
        onAssignUsers={handleAssignUsers}
        showAssignButton={true}
      />
    </div>
  );
}
