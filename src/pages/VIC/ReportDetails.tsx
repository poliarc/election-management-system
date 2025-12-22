import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useGetVICReportByIdQuery, useTakeActionOnReportMutation, useGetUserHierarchyQuery, useGetForwardLevelsQuery } from "../../store/api/vicReportsApi";
import { formatDistanceToNow, format } from "date-fns";
import toast from "react-hot-toast";

export default function ReportDetails() {
    const { id, levelId } = useParams<{ id: string; levelId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const showActionForm = searchParams.get("action") === "true";

    // Determine the base path based on current location
    const currentPath = window.location.pathname;
    const isSubLevel = currentPath.includes('/sublevel/');
    const isAfterAssembly = currentPath.includes('/afterassembly/');

    const basePath = isSubLevel
        ? `/sublevel/${levelId}/vic`
        : isAfterAssembly
            ? `/afterassembly/${levelId}/vic`
            : `/vic`;

    const [actionForm, setActionForm] = useState({
        action: "approve" as "approve" | "reject" | "forward" | "resolve",
        action_notes: "",
        forward_to_level_id: "",
    });

    const { data: reportData, isLoading, error, refetch } = useGetVICReportByIdQuery(Number(id));
    const { data: hierarchyData } = useGetUserHierarchyQuery();
    const { data: forwardLevelsData } = useGetForwardLevelsQuery();
    const [takeAction, { isLoading: isActionLoading }] = useTakeActionOnReportMutation();

    const report = reportData?.data;
    const hierarchy = hierarchyData?.data || [];
    const forwardLevels = forwardLevelsData?.data || [];

    const [showActionModal, setShowActionModal] = useState(false);

    // Check if current user can take action on this report
    const canTakeAction = () => {
        if (!report || !hierarchy.length) return false;

        // If report is resolved or approved, no actions available
        if (report.status === "Resolved" || report.status === "Approved") return false;

        // Check if there's a pending hierarchy item for any of the user's levels
        if (report.hierarchy && report.hierarchy.length > 0) {
            const userLevelIds = hierarchy.map(h => h.level_id);

            // Find if there's a pending item in the hierarchy that matches user's levels
            const pendingForUser = report.hierarchy.find(h =>
                h.status === "Pending" && userLevelIds.includes(h.level_id)
            );

            return !!pendingForUser;
        }

        // Fallback to original logic for reports without hierarchy
        return report.status === "Pending";
    };

    // Get available higher levels for forwarding using the API
    const getAvailableForwardLevels = () => {
        // Use the dedicated forward-levels API if available
        return forwardLevels;
    };

    // Check if forward option should be available
    const canForward = () => {
        return getAvailableForwardLevels().length > 0;
    };

    // Check if resolve option should be available (not if already approved/resolved)
    const canResolve = () => {
        if (!report) return false;
        return report.status !== "Resolved" && report.status !== "Approved";
    };

    useEffect(() => {
        // Only show modal if explicitly requested via URL params AND user can take action
        if (showActionForm && report && canTakeAction()) {
            setShowActionModal(true);
        }
    }, [showActionForm, report, hierarchy, forwardLevels]);

    // Reset action form when modal opens and ensure valid default action
    useEffect(() => {
        if (showActionModal && report) {
            // If report is resolved, default to approve instead of resolve
            const defaultAction = report.status === "Resolved" ? "approve" : "approve";
            setActionForm(prev => ({
                ...prev,
                action: defaultAction,
                action_notes: "",
                forward_to_level_id: ""
            }));
        }
    }, [showActionModal, report]);

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
            case "Forwarded":
                return "bg-purple-100 text-purple-800";
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

    const handleActionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const actionData: any = {
                action: actionForm.action,
                action_notes: actionForm.action_notes,
            };

            if (actionForm.action === "forward" && actionForm.forward_to_level_id) {
                actionData.forward_to_level_id = Number(actionForm.forward_to_level_id);
            }

            await takeAction({
                id: Number(id),
                data: actionData,
            }).unwrap();

            toast.success(`Report ${actionForm.action}d successfully!`);
            setShowActionModal(false);
            refetch();

            // Navigate back to assigned reports
            setTimeout(() => {
                navigate(`${basePath}/assigned-reports`);
            }, 1000);
        } catch (error: any) {
            console.error('Action error:', error);

            // Extract error message from different possible structures
            let errorMessage = `Failed to ${actionForm.action} report`;

            if (error?.data?.error?.message) {
                errorMessage = error.data.error.message;
            } else if (error?.data?.message) {
                errorMessage = error.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }

            toast.error(errorMessage);
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

    if (error || !report) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">Report not found or failed to load.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Report #{report.id}
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Submitted {formatDistanceToNow(new Date(report.submitted_at))} ago
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                                {report.status.replace("_", " ")}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(report.priority)}`}>
                                {report.priority}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Voter Information */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Voter Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <p className="text-sm text-gray-900">{report.voter_first_name} {report.voter_last_name || ''}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">EPIC Number</label>
                                    <p className="text-sm text-gray-900">{report.voter_id_epic_no}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Part Number</label>
                                    <p className="text-sm text-gray-900">{report.part_no}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Relative Name</label>
                                    <p className="text-sm text-gray-900">{report.voter_relative_name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Report Content */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Details</h2>
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-4 mb-3">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {report.report_type}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        Priority: {report.priority}
                                    </span>
                                </div>
                                <p className="text-gray-900 whitespace-pre-wrap">{report.report_content}</p>
                            </div>
                        </div>

                        {/* Resolution */}
                        {report.resolution_notes && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Resolution</h2>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-green-900 whitespace-pre-wrap">{report.resolution_notes}</p>
                                    {report.resolved_by_first_name && (
                                        <p className="text-sm text-green-700 mt-2">
                                            Resolved by: {report.resolved_by_first_name} {report.resolved_by_last_name}
                                        </p>
                                    )}
                                    {report.resolved_at && (
                                        <p className="text-sm text-green-700">
                                            Resolved on: {format(new Date(report.resolved_at), "PPP 'at' p")}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Actions */}
                        {canTakeAction() && (
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                                <button
                                    onClick={() => setShowActionModal(true)}
                                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
                                >
                                    Take Action
                                </button>
                            </div>
                        )}

                        {/* Show status info for resolved reports */}
                        {report.status === "Resolved" && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-green-900 mb-2">Report Status</h3>
                                <p className="text-sm text-green-800">
                                    This report has been resolved and no further actions are available.
                                </p>
                            </div>
                        )}

                        {/* Show status info for approved reports */}
                        {report.status === "Approved" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-blue-900 mb-2">Report Status</h3>
                                <p className="text-sm text-blue-800">
                                    This report has been approved and no further actions are available.
                                </p>
                            </div>
                        )}

                        {/* Show info when user cannot take action but report is not resolved/approved */}
                        {!canTakeAction() && report.status !== "Resolved" && report.status !== "Approved" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-blue-900 mb-2">Report Status</h3>
                                <p className="text-sm text-blue-800">
                                    This report is currently being processed at another level in the hierarchy.
                                </p>
                            </div>
                        )}

                        {/* Report Info */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Submitted By</label>
                                    <p className="text-sm text-gray-900">
                                        {report.submitted_by_first_name} {report.submitted_by_last_name}
                                    </p>
                                    <p className="text-xs text-gray-500">{report.submitted_by_email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Current Level</label>
                                    <p className="text-sm text-gray-900">{report.current_level_display_name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Submitted At</label>
                                    <p className="text-sm text-gray-900">
                                        {format(new Date(report.submitted_at), "PPP 'at' p")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Hierarchy Timeline */}
                        {report.hierarchy && report.hierarchy.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hierarchy Timeline</h3>
                                <div className="space-y-4">
                                    {[...report.hierarchy]
                                        .sort((a, b) => a.hierarchy_order - b.hierarchy_order)
                                        .map((item, index) => (
                                            <div key={item.id} className="flex items-start gap-3">
                                                <div className="shrink-0">
                                                    <div className={`w-3 h-3 rounded-full ${item.status === "Pending" ? "bg-yellow-400" :
                                                        item.status === "Forwarded" ? "bg-blue-400" :
                                                            item.status === "Approved" ? "bg-green-400" :
                                                                item.status === "Rejected" ? "bg-red-400" :
                                                                    "bg-gray-400"
                                                        }`} />
                                                    {index < report.hierarchy!.length - 1 && (
                                                        <div className="w-0.5 h-8 bg-gray-200 ml-1 mt-1" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {item.level_display_name}
                                                        </p>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {item.assigned_user_first_name} {item.assigned_user_last_name}
                                                    </p>
                                                    {item.action_notes && (
                                                        <p className="text-xs text-gray-600 mt-1">{item.action_notes}</p>
                                                    )}
                                                    {item.action_taken_at && (
                                                        <p className="text-xs text-gray-500">
                                                            {formatDistanceToNow(new Date(item.action_taken_at))} ago
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            {showActionModal && (
                <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Take Action on Report</h2>

                        <form onSubmit={handleActionSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                                <select
                                    value={actionForm.action}
                                    onChange={(e) => setActionForm(prev => ({ ...prev, action: e.target.value as any }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="approve">Approve</option>
                                    <option value="reject">Reject</option>
                                    {canForward() && (
                                        <option value="forward">Forward to Higher Level</option>
                                    )}
                                    {canResolve() && (
                                        <option value="resolve">Resolve</option>
                                    )}
                                </select>
                            </div>

                            {actionForm.action === "forward" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Forward To Higher Level</label>
                                    <select
                                        value={actionForm.forward_to_level_id}
                                        onChange={(e) => setActionForm(prev => ({ ...prev, forward_to_level_id: e.target.value }))}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Select Higher Level</option>
                                        {getAvailableForwardLevels().map((level) => (
                                            <option key={level.level_id} value={level.level_id}>
                                                {level.displayName}
                                            </option>
                                        ))}
                                        {getAvailableForwardLevels().length === 0 && (
                                            <option value="" disabled>No higher levels available</option>
                                        )}
                                    </select>
                                    {getAvailableForwardLevels().length === 0 && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            This report is already at the highest level you have access to.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Action Notes <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={actionForm.action_notes}
                                    onChange={(e) => setActionForm(prev => ({ ...prev, action_notes: e.target.value }))}
                                    required
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Provide notes for your action..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isActionLoading}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
                                >
                                    {isActionLoading ? "Processing..." : `${actionForm.action.charAt(0).toUpperCase() + actionForm.action.slice(1)} Report`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowActionModal(false)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}