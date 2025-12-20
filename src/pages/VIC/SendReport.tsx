import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateVICReportMutation } from "../../store/api/vicReportsApi";
import toast from "react-hot-toast";

export default function SendReport() {
    const navigate = useNavigate();
    const { levelId } = useParams<{ levelId: string }>();
    const [createReport, { isLoading }] = useCreateVICReportMutation();

    // Determine the base path based on current location
    const currentPath = window.location.pathname;
    const isSubLevel = currentPath.includes('/sublevel/');
    const isAfterAssembly = currentPath.includes('/afterassembly/');

    const basePath = isSubLevel
        ? `/sublevel/${levelId}/vic`
        : isAfterAssembly
            ? `/afterassembly/${levelId}/vic`
            : `/vic`;

    const [formData, setFormData] = useState({
        voter_id_epic_no: "",
        voter_first_name: "",
        voter_last_name: "",
        part_no: "",
        voter_relative_name: "",
        report_content: "",
        report_type: "Issue" as "Complaint" | "Feedback" | "Issue" | "Other",
        priority: "Medium" as "Low" | "Medium" | "High" | "Critical",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const result = await createReport(formData).unwrap();
            toast.success(result.message || "Report submitted successfully!");

            // Reset form
            setFormData({
                voter_id_epic_no: "",
                voter_first_name: "",
                voter_last_name: "",
                part_no: "",
                voter_relative_name: "",
                report_content: "",
                report_type: "Issue",
                priority: "Medium",
            });

            // Navigate to my reports after 1 second
            setTimeout(() => {
                navigate(`${basePath}/my-reports`);
            }, 1000);
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to submit report");
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Send VIC Report</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Submit a report about voter information or issues
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Voter Information */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Voter Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    EPIC Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="voter_id_epic_no"
                                    value={formData.voter_id_epic_no}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="ABC1234567890"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Part Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="part_no"
                                    value={formData.part_no}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="123"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="voter_first_name"
                                    value={formData.voter_first_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="John"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    name="voter_last_name"
                                    value={formData.voter_last_name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Doe (Optional)"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Relative Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="voter_relative_name"
                                    value={formData.voter_relative_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Father/Husband Name"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Report Details */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">Report Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Report Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="report_type"
                                    value={formData.report_type}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="Issue">Issue</option>
                                    <option value="Complaint">Complaint</option>
                                    <option value="Feedback">Feedback</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Report Content <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="report_content"
                                    value={formData.report_content}
                                    onChange={handleChange}
                                    required
                                    rows={6}
                                    minLength={10}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Describe the issue or provide feedback (minimum 10 characters)"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.report_content.length} characters
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
                        >
                            {isLoading ? "Submitting..." : "Submit Report"}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
