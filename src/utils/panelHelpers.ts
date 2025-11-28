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
 * Checks if user has any after-assembly level assignments
 */
export function hasAfterAssemblyAssignments(assignments: StateAssignment[]): boolean {
    return assignments.some(isAfterAssemblyLevel);
}
