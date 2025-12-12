// Core hierarchy types
export type HierarchyLevelType = 'block' | 'mandal' | 'pollingCenter' | 'booth';

export interface HierarchyLevelData {
  count: number;
  hasData: boolean;
  hasDirectChildren: boolean;
  parentLevel?: string;
}

export interface HierarchyDataStatus {
  assemblyId: number;
  availableLevels: {
    blocks: HierarchyLevelData;
    mandals: HierarchyLevelData;
    pollingCenters: HierarchyLevelData;
    booths: HierarchyLevelData;
  };
  hierarchyStructure: HierarchyRelationship[];
}

export interface HierarchyRelationship {
  parentType: string;
  childType: string;
  isActive: boolean;
}

// Navigation types
export interface NavigationVisibility {
  showBlocks: boolean;
  showMandals: boolean;
  showPollingCenters: boolean;
  showBooths: boolean;
}

export interface NavigationConfig {
  id: string;
  label: string;
  route: string;
  requiredData: 'blocks' | 'mandals' | 'pollingCenters' | 'booths';
  isVisible: boolean;
}

// Filter types
export interface FilterOption {
  id: number;
  displayName: string;
  levelName: string;
  parentId?: number;
}

export interface FilterState {
  assemblyId: number;
  blockId?: number;
  mandalId?: number;
  pollingCenterId?: number;
  searchTerm: string;
  selectedItemFilter?: string;
}

export interface HierarchyLevel {
  type: HierarchyLevelType;
  hasData: boolean;
  isRequired: boolean;
  parentType?: string;
}

export interface FilterConfig {
  level: HierarchyLevelType;
  requiredFilters: FilterType[];
  optionalFilters: FilterType[];
  autoSelectFirst: boolean;
}

export type FilterType = 'assembly' | 'block' | 'mandal' | 'pollingCenter' | 'search';

// Data cache types
export interface DataCache {
  assemblyId: number;
  lastUpdated: Date;
  hierarchyData: HierarchyDataStatus;
  filterOptions: Record<string, FilterOption[]>;
}

// Component prop types
export interface DynamicFilterProps {
  currentLevel: HierarchyLevelType;
  assemblyId: number;
  availableLevels: HierarchyLevel[];
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
  assemblyName?: string;
  districtName?: string;
}

// Service types
export interface DataAvailabilityServiceInterface {
  checkHierarchyData(assemblyId: number): Promise<HierarchyDataStatus>;
  getFilterOptions(level: string, parentId?: number): Promise<FilterOption[]>;
  subscribeToDataUpdates(callback: (status: HierarchyDataStatus) => void): () => void;
  getNavigationVisibility(hierarchyData: HierarchyDataStatus): NavigationVisibility;
  clearCache(assemblyId?: number): void;
  startMonitoring(assemblyIds: number[]): void;
  stopMonitoring(): void;
  refreshData(assemblyId: number): Promise<HierarchyDataStatus>;
  isCurrentlyMonitoring(): boolean;
}

export interface NavigationVisibilityManagerInterface {
  initialize(assemblyIds?: number[]): void;
  checkDataAvailability(assemblyId: number): Promise<NavigationVisibility>;
  getCurrentVisibility(): NavigationVisibility;
  getNavigationConfig(): NavigationConfig[];
  subscribeToVisibilityChanges(callback: (visibility: NavigationVisibility) => void): () => void;
  updateNavigationItems(visibility: NavigationVisibility): void;
  hasVisibleItems(): boolean;
  getVisibleItemsCount(): number;
  refreshAssemblyData(assemblyId: number): Promise<void>;
  destroy(): void;
}

// Error types
export interface NavigationError {
  code: string;
  message: string;
  level?: HierarchyLevelType;
  assemblyId?: number;
}

export interface LoadingState {
  isLoading: boolean;
  level?: HierarchyLevelType;
  operation?: 'fetch' | 'refresh' | 'monitor';
}

// Event types
export interface DataChangeEvent {
  assemblyId: number;
  changedLevels: HierarchyLevelType[];
  oldData: HierarchyDataStatus;
  newData: HierarchyDataStatus;
}

export interface NavigationChangeEvent {
  assemblyId: number;
  oldVisibility: NavigationVisibility;
  newVisibility: NavigationVisibility;
  changedItems: string[];
}

// Utility types
export type RequiredFilterLevels<T extends HierarchyLevelType> = 
  T extends 'block' ? ['assembly'] :
  T extends 'mandal' ? ['assembly', 'block'] :
  T extends 'pollingCenter' ? ['assembly', 'block', 'mandal'] :
  T extends 'booth' ? ['assembly', 'block', 'mandal', 'pollingCenter'] :
  never;

export type OptionalFilterLevels<T extends HierarchyLevelType> = 
  T extends 'block' ? ['block'] :
  T extends 'mandal' ? ['mandal'] :
  T extends 'pollingCenter' ? ['pollingCenter'] :
  T extends 'booth' ? ['booth'] :
  never;

// API response types
export interface HierarchyApiResponse {
  success: boolean;
  message: string;
  data: HierarchyDataStatus;
}

export interface FilterOptionsApiResponse {
  success: boolean;
  message: string;
  data: FilterOption[];
}

// Hook types
export interface UseNavigationVisibilityResult {
  visibility: NavigationVisibility;
  isLoading: boolean;
  error: NavigationError | null;
  refresh: () => Promise<void>;
}

export interface UseDynamicFiltersResult {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  availableLevels: HierarchyLevel[];
  isLoading: boolean;
  error: NavigationError | null;
}

// Constants
export const HIERARCHY_LEVEL_ORDER: HierarchyLevelType[] = ['block', 'mandal', 'pollingCenter', 'booth'];

export const DEFAULT_FILTER_STATE: FilterState = {
  assemblyId: 0,
  searchTerm: ''
};

export const DEFAULT_NAVIGATION_VISIBILITY: NavigationVisibility = {
  showBlocks: false,
  showMandals: false,
  showPollingCenters: false,
  showBooths: false
};

// Hierarchy utility functions
export function getHierarchyOrder(): HierarchyLevelType[] {
  return HIERARCHY_LEVEL_ORDER;
}

export function getParentLevel(level: HierarchyLevelType): HierarchyLevelType | null {
  const order = getHierarchyOrder();
  const index = order.indexOf(level);
  return index > 0 ? order[index - 1] : null;
}

export function getChildLevels(level: HierarchyLevelType): HierarchyLevelType[] {
  const order = getHierarchyOrder();
  const index = order.indexOf(level);
  return index >= 0 ? order.slice(index + 1) : [];
}

export function validateHierarchyDependency(
  parentLevel: HierarchyLevelType,
  childLevel: HierarchyLevelType
): boolean {
  const order = getHierarchyOrder();
  const parentIndex = order.indexOf(parentLevel);
  const childIndex = order.indexOf(childLevel);
  
  return parentIndex >= 0 && childIndex >= 0 && parentIndex < childIndex;
}

// Type guards
export function isHierarchyLevelType(value: string): value is HierarchyLevelType {
  return ['block', 'mandal', 'pollingCenter', 'booth'].includes(value);
}

export function isValidFilterState(value: any): value is FilterState {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.assemblyId === 'number' &&
    typeof value.searchTerm === 'string' &&
    (value.selectedItemFilter === undefined || typeof value.selectedItemFilter === 'string')
  );
}

export function isNavigationVisibility(value: any): value is NavigationVisibility {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.showBlocks === 'boolean' &&
    typeof value.showMandals === 'boolean' &&
    typeof value.showPollingCenters === 'boolean' &&
    typeof value.showBooths === 'boolean'
  );
}