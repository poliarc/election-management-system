import React, { useState, useEffect } from "react";
import { Search, Filter, X, Users } from "lucide-react";
import type { RoleSearchParams } from "../../../types/role";
import { useTranslation } from "react-i18next";

interface RoleSearchFilterProps {
  searchParams: RoleSearchParams;
  onSearchChange: (params: RoleSearchParams) => void;
  totalResults: number;
}

export const RoleSearchFilter: React.FC<RoleSearchFilterProps> = ({
  searchParams,
  onSearchChange,
  totalResults,
}) => {
  const {t} = useTranslation();
  const [localSearch, setLocalSearch] = useState(searchParams.search || "");
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange({
        ...searchParams,
        search: localSearch,
        page: 1, // Reset to first page when searching
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleFilterChange = (key: keyof RoleSearchParams, value: any) => {
    onSearchChange({
      ...searchParams,
      [key]: value,
      page: 1, // Reset to first page when filtering
    });
  };

  const clearFilters = () => {
    setLocalSearch("");
    onSearchChange({
      page: 1,
      limit: searchParams.limit,
    });
    setShowFilters(false);
  };

  const hasActiveFilters = localSearch || searchParams.isActive !== undefined;

  return (
    <div className="bg-[var(--bg-card)] p-4 rounded-lg shadow-md mb-1">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] w-4 h-4" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by role name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "border-gray-300 text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5"
            }`}
          >
            <Filter className="w-4 h-4" />
            {t("RoleSearchFilter.Filters")}
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {[localSearch, searchParams.isActive].filter(Boolean).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-color)] transition-colors"
              title="Clear all filters"
            >
              <X className="w-4 h-4" />
              {t("RoleSearchFilter.Clear")}
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {t("RoleSearchFilter.Status")}
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
                <option value="">{t("RoleSearchFilter.All_Status")}</option>
                <option value="active">{t("RoleSearchFilter.Active")}</option>
                <option value="inactive">{t("RoleSearchFilter.Inactive")}</option>
              </select>
            </div>

            {/* Results per page */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {t("RoleSearchFilter.Results_per_page")}
              </label>
              <select
                value={searchParams.limit || 100}
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

            {/* Quick Actions */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {t("RoleSearchFilter.Quick_Actions")}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFilterChange("isActive", true)}
                  className="flex items-center gap-1 px-3 py-2 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  <Users className="w-3 h-3" />
                  {t("RoleSearchFilter.Active_Only")}
                </button>
                <button
                  onClick={() => handleFilterChange("isActive", false)}
                  className="flex items-center gap-1 px-3 py-2 text-xs bg-gray-100 text-[var(--text-secondary)] rounded-md hover:bg-[var(--text-color)]/5 transition-colors"
                >
                  <Users className="w-3 h-3" />
                  {t("RoleSearchFilter.Inactive_Only")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-secondary)]">
        <div>
          {totalResults > 0 ? (
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {t("RoleSearchFilter.Showing")} {totalResults} {t("RoleSearchFilter.role")}{totalResults !== 1 ? "s" : ""}
              {hasActiveFilters && " (filtered)"}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[var(--text-secondary)]">
              <Users className="w-4 h-4" />
              {t("RoleSearchFilter.No_roles_found")}
            </span>
          )}
        </div>

        {/* Quick Stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{t("RoleSearchFilter.Active")}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span>{t("RoleSearchFilter.Inactive")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};




