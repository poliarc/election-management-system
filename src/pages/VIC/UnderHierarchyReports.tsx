import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetUnderHierarchyReportsQuery } from "../../store/api/vicReportsApi";
import { formatDistanceToNow } from "date-fns";
import { Eye, Filter, RefreshCw, Users, ChevronLeft, ChevronRight } from "lucide-react";

const UnderHierarchyReports: React.FC = () => {
    const navigate = useNavigate();
    const { levelId } = useParams<{ levelId: string }>();

    // Determine the base path based on current location
    const currentPath = window.location.pathname;
    const isSubLevel = currentPath.includes('/sublevel/');
    const isAfterAssembly = currentPath.includes('/afterassembly/');

    const basePath = isSubLevel
        ? `/sublevel/${levelId}/vic`
        : isAfterAssembly
            ? `/afterassembly/${levelId}/vic`
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
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "Critical": return "bg-red-100 text-red-800";
            case "High": return "bg-orange-100 text-orange-800";
            case "Medium": return "bg-yellow-100 text-yellow-800";
            case "Low": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Under-Hierarchy Reports</h1>
                        <p className="text-gray-600">Reports from lower hierarchy levels</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    <button
                        onClick={() => {
                            console.log('Force refreshing under-hierarchy reports...');
                            refetch();
                        }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                placeholder="Search reports..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange("status", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="In_Progress">In Progress</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                value={filters.priority}
                                onChange={(e) => handleFilterChange("priority", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Priorities</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                value={filters.report_type}
                                onChange={(e) => handleFilterChange("report_type", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Types</option>
                                <option value="Wrong Deleted">Wrong Deleted</option>
                                <option value="Wrong Added">Wrong Added</option>
                                <option value="New Voter F6">New Voter F6</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={clearFilters}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Reports List */}
            <div className="bg-white border border-gray-200 rounded-lg">
                {uniqueReports.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Under-Hierarchy Reports</h3>
                        <p className="text-gray-600">
                            No reports found from lower hierarchy levels.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Voter Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Report Info
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Submitted By
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {uniqueReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {report.voter_first_name} {report.voter_last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        EPIC: {report.voter_id_epic_no}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Part: {report.part_no}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                                                            {report.priority}
                                                        </span>
                                                        <span className="text-xs text-gray-500">{report.report_type}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-900 max-w-xs truncate">
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
                                                                📎 {attachments.length} attachment{attachments.length > 1 ? 's' : ''}
                                                            </div>
                                                        );
                                                    })()}
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {formatDistanceToNow(new Date(report.submitted_at), { addSuffix: true })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {report.submitted_by_first_name} {report.submitted_by_last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
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
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Current: {report.current_level_display_name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => navigate(`${basePath}/report-details/${report.id}`)}
                                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 transition"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                                    {pagination.total} results
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                        className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </button>
                                    <span className="text-sm text-gray-700">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
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