
// src/pages/PartyType/PartyTypePage.tsx
import React, { useMemo, useState, useEffect } from "react";
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
  X,
  Edit,
  Trash2,
  ToggleRight,
  ToggleLeft,
  Clock,
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

  // ✅ Fetch data
  const { data: itemsFromApi, isLoading, refetch } = useGetPartyTypesQuery();

  // ✅ Mutations
  const [createPartyType] = useCreatePartyTypeMutation();
  const [updatePartyType] = useUpdatePartyTypeMutation();
  const [activatePartyType] = useActivatePartyTypeMutation();
  const [deactivatePartyType] = useDeactivatePartyTypeMutation();
  const [deletePartyType] = useDeletePartyTypeMutation();

  // ✅ Local state
  const [items, setItems] = useState<PartyType[]>([]);

  // ✅ Delete modal state
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id?: number; name?: string }>({
    show: false,
  });

  // Load API data into local state
  useEffect(() => {
    if (itemsFromApi?.data) {
      const mappedItems: PartyType[] = itemsFromApi.data.map((pt: any) => ({
        party_type_id: pt.party_type_id,
        type: pt.type,
        typeName: pt.type, // frontend field
        isActive: Boolean(pt.isActive),
        created_at: new Date(pt.created_at).toISOString()
      }));
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

  // ✅ Form submit
  const handleFormSubmit = async (data: PartyTypeFormType) => {
    try {
      if (editingPartyType) {
        await updatePartyType({
          id: editingPartyType.party_type_id,
          data: { type: data.typeName },
        }).unwrap();
      } else {
        await createPartyType({ type: data.typeName }).unwrap();
      }
      setShowForm(false);
      setEditingPartyType(null);
      refetch();
    } catch (err) {
      console.error("Error submitting party type:", err);
    }
  };

  // ✅ Toggle active/inactive
  const handleToggleStatus = async (partyTypeId: number, isActive: boolean) => {
    try {
      if (isActive) {
        await activatePartyType(partyTypeId).unwrap();
      } else {
        await deactivatePartyType(partyTypeId).unwrap();
      }
      refetch();
    } catch (err) {
      console.error("Toggle status error:", err);
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
    setSearchParams((prev) => ({ page: 1, limit: prev.limit }));
  };

  // Inline Form
  const Form: React.FC<{ initial?: PartyTypeFormType }> = ({ initial }) => {
    const [typeName, setTypeName] = useState(initial?.typeName || "");
    const [isActive, setIsActive] = useState(initial?.isActive ?? true);
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!typeName.trim()) return;
      setSubmitting(true);
      await handleFormSubmit({ typeName: typeName.trim(), isActive });
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
    if (isLoading)
      return (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          Loading...
        </div>
      );
    if (filteredItems.length === 0)
      return (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          No party types found
        </div>
      );

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Tag className="w-4 h-4" /> Type Name
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <ToggleRight className="w-4 h-4" /> Status
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Created Date
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
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteModal({ show: true, id: pt.party_type_id, name: pt.typeName })
                      }
                      className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
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
    );
  };

  // ✅ Delete Modal
  const DeleteModal: React.FC = () => {
    if (!deleteModal.show) return null;

    const handleConfirm = async () => {
      if (deleteModal.id) {
        try {
          await deletePartyType(deleteModal.id).unwrap();
          refetch();
        } catch (err) {
          console.error("Delete error:", err);
        } finally {
          setDeleteModal({ show: false });
        }
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Delete Party Type</h2>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <span className="font-semibold">{deleteModal.name}</span>?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteModal({ show: false })}
              className="px-4 py-2 border rounded-md text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-2xl shadow-md w-full">
      {!showForm ? (
        <>
          {/* Header */}
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
                className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-md flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create Type</span>
              </button>
            </div>

            {/* Stats */}
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
                  <span className="text-sm text-purple-200">Inactive Types</span>
                </div>
                <div className="mt-2 text-3xl font-extrabold text-red-800 drop-shadow-md">
                  {filteredItems.filter((type) => !type.isActive).length}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search by party type name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800"
                  >
                    <X className="w-4 h-4" /> Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List */}
          <List />

          {/* Delete Modal */}
          <DeleteModal />
        </>
      ) : (
        <>
          {/* Form */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingPartyType ? "Edit Party Type" : "Create New Party Type"}
            </h2>
            <div className="w-24 h-1 bg-blue-500 mt-2 rounded"></div>
          </div>
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

