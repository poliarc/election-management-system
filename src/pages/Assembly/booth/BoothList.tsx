import { useState, useEffect, Fragment, type ChangeEvent } from "react";
import { useGetBlocksByAssemblyQuery } from "../../../store/api/blockApi";
import { useGetBlockHierarchyQuery } from "../../../store/api/blockTeamApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import AssignBoothVotersModal from "../../../components/AssignBoothVotersModal";
import InlineUserDisplay from "../../../components/InlineUserDisplay";
import toast from "react-hot-toast";

export default function BoothList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
  const [selectedMandalId, setSelectedMandalId] = useState<number>(0);
  const [selectedPollingCenterId, setSelectedPollingCenterId] =
    useState<number>(0);
  const [selectedBoothFilter, setSelectedBoothFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // State for all booths in the assembly
  const [allBooths, setAllBooths] = useState<any[]>([]);
  const [isLoadingAllBooths, setIsLoadingAllBooths] = useState(false);

  const [showAssignVotersModal, setShowAssignVotersModal] = useState(false);
  const [selectedBoothForVoters, setSelectedBoothForVoters] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // State for inline user display
  const [expandedBoothId, setExpandedBoothId] = useState<number | null>(null);
  const [boothUsers, setBoothUsers] = useState<Record<number, any[]>>({});
  const [boothFiles, setBoothFiles] = useState<
    Record<
      number,
      { loading: boolean; error: string | null; data: any[]; fetched: boolean }
    >
  >({});
  const [expandedFilesBoothId, setExpandedFilesBoothId] = useState<
    number | null
  >(null);

  // State for filtering booths without users
  const [showBoothsWithoutUsers, setShowBoothsWithoutUsers] = useState(false);

  const selectedAssignment = useSelector(
    (state: RootState) => state.auth.selectedAssignment
  );

  const [assemblyInfo, setAssemblyInfo] = useState({
    assemblyName: "",
    districtName: "",
    stateName: "",
    assemblyId: 0,
    stateId: 0,
    districtId: 0,
  });

  useEffect(() => {
    if (selectedAssignment) {
      setAssemblyInfo({
        assemblyName: selectedAssignment.levelName || "",
        districtName: selectedAssignment.parentLevelName || "",
        stateName:
          (selectedAssignment as any).stateName ||
          (selectedAssignment as any).state_name ||
          "",
        assemblyId: selectedAssignment.stateMasterData_id || 0,
        stateId: (selectedAssignment as any).state_id || 0,
        districtId:
          (selectedAssignment as any).district_id ||
          (selectedAssignment as any).parentStateMasterData_id ||
          0,
      });
    }
  }, [selectedAssignment]);

  // Fetch blocks for the assembly
  const { data: blocks = [] } = useGetBlocksByAssemblyQuery(
    assemblyInfo.assemblyId,
    { skip: !assemblyInfo.assemblyId }
  );

  // Function to fetch all booths from all polling centers in the assembly
  const fetchAllBooths = async () => {
    if (!assemblyInfo.assemblyId || blocks.length === 0) return;

    setIsLoadingAllBooths(true);
    const allBoothsData: any[] = [];

    try {
      const token = localStorage.getItem("auth_access_token");

      // Step 1: Fetch all mandals from all blocks
      const mandalPromises = blocks.map(async (block: any) => {
        try {
          let allBlockMandals: any[] = [];
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const response = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${block.id}?page=${page}&limit=50`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const data = await response.json();
            
            if (data.success && data.children && data.children.length > 0) {
              allBlockMandals = allBlockMandals.concat(data.children);
              page++;
              hasMore = data.children.length === 50;
            } else {
              hasMore = false;
            }
          }

          return allBlockMandals.map((mandal: any) => ({
            ...mandal,
            blockName: block.displayName,
            blockId: block.id,
          }));
        } catch (error) {
          console.error(`Error fetching mandals for block ${block.id}:`, error);
          return [];
        }
      });

      const mandalResults = await Promise.all(mandalPromises);
      const allMandals = mandalResults.flat();

      // Step 2: Fetch all polling centers from all mandals
      const pollingCenterPromises = allMandals.map(async (mandal: any) => {
        try {
          let allMandalPollingCenters: any[] = [];
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const response = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${mandal.id}?page=${page}&limit=50`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const data = await response.json();
            
            if (data.success && data.children && data.children.length > 0) {
              allMandalPollingCenters = allMandalPollingCenters.concat(data.children);
              page++;
              hasMore = data.children.length === 50;
            } else {
              hasMore = false;
            }
          }

          // Filter out booths and add hierarchy info
          return allMandalPollingCenters
            .filter((child: any) => {
              return (
                child.levelName !== "Booth" &&
                child.levelName !== "booth"
              );
            })
            .map((pollingCenter: any) => ({
              ...pollingCenter,
              blockName: mandal.blockName,
              blockId: mandal.blockId,
              mandalName: mandal.displayName,
              mandalId: mandal.id,
            }));
        } catch (error) {
          console.error(`Error fetching polling centers for mandal ${mandal.id}:`, error);
          return [];
        }
      });

      const pollingCenterResults = await Promise.all(pollingCenterPromises);
      const allPollingCenters = pollingCenterResults.flat();

      // Step 3: Fetch all booths from all polling centers
      const boothPromises = allPollingCenters.map(async (pollingCenter: any) => {
        try {
          let allPollingCenterBooths: any[] = [];
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const response = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${pollingCenter.id}?page=${page}&limit=50`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const data = await response.json();
            
            if (data.success && data.children && data.children.length > 0) {
              allPollingCenterBooths = allPollingCenterBooths.concat(data.children);
              page++;
              hasMore = data.children.length === 50;
            } else {
              hasMore = false;
            }
          }

          // Add hierarchy info to booths
          return allPollingCenterBooths.map((booth: any) => ({
            ...booth,
            blockName: pollingCenter.blockName,
            blockId: pollingCenter.blockId,
            mandalName: pollingCenter.mandalName,
            mandalId: pollingCenter.mandalId,
            pollingCenterName: pollingCenter.displayName,
            pollingCenterId: pollingCenter.id,
          }));
        } catch (error) {
          console.error(`Error fetching booths for polling center ${pollingCenter.id}:`, error);
          return [];
        }
      });

      const boothResults = await Promise.all(boothPromises);
      const flatBooths = boothResults.flat();
      allBoothsData.push(...flatBooths);

      // Also check for direct booths under mandals (not under polling centers)
      const directBoothPromises = allMandals.map(async (mandal: any) => {
        try {
          let allMandalChildren: any[] = [];
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const response = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${mandal.id}?page=${page}&limit=50`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const data = await response.json();
            
            if (data.success && data.children && data.children.length > 0) {
              allMandalChildren = allMandalChildren.concat(data.children);
              page++;
              hasMore = data.children.length === 50;
            } else {
              hasMore = false;
            }
          }

          // Filter for direct booths (not polling centers)
          const directBooths = allMandalChildren
            .filter((child: any) => {
              return (
                child.levelName === "Booth" ||
                child.levelName === "booth"
              );
            })
            .map((booth: any) => ({
              ...booth,
              blockName: mandal.blockName,
              blockId: mandal.blockId,
              mandalName: mandal.displayName,
              mandalId: mandal.id,
              pollingCenterName: null,
              pollingCenterId: null,
            }));

          return directBooths;
        } catch (error) {
          console.error(`Error fetching direct booths for mandal ${mandal.id}:`, error);
          return [];
        }
      });

      const directBoothResults = await Promise.all(directBoothPromises);
      const flatDirectBooths = directBoothResults.flat();
      allBoothsData.push(...flatDirectBooths);

      setAllBooths(allBoothsData);
    } catch (error) {
      console.error("Error fetching all booths:", error);
    } finally {
      setIsLoadingAllBooths(false);
    }
  };

  // Fetch all booths when blocks are loaded
  useEffect(() => {
    if (blocks.length > 0) {
      fetchAllBooths();
    }
  }, [blocks]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchAssemblyDetails = async () => {
      if (!assemblyInfo.assemblyId || assemblyInfo.stateId !== 0) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/state-master-data/${
            assemblyInfo.assemblyId
          }`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "auth_access_token"
              )}`,
            },
          }
        );
        const data = await response.json();

        if (data.success && data.data) {
          setAssemblyInfo((prev) => ({
            ...prev,
            stateId: data.data.state_id || 0,
            districtId: data.data.district_id || data.data.parent_id || 0,
            stateName:
              data.data.state_name ||
              data.data.stateName ||
              prev.stateName ||
              "",
          }));
        }
      } catch (error) {
        console.error("Error fetching assembly details:", error);
      }
    };

    fetchAssemblyDetails();
  }, [assemblyInfo.assemblyId]);

  // Fetch mandals for selected block
  const { data: mandalHierarchyData } = useGetBlockHierarchyQuery(
    selectedBlockId,
    { skip: !selectedBlockId }
  );

  const mandals = mandalHierarchyData?.children || [];

  // Fetch polling centers for selected mandal
  const { data: pollingCenterHierarchyData } = useGetBlockHierarchyQuery(
    selectedMandalId,
    { skip: !selectedMandalId }
  );

  const pollingCenters = pollingCenterHierarchyData?.children || [];

  // Use all booths by default, or filtered booths based on selected filters
  const booths = (() => {
    let filteredBooths = allBooths;

    // Filter by selected block
    if (selectedBlockId > 0) {
      filteredBooths = filteredBooths.filter((booth) => booth.blockId === selectedBlockId);
    }

    // Filter by selected mandal
    if (selectedMandalId > 0) {
      filteredBooths = filteredBooths.filter((booth) => booth.mandalId === selectedMandalId);
    }

    // Filter by selected polling center
    if (selectedPollingCenterId > 0) {
      filteredBooths = filteredBooths.filter((booth) => booth.pollingCenterId === selectedPollingCenterId);
    }

    return filteredBooths;
  })();

  // State for additional booth functionality
  const [uploadingBoothId, setUploadingBoothId] = useState<number | null>(null);
  const [hasPollingCentersWithBooths, setHasPollingCentersWithBooths] = useState(false);

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
    const matchesSearch = booth.displayName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesBoothFilter =
      selectedBoothFilter === "" || booth.id.toString() === selectedBoothFilter;

    // Only apply polling center filter if we have polling centers with booths
    const matchesPollingCenterFilter =
      !hasPollingCentersWithBooths ||
      selectedPollingCenterId === 0 ||
      (selectedPollingCenterId === -1 && !booth.pollingCenterId) || // -1 for direct booths
      booth.pollingCenterId === selectedPollingCenterId;

    // Apply booths without users filter
    const matchesWithoutUsersFilter = showBoothsWithoutUsers
      ? (booth.user_count || 0) === 0
      : true;

    return (
      matchesSearch &&
      matchesBoothFilter &&
      matchesPollingCenterFilter &&
      matchesWithoutUsersFilter
    );
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

  const handleViewFiles = async (boothId: number) => {
    if (expandedFilesBoothId === boothId) {
      setExpandedFilesBoothId(null);
      return;
    }

    const entry = boothFiles[boothId];
    if (entry?.fetched && !entry.loading) {
      setExpandedFilesBoothId(boothId);
      return;
    }

    setBoothFiles((prev) => ({
      ...prev,
      [boothId]: { loading: true, error: null, data: [], fetched: false },
    }));

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/booth-deleted-voter-files/booth/${boothId}?page=1&limit=20`,
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("auth_access_token")}` || "",
          },
        }
      );
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to fetch files");
      }

      setBoothFiles((prev) => ({
        ...prev,
        [boothId]: {
          loading: false,
          error: null,
          data: data.data || [],
          fetched: true,
        },
      }));
      setExpandedFilesBoothId(boothId);
    } catch (fileError) {
      console.error(`Error fetching files for booth ${boothId}:`, fileError);
      setBoothFiles((prev) => ({
        ...prev,
        [boothId]: {
          loading: false,
          error:
            fileError instanceof Error
              ? fileError.message
              : "Unable to load files",
          data: [],
          fetched: true,
        },
      }));
      toast.error(
        fileError instanceof Error ? fileError.message : "Unable to load files"
      );
    }
  };

  const getStateDetails = () => {
    const rawUser = localStorage.getItem("auth_user");
    const parsedUser = rawUser ? JSON.parse(rawUser) : {};

    const stateNameFromAssignment =
      (selectedAssignment as any)?.stateName ||
      (selectedAssignment as any)?.state_name ||
      "";

    const stateName =
      assemblyInfo.stateName ||
      stateNameFromAssignment ||
      parsedUser.state_name ||
      parsedUser.stateName ||
      parsedUser.state?.name ||
      "";

    return {
      stateId:
        assemblyInfo.stateId || parsedUser.state_id || parsedUser.stateId || 0,
      stateName: stateName || "Unknown",
    };
  };

  const handleFileUpload = async (
    boothId: number,
    boothName: string,
    file: File
  ) => {
    const { stateId, stateName } = getStateDetails();

    if (!stateId) {
      toast.error("State ID not found. Please re-login and try again.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (
      !allowedTypes.includes(file.type) &&
      !file.name.match(/\.(pdf|csv|xls|xlsx|txt|doc|docx)$/i)
    ) {
      toast.error(
        "Unsupported file type. Use PDF, CSV, XLS, XLSX, TXT, DOC, or DOCX."
      );
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large. Max size is 50MB.");
      return;
    }

    setUploadingBoothId(boothId);

    const formData = new FormData();
    formData.append("voterFile", file);
    formData.append("stateId", String(stateId));
    formData.append("stateName", stateName);
    if (assemblyInfo.districtName)
      formData.append("districtName", assemblyInfo.districtName);
    if (assemblyInfo.assemblyName)
      formData.append("assemblyName", assemblyInfo.assemblyName);
    formData.append("boothId", String(boothId));

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/booth-deleted-voter-files/create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("auth_access_token") || ""
            }`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to upload file");
      }

      toast.success(`File uploaded for ${boothName}`);
    } catch (uploadError) {
      console.error("Error uploading deleted voter file:", uploadError);
      toast.error(
        uploadError instanceof Error ? uploadError.message : "Upload failed"
      );
    } finally {
      setUploadingBoothId(null);
    }
  };

  const handleFileInputChange =
    (boothId: number, boothName: string) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) return;

      handleFileUpload(boothId, boothName, file);
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

  // Reset mandal when block changes
  useEffect(() => {
    if (selectedBlockId === 0) {
      setSelectedMandalId(0);
      setSelectedPollingCenterId(0);
    }
  }, [selectedBlockId]);

  // Reset polling center when mandal changes
  useEffect(() => {
    if (selectedMandalId === 0) {
      setSelectedPollingCenterId(0);
      setHasPollingCentersWithBooths(false);
    }
  }, [selectedMandalId]);

  // Remove auto-selection - let user see all booths by default
  // useEffect(() => {
  //   if (blocks.length > 0 && selectedBlockId === 0) {
  //     setSelectedBlockId(blocks[0].id);
  //   }
  // }, [blocks]);

  // useEffect(() => {
  //   if (mandals.length > 0 && selectedBlockId > 0 && selectedMandalId === 0) {
  //     setSelectedMandalId(mandals[0].id);
  //   }
  // }, [mandals, selectedBlockId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-1">
      <div className="max-w-7xl mx-auto">
        {/* Header with Stats Cards */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-3 sm:p-3 mb-1 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="shrink-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                Booth List
              </h1>
              <p className="text-purple-100 text-xs sm:text-sm mt-1">
                Assembly: {assemblyInfo.assemblyName} | District:{" "}
                {assemblyInfo.districtName}
              </p>
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
                <div className="bg-purple-50 rounded-full p-1.5">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7h16v12H4V7zm4 0V5h8v2"
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
                      <span className="ml-2 text-red-600 font-semibold"></span>
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

        <div className="bg-white rounded-xl shadow-md p-3 mb-1">
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${
              hasPollingCentersWithBooths ? "lg:grid-cols-6" : "lg:grid-cols-5"
            }`}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assembly
              </label>
              <input
                type="text"
                value={assemblyInfo.assemblyName}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Block
              </label>
              <select
                value={selectedBlockId}
                onChange={(e) => {
                  setSelectedBlockId(Number(e.target.value));
                  setSelectedMandalId(0);
                  setSelectedPollingCenterId(0);
                  setSelectedBoothFilter("");
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={0}>All Blocks</option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Mandal
              </label>
              <select
                value={selectedMandalId}
                onChange={(e) => {
                  setSelectedMandalId(Number(e.target.value));
                  setSelectedPollingCenterId(0);
                  setSelectedBoothFilter("");
                  setCurrentPage(1);
                }}
                disabled={selectedBlockId === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value={0}>All Mandals</option>
                {mandals.map((mandal) => (
                  <option key={mandal.id} value={mandal.id}>
                    {mandal.displayName}
                  </option>
                ))}
              </select>
            </div>
            {hasPollingCentersWithBooths && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Polling Center
                </label>
                <select
                  value={selectedPollingCenterId}
                  onChange={(e) => {
                    setSelectedPollingCenterId(Number(e.target.value));
                    setSelectedBoothFilter("");
                    setCurrentPage(1);
                  }}
                  disabled={!selectedMandalId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value={0}>All Polling Centers</option>

                  {pollingCenters.map((pc) => (
                    <option key={pc.id} value={pc.id}>
                      {pc.displayName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Booth
              </label>
              <select
                value={selectedBoothFilter}
                onChange={(e) => {
                  setSelectedBoothFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Booths</option>
                {booths.map((booth) => (
                  <option key={booth.id} value={booth.id}>
                    {booth.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
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
                  placeholder="Search by booth name..."
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
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {isLoadingAllBooths ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading booths...</p>
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
              <p className="mt-2 text-gray-500 font-medium">
                {allBooths.length === 0 
                  ? "No booths found in this assembly"
                  : "No booths match your current filters"
                }
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {allBooths.length === 0 
                  ? "This assembly may contain only polling centers. Please check the Polling Center section."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
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
                        {hasPollingCentersWithBooths
                          ? "Polling Center"
                          : "Mandal"}
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

                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Assigned Booth
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Upload Deleted Voters
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Uploaded Files
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedBooths.map((booth, index) => (
                      <Fragment key={booth.id}>
                        <tr className="hover:bg-purple-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                booth.pollingCenterId
                                  ? "bg-green-100 text-green-800"
                                  : "bg-indigo-100 text-indigo-800"
                              }`}
                            >
                              {booth.pollingCenterId
                                ? booth.pollingCenterName
                                : booth.mandalName || "Mandal"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
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
                                    d="M4 7h16v12H4V7zm4 0V5h8v2"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {booth.displayName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {booth.partyLevelDisplayName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleViewUsers(booth.id)}
                                className={`inline-flex items-center p-1 rounded-md transition-colors mr-2 ${
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

                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => {
                                setSelectedBoothForVoters({
                                  id: booth.id,
                                  name: booth.displayName,
                                });
                                setShowAssignVotersModal(true);
                              }}
                              className="p-2 hover:bg-indigo-50 rounded-lg transition-colors group"
                              title="Assign Booth Voters"
                            >
                              <svg
                                className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <label
                              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-dashed border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer transition-colors"
                              title="Upload deleted voter PDF/Excel"
                            >
                              <input
                                type="file"
                                accept=".pdf,.csv,.xls,.xlsx,.txt,.doc,.docx"
                                className="hidden"
                                onChange={handleFileInputChange(
                                  booth.id,
                                  booth.displayName
                                )}
                              />
                              {uploadingBoothId === booth.id ? (
                                <svg
                                  className="w-5 h-5 text-indigo-600 animate-spin"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a10 10 0 00-10 10h4z"
                                  ></path>
                                </svg>
                              ) : (
                                <svg
                                  className="w-5 h-5 text-indigo-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5 5 5M12 4v12"
                                  />
                                </svg>
                              )}
                            </label>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleViewFiles(booth.id)}
                              className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                expandedFilesBoothId === booth.id
                                  ? "bg-purple-600 text-white border-purple-600"
                                  : "text-purple-700 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                              }`}
                              title="View uploaded deleted voter files"
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
                              Files
                            </button>
                          </td>
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
                                booth.pollingCenterName ||
                                mandals.find((m) => m.id === selectedMandalId)
                                  ?.displayName ||
                                "Mandal"
                              }
                              parentLocationType={
                                booth.pollingCenterId
                                  ? "PollingCenter"
                                  : "Mandal"
                              }
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
                              colSpan={10}
                            />
                          )}

                        {expandedFilesBoothId === booth.id && (
                          <tr>
                            <td colSpan={10} className="bg-purple-50 px-6 py-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-purple-800 mb-2">
                                    Uploaded Deleted Voter Files
                                  </h4>
                                  {boothFiles[booth.id]?.loading && (
                                    <p className="text-sm text-gray-600">
                                      Loading files...
                                    </p>
                                  )}
                                  {boothFiles[booth.id]?.error && (
                                    <p className="text-sm text-red-600">
                                      {boothFiles[booth.id]?.error}
                                    </p>
                                  )}
                                  {!boothFiles[booth.id]?.loading &&
                                    !boothFiles[booth.id]?.error && (
                                      <ul className="space-y-2">
                                        {(boothFiles[booth.id]?.data || [])
                                          .length === 0 && (
                                          <li className="text-sm text-gray-600">
                                            No files uploaded for this booth
                                            yet.
                                          </li>
                                        )}
                                        {(boothFiles[booth.id]?.data || []).map(
                                          (file) => (
                                            <li
                                              key={file.id}
                                              className="text-sm text-gray-800 bg-white border border-purple-100 rounded-md px-3 py-2 shadow-sm"
                                            >
                                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <span className="font-medium truncate">
                                                  {file.filePath || "File"}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                  {file.created_at
                                                    ? new Date(
                                                        file.created_at
                                                      ).toLocaleString()
                                                    : ""}
                                                </span>
                                              </div>
                                              <div className="text-xs text-gray-600 mt-1">
                                                State: {file.stateName || ""} |
                                                District:{" "}
                                                {file.districtName || ""} |
                                                Assembly:{" "}
                                                {file.assemblyName || ""}
                                              </div>
                                              {file.filePath && (
                                                <div className="mt-2">
                                                  <a
                                                    href={file.filePath}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-purple-700 hover:text-purple-900 text-xs font-medium"
                                                  >
                                                    Open file
                                                  </a>
                                                </div>
                                              )}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    )}
                                </div>
                                <button
                                  onClick={() => setExpandedFilesBoothId(null)}
                                  className="text-purple-700 hover:text-purple-900 text-sm font-medium"
                                >
                                  Close
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredBooths.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 mt-4">
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
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers - hidden on small screens */}
                      <div className="hidden sm:flex gap-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  currentPage === pageNum
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}
                      </div>
                      
                      {/* Current page indicator for small screens */}
                      <div className="sm:hidden px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">
                        {currentPage} / {totalPages}
                      </div>
                      
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      <style>{`
                .scrollbar-thin::-webkit-scrollbar {
                    height: 8px;
                    width: 8px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: #9333ea;
                    border-radius: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: #7c3aed;
                }
                .scrollbar-track-gray-200::-webkit-scrollbar-track {
                    background: #e5e7eb;
                }
                .scrollbar-thumb-purple-500::-webkit-scrollbar-thumb {
                    background: #9333ea;
                }
            `}</style>

      {/* Assign Booth Voters Modal */}
      {showAssignVotersModal && selectedBoothForVoters && (
        <AssignBoothVotersModal
          isOpen={showAssignVotersModal}
          onClose={() => {
            setShowAssignVotersModal(false);
            setSelectedBoothForVoters(null);
          }}
          levelId={selectedBoothForVoters.id}
          levelName={selectedBoothForVoters.name}
          levelType="afterAssembly"
          assemblyId={assemblyInfo.assemblyId}
          stateId={assemblyInfo.stateId}
          districtId={assemblyInfo.districtId}
        />
      )}
    </div>
  );
}
