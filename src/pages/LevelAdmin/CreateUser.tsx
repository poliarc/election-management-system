import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Users, AlertTriangle, Upload, Download } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { LevelAdminUserForm } from "./components/LevelAdminUserForm";
import { UserList } from "../Admin/users/UserList";
import { UserSearchFilter } from "../Admin/users/UserSearchFilter";
import { BulkUploadModal } from "../../components/BulkUploadModal";
import { UserContactModal } from "../../components/UserContactModal";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserStatusMutation,
  useGetRolesQuery,
  useBulkUploadUsersMutation,
} from "../../store/api/partyUserApi";
import {
  fetchUsersByPartyAndState,
  type User as LevelAdminUser,
} from "../../services/levelAdminApi";
import { useAppSelector } from "../../store/hooks";
import type {
  User,
  UserSearchParams,
  UserForm as UserFormType,
} from "../../types/user";

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

export const LevelAdminCreateUser: React.FC = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const { levelAdminPanels } = useAppSelector((state) => state.auth);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedUserForContact, setSelectedUserForContact] = useState<User | null>(null);
  const [users, setUsers] = useState<LevelAdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchParams, setSearchParams] = useState<UserSearchParams>({
    page: 1,
    limit: 25,
  });

  const formRef = React.useRef<HTMLDivElement>(null);

  const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));
  const partyId = currentPanel?.metadata?.partyId;
  const stateId = currentPanel?.metadata?.stateId;
  const partyName = currentPanel?.metadata?.partyName || "";
  const stateName = currentPanel?.metadata?.stateName || "";

  // Check if Excel download should be shown (only for State, District, and Assembly levels)
  const shouldShowExcelDownload = React.useMemo(() => {
    if (!currentPanel?.name) return false;
    const panelName = currentPanel.name.toLowerCase();
    return panelName === "state" || panelName === "district" || panelName === "assembly";
  }, [currentPanel?.name]);

  // API hooks
  const { data: rolesResponse, isLoading: isLoadingRoles } = useGetRolesQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [toggleUserStatus, { isLoading: isToggling }] =
    useToggleUserStatusMutation();
  const [bulkUploadUsers, { isLoading: isUploading }] =
    useBulkUploadUsersMutation();

  const roles = rolesResponse || [];

  // Convert LevelAdminUser to User type
  const convertedUsers: User[] = React.useMemo(() => {
    let filteredUsers = users.map((user) => ({
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      contact_no: user.contact_no,
      party_id: user.party_id,
      state_id: user.state_id,
      district_id: user.district_id ?? undefined,
      partyName: user.partyName,
      stateName: user.stateName,
      districtName: user.districtName ?? undefined,
      isActive: Boolean(user.isActive),
      created_at: new Date().toISOString(),
    }));

    // If exact match is requested and search term is numeric (user ID)
    if (searchParams.exactMatch && searchParams.search) {
      const searchTerm = searchParams.search.trim();
      if (/^\d+$/.test(searchTerm)) {
        const searchUserId = parseInt(searchTerm);
        filteredUsers = filteredUsers.filter(user => user.user_id === searchUserId);
      }
    }

    return filteredUsers;
  }, [users, searchParams.exactMatch, searchParams.search]);

  // Load users
  const loadUsers = React.useCallback(async () => {
    if (!partyId || !stateId) return;

    try {
      setIsLoadingUsers(true);
      const response = await fetchUsersByPartyAndState(
        partyId,
        stateId,
        searchParams.page || 1,
        searchParams.limit || 25,
        searchParams.search
      );

      if (response.success) {
        const filteredUsers = response.data.filter(
          (user) => !user.isSuperAdmin
        );
        setUsers(filteredUsers);
        setTotalPages(response.pagination.totalPages);
        setTotalUsers(response.pagination.total);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [
    partyId,
    stateId,
    searchParams.page,
    searchParams.limit,
    searchParams.search,
  ]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (userData: UserFormType) => {
    if (!partyId || !stateId) {
      toast.error("Party ID or State ID is missing");
      return;
    }

    try {
      await createUser({
        ...userData,
        party_id: partyId,
        state_id: stateId,
      }).unwrap();
      toast.success("User created successfully!");
      setShowForm(false);
      loadUsers();
    } catch (error: unknown) {
      let errorMessage = "Failed to create user";

      if (error && typeof error === "object") {
        if ("data" in error) {
          const errorData = (error as { data: ApiError }).data;

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
          } else if (errorData?.error?.message) {
            errorMessage = errorData.error.message;
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } else if ("message" in error) {
          errorMessage = (error as { message: string }).message;
        }
      }

      toast.error(errorMessage);
    }
  };

  const handleUpdateUser = async (userData: UserFormType) => {
    if (!editingUser || !partyId || !stateId) return;

    try {
      await updateUser({
        id: editingUser.user_id,
        data: {
          ...userData,
          party_id: partyId,
          state_id: stateId,
        },
      }).unwrap();
      toast.success("User updated successfully!");
      setShowForm(false);
      setEditingUser(null);
      loadUsers();
    } catch (error: unknown) {
      let errorMessage = "Failed to update user";

      if (error && typeof error === "object") {
        if ("data" in error) {
          const errorData = (error as { data: ApiError }).data;

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
          } else if (errorData?.error?.message) {
            errorMessage = errorData.error.message;
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } else if ("message" in error) {
          errorMessage = (error as { message: string }).message;
        }
      }

      toast.error(errorMessage);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleViewContact = (user: User) => {
    setSelectedUserForContact(user);
    setShowContactModal(true);
  };

  const handleCloseContactModal = () => {
    setShowContactModal(false);
    setSelectedUserForContact(null);
  };

  const handleDeleteUser = async (userId: number) => {
    const user = users.find((u) => u.user_id === userId);
    if (user) {
      // Convert LevelAdminUser to User type
      const userForDelete: User = {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        contact_no: user.contact_no,
        party_id: user.party_id,
        state_id: user.state_id,
        district_id: user.district_id ?? undefined,
        partyName: user.partyName,
        stateName: user.stateName,
        districtName: user.districtName ?? undefined,
        isActive: Boolean(user.isActive),
        created_at: new Date().toISOString(),
      };
      setUserToDelete(userForDelete);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.user_id).unwrap();
      toast.success("User deleted successfully!");
      loadUsers();
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
      loadUsers();
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

  const handleBulkUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      await bulkUploadUsers(formData).unwrap();
      toast.success("Users uploaded successfully!");
      setShowBulkUpload(false);
      loadUsers();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message ||
            "Failed to upload users"
          : "Failed to upload users";
      toast.error(errorMessage);
    }
  };

  const handleExcelDownload = async () => {
    try {
      toast.loading("Preparing Excel file...");
      
      let allUsers: LevelAdminUser[] = [];
      let currentPage = 1;
      const limit = 100; // Maximum allowed by API
      let hasMorePages = true;

      // Fetch all users by making multiple API calls
      while (hasMorePages) {
        const response = await fetchUsersByPartyAndState(
          partyId!,
          stateId!,
          currentPage,
          limit,
          searchParams.search // Include current search filter
        );

        if (!response.success) {
          toast.dismiss();
          toast.error("Failed to fetch users for Excel download");
          return;
        }

        // Add users from current page
        allUsers = [...allUsers, ...response.data];

        // Check if there are more pages
        hasMorePages = currentPage < response.pagination.totalPages;
        currentPage++;
      }

      // Filter out super admins
      const filteredUsers = allUsers.filter((user) => !user.isSuperAdmin);

      if (filteredUsers.length === 0) {
        toast.dismiss();
        toast.error("No users found to download");
        return;
      }

      // Convert to proper format for Excel
      const allUsersForExcel = filteredUsers.map((user) => ({
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        contact_no: user.contact_no,
        party_id: user.party_id,
        state_id: user.state_id,
        district_id: user.district_id ?? undefined,
        partyName: user.partyName,
        stateName: user.stateName,
        districtName: user.districtName ?? undefined,
        role: (user as any).role || "N/A",
        created_at: new Date().toISOString(),
      }));

      // Prepare data for Excel with specific columns
      const excelData = allUsersForExcel.map((user, index) => ({
        "S.No": index + 1,
        "User ID": user.user_id,
        "User Name": `${user.first_name || ""} ${user.last_name || ""}`.trim() || "N/A",
        "Email": user.email || "N/A",
        "Phone No": user.contact_no || "N/A",
        "District Name": user.districtName || "N/A",
        "Party Name": user.partyName || "N/A",
        "Role": user.role || "N/A",
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better formatting
      const columnWidths = [
        { wch: 8 },  // S.No
        { wch: 12 }, // User ID
        { wch: 25 }, // User Name
        { wch: 30 }, // Email
        { wch: 15 }, // Phone No
        { wch: 20 }, // District Name
        { wch: 20 }, // Party Name
        { wch: 15 }, // Role
        { wch: 10 }  // Status
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

      // Generate filename with current date and total count
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `Users_${partyName}_${stateName}_${allUsersForExcel.length}records_${currentDate}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);
      
      toast.dismiss();
      toast.success(`Excel file downloaded: ${allUsersForExcel.length} users exported`);
    } catch (error) {
      console.error("Excel download error:", error);
      toast.dismiss();
      toast.error("Failed to download Excel file");
    }
  };

  if (!currentPanel || !partyId || !stateId) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
          <p className="text-red-700">
            Level admin panel not found or missing configuration
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="text-blue-600" />
                User Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage users for {partyName} - {stateName}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {shouldShowExcelDownload && (
                <button
                  onClick={handleExcelDownload}
                  disabled={totalUsers === 0}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={`Download all ${totalUsers} users as Excel`}
                >
                  <Download className="w-4 h-4" />
                  Excel ({totalUsers})
                </button>
              )}

              <button
                onClick={() => setShowBulkUpload(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Users
              </button>

              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add User
              </button>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div ref={formRef} className="mb-1">
            <LevelAdminUserForm
              user={editingUser}
              onSave={editingUser ? handleUpdateUser : handleCreateUser}
              onCancel={handleCloseForm}
              isLoading={isCreating || isUpdating}
              partyId={partyId}
              partyName={partyName}
              stateId={stateId}
              stateName={stateName}
              roles={roles}
              isLoadingRoles={isLoadingRoles}
            />
          </div>
        )}

        {/* Search and Filters - Only show when not in form mode */}
        {!showForm && (
          <UserSearchFilter
            searchParams={searchParams}
            onSearchChange={setSearchParams}
            totalResults={totalUsers}
            parties={[]}
            roles={roles}
          />
        )}

        {/* User List - Only show when not in form mode */}
        {!showForm && (
          <>
            <UserList
              users={convertedUsers}
              isLoading={isLoadingUsers || isDeleting || isToggling}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onToggleStatus={handleToggleUserStatus}
              onViewContact={handleViewContact}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-md p-4 mt-1">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() =>
                      setSearchParams((prev) => ({
                        ...prev,
                        page: Math.max(1, (prev.page || 1) - 1),
                      }))
                    }
                    disabled={searchParams.page === 1}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {searchParams.page || 1} of {totalPages} ({totalUsers}{" "}
                    total users)
                  </span>
                  <button
                    onClick={() =>
                      setSearchParams((prev) => ({
                        ...prev,
                        page: Math.min(totalPages, (prev.page || 1) + 1),
                      }))
                    }
                    disabled={searchParams.page === totalPages}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Bulk Upload Modal */}
        <BulkUploadModal
          isOpen={showBulkUpload}
          onClose={() => setShowBulkUpload(false)}
          onUpload={handleBulkUpload}
          isUploading={isUploading}
        />

        {/* User Contact Modal */}
        <UserContactModal
          isOpen={showContactModal}
          onClose={handleCloseContactModal}
          user={selectedUserForContact}
        />

        {/* Loading Overlay - Only show for first page load */}
        {!showForm && isLoadingUsers && searchParams.page === 1 && (
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-40">
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
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
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
    </div>
  );
};
