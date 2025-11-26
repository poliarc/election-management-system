import { useEffect, useState } from "react";
import { useHierarchyData } from "../../../hooks/useHierarchyData";
import HierarchyTable from "../../../components/HierarchyTable";
import UploadVotersModal from "../../../components/UploadVotersModal";
import { fetchHierarchyChildren } from "../../../services/hierarchyApi";
import type { HierarchyChild } from "../../../types/hierarchy";

export default function StateAssembly() {
  const [stateId, setStateId] = useState<number | null>(null);
  const [stateName, setStateName] = useState<string>("");
  const [districts, setDistricts] = useState<HierarchyChild[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("");
  const [selectedDistrictParentId, setSelectedDistrictParentId] = useState<number | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedAssembly, setSelectedAssembly] = useState<{
    id: number;
    name: string;
  } | null>(null);

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

  // Fetch districts when state is available
  useEffect(() => {
    const loadDistricts = async () => {
      if (!stateId) return;

      try {
        const response = await fetchHierarchyChildren(stateId, {
          page: 1,
          limit: 100, // Get all districts
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

  // Handle district selection
  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    const district = districts.find(
      (d) => d.location_id.toString() === districtId
    );
    setSelectedDistrictName(district?.location_name || "");
    setSelectedDistrictParentId(district?.parent_id || null);

    console.log("District selected:", {
      districtId,
      districtName: district?.location_name,
      districtParentId: district?.parent_id,
    });
  };

  const handleUploadVoters = (assemblyId: number, assemblyName: string) => {
    // Find the assembly in the data to get its parent_id (which is the district)
    const assembly = data.find((item) => item.location_id === assemblyId);
    const districtIdFromAssembly = assembly?.parent_id || Number(selectedDistrictId);

    // Use the district's parent_id as state_id (since district's parent is the state)
    const actualStateId = selectedDistrictParentId || stateId;

    console.log("Upload Voters clicked:", {
      assemblyId,
      assemblyName,
      stateId,
      actualStateId,
      selectedDistrictId,
      selectedDistrictParentId,
      districtIdFromAssembly,
      assemblyParentId: assembly?.parent_id,
    });

    if (!actualStateId) {
      alert("State ID is missing. Please refresh the page or select a district.");
      return;
    }

    if (!selectedDistrictId && !districtIdFromAssembly) {
      alert("District ID is missing. Please select a district first.");
      return;
    }

    setSelectedAssembly({
      id: assemblyId,
      name: assemblyName,
    });
    setUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
    setSelectedAssembly(null);
  };

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
  } = useHierarchyData(
    selectedDistrictId ? Number(selectedDistrictId) : null,
    10
  );

  const handleSort = (
    sortBy: "location_name" | "total_users" | "active_users",
    order: "asc" | "desc"
  ) => {
    setSortBy(sortBy);
    setOrder(order);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <HierarchyTable
        data={data}
        loading={selectedDistrictId ? loading : false}
        error={error}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onSort={handleSort}
        onPageChange={setPage}
        currentPage={currentPage}
        totalItems={totalChildren}
        itemsPerPage={limit}
        title="Assembly List"
        emptyMessage={
          selectedDistrictId
            ? "No assemblies found for this district"
            : "Please select a district to view assemblies"
        }
        stateName={stateName || parentName}
        districtName={selectedDistrictName}
        districts={districts}
        selectedDistrict={selectedDistrictId}
        onDistrictChange={handleDistrictChange}
        showUploadVotersButton={true}
        onUploadVoters={handleUploadVoters}
      />

      {uploadModalOpen && selectedAssembly && (
        <UploadVotersModal
          isOpen={uploadModalOpen}
          onClose={handleCloseUploadModal}
          stateId={selectedDistrictParentId || stateId || 0}
          districtId={Number(selectedDistrictId) || 0}
          assemblyId={selectedAssembly.id}
          assemblyName={selectedAssembly.name}
        />
      )}
    </div>
  );
}
