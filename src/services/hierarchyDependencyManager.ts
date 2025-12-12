import type {
  HierarchyLevelType,
  FilterState,
  HierarchyLevel
} from '../types/dynamicNavigation';
import {
  getHierarchyOrder,
  getParentLevel,
  getChildLevels
} from '../types/dynamicNavigation';

export interface HierarchyDependencyManagerInterface {
  validateFilterDependencies(filters: FilterState, availableLevels: HierarchyLevel[]): ValidationResult;
  clearDependentFilters(changedLevel: HierarchyLevelType, currentFilters: FilterState): FilterState;
  isFilterEnabled(level: HierarchyLevelType, currentFilters: FilterState, availableLevels: HierarchyLevel[]): boolean;
  getRequiredParentSelections(level: HierarchyLevelType, availableLevels: HierarchyLevel[]): HierarchyLevelType[];
  getDependentLevels(level: HierarchyLevelType, availableLevels: HierarchyLevel[]): HierarchyLevelType[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  level: HierarchyLevelType;
  message: string;
  code: 'MISSING_PARENT' | 'INVALID_HIERARCHY' | 'CIRCULAR_DEPENDENCY';
}

export interface ValidationWarning {
  level: HierarchyLevelType;
  message: string;
  code: 'UNUSED_SELECTION' | 'INCOMPLETE_HIERARCHY';
}

class HierarchyDependencyManager implements HierarchyDependencyManagerInterface {
  /**
   * Validate that filter selections respect hierarchy dependencies
   */
  validateFilterDependencies(filters: FilterState, availableLevels: HierarchyLevel[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    const levelOrder = getHierarchyOrder();
    const availableLevelTypes = availableLevels.map(l => l.type);
    
    // Check each level in order
    for (const level of levelOrder) {
      if (!availableLevelTypes.includes(level)) continue;
      
      const hasSelection = this.hasSelectionForLevel(level, filters);
      const parentLevel = getParentLevel(level);
      
      if (hasSelection && parentLevel && availableLevelTypes.includes(parentLevel)) {
        const hasParentSelection = this.hasSelectionForLevel(parentLevel, filters);
        
        if (!hasParentSelection) {
          errors.push({
            level,
            message: `${level} selection requires ${parentLevel} to be selected first`,
            code: 'MISSING_PARENT'
          });
        }
      }
      
      // Check for unused selections (warnings) - only for truly required child levels
      if (hasSelection) {
        // Get child levels that are actually available, required, AND properly connected
        const allChildLevels = getChildLevels(level);
        const availableChildLevels = allChildLevels.filter(child => {
          const childLevel = availableLevels.find(l => l.type === child);
          // More strict validation: child must have data, be required, AND have correct parent
          return childLevel && 
                 childLevel.hasData && 
                 childLevel.isRequired && 
                 childLevel.parentType === level;
        });
        
        const hasAnyChildSelection = availableChildLevels.some(child => this.hasSelectionForLevel(child, filters));
        
        // Only warn if there are truly required child levels that aren't selected
        // AND we're not at the final level of the current page context
        if (availableChildLevels.length > 0 && !hasAnyChildSelection) {
          // Additional check: don't warn if this is the target level for the current page
          // This prevents warnings like "mandal selected but no polling center selected" 
          // when polling centers don't actually exist in this hierarchy
          const isTargetLevel = availableChildLevels.every(child => {
            const childLevel = availableLevels.find(l => l.type === child);
            return !childLevel || !childLevel.hasData || childLevel.parentType !== level;
          });
          
          if (!isTargetLevel) {
            warnings.push({
              level,
              message: `${level} is selected but no required child levels are selected`,
              code: 'INCOMPLETE_HIERARCHY'
            });
          }
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Clear all dependent filters when a parent level changes
   */
  clearDependentFilters(changedLevel: HierarchyLevelType, currentFilters: FilterState): FilterState {
    const newFilters = { ...currentFilters };
    const dependentLevels = getChildLevels(changedLevel);
    
    dependentLevels.forEach(level => {
      switch (level) {
        case 'block':
          newFilters.blockId = undefined;
          break;
        case 'mandal':
          newFilters.mandalId = undefined;
          break;
        case 'pollingCenter':
          newFilters.pollingCenterId = undefined;
          break;
        case 'booth':
          // Booth doesn't have a direct filter in FilterState
          break;
      }
    });
    
    return newFilters;
  }

  /**
   * Check if a filter should be enabled based on parent selections
   */
  isFilterEnabled(level: HierarchyLevelType, currentFilters: FilterState, availableLevels: HierarchyLevel[]): boolean {
    const availableLevelTypes = availableLevels.map(l => l.type);
    
    // If this level is not available, it's disabled
    if (!availableLevelTypes.includes(level)) {
      return false;
    }
    
    const parentLevel = getParentLevel(level);
    
    // If no parent level or parent level is not available, this level is enabled
    if (!parentLevel || !availableLevelTypes.includes(parentLevel)) {
      return true;
    }
    
    // Check if parent has a selection
    return this.hasSelectionForLevel(parentLevel, currentFilters);
  }

  /**
   * Get all parent levels that must be selected before this level can be used
   */
  getRequiredParentSelections(level: HierarchyLevelType, availableLevels: HierarchyLevel[]): HierarchyLevelType[] {
    const availableLevelTypes = availableLevels.map(l => l.type);
    const levelOrder = getHierarchyOrder();
    const levelIndex = levelOrder.indexOf(level);
    
    if (levelIndex <= 0) return [];
    
    const requiredParents: HierarchyLevelType[] = [];
    
    // Get all parent levels that are available
    for (let i = 0; i < levelIndex; i++) {
      const parentLevel = levelOrder[i];
      if (availableLevelTypes.includes(parentLevel)) {
        requiredParents.push(parentLevel);
      }
    }
    
    return requiredParents;
  }

  /**
   * Get all levels that depend on this level
   */
  getDependentLevels(level: HierarchyLevelType, availableLevels: HierarchyLevel[]): HierarchyLevelType[] {
    const availableLevelTypes = availableLevels.map(l => l.type);
    return getChildLevels(level).filter(child => availableLevelTypes.includes(child));
  }

  /**
   * Get the immediate parent level for a given level
   */
  getImmediateParent(level: HierarchyLevelType, availableLevels: HierarchyLevel[]): HierarchyLevelType | null {
    const availableLevelTypes = availableLevels.map(l => l.type);
    const levelOrder = getHierarchyOrder();
    const levelIndex = levelOrder.indexOf(level);
    
    // Look backwards for the first available parent level
    for (let i = levelIndex - 1; i >= 0; i--) {
      const parentLevel = levelOrder[i];
      if (availableLevelTypes.includes(parentLevel)) {
        return parentLevel;
      }
    }
    
    return null;
  }

  /**
   * Get the immediate child levels for a given level
   */
  getImmediateChildren(level: HierarchyLevelType, availableLevels: HierarchyLevel[]): HierarchyLevelType[] {
    const availableLevelTypes = availableLevels.map(l => l.type);
    const levelOrder = getHierarchyOrder();
    const levelIndex = levelOrder.indexOf(level);
    
    const immediateChildren: HierarchyLevelType[] = [];
    
    // Look forwards for available child levels
    for (let i = levelIndex + 1; i < levelOrder.length; i++) {
      const childLevel = levelOrder[i];
      if (availableLevelTypes.includes(childLevel)) {
        immediateChildren.push(childLevel);
      }
    }
    
    return immediateChildren;
  }

  /**
   * Check if filters form a valid hierarchy path
   */
  isValidHierarchyPath(filters: FilterState, availableLevels: HierarchyLevel[]): boolean {
    const validation = this.validateFilterDependencies(filters, availableLevels);
    return validation.isValid;
  }

  /**
   * Get suggested next level to select based on current selections
   */
  getSuggestedNextLevel(filters: FilterState, availableLevels: HierarchyLevel[]): HierarchyLevelType | null {
    const availableLevelTypes = availableLevels.map(l => l.type);
    const levelOrder = getHierarchyOrder();
    
    // Find the deepest selected level
    let deepestSelectedLevel: HierarchyLevelType | null = null;
    
    for (const level of levelOrder) {
      if (availableLevelTypes.includes(level) && this.hasSelectionForLevel(level, filters)) {
        deepestSelectedLevel = level;
      }
    }
    
    if (!deepestSelectedLevel) {
      // No selections yet, suggest the first available level
      return availableLevelTypes.find(level => levelOrder.includes(level)) || null;
    }
    
    // Suggest the next available level after the deepest selected one
    const currentIndex = levelOrder.indexOf(deepestSelectedLevel);
    for (let i = currentIndex + 1; i < levelOrder.length; i++) {
      const nextLevel = levelOrder[i];
      if (availableLevelTypes.includes(nextLevel)) {
        return nextLevel;
      }
    }
    
    return null; // All levels are selected or no more levels available
  }

  // Private helper methods

  private hasSelectionForLevel(level: HierarchyLevelType, filters: FilterState): boolean {
    switch (level) {
      case 'block':
        return !!filters.blockId;
      case 'mandal':
        return !!filters.mandalId;
      case 'pollingCenter':
        return !!filters.pollingCenterId;
      case 'booth':
        // Booth doesn't have a direct filter, but we can check if it's the target level
        return false;
      default:
        return false;
    }
  }
}

// Export singleton instance
export const hierarchyDependencyManager = new HierarchyDependencyManager();