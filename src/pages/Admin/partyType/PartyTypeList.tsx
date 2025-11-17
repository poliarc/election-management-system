import React from "react";
import {
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Database,
  Tag,
  Clock,
} from "lucide-react";
type PartyType = {
  party_type_id: number;
  typeName: string;
  isActive: boolean;
  created_at: string;
};

interface PartyTypeListProps {
  partyTypes: PartyType[];
  onEdit: (partyType: PartyType) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, isActive: boolean) => void;
  loading: boolean;
}

export const PartyTypeList: React.FC<PartyTypeListProps> = ({
  partyTypes,
  onEdit,
  onDelete,
  onToggleStatus,
  loading,
}) => {
  const handleDeleteClick = (partyType: PartyType) => {
    const ok = window.confirm(
      `Are you sure you want to delete "${partyType.typeName}"? This action cannot be undone.`
    );
    if (ok) onDelete(partyType.party_type_id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (partyTypes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Database className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No party types found
          </h3>
          <p className="text-gray-500 mb-6">
            Create your first party type to categorize political parties
          </p>
          <div className="flex justify-center">
            <div className="text-sm text-gray-400">
              Try adjusting your search filters or create a new party type
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Table Header */}
        <div className="bg-linear-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Party Type Management
              </h3>
            </div>
            <div className="text-sm text-gray-600">
              {partyTypes.length} party type{partyTypes.length !== 1 ? "s" : ""}{" "}
              found
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-200"
            role="table"
            aria-label="Party types list"
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Tag className="w-4 h-4" />
                    <span>Type Name</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <ToggleRight className="w-4 h-4" />
                    <span>Status</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Created Date</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {partyTypes.map((partyType) => (
                <tr
                  key={partyType.party_type_id}
                  className="hover:bg-purple-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          partyType.isActive ? "bg-purple-100" : "bg-gray-100"
                        }`}
                      >
                        <Database
                          className={`w-5 h-5 ${
                            partyType.isActive
                              ? "text-purple-600"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {partyType.typeName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Type ID: {partyType.party_type_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() =>
                        onToggleStatus(
                          partyType.party_type_id,
                          !partyType.isActive
                        )
                      }
                      className="flex items-center space-x-2 hover:opacity-75 transition-opacity"
                      title={`Click to ${
                        partyType.isActive ? "deactivate" : "activate"
                      }`}
                      aria-label={`${
                        partyType.isActive ? "Deactivate" : "Activate"
                      } ${partyType.typeName}`}
                    >
                      {partyType.isActive ? (
                        <>
                          <div className="flex items-center space-x-1">
                            <ToggleRight className="w-5 h-5 text-green-500" />
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center space-x-1">
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          </div>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(partyType.created_at)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(partyType.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onEdit(partyType)}
                        className="text-purple-600 hover:text-purple-900 p-2 rounded-full hover:bg-purple-50 transition-colors"
                        title="Edit party type"
                        aria-label={`Edit ${partyType.typeName}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(partyType)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete party type"
                        aria-label={`Delete ${partyType.typeName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No external modal; deletion handled via window.confirm */}
    </>
  );
};
