import React, { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Download, MapPin, Loader2, X, Calendar } from "lucide-react";
import { useGetAllStateMasterDataQuery } from "../../store/api/stateMasterApi";
import toast from "react-hot-toast";
import type { Supporter } from "../../types/supporter";

interface ExportModalProps {
    stateName: string;
    onConfirm: (fromDate: string, toDate: string) => void;
    onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ stateName, onConfirm, onClose }) => {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <h3 className="font-semibold text-gray-900">Export — {stateName}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-xs text-gray-500 mb-4">
                    Select a date range to filter by creation date, or leave blank to export all.
                </p>

                <div className="flex flex-col gap-3 mb-5">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            min={fromDate || undefined}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(fromDate, toDate)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ExportSupportersPage: React.FC = () => {
    const { partyId } = useParams<{ partyId: string }>();
    const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
    const cancelRef = useRef(false);
    const [modalState, setModalState] = useState<{ open: boolean; stateId: number | null }>({ open: false, stateId: null });

    const { data: stateMasterData = [], isLoading } = useGetAllStateMasterDataQuery();

    const states = stateMasterData.filter(
        (item) => item.levelType === "State" && item.isActive === 1
    );

    const handleCancel = () => {
        cancelRef.current = true;
        toast.dismiss("export-toast");
        toast("Export cancelled", { icon: "ℹ️" });
    };

    const handleExport = async (stateId: number, fromDate: string, toDate: string) => {
        if (!partyId) {
            toast.error("Party ID not found. Please try again.");
            return;
        }

        cancelRef.current = false;
        setSelectedStateId(stateId);
        setIsExporting(true);
        setExportProgress(null);

        try {
            toast.loading("Starting export...", { id: "export-toast" });

            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            if (!apiBaseUrl) {
                toast.error("API base URL is not configured.", { id: "export-toast" });
                return;
            }

            const token = localStorage.getItem("auth_access_token");
            if (!token) {
                toast.error("Authentication token not found. Please login again.", { id: "export-toast" });
                return;
            }

            const exportEndpoint = `${apiBaseUrl}/api/supporters/party/${partyId}/state/${stateId}`;

            let allSupporters: Supporter[] = [];
            let currentPage = 1;
            const pageSize = 100;
            let totalPages = 1;

            do {
                if (cancelRef.current) break;

                const params = new URLSearchParams({
                    page: currentPage.toString(),
                    limit: pageSize.toString(),
                });

                if (fromDate) params.set("dateFrom", fromDate);
                if (toDate) params.set("dateTo", toDate);

                const exportResponse = await fetch(`${exportEndpoint}?${params.toString()}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!exportResponse.ok) {
                    let errorMessage = `HTTP ${exportResponse.status}`;
                    try {
                        const errorData = await exportResponse.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch { /* keep status message */ }
                    throw new Error(`API Error on page ${currentPage}: ${errorMessage}`);
                }

                const exportData = await exportResponse.json();

                if (!exportData.success) {
                    throw new Error(exportData.message || `API returned unsuccessful response on page ${currentPage}`);
                }

                const pageData = exportData.data || [];
                allSupporters = [...allSupporters, ...pageData];

                if (exportData.pagination) {
                    totalPages = exportData.pagination.pages || 1;
                    setExportProgress({ current: currentPage, total: totalPages });
                    toast.loading(
                        `Fetching page ${currentPage}/${totalPages} (${allSupporters.length} records)...`,
                        { id: "export-toast" }
                    );
                } else {
                    break;
                }

                currentPage++;
            } while (currentPage <= totalPages);

            if (cancelRef.current) return;

            if (allSupporters.length === 0) {
                toast.error("No supporters found to export.", { id: "export-toast" });
                return;
            }

            // Client-side date filter since backend may not support date params
            let filteredSupporters = allSupporters;
            if (fromDate || toDate) {
                const from = fromDate ? new Date(fromDate) : null;
                const to = toDate ? new Date(toDate + "T23:59:59") : null;
                filteredSupporters = allSupporters.filter((s) => {
                    if (!s.created_at) return false;
                    const created = new Date(s.created_at);
                    if (from && created < from) return false;
                    if (to && created > to) return false;
                    return true;
                });
            }

            if (filteredSupporters.length === 0) {
                toast.error("No supporters found in the selected date range.", { id: "export-toast" });
                return;
            }

            const headers = [
                "Serial No", "Created By", "Assembly", "Initials", "First Name", "Last Name",
                "Father Name", "Age", "Gender", "Phone", "WhatsApp", "EPIC ID", "Languages",
                "Religion", "Category", "Caste", "Block", "Mandal", "Booth", "Created At", "Address",
            ];

            const csvRows = filteredSupporters.map((supporter: Supporter, index: number) => {
                const escapeCSV = (value: unknown, isNumeric = false) => {
                    if (value === null || value === undefined) return "";
                    const str = String(value);
                    if (isNumeric && str.length > 0) return `"${str}"`;
                    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                };

                let languageStr = "";
                if (Array.isArray(supporter.language)) {
                    languageStr = supporter.language.join("; ");
                } else if (typeof supporter.language === "object" && supporter.language !== null) {
                    const langObj = supporter.language as Record<string, unknown>;
                    languageStr = String(langObj.primary || "");
                    if (langObj.secondary && Array.isArray(langObj.secondary)) {
                        languageStr += langObj.secondary.length > 0 ? `; ${(langObj.secondary as string[]).join("; ")}` : "";
                    }
                } else {
                    languageStr = supporter.language || "";
                }

                return [
                    escapeCSV(index + 1),
                    escapeCSV(supporter.created_by_name || "Unknown"),
                    escapeCSV(supporter.assembly_name),
                    escapeCSV(supporter.initials),
                    escapeCSV(supporter.first_name),
                    escapeCSV(supporter.last_name),
                    escapeCSV(supporter.father_name),
                    escapeCSV(supporter.age),
                    escapeCSV(supporter.gender),
                    escapeCSV(supporter.phone_no, true),
                    escapeCSV(supporter.whatsapp_no, true),
                    escapeCSV(supporter.voter_epic_id, true),
                    escapeCSV(languageStr),
                    escapeCSV(supporter.religion),
                    escapeCSV(supporter.category),
                    escapeCSV(supporter.caste),
                    escapeCSV(supporter.block_name),
                    escapeCSV(supporter.mandal_name),
                    escapeCSV(supporter.booth_name),
                    escapeCSV(supporter.created_at ? new Date(supporter.created_at).toLocaleDateString() : ""),
                    escapeCSV(supporter.address),
                ].join(",");
            });

            const csvContent = [headers.join(","), ...csvRows].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            const stateName = states.find((s) => s.id === stateId)?.levelName || stateId;
            const dateRange = fromDate && toDate ? `_${fromDate}_to_${toDate}` : fromDate ? `_from_${fromDate}` : toDate ? `_upto_${toDate}` : "";
            const filename = `supporters_${stateName}${dateRange}_${new Date().toISOString().split("T")[0]}.csv`;

            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success(`Successfully exported ${filteredSupporters.length} supporters to ${filename}`, { id: "export-toast" });
        } catch (error) {
            if (cancelRef.current) return;

            let userMessage = "Failed to export data. ";
            if (error instanceof Error) {
                const errorMsg = error.message.toLowerCase();
                if (errorMsg.includes("authentication") || errorMsg.includes("token") || errorMsg.includes("401")) {
                    userMessage += "Please login again and try again.";
                } else if (errorMsg.includes("403") || errorMsg.includes("forbidden")) {
                    userMessage += "You do not have permission to export data.";
                } else if (errorMsg.includes("404") || errorMsg.includes("not found")) {
                    userMessage += "Data not found. Please try again later.";
                } else if (errorMsg.includes("500") || errorMsg.includes("server error")) {
                    userMessage += "Server error occurred. Please try again later.";
                } else if (errorMsg.includes("network") || errorMsg.includes("fetch")) {
                    userMessage += "Network error. Please check your internet connection.";
                } else {
                    userMessage += `Error: ${error.message}`;
                }
            } else {
                userMessage += "An unknown error occurred. Please try again.";
            }
            toast.error(userMessage, { id: "export-toast" });
        } finally {
            setIsExporting(false);
            setSelectedStateId(null);
            setExportProgress(null);
        }
    };

    const openModal = (stateId: number) => {
        setModalState({ open: true, stateId });
    };

    const closeModal = () => {
        setModalState({ open: false, stateId: null });
    };

    const handleModalConfirm = (fromDate: string, toDate: string) => {
        if (modalState.stateId === null) return;
        closeModal();
        handleExport(modalState.stateId, fromDate, toDate);
    };

    const modalStateName = modalState.stateId
        ? (states.find((s) => s.id === modalState.stateId)?.levelName || "")
        : "";

    return (
        <div className="p-6 bg-[var(--bg-main)] min-h-screen">
            {modalState.open && (
                <ExportModal
                    stateName={modalStateName}
                    onConfirm={handleModalConfirm}
                    onClose={closeModal}
                />
            )}

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-[var(--text-color)]">Export</h1>
                <p className="text-[var(--text-secondary)] mt-2">Select a state to export all supporters data</p>
            </div>

            {/* Progress bar with cancel */}
            {isExporting && exportProgress && (
                <div className="mb-4 bg-white rounded-lg shadow-md p-4 flex items-center gap-4">
                    <div className="flex-1">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Fetching page {exportProgress.current} of {exportProgress.total}</span>
                            <span>{Math.round((exportProgress.current / exportProgress.total) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all"
                                style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                    >
                        <X className="w-4 h-4" />
                        Cancel
                    </button>
                </div>
            )}

            <div className="bg-[var(--bg-card)] rounded-lg shadow-md p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        <span className="ml-3 text-[var(--text-secondary)]">Loading states...</span>
                    </div>
                ) : states.length === 0 ? (
                    <div className="text-center py-12">
                        <MapPin className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3" />
                        <p className="text-[var(--text-secondary)]">No states available.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {states.map((state) => (
                            <div
                                key={state.id}
                                className="p-5 border border-[var(--border-color)] rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <MapPin className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--text-color)] text-lg">{state.levelName}</p>
                                        <p className="text-sm text-[var(--text-secondary)]">State ID: {state.id}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openModal(state.id)}
                                        disabled={isExporting}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        {isExporting && selectedStateId === state.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Exporting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" />
                                                <span>Export</span>
                                            </>
                                        )}
                                    </button>
                                    {isExporting && selectedStateId === state.id && (
                                        <button
                                            onClick={handleCancel}
                                            className="flex items-center gap-1 px-3 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                                            title="Cancel export"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


