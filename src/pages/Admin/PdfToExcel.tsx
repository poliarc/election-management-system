import { useState, useRef } from "react";
import { convertPdfToExcel } from "../../utils/pdfToExcel";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function PdfToExcel() {
    const {t} = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [converting, setConverting] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        rowsExtracted?: number;
        columnsDetected?: number;
        pages?: number;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type === "application/pdf") {
                setFile(selectedFile);
                setResult(null);
            } else {
                toast.error("Please select a valid PDF file");
            }
        }
    };

    const handleConvert = async () => {
        if (!file) {
            toast.error("Please select a PDF file first");
            return;
        }

        setConverting(true);
        setResult(null);

        try {
            const { workbook, result: conversionResult } = await convertPdfToExcel(
                file
            );

            // Generate output filename
            const outputName = file.name.replace(/\.pdf$/i, ".xlsx");

            // Download the Excel file
            XLSX.writeFile(workbook, outputName);

            setResult(conversionResult);
            toast.success("PDF converted successfully!");
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Conversion failed";
            toast.error(errorMessage);
            setResult({
                success: false,
                message: errorMessage,
            });
        } finally {
            setConverting(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-[var(--bg-card)] rounded-lg shadow-sm border border-[var(--border-color)] p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[var(--text-color)] mb-2">
                        {t("PdfToExcel.Title")}
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        {t("PdfToExcel.Desc")}
                    </p>
                </div>

                <div className="space-y-6">
                    {/* File Upload Section */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            id="pdf-upload"
                        />
                        <label
                            htmlFor="pdf-upload"
                            className="cursor-pointer flex flex-col items-center"
                        >
                            <svg
                                className="w-12 h-12 text-[var(--text-secondary)] mb-3"
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
                            <span className="text-sm font-medium text-[var(--text-secondary)] mb-1">
                                {t("PdfToExcel.Desc1")}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">
                                {t("PdfToExcel.Desc2")}
                            </span>
                        </label>
                    </div>

                    {/* Selected File Display */}
                    {file && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <svg
                                    className="w-8 h-8 text-indigo-600"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <div>
                                    <p className="font-medium text-[var(--text-color)]">{file.name}</p>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleReset}
                                className="text-red-600 hover:text-red-700 font-medium text-sm"
                            >
                                {t("PdfToExcel.Remove")}
                            </button>
                        </div>
                    )}

                    {/* Convert Button */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleConvert}
                            disabled={!file || converting}
                            className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {converting ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    {t("PdfToExcel.Converting")}
                                </>
                            ) : (
                                <>
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                    </svg>
                                    {t("PdfToExcel.Convert_Excel")}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Result Display */}
                    {result && (
                        <div
                            className={`rounded-lg p-4 ${result.success
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {result.success ? (
                                    <svg
                                        className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                                <div className="flex-1">
                                    <p
                                        className={`font-medium ${result.success ? "text-green-900" : "text-red-900"
                                            }`}
                                    >
                                        {result.message}
                                    </p>
                                    {result.success && (
                                        <div className="mt-2 text-sm text-green-700 space-y-1">
                                            {result.pages && <p>{t("PdfToExcel.Page")}: {result.pages}</p>}
                                            {result.rowsExtracted && (
                                                <p>{t("PdfToExcel.Rows_extracted")}: {result.rowsExtracted}</p>
                                            )}
                                            {result.columnsDetected && (
                                                <p>{t("PdfToExcel.Columns_detected")}: {result.columnsDetected}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-[var(--bg-main)] rounded-lg p-4 border border-[var(--border-color)]">
                        <h3 className="font-medium text-[var(--text-color)] mb-2">{t("PdfToExcel.How_to_use")}:</h3>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-[var(--text-secondary)]">
                            <li>{t("PdfToExcel.Desc3")}</li>
                            <li>{t("PdfToExcel.Desc4")}</li>
                            <li>{t("PdfToExcel.Desc5")}</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}


