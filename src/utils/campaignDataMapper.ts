/**
 * Utility functions for mapping campaign data based on user context and hierarchy
 *
 * This file demonstrates how to pick the correct data based on:
 * - stateMasterData_id for selected state for state_id
 * - partyId from user for party_id
 * - hierarchy data for district and assembly level campaigns
 */

interface UserData {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  contactNo: string;
  partyId: number;
  partyName: string;
  userType: string;
}

interface SelectedAssignment {
  assignment_id: number;
  stateMasterData_id: number;
  levelName: string;
  levelType: string;
  parentId: number | null;
  parentLevelName: string | null;
  parentLevelType: string | null;
}

interface HierarchySelection {
  hierarchy_type: "stateMasterData" | "afterAssemblyData";
  hierarchy_id: number;
  toggle_on: boolean;
}

/**
 * Get user data from localStorage
 */
export const getUserFromStorage = (): UserData | null => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Error parsing user data from localStorage:", error);
    return null;
  }
};

/**
 * Get selected assignment from localStorage
 */
export const getSelectedAssignmentFromStorage =
  (): SelectedAssignment | null => {
    try {
      const assignmentStr = localStorage.getItem("selectedAssignment");
      return assignmentStr ? JSON.parse(assignmentStr) : null;
    } catch (error) {
      console.error(
        "Error parsing selected assignment from localStorage:",
        error
      );
      return null;
    }
  };

/**
 * Determine state_id and party_id based on campaign level and user context
 *
 * Rules:
 * 1. For State level campaigns: use stateMasterData_id from selectedAssignment
 * 2. For District/Assembly level campaigns: extract state_id from hierarchy chain
 * 3. Always use partyId from user data
 */
export const getCampaignContextualIds = (
  campaignLevel: string,
  hierarchySelections?: HierarchySelection[]
): { state_id: number; party_id: number } => {
  const user = getUserFromStorage();
  const selectedAssignment = getSelectedAssignmentFromStorage();

  if (!user) {
    throw new Error("User data not found in localStorage");
  }

  // Always use partyId from user
  const party_id = user.partyId;

  let state_id: number;

  if (campaignLevel === "State" || !selectedAssignment) {
    // For state level campaigns, use stateMasterData_id from selected assignment
    state_id = selectedAssignment?.stateMasterData_id || 1;
  } else {
    // For district/assembly level campaigns, try to extract from hierarchy
    if (hierarchySelections && hierarchySelections.length > 0) {
      // Look for state hierarchy in selections
      const stateHierarchy = hierarchySelections.find(
        (h) => h.hierarchy_type === "stateMasterData"
      );

      if (stateHierarchy) {
        // If state is explicitly selected in hierarchy, use that
        state_id = stateHierarchy.hierarchy_id;
      } else {
        // Otherwise, fall back to selected assignment's state
        state_id = selectedAssignment?.stateMasterData_id || 1;
      }
    } else {
      // No hierarchy selections, use selected assignment's state
      state_id = selectedAssignment?.stateMasterData_id || 1;
    }
  }

  return { state_id, party_id };
};

/**
 * Extract hierarchy path for display purposes
 */
export const getHierarchyPath = (
  selectedAssignment: SelectedAssignment | null
): string => {
  if (!selectedAssignment) return "No assignment selected";

  const parts = [];

  if (
    selectedAssignment.parentLevelName &&
    selectedAssignment.parentLevelType
  ) {
    parts.push(
      `${selectedAssignment.parentLevelName} (${selectedAssignment.parentLevelType})`
    );
  }

  parts.push(
    `${selectedAssignment.levelName} (${selectedAssignment.levelType})`
  );

  return parts.join(" > ");
};

/**
 * Validate campaign data before submission
 */
export const validateCampaignData = (
  campaignLevel: string,
  hierarchySelections: HierarchySelection[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check if user data exists
  const user = getUserFromStorage();
  if (!user) {
    errors.push("User authentication required");
  }

  // Check if assignment exists for non-state campaigns
  const selectedAssignment = getSelectedAssignmentFromStorage();
  if (campaignLevel !== "State" && !selectedAssignment) {
    errors.push("Assignment selection required for non-state campaigns");
  }

  // Validate hierarchy selections
  if (hierarchySelections.length === 0) {
    errors.push("At least one target area must be selected");
  }

  // Check for valid hierarchy types
  const validHierarchyTypes = ["stateMasterData", "afterAssemblyData"];
  const invalidSelections = hierarchySelections.filter(
    (h) => !validHierarchyTypes.includes(h.hierarchy_type)
  );

  if (invalidSelections.length > 0) {
    errors.push("Invalid hierarchy type selected");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get campaign creation payload with auto-populated context
 */
export const prepareCampaignPayload = (formData: {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  campaign_level: string;
  hierarchy_selections: HierarchySelection[];
}) => {
  // Validate data first
  const validation = validateCampaignData(
    formData.campaign_level,
    formData.hierarchy_selections
  );

  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
  }

  // Get contextual IDs
  const { state_id, party_id } = getCampaignContextualIds(
    formData.campaign_level,
    formData.hierarchy_selections
  );

  // Return complete payload
  return {
    name: formData.name,
    description: formData.description,
    start_date: formData.start_date,
    end_date: formData.end_date,
    campaign_level: formData.campaign_level,
    state_id,
    party_id,
    hierarchy_selections: formData.hierarchy_selections,
  };
};

/**
 * Debug function to log current context
 */
export const debugCampaignContext = () => {
  const user = getUserFromStorage();
  const selectedAssignment = getSelectedAssignmentFromStorage();

  console.log("=== Campaign Context Debug ===");
  console.log("User:", user);
  console.log("Selected Assignment:", selectedAssignment);

  if (user && selectedAssignment) {
    console.log(
      "Contextual IDs for State campaign:",
      getCampaignContextualIds("State")
    );
    console.log("Hierarchy Path:", getHierarchyPath(selectedAssignment));
  }
  console.log("==============================");
};

/**
 * Example usage based on your localStorage data:
 *
 * localStorage contains:
 * - user: { partyId: 1, ... }
 * - selectedAssignment: { stateMasterData_id: 1, levelName: "Haryana", levelType: "State", ... }
 *
 * For State level campaign:
 * - state_id = 1 (from selectedAssignment.stateMasterData_id)
 * - party_id = 1 (from user.partyId)
 *
 * For District level campaign with hierarchy selection:
 * - state_id = extracted from hierarchy or fallback to selectedAssignment.stateMasterData_id
 * - party_id = 1 (from user.partyId)
 */
