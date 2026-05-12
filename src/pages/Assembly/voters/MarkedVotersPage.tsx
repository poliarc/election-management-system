import React, { useState, useEffect } from "react";
import { Trash2, Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { 
  useGetVoterMarkersQuery, 
  useDeleteVoterMarkerMutation 
} from "../../../store/api/votersApi"; 
import { useAppSelector } from "../../../store/hooks";

export const MarkedVotersPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  // States
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  
  const language = i18n.language || "en";

  // 1. Properly destructure BOTH user and selectedAssignment from your auth state
  const { user, selectedAssignment } = useAppSelector((state: any) => state.auth);
  
  const currentUserId = user?.user_id || user?.id;
  // 2. Grab the assembly ID exactly how you do it in VoterListPage
  const currentAssemblyId = selectedAssignment?.stateMasterData_id;

  // Debounce the search input (waits 500ms after user stops typing to trigger search)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to page 1 whenever a new search happens
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch data
  const { data, error, isLoading, isFetching } = useGetVoterMarkersQuery(
    { 
      page, 
      limit, 
      user_id: currentUserId,
      assembly_id: currentAssemblyId, // Now passing the reactive Redux state
      sortBy: "part_no",
      sortOrder: "ASC",
      search: debouncedSearch 
    },
    // Don't run this query until we have BOTH the user ID and the Assembly ID
    { skip: !currentUserId || !currentAssemblyId } 
  );
  
  const [deleteVoterMarker, { isLoading: isDeleting }] = useDeleteVoterMarkerMutation();

  const voters = data?.data || [];
  const pagination = data?.pagination || null;

  const handleUnmark = async (markerId: number) => {
    if (!window.confirm(t("markedVoters.confirmUnmark", "Are you sure you want to unmark this voter?"))) return;

    const toastId = toast.loading(t("markedVoters.unmarking", "Unmarking voter..."));
    
    try {
      const response: any = await deleteVoterMarker(markerId).unwrap();
      
      if (response.success) {
        toast.success(t("markedVoters.unmarkSuccess", "Voter unmarked successfully!"), { id: toastId });
        if (voters.length === 1 && page > 1) {
            setPage(page - 1);
        }
      } else {
        toast.error(response.message || "Failed to unmark voter.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "An error occurred while unmarking.", { id: toastId });
    }
  };

  const handleNextPage = () => {
    if (pagination && page < pagination.totalPages) setPage(page + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const getLocalizedValue = (voter: any, field: "name" | "relation" | "address") => {
    if (language === "hi") {
        switch (field) {
            case "name": return voter.voter_full_name_hi || voter.voter_full_name_en || "-";
            case "relation": return voter.relative_full_name_hi || voter.relative_full_name_en || "-";
            case "address": return voter.town_village_name_hin || voter.town_village_name_eng || "-";
            default: return "-";
        }
    }
    switch (field) {
        case "name": return voter.voter_full_name_en || "-";
        case "relation": return voter.relative_full_name_en || "-";
        case "address": return voter.town_village_name_eng || "-";
        default: return "-";
    }
  };

  const renderPageNumbers = () => {
    if (!pagination) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition ${
            page === i
              ? "bg-indigo-600 text-white border border-indigo-600"
              : "border border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--text-color)]/5"
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  // If no assembly is selected in the UI, show a prompt just like in VoterListPage
  if (!currentAssemblyId) {
    return (
        <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                No assembly selected. Please select an assembly first.
            </div>
        </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--text-color)] shrink-0">
          {t("markedVoters.title", "Marked Voters")}
        </h1>
        
        {/* Search Bar Component */}
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isFetching && searchInput ? (
              <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-[var(--text-secondary)]" />
            )}
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-[var(--border-color)] rounded-lg leading-5 bg-[var(--bg-card)] text-[var(--text-color)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
            placeholder={t("markedVoters.searchPlaceholder", "Search by name, father, age, gender, mobile, or Voter ID...")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          Failed to load marked voters.
        </div>
      )}

      <div className="overflow-x-auto w-full rounded-lg border border-[var(--border-color)]">
        <table className="w-full text-sm text-left bg-[var(--bg-card)]">
          <thead className="bg-indigo-50 text-[var(--text-secondary)] bg-[var(--bg-card)] text-xs uppercase sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">{t("voterListTable.thPart", "Part No.")}</th>
              <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">{t("voterListTable.thName", "Name")}</th>
              <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">{t("voterListTable.thFatherHusband", "Father/Husband")}</th>
              <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">
                {t("voterListTable.thGender", "Gender")} / {t("voterListTable.thAge", "Age")}
              </th>
              <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">{t("voterListTable.thMobile", "Mobile")}</th>
              <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">{t("voterListTable.thVoterId", "Voter ID")}</th>
              <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">{t("voterListTable.thAddress", "Address")}</th>
              <th className="px-4 py-3 font-semibold bg-[var(--bg-color)] text-center">{t("voterListTable.thAction", "Action")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <div className="flex justify-center items-center space-x-2 text-indigo-600">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading marked voters...</span>
                  </div>
                </td>
              </tr>
            ) : voters.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-[var(--text-secondary)]">
                  {debouncedSearch 
                    ? t("markedVoters.noSearchResults", "No marked voters match your search.")
                    : t("markedVoters.empty", "No marked voters found.")}
                </td>
              </tr>
            ) : (
              voters.map((voter: any) => (
                <tr
                  key={voter.id}
                  className="border-b border-gray-100 hover:bg-[var(--text-color)]/5 transition"
                >
                  <td className="px-4 py-3">{voter.part_no || "-"}</td>
                  <td className="px-4 py-3 font-medium text-[var(--text-color)]">
                    {getLocalizedValue(voter, "name")}
                  </td>
                  <td className="px-4 py-3">
                    {getLocalizedValue(voter, "relation")}
                  </td>
                  <td className="px-4 py-3">
                    {voter.gender || "-"} / {voter.age || "-"}
                  </td>
                  <td className="px-4 py-3">{voter.contact_number1 || "-"}</td>
                  <td className="px-4 py-3">{voter.voter_id_epic_no || "-"}</td>
                  <td className="px-4 py-3">
                    {getLocalizedValue(voter, "address")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleUnmark(voter.id)}
                      disabled={isDeleting}
                      className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 p-2 rounded-full transition"
                      title="Unmark Voter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && pagination && pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-[var(--bg-card)] px-4 py-3 border border-[var(--border-color)] rounded-lg gap-4">
          <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
            <div>
              Showing <span className="font-medium text-[var(--text-color)]">{(page - 1) * limit + 1}</span> to <span className="font-medium text-[var(--text-color)]">{Math.min(page * limit, pagination.total)}</span> of <span className="font-medium text-[var(--text-color)]">{pagination.total}</span> entries
            </div>
            
            <div className="flex items-center gap-2 border-l border-[var(--border-color)] pl-4">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1); 
                }}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md px-2 py-1 text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className="p-2 rounded-md border border-[var(--border-color)] disabled:opacity-50 hover:bg-[var(--text-color)]/5 transition text-[var(--text-color)]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="hidden sm:flex space-x-1">
              {renderPageNumbers()}
            </div>

            <button
              onClick={handleNextPage}
              disabled={page === pagination.totalPages}
              className="p-2 rounded-md border border-[var(--border-color)] disabled:opacity-50 hover:bg-[var(--text-color)]/5 transition text-[var(--text-color)]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkedVotersPage;