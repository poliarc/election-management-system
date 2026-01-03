import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateVICReportMutation } from "../../store/api/vicReportsApi";
import toast from "react-hot-toast";
import { Upload, X, FileText, Eye, Image, File } from "lucide-react";

export default function SendReport() {
    const navigate = useNavigate();
    const { levelId } = useParams<{ levelId: string }>();
    const [, { isLoading }] = useCreateVICReportMutation();

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
        part_no: "",
        sl_no_in_part: "",
        voter_relative_name: "",
        report_content: "",
        report_type: "" as "" | "Wrong Deleted" | "Wrong Added" | "New Voter F6" | "Other",
        priority: "" as "" | "Low" | "Medium" | "High" | "Critical",
    });

    const [attachments, setAttachments] = useState<File[]>([]);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        addFiles(files);
    };

    const addFiles = (files: File[]) => {
        const validFiles = files.filter(file => {
            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name} is too large. Maximum size is 10MB.`);
                return false;
            }

            // Check file type
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                toast.error(`${file.name} is not a supported file type.`);
                return false;
            }

            return true;
        });

        if (validFiles.length > 0) {
            setAttachments(prev => [...prev, ...validFiles]);
            toast.success(`${validFiles.length} file(s) added successfully`);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        addFiles(files);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
        toast.success("File removed");
    };

    const previewAttachment = (file: File) => {
        setPreviewFile(file);
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) {
            return <Image className="w-5 h-5 text-blue-500" />;
        } else if (file.type === 'application/pdf') {
            return <FileText className="w-5 h-5 text-red-500" />;
        } else {
            return <File className="w-5 h-5 text-gray-500" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.report_type) {
            toast.error("Please select a report type");
            return;
        }
        if (!formData.priority) {
            toast.error("Please select a priority");
            return;
        }

        try {
            // Create FormData to send files with the report
            const submitFormData = new FormData();

            // Add form fields
            submitFormData.append('voter_id_epic_no', formData.voter_id_epic_no);
            submitFormData.append('voter_first_name', formData.voter_first_name);
            submitFormData.append('part_no', formData.part_no);
            submitFormData.append('sl_no_in_part', formData.sl_no_in_part);
            submitFormData.append('voter_relative_name', formData.voter_relative_name);
            submitFormData.append('report_content', formData.report_content);
            submitFormData.append('report_type', formData.report_type);
            submitFormData.append('priority', formData.priority);

            // Add attachments
            attachments.forEach((file) => {
                submitFormData.append(`attachments`, file);
            });

            // Show loading message
            if (attachments.length > 0) {
                toast.loading("Submitting report with attachments...");
            } else {
                toast.loading("Submitting report...");
            }

            // Submit using fetch directly to handle FormData
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vic-reports`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("auth_access_token")}`,
                },
                body: submitFormData,
            });

            toast.dismiss();

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit report');
            }

            const result = await response.json();
            toast.success(result.message || "Report submitted successfully!");

            // Reset form
            setFormData({
                voter_id_epic_no: "",
                voter_first_name: "",
                part_no: "",
                sl_no_in_part: "",
                voter_relative_name: "",
                report_content: "",
                report_type: "",
                priority: "",
            });
            setAttachments([]);

            // Navigate to my reports after 1 second
            setTimeout(() => {
                navigate(`${basePath}/my-reports`);
            }, 1000);
        } catch (error: any) {
            toast.dismiss();
            console.error('Submit error:', error);
            toast.error(error.message || "Failed to submit report");
        }
    };

    return (
        <>
            <div className="bg-gray-50 -m-1 min-h-[calc(100vh-4rem)]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 rounded-t-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Send VIC Report</h1>
                                    <p className="text-indigo-100 mt-1">
                                        Submit a report about voter information or issues
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">

                            {/* Report Details */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <span className="text-indigo-600 font-semibold text-sm">1</span>
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Report Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="report_type"
                                            value={formData.report_type}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                        >
                                            <option value="" disabled>Select Report Type</option>
                                            <option value="Wrong Deleted">Wrong Deleted</option>
                                            <option value="Wrong Added">Wrong Added</option>
                                            <option value="New Voter F6">New Voter F6</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Priority <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                        >
                                            <option value="" disabled>Select Priority</option>
                                            <option value="Low">🟢 Low</option>
                                            <option value="Medium">🟡 Medium</option>
                                            <option value="High">🟠 High</option>
                                            <option value="Critical">🔴 Critical</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Report Content <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="report_content"
                                            value={formData.report_content}
                                            onChange={handleChange}
                                            required
                                            rows={6}
                                            minLength={10}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                                            placeholder="Describe the issue or provide detailed feedback (minimum 10 characters)"
                                        />
                                        <div className="flex justify-between items-center mt-2">
                                            <p className="text-sm text-gray-500">
                                                {formData.report_content.length} characters
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Minimum 10 characters required
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Voter Information */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-indigo-600 font-semibold text-sm">2</span>
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">Voter Information</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Voter Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="voter_first_name"
                                            value={formData.voter_first_name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                            placeholder="Enter voter's full name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Relative Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="voter_relative_name"
                                            value={formData.voter_relative_name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                            placeholder="Father's/Husband's name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Part Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="part_no"
                                            value={formData.part_no}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                            placeholder="e.g., 123"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Serial Number in Part <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="sl_no_in_part"
                                            value={formData.sl_no_in_part}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                            placeholder="e.g., 456"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            EPIC Voter Number {formData.report_type !== "New Voter F6" && formData.report_type !== "" && <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                            type="text"
                                            name="voter_id_epic_no"
                                            value={formData.voter_id_epic_no}
                                            onChange={handleChange}
                                            required={formData.report_type !== "New Voter F6" && formData.report_type !== ""}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                            placeholder="e.g., ABC1234567890"
                                        />
                                        {formData.report_type === "New Voter F6" && (
                                            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                                <span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                </span>
                                                EPIC number is optional for New Voter F6 reports
                                            </p>
                                        )}
                                        {/* {formData.report_type === "" && (
                                            <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                                                <span className="w-4 h-4 bg-amber-100 rounded-full flex items-center justify-center">
                                                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                                </span>
                                                Please select a report type first
                                            </p>
                                        )} */}
                                    </div>
                                </div>
                            </div>



                            {/* Attachments */}
                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                            <span className="text-indigo-600 font-semibold text-sm">3</span>
                                        </div>
                                        <h2 className="text-xl font-semibold text-gray-900">Attachments</h2>
                                    </div>
                                    <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                                        {attachments.length}/10 files
                                    </span>
                                </div>

                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${dragActive
                                        ? 'border-indigo-400 bg-indigo-50 scale-[1.02]'
                                        : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <div className="text-center">
                                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${dragActive ? 'bg-indigo-100' : 'bg-gray-100'
                                            }`}>
                                            <Upload className={`w-8 h-8 ${dragActive ? 'text-indigo-500' : 'text-gray-400'}`} />
                                        </div>
                                        <div className="mb-4">
                                            <p className={`text-lg font-medium ${dragActive ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                {dragActive ? 'Drop files here' : 'Upload supporting documents'}
                                            </p>
                                            <p className="text-gray-500 mt-1">
                                                PNG, JPG, PDF, DOC, DOCX up to 10MB each
                                            </p>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            id="file-upload"
                                            name="file-upload"
                                            type="file"
                                            multiple
                                            accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                                            onChange={handleFileUpload}
                                            className="sr-only"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-indigo-300 transition-colors font-medium"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Browse Files
                                        </button>
                                        <p className="text-sm text-gray-500 mt-2">
                                            or drag and drop files here
                                        </p>
                                    </div>
                                </div>

                                {/* Attachment List */}
                                {attachments.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                                            Attached Files ({attachments.length})
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {attachments.map((file, index) => (
                                                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                                            <div className="flex-shrink-0 mt-1">
                                                                {getFileIcon(file)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                                                                    {file.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    {file.type.startsWith('image/') && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => previewAttachment(file)}
                                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                                                                        >
                                                                            <Eye className="w-3 h-3" />
                                                                            Preview
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAttachment(index)}
                                                            className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors ml-2"
                                                            title="Remove file"
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

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Submitting Report...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Submit Report
                                        </span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="px-8 py-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* File Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{previewFile.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {formatFileSize(previewFile.size)} • {previewFile.type.split('/')[1].toUpperCase()}
                                </p>
                            </div>
                            <button
                                onClick={() => setPreviewFile(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[calc(90vh-120px)] overflow-auto">
                            {previewFile.type.startsWith('image/') ? (
                                <img
                                    src={URL.createObjectURL(previewFile)}
                                    alt={previewFile.name}
                                    className="max-w-full max-h-full object-contain mx-auto rounded-lg"
                                />
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600 text-lg">Preview not available for this file type</p>
                                    <p className="text-gray-500 text-sm mt-2">The file will be uploaded with your report</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
