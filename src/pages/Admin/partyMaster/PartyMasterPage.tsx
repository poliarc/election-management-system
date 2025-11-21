import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  fetchParties,
  fetchPartyTypes,
  createParty,
  updateParty,
  activateParty,
  deactivateParty,
  deleteParty,
  fetchUsersByParty,
  setQueryParams,
  clearError,
  clearPartyUsers,
} from "../../../store/partySlice";
import type { Party, CreatePartyRequest, UpdatePartyRequest } from "../../../types/party";
import { AdminAssignmentCell } from "../../../components/AdminAssignmentCell";
import {
  Database,
  Plus,
  Tag,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  Eye,
  Clock,
  Info,
  Search,
  Filter,
  X,
  Users,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

export const PartyMasterPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { parties, partyTypes, partyUsers, loading, error, pagination, queryParams } =
    useAppSelector((state) => state.party);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Party | null>(null);
  const [viewing, setViewing] = useState<Party | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedPartyForAdmin, setSelectedPartyForAdmin] = useState<Party | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState<Party | null>(null);

  const [localSearch, setLocalSearch] = useState<string>(queryParams.search || "");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const formRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    dispatch(fetchParties(queryParams));
    dispatch(fetchPartyTypes());
  }, [dispatch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setQueryParams({ ...queryParams, search: localSearch, page: 1 }));
      dispatch(fetchParties({ ...queryParams, search: localSearch, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Stats
  const total = parties.length;
  const activeCount = useMemo(() => parties.filter((p) => p.isActive === 1).length, [parties]);
  const inactiveCount = total - activeCount;
  const typeTotal = partyTypes.length;

  const hasActiveFilters = !!localSearch || queryParams.isActive !== undefined;

  const handleFilterChange = (key: string, value: any) => {
    const newParams = { ...queryParams, [key]: value, page: 1 };
    dispatch(setQueryParams(newParams));
    dispatch(fetchParties(newParams));
  };

  const clearFilters = () => {
    setLocalSearch("");
    const newParams = { page: 1, limit: queryParams.limit };
    dispatch(setQueryParams(newParams));
    dispatch(fetchParties(newParams));
    setShowFilters(false);
  };

  const handleAddClick = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (party: Party) => {
    setEditing(party);
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleDeleteClick = (party: Party) => {
    setPartyToDelete(party);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!partyToDelete) return;
    await dispatch(deleteParty(partyToDelete.party_id));
    setShowDeleteModal(false);
    setPartyToDelete(null);
    dispatch(fetchParties(queryParams));
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setPartyToDelete(null);
  };

  const handleToggle = async (party: Party) => {
    if (party.isActive === 1) {
      await dispatch(deactivateParty(party.party_id));
    } else {
      await dispatch(activateParty(party.party_id));
    }
    dispatch(fetchParties(queryParams));
  };

  const handleAssignAdmin = (party: Party) => {
    setSelectedPartyForAdmin(party);
    dispatch(fetchUsersByParty(party.party_id));
    setShowUserModal(true);
  };

  const handleSelectAdmin = async (userId: number) => {
    if (!selectedPartyForAdmin) return;
    await dispatch(
      updateParty({
        id: selectedPartyForAdmin.party_id,
        data: { adminId: userId },
      })
    );
    setShowUserModal(false);
    setSelectedPartyForAdmin(null);
    dispatch(clearPartyUsers());
    dispatch(fetchParties(queryParams));
  };

  // Form Component
  const PartyForm: React.FC = () => {
    const [partyName, setPartyName] = useState(editing?.partyName || "");
    const [partyCode, setPartyCode] = useState(editing?.partyCode || "");
    const [partyTypeId, setPartyTypeId] = useState(editing?.party_type_id || 0);
    const [submitting, setSubmitting] = useState(false);

    const codeSanitized = (raw: string) =>
      raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    const codeValid = /^[A-Z0-9]{1,10}$/.test(partyCode);

    const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!partyName.trim() || !codeValid || !partyTypeId) return;
      setSubmitting(true);

      try {
        if (editing) {
          const data: UpdatePartyRequest = {
            partyName: partyName.trim(),
            partyCode: partyCode.trim(),
            party_type_id: partyTypeId,
          };
          await dispatch(updateParty({ id: editing.party_id, data }));
        } else {
          const data: CreatePartyRequest = {
            partyName: partyName.trim(),
            partyCode: partyCode.trim(),
            party_type_id: partyTypeId,
          };
          await dispatch(createParty(data));
        }
        dispatch(fetchParties(queryParams));
        setShowForm(false);
        setEditing(null);
      } catch (err) {
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter party name"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party Type <span className="text-red-500">*</span>
            </label>
            <select
              value={partyTypeId}
              onChange={(e) => setPartyTypeId(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            >
              <option value={0}>Select party type</option>
              {partyTypes.filter((t) => t.isActive === 1).map((type) => (
                <option key={type.party_type_id} value={type.party_type_id}>
                  {type.type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={partyCode}
              onChange={(e) => setPartyCode(codeSanitized(e.target.value))}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${codeValid ? "border-gray-300" : "border-red-300"
                }`}
              placeholder="Enter party code (e.g., BJP, INC)"
              disabled={submitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Maximum 10 characters, uppercase letters and numbers only
            </p>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !partyName.trim() || !codeValid || !partyTypeId}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
            >
              {editing ? "Update Party" : "Create Party"}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // User Selection Modal
  const UserSelectionModal: React.FC = () => {
    if (!showUserModal || !selectedPartyForAdmin) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold">
              <Users className="w-5 h-5" /> Select Admin for {selectedPartyForAdmin.partyName}
            </div>
            <button
              onClick={() => {
                setShowUserModal(false);
                setSelectedPartyForAdmin(null);
                dispatch(clearPartyUsers());
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 overflow-y-auto flex-1">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading users...</div>
            ) : partyUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found for this party
              </div>
            ) : (
              <div className="space-y-2">
                {partyUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className={`p-4 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors ${selectedPartyForAdmin.adminId === user.user_id
                      ? "bg-blue-100 border-blue-500"
                      : "border-gray-200"
                      }`}
                    onClick={() => handleSelectAdmin(user.user_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          <div className="text-xs text-gray-500">
                            {user.role} • {user.contact_no}
                          </div>
                        </div>
                      </div>
                      {selectedPartyForAdmin.adminId === user.user_id && (
                        <div className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Current Admin
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Details Modal
  const DetailsModal: React.FC = () => {
    if (!viewing) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold">
              <Info className="w-5 h-5" /> Party Details
            </div>
            <button onClick={() => setViewing(null)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-800">
              <Tag className="w-4 h-4" /> <span className="font-medium">Name:</span> {viewing.partyName}
            </div>
            <div className="flex items-center gap-2 text-gray-800">
              <Tag className="w-4 h-4" /> <span className="font-medium">Code:</span> {viewing.partyCode}
            </div>
            <div className="flex items-center gap-2 text-gray-800">
              <Database className="w-4 h-4" /> <span className="font-medium">Type:</span>{" "}
              {viewing.party_type_name}
            </div>
            <div className="flex items-center gap-2 text-gray-800">
              <UserCheck className="w-4 h-4" /> <span className="font-medium">Admin:</span>{" "}
              {viewing.admin_name || "Not assigned"}
            </div>
            {viewing.admin_email && (
              <div className="flex items-center gap-2 text-gray-800 text-xs">
                <span className="ml-6">{viewing.admin_email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-800">
              {viewing.isActive === 1 ? (
                <>
                  <ToggleRight className="w-4 h-4 text-green-600" />{" "}
                  <span className="font-medium">Status:</span> Active
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 text-gray-500" />{" "}
                  <span className="font-medium">Status:</span> Inactive
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-800">
              <Clock className="w-4 h-4" /> <span className="font-medium">Created:</span>{" "}
              {new Date(viewing.created_at).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-gray-800">
              <Clock className="w-4 h-4" /> <span className="font-medium">Updated:</span>{" "}
              {new Date(viewing.updated_at).toLocaleString()}
            </div>
          </div>
          <div className="px-5 py-3 border-t flex justify-end">
            <button
              onClick={() => setViewing(null)}
              className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal
  const DeleteConfirmationModal: React.FC = () => {
    if (!showDeleteModal || !partyToDelete) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2 text-red-700 font-semibold">
              <Trash2 className="w-5 h-5" /> Confirm Delete
            </div>
            <button
              onClick={handleCancelDelete}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Party?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-900">
                    {partyToDelete.partyName}
                  </span>{" "}
                  ({partyToDelete.partyCode})? This action cannot be undone.
                </p>
                {partyToDelete.admin_name && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      <strong>Warning:</strong> This party has an assigned admin (
                      {partyToDelete.admin_name}). Deleting will remove this assignment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
            <button
              onClick={handleCancelDelete}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {loading ? "Deleting..." : "Delete Party"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-2xl shadow-md w-full">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => dispatch(clearError())} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 sm:p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Party Master</h1>
              <p className="text-purple-100 mt-1">Manage political party records</p>
            </div>
          </div>
          <button
            onClick={handleAddClick}
            className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-md transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Party</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl p-5 flex flex-col items-start bg-gradient-to-br from-purple-100 via-purple-200 to-purple-300 shadow-md">
            <div className="flex items-center gap-3 mb-1">
              <Tag className="w-6 h-6 text-purple-700 bg-white rounded-full p-1 shadow" />
              <span className="text-sm font-semibold text-purple-800">Total Parties</span>
            </div>
            <div className="text-4xl font-extrabold text-purple-900">{pagination.total}</div>
          </div>
          <div className="rounded-xl p-5 flex flex-col items-start bg-gradient-to-br from-green-100 via-green-200 to-green-300 shadow-md">
            <div className="flex items-center gap-3 mb-1">
              <ToggleRight className="w-6 h-6 text-green-700 bg-white rounded-full p-1 shadow" />
              <span className="text-sm font-semibold text-green-800">Active Parties</span>
            </div>
            <div className="text-4xl font-extrabold text-green-900">{activeCount}</div>
          </div>
          <div className="rounded-xl p-5 flex flex-col items-start bg-gradient-to-br from-red-100 via-red-200 to-red-300 shadow-md">
            <div className="flex items-center gap-3 mb-1">
              <ToggleLeft className="w-6 h-6 text-red-700 bg-white rounded-full p-1 shadow" />
              <span className="text-sm font-semibold text-red-800">Inactive Parties</span>
            </div>
            <div className="text-4xl font-extrabold text-red-900">{inactiveCount}</div>
          </div>
          <div className="rounded-xl p-5 flex flex-col items-start bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 shadow-md">
            <div className="flex items-center gap-3 mb-1">
              <Database className="w-6 h-6 text-indigo-700 bg-white rounded-full p-1 shadow" />
              <span className="text-sm font-semibold text-indigo-800">Party Types</span>
            </div>
            <div className="text-4xl font-extrabold text-indigo-900">{typeTotal}</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div ref={formRef} className="mb-6">
          <div className="mb-3">
            <h2 className="text-xl font-semibold text-gray-800">
              {editing ? "Edit Party" : "Create New Party"}
            </h2>
            <div className="w-20 h-1 bg-blue-500 mt-2 rounded" />
          </div>
          <PartyForm />
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by name, code, or type..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${showFilters || hasActiveFilters
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
            >
              <Filter className="w-4 h-4" /> Filters
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {[localSearch, queryParams.isActive].filter((v) => v !== undefined && v !== "").length}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={queryParams.isActive === undefined ? "" : queryParams.isActive}
                  onChange={(e) =>
                    handleFilterChange("isActive", e.target.value === "" ? undefined : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Results per page</label>
                <select
                  value={queryParams.limit}
                  onChange={(e) => handleFilterChange("limit", Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <Database className="w-4 h-4" /> Showing {parties.length} of {pagination.total} result
              {pagination.total !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" /> <span>Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full" /> <span>Inactive</span>
            </div>
          </div>
        </div>
      </div>

      {/* Listing */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Parties</h3>
          </div>
          <div className="text-sm text-gray-600">
            {parties.length} result{parties.length !== 1 ? "s" : ""}
          </div>
        </div>
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading parties...</div>
        ) : parties.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No parties found. Click "Add Party" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Party Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Party Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Party Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parties.map((p) => (
                  <tr key={p.party_id} className="hover:bg-purple-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${p.isActive === 1 ? "bg-purple-100" : "bg-gray-100"
                            }`}
                        >
                          <Database
                            className={`w-5 h-5 ${p.isActive === 1 ? "text-purple-600" : "text-gray-400"}`}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{p.partyName}</div>
                          <div className="text-xs text-gray-500">ID: {p.party_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{p.partyCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{p.party_type_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <AdminAssignmentCell party={p} onAssignClick={handleAssignAdmin} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => handleToggle(p)} className="flex items-center gap-2">
                        {p.isActive === 1 ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-green-500" />
                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setViewing(p)}
                          className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(p)}
                          className="text-purple-600 hover:text-purple-900 p-2 rounded-full hover:bg-purple-50"
                          title="Edit party"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(p)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                          title="Delete party"
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
        )}
      </div>

      {/* Pagination */}
      {pagination.total > (queryParams.limit || 10) && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-md">
            <button
              onClick={() => handleFilterChange("page", pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Previous
            </button>

            <span className="px-4 py-2 text-sm text-gray-600 font-medium">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>

            <button
              onClick={() => handleFilterChange("page", pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <DetailsModal />
      <UserSelectionModal />
      <DeleteConfirmationModal />
    </div>
  );
};

export default PartyMasterPage;
