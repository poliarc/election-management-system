import type { FilterOption, FilterState, HierarchyLevel } from '../types/dynamicNavigation';

export interface AutoSelectionRule {
  condition: 'single-option' | 'required-filter' | 'parent-change' | 'no-options';
  action: 'select-first' | 'select-single' | 'show-message' | 'disable';
  message?: string;
}

export interface AutoSelectionResult {
  shouldSelect: boolean;
  selectedValue?: number;
  reason: string;
  message?: string;
}

export class AutoSelectionService {
  /**
   * Determine auto-selection strategy for a filter level
   */
  static getAutoSelectionStrategy(
    level: string,
    options: FilterOption[],
    availableLevels: HierarchyLevel[],
    currentLevel: string
  ): AutoSelectionResult {
    // No options available
    if (options.length === 0) {
      return {
        shouldSelect: false,
        reason: 'no-options',
        message: `No ${level} available for the current selection`
      };
    }

    // Single option available - always auto-select
    if (options.length === 1) {
      return {
        shouldSelect: true,
        selectedValue: options[0].id,
        reason: 'single-option',
        message: `Only one ${level.slice(0, -1)} available - auto-selected`
      };
    }

    // Multiple options - check if it's a required filter
    const isRequired = this.isRequiredFilter(level, availableLevels, currentLevel);
    
    if (isRequired) {
      return {
        shouldSelect: true,
        selectedValue: options[0].id,
        reason: 'required-filter',
        message: `Auto-selected first ${level.slice(0, -1)} (required filter)`
      };
    }

    // Optional filter with multiple options - don't auto-select
    return {
      shouldSelect: false,
      reason: 'optional-multiple',
      message: `Multiple ${level} available - please select manually`
    };
  }

  /**
   * Check if a filter level is required based on hierarchy
   */
  private static isRequiredFilter(
    level: string,
    _availableLevels: HierarchyLevel[],
    currentLevel: string
  ): boolean {
    const levelOrder = ['blocks', 'mandals', 'pollingCenters', 'booths'];
    const currentLevelIndex = levelOrder.indexOf(`${currentLevel}s`);
    const filterLevelIndex = levelOrder.indexOf(level);
    
    // A filter is required if it comes before the current level in the hierarchy
    return filterLevelIndex < currentLevelIndex;
  }

  /**
   * Get cascading auto-selection for child levels
   */
  static getCascadingSelections(
    parentLevel: string,
    _parentValue: number,
    _availableLevels: HierarchyLevel[]
  ): string[] {
    const levelMapping = {
      'blocks': 'mandals',
      'mandals': 'pollingCenters',
      'pollingCenters': 'booths'
    };

    const childLevel = levelMapping[parentLevel as keyof typeof levelMapping];
    const cascadingLevels: string[] = [];

    if (childLevel) {
      const childLevelType = childLevel.slice(0, -1) as any;
      const hasChildLevel = _availableLevels.some((level: HierarchyLevel) => level.type === childLevelType);
      
      if (hasChildLevel) {
        cascadingLevels.push(childLevel);
        
        // Recursively check for further cascading
        const furtherCascading = this.getCascadingSelections(childLevel, _parentValue, _availableLevels);
        cascadingLevels.push(...furtherCascading);
      }
    }

    return cascadingLevels;
  }

  /**
   * Validate auto-selection rules
   */
  static validateAutoSelection(
    filters: FilterState,
    _availableLevels: HierarchyLevel[]
  ): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check if required parent selections are present
    if (filters.mandalId && !filters.blockId) {
      violations.push('Mandal selected without Block selection');
    }

    if (filters.pollingCenterId && !filters.mandalId) {
      violations.push('Polling Center selected without Mandal selection');
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  /**
   * Get user-friendly auto-selection message
   */
  static getAutoSelectionMessage(reason: string, level: string, count: number): string {
    const levelName = level.slice(0, -1); // Remove 's' to get singular form
    
    switch (reason) {
      case 'single-option':
        return `Auto-selected the only available ${levelName}`;
      case 'required-filter':
        return `Auto-selected first ${levelName} (required for navigation)`;
      case 'parent-change':
        return `Auto-selected first ${levelName} after parent selection changed`;
      case 'no-options':
        return `No ${level} available for current selection`;
      default:
        return `${count} ${level} available - please select one`;
    }
  }

  /**
   * Get auto-selection priority for multiple simultaneous selections
   */
  static getSelectionPriority(level: string): number {
    const priorities = {
      'blocks': 1,
      'mandals': 2,
      'pollingCenters': 3,
      'booths': 4
    };

    return priorities[level as keyof typeof priorities] || 999;
  }
}