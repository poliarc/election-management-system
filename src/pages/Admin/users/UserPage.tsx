import React, { useState } from "react";
import { Plus, Users, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { UserForm } from "./UserForm";
import { UserList } from "./UserList";
import { UserSearchFilter } from "./UserSearchFilter";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserStatusMutation,
  useGetPartiesQuery,
  useGetRolesQuery,
} from "../../../store/api/userApi";
import type {
  User,
  UserSearchParams,
  UserForm as UserFormType,
} from "../../../types/user";

// Error response types
interface ValidationError {
  path: string;
  message: string;
}

interface ApiError {
  error?: {
    message?: string;
    details?: ValidationError[];
  };
  message?: string;
}

export const UserPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchParams, setSearchParams] = useState<UserSearchParams>({
    page: 1,
    limit: 25,
  });

  // API hooks
  const {
    data: usersResponse,
    isLoading: isLoadingUsers,
    refetch,
  } = useGetUsersQuery(searchParams);
  const { data: partiesResponse, isLoading: isLoadingParties } =
    useGetPartiesQuery();
  const { data: rolesResponse, isLoading: isLoadingRoles } = useGetRolesQuery();

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [toggleUserStatus, { isLoading: isToggling }] =
    useToggleUserStatusMutation();

  const users = usersResponse?.data || [];
  const pagination = usersResponse?.pagination || { page: 1, limit: 25, total: 0, totalPages: 0 };
  const totalResults = pagination.total;
  const parties = partiesResponse || [];
  const roles = rolesResponse || [];

  const handleCreateUser = async (userData: UserFormType) => {
    try {
      await createUser(userData).unwrap();
      toast.success("User created successfully!");
      setShowForm(false);
      refetch();
    } catch (error: unknown) {
      let errorMessage = "Failed to create user";

      if (error && typeof error === "object") {
        // Handle RTK Query error structure
        if ("data" in error) {
          const errorData = (error as { data: ApiError }).data;

          // Handle validation errors with details
          if (
            errorData?.error?.details &&
            Array.isArray(errorData.error.details)
          ) {
            const validationErrors = errorData.error.details
              .map(
                (detail: ValidationError) => `${detail.path}: ${detail.message}`
              )
              .join(", ");
            errorMessage = `Validation Error: ${validationErrors}`;
          }
          // Handle general error messages
          else if (errorData?.error?.message) {
            errorMessage = errorData.error.message;
          }
          // Handle simple message format
          else if (errorData?.message) {
            errorMessage = errorData.message;
          }
        }
        // Handle other error formats
        else if ("message" in error) {
          errorMessage = (error as { message: string }).message;
        }
      }

      toast.error(errorMessage);
    }
  };

  const handleUpdateUser = async (userData: UserFormType) => {
    if (!editingUser) return;

    try {
      await updateUser({
        id: editingUser.user_id,
        data: userData,
      }).unwrap();
      toast.success("User updated successfully!");
      setShowForm(false);
      setEditingUser(null);
      refetch();
    } catch (error: unknown) {
      let errorMessage = "Failed to update user";

      if (error && typeof error === "object") {
        // Handle RTK Query error structure
        if ("data" in error) {
          const errorData = (error as { data: ApiError }).data;

          // Handle validation errors with details
          if (
            errorData?.error?.details &&
            Array.isArray(errorData.error.details)
          ) {
            const validationErrors = errorData.error.details
              .map(
                (detail: ValidationError) => `${detail.path}: ${detail.message}`
              )
              .join(", ");
            errorMessage = `Validation Error: ${validationErrors}`;
          }
          // Handle general error messages
          else if (errorData?.error?.message) {
            errorMessage = errorData.error.message;
          }
          // Handle simple message format
          else if (errorData?.message) {
            errorMessage = errorData.message;
          }
        }
        // Handle other error formats
        else if ("message" in error) {
          errorMessage = (error as { message: string }).message;
        }
      }

      toast.error(errorMessage);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDeleteUser = async (userId: number) => {
    const user = users.find((u) => u.user_id === userId);
    if (user) {
      setUserToDelete(user);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.user_id).unwrap();
      toast.success("User deleted successfully!");
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message ||
          "Failed to delete user"
          : "Failed to delete user";
      toast.error(errorMessage);
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const cancelDeleteUser = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      await toggleUserStatus({ id: userId, isActive }).unwrap();
      toast.success(
        `User ${isActive ? "activated" : "deactivated"} successfully!`
      );
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message ||
          `Failed to ${isActive ? "activate" : "deactivate"} user`
          : `Failed to ${isActive ? "activate" : "deactivate"} user`;
      toast.error(errorMessage);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  //   const handleRefresh = () => {
  //     refetch();
  //     toast.success("User list refreshed!");
  //   };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="text-blue-600" />
                User Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage system users, their roles, and permissions
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                title="Refresh user list"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button> */}

              {/* Test Toast Button - Remove in production */}
              {/* <button
                onClick={() => toast.success("Test toast message!")}
                className="flex items-center gap-2 px-3 py-2 border border-green-300 bg-green-50 rounded-md text-green-700 hover:bg-green-100 transition-colors text-sm"
                title="Test toast notification"
              >
                🔔 Test
              </button> */}

              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="mb-6">
            <UserForm
              user={editingUser}
              onSave={editingUser ? handleUpdateUser : handleCreateUser}
              onCancel={handleCloseForm}
              isLoading={isCreating || isUpdating}
              parties={parties}
              roles={roles}
              isLoadingParties={isLoadingParties}
              isLoadingRoles={isLoadingRoles}
            />
          </div>
        )}

        {/* Search and Filters - Only show when not in form mode */}
        {!showForm && (
          <UserSearchFilter
            searchParams={searchParams}
            onSearchChange={setSearchParams}
            totalResults={totalResults}
            parties={parties}
            roles={roles}
          />
        )}

        {/* User List - Only show when not in form mode */}
        {!showForm && (
          <UserList
            users={users}
            isLoading={isLoadingUsers || isDeleting || isToggling}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onToggleStatus={handleToggleUserStatus}
          />
        )}

        {/* Pagination - Only show when not in form mode */}
        {!showForm && pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-md">
              <button
                onClick={() =>
                  setSearchParams((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Previous
              </button>

              <span className="px-4 py-2 text-sm text-gray-600 font-medium">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>

              <button
                onClick={() =>
                  setSearchParams((prev) => ({
                    ...prev,
                    page: Math.min(pagination.totalPages, prev.page + 1),
                  }))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay - Only show when not in form mode */}
        {!showForm && isLoadingUsers && searchParams.page === 1 && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-700">Loading users...</span>
              </div>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Delete User
                    </h3>
                    <p className="text-sm text-gray-600">
                      Are you sure you want to delete{" "}
                      <span className="font-semibold text-gray-900">
                        {userToDelete.first_name} {userToDelete.last_name}
                      </span>
                      ? This action cannot be undone and will permanently remove
                      the user from the system.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={cancelDeleteUser}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteUser}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      "Delete User"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
};
