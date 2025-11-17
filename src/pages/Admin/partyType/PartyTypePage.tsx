import React, { useMemo, useState, useEffect } from "react";
import { storage } from "../../../utils/storage";
import type {
  PartyType,
  PartyTypeForm as PartyTypeFormType,
  PartyTypeSearchParams,
} from "../../../types/partyType";
import {
  Plus,
  Database,
  Tag,
  BarChart3,
  Search,
  Filter,
  X,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
} from "lucide-react";

export const PartyTypePage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingPartyType, setEditingPartyType] = useState<PartyType | null>(
    null
  );
  const [searchParams, setSearchParams] = useState<PartyTypeSearchParams>({
    page: 1,
    limit: 25,
  });

  const [items, setItems] = useState<PartyType[]>([]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (searchParams.search && searchParams.search.trim()) {
      const q = searchParams.search.trim().toLowerCase();
      list = list.filter((pt) => pt.typeName.toLowerCase().includes(q));
    }
    if (typeof searchParams.isActive === "boolean") {
      list = list.filter((pt) => pt.isActive === searchParams.isActive);
    }
    return list;
  }, [items, searchParams]);

  const totalResults = filteredItems.length;

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

  const handleFormSubmit = async (data: PartyTypeFormType) => {
    if (editingPartyType) {
      setItems((prev) =>
        prev.map((pt) =>
          pt.party_type_id === editingPartyType.party_type_id
            ? { ...pt, typeName: data.typeName, isActive: data.isActive }
            : pt
        )
      );
    } else {
      const createdItem: PartyType = {
        party_type_id: Date.now(),
        typeName: data.typeName,
        isActive: data.isActive,
        created_at: new Date().toISOString(),
      };
      setItems((prev) => [createdItem, ...prev]);
    }
    setShowForm(false);
    setEditingPartyType(null);
  };

  const handleDeleteClick = async (partyTypeId: number) => {
    setItems((prev) => prev.filter((pt) => pt.party_type_id !== partyTypeId));
  };

  const handleToggleStatus = async (partyTypeId: number, isActive: boolean) => {
    setItems((prev) =>
      prev.map((pt) =>
        pt.party_type_id === partyTypeId ? { ...pt, isActive } : pt
      )
    );
  };

  const getInitialFormValues = (partyType: PartyType): PartyTypeFormType => ({
    typeName: partyType.typeName,
    isActive: partyType.isActive,
  });

  // Local search/filter state (previously in PartyTypeSearchFilter)
  const [localSearch, setLocalSearch] = useState(searchParams.search || "");
  const [showFilters, setShowFilters] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    try {
      const saved = storage.getPartyTypes<PartyType[]>();
      if (Array.isArray(saved)) setItems(saved);
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to storage on change
  useEffect(() => {
    storage.setPartyTypes(items);
  }, [items]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => ({ ...prev, search: localSearch, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const hasActiveFilters =
    !!localSearch || typeof searchParams.isActive === "boolean";

  const handleFilterChange = (
    key: keyof PartyTypeSearchParams,
    value: string | number | boolean | undefined
  ) => {
    setSearchParams((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setLocalSearch("");
    setSearchParams((prev) => ({ page: 1, limit: prev.limit }));
    setShowFilters(false);
  };

  // Inline Form component
  const Form: React.FC<{ initial?: PartyTypeFormType | undefined }> = ({
    initial,
  }) => {
    const [typeName, setTypeName] = useState(initial?.typeName || "");
    const [isActive, setIsActive] = useState(initial?.isActive ?? true);
    const [submitting, setSubmitting] = useState(false);
    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!typeName.trim()) return;
      setSubmitting(true);
      handleFormSubmit({ typeName: typeName.trim(), isActive });
      setSubmitting(false);
    };
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Party Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !typeName.trim() ? "border-gray-300" : "border-gray-300"
              }`}
              placeholder="Enter party type name"
              disabled={submitting}
            />
            {!typeName.trim() && (
              <p className="mt-1 text-sm text-red-600">
                Party type name is required
              </p>
            )}
          </div>
          <div>
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
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={handleFormCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !typeName.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{editingPartyType ? "Update" : "Create"}</span>
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Inline List component
  const List: React.FC = () => {
    if (filteredItems.length === 0) {
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
          </div>
        </div>
      );
    }
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-linear-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Party Type Management
            </h3>
          </div>
          <div className="text-sm text-gray-600">
            {filteredItems.length} party type
            {filteredItems.length !== 1 ? "s" : ""} found
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" role="table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    <span>Type Name</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <ToggleRight className="w-4 h-4" />
                    <span>Status</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
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
              {filteredItems.map((pt) => (
                <tr
                  key={pt.party_type_id}
                  className="hover:bg-purple-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          pt.isActive ? "bg-purple-100" : "bg-gray-100"
                        }`}
                      >
                        <Database
                          className={`w-5 h-5 ${
                            pt.isActive ? "text-purple-600" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {pt.typeName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Type ID: {pt.party_type_id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() =>
                        handleToggleStatus(pt.party_type_id, !pt.isActive)
                      }
                      className="flex items-center gap-2 hover:opacity-75"
                      aria-label={`Toggle ${pt.typeName}`}
                    >
                      {pt.isActive ? (
                        <div className="flex items-center gap-1">
                          <ToggleRight className="w-5 h-5 text-green-500" />
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        </div>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(pt.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(pt.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(pt)}
                        className="text-purple-600 hover:text-purple-900 p-2 rounded-full hover:bg-purple-50"
                        aria-label={`Edit ${pt.typeName}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${pt.typeName}"?`))
                            handleDeleteClick(pt.party_type_id);
                        }}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                        aria-label={`Delete ${pt.typeName}`}
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
    <div className="p-4 sm:p-6 bg-gray-50 rounded-2xl shadow-md w-full">
      {!showForm ? (
        <>
          {/* Page Header */}
          <div className="bg-linear-to-r from-purple-600 to-indigo-600 rounded-xl p-4 sm:p-6 mb-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Database className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Party Type Management</h1>
                  <p className="text-purple-100 mt-1">
                    Manage party types and categories for political parties
                  </p>
                </div>
              </div>
              <button
                onClick={handleCreateClick}
                className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create Type</span>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Tag className="w-5 h-5 text-purple-200" />
                  <span className="text-sm text-purple-200">Total Types</span>
                </div>
                <div className="mt-2 text-3xl font-extrabold text-purple-900 drop-shadow-md">
                  {totalResults}
                </div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-200" />
                  <span className="text-sm text-purple-200">Active Types</span>
                </div>
                <div className="mt-2 text-3xl font-extrabold text-green-800 drop-shadow-md">
                  {filteredItems.filter((type) => type.isActive).length}
                </div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-gray-200" />
                  <span className="text-sm text-purple-200">
                    Inactive Types
                  </span>
                </div>
                <div className="mt-2 text-3xl font-extrabold text-red-800 drop-shadow-md">
                  {filteredItems.filter((type) => !type.isActive).length}
                </div>
              </div>
            </div>
          </div>

          {/* Inline Search & Filters */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search by party type name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${
                    showFilters || hasActiveFilters
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="w-4 h-4" /> Filters
                  {hasActiveFilters && (
                    <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {
                        [localSearch, searchParams.isActive].filter(Boolean)
                          .length
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quick Actions
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFilterChange("isActive", true)}
                        className="flex items-center gap-1 px-3 py-2 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                      >
                        <Database className="w-3 h-3" /> Active Only
                      </button>
                      <button
                        onClick={() => handleFilterChange("isActive", false)}
                        className="flex items-center gap-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        <Database className="w-3 h-3" /> Inactive Only
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-600">
              <div>
                {totalResults > 0 ? (
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-blue-700">
                      Showing {totalResults} party type
                      {totalResults !== 1 ? "s" : ""}
                    </span>
                    {hasActiveFilters && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        Filtered
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-gray-500">
                    <Database className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold">No party types found</span>
                  </span>
                )}
              </div>
              <div className="mt-3 sm:mt-0 flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 font-medium border border-green-300">
                    <span className="w-3 h-3 rounded-full bg-green-500 border border-green-700 inline-block"></span>
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 font-medium border border-red-300">
                    <span className="w-3 h-3 rounded-full bg-red-500 border border-red-700 inline-block"></span>
                    Inactive
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* List */}
          <List />
        </>
      ) : (
        <>
          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingPartyType ? "Edit Party Type" : "Create New Party Type"}
            </h2>
            <div className="w-24 h-1 bg-blue-500 mt-2 rounded"></div>
          </div>

          {/* Form */}
          <Form
            initial={
              editingPartyType
                ? getInitialFormValues(editingPartyType)
                : undefined
            }
          />
        </>
      )}
    </div>
  );
};
