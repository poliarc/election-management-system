import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useDebounce } from "../../hooks/useDebounce";
import { useAppSelector } from "../../store/hooks";
import type { BoothDeletedVoterFile } from "../../services/boothDeletedVoterFilesApi";
import { fetchBoothDeletedVoterFiles } from "../../services/boothDeletedVoterFilesApi";

const PAGE_SIZE = 12;

export default function SubLevelDeletedVoters() {
  const { levelId } = useParams<{ levelId: string }>();
  const { selectedAssignment } = useAppSelector((s) => s.auth);
  const [files, setFiles] = useState<BoothDeletedVoterFile[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 450);
  const [refreshToken, setRefreshToken] = useState(0);
  const isBoothLevel =
    selectedAssignment?.levelType === "Booth" ||
    selectedAssignment?.partyLevelName === "Booth";

  const boothId = useMemo(() => {
    // Prefer parentId when this panel itself is a booth-level view
    if (isBoothLevel) {
      const parent = Number(selectedAssignment?.parentId);
      if (Number.isFinite(parent) && parent > 0) return parent;
    }

    // Otherwise fall back to assignment data
    const assignmentBooth = Number(selectedAssignment?.afterAssemblyData_id);
    if (Number.isFinite(assignmentBooth) && assignmentBooth > 0)
      return assignmentBooth;

    // Finally use route param
    if (levelId) {
      const parsed = Number(levelId);
      if (Number.isFinite(parsed)) return parsed;
    }

    return null;
  }, [isBoothLevel, selectedAssignment, levelId]);

  const isExplicitlyNotBooth = Boolean(selectedAssignment) && !isBoothLevel;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, boothId]);

  useEffect(() => {
    if (!boothId || isExplicitlyNotBooth) return;

    const loadFiles = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchBoothDeletedVoterFiles(boothId, {
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch,
        });

        setFiles(response.data || []);
        setTotal(response.pagination?.total || response.data?.length || 0);
        setTotalPages(response.pagination?.totalPages || 1);
      } catch (err: any) {
        console.error("Failed to load deleted voter files", err);
        setFiles([]);
        setTotal(0);
        setTotalPages(1);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load files";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [boothId, page, debouncedSearch, isExplicitlyNotBooth, refreshToken]);

  const formatDate = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFileName = (path: string) => {
    try {
      const url = new URL(path);
      const cleanName = url.pathname.split("/").pop();
      return cleanName || path;
    } catch (err) {
      const cleanName = path.split("/").pop();
      return cleanName || path;
    }
  };

  const handleView = (filePath?: string) => {
    if (!filePath) {
      toast.error("File not available");
      return;
    }
    window.open(filePath, "_blank", "noopener,noreferrer");
  };

  const handleDownload = (file: BoothDeletedVoterFile) => {
    if (!file.filePath) {
      toast.error("File not available");
      return;
    }

    const link = document.createElement("a");
    link.href = file.filePath;
    link.download = getFileName(file.filePath);
    link.target = "_blank";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const boothName =
    selectedAssignment?.displayName ||
    selectedAssignment?.levelName ||
    selectedAssignment?.partyLevelDisplayName ||
    "Booth";
  const locationLine = [
    selectedAssignment?.stateName,
    selectedAssignment?.districtName,
    selectedAssignment?.assemblyName,
  ]
    .filter(Boolean)
    .join(" • ");

  if (!boothId) {
    return (
      <div className="p-1">
        <div className="bg-white rounded-lg shadow p-4">
          <h1 className="text-lg font-semibold text-gray-800">
            Deleted Voters
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Missing booth identifier in the URL.
          </p>
        </div>
      </div>
    );
  }

  if (isExplicitlyNotBooth) {
    return (
      <div className="p-1">
        <div className="bg-white rounded-lg shadow p-5 border border-amber-200">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold">
              !
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Available only for booth level
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Switch to a booth level assignment to manage deleted voter
                files.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-teal-700 text-white rounded-xl shadow-lg p-5 sm:p-6 mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">
              Booth Center
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              Deleted Voter Files
            </h1>
            <p className="text-sm text-white/80 mt-1">{boothName}</p>
            {locationLine && (
              <p className="text-xs text-white/60">{locationLine}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-lg border border-white/10 text-sm">
              <span className="text-white/70">Total Files</span>
              <div className="text-xl font-semibold">
                {loading ? "..." : total}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRefreshToken((token) => token + 1)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-teal-700 font-semibold rounded-lg shadow-sm hover:shadow transition"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M10 4v12m-6-6h12"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="relative w-full md:max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by location or file name"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-11 pr-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading && files.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-36 rounded-lg border border-gray-100 bg-gray-50 animate-pulse"
              />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-white shadow flex items-center justify-center text-teal-600 mb-3">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M12 5v14m-7-7h14"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-800">
              No files yet
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Deleted voter files uploaded for this booth will show up here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="relative rounded-lg border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <svg
                      className="h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                        strokeWidth="1.6"
                      />
                      <path d="M14 3v6h6" strokeWidth="1.6" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Deleted Voters
                    </p>
                    <h3
                      className="text-sm font-semibold text-gray-900 truncate"
                      title={getFileName(file.filePath)}
                    >
                      {getFileName(file.filePath)}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {file.stateName || file.stateNameFromMaster || ""}
                      {file.districtName ? ` • ${file.districtName}` : ""}
                      {file.assemblyName ? ` • ${file.assemblyName}` : ""}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Booth {file.boothId || boothId}
                      {file.boothNameFromMaster
                        ? ` • ${file.boothNameFromMaster}`
                        : ""}
                    </p>
                    {file.created_at && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        Uploaded {formatDate(file.created_at)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleView(file.filePath)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-teal-200 hover:text-teal-700 transition"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M3 12s4-7 9-7 9 7 9 7-4 7-9 7-9-7-9-7Z"
                        strokeWidth="1.6"
                      />
                      <circle cx="12" cy="12" r="2.5" strokeWidth="1.6" />
                    </svg>
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M12 3v12m0 0 4-4m-4 4-4-4"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M5 19h14"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-5 flex items-center justify-between text-sm text-gray-700">
            <div>
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, total)} of {total} files
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:border-teal-200 hover:text-teal-700 transition"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:border-teal-200 hover:text-teal-700 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
