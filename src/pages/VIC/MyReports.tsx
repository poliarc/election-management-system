import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useGetMyReportsQuery, useUpdateVICReportMutation, useDeleteVICReportMutation } from "../../store/api/vicReportsApi";
import { formatDistanceToNow } from "date-fns";
import { Edit, Trash2, X, Save, Upload, Eye, FileText, Image, File } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function MyReports() {
    const {t} = useTranslation();
    const { levelId } = useParams<{ levelId: string }>();
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        status: "",
        priority: "",
        report_type: "",
        search: "",
    });

    // Modal states
    const [editingReport, setEditingReport] = useState<any>(null);
    const [deletingReport, setDeletingReport] = useState<any>(null);
    const [editForm, setEditForm] = useState({
        voter_id_epic_no: "",
        voter_first_name: "",
        part_no: "",
        sl_no_in_part: "",
        voter_relative_name: "",
        report_content: "",
        priority: "" as "Low" | "Medium" | "High" | "Critical" | "",
        report_type: "" as "Wrong Deleted" | "Wrong Added" | "New Voter F6" | "Other" | "",
    });

    // Attachment states for edit modal
    const [editAttachments, setEditAttachments] = useState<File[]>([]);
    const [existingAttachments, setExistingAttachments] = useState<Array<{
        filename: string;
        originalName: string;
        mimetype: string;
        size: number;
        url: string;
    }>>([]);
    const [previewFile, setPreviewFile] = useState<File | { url: string; name: string; type: string } | null>(null);

    // API hooks
    const [, { isLoading: isUpdating }] = useUpdateVICReportMutation();
    const [deleteReport, { isLoading: isDeleting }] = useDeleteVICReportMutation();

    // Determine the base path based on current location
    const currentPath = window.location.pathname;
    const isSubLevel = currentPath.includes('/sublevel/');
    const isAfterAssembly = currentPath.includes('/afterassembly/');
    const isAssembly = currentPath.includes('/assembly');

    const basePath = isSubLevel
        ? `/sublevel/${levelId}/vic`
        : isAfterAssembly
            ? `/afterassembly/${levelId}/vic`
            : isAssembly
                ? `/assembly/vic`
                : `/vic`;

    const { data, isLoading, error, refetch } = useGetMyReportsQuery({
        page,
        limit: 10,
        ...filters,
    });

    const reports = data?.data || [];
    const pagination = data?.pagination;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Pending":
                return "bg-yellow-100 text-yellow-800";
            case "In_Progress":
                return "bg-blue-100 text-blue-800";
            case "Approved":
                return "bg-green-100 text-green-800";
            case "Rejected":
                return "bg-red-100 text-red-800";
            case "Resolved":
                return "bg-gray-100 text-[var(--text-color)]";
            default:
                return "bg-gray-100 text-[var(--text-color)]";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "Critical":
                return "bg-red-100 text-red-800";
            case "High":
                return "bg-orange-100 text-orange-800";
            case "Medium":
                return "bg-yellow-100 text-yellow-800";
            case "Low":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-[var(--text-color)]";
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const handleEditClick = (report: any) => {
        setEditingReport(report);
        setEditForm({
            voter_id_epic_no: report.voter_id_epic_no || "",
            voter_first_name: report.voter_first_name || "",
            part_no: report.part_no || "",
            sl_no_in_part: report.sl_no_in_part || "",
            voter_relative_name: report.voter_relative_name || "",
            report_content: report.report_content || "",
            priority: report.priority || "",
            report_type: report.report_type || "",
        });

        // Parse existing attachments - handle both array and JSON string formats
        let attachments = [];
        if (report.attachments) {
            if (Array.isArray(report.attachments)) {
                attachments = report.attachments;
            } else if (typeof report.attachments === 'string') {
                try {
                    const parsed = JSON.parse(report.attachments);
                    attachments = Array.isArray(parsed) ? parsed : [];
                } catch (error) {
                    console.error('Failed to parse attachments JSON:', error);
                    attachments = [];
                }
            }
        }

        setExistingAttachments(attachments);
        setEditAttachments([]);
    };

    const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name} is too large. Maximum size is 10MB.`);
                return false;
            }
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                toast.error(`${file.name} is not a supported file type.`);
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
            setEditAttachments(prev => [...prev, ...validFiles]);
            toast.success(`${validFiles.length} file(s) added`);
        }
    };

    const removeEditAttachment = (index: number) => {
        setEditAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingAttachment = (index: number) => {
        setExistingAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const previewAttachment = (file: File | { url: string; name: string; type: string }) => {
        setPreviewFile(file);
    };

    const getFileIcon = (file: File | { type: string }) => {
        if (file.type.startsWith('image/')) {
            return <Image className="w-5 h-5 text-blue-500" />;
        } else if (file.type === 'application/pdf') {
            return <FileText className="w-5 h-5 text-red-500" />;
        } else {
            return <File className="w-5 h-5 text-[var(--text-secondary)]" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleEditSubmit = async () => {
        if (!editingReport) return;

        try {
            // Create FormData for the update request
            const updateFormData = new FormData();

            // Add form fields (only if they have values)
            if (editForm.voter_id_epic_no) updateFormData.append('voter_id_epic_no', editForm.voter_id_epic_no);
            if (editForm.voter_first_name) updateFormData.append('voter_first_name', editForm.voter_first_name);
            if (editForm.part_no) updateFormData.append('part_no', editForm.part_no);
            if (editForm.sl_no_in_part) updateFormData.append('sl_no_in_part', editForm.sl_no_in_part);
            if (editForm.voter_relative_name) updateFormData.append('voter_relative_name', editForm.voter_relative_name);
            if (editForm.report_content) updateFormData.append('report_content', editForm.report_content);
            if (editForm.priority) updateFormData.append('priority', editForm.priority);
            if (editForm.report_type) updateFormData.append('report_type', editForm.report_type);

            // Add existing attachments as JSON
            if (existingAttachments.length > 0) {
                updateFormData.append('existing_attachments', JSON.stringify(existingAttachments));
            }

            // Add new attachment files
            editAttachments.forEach((file) => {
                updateFormData.append('attachments', file);
            });

            // Show loading message
            if (editAttachments.length > 0) {
                toast.loading("Updating report with new attachments...");
            } else {
                toast.loading("Updating report...");
            }

            // Submit using fetch directly to handle FormData
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vic-reports/${editingReport.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("auth_access_token")}`,
                },
                body: updateFormData,
            });

            toast.dismiss();

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update report');
            }

            const result = await response.json();
            toast.success(result.message || "Report updated successfully!");

            setEditingReport(null);
            setEditAttachments([]);
            setExistingAttachments([]);
            refetch();
        } catch (error: any) {
            toast.dismiss();
            console.error('Update error:', error);
            const errorMessage = error.message || "Failed to update report";
            toast.error(errorMessage);
        }
    };

    const handleDeleteClick = (report: any) => {
        setDeletingReport(report);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingReport) return;

        try {
            await deleteReport(deletingReport.id).unwrap();
            toast.success("Report deleted successfully!");
            setDeletingReport(null);
            refetch();
        } catch (error: any) {
            console.error('Delete error:', error);
            const errorMessage = error?.data?.error?.message || error?.data?.message || error?.message || "Failed to delete report";
            toast.error(errorMessage);
        }
    };

    const canEditOrDelete = (report: any) => {
        // Only allow edit/delete for pending reports
        return report.status === "Pending";
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">Failed to load reports. Please try again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 lg:p-6">
            <div className="bg-[var(--bg-card)] rounded-lg shadow-sm border border-[var(--border-color)]">
                <div className="px-4 sm:px-6 py-4 border-b border-[var(--border-color)]">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-color)]">{t("MyReports.Title")}</h1>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                                {t("MyReports.Subtitle")}
                            </p>
                        </div>
                        <Link
                            to={`${basePath}/send-report`}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition text-center text-sm sm:text-base"
                        >
                            {t("MyReports.Send_New_Report")}
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="px-4 sm:px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange("status", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                <option value="">{t("MyReports.All_Status")}</option>
                                <option value="Pending">{t("MyReports.Pending")}</option>
                                <option value="In_Progress">{t("MyReports.In_Progress")}</option>
                                <option value="Approved">{t("MyReports.Approved")}</option>
                                <option value="Rejected">{t("MyReports.Rejected")}</option>
                                <option value="Resolved">{t("MyReports.Resolved")}</option>
                            </select>
                        </div>
                        <div>
                            <select
                                value={filters.priority}
                                onChange={(e) => handleFilterChange("priority", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                <option value="">{t("MyReports.All_Priority")}</option>
                                <option value="Critical">{t("MyReports.Critical")}</option>
                                <option value="High">{t("MyReports.High")}</option>
                                <option value="Medium">{t("MyReports.Medium")}</option>
                                <option value="Low">{t("MyReports.Low")}</option>
                            </select>
                        </div>
                        <div>
                            <select
                                value={filters.report_type}
                                onChange={(e) => handleFilterChange("report_type", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            >
                                <option value="">{t("MyReports.All_Types")}</option>
                                <option value="Wrong Deleted">{t("MyReports.Wrong_Deleted")}</option>
                                <option value="Wrong Added">{t("MyReports.Wrong_Added")}</option>
                                <option value="New Voter F6">{t("MyReports.New_Voter_F6")}</option>
                                <option value="Other">{t("MyReports.Other")}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Reports List */}
                <div className="divide-y divide-gray-200">
                    {reports.length === 0 ? (
                        <div className="p-8 text-center">
                            <svg
                                className="mx-auto h-12 w-12 text-[var(--text-secondary)]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-[var(--text-color)]">{t("MyReports.No_reports_found")}</h3>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                {t("MyReports.Get_started")}
                            </p>
                            <div className="mt-6">
                                <Link
                                    to={`${basePath}/send-report`}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {t("MyReports.Send_Report")}
                                </Link>
                            </div>
                        </div>
                    ) : (
                        reports.map((report) => (
                            <div key={report.id} className="p-4 sm:p-6 hover:bg-[var(--text-color)]/5 transition">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                            <h3 className="text-base sm:text-lg font-medium text-[var(--text-color)] truncate">
                                                {report.voter_first_name} {report.voter_last_name || ''}
                                            </h3>
                                            <span className="text-sm text-[var(--text-secondary)] truncate">
                                                {t("MyReports.EPIC")}: {report.voter_id_epic_no}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                                {report.status.replace("_", " ")}
                                            </span>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                                                {report.priority}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-[var(--text-color)]">
                                                {report.report_type}
                                            </span>
                                        </div>

                                        <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                                            {report.report_content}
                                        </p>

                                        {/* Attachments */}
                                        {(() => {
                                            let attachments = [];
                                            if (report.attachments) {
                                                if (Array.isArray(report.attachments)) {
                                                    attachments = report.attachments;
                                                } else if (typeof report.attachments === 'string') {
                                                    try {
                                                        const parsed = JSON.parse(report.attachments);
                                                        attachments = Array.isArray(parsed) ? parsed : [];
                                                    } catch (error) {
                                                        console.error('Failed to parse attachments JSON:', error);
                                                        attachments = [];
                                                    }
                                                }
                                            }

                                            return attachments.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                        </svg>
                                                        <span>{attachments.length} {t("MyReports.Attachment")}{attachments.length > 1 ? 's' : ''}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {attachments.slice(0, 3).map((attachment, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">
                                                                {attachment?.originalName || 'Attachment'}
                                                            </span>
                                                        ))}
                                                        {attachments.length > 3 && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-[var(--bg-main)] text-[var(--text-secondary)]">
                                                                +{attachments.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-[var(--text-secondary)]">
                                            <span>
                                                {t("MyReports.Submitted")} {formatDistanceToNow(new Date(report.submitted_at))} {t("MyReports.ago")}
                                            </span>
                                            <span className="hidden sm:inline">•</span>
                                            <span>
                                                {t("MyReports.Current_Level")}: {report.current_level_display_name}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2 lg:shrink-0">
                                        <Link
                                            to={`${basePath}/report-details/${report.id}`}
                                            className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--text-color)]/5 transition"
                                        >
                                            {t("MyReports.View_Details")}
                                        </Link>
                                        {canEditOrDelete(report) && (
                                            <>
                                                <button
                                                    onClick={() => handleEditClick(report)}
                                                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    <span className="hidden sm:inline">{t("MyReports.Edit")}</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(report)}
                                                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="hidden sm:inline">{t("MyReports.Delete")}</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="px-4 sm:px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-main)]">
                        {/* Mobile Layout */}
                        <div className="block sm:hidden">
                            <div className="text-center text-sm text-[var(--text-secondary)] mb-3">
                                {t("MyReports.Page")} {pagination.page} {t("MyReports.of")} {pagination.totalPages}
                            </div>
                            <div className="flex justify-center gap-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--text-color)]/5 transition"
                                >
                                    {t("MyReports.Prev")}
                                </button>
                                <span className="px-3 py-1 text-[var(--text-secondary)] bg-gray-100 rounded text-sm min-w-[60px] text-center">
                                    {pagination.page}/{pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === pagination.totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--text-color)]/5 transition"
                                >
                                    {t("MyReports.Next")}
                                </button>
                            </div>
                            <div className="text-center text-xs text-[var(--text-secondary)] mt-2">
                                {pagination.total} {t("MyReports.total_results")}
                            </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:flex items-center justify-between">
                            <div className="text-sm text-[var(--text-secondary)]">
                                {t("MyReports.Showing")} {((pagination.page - 1) * pagination.limit) + 1} {t("MyReports.to")}{" "}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} {t("MyReports.of")}{" "}
                                {pagination.total} {t("MyReports.results")}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--text-color)]/5 transition"
                                >
                                    {t("MyReports.Previous")}
                                </button>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === pagination.totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--text-color)]/5 transition"
                                >
                                    {t("MyReports.Next")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingReport && (
                <div className="fixed inset-0 bg-[var(--bg-card)]/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[var(--bg-card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-[var(--border-color)]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-[var(--text-color)]">{t("MyReports.Edit_Report")}</h3>
                                <button
                                    onClick={() => setEditingReport(null)}
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-secondary)]"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            {/* Voter Information Section */}
                            <div>
                                <h4 className="text-md font-semibold text-[var(--text-color)] mb-3">{t("MyReports.Voter_Information")}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            {t("MyReports.Voter_Name")}
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.voter_first_name}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, voter_first_name: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            {t("MyReports.Relative_Name")}
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.voter_relative_name}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, voter_relative_name: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Father/Husband Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            {t("MyReports.Part_Number")}
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.part_no}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, part_no: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="123"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            {t("MyReports.Sl_Part_No")}
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.sl_no_in_part}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, sl_no_in_part: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="456"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            {t("MyReports.EPIC_Number")}
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.voter_id_epic_no}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, voter_id_epic_no: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="ABC1234567890"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Report Details Section */}
                            <div>
                                <h4 className="text-md font-semibold text-[var(--text-color)] mb-3">{t("MyReports.Report_Details")}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            {t("MyReports.Priority")}
                                        </label>
                                        <select
                                            value={editForm.priority}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value as any }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">{t("MyReports.Select_Priority")}</option>
                                            <option value="Low">{t("MyReports.Low")}</option>
                                            <option value="Medium">{t("MyReports.Medium")}</option>
                                            <option value="High">{t("MyReports.High")}</option>
                                            <option value="Critical">{t("MyReports.Critical")}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            {t("MyReports.Report_Type")}
                                        </label>
                                        <select
                                            value={editForm.report_type}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, report_type: e.target.value as any }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">{t("MyReports.Select_Type")}</option>
                                            <option value="Wrong Deleted">{t("MyReports.Wrong_Deleted")}</option>
                                            <option value="Wrong Added">{t("MyReports.Wrong_Added")}</option>
                                            <option value="New Voter F6">{t("MyReports.New_Voter_f6")}</option>
                                            <option value="Other">{t("MyReports.Other")}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        {t("MyReports.Report_Content")}
                                    </label>
                                    <textarea
                                        value={editForm.report_content}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, report_content: e.target.value }))}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Describe the issue or feedback..."
                                    />
                                </div>
                            </div>

                            {/* Attachments Section */}
                            <div>
                                <h4 className="text-md font-semibold text-[var(--text-color)] mb-3">{t("MyReports.Attachments")}</h4>

                                {/* Existing Attachments */}
                                {existingAttachments.length > 0 && (
                                    <div className="mb-4">
                                        <h5 className="text-sm font-medium text-[var(--text-secondary)] mb-2">{t("MyReports.Current_Attachments")}</h5>
                                        <div className="grid grid-cols-1 gap-2">
                                            {existingAttachments.map((attachment, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        {getFileIcon({ type: attachment.mimetype })}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-[var(--text-color)] truncate" title={attachment.originalName}>
                                                                {attachment.originalName}
                                                            </p>
                                                            <p className="text-xs text-[var(--text-secondary)]">
                                                                {formatFileSize(attachment.size)} • {attachment.mimetype.split('/')[1].toUpperCase()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-2">
                                                        {attachment.mimetype.startsWith('image/') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => previewAttachment({ url: attachment.url, name: attachment.originalName, type: attachment.mimetype })}
                                                                className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                                                                title="Preview"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <a
                                                            href={attachment.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1 text-green-500 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                                                            title="Download"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeExistingAttachment(index)}
                                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                                            title="Remove"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Add New Attachments */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                                    <div className="text-center">
                                        <Upload className="mx-auto h-8 w-8 text-[var(--text-secondary)] mb-2" />
                                        <div className="mb-2">
                                            <label htmlFor="edit-file-upload" className="cursor-pointer">
                                                <span className="text-sm font-medium text-[var(--text-color)]">{t("MyReports.Add_new_files")}</span>
                                                <span className="block text-xs text-[var(--text-secondary)] mt-1">
                                                    {t("MyReports.Supported_files")}
                                                </span>
                                            </label>
                                            <input
                                                id="edit-file-upload"
                                                name="edit-file-upload"
                                                type="file"
                                                multiple
                                                accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                                                onChange={handleEditFileUpload}
                                                className="sr-only"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('edit-file-upload')?.click()}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                        >
                                            {t("MyReports.Browse_files")}
                                        </button>
                                    </div>
                                </div>

                                {/* New Attachments List */}
                                {editAttachments.length > 0 && (
                                    <div className="mt-3">
                                        <h5 className="text-sm font-medium text-[var(--text-secondary)] mb-2">{t("MyReports.New_Attachments")} ({editAttachments.length})</h5>
                                        <div className="grid grid-cols-1 gap-2">
                                            {editAttachments.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        {getFileIcon(file)}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-[var(--text-color)] truncate" title={file.name}>
                                                                {file.name}
                                                            </p>
                                                            <p className="text-xs text-[var(--text-secondary)]">
                                                                {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-2">
                                                        {file.type.startsWith('image/') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => previewAttachment(file)}
                                                                className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                                                title="Preview"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEditAttachment(index)}
                                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                                            title="Remove"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-4 sm:px-6 py-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row justify-end gap-3">
                            <button
                                onClick={() => setEditingReport(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 text-sm font-medium"
                            >
                                {t("MyReports.Cancel")}
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                disabled={isUpdating}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                {isUpdating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        {t("MyReports.Updating")}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {t("MyReports.Update_Report")}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingReport && (
                <div className="fixed inset-0 bg-[var(--bg-card)]/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[var(--bg-card)] rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="px-4 sm:px-6 py-4 border-b border-[var(--border-color)]">
                            <h3 className="text-lg font-medium text-[var(--text-color)]">{t("MyReports.Delete_Report")}</h3>
                        </div>

                        <div className="px-4 sm:px-6 py-4">
                            <p className="text-sm text-[var(--text-secondary)]">
                                {t("MyReports.Delete_confirm")}{" "}
                                <span className="font-medium">
                                    {deletingReport.voter_first_name} {deletingReport.voter_last_name}
                                </span>
                                ? {t("MyReports.This_action_cannot_be_undone")}
                            </p>
                        </div>

                        <div className="px-4 sm:px-6 py-4 border-t border-[var(--border-color)] flex flex-col sm:flex-row justify-end gap-3">
                            <button
                                onClick={() => setDeletingReport(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 text-sm font-medium"
                            >
                                {t("MyReports.Cancel")}
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        {t("MyReports.Deleting")}
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        {t("MyReports.Delete_Report")}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-[var(--bg-card)] rounded-xl max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--text-color)]">
                                    {'name' in previewFile ? previewFile.name : (previewFile as File).name}
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">
                                    {'type' in previewFile ? previewFile.type : (previewFile as File).type}
                                </p>
                            </div>
                            <button
                                onClick={() => setPreviewFile(null)}
                                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[calc(90vh-120px)] overflow-auto">
                            {'url' in previewFile ? (
                                <img
                                    src={previewFile.url}
                                    alt={previewFile.name}
                                    className="max-w-full max-h-full object-contain mx-auto rounded-lg"
                                />
                            ) : previewFile.type.startsWith('image/') ? (
                                <img
                                    src={URL.createObjectURL(previewFile)}
                                    alt={previewFile.name}
                                    className="max-w-full max-h-full object-contain mx-auto rounded-lg"
                                />
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                                    <p className="text-[var(--text-secondary)] text-lg">{t("MyReports.Preview_not_available")}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



