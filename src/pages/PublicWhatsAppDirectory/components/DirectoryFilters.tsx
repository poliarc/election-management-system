import type { FC } from "react";
import { Search, X, Filter, RotateCcw, Building2, Landmark, MapPin } from "lucide-react";
import type { StateMasterData } from "../../../store/api/stateMasterApi";

interface DirectoryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedLevel: string;
  onLevelChange: (level: string) => void;
  selectedStateId: number | "";
  onStateChange: (stateId: number | "") => void;
  selectedDistrictId: number | "";
  onDistrictChange: (districtId: number | "") => void;
  selectedAssemblyId: number | "";
  onAssemblyChange: (assemblyId: number | "") => void;
  states: StateMasterData[];
  districts: StateMasterData[];
  assemblies: StateMasterData[];
  fixedStateName?: string | null;
  defaultDistrictId?: number | null;
  defaultAssemblyId?: number | null;
  onReset: () => void;
}

export const DirectoryFilters: FC<DirectoryFiltersProps> = ({
  search,
  onSearchChange,
  selectedLevel,
  onLevelChange,
  selectedStateId,
  onStateChange,
  selectedDistrictId,
  onDistrictChange,
  selectedAssemblyId,
  onAssemblyChange,
  states,
  districts,
  assemblies,
  fixedStateName,
  defaultDistrictId,
  defaultAssemblyId,
  onReset,
}) => {
  const hasActiveFilters =
    Boolean(search) ||
    selectedLevel !== "All" ||
    Boolean(selectedDistrictId) ||
    Boolean(selectedAssemblyId);

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-4 sm:p-6 shadow-sm space-y-4">
      {/* Search Bar & Reset */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search groups by name or location..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-color)] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--text-color)] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Level Filter Chips */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Filter by Level:
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: "All", label: "All Levels", color: "bg-indigo-600 text-white" },
            { id: "State", label: "State Level", color: "bg-emerald-600 text-white" },
            { id: "District", label: "District Level", color: "bg-blue-600 text-white" },
            { id: "Assembly", label: "Assembly Level", color: "bg-purple-600 text-white" },
          ].map((level) => {
            const isSelected = selectedLevel === level.id;
            return (
              <button
                key={level.id}
                onClick={() => onLevelChange(level.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? `${level.color} shadow-sm`
                    : "bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-color)] border border-[var(--border-color)]"
                }`}
              >
                {level.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cascading Location Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--border-color)]">
        {/* State Select / Fixed Badge */}
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
            {fixedStateName ? "State (Fixed Scope)" : "State"}
          </label>
          {fixedStateName ? (
            <div className="flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-xs font-semibold text-[var(--text-color)]">
              <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">{fixedStateName}</span>
              <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                Fixed
              </span>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <select
                value={selectedStateId}
                onChange={(e) => onStateChange(e.target.value ? Number(e.target.value) : "")}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-xs text-[var(--text-color)] focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">All States</option>
                {states.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.levelName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* District Select */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
              District
            </label>
            {defaultDistrictId && selectedDistrictId !== defaultDistrictId && (
              <button
                type="button"
                onClick={() => onDistrictChange(defaultDistrictId)}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Reset to Coordinator
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <select
              value={selectedDistrictId}
              onChange={(e) => onDistrictChange(e.target.value ? Number(e.target.value) : "")}
              disabled={selectedLevel === "State"}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-xs text-[var(--text-color)] focus:outline-none focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <option value="">{fixedStateName ? `All Districts in ${fixedStateName}` : "All Districts"}</option>
              {districts.map((dst) => (
                <option key={dst.id} value={dst.id}>
                  {dst.levelName} {defaultDistrictId === dst.id ? "★ (Assigned)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assembly Select */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)]">
              Assembly Constituency (AC)
            </label>
            {defaultAssemblyId && selectedAssemblyId !== defaultAssemblyId && (
              <button
                type="button"
                onClick={() => onAssemblyChange(defaultAssemblyId)}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Reset to Coordinator
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
              <Landmark className="h-3.5 w-3.5" />
            </div>
            <select
              value={selectedAssemblyId}
              onChange={(e) => onAssemblyChange(e.target.value ? Number(e.target.value) : "")}
              disabled={selectedLevel === "State" || selectedLevel === "District" || !selectedDistrictId}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-xs text-[var(--text-color)] focus:outline-none focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <option value="">
                {!selectedDistrictId
                  ? "Select District first"
                  : "All Assemblies in District"}
              </option>
              {assemblies.map((asm) => (
                <option key={asm.id} value={asm.id}>
                  {asm.levelName} {defaultAssemblyId === asm.id ? "★ (Assigned)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
