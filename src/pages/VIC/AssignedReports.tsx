import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useGetAssignedReportsQuery } from "../../store/api/vicReportsApi";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";

export default function AssignedReports() {
    const {t} = useTranslation();
    const { levelId } = useParams<{ levelId: string }>();
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        status: "",
        priority: "",
        report_type: "",
        search: "",
    });

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

    const { data, isLoading, error } = useGetAssignedReportsQuery({
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
                    <p className="text-red-800">Failed to load assigned reports. Please try again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 lg:p-6">
            <div className="bg-[var(--bg-card)] rounded-lg shadow-sm border border-[var(--border-color)]">
                <div className="px-6 py-4 border-b border-[var(--border-color)]">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-color)]">{t("Assigned_Reports.Title")}</h1>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                                {t("Assigned_Reports.Desc")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--text-secondary)]">
                                {pagination?.total || 0} {t("Assigned_Reports.reports")}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange("status", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">{t("Assigned_Reports.All_Status")}</option>
                                <option value="Pending">{t("Assigned_Reports.Pending")}</option>
                                <option value="In_Progress">{t("Assigned_Reports.In_Progress")}</option>
                                <option value="Approved">{t("Assigned_Reports.Approved")}</option>
                                <option value="Rejected">{t("Assigned_Reports.Rejected")}</option>
                                <option value="Resolved">{t("Assigned_Reports.Resolved")}</option>
                            </select>
                        </div>
                        <div>
                            <select
                                value={filters.priority}
                                onChange={(e) => handleFilterChange("priority", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">{t("Assigned_Reports.All_Priority")}</option>
                                <option value="Critical">{t("Assigned_Reports.Critical")}</option>
                                <option value="High">{t("Assigned_Reports.High")}</option>
                                <option value="Medium">{t("Assigned_Reports.Medium")}</option>
                                <option value="Low">{t("Assigned_Reports.Low")}</option>
                            </select>
                        </div>
                        <div>
                            <select
                                value={filters.report_type}
                                onChange={(e) => handleFilterChange("report_type", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">{t("Assigned_Reports.All_Types")}</option>
                                <option value="Wrong Deleted">{t("Assigned_Reports.Wrong_Deleted")}</option>
                                <option value="Wrong Added">{t("Assigned_Reports.Wrong_Added")}</option>
                                <option value="New Voter F6">{t("Assigned_Reports.New_Voter_F6")}</option>
                                <option value="Other">{t("Assigned_Reports.Other")}</option>
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
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-[var(--text-color)]">{t("Assigned_Reports.No_assigned_reports")}</h3>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                {t("Assigned_Reports.Desc1")}
                            </p>
                        </div>
                    ) : (
                        reports.map((report) => (
                            <div key={report.id} className="p-6 hover:bg-[var(--text-color)]/5 transition">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-medium text-[var(--text-color)]">
                                                {report.voter_first_name} {report.voter_last_name || ''}
                                            </h3>
                                            <span className="text-sm text-[var(--text-secondary)]">
                                                {t("Assigned_Reports.EPIC")}: {report.voter_id_epic_no}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 mb-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                                {report.status.replace("_", " ")}
                                            </span>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                                                {report.priority}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-[var(--text-color)]">
                                                {report.report_type}
                                            </span>
                                            {report.priority === "Critical" && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white animate-pulse">
                                                    {t("Assigned_Reports.Urgent")}
                                                </span>
                                            )}
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
                                                        <span>{attachments.length} {t("Assigned_Reports.attachment")} {attachments.length > 1 ? 's' : ''}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {attachments.slice(0, 3).map((attachment, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">
                                                                {attachment?.originalName || 'Attachment'}
                                                            </span>
                                                        ))}
                                                        {attachments.length > 3 && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-[var(--bg-main)] text-[var(--text-secondary)]">
                                                                +{attachments.length - 3} {t("Assigned_Reports.more")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                                            <span>
                                                {t("Assigned_Reports.Submitted")} {formatDistanceToNow(new Date(report.submitted_at))} {t("Assigned_Reports.ago")}
                                            </span>
                                            <span>
                                                {t("Assigned_Reports.By")}: {report.submitted_by_first_name} {report.submitted_by_last_name}
                                            </span>
                                            <span>
                                                {t("Assigned_Reports.Current_Level")}: {report.current_level_display_name}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="ml-4 shrink-0 flex gap-2">
                                        <Link
                                            to={`${basePath}/report-details/${report.id}`}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--text-color)]/5"
                                        >
                                            {t("Assigned_Reports.View_Details")}
                                        </Link>
                                        {report.status === "Pending" && (
                                            <Link
                                                to={`${basePath}/report-details/${report.id}?action=true`}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                            >
                                                {t("Assigned_Reports.Take_Action")}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-main)]">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-[var(--text-secondary)]">
                                {t("Assigned_Reports.Showing")} {((pagination.page - 1) * pagination.limit) + 1} {t("Assigned_Reports.to")}{" "}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} {t("Assigned_Reports.of")}{" "}
                                {pagination.total} {t("Assigned_Reports.results")}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--text-color)]/5"
                                >
                                    {t("Assigned_Reports.Previous")}
                                </button>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === pagination.totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--text-color)]/5"
                                >
                                    {t("Assigned_Reports.Next")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}



