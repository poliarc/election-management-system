import React from "react";
import { X, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface BulkUploadResultsProps {
  isOpen: boolean;
  onClose: () => void;
  results: {
    success: boolean;
    message: string;
    data?: {
      total?: number;
      successful?: number;
      failed?: number;
      errors?: Array<{ row: number; error: string }>;
    } | null;
  } | null;
}

export const BulkUploadResults: React.FC<BulkUploadResultsProps> = ({
  isOpen,
  onClose,
  results,
}) => {
  if (!isOpen || !results) return null;

  const { success, message, data } = results;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {success ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
            <h2 className="text-2xl font-bold text-gray-800">
              {success ? "Upload Successful" : "Upload Failed"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Message */}
          <div
            className={`p-4 rounded-lg mb-6 ${
              success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <p
              className={`text-sm ${
                success ? "text-green-800" : "text-red-800"
              }`}
            >
              {message}
            </p>
          </div>

          {/* Statistics */}
          {data && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {data.total !== undefined && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Total Records</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {data.total}
                  </p>
                </div>
              )}
              {data.successful !== undefined && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Successful</p>
                  <p className="text-2xl font-bold text-green-600">
                    {data.successful}
                  </p>
                </div>
              )}
              {data.failed !== undefined && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-gray-600 mb-1">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {data.failed}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Errors List */}
          {data?.errors && data.errors.length > 0 && (
            <div className="border border-yellow-200 rounded-lg overflow-hidden">
              <div className="bg-yellow-50 px-4 py-3 border-b border-yellow-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-gray-800">
                    Errors ({data.errors.length})
                  </h3>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                        Row
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.errors.map((error, index) => (
                      <tr
                        key={index}
                        className={
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }
                      >
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {error.row}
                        </td>
                        <td className="px-4 py-2 text-sm text-red-600">
                          {error.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
