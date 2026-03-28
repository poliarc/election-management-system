import React, { useState, useMemo, useRef } from "react";
import { Shield, Plus, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { RoleSearchFilter } from "./RoleSearchFilter";
import { RoleList } from "./RoleList";
import { RoleForm } from "./RoleForm";
import type {
  Role,
  RoleForm as RoleFormType,
  RoleSearchParams,
} from "../../../types/role";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useActivateRoleMutation,
  useDeactivateRoleMutation,
} from "../../../store/api/roleApi";
import { useTranslation } from "react-i18next";

export const RolePage: React.FC = () => {
  const [searchParams, setSearchParams] = useState<RoleSearchParams>({
    page: 1,
    limit: 25,
    search: "",
    isActive: undefined,
  });

  const formRef = useRef<HTMLDivElement>(null);

  const {
    data: rolesResponse,
    isLoading,
    isError,
    isFetching,
  } = useGetRolesQuery({ page: searchParams.page, limit: searchParams.limit });
  const {t} = useTranslation();
  const roles = rolesResponse?.data || [];
  const backendPagination = rolesResponse?.pagination;

  // Calculate pagination - use backend data if available, otherwise calculate from filtered results
  const pagination = backendPagination || {
    page: searchParams.page,
    limit: searchParams.limit,
    total: roles.length,
    totalPages: Math.ceil(roles.length / searchParams.limit),
  };

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
  const [activateRole] = useActivateRoleMutation();
  const [deactivateRole] = useDeactivateRoleMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredRoles = useMemo(() => {
    let data = [...roles];
    if (searchParams.search) {
      const term = searchParams.search.toLowerCase();
      data = data.filter((r) => r.roleName.toLowerCase().includes(term));
    }
    if (searchParams.isActive !== undefined) {
      data = data.filter((r) => r.isActive === searchParams.isActive);
    }

    // If backend doesn't handle pagination, do it on frontend
    if (!backendPagination && data.length > searchParams.limit) {
      const startIndex = (searchParams.page - 1) * searchParams.limit;
      const endIndex = startIndex + searchParams.limit;
      return data.slice(startIndex, endIndex);
    }

    return data;
  }, [roles, searchParams, backendPagination]);

  const handleSearchChange = (params: RoleSearchParams) =>
    setSearchParams(params);

  const handleCreateRole = async (data: RoleFormType) => {
    setActionError(null);
    try {
      await createRole({
        roleName: data.roleName.trim(),
        isActive: data.isActive,
      }).unwrap();
      toast.success(`Role "${data.roleName.trim()}" created successfully! 🎉`);
      setShowForm(false);
    } catch (e: unknown) {
      const error = e as { data?: { message?: string }; message?: string };
      setActionError(
        error?.data?.message || error?.message || "Failed to create role"
      );
    }
  };

  const handleUpdateRole = async (data: RoleFormType) => {
    if (!editingRole) return;
    setActionError(null);
    try {
      await updateRole({
        id: editingRole.role_id,
        data: { roleName: data.roleName.trim(), isActive: data.isActive },
      }).unwrap();
      toast.success(`Role "${data.roleName.trim()}" updated successfully! ✅`);
      setEditingRole(null);
      setShowForm(false);
    } catch (e: unknown) {
      const error = e as { data?: { message?: string }; message?: string };
      setActionError(
        error?.data?.message || error?.message || "Failed to update role"
      );
    }
  };

  const handleDeleteRole = async (id: number) => {
    setActionError(null);
    try {
      await deleteRole(id).unwrap();
      toast.success("Role deleted successfully! 🗑️");
    } catch (e: unknown) {
      const error = e as { data?: { message?: string }; message?: string };
      setActionError(
        error?.data?.message || error?.message || "Failed to delete role"
      );
    }
  };

  const handleToggleStatus = async (id: number, nextActive: boolean) => {
    setActionError(null);
    try {
      if (nextActive) {
        await activateRole(id).unwrap();
        toast.success("Role activated successfully! ✅");
      } else {
        await deactivateRole(id).unwrap();
        toast.success("Role deactivated successfully! ⏸️");
      }
    } catch (e: unknown) {
      const error = e as { data?: { message?: string }; message?: string };
      setActionError(
        error?.data?.message || error?.message || "Failed to toggle status"
      );
    }
  };

  const startEdit = (role: Role) => {
    setEditingRole(role);
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const cancelForm = () => {
    setEditingRole(null);
    setShowForm(false);
    setActionError(null);
  };

  return (
    <div className="p-1 sm:p-1 bg-[var(--bg-main)] rounded-2xl shadow-md w-full">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl p-4 sm:p-6 mb-1 ">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white text-blue-600 bg-opacity-20 p-3 rounded-lg">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t("RolePage.Title")}</h1>
              <p className="text-blue-100 mt-1">
                {t("RolePage.Desc")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!showForm && (
              <button
                onClick={() => {
                  setEditingRole(null);
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white text-blue-700 font-medium shadow hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t("RolePage.New_Role")}
              </button>
            )}
            {showForm && (
              <button
                onClick={cancelForm}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--bg-card)]/20 text-white font-medium hover:bg-[var(--bg-card)]/30 transition-colors"
              >
                <X className="w-4 h-4" />
                {t("RolePage.Close")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <RoleSearchFilter
        searchParams={searchParams}
        onSearchChange={handleSearchChange}
        totalResults={filteredRoles.length}
      />

      {/* Action / query errors */}
      {(isError || actionError) && (
        <div className="mb-4 p-4 bg-[var(--bg-card)] border border-red-200 text-red-700 rounded-md text-sm">
          {actionError || "Failed to load roles"}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div ref={formRef} className="mb-6">
          <RoleForm
            initialValues={
              editingRole
                ? {
                  roleName: editingRole.roleName,
                  isActive: editingRole.isActive,
                }
                : undefined
            }
            onSubmit={editingRole ? handleUpdateRole : handleCreateRole}
            onCancel={cancelForm}
            isLoading={isCreating || isUpdating}
          />
        </div>
      )}

      {/* List */}
      <RoleList
        roles={filteredRoles}
        onEdit={startEdit}
        onDelete={handleDeleteRole}
        onToggleStatus={handleToggleStatus}
        loading={isLoading || isFetching || isDeleting}
      />

      {/* Pagination */}
      {!showForm && pagination.total > searchParams.limit && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2 bg-[var(--bg-card)] p-4 rounded-lg shadow-md">
            <button
              onClick={() =>
                setSearchParams((prev) => ({
                  ...prev,
                  page: Math.max(1, prev.page - 1),
                }))
              }
              disabled={searchParams.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {t("RolePage.Previous")}
            </button>

            <span className="px-4 py-2 text-sm text-[var(--text-secondary)] font-medium">
              {t("RolePage.Page")} {pagination.page} {t("RolePage.of")} {pagination.totalPages} ({pagination.total} {t("RolePage.total")})
            </span>

            <button
              onClick={() =>
                setSearchParams((prev) => ({
                  ...prev,
                  page: Math.min(pagination.totalPages, prev.page + 1),
                }))
              }
              disabled={searchParams.page >= pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {t("RolePage.Next")}
            </button>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            style: {
              background: "#10b981",
              color: "#fff",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#10b981",
            },
          },
          error: {
            style: {
              background: "#ef4444",
              color: "#fff",
            },
          },
        }}
      />
    </div>
  );
};


