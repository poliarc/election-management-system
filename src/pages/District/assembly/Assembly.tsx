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
    navigate(
      `/district/assembly/assign?assemblyId=${assemblyId}&assemblyName=${encodeURIComponent(
        assemblyName
      )}`
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Assembly Management
        </h1>
        {/* <button
                    onClick={() => navigate('/district/assembly/create')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Assembly
                </button> */}
      </div>
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
