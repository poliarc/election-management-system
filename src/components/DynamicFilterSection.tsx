import React, { useState, useEffect, useCallback } from 'react';
import { dataAvailabilityService } from '../services/dataAvailabilityService';
import { hierarchyDependencyManager } from '../services/hierarchyDependencyManager';
import { AutoSelectionService } from '../services/autoSelectionService';
import type { 
  FilterOption, 
  FilterState, 
  DynamicFilterProps,
  HierarchyLevelType 
} from '../types/dynamicNavigation';

interface FilterOptions {
  blocks: FilterOption[];
  mandals: FilterOption[];
  pollingCenters: FilterOption[];
  booths: FilterOption[];
}

export const DynamicFilterSection: React.FC<DynamicFilterProps> = ({
  currentLevel,
  assemblyId,
  availableLevels,
  onFiltersChange,
  initialFilters = {},
  assemblyName = '',
  districtName = ''
}) => {
  const [filters, setFilters] = useState<FilterState>({
    assemblyId,
    blockId: initialFilters.blockId,
    mandalId: initialFilters.mandalId,
    pollingCenterId: initialFilters.pollingCenterId,
    searchTerm: initialFilters.searchTerm || '',
    selectedItemFilter: initialFilters.selectedItemFilter
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    blocks: [],
    mandals: [],
    pollingCenters: [],
    booths: []
  });

  const [loading, setLoading] = useState<Record<string, boolean>>({
    blocks: false,
    mandals: false,
    pollingCenters: false,
    booths: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({
    blocks: '',
    mandals: '',
    pollingCenters: '',
    booths: ''
  });

  const [autoSelectionStatus, setAutoSelectionStatus] = useState<Record<string, { 
    isAutoSelected: boolean; 
    reason: string; 
    timestamp: number 
  }>>({});

  // Queue for auto-selection requests to handle outside of render
  const [autoSelectionQueue, setAutoSelectionQueue] = useState<Array<{
    level: string;
    value: number;
    reason: 'single-option' | 'required-filter' | 'parent-change';
  }>>([]);

  // Synchronous version for immediate use
  const buildHierarchyPathSync = useCallback((availableLevels: any[], targetLevel: string): string[] => {
    // For booth level, make an educated guess based on available data
    if (targetLevel === 'booth') {
      const blockLevel = availableLevels.find(l => l.type === 'block');
      const mandalLevel = availableLevels.find(l => l.type === 'mandal');
      const pollingCenterLevel = availableLevels.find(l => l.type === 'pollingCenter');
      
      if (blockLevel?.hasData && mandalLevel?.hasData) {
        // Enhanced logic: Only include polling center if it's truly required and has real data
        if (pollingCenterLevel?.hasData && pollingCenterLevel.isRequired && 
            pollingCenterLevel.parentType === 'mandal') {
          // Polling center is required in hierarchy, so include it
          return ['assembly', 'block', 'mandal', 'pollingCenter', 'booth'];
        } else {
          // No polling center required or it's not a real polling center level, skip it
          return ['assembly', 'block', 'mandal', 'booth'];
        }
      }
    }
    
    // Default behavior for other cases - build path based on actual hierarchy relationships
    const levelOrder = ['block', 'mandal', 'pollingCenter', 'booth'];
    const targetIndex = levelOrder.indexOf(targetLevel);
    if (targetIndex === -1) return ['assembly'];
    
    const path = ['assembly'];
    for (let i = 0; i <= targetIndex; i++) {
      const levelType = levelOrder[i];
      const level = availableLevels.find(l => l.type === levelType);
      
      // Only include level if it has data AND is properly connected in hierarchy
      if (level && level.hasData) {
        // For polling center, do additional validation
        if (levelType === 'pollingCenter') {
          // Only include if it's truly required and not just misidentified booths
          if (level.isRequired && level.parentType === 'mandal') {
            path.push(levelType);
          }
          // Skip polling center if it's not properly configured
        } else {
          path.push(levelType);
        }
      }
    }
    
    return path;
  }, []);

  // Determine which filters to show based on current level and available levels
  const getVisibleFilters = useCallback(() => {
    const visibleFilters: string[] = [];
    
    // Always show assembly (read-only)
    visibleFilters.push('assembly');
    
    // Build hierarchy path based on available levels and current state
    const hierarchyPath = buildHierarchyPathSync(availableLevels, currentLevel);
    
    // Show navigation filters up to (but NOT including) current level
    hierarchyPath.forEach(levelType => {
      if (levelType !== 'assembly' && levelType !== currentLevel) {
        const level = availableLevels.find(l => l.type === levelType);
        if (level && level.hasData && level.isRequired) {
          visibleFilters.push(levelType);
        }
      }
    });
    
    return visibleFilters;
  }, [currentLevel, availableLevels, buildHierarchyPathSync]);

  // Get auto-selection strategy using the enhanced service
  const getAutoSelectionStrategy = useCallback((level: string, options: FilterOption[]) => {
    return AutoSelectionService.getAutoSelectionStrategy(level, options, availableLevels, currentLevel);
  }, [availableLevels, currentLevel]);

  // Enhanced logic to determine if we should auto-select the first option
  const shouldAutoSelectFirst = useCallback((level: string) => {
    const visibleFilters = getVisibleFilters();
    const levelIndex = visibleFilters.indexOf(level);
    
    // Auto-select if this is a required filter (not the last level in the current context)
    return levelIndex < visibleFilters.length - 1;
  }, [getVisibleFilters]);

  // Enhanced auto-selection logic with comprehensive rules
  const handleAutoSelection = useCallback((level: string, value: number, reason: 'single-option' | 'required-filter' | 'parent-change' = 'required-filter') => {
    // Use functional state update to avoid dependency on filters
    setFilters(currentFilters => {
      // Check if the value is already selected to prevent infinite loops
      const currentValue = level === 'blocks' ? currentFilters.blockId :
                          level === 'mandals' ? currentFilters.mandalId :
                          level === 'pollingCenters' ? currentFilters.pollingCenterId : null;
      
      if (currentValue === value) {
        return currentFilters; // No change needed, prevent loop
      }
      

      
      const newFilters = { ...currentFilters };
      
      switch (level) {
        case 'blocks':
          newFilters.blockId = value;
          // Clear dependent filters when parent changes
          newFilters.mandalId = undefined;
          newFilters.pollingCenterId = undefined;
          break;
        case 'mandals':
          newFilters.mandalId = value;
          // Clear dependent filters when parent changes
          newFilters.pollingCenterId = undefined;
          break;
        case 'pollingCenters':
          newFilters.pollingCenterId = value;
          break;
      }
      
      // Call onFiltersChange with new filters
      onFiltersChange(newFilters);
      
      // Trigger cascading auto-selection for child levels
      if (reason === 'parent-change' || reason === 'required-filter') {
        setTimeout(() => {
          triggerCascadingAutoSelection(level, value);
        }, 100); // Small delay to allow state update
      }
      
      return newFilters;
    });
    
    // Track auto-selection for UI feedback
    setAutoSelectionStatus(prev => ({
      ...prev,
      [level]: {
        isAutoSelected: true,
        reason: reason === 'single-option' ? 'Only option available' : 
                reason === 'parent-change' ? 'Parent selection changed' : 
                'Required filter auto-selected',
        timestamp: Date.now()
      }
    }));
    
    // Clear auto-selection status after 3 seconds
    setTimeout(() => {
      setAutoSelectionStatus(prev => ({
        ...prev,
        [level]: { ...prev[level], isAutoSelected: false }
      }));
    }, 3000);
  }, [onFiltersChange]);

  // Enhanced filter options loading with smart auto-selection
  const loadFilterOptions = useCallback(async (level: string, parentId?: number) => {
    if (!parentId && level !== 'blocks') return;
    
    setLoading(prev => ({ ...prev, [level]: true }));
    setErrors(prev => ({ ...prev, [level]: '' }));
    
    try {
      const options = await dataAvailabilityService.getFilterOptions(level, parentId || assemblyId);
      
      // Check if options have actually changed to prevent unnecessary updates
      setFilterOptions(prev => {
        const currentOptions = prev[level as keyof FilterOptions] || [];
        const optionsChanged = JSON.stringify(currentOptions) !== JSON.stringify(options);
        
        if (optionsChanged) {
          // Store auto-selection strategy for useEffect to handle
          const strategy = getAutoSelectionStrategy(level, options);
          
          if (strategy.shouldSelect && strategy.selectedValue) {
            // Store the auto-selection request for useEffect to handle
            setAutoSelectionQueue(prev => [...prev, {
              level,
              value: strategy.selectedValue!,
              reason: strategy.reason as any
            }]);
          }
        }
        
        return { ...prev, [level]: options };
      });
      
    } catch (error) {
      console.error(`Error loading ${level} options:`, error);
      const errorMessage = error instanceof Error ? error.message : `Failed to load ${level} data`;
      setErrors(prev => ({ ...prev, [level]: errorMessage }));
      setFilterOptions(prev => ({ ...prev, [level]: [] }));
    } finally {
      setLoading(prev => ({ ...prev, [level]: false }));
    }
  }, [assemblyId, getAutoSelectionStrategy, handleAutoSelection]);

  // Trigger cascading auto-selection for child levels
  const triggerCascadingAutoSelection = useCallback(async (parentLevel: string, parentValue: number) => {
    const levelMapping = {
      'blocks': 'mandals',
      'mandals': 'pollingCenters',
      'pollingCenters': 'booths'
    };
    
    const childLevel = levelMapping[parentLevel as keyof typeof levelMapping];
    
    if (childLevel) {
      const visibleFilters = getVisibleFilters();
      const childLevelSingular = childLevel.slice(0, -1); // Remove 's' to get singular form
      
      if (visibleFilters.includes(childLevelSingular)) {
        try {
          // Load options for the child level
          const childOptions = await dataAvailabilityService.getFilterOptions(childLevel, parentValue);
          
          if (childOptions.length === 1) {
            // Auto-select if only one option
            setAutoSelectionQueue(prev => [...prev, {
              level: childLevel,
              value: childOptions[0].id,
              reason: 'single-option'
            }]);
          } else if (childOptions.length > 0 && shouldAutoSelectFirst(childLevelSingular)) {
            // Auto-select first option if it's a required filter
            setAutoSelectionQueue(prev => [...prev, {
              level: childLevel,
              value: childOptions[0].id,
              reason: 'parent-change'
            }]);
          }
        } catch (error) {
          console.error(`Error loading cascading options for ${childLevel}:`, error);
        }
      }
    }
  }, [getVisibleFilters, handleAutoSelection, shouldAutoSelectFirst]);



  // Debounced filter change handler for search
  const debouncedOnFiltersChange = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (newFilters: FilterState) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onFiltersChange(newFilters);
        }, 300); // 300ms debounce for search
      };
    })(),
    [onFiltersChange]
  );

  // Clear dependent filters when parent changes
  const clearDependentFilters = useCallback((changedLevel: HierarchyLevelType, newFilters: FilterState) => {
    const clearedFilters = hierarchyDependencyManager.clearDependentFilters(changedLevel, newFilters);
    
    // Clear filter options for dependent levels
    const dependentLevels = hierarchyDependencyManager.getDependentLevels(changedLevel, availableLevels);
    setFilterOptions(prev => {
      const newOptions = { ...prev };
      dependentLevels.forEach(level => {
        const optionKey = `${level}s` as keyof FilterOptions;
        if (optionKey in newOptions) {
          newOptions[optionKey] = [];
        }
      });
      return newOptions;
    });
    
    return clearedFilters;
  }, [availableLevels]);

  // Check if a filter should be disabled based on parent selection
  const isFilterDisabled = useCallback((level: string) => {
    const levelType = level as HierarchyLevelType;
    return !hierarchyDependencyManager.isFilterEnabled(levelType, filters, availableLevels);
  }, [filters, availableLevels]);

  // Get validation errors for current filter state
  const getValidationErrors = useCallback(() => {
    return hierarchyDependencyManager.validateFilterDependencies(filters, availableLevels);
  }, [filters, availableLevels]);

  // Handle filter changes with enhanced dependency management
  const handleFilterChange = useCallback((level: string, value: string | number) => {
    let newFilters = { ...filters };
    
    switch (level) {
      case 'block':
        newFilters.blockId = value === '' ? undefined : Number(value);
        newFilters = clearDependentFilters('block', newFilters);
        break;
      case 'mandal':
        newFilters.mandalId = value === '' ? undefined : Number(value);
        newFilters = clearDependentFilters('mandal', newFilters);
        break;
      case 'pollingCenter':
        newFilters.pollingCenterId = value === '' ? undefined : Number(value);
        newFilters = clearDependentFilters('pollingCenter', newFilters);
        break;
      case 'search':
        newFilters.searchTerm = String(value);
        setFilters(newFilters);
        // Use debounced handler for search
        debouncedOnFiltersChange(newFilters);
        return; // Early return to avoid calling onFiltersChange immediately
      case 'itemFilter':
        newFilters.selectedItemFilter = String(value);
        break;
    }
    
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange, debouncedOnFiltersChange, clearDependentFilters]);

  // Load initial data and handle cascading loads
  useEffect(() => {
    const visibleFilters = getVisibleFilters();
    
    // Load blocks if visible
    if (visibleFilters.includes('block')) {
      loadFilterOptions('blocks');
    }
  }, [getVisibleFilters, loadFilterOptions]);

  // Handle cascading filter loads
  useEffect(() => {
    const visibleFilters = getVisibleFilters();
    
    // Load mandals when block is selected
    if (visibleFilters.includes('mandal') && filters.blockId) {
      loadFilterOptions('mandals', filters.blockId);
    }
    
    // Load polling centers when mandal is selected
    if (visibleFilters.includes('pollingCenter') && filters.mandalId) {
      loadFilterOptions('pollingCenters', filters.mandalId);
    }
    
    // Load booths when polling center is selected OR when mandal is selected (if no polling centers)
    if (visibleFilters.includes('booth')) {
      if (filters.pollingCenterId) {
        // Load booths from polling center
        loadFilterOptions('booths', filters.pollingCenterId);
      } else if (filters.mandalId) {
        // Check if polling center level exists and is required
        const pollingCenterLevel = availableLevels.find(l => l.type === 'pollingCenter');
        const hasRequiredPollingCenter = pollingCenterLevel && pollingCenterLevel.isRequired;
        
        if (!hasRequiredPollingCenter) {
          // Load booths directly from mandal (when no polling centers exist or not required)
          loadFilterOptions('booths', filters.mandalId);
        }
      }
    }
  }, [filters.blockId, filters.mandalId, filters.pollingCenterId, availableLevels, getVisibleFilters, loadFilterOptions]);

  // Load current level options for "Filter by X" dropdown
  useEffect(() => {
    const currentLevelPlural = `${currentLevel}s`;
    
    // Determine the parent ID for loading current level options
    let parentId: number | undefined;
    
    switch (currentLevel) {
      case 'block':
        // Blocks are loaded from assembly
        parentId = assemblyId;
        break;
      case 'mandal':
        // Mandals are loaded from selected block
        parentId = filters.blockId;
        break;
      case 'pollingCenter':
        // Polling centers are loaded from selected mandal
        parentId = filters.mandalId;
        break;
      case 'booth':
        // Booths are loaded from polling center or mandal
        const pollingCenterLevel = availableLevels.find(l => l.type === 'pollingCenter');
        const hasRequiredPollingCenter = pollingCenterLevel && pollingCenterLevel.isRequired;
        
        if (hasRequiredPollingCenter && filters.pollingCenterId) {
          parentId = filters.pollingCenterId;
        } else if (filters.mandalId) {
          parentId = filters.mandalId;
        }
        break;
    }
    
    // Load options if we have a parent ID or if it's blocks (which use assemblyId)
    if (parentId || currentLevel === 'block') {
      loadFilterOptions(currentLevelPlural, parentId || assemblyId);
    }
  }, [currentLevel, assemblyId, filters.blockId, filters.mandalId, filters.pollingCenterId, availableLevels, loadFilterOptions]);

  // Process auto-selection queue outside of render cycle
  useEffect(() => {
    if (autoSelectionQueue.length > 0) {
      const nextSelection = autoSelectionQueue[0];
      setAutoSelectionQueue(prev => prev.slice(1));
      handleAutoSelection(nextSelection.level, nextSelection.value, nextSelection.reason);
    }
  }, [autoSelectionQueue, handleAutoSelection]);

  const visibleFilters = getVisibleFilters();
  const currentLevelOptions = filterOptions[`${currentLevel}s` as keyof FilterOptions] || [];

  return (
    <div className="bg-white rounded-xl shadow-md p-3 mb-1">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* District (if available) */}
        {districtName && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              District
            </label>
            <input
              type="text"
              value={districtName}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>
        )}

        {/* Assembly (always visible, read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assembly
          </label>
          <input
            type="text"
            value={assemblyName}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>

        {/* Block Filter */}
        {visibleFilters.includes('block') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Block {currentLevel !== 'block' && <span className="text-red-500">*</span>}
            </label>
            <select
              value={filters.blockId || ''}
              onChange={(e) => handleFilterChange('block', e.target.value)}
              disabled={loading.blocks || isFilterDisabled('block')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {filterOptions.blocks.length === 0 ? (
                <option value="">No blocks available</option>
              ) : (
                <>
                  <option value="">Select a Block</option>
                  {filterOptions.blocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.displayName}
                    </option>
                  ))}
                </>
              )}
            </select>
            {isFilterDisabled('block') && (
              <p className="mt-1 text-xs text-gray-500">
                Please select a parent level first
              </p>
            )}
            {autoSelectionStatus.blocks?.isAutoSelected && (
              <div className="mt-1 flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Auto-selected: {autoSelectionStatus.blocks.reason}
              </div>
            )}
          </div>
        )}

        {/* Mandal Filter */}
        {visibleFilters.includes('mandal') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Mandal {currentLevel !== 'mandal' && <span className="text-red-500">*</span>}
            </label>
            <select
              value={filters.mandalId || ''}
              onChange={(e) => handleFilterChange('mandal', e.target.value)}
              disabled={loading.mandals || isFilterDisabled('mandal')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {filterOptions.mandals.length === 0 ? (
                <option value="">No mandals available</option>
              ) : (
                <>
                  <option value="">Select a Mandal</option>
                  {filterOptions.mandals.map((mandal) => (
                    <option key={mandal.id} value={mandal.id}>
                      {mandal.displayName}
                    </option>
                  ))}
                </>
              )}
            </select>
            {isFilterDisabled('mandal') && (
              <p className="mt-1 text-xs text-gray-500">
                Please select a Block first
              </p>
            )}
            {autoSelectionStatus.mandals?.isAutoSelected && (
              <div className="mt-1 flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Auto-selected: {autoSelectionStatus.mandals.reason}
              </div>
            )}
          </div>
        )}

        {/* Polling Center Filter */}
        {visibleFilters.includes('pollingCenter') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Polling Center {currentLevel !== 'pollingCenter' && <span className="text-red-500">*</span>}
            </label>
            <select
              value={filters.pollingCenterId || ''}
              onChange={(e) => handleFilterChange('pollingCenter', e.target.value)}
              disabled={loading.pollingCenters || isFilterDisabled('pollingCenter')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {filterOptions.pollingCenters.length === 0 ? (
                <option value="">No polling centers available</option>
              ) : (
                <>
                  <option value="">Select a Polling Center</option>
                  {filterOptions.pollingCenters.map((pc) => (
                    <option key={pc.id} value={pc.id}>
                      {pc.displayName}
                    </option>
                  ))}
                </>
              )}
            </select>
            {isFilterDisabled('pollingCenter') && (
              <p className="mt-1 text-xs text-gray-500">
                Please select a Mandal first
              </p>
            )}
            {autoSelectionStatus.pollingCenters?.isAutoSelected && (
              <div className="mt-1 flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Auto-selected: {autoSelectionStatus.pollingCenters.reason}
              </div>
            )}
          </div>
        )}

        {/* Current Level Item Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by {currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)}
          </label>
          <select
            value={filters.selectedItemFilter}
            onChange={(e) => handleFilterChange('itemFilter', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All {currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)}s</option>
            {currentLevelOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search {currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)}s
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={`Search by ${currentLevel} name...`}
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Validation errors */}
      {(() => {
        const validation = getValidationErrors();
        return validation.errors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">Filter Dependency Errors:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Validation warnings */}
      {(() => {
        const validation = getValidationErrors();
        return validation.warnings.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800 mb-1">Suggestions:</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>• {warning.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Error messages */}
      {Object.entries(errors).map(([level, error]) => 
        error && (
          <div key={level} className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">
                Error loading {level}: {error}
              </p>
            </div>
          </div>
        )
      )}

      {/* No data message */}
      {!loading.blocks && !errors.blocks && filterOptions.blocks.length === 0 && visibleFilters.includes('block') && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-yellow-800">
              No data available for the selected hierarchy level. Please check if data exists for this assembly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};