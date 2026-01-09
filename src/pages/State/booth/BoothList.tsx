import React, { useState, useEffect } from "react";
import { useGetBlockHierarchyQuery } from "../../../store/api/blockTeamApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useDeleteAssignedLevelsMutation } from "../../../store/api/afterAssemblyApi";
import * as XLSX from "xlsx";
import InlineUserDisplay from "../../../components/InlineUserDisplay";

export default function StateBoothList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<number>(0);
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number>(0);
  const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
  const [selectedMandalId, setSelectedMandalId] = useState<number>(0);
  const [selectedPollingCenterId, setSelectedPollingCenterId] =
    useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedBoothId] = useState<number | null>(null);
  const [allBooths, setAllBooths] = useState<any[]>([]);

  // State for inline user display
  const [expandedBoothId, setExpandedBoothId] = useState<number | null>(null);
  const [boothUsers, setBoothUsers] = useState<Record<number, any[]>>({});
  const [isLoadingAllBooths, setIsLoadingAllBooths] = useState(false);
  const [boothsCache, setBoothsCache] = useState<{ [key: number]: any[] }>({});
  const [availableLevels, setAvailableLevels] = useState({
    hasPollingCenters: false,
    hasMandals: true,
    hasBlocks: true,
    deepestLevel: "mandal", // mandal, pollingCenter, etc.
  });

  // State for filtering booths without users
  const [showBoothsWithoutUsers, setShowBoothsWithoutUsers] = useState(false);

  const [districts, setDistricts] = useState<any[]>([]);
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);

  const selectedAssignment = useSelector(
    (state: RootState) => state.auth.selectedAssignment
  );

  const [stateInfo, setStateInfo] = useState({
    stateName: "",
    stateId: 0,
  });

  useEffect(() => {
    if (selectedAssignment) {
      setStateInfo({
        stateName: selectedAssignment.levelName || "",
        stateId: selectedAssignment.stateMasterData_id || 0,
      });
    }
  }, [selectedAssignment]);

  // Optimized function to fetch all booths with parallel requests and batching
  const fetchAllBooths = async () => {
    if (!stateInfo.stateId) return;

    setIsLoadingAllBooths(true);
    const allBoothsData: any[] = [];

    try {
      // Function to fetch all pages of data
      const fetchAllPages = async (url: string) => {
        let allData: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await fetch(`${url}?page=${page}&limit=50`, {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem("auth_access_token")}` 
            }
          });
          const data = await response.json();
          
          let currentPageData: any[] = [];
          
          if (data.success && data.data?.children && data.data.children.length > 0) {
            currentPageData = data.data.children;
            allData = allData.concat(currentPageData);
            hasMore = currentPageData.length === 50;
          } else if (data.success && data.children && data.children.length > 0) {
            currentPageData = data.children;
            allData = allData.concat(currentPageData);
            hasMore = currentPageData.length === 50;
          } else {
            hasMore = false;
          }

          page++;
        }

        return allData;
      };

      // Step 1: Fetch all districts with pagination
      const districts = await fetchAllPages(
        `${import.meta.env.VITE_API_BASE_URL}/api/user-state-hierarchies/hierarchy/children/${stateInfo.stateId}`
      );

      if (!districts || districts.length === 0) {
        return;
      }

      // Step 2: Fetch all assemblies in parallel
      const assemblyPromises = districts.map(
        async (district: any) => {
          try {
            const assemblies = await fetchAllPages(
              `${import.meta.env.VITE_API_BASE_URL}/api/user-state-hierarchies/hierarchy/children/${district.location_id}`
            );
            return {
              district,
              assemblies: assemblies || [],
            };
          } catch (error) {
            console.error(
              `Error fetching assemblies for district ${district.location_id}:`,
              error
            );
            return { district, assemblies: [] };
          }
        }
      );

      const assemblyResults = await Promise.all(assemblyPromises);

      // Step 3: Fetch all blocks in parallel
      const blockPromises: Promise<any>[] = [];
      assemblyResults.forEach(({ district, assemblies }) => {
        assemblies.forEach((assembly: any) => {
          blockPromises.push(
            fetch(
              `${
                import.meta.env.VITE_API_BASE_URL
              }/api/after-assembly-data/assembly/${assembly.location_id}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                    "auth_access_token"
                  )}`,
                },
              }
            )
              .then((response) => response.json())
              .then((data) => ({
                district,
                assembly,
                blocks: data.success ? data.data || [] : [],
              }))
              .catch((error) => {
                console.error(
                  `Error fetching blocks for assembly ${assembly.location_id}:`,
                  error
                );
                return { district, assembly, blocks: [] };
              })
          );
        });
      });

      const blockResults = await Promise.all(blockPromises);

      // Step 4: Fetch all mandals in parallel
      const mandalPromises: Promise<any>[] = [];
      blockResults.forEach(({ district, assembly, blocks }) => {
        blocks.forEach((block: any) => {
          mandalPromises.push(
            fetchAllPages(
              `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${block.id}`
            )
              .then((mandals) => ({
                district,
                assembly,
                block,
                mandals: mandals || [],
              }))
              .catch((error) => {
                console.error(
                  `Error fetching mandals for block ${block.id}:`,
                  error
                );
                return { district, assembly, block, mandals: [] };
              })
          );
        });
      });

      const mandalResults = await Promise.all(mandalPromises);

      // Step 5: Fetch all booths in parallel (final level)
      const boothPromises: Promise<any>[] = [];
      mandalResults.forEach(({ district, assembly, block, mandals }) => {
        mandals.forEach((mandal: any) => {
          boothPromises.push(
            fetchAllPages(
              `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${mandal.id}`
            )
              .then((children) => {
                if (children && children.length > 0) {
                  const firstChild = children[0];

                  if (firstChild.levelName === "Booth") {
                    // Direct booths under mandal
                    return children.map((booth: any) => ({
                      ...booth,
                      hierarchyPath: `${stateInfo.stateName} → ${district.location_name} → ${assembly.location_name} → ${block.displayName} → ${mandal.displayName}`,
                      sourceLevel: "Mandal",
                      districtName: district.location_name,
                      assemblyName: assembly.location_name,
                      blockName: block.displayName,
                      mandalName: mandal.displayName,
                    }));
                  } else {
                    // These are polling centers - fetch booths from each
                    const pollingCenterPromises = children.map(
                      (pollingCenter: any) =>
                        fetchAllPages(
                          `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${pollingCenter.id}`
                        )
                          .then((boothChildren) => {
                            if (boothChildren && boothChildren.length > 0) {
                              return boothChildren.map((booth: any) => ({
                                ...booth,
                                hierarchyPath: `${stateInfo.stateName} → ${district.location_name} → ${assembly.location_name} → ${block.displayName} → ${mandal.displayName} → ${pollingCenter.displayName}`,
                                sourceLevel: "Polling Center",
                                districtName: district.location_name,
                                assemblyName: assembly.location_name,
                                blockName: block.displayName,
                                mandalName: mandal.displayName,
                                pollingCenterName: pollingCenter.displayName,
                              }));
                            }
                            return [];
                          })
                          .catch((error) => {
                            console.error(
                              `Error fetching booths for polling center ${pollingCenter.id}:`,
                              error
                            );
                            return [];
                          })
                    );

                    return Promise.all(pollingCenterPromises).then((results) =>
                      results.flat()
                    );
                  }
                }
                return [];
              })
              .catch((error) => {
                console.error(
                  `Error fetching children for mandal ${mandal.id}:`,
                  error
                );
                return [];
              })
          );
        });
      });

      // Wait for all booth requests to complete
      const boothResults = await Promise.all(boothPromises);

      // Flatten all booth results
      const flatBooths = boothResults.flat();
      
      // Remove duplicates based on booth ID
      const seenIds = new Set();
      const uniqueBooths = flatBooths.filter((booth) => {
        if (seenIds.has(booth.id)) {
          return false;
        }
        seenIds.add(booth.id);
        return true;
      });
      
      allBoothsData.push(...uniqueBooths);

      setAllBooths(allBoothsData);
      // Cache the results
      setBoothsCache((prev) => ({
        ...prev,
        [stateInfo.stateId]: allBoothsData,
      }));
    } catch (error) {
      console.error("Error fetching all booths:", error);
    } finally {
      setIsLoadingAllBooths(false);
    }
  };

  // Function to detect available hierarchy levels
  const detectHierarchyLevels = async () => {
    if (!stateInfo.stateId) return;

    try {
      // Check a sample path to determine hierarchy structure
      const districtsResponse = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/user-state-hierarchies/hierarchy/children/${
          stateInfo.stateId
        }?page=1&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "auth_access_token"
            )}`,
          },
        }
      );
      const districtsData = await districtsResponse.json();

      if (districtsData.success && districtsData.data?.children?.length > 0) {
        const sampleDistrict = districtsData.data.children[0];

        // Check assemblies
        const assembliesResponse = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/user-state-hierarchies/hierarchy/children/${
            sampleDistrict.location_id
          }?page=1&limit=1`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "auth_access_token"
              )}`,
            },
          }
        );
        const assembliesData = await assembliesResponse.json();

        if (
          assembliesData.success &&
          assembliesData.data?.children?.length > 0
        ) {
          const sampleAssembly = assembliesData.data.children[0];

          // Check blocks
          const blocksResponse = await fetch(
            `${
              import.meta.env.VITE_API_BASE_URL
            }/api/after-assembly-data/assembly/${sampleAssembly.location_id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem(
                  "auth_access_token"
                )}`,
              },
            }
          );
          const blocksData = await blocksResponse.json();

          if (blocksData.success && blocksData.data?.length > 0) {
            const sampleBlock = blocksData.data[0];

            // Check mandals
            const mandalsResponse = await fetch(
              `${
                import.meta.env.VITE_API_BASE_URL
              }/api/user-after-assembly-hierarchy/hierarchy/children/${
                sampleBlock.id
              }`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                    "auth_access_token"
                  )}`,
                },
              }
            );
            const mandalsData = await mandalsResponse.json();

            if (mandalsData.success && mandalsData.children?.length > 0) {
              const sampleMandal = mandalsData.children[0];

              // Check what's under mandal
              const childrenResponse = await fetch(
                `${
                  import.meta.env.VITE_API_BASE_URL
                }/api/user-after-assembly-hierarchy/hierarchy/children/${
                  sampleMandal.id
                }`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem(
                      "auth_access_token"
                    )}`,
                  },
                }
              );
              const childrenData = await childrenResponse.json();

              if (childrenData.success && childrenData.children?.length > 0) {
                const firstChild = childrenData.children[0];

                if (firstChild.levelName === "Booth") {
                  // Direct booths under mandal
                  setAvailableLevels({
                    hasPollingCenters: false,
                    hasMandals: true,
                    hasBlocks: true,
                    deepestLevel: "mandal",
                  });
                } else {
                  // Polling centers exist
                  setAvailableLevels({
                    hasPollingCenters: true,
                    hasMandals: true,
                    hasBlocks: true,
                    deepestLevel: "pollingCenter",
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error detecting hierarchy levels:", error);
    }
  };

  // Fetch all booths when state info is available (with caching)
  useEffect(() => {
    if (stateInfo.stateId) {
      detectHierarchyLevels();

      // Check cache first
      if (boothsCache[stateInfo.stateId]) {
        setAllBooths(boothsCache[stateInfo.stateId]);
      } else {
        fetchAllBooths();
      }
    }
  }, [stateInfo.stateId]);

  // Fetch districts using user-state-hierarchies API
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!stateInfo.stateId) return;
      try {
        // Function to fetch all pages of districts
        const fetchAllDistrictPages = async () => {
          let allDistricts: any[] = [];
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const response = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/api/user-state-hierarchies/hierarchy/children/${stateInfo.stateId}?page=${page}&limit=50`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                },
              }
            );
            const data = await response.json();
            
            if (data.success && data.data?.children && data.data.children.length > 0) {
              allDistricts = allDistricts.concat(data.data.children);
              page++;
              hasMore = data.data.children.length === 50;
            } else {
              hasMore = false;
            }
          }
          return allDistricts;
        };

        const districtsData = await fetchAllDistrictPages();
        const mappedDistricts = districtsData.map((district: any) => ({
          id: district.location_id || district.id,
          displayName: district.location_name,
          levelName: "District",
          location_id: district.location_id,
        }));
        setDistricts(mappedDistricts);
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    };
    fetchDistricts();
  }, [stateInfo.stateId]);

  // Districts loaded - no auto-selection

  // Fetch assemblies when district is selected
  useEffect(() => {
    const fetchAssemblies = async () => {
      if (!selectedDistrictId) {
        setAssemblies([]);
        return;
      }
      try {
        // Function to fetch all pages of assemblies
        const fetchAllAssemblyPages = async () => {
          let allAssemblies: any[] = [];
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const response = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/api/user-state-hierarchies/hierarchy/children/${selectedDistrictId}?page=${page}&limit=50`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                },
              }
            );
            const data = await response.json();
            
            if (data.success && data.data?.children && data.data.children.length > 0) {
              allAssemblies = allAssemblies.concat(data.data.children);
              page++;
              hasMore = data.data.children.length === 50;
            } else {
              hasMore = false;
            }
          }
          return allAssemblies;
        };

        const assembliesData = await fetchAllAssemblyPages();
        const mappedAssemblies = assembliesData.map((assembly: any) => ({
          id: assembly.location_id || assembly.id,
          displayName: assembly.location_name,
          levelName: "Assembly",
          location_id: assembly.location_id,
        }));
        setAssemblies(mappedAssemblies);
      } catch (error) {
        console.error("Error fetching assemblies:", error);
      }
    };
    fetchAssemblies();
  }, [selectedDistrictId]);

  // Assemblies loaded - no auto-selection

  // Fetch blocks when assembly is selected
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!selectedAssemblyId) {
        setBlocks([]);
        return;
      }
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/after-assembly-data/assembly/${selectedAssemblyId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "auth_access_token"
              )}`,
            },
          }
        );
        const data = await response.json();
        if (data.success) {
          setBlocks(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching blocks:", error);
      }
    };
    fetchBlocks();
  }, [selectedAssemblyId]);

  // Blocks loaded - no auto-selection

  // Fetch mandals for selected block
  const { data: mandalHierarchyData } = useGetBlockHierarchyQuery(
    selectedBlockId,
    { skip: !selectedBlockId }
  );

  const mandals = mandalHierarchyData?.children || [];

  // Mandals loaded - no auto-selection

  // Fetch polling centers for selected mandal
  const { data: pollingCenterHierarchyData } = useGetBlockHierarchyQuery(
    selectedMandalId,
    { skip: !selectedMandalId }
  );

  const pollingCenters = pollingCenterHierarchyData?.children || [];

  // Polling centers loaded - no auto-selection

  // Legacy booth fetching for selected polling center (kept for backward compatibility)
  const { isLoading: loadingBooths, error } = useGetBlockHierarchyQuery(
    selectedPollingCenterId,
    { skip: !selectedPollingCenterId }
  );

  // Use all booths by default, or filtered booths based on selected hierarchy levels
  const booths = (() => {
    // If any filter is selected, filter from allBooths based on hierarchy
    if (
      selectedDistrictId > 0 ||
      selectedAssemblyId > 0 ||
      selectedBlockId > 0 ||
      selectedMandalId > 0 ||
      selectedPollingCenterId > 0
    ) {
      return allBooths.filter((booth) => {
        // Check district filter using pre-computed name
        if (selectedDistrictId > 0) {
          const selectedDistrict = districts.find(
            (d) =>
              d.id === selectedDistrictId ||
              d.location_id === selectedDistrictId
          );
          if (
            !selectedDistrict ||
            booth.districtName !== selectedDistrict.displayName
          ) {
            return false;
          }
        }

        // Check assembly filter using pre-computed name
        if (selectedAssemblyId > 0) {
          const selectedAssembly = assemblies.find(
            (a) =>
              a.id === selectedAssemblyId ||
              a.location_id === selectedAssemblyId
          );
          if (
            !selectedAssembly ||
            booth.assemblyName !== selectedAssembly.displayName
          ) {
            return false;
          }
        }

        // Check block filter using pre-computed name
        if (selectedBlockId > 0) {
          const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
          if (!selectedBlock || booth.blockName !== selectedBlock.displayName) {
            return false;
          }
        }

        // Check mandal filter using pre-computed name
        if (selectedMandalId > 0) {
          const selectedMandal = mandals.find((m) => m.id === selectedMandalId);
          if (
            !selectedMandal ||
            booth.mandalName !== selectedMandal.displayName
          ) {
            return false;
          }
        }

        // Check polling center filter using pre-computed name (if applicable)
        if (selectedPollingCenterId > 0 && availableLevels.hasPollingCenters) {
          const selectedPollingCenter = pollingCenters.find(
            (pc) => pc.id === selectedPollingCenterId
          );
          if (
            !selectedPollingCenter ||
            booth.pollingCenterName !== selectedPollingCenter.displayName
          ) {
            return false;
          }
        }

        return true;
      });
    }

    // Return all booths if no filters are selected
    return allBooths;
  })();

  // Handle booths without users filter
  const handleBoothsWithoutUsersClick = () => {
    const boothsWithoutUsersCount = booths.filter(
      (booth) => (booth.user_count || 0) === 0
    ).length;

    if (boothsWithoutUsersCount > 0) {
      setShowBoothsWithoutUsers(!showBoothsWithoutUsers);
      setCurrentPage(1); // Reset to page 1
    }
  };

  const filteredBooths = booths.filter((booth) => {
    const matchesSearch =
      booth.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booth.hierarchyPath &&
        booth.hierarchyPath.toLowerCase().includes(searchTerm.toLowerCase()));

    // Apply booths without users filter
    const matchesWithoutUsersFilter = showBoothsWithoutUsers
      ? (booth.user_count || 0) === 0
      : true;

    return matchesSearch && matchesWithoutUsersFilter;
  });

  const handleViewUsers = async (boothId: number) => {
    // If already expanded, collapse it
    if (expandedBoothId === boothId) {
      setExpandedBoothId(null);
      return;
    }

    // If users already loaded, just expand
    if (boothUsers[boothId]) {
      setExpandedBoothId(boothId);
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/user-after-assembly-hierarchy/after-assembly/${boothId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "auth_access_token"
            )}`,
          },
        }
      );
      const data = await response.json();

      if (data.success && data.data?.users) {
        // Store users data
        setBoothUsers((prev) => ({
          ...prev,
          [boothId]: data.data.users,
        }));
        setExpandedBoothId(boothId);
      } else {
        // No users found or API error
      }
    } catch (error) {
      console.error(`Error fetching users for booth ${boothId}:`, error);
    }
  };

  // Excel export function
  const exportToExcel = () => {
    // Prepare data for Excel export
    const excelData = allBooths.map((booth, index) => ({
      "S.No": index + 1,
      "District Name": booth.districtName || "",
      "Assembly Name": booth.assemblyName || "",
      "Block Name": booth.blockName || "",
      "Mandal Name": booth.mandalName || "",
      "Polling Center Name": booth.pollingCenterName || "", // Show only if booth is under polling center
      "Booth Name": booth.displayName || "",
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 8 }, // S.No
      { wch: 20 }, // District Name
      { wch: 20 }, // Assembly Name
      { wch: 20 }, // Block Name
      { wch: 20 }, // Mandal Name
      { wch: 25 }, // Polling Center Name
      { wch: 25 }, // Booth Name
    ];
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Booths");

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `Booth_List_${stateInfo.stateName.replace(
      /\s+/g,
      "_"
    )}_${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  // Delete mutation
  const [deleteAssignedLevels, { isLoading: isDeleting }] =
    useDeleteAssignedLevelsMutation();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  const handleConfirmDelete = async () => {
    if (!userToDelete || !selectedBoothId) return;

    try {
      setShowConfirmModal(false);

      const response = await deleteAssignedLevels({
        user_id: userToDelete.user_id,
        afterAssemblyData_ids: [selectedBoothId],
      }).unwrap();

      if (response.success && response.deleted.length > 0) {
        window.location.reload();
      } else if (response.errors && response.errors.length > 0) {
        alert(
          `Error: ${
            response.errors[0].error || "Failed to delete user assignment"
          }`
        );
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(
        error?.data?.message ||
          "Failed to delete user assignment. Please try again."
      );
    } finally {
      setUserToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setUserToDelete(null);
  };

  const totalPages = Math.ceil(filteredBooths.length / itemsPerPage);
  const paginatedBooths = filteredBooths.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen !== null) {
        const target = event.target as Element;
        if (!target.closest(".relative")) {
          setDropdownOpen(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-1">
      <div className="w-full mx-auto">
        {/* Header with Stats Cards */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-3 mb-1 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="shrink-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                Booth List
              </h1>
            </div>

            {/* Excel Export Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={exportToExcel}
                disabled={allBooths.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                title="Export all booths to Excel"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export Excel ({allBooths.length})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              {/* Total Booths Card */}
              <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Total Booths
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold mt-1">
                    {booths.length}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-full p-1.5">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0-8h2a2 2 0 012 2v6a2 2 0 01-2 2H9m0-8v8m0-8h6m-6 8h6"
                    />
                  </svg>
                </div>
              </div>

              {/* Total Users Card */}
              <div className="bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-green-600 mt-1">
                    {booths.reduce(
                      (sum, booth) => sum + (booth.user_count || 0),
                      0
                    )}
                  </p>
                </div>
                <div className="bg-green-50 rounded-full p-1.5">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Booths Without Users Card - Clickable */}
              <div
                onClick={handleBoothsWithoutUsersClick}
                className={`bg-white text-gray-900 rounded-md shadow-md p-3 flex items-center justify-between transition-all duration-200 ${
                  booths.filter((booth) => (booth.user_count || 0) === 0)
                    .length > 0
                    ? "cursor-pointer hover:shadow-lg hover:scale-105 hover:bg-red-50"
                    : "cursor-default"
                } ${
                  showBoothsWithoutUsers ? "ring-2 ring-red-500 bg-red-50" : ""
                }`}
                title={
                  booths.filter((booth) => (booth.user_count || 0) === 0)
                    .length > 0
                    ? "Click to view booths without users"
                    : "No booths without users"
                }
              >
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    Booths Without Users
                    {showBoothsWithoutUsers && (
                      <span className="ml-2 text-red-600 font-semibold">
                        (Filtered)
                      </span>
                    )}
                  </p>
                  <p
                    className={`text-xl sm:text-2xl font-semibold mt-1 ${
                      booths.filter((booth) => (booth.user_count || 0) === 0)
                        .length > 0
                        ? "text-red-600"
                        : "text-gray-400"
                    }`}
                  >
                    {
                      booths.filter((booth) => (booth.user_count || 0) === 0)
                        .length
                    }
                  </p>
                </div>
                <div
                  className={`rounded-full p-1.5 ${
                    booths.filter((booth) => (booth.user_count || 0) === 0)
                      .length > 0
                      ? "bg-red-50"
                      : "bg-gray-50"
                  }`}
                >
                  {booths.filter((booth) => (booth.user_count || 0) === 0)
                    .length > 0 ? (
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-3 mb-1">
          {/* Hierarchy Info */}

          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${
              availableLevels.hasPollingCenters
                ? "lg:grid-cols-6"
                : "lg:grid-cols-5"
            }`}
          >
            {/* State - Always visible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={stateInfo.stateName}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* District - Always visible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select District <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => {
                  setSelectedDistrictId(Number(e.target.value));
                  setSelectedAssemblyId(0);
                  setSelectedBlockId(0);
                  setSelectedMandalId(0);
                  setSelectedPollingCenterId(0);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={0}>Select District</option>
                {districts.map((district) => (
                  <option
                    key={district.location_id || district.id}
                    value={district.location_id || district.id}
                  >
                    {district.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Assembly - Always visible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assembly (Optional)
              </label>
              <select
                value={selectedAssemblyId}
                onChange={(e) => {
                  setSelectedAssemblyId(Number(e.target.value));
                  setSelectedBlockId(0);
                  setSelectedMandalId(0);
                  setSelectedPollingCenterId(0);
                  setCurrentPage(1);
                }}
                disabled={!selectedDistrictId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value={0}>All Assemblies in District</option>
                {assemblies.map((assembly) => (
                  <option
                    key={assembly.location_id || assembly.id}
                    value={assembly.location_id || assembly.id}
                  >
                    {assembly.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Block - Show if available */}
            {availableLevels.hasBlocks && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Block (Optional)
                </label>
                <select
                  value={selectedBlockId}
                  onChange={(e) => {
                    setSelectedBlockId(Number(e.target.value));
                    setSelectedMandalId(0);
                    setSelectedPollingCenterId(0);
                    setCurrentPage(1);
                  }}
                  disabled={!selectedAssemblyId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value={0}>All Blocks in Assembly</option>
                  {blocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.displayName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mandal - Show if available */}
            {availableLevels.hasMandals && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mandal (Optional)
                </label>
                <select
                  value={selectedMandalId}
                  onChange={(e) => {
                    setSelectedMandalId(Number(e.target.value));
                    setSelectedPollingCenterId(0);
                    setCurrentPage(1);
                  }}
                  disabled={!selectedBlockId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value={0}>All Mandals in Block</option>
                  {mandals.map((mandal) => (
                    <option key={mandal.id} value={mandal.id}>
                      {mandal.displayName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Polling Center - Show only if available */}
            {availableLevels.hasPollingCenters && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Polling Center (Optional)
                </label>
                <select
                  value={selectedPollingCenterId}
                  onChange={(e) => {
                    setSelectedPollingCenterId(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  disabled={!selectedMandalId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value={0}>All Polling Centers in Mandal</option>
                  {pollingCenters.map((pc) => (
                    <option key={pc.id} value={pc.id}>
                      {pc.displayName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Booths
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by booth name or location..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Booth List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {isLoadingAllBooths || loadingBooths ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading booths...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>Error loading booths</p>
            </div>
          ) : filteredBooths.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="mt-2 text-gray-500 font-medium">No booths found</p>
              {searchTerm && (
                <p className="mt-1 text-sm text-gray-400">
                  Try adjusting your search terms
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-purple-50 to-purple-100 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        S.No
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Mandal
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Level Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Display Name
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Total Users
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedBooths.map((booth, index) => (
                      <React.Fragment key={booth.id}>
                        <tr
                          key={booth.id}
                          className="hover:bg-purple-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {booth.mandalName || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {booth.levelName || "Booth"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="bg-purple-100 p-2 rounded-lg">
                                <svg
                                  className="w-5 h-5 text-purple-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {booth.displayName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewUsers(booth.id)}
                                className={`inline-flex items-center p-1 rounded-md transition-colors ${
                                  expandedBoothId === booth.id
                                    ? "text-purple-700 bg-purple-100"
                                    : "text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                                }`}
                                title={
                                  expandedBoothId === booth.id
                                    ? "Hide Users"
                                    : "View Users"
                                }
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </button>
                              <span className="text-sm font-medium text-gray-900">
                                {booth.user_count || 0}
                              </span>
                            </div>
                          </td>
                          {/* <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${booth.isActive === 1
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                            }`}>
                                                            {booth.isActive === 1 ? "Active" : "Inactive"}
                                                        </span>
                                                    </td> */}
                        </tr>

                        {/* Inline User Display */}
                        {expandedBoothId === booth.id &&
                          boothUsers[booth.id] && (
                            <InlineUserDisplay
                              users={boothUsers[booth.id]}
                              locationName={booth.displayName}
                              locationId={booth.id}
                              locationType="Booth"
                              parentLocationName={
                                booth.mandalName || "Unknown Mandal"
                              }
                              parentLocationType="Mandal"
                              onUserDeleted={() => {
                                // Refresh user counts after deletion
                                setExpandedBoothId(null);
                                setBoothUsers((prev) => {
                                  const updated = { ...prev };
                                  delete updated[booth.id];
                                  return updated;
                                });
                                window.location.reload();
                              }}
                              onClose={() => setExpandedBoothId(null)}
                              colSpan={5}
                            />
                          )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredBooths.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      <span>
                        Showing{" "}
                        <span className="font-semibold">
                          {(currentPage - 1) * itemsPerPage + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-semibold">
                          {Math.min(
                            currentPage * itemsPerPage,
                            filteredBooths.length
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold">
                          {filteredBooths.length}
                        </span>{" "}
                        results
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-sm font-medium text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Delete
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Are you sure you want to remove this user assignment?
                </p>
              </div>
            </div>

            {userToDelete && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">User:</span> {userToDelete.name}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Email:</span>{" "}
                  {userToDelete.email}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
