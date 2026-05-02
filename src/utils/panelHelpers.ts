import type { StateAssignment } from "../types/api";

/**
 * Determines if a level assignment is an after-assembly level
 * (i.e., has afterAssemblyData_id and is not a standard fixed level)
 */
export function isAfterAssemblyLevel(assignment: StateAssignment): boolean {
    return Boolean(assignment.afterAssemblyData_id);
}

/**
 * Determines if a level is the first level after Assembly
 * (parent is Assembly)
 */
export function isFirstAfterAssemblyLevel(assignment: StateAssignment): boolean {
    return (
        isAfterAssemblyLevel(assignment) &&
        assignment.parentLevelType?.toLowerCase() === "assembly"
    );
}

/**
 * Determines if a level is a sub-level (deeper than first after-assembly)
 * (parent is not Assembly, State, or District)
 */
export function isSubLevel(assignment: StateAssignment): boolean {
    if (!isAfterAssemblyLevel(assignment)) return false;

    const parentType = assignment.parentLevelType?.toLowerCase();
    return (
        parentType !== "assembly" &&
        parentType !== "state" &&
        parentType !== "district"
    );
}

/**
 * Gets the appropriate panel route for a level assignment
 */
export function getPanelRoute(assignment: StateAssignment): string {
    if (isFirstAfterAssemblyLevel(assignment)) {
        return `/afterassembly/${assignment.afterAssemblyData_id}`;
    }

    if (isSubLevel(assignment)) {
        return `/sublevel/${assignment.afterAssemblyData_id}`;
    }

    // Standard fixed levels
    const levelType = assignment.levelType.toLowerCase();
    return `/${levelType}`;
}

/**
 * Gets a display-friendly icon for a level type
 */
export function getLevelIcon(levelType: string): string {
    const icons: Record<string, string> = {
        state: "🏛️",
        district: "🏙️",
        assembly: "🏢",
        block: "🏘️",
        mandal: "🏪",
        booth: "📍",
        pollingcenter: "🗳️",
        ward: "🏘️",
        zone: "🌐",
        sector: "📊",
        unit: "🏬",
        region: "🗺️",
        area: "📍",
        center: "🎯",
    };

    return icons[levelType.toLowerCase()] || "📌";
}

/**
 * Groups state assignments by type (fixed vs dynamic)
 */
export function groupAssignments(assignments: StateAssignment[]) {
    const fixed: StateAssignment[] = [];
    const afterAssembly: StateAssignment[] = [];
    const subLevels: StateAssignment[] = [];

    assignments.forEach((assignment) => {
        if (isFirstAfterAssemblyLevel(assignment)) {
            afterAssembly.push(assignment);
        } else if (isSubLevel(assignment)) {
            subLevels.push(assignment);
        } else {
            fixed.push(assignment);
        }
    });

    return { fixed, afterAssembly, subLevels };
}

/**
 * Gets a user-friendly display name for a level
 */
export function getLevelDisplayName(assignment: StateAssignment): string {
    return assignment.displayName || assignment.levelName;
}

/**
 * Hierarchy order for dynamic levels (after Assembly).
 * Lower index = higher in hierarchy = shown first.
 */
const DYNAMIC_LEVEL_ORDER: Record<string, number> = {
  block: 1,
  mandal: 2,
  locality: 3,
  pollingcenter: 4,
  sector: 5,
  zone: 6,
  ward: 7,
  booth: 8,
};

function sortDynamicLevelTypes(types: string[]): string[] {
  return [...types].sort((a, b) => {
    const aOrder = DYNAMIC_LEVEL_ORDER[a.toLowerCase()] ?? 99;
    const bOrder = DYNAMIC_LEVEL_ORDER[b.toLowerCase()] ?? 99;
    return aOrder - bOrder;
  });
}

/**
 * Gets all dynamic level assignments from permissions (everything after Assembly)
 * Uses accessibleLevelsByType as primary source (direct map of levelType -> assignments)
 */
export function getAllDynamicLevelAssignments(permissions: any): StateAssignment[] {
  if (!permissions) return [];

  const assignments: StateAssignment[] = [];

  // Primary: use accessibleLevelsByType if available (e.g., { Booth: [...], Locality: [...] })
  if (permissions.accessibleLevelsByType && typeof permissions.accessibleLevelsByType === 'object') {
    Object.entries(permissions.accessibleLevelsByType).forEach(([levelType, items]) => {
      if (!Array.isArray(items) || items.length === 0) return;
      items.forEach((item: any) => {
        assignments.push({
          assignment_id: item.assignment_id,
          stateMasterData_id: item.afterAssemblyData_id || item.level_id || 0,
          afterAssemblyData_id: item.afterAssemblyData_id,
          levelName: item.levelName || levelType,
          levelType: item.levelName || levelType,
          displayName: item.displayName || item.levelName || levelType,
          level_id: item.level_id,
          parentId: item.parentId ?? null,
          parentLevelName: item.parentLevelName || null,
          parentLevelType: item.parentLevelType || (item.parentId == null ? 'Assembly' : null),
          parentAssemblyId: item.parentAssemblyId,
          assemblyName: item.assemblyName,
          assemblyType: item.assemblyType,
          partyLevelName: item.partyLevelName,
          partyLevelDisplayName: item.partyLevelDisplayName,
          partyLevelId: item.partyLevelId,
          assignment_active: item.assignment_active,
          assigned_at: item.assigned_at,
        });
      });
    });
    return assignments;
  }

  // Fallback: legacy accessible* pattern
  const fixedLevels = ['accessibleStates', 'accessibleDistricts', 'accessibleAssemblies'];
  const specialCases = ['accessibleBooths'];

  Object.keys(permissions).forEach(key => {
    if (key.startsWith('accessible') &&
        !fixedLevels.includes(key) &&
        !specialCases.includes(key) &&
        Array.isArray(permissions[key]) &&
        permissions[key].length > 0) {

      const levelType = key.replace('accessible', '').slice(0, -1);
      permissions[key].forEach((item: any) => {
        assignments.push({
          assignment_id: item.assignment_id,
          stateMasterData_id: item.afterAssemblyData_id || 0,
          afterAssemblyData_id: item.afterAssemblyData_id,
          levelName: item.displayName || item.levelName || levelType,
          levelType: item.levelName || levelType,
          displayName: item.displayName || item.levelName,
          level_id: item.level_id,
          parentId: item.parentId,
          parentLevelName: item.parentLevelName || null,
          parentLevelType: item.parentLevelType || (item.parentId == null ? 'Assembly' : null),
          parentAssemblyId: item.parentAssemblyId,
          assemblyName: item.assemblyName,
        });
      });
    }
  });

  // Handle special case: Booths (legacy)
  if (permissions.accessibleBooths && permissions.accessibleBooths.length > 0) {
    permissions.accessibleBooths.forEach((booth: any) => {
      assignments.push({
        assignment_id: booth.booth_assignment_id,
        stateMasterData_id: booth.booth_assignment_id || 0,
        afterAssemblyData_id: booth.booth_assignment_id,
        levelName: booth.partyLevelName || 'Booth',
        levelType: booth.partyLevelName || 'Booth',
        displayName: `${booth.partyLevelDisplayName || 'Booth'} (${booth.boothFrom}-${booth.boothTo})`,
        level_id: booth.booth_assignment_id,
        parentId: booth.parentLevelId,
        parentLevelName: booth.parentLevelName || null,
        parentLevelType: booth.parentLevelType || null,
        parentAssemblyId: undefined,
        assemblyName: undefined,
      });
    });
  }

  return assignments;
}

/**
 * Gets all dynamic level types from permissions
 */
export function getAllDynamicLevelTypes(permissions: any): string[] {
  if (!permissions) return [];

  // Primary: use accessibleLevelsByType keys directly
  if (permissions.accessibleLevelsByType && typeof permissions.accessibleLevelsByType === 'object') {
    const types = Object.keys(permissions.accessibleLevelsByType).filter(
      (key) => Array.isArray(permissions.accessibleLevelsByType[key]) && permissions.accessibleLevelsByType[key].length > 0
    );
    return sortDynamicLevelTypes(types);
  }

  // Fallback: legacy accessible* pattern
  const levelTypes: string[] = [];
  const fixedLevels = ['accessibleStates', 'accessibleDistricts', 'accessibleAssemblies'];
  const specialCases = ['accessibleBooths'];

  Object.keys(permissions).forEach(key => {
    if (key.startsWith('accessible') &&
        !fixedLevels.includes(key) &&
        !specialCases.includes(key) &&
        Array.isArray(permissions[key]) &&
        permissions[key].length > 0) {
      const levelType = key.replace('accessible', '').slice(0, -1);
      levelTypes.push(levelType);
    }
  });

  if (permissions.accessibleBooths && permissions.accessibleBooths.length > 0) {
    levelTypes.push('Booth');
  }

  return sortDynamicLevelTypes(levelTypes);
}
