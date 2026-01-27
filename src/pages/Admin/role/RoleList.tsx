import React, { useState } from "react";
import {
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  User,
  Shield,
  Clock,
} from "lucide-react";
import type { Role } from "../../../types/role";
import { ConfirmationModal } from "../../components/ConfirmationModal";

interface RoleListProps {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, isActive: boolean) => void;
  loading: boolean;
}

export const RoleList: React.FC<RoleListProps> = ({
  roles,
  onEdit,
  onDelete,
  onToggleStatus,
  loading,
}) => {
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    roleId: number | null;
    roleName: string;
  }>({
    isOpen: false,
    roleId: null,
    roleName: "",
  });

  const handleDeleteClick = (role: Role) => {
    setDeleteModal({
      isOpen: true,
      roleId: role.role_id,
      roleName: role.roleName,
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.roleId) {
      onDelete(deleteModal.roleId);
      setDeleteModal({ isOpen: false, roleId: null, roleName: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, roleId: null, roleName: "" });
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

  if (roles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No roles found
          </h3>
          <p className="text-gray-500 mb-6">
            Create your first role to get started with user management
          </p>
          <div className="flex justify-center">
            <div className="text-sm text-gray-400">
              Try adjusting your search filters or create a new role
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
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Role Management
              </h3>
            </div>
            <div className="text-sm text-gray-600">
              {roles.length} role{roles.length !== 1 ? "s" : ""} found
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-200"
            role="table"
            aria-label="Roles list"
          >
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>Role Name</span>
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
              {roles.map((role) => (
                <tr
                  key={role.role_id}
                  className="hover:bg-blue-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          role.isActive ? "bg-blue-100" : "bg-gray-100"
                        }`}
                      >
                        <Shield
                          className={`w-5 h-5 ${
                            role.isActive ? "text-blue-600" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {role.roleName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() =>
                        onToggleStatus(role.role_id, !role.isActive)
                      }
                      className="flex items-center space-x-2 hover:opacity-75 transition-opacity"
                      title={`Click to ${
                        role.isActive ? "deactivate" : "activate"
                      }`}
                      aria-label={`${
                        role.isActive ? "Deactivate" : "Activate"
                      } ${role.roleName}`}
                    >
                      {role.isActive ? (
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
                      {formatDate(role.created_at)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(role.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onEdit(role)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50 transition-colors"
                        title="Edit role"
                        aria-label={`Edit ${role.roleName}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(role)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete role"
                        aria-label={`Delete ${role.roleName}`}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Role"
        message={`Are you sure you want to delete "${deleteModal.roleName}"? This action cannot be undone and may affect users assigned to this role.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
        type="danger"
      />
    </>
  );
};
