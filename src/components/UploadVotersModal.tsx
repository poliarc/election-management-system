import { useState, useRef } from "react";
import { useUploadVotersMutation } from "../store/api/votersApi";

interface UploadVotersModalProps {
    isOpen: boolean;
    onClose: () => void;
    stateId: number;
    districtId: number;
    assemblyId: number;
    assemblyName: string;
}

export default function UploadVotersModal({
    isOpen,
    onClose,
    stateId,
    districtId,
    assemblyId,
    assemblyName,
}: UploadVotersModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadVoters, { isLoading, isSuccess, isError, error }] = useUploadVotersMutation();

    // Debug: Log props when modal opens
    console.log("UploadVotersModal Props:", {
        stateId,
        districtId,
        assemblyId,
        assemblyName,
        stateIdType: typeof stateId,
        districtIdType: typeof districtId,
        assemblyIdType: typeof assemblyId,
    });

    if (!isOpen) return null;

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

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (file: File) => {
        const validTypes = [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
        ];

        if (validTypes.includes(file.type) || file.name.endsWith(".csv") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
            setSelectedFile(file);
        } else {
            alert("Please select a valid CSV or Excel file");
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alert("Please select a file first");
            return;
        }

        console.log("Uploading with IDs:", {
            state_id: stateId,
            district_id: districtId,
            assembly_id: assemblyId,
            file: selectedFile.name,
        });

        try {
            await uploadVoters({
                state_id: stateId,
                district_id: districtId,
                assembly_id: assemblyId,
                file: selectedFile,
            }).unwrap();

            setTimeout(() => {
                setSelectedFile(null);
                onClose();
            }, 2000);
        } catch (err) {
            console.error("Upload failed:", err);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setSelectedFile(null);
            onClose();
        }
    };

    const handleDownloadTemplate = () => {
        // Create a link element to download the pre-existing Excel file
        const link = document.createElement('a');
        link.href = '/Voter_Sample_Data.xlsx';
        link.download = 'Voter_Sample_Data.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-sky-400 to-sky-500 px-6 py-4 rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Upload Voters</h2>
                        <button
                            onClick={handleClose}
                            disabled={isLoading}
                            className="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Assembly Info */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-700">Upload Details</h3>
                            <button
                                onClick={handleDownloadTemplate}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Template
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                                <span className="text-gray-600">State ID:</span>
                                <span className="ml-2 font-medium text-gray-900">{stateId}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">District ID:</span>
                                <span className="ml-2 font-medium text-gray-900">{districtId}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Assembly ID:</span>
                                <span className="ml-2 font-medium text-gray-900">{assemblyId}</span>
                            </div>
                        </div>
                        <div className="mt-2 text-sm">
                            <span className="text-gray-600">Assembly Name:</span>
                            <span className="ml-2 font-medium text-gray-900">{assemblyName}</span>
                        </div>
                    </div>

                    {/* File Upload Area */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-300 bg-gray-50"
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileInputChange}
                            className="hidden"
                        />

                        {!selectedFile ? (
                            <>
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                <p className="mt-2 text-sm text-gray-600">
                                    Drag and drop your file here, or
                                </p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Browse Files
                                </button>
                                <p className="mt-2 text-xs text-gray-500">
                                    Supported formats: CSV, Excel (.xlsx, .xls)
                                </p>
                            </>
                        ) : (
                            <div className="flex items-center justify-center space-x-3">
                                <svg
                                    className="h-10 w-10 text-green-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {(selectedFile.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    disabled={isLoading}
                                    className="ml-4 text-red-500 hover:text-red-700 disabled:opacity-50"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Status Messages */}
                    {isSuccess && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="text-sm text-green-800 font-medium">
                                    Voters uploaded successfully!
                                </p>
                            </div>
                        </div>
                    )}

                    {isError && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <p className="text-sm text-red-800 font-medium">
                                    {(error as any)?.data?.message || "Upload failed. Please try again."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </>
                        ) : (
                            "Upload"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
