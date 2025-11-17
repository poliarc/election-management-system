import React, { useMemo, useState, useEffect } from "react";
import { storage } from "../../../utils/storage";
import type { PartyType } from "../../../types/partyType";
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
} from "lucide-react";

type Party = {
  party_id: number;
  name: string;
  code: string;
  typeName: string;
  isActive: boolean;
  created_at: string;
};

type PartyForm = {
  name: string;
  code: string;
  typeName: string;
  isActive: boolean;
};

type PartySearchParams = {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
};

export const PartyMasterPage: React.FC = () => {
  const [items, setItems] = useState<Party[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Party | null>(null);
  const [viewing, setViewing] = useState<Party | null>(null);

  const [partyTypeOptions, setPartyTypeOptions] = useState<string[]>([]);
  const [typeTotal, setTypeTotal] = useState<number>(0);

  // Load party types from storage
  useEffect(() => {
    const loadTypes = () => {
      try {
        const types = storage.getPartyTypes<PartyType[]>();
        const activeNames = Array.isArray(types)
          ? types.filter((t) => t.isActive).map((t) => t.typeName)
          : [];
        setPartyTypeOptions(activeNames);
        setTypeTotal(Array.isArray(types) ? types.length : 0);
      } catch {
        setPartyTypeOptions([]);
        setTypeTotal(0);
      }
    };
    loadTypes();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === "party_types") loadTypes();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const total = items.length;
  const activeCount = useMemo(
    () => items.filter((p) => p.isActive).length,
    [items]
  );
  const inactiveCount = total - activeCount;

  // Filters
  const [searchParams, setSearchParams] = useState<PartySearchParams>({
    page: 1,
    limit: 25,
    search: "",
  });
  const [localSearch, setLocalSearch] = useState<string>(
    searchParams.search || ""
  );
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => ({ ...prev, search: localSearch, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (searchParams.search && searchParams.search.trim()) {
      const q = searchParams.search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.typeName.toLowerCase().includes(q)
      );
    }
    if (typeof searchParams.isActive === "boolean") {
      list = list.filter((p) => p.isActive === searchParams.isActive);
    }
    return list;
  }, [items, searchParams]);

  const hasActiveFilters =
    !!localSearch || typeof searchParams.isActive === "boolean";

  const handleFilterChange = (
    key: keyof PartySearchParams,
    value: string | number | boolean | undefined
  ) => {
    setSearchParams((prev) => ({
      ...prev,
      [key]: value as PartySearchParams[typeof key],
      page: 1,
    }));
  };

  const clearFilters = () => {
    setLocalSearch("");
    setSearchParams((prev) => ({ page: 1, limit: prev.limit }));
    setShowFilters(false);
  };

  const handleAddClick = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (party: Party) => {
    setEditing(party);
    setShowForm(true);
  };

  const handleDelete = (partyId: number) => {
    if (!window.confirm("Delete this party?")) return;
    setItems((prev) => prev.filter((p) => p.party_id !== partyId));
  };

  const handleToggle = (partyId: number, next: boolean) => {
    setItems((prev) =>
      prev.map((p) => (p.party_id === partyId ? { ...p, isActive: next } : p))
    );
  };

  const initialFormValues: PartyForm = editing
    ? {
        name: editing.name,
        code: editing.code,
        typeName: editing.typeName,
        isActive: editing.isActive,
      }
    : { name: "", code: "", typeName: "", isActive: true };

  const Form: React.FC<{ initial: PartyForm }> = ({ initial }) => {
    const [name, setName] = useState(initial.name);
    const [code, setCode] = useState(initial.code);
    const [typeName, setTypeName] = useState(initial.typeName);
    const [isActive, setIsActive] = useState(initial.isActive);
    const [submitting, setSubmitting] = useState(false);

    const codeSanitized = (raw: string) =>
      raw
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10);
    const codeValid = /^[A-Z0-9]{1,10}$/.test(code);

    useEffect(() => {
      // Reset when switching between add/edit
      setName(initial.name);
      setCode(initial.code);
      setTypeName(initial.typeName);
      setIsActive(initial.isActive);
    }, [initial.name, initial.code, initial.typeName, initial.isActive]);

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !codeValid || !typeName.trim()) return;
      setSubmitting(true);
      if (editing) {
        setItems((prev) =>
          prev.map((p) =>
            p.party_id === editing.party_id
              ? {
                  ...p,
                  name: name.trim(),
                  code: code.trim(),
                  typeName: typeName.trim(),
                  isActive,
                }
              : p
          )
        );
      } else {
        const created: Party = {
          party_id: Date.now(),
          name: name.trim(),
          code: code.trim(),
          typeName: typeName.trim(),
          isActive,
          created_at: new Date().toISOString(),
        };
        setItems((prev) => [created, ...prev]);
      }
      setSubmitting(false);
      setShowForm(false);
      setEditing(null);
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            >
              <option value="">Select party type</option>
              {partyTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {partyTypeOptions.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                No party types found. Create types in Party Type.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(codeSanitized(e.target.value))}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                codeValid ? "border-gray-300" : "border-red-300"
              }`}
              placeholder="Enter party code (e.g., BJP, INC)"
              disabled={submitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Maximum 10 characters, uppercase letters and numbers only
            </p>
            {!codeValid && (
              <p className="mt-1 text-xs text-red-600">Invalid code format</p>
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
              Uncheck to make this party inactive
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
              disabled={
                submitting || !name.trim() || !codeValid || !typeName.trim()
              }
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
            >
              {editing ? "Update Party" : "Create Party"}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const Details: React.FC<{ data: Party; onClose: () => void }> = ({
    data,
    onClose,
  }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold">
            <Info className="w-5 h-5" /> Party Details
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="flex items-center gap-2 text-gray-800">
            <Tag className="w-4 h-4" />{" "}
            <span className="font-medium">Name:</span> {data.name}
          </div>
          <div className="flex items-center gap-2 text-gray-800">
            <Tag className="w-4 h-4" />{" "}
            <span className="font-medium">Code:</span> {data.code}
          </div>
          <div className="flex items-center gap-2 text-gray-800">
            <Database className="w-4 h-4" />{" "}
            <span className="font-medium">Type:</span> {data.typeName}
          </div>
          <div className="flex items-center gap-2 text-gray-800">
            {data.isActive ? (
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
            <Clock className="w-4 h-4" />{" "}
            <span className="font-medium">Created:</span>{" "}
            {new Date(data.created_at).toLocaleString()}
          </div>
        </div>
        <div className="px-5 py-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-2xl shadow-md w-full">
      {/* Header */}
      <div className="bg-linear-to-r from-purple-600 to-indigo-600 rounded-xl p-4 sm:p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Party Master</h1>
              <p className="text-purple-100 mt-1">
                Manage political party records
              </p>
            </div>
          </div>
          <button
            onClick={handleAddClick}
            className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-md transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{editing ? "Edit Party" : "Add Party"}</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Parties */}
          <div className="rounded-xl p-5 flex flex-col items-start bg-linear-to-br from-purple-100 via-purple-200 to-purple-300 shadow-md">
            <div className="flex items-center gap-3 mb-1">
              <Tag className="w-6 h-6 text-purple-700 bg-white rounded-full p-1 shadow" />
              <span className="text-sm font-semibold text-purple-800">
                Total Parties
              </span>
            </div>
            <div className="text-4xl font-extrabold text-purple-900 drop-shadow-md">
              {total}
            </div>
          </div>
          {/* Active Parties */}
          <div className="rounded-xl p-5 flex flex-col items-start bg-linear-to-br from-green-100 via-green-200 to-green-300 shadow-md">
            <div className="flex items-center gap-3 mb-1">
              <ToggleRight className="w-6 h-6 text-green-700 bg-white rounded-full p-1 shadow" />
              <span className="text-sm font-semibold text-green-800">
                Active Parties
              </span>
            </div>
            <div className="text-4xl font-extrabold text-green-900 drop-shadow-md">
              {activeCount}
            </div>
          </div>
          {/* Inactive Parties */}
          <div className="rounded-xl p-5 flex flex-col items-start bg-linear-to-br from-red-100 via-red-200 to-red-300 shadow-md">
            <div className="flex items-center gap-3 mb-1">
              <ToggleLeft className="w-6 h-6 text-red-700 bg-white rounded-full p-1 shadow" />
              <span className="text-sm font-semibold text-red-800">
                Inactive Parties
              </span>
            </div>
            <div className="text-4xl font-extrabold text-red-900 drop-shadow-md">
              {inactiveCount}
            </div>
          </div>
          {/* Party Types */}
          <div className="rounded-xl p-5 flex flex-col items-start bg-linear-to-br from-indigo-100 via-indigo-200 to-indigo-300 shadow-md">
            <div className="flex items-center gap-3 mb-1">
              <Database className="w-6 h-6 text-indigo-700 bg-white rounded-full p-1 shadow" />
              <span className="text-sm font-semibold text-indigo-800">
                Party Types
              </span>
            </div>
            <div className="text-4xl font-extrabold text-indigo-900 drop-shadow-md">
              {typeTotal}
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="mb-6">
          <div className="mb-3">
            <h2 className="text-xl font-semibold text-gray-800">
              {editing ? "Edit Party" : "Create New Party"}
            </h2>
            <div className="w-20 h-1 bg-blue-500 mt-2 rounded" />
          </div>
          <Form initial={initialFormValues} />
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
              className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${
                showFilters || hasActiveFilters
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" /> Filters
              {hasActiveFilters && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {[localSearch, searchParams.isActive].filter(Boolean).length}
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

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            {filteredItems.length > 0 ? (
              <span className="flex items-center gap-1">
                <Database className="w-4 h-4" /> Showing {filteredItems.length}{" "}
                result{filteredItems.length !== 1 ? "s" : ""}
                {hasActiveFilters && " (filtered)"}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-500">
                <Database className="w-4 h-4" /> No parties found
              </span>
            )}
          </div>
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

      {/* Listing */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-linear-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Parties</h3>
          </div>
          <div className="text-sm text-gray-600">
            {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
          </div>
        </div>
        {filteredItems.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No parties yet. Click "Add Party" to create one.
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((p) => (
                  <tr key={p.party_id} className="hover:bg-purple-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            p.isActive ? "bg-purple-100" : "bg-gray-100"
                          }`}
                        >
                          <Database
                            className={`w-5 h-5 ${
                              p.isActive ? "text-purple-600" : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {p.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {p.party_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {p.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {p.typeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggle(p.party_id, !p.isActive)}
                        className="flex items-center gap-2"
                      >
                        {p.isActive ? (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      <div>{new Date(p.created_at).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(p.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setViewing(p)}
                          className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50"
                          aria-label={`View ${p.name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(p)}
                          className="text-purple-600 hover:text-purple-900 p-2 rounded-full hover:bg-purple-50"
                          aria-label={`Edit ${p.name}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.party_id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50"
                          aria-label={`Delete ${p.name}`}
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

      {viewing && <Details data={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
};

export default PartyMasterPage;
