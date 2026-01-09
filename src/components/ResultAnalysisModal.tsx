import React, { useState, useRef } from "react";
import { useUploadExcelFileMutation } from "../store/api/resultAnalysisApi";
import * as XLSX from "xlsx";

interface ResultAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    boothId: number;
    assemblyId: number;
    boothName: string;
}

const ResultAnalysisModal: React.FC<ResultAnalysisModalProps> = ({
    isOpen,
    onClose,
    boothId,
    assemblyId,
    boothName,
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [uploadExcelFile] = useUploadExcelFileMutation();

    if (!isOpen) return null;

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                '.xlsx',
                '.xls'
            ];
            
            if (validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                setSelectedFile(file);
            } else {
                alert('Please select a valid Excel file (.xlsx or .xls)');
                event.target.value = '';
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alert('Please select a file first');
            return;
        }

        setIsUploading(true);
        try {
            const result = await uploadExcelFile({
                excelFile: selectedFile,
                assemblyId,
                boothId,
            }).unwrap();

            if (result.success) {
                alert(`Upload successful! ${result.data?.message || 'File uploaded successfully'}`);
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                onClose();
            } else {
                alert(`Upload failed: ${result.message}`);
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error?.data?.message || 'An error occurred during upload'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const downloadTemplate = () => {
        // Create template data based on the API documentation
        const templateData = [
            {
                'StateName': 'Maharashtra',
                'DistrictName': 'Mumbai',
                'AssemblyName': 'Bandra East',
                'BoothNo': '001',
                'ValidVotes': 850,
                'RejectedVotes': 15,
                'NotaVotes': 5,
                'TotalVotes': 870,
                'Candidate Name 1': 'John Doe',
                'Candidate Votes 1': 450,
                'Candidate Party 1': 'BJP',
                'Candidate Name 2': 'Jane Smith',
                'Candidate Votes 2': 320,
                'Candidate Party 2': 'Congress',
                'Candidate Name 3': '',
                'Candidate Votes 3': '',
                'Candidate Party 3': '',
            }
        ];

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(templateData);

        // Set column widths
        const colWidths = [
            { wch: 15 }, // StateName
            { wch: 15 }, // DistrictName
            { wch: 20 }, // AssemblyName
            { wch: 10 }, // BoothNo
            { wch: 12 }, // ValidVotes
            { wch: 15 }, // RejectedVotes
            { wch: 12 }, // NotaVotes
            { wch: 12 }, // TotalVotes
            { wch: 20 }, // Candidate Name 1
            { wch: 15 }, // Candidate Votes 1
            { wch: 15 }, // Candidate Party 1
            { wch: 20 }, // Candidate Name 2
            { wch: 15 }, // Candidate Votes 2
            { wch: 15 }, // Candidate Party 2
            { wch: 20 }, // Candidate Name 3
            { wch: 15 }, // Candidate Votes 3
            { wch: 15 }, // Candidate Party 3
        ];
        ws["!cols"] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Result Analysis Template");

        // Generate filename
        const currentDate = new Date().toISOString().split("T")[0];
        const filename = `Result_Analysis_Template_${currentDate}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);
    };

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Result Analysis
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {boothName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Options */}
                <div className="space-y-4">
                    {/* Upload Excel Option */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Upload Excel File</h4>
                                <p className="text-sm text-gray-500">Upload result analysis data from Excel</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            
                            {selectedFile && (
                                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                    Selected: {selectedFile.name}
                                </div>
                            )}
                            
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || isUploading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                {isUploading ? 'Uploading...' : 'Upload File'}
                            </button>
                        </div>
                    </div>

                    {/* Download Template Option */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Download Template</h4>
                                <p className="text-sm text-gray-500">Get Excel template with required columns</p>
                            </div>
                        </div>
                        
                        <button
                            onClick={downloadTemplate}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Download Template
                        </button>
                    </div>
                </div>

                {/* Template Info */}
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h5 className="font-medium text-yellow-800 text-sm">Template Format</h5>
                            <p className="text-xs text-yellow-700 mt-1">
                                Required columns: StateName, DistrictName, AssemblyName, BoothNo, ValidVotes, RejectedVotes, NotaVotes, TotalVotes, and candidate details (Name, Votes, Party).
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultAnalysisModal;