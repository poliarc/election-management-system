import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateVICReportMutation } from "../../store/api/vicReportsApi";
import toast from "react-hot-toast";
import { Upload, X, FileText, Eye, Image, File } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SendReport() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const { levelId } = useParams<{ levelId: string }>();
    const [, { isLoading }] = useCreateVICReportMutation();

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.report_type) {
            toast.error("Please select a report type");
            return;
        }
        if (!formData.priority) {
            toast.error("Please select a priority");
            return;
        }

        try {
            const submitFormData = new FormData();
            submitFormData.append('voter_id_epic_no', formData.voter_id_epic_no);
            submitFormData.append('voter_first_name', formData.voter_first_name);
            submitFormData.append('part_no', formData.part_no);
            submitFormData.append('sl_no_in_part', formData.sl_no_in_part);
            submitFormData.append('voter_relative_name', formData.voter_relative_name);
            submitFormData.append('report_content', formData.report_content);
            submitFormData.append('report_type', formData.report_type);
            submitFormData.append('priority', formData.priority);

            attachments.forEach((file) => {
                submitFormData.append(`attachments`, file);
            });

            if (attachments.length > 0) {
                toast.loading("Submitting report with attachments...");
            } else {
                toast.loading("Submitting report...");
            }

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
        <div className="p-3 sm:p-4 lg:p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 rounded-xl mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--bg-card)]/20 rounded-lg">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{t("SendReport.Title")}</h1>
                            <p className="text-indigo-100 mt-1">{t("SendReport.Desc")}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Report Details */}
                    <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-indigo-600 font-semibold text-sm">1</span>
                            </div>
                            <h2 className="text-xl font-semibold text-[var(--text-color)]">{t("SendReport.Report_Details")}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("SendReport.Report_Type")} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="report_type"
                                    value={formData.report_type}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="" disabled>{t("SendReport.Select_Report_Type")}</option>
                                    <option value="Wrong Deleted">{t("SendReport.Wrong_Deleted")}</option>
                                    <option value="Wrong Added">{t("SendReport.Wrong_Added")}</option>
                                    <option value="New Voter F6">{t("SendReport.New_Voter_F6")}</option>
                                    <option value="Other">{t("SendReport.Other")}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("SendReport.Priority")} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="" disabled>Select {t("SendReport.Priority")}</option>
                                    <option value="Low">🟢 {t("SendReport.Low")}</option>
                                    <option value="Medium">🟡 {t("SendReport.Medium")}</option>
                                    <option value="High">🟠 {t("SendReport.High")}</option>
                                    <option value="Critical">🔴 {t("SendReport.Critical")}</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("SendReport.Report_Content")} <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="report_content"
                                    value={formData.report_content}
                                    onChange={handleChange}
                                    required
                                    rows={6}
                                    minLength={10}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                    placeholder="Describe the issue or provide detailed feedback (minimum 10 characters)"
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-sm text-[var(--text-secondary)]">{formData.report_content.length} {t("SendReport.characters")}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">{t("SendReport.Minimum_10_characters")}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Voter Information */}
                    <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-indigo-600 font-semibold text-sm">2</span>
                            </div>
                            <h2 className="text-xl font-semibold text-[var(--text-color)]">{t("SendReport.Voter_Information")}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("SendReport.Voter_Name")} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="voter_first_name"
                                    value={formData.voter_first_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter voter's full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("SendReport.Relative_Name")} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="voter_relative_name"
                                    value={formData.voter_relative_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Father's/Husband's name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("SendReport.Part_Number")} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="part_no"
                                    value={formData.part_no}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="e.g., 123"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("SendReport.Serial_Number_in_Part")} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="sl_no_in_part"
                                    value={formData.sl_no_in_part}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="e.g., 456"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {t("SendReport.EPIC_Voter_Number")} {formData.report_type !== "New Voter F6" && formData.report_type !== "" && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="text"
                                    name="voter_id_epic_no"
                                    value={formData.voter_id_epic_no}
                                    onChange={handleChange}
                                    required={formData.report_type !== "New Voter F6" && formData.report_type !== ""}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="e.g., ABC1234567890"
                                />
                                {formData.report_type === "New Voter F6" && (
                                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                        <span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        </span>
                                        {t("SendReport.EPIC_optional_for_New_Voter_F6")}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <span className="text-indigo-600 font-semibold text-sm">3</span>
                                </div>
                                <h2 className="text-xl font-semibold text-[var(--text-color)]">{t("SendReport.Attachments")}</h2>
                            </div>
                            <span className="text-sm text-[var(--text-secondary)] bg-gray-100 px-3 py-1 rounded-full">
                                {attachments.length}/10 files
                            </span>
                        </div>
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 transition-all ${dragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <div className="text-center">
                                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${dragActive ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                                    <Upload className={`w-8 h-8 ${dragActive ? 'text-indigo-500' : 'text-[var(--text-secondary)]'}`} />
                                </div>
                                <p className={`text-lg font-medium mb-2 ${dragActive ? 'text-indigo-900' : 'text-[var(--text-color)]'}`}>
                                    {dragActive ? 'Drop files here' : 'Upload supporting documents'}
                                </p>
                                <p className="text-[var(--text-secondary)] text-sm mb-4">{t("SendReport.Supported_files")}</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--bg-card)] border border-gray-300 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 font-medium"
                                >
                                    <Upload className="w-4 h-4" />
                                    {t("SendReport.Browse_Files")}
                                </button>
                            </div>
                        </div>
                        {attachments.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-lg font-medium text-[var(--text-color)] mb-4">{t("SendReport.Atteached_Files")} ({attachments.length})</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {attachments.map((file, index) => (
                                        <div key={index} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                                    <div className="flex-shrink-0 mt-1">{getFileIcon(file)}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-[var(--text-color)] truncate" title={file.name}>{file.name}</p>
                                                        <p className="text-xs text-[var(--text-secondary)] mt-1">{formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}</p>
                                                        {file.type.startsWith('image/') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => previewAttachment(file)}
                                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 mt-2"
                                                            >
                                                                <Eye className="w-3 h-3" />
                                                                {t("SendReport.Preview")}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
                                                    className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded ml-2"
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
                    <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 font-medium shadow-lg"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {t("SendReport.Submitting_Report")}
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        {t("SendReport.Submit_Report")}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-8 py-4 bg-gray-100 text-[var(--text-secondary)] rounded-lg hover:bg-[var(--text-color)]/5 font-medium"
                            >
                                {t("SendReport.Cancel")}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* File Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-[var(--bg-card)] rounded-xl max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--text-color)]">{previewFile.name}</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">
                                    {formatFileSize(previewFile.size)} • {previewFile.type.split('/')[1].toUpperCase()}
                                </p>
                            </div>
                            <button
                                onClick={() => setPreviewFile(null)}
                                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 rounded-lg"
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
                                    <p className="text-[var(--text-secondary)] text-lg">{t("SendReport.Preview_not_available")}</p>
                                    <p className="text-[var(--text-secondary)] text-sm mt-2">{t("SendReport.File_will_be_uploaded")}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



