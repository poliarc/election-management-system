import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetUnderHierarchyReportsQuery } from "../../store/api/vicReportsApi";
import { formatDistanceToNow } from "date-fns";
import { Eye, Filter, RefreshCw, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const UnderHierarchyReports: React.FC = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const { levelId } = useParams<{ levelId: string }>();

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

    // State for filters and pagination
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        status: "",
        priority: "",
        report_type: "",
        search: "",
    });

    const [showFilters, setShowFilters] = useState(false);

    // Fetch under-hierarchy reports
    const { data, isLoading, error, refetch } = useGetUnderHierarchyReportsQuery(filters, {
        // Force refetch on mount and when filters change
        refetchOnMountOrArgChange: true,
    });

    const reports = data?.data || [];
    const pagination = data?.pagination;

    // Debug: Log to check for duplicates
    React.useEffect(() => {
        if (reports.length > 0) {
            console.log('Total reports received:', reports.length);
            const ids = reports.map(r => r.id);
            const uniqueIds = new Set(ids);
            if (ids.length !== uniqueIds.size) {
                console.warn('Duplicate report IDs detected:', ids);
                console.warn('Unique IDs:', Array.from(uniqueIds));
                console.warn('Duplicate reports:', reports.filter((report, index) =>
                    ids.indexOf(report.id) !== index
                ));
            } else {
                console.log('No duplicates found, all reports have unique IDs');
            }
        }
    }, [reports]);

    // Remove duplicates based on report ID (in case API returns duplicates)
    const uniqueReports = React.useMemo(() => {
        const seen = new Set();
        return reports.filter(report => {
            if (seen.has(report.id)) {
                console.warn('Filtering out duplicate report with ID:', report.id);
                return false;
            }
            seen.add(report.id);
            return true;
        });
    }, [reports]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1 // Reset to first page when filtering
        }));
    };

    const handlePageChange = (newPage: number) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const clearFilters = () => {
        setFilters({
            page: 1,
            limit: 10,
            status: "",
            priority: "",
            report_type: "",
            search: "",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Pending": return "bg-yellow-100 text-yellow-800";
            case "In_Progress": return "bg-blue-100 text-blue-800";
            case "Approved": return "bg-green-100 text-green-800";
            case "Rejected": return "bg-red-100 text-red-800";
            case "Resolved": return "bg-purple-100 text-purple-800";
            default: return "bg-gray-100 text-[var(--text-color)]";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "Critical": return "bg-red-100 text-red-800";
            case "High": return "bg-orange-100 text-orange-800";
            case "Medium": return "bg-yellow-100 text-yellow-800";
            case "Low": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-[var(--text-color)]";
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-red-800 font-medium">Error Loading Reports</h3>
                    <p className="text-red-600 text-sm mt-1">
                        Failed to load under-hierarchy reports. Please try again.
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-color)]">{t("UnderHierarchyReports.Title")}</h1>
                        <p className="text-[var(--text-secondary)]">{t("UnderHierarchyReports.Subtitle")}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 bg-gray-100 text-[var(--text-secondary)] px-4 py-2 rounded-lg hover:bg-[var(--text-color)]/5 transition"
                    >
                        <Filter className="w-4 h-4" />
                        {t("UnderHierarchyReports.Filters")}
                    </button>
                    <button
                        onClick={() => {
                            console.log('Force refreshing under-hierarchy reports...');
                            refetch();
                        }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {t("UnderHierarchyReports.Refresh")}
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t("UnderHierarchyReports.Search")}</label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                placeholder="Search reports..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t("UnderHierarchyReports.Status")}</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange("status", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t("UnderHierarchyReports.All_Status")}</option>
                                <option value="Pending">{t("UnderHierarchyReports.Pending")}</option>
                                <option value="In_Progress">{t("UnderHierarchyReports.In_Progress")}</option>
                                <option value="Approved">{t("UnderHierarchyReports.Approved")}</option>
                                <option value="Rejected">{t("UnderHierarchyReports.Rejected")}</option>
                                <option value="Resolved">{t("UnderHierarchyReports.Resolved")}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t("UnderHierarchyReports.Priority")}</label>
                            <select
                                value={filters.priority}
                                onChange={(e) => handleFilterChange("priority", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t("UnderHierarchyReports.All_Priorities")}</option>
                                <option value="Low">{t("UnderHierarchyReports.Low")}</option>
                                <option value="Medium">{t("UnderHierarchyReports.Medium")}</option>
                                <option value="High">{t("UnderHierarchyReports.High")}</option>
                                <option value="Critical">{t("UnderHierarchyReports.Critical")}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t("UnderHierarchyReports.Type")}</label>
                            <select
                                value={filters.report_type}
                                onChange={(e) => handleFilterChange("report_type", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t("UnderHierarchyReports.All_Types")}</option>
                                <option value="Wrong Deleted">{t("UnderHierarchyReports.Wrong_Deleted")}</option>
                                <option value="Wrong Added">{t("UnderHierarchyReports.Wrong_Added")}</option>
                                <option value="New Voter F6">{t("UnderHierarchyReports.New_Voter_F6")}</option>
                                <option value="Other">{t("UnderHierarchyReports.Other")}</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={clearFilters}
                            className="bg-gray-100 text-[var(--text-secondary)] px-4 py-2 rounded-lg hover:bg-[var(--text-color)]/5 transition"
                        >
                            {t("UnderHierarchyReports.Clear_Filters")}
                        </button>
                    </div>
                </div>
            )}

            {/* Reports List */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg">
                {uniqueReports.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">{t("UnderHierarchyReports.Desc2")}</h3>
                        <p className="text-[var(--text-secondary)]">
                            {t("UnderHierarchyReports.Desc3")}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[var(--bg-main)] border-b border-[var(--border-color)]">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("UnderHierarchyReports.Voter_Details")}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("UnderHierarchyReports.Report_Info")}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("UnderHierarchyReports.Submitted_By")}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("UnderHierarchyReports.Status")}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("UnderHierarchyReports.Actions")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-[var(--bg-card)] divide-y divide-gray-200">
                                    {uniqueReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-[var(--text-color)]/5">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-[var(--text-color)]">
                                                        {report.voter_first_name} {report.voter_last_name}
                                                    </div>
                                                    <div className="text-sm text-[var(--text-secondary)]">
                                                        {t("UnderHierarchyReports.EPIC")}: {report.voter_id_epic_no}
                                                    </div>
                                                    <div className="text-sm text-[var(--text-secondary)]">
                                                        {t("UnderHierarchyReports.Part")}: {report.part_no}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                                                            {report.priority}
                                                        </span>
                                                        <span className="text-xs text-[var(--text-secondary)]">{report.report_type}</span>
                                                    </div>
                                                    <div className="text-sm text-[var(--text-color)] max-w-xs truncate">
                                                        {report.report_content}
                                                    </div>
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
                                                            <div className="text-xs text-blue-600 mt-1">
                                                                📎 {attachments.length} {t("UnderHierarchyReports.attachment")}{attachments.length > 1 ? 's' : ''}
                                                            </div>
                                                        );
                                                    })()}
                                                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                                                        {formatDistanceToNow(new Date(report.submitted_at), { addSuffix: true })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-[var(--text-color)]">
                                                        {report.submitted_by_first_name} {report.submitted_by_last_name}
                                                    </div>
                                                    <div className="text-sm text-[var(--text-secondary)]">
                                                        {report.submitted_by_email}
                                                    </div>
                                                    {(report as any).submitter_level_display_name && (
                                                        <div className="text-xs text-blue-600">
                                                            {(report as any).submitter_level_display_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                                        {report.status.replace('_', ' ')}
                                                    </span>
                                                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                                                        {t("UnderHierarchyReports.Current")}: {report.current_level_display_name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => navigate(`${basePath}/report-details/${report.id}`)}
                                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 transition"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    {t("UnderHierarchyReports.View")}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="px-6 py-3 border-t border-[var(--border-color)] flex items-center justify-between">
                                <div className="text-sm text-[var(--text-secondary)]">
                                    {t("UnderHierarchyReports.Showing")} {((pagination.page - 1) * pagination.limit) + 1} {t("UnderHierarchyReports.to")}{" "}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)} {t("UnderHierarchyReports.of")}{" "}
                                    {pagination.total} {t("UnderHierarchyReports.results")}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                        className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        {t("UnderHierarchyReports.Previous")}
                                    </button>
                                    <span className="text-sm text-[var(--text-secondary)]">
                                        {t("UnderHierarchyReports.Page")} {pagination.page} {t("UnderHierarchyReports.of")} {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {t("UnderHierarchyReports.Next")}
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default UnderHierarchyReports;



