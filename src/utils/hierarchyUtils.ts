import type { HierarchyLevel } from '../services/hierarchyDiscoveryService';

/**
 * Utility functions for hierarchy management and level detection
 */

export interface FilterChainState {
  assembly: HierarchyLevel | null;
  dynamicLevels: Map<string, HierarchyLevel | null>;
  availableLevelTypes: string[];
  isComplete: boolean;
  currentBooths: HierarchyLevel[];
}

/**
 * Creates an initial filter chain state
 */
export function createInitialFilterChainState(): FilterChainState {
  return {
    assembly: null,
    dynamicLevels: new Map(),
    availableLevelTypes: [],
    isComplete: false,
    currentBooths: []
  };
}

/**
 * Updates the filter chain state when a level is selected
 */
export function updateFilterChainState(
  currentState: FilterChainState,
  levelType: string,
  selectedLevel: HierarchyLevel | null,
  availableChildren: HierarchyLevel[] = []
): FilterChainState {
  const newState = { ...currentState };
  
  if (levelType === 'Assembly') {
    newState.assembly = selectedLevel;
    // Reset all dynamic levels when assembly changes
    newState.dynamicLevels.clear();
  } else {
    // Update the specific dynamic level
    newState.dynamicLevels.set(levelType, selectedLevel);
    
    // Clear subsequent levels in the chain
    const levelOrder = ['Block', 'Mandal', 'Polling Center', 'Booth'];
    const currentIndex = levelOrder.indexOf(levelType);
    if (currentIndex >= 0) {
      for (let i = currentIndex + 1; i < levelOrder.length; i++) {
        newState.dynamicLevels.delete(levelOrder[i]);
      }
    }
  }

  // Update available level types based on children
  newState.availableLevelTypes = getUniqueLevelTypes(availableChildren);
  
  // Check if chain is complete
  newState.isComplete = isFilterChainComplete(newState, availableChildren);
  
  // Update current booths if we've reached booth level
  newState.currentBooths = availableChildren.filter(child => 
    child.levelType === 'Booth' || isBoothLevel(child.levelName)
  );

  return newState;
}

/**
 * Gets unique level types from a list of hierarchy levels, sorted by priority
 */
export function getUniqueLevelTypes(levels: HierarchyLevel[]): string[] {
  const levelPriorities: Record<string, number> = {
    'Block': 1,
    'Mandal': 2,
    'Polling Center': 3,
    'Booth': 4
  };

  const uniqueTypes = [...new Set(levels.map(level => level.levelName))];
  
  return uniqueTypes.sort((a, b) => {
    const priorityA = levelPriorities[a] || 999;
    const priorityB = levelPriorities[b] || 999;
    return priorityA - priorityB;
  });
}

/**
 * Determines if the filter chain is complete (can display booths)
 */
export function isFilterChainComplete(
  state: FilterChainState,
  availableChildren: HierarchyLevel[]
): boolean {
  // If we have booths in available children, chain is complete
  if (availableChildren.some(child => child.levelType === 'Booth' || isBoothLevel(child.levelName))) {
    return true;
  }

  // If the last selected level is terminal and has booths, chain is complete
  const lastSelectedLevel = getLastSelectedLevel(state);
  if (lastSelectedLevel && isTerminalLevel(lastSelectedLevel.levelName) && lastSelectedLevel.hasDirectBooths) {
    return true;
  }

  return false;
}

/**
 * Gets the last selected level in the filter chain
 */
export function getLastSelectedLevel(state: FilterChainState): HierarchyLevel | null {
  // Check dynamic levels in reverse priority order
  const levelOrder = ['Booth', 'Polling Center', 'Mandal', 'Block'];
  
  for (const levelType of levelOrder) {
    const level = state.dynamicLevels.get(levelType);
    if (level) {
      return level;
    }
  }
  
  // Return assembly if no dynamic levels are selected
  return state.assembly;
}

/**
 * Determines if a level name represents a booth level
 */
export function isBoothLevel(levelName: string): boolean {
  const normalized = levelName.toLowerCase();
  return normalized.includes('booth') || 
         normalized.includes('polling station') ||
         normalized.includes('voting center');
}

/**
 * Determines if a level is terminal (can contain booths directly)
 */
export function isTerminalLevel(levelName: string): boolean {
  const terminalLevels = ['Mandal', 'Polling Center', 'Booth'];
  return terminalLevels.includes(levelName) || isBoothLevel(levelName);
}

/**
 * Gets the next level type that should be displayed based on available children
 */
export function getNextLevelType(
  currentState: FilterChainState,
  availableChildren: HierarchyLevel[]
): string | null {
  if (availableChildren.length === 0) {
    return null;
  }

  // Get unique level types from children
  const availableTypes = getUniqueLevelTypes(availableChildren);
  
  // Find the first type that isn't already selected
  for (const levelType of availableTypes) {
    if (levelType === 'Assembly') continue; // Skip assembly as it's handled separately
    
    if (!currentState.dynamicLevels.has(levelType) || !currentState.dynamicLevels.get(levelType)) {
      return levelType;
    }
  }

  return null;
}

/**
 * Validates that a hierarchy path is logical and consistent
 */
export function validateHierarchyPath(state: FilterChainState): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Assembly must be selected
  if (!state.assembly) {
    errors.push('Assembly must be selected');
  }

  // Check that parent-child relationships are maintained
  let currentParentId = state.assembly?.id;
  
  const levelOrder = ['Block', 'Mandal', 'Polling Center', 'Booth'];
  for (const levelType of levelOrder) {
    const level = state.dynamicLevels.get(levelType);
    if (level) {
      if (currentParentId && level.parentId !== currentParentId) {
        errors.push(`${levelType} parent relationship is invalid`);
      }
      currentParentId = level.id;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generates a human-readable path string from the current filter state
 */
export function generatePathString(state: FilterChainState): string {
  const pathParts: string[] = [];

  if (state.assembly) {
    pathParts.push(state.assembly.displayName);
  }

  const levelOrder = ['Block', 'Mandal', 'Polling Center', 'Booth'];
  for (const levelType of levelOrder) {
    const level = state.dynamicLevels.get(levelType);
    if (level) {
      pathParts.push(level.displayName);
    }
  }

  return pathParts.join(' → ');
}

/**
 * Determines if booth search should be enabled based on current state
 */
export function shouldEnableBoothSearch(state: FilterChainState): boolean {
  return state.isComplete && state.currentBooths.length > 0;
}

/**
 * Gets filter options for a specific level type
 */
export function getFilterOptionsForLevel(
  levelType: string,
  availableChildren: HierarchyLevel[]
): HierarchyLevel[] {
  return availableChildren
    .filter(child => child.levelName === levelType)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/**
 * Resets filter chain state to initial state while preserving assembly
 */
export function resetFilterChain(currentState: FilterChainState): FilterChainState {
  return {
    assembly: currentState.assembly,
    dynamicLevels: new Map(),
    availableLevelTypes: [],
    isComplete: false,
    currentBooths: []
  };
}