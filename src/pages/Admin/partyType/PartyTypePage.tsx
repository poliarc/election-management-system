// src/pages/PartyType/PartyTypePage.tsx
import React, { useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import type {
  PartyType,
  PartyTypeForm as PartyTypeFormType,
  PartyTypeSearchParams,
} from "../../../types/partyType";
import {
  Plus,
  Database,
  Tag,
  X,
  Edit,
  Trash2,
  ToggleRight,
  ToggleLeft,
  Clock,
  Search,
  Filter,
  // RefreshCw,
  AlertTriangle,
} from "lucide-react";

// ✅ Import RTK Query hooks
import {
  useGetPartyTypesQuery,
  useCreatePartyTypeMutation,
  useUpdatePartyTypeMutation,
  useActivatePartyTypeMutation,
  useDeactivatePartyTypeMutation,
  useDeletePartyTypeMutation,
} from "../../../store/api/partyTypeApi";

export const PartyTypePage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingPartyType, setEditingPartyType] = useState<PartyType | null>(
    null
  );
  const [searchParams, setSearchParams] = useState<PartyTypeSearchParams>({
    page: 1,
    limit: 25,
  });

  // ✅ Fetch data with pagination
  const {
    data: itemsFromApi,
    isLoading,
    refetch,
  } = useGetPartyTypesQuery({
    page: searchParams.page,
    limit: searchParams.limit,
  });

  const backendPagination = itemsFromApi?.pagination;

  // Calculate pagination - use backend data if available, otherwise calculate from items
  const pagination = backendPagination || {
    page: searchParams.page,
    limit: searchParams.limit,
    total: itemsFromApi?.data?.length || 0,
    totalPages: Math.ceil(
      (itemsFromApi?.data?.length || 0) / searchParams.limit
    ),
  };

  // ✅ Mutations
  const [createPartyType] = useCreatePartyTypeMutation();
  const [updatePartyType] = useUpdatePartyTypeMutation();
  const [activatePartyType] = useActivatePartyTypeMutation();
  const [deactivatePartyType] = useDeactivatePartyTypeMutation();
  const [deletePartyType] = useDeletePartyTypeMutation();

  // ✅ Local state
  const [items, setItems] = useState<PartyType[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PartyType | null>(null);

  // Load API data into local state
  useEffect(() => {
    if (itemsFromApi?.data) {
      const mappedItems: PartyType[] = itemsFromApi.data.map(
        (pt: {
          party_type_id: number;
          type: string;
          isActive: number | boolean;
          created_at: string;
        }) => ({
          party_type_id: pt.party_type_id,
          type: pt.type,
          typeName: pt.type, // frontend field
          isActive: Boolean(pt.isActive),
          created_at: new Date(pt.created_at).toISOString(),
        })
      );
      setItems(mappedItems);
    }
  }, [itemsFromApi]);

  // Filter logic
  const filteredItems = useMemo(() => {
    let list = items;
    if (searchParams.search && searchParams.search.trim()) {
      const q = searchParams.search.trim().toLowerCase();
      list = list.filter((pt) => pt.type.toLowerCase().includes(q));
    }
    if (typeof searchParams.isActive === "boolean") {
      list = list.filter((pt) => pt.isActive === searchParams.isActive);
    }

    // If backend doesn't handle pagination, do it on frontend
    if (!backendPagination && list.length > searchParams.limit) {
      const startIndex = (searchParams.page - 1) * searchParams.limit;
      const endIndex = startIndex + searchParams.limit;
      return list.slice(startIndex, endIndex);
    }

    return list;
  }, [items, searchParams, backendPagination]);

  const handleCreateClick = () => {
    setEditingPartyType(null);
    setShowForm(true);
  };

  const handleEditClick = (partyType: PartyType) => {
    setEditingPartyType(partyType);
    setShowForm(true);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPartyType(null);
  };

  // ✅ Form submit with toast notifications
  const handleFormSubmit = async (data: PartyTypeFormType) => {
    try {
      if (editingPartyType) {
        await updatePartyType({
          id: editingPartyType.party_type_id,
          data: { type: data.typeName },
        }).unwrap();
        toast.success("Party type updated successfully!");
      } else {
        await createPartyType({ type: data.typeName }).unwrap();
        toast.success("Party type created successfully!");
      }
      setShowForm(false);
      setEditingPartyType(null);
      refetch();
    } catch (err: unknown) {
      console.error("Error submitting party type:", err);
      const error = err as { data?: { message?: string } };
      const errorMessage = error?.data?.message || "Failed to save party type";
      toast.error(errorMessage);
    }
  };

  // ✅ Toggle active/inactive with toast notifications
  const handleToggleStatus = async (partyTypeId: number, isActive: boolean) => {
    try {
      if (isActive) {
        await activatePartyType(partyTypeId).unwrap();
        toast.success("Party type activated successfully!");
      } else {
        await deactivatePartyType(partyTypeId).unwrap();
        toast.success("Party type deactivated successfully!");
      }
      refetch();
    } catch (err: unknown) {
      console.error("Toggle status error:", err);
      const error = err as { data?: { message?: string } };
      const errorMessage = error?.data?.message || "Failed to update status";
      toast.error(errorMessage);
    }
  };

  const getInitialFormValues = (partyType: PartyType): PartyTypeFormType => ({
    typeName: partyType.type,
    isActive: partyType.isActive,
  });

  // Local search/filter state
  const [localSearch, setLocalSearch] = useState(searchParams.search || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => ({ ...prev, search: localSearch, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const hasActiveFilters =
    !!localSearch || typeof searchParams.isActive === "boolean";

  const clearFilters = () => {
    setLocalSearch("");
    setSearchParams({ page: 1, limit: searchParams.limit });
    setShowFilters(false);
  };

  const handleFilterChange = (
    key: string,
    value: string | number | boolean | undefined
  ) => {
    const newParams = { ...searchParams, [key]: value, page: 1 };
    setSearchParams(newParams);
  };

  // const handleRefresh = () => {
  //   refetch();
  //   toast.success("Party types refreshed!");
  // };

  const handleDeleteClick = (partyType: PartyType) => {
    setItemToDelete(partyType);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deletePartyType(itemToDelete.party_type_id).unwrap();
      toast.success("Party type deleted successfully!");
      refetch();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      const errorMessage =
        error?.data?.message || "Failed to delete party type";
      toast.error(errorMessage);
    } finally {
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  // Inline Form
  const Form: React.FC<{ initial?: PartyTypeFormType }> = ({ initial }) => {
    const [typeName, setTypeName] = useState(initial?.typeName || "");
    const isActive = initial?.isActive ?? true;
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!typeName.trim()) return;
      setSubmitting(true);
      await handleFormSubmit({ typeName: typeName.trim(), isActive });
      setSubmitting(false);
    };

    return (
      <div className="bg-white p-1 rounded-lg shadow-md">
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Party Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter party type name"
              disabled={submitting}
            />
            {!typeName.trim() && (
              <p className="mt-1 text-sm text-red-600">
                Party type name is required
              </p>
            )}
          </div>
          {/* <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={submitting}
              />
              Active
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Uncheck to make this party type inactive
            </p>
          </div> */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={handleFormCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !typeName.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <span>{editingPartyType ? "Update" : "Create"}</span>
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Inline List
  const List: React.FC = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10 bg-gray-200 rounded-full"></div>
                        <div className="ml-4 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (filteredItems.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Party Types Found
          </h3>
          <p className="text-gray-500">
            No party types match your current search criteria. Try adjusting
            your filters or search terms.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              Party Types ({filteredItems.length})
            </h3>
            <div className="text-sm text-gray-500">
              {filteredItems.filter((type) => type.isActive).length} active,{" "}
              {filteredItems.filter((type) => !type.isActive).length} inactive
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((pt) => (
                <tr
                  key={pt.party_type_id}
                  className="hover:bg-purple-50 transition-colors"
                >
                  {/* Type Details */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="shrink-0 h-10 w-10">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            pt.isActive ? "bg-purple-100" : "bg-gray-100"
                          }`}
                        >
                          <Database
                            className={`w-5 h-5 ${
                              pt.isActive ? "text-purple-600" : "text-gray-400"
                            }`}
                          />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {pt.typeName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {pt.party_type_id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() =>
                        handleToggleStatus(pt.party_type_id, !pt.isActive)
                      }
                      className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                      title={`Click to ${
                        pt.isActive ? "deactivate" : "activate"
                      }`}
                    >
                      {pt.isActive ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-green-500" />
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Created Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(pt.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2 justify-end">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditClick(pt)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        title="Edit party type"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteClick(pt)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete party type"
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
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-1">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Database className="text-purple-600" />
                Party Type Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage party types and categories for political parties
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                title="Refresh party types"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button> */}

              {!showForm && (
                <button
                  onClick={handleCreateClick}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Party Type
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards - Only show when not in form mode */}
        {!showForm && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="rounded-xl p-5 flex flex-col items-start bg-linear-to-br from-purple-100 via-purple-200 to-purple-300 shadow-md">
              <div className="flex items-center gap-3 mb-1">
                <Tag className="w-6 h-6 text-purple-700 bg-white rounded-full p-1 shadow" />
                <span className="text-sm font-semibold text-purple-800">
                  Total Types
                </span>
              </div>
              <div className="text-4xl font-extrabold text-purple-900">
                {items.length}
              </div>
            </div>
            <div className="rounded-xl p-5 flex flex-col items-start bg-linear-to-br from-green-100 via-green-200 to-green-300 shadow-md">
              <div className="flex items-center gap-3 mb-1">
                <ToggleRight className="w-6 h-6 text-green-700 bg-white rounded-full p-1 shadow" />
                <span className="text-sm font-semibold text-green-800">
                  Active Types
                </span>
              </div>
              <div className="text-4xl font-extrabold text-green-900">
                {items.filter((type) => type.isActive).length}
              </div>
            </div>
            <div className="rounded-xl p-5 flex flex-col items-start bg-linear-to-br from-red-100 via-red-200 to-red-300 shadow-md">
              <div className="flex items-center gap-3 mb-1">
                <ToggleLeft className="w-6 h-6 text-red-700 bg-white rounded-full p-1 shadow" />
                <span className="text-sm font-semibold text-red-800">
                  Inactive Types
                </span>
              </div>
              <div className="text-4xl font-extrabold text-red-900">
                {items.filter((type) => !type.isActive).length}
              </div>
            </div>
          </div>
        )}

        {/* Form Section */}
        {showForm && (
          <div className="mb-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingPartyType ? "Edit Party Type" : "Create New Party Type"}
              </h2>
              <div className="w-20 h-1 bg-purple-500 mt-2 rounded" />
            </div>
            <Form
              initial={
                editingPartyType
                  ? getInitialFormValues(editingPartyType)
                  : undefined
              }
            />
          </div>
        )}

        {/* Search and Filters - Only show when not in form mode */}
        {!showForm && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search by party type name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${
                    showFilters || hasActiveFilters
                      ? "bg-purple-50 border-purple-300 text-purple-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {
                        [localSearch, searchParams.isActive].filter(
                          (v) => v !== undefined && v !== ""
                        ).length
                      }
                    </span>
                  )}
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800"
                    title="Clear all filters"
                  >
                    <X className="w-4 h-4" /> Clear
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={
                        searchParams.isActive === undefined
                          ? ""
                          : searchParams.isActive
                          ? "active"
                          : "inactive"
                      }
                      onChange={(e) =>
                        handleFilterChange(
                          "isActive",
                          e.target.value === ""
                            ? undefined
                            : e.target.value === "active"
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Results per page
                    </label>
                    <select
                      value={searchParams.limit}
                      onChange={(e) =>
                        handleFilterChange("limit", Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <div>
                <span className="flex items-center gap-1">
                  <Database className="w-4 h-4" /> Showing{" "}
                  {filteredItems.length} of {items.length} result
                  {items.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Quick Stats */}
              <div className="hidden sm:flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />{" "}
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />{" "}
                  <span>Inactive</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List - Only show when not in form mode */}
        {!showForm && <List />}

        {/* Pagination - Only show when not in form mode */}
        {!showForm && pagination.total > searchParams.limit && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-md">
              <button
                onClick={() =>
                  setSearchParams((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={searchParams.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Previous
              </button>

              <span className="px-4 py-2 text-sm text-gray-600 font-medium">
                Page {pagination.page} of {pagination.totalPages} (
                {pagination.total} total)
              </span>

              <button
                onClick={() =>
                  setSearchParams((prev) => ({
                    ...prev,
                    page: Math.min(pagination.totalPages, prev.page + 1),
                  }))
                }
                disabled={searchParams.page >= pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && itemToDelete && (
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
                      Delete Party Type
                    </h3>
                    <p className="text-sm text-gray-600">
                      Are you sure you want to delete{" "}
                      <span className="font-semibold text-gray-900">
                        {itemToDelete.typeName}
                      </span>
                      ? This action cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete Party Type
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay - Only show when not in form mode */}
        {!showForm && isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="text-gray-700">Loading party types...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
