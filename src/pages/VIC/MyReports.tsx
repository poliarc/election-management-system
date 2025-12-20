import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useGetMyReportsQuery, useUpdateVICReportMutation, useDeleteVICReportMutation } from "../../store/api/vicReportsApi";
import { formatDistanceToNow } from "date-fns";
import { Edit, Trash2, X, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function MyReports() {
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
        voter_last_name: "",
        part_no: "",
        voter_relative_name: "",
        report_content: "",
        priority: "" as "Low" | "Medium" | "High" | "Critical" | "",
        report_type: "" as "Complaint" | "Feedback" | "Issue" | "Other" | "",
    });

    // API hooks
    const [updateReport, { isLoading: isUpdating }] = useUpdateVICReportMutation();
    const [deleteReport, { isLoading: isDeleting }] = useDeleteVICReportMutation();

    // Determine the base path based on current location
    const currentPath = window.location.pathname;
    const isSubLevel = currentPath.includes('/sublevel/');
    const isAfterAssembly = currentPath.includes('/afterassembly/');

    const basePath = isSubLevel
        ? `/sublevel/${levelId}/vic`
        : isAfterAssembly
            ? `/afterassembly/${levelId}/vic`
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
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
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
                return "bg-gray-100 text-gray-800";
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
            voter_last_name: report.voter_last_name || "",
            part_no: report.part_no || "",
            voter_relative_name: report.voter_relative_name || "",
            report_content: report.report_content || "",
            priority: report.priority || "",
            report_type: report.report_type || "",
        });
    };

    const handleEditSubmit = async () => {
        if (!editingReport) return;

        try {
            // Filter out empty strings for optional fields
            const updateData: any = {};

            if (editForm.voter_id_epic_no) updateData.voter_id_epic_no = editForm.voter_id_epic_no;
            if (editForm.voter_first_name) updateData.voter_first_name = editForm.voter_first_name;
            if (editForm.voter_last_name) updateData.voter_last_name = editForm.voter_last_name;
            if (editForm.part_no) updateData.part_no = editForm.part_no;
            if (editForm.voter_relative_name) updateData.voter_relative_name = editForm.voter_relative_name;
            if (editForm.report_content) updateData.report_content = editForm.report_content;
            // Only include priority if it's not empty
            if (editForm.priority) updateData.priority = editForm.priority;
            // Only include report_type if it's not empty
            if (editForm.report_type) updateData.report_type = editForm.report_type;

            await updateReport({
                id: editingReport.id,
                data: updateData,
            }).unwrap();

            toast.success("Report updated successfully!");
            setEditingReport(null);
            refetch();
        } catch (error: any) {
            console.error('Update error:', error);
            const errorMessage = error?.data?.error?.message || error?.data?.message || error?.message || "Failed to update report";
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
        <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Reports submitted by you
                            </p>
                        </div>
                        <Link
                            to={`${basePath}/send-report`}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
                        >
                            Send New Report
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
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
                                <option value="">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="In_Progress">In Progress</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>
                        <div>
                            <select
                                value={filters.priority}
                                onChange={(e) => handleFilterChange("priority", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">All Priority</option>
                                <option value="Critical">Critical</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div>
                            <select
                                value={filters.report_type}
                                onChange={(e) => handleFilterChange("report_type", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">All Types</option>
                                <option value="Issue">Issue</option>
                                <option value="Complaint">Complaint</option>
                                <option value="Feedback">Feedback</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Reports List */}
                <div className="divide-y divide-gray-200">
                    {reports.length === 0 ? (
                        <div className="p-8 text-center">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
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
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Get started by sending your first report.
                            </p>
                            <div className="mt-6">
                                <Link
                                    to={`${basePath}/send-report`}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    Send Report
                                </Link>
                            </div>
                        </div>
                    ) : (
                        reports.map((report) => (
                            <div key={report.id} className="p-6 hover:bg-gray-50 transition">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {report.voter_first_name} {report.voter_last_name || ''}
                                            </h3>
                                            <span className="text-sm text-gray-500">
                                                EPIC: {report.voter_id_epic_no}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 mb-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                                {report.status.replace("_", " ")}
                                            </span>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                                                {report.priority}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {report.report_type}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                            {report.report_content}
                                        </p>

                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>
                                                Submitted {formatDistanceToNow(new Date(report.submitted_at))} ago
                                            </span>
                                            <span>
                                                Current Level: {report.current_level_display_name}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="ml-4 shrink-0 flex gap-2">
                                        <Link
                                            to={`${basePath}/report-details/${report.id}`}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            View Details
                                        </Link>
                                        {canEditOrDelete(report) && (
                                            <>
                                                <button
                                                    onClick={() => handleEditClick(report)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(report)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
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
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                                {pagination.total} results
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === pagination.totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingReport && (
                <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">Edit Report</h3>
                                <button
                                    onClick={() => setEditingReport(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            {/* Voter Information Section */}
                            <div>
                                <h4 className="text-md font-semibold text-gray-900 mb-3">Voter Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            EPIC Number
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.voter_id_epic_no}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, voter_id_epic_no: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="ABC1234567890"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Part Number
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Voter First Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.voter_first_name}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, voter_first_name: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Voter Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.voter_last_name}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, voter_last_name: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Relative Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.voter_relative_name}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, voter_relative_name: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Father/Husband Name"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Report Details Section */}
                            <div>
                                <h4 className="text-md font-semibold text-gray-900 mb-3">Report Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Priority
                                        </label>
                                        <select
                                            value={editForm.priority}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, priority: e.target.value as any }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select Priority</option>
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                            <option value="Critical">Critical</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Report Type
                                        </label>
                                        <select
                                            value={editForm.report_type}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, report_type: e.target.value as any }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select Type</option>
                                            <option value="Issue">Issue</option>
                                            <option value="Complaint">Complaint</option>
                                            <option value="Feedback">Feedback</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Report Content
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
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingReport(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                disabled={isUpdating}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Update Report
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingReport && (
                <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Delete Report</h3>
                        </div>

                        <div className="px-6 py-4">
                            <p className="text-sm text-gray-600">
                                Are you sure you want to delete this report for{" "}
                                <span className="font-medium">
                                    {deletingReport.voter_first_name} {deletingReport.voter_last_name}
                                </span>
                                ? This action cannot be undone.
                            </p>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setDeletingReport(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete Report
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}