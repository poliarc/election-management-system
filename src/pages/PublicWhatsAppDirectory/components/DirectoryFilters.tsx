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
        {/* State Select */}
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
            State
          </label>
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
        </div>

        {/* District Select */}
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
            District
          </label>
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
              <option value="">All Districts</option>
              {districts.map((dst) => (
                <option key={dst.id} value={dst.id}>
                  {dst.levelName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assembly Select */}
        <div>
          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
            Assembly Constituency (AC)
          </label>
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
                  : "All Assemblies"}
              </option>
              {assemblies.map((asm) => (
                <option key={asm.id} value={asm.id}>
                  {asm.levelName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
