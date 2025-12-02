import {
  useHierarchyData,
  useSelectedDistrictId,
} from "../../../hooks/useHierarchyData";
import HierarchyTable from "../../../components/HierarchyTable";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DistrictAssembly() {
  const navigate = useNavigate();
  const districtId = useSelectedDistrictId();
  const [districtInfo, setDistrictInfo] = useState<{
    state: string;
    district: string;
  }>({ state: "", district: "" });

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
  } = useHierarchyData(districtId, 10);

  // Get district and state info from localStorage
  useEffect(() => {
    try {
      const authState = localStorage.getItem("auth_state");
      if (authState) {
        const parsed = JSON.parse(authState);
        const selectedAssignment = parsed.selectedAssignment;
        if (selectedAssignment) {
          setDistrictInfo({
            state: selectedAssignment.parentLevelName || "N/A",
            district: selectedAssignment.levelName || "N/A",
          });
        }
      }
    } catch (err) {
      console.error("Error reading district info:", err);
    }
  }, []);

  const handleSort = (
    sortBy: "location_name" | "total_users" | "active_users",
    order: "asc" | "desc"
  ) => {
    setSortBy(sortBy);
    setOrder(order);
  };

  const handleAssignUsers = (assemblyId: string, assemblyName: string) => {
    // Get stateId from localStorage
    let stateId = null;
    try {
      const authState = localStorage.getItem("auth_state");
      if (authState) {
        const parsed = JSON.parse(authState);
        const selectedAssignment = parsed.selectedAssignment;
        if (selectedAssignment?.parentId) {
          stateId = selectedAssignment.parentId;
        }
      }
    } catch (err) {
      console.error("Error reading state info:", err);
    }

    navigate(
      `/district/assembly/assign?assemblyId=${assemblyId}&assemblyName=${encodeURIComponent(
        assemblyName
      )}&stateId=${stateId}`
    );
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
        title="Assembly List"
        emptyMessage="No assemblies found for this district"
        stateName={districtInfo.state}
        districtName={districtInfo.district}
        parentName={parentName}
        onAssignUsers={handleAssignUsers}
        showAssignButton={true}
      />
    </div>
  );
}
