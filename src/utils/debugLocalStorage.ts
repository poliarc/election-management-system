// Debug utility to inspect localStorage
export const debugLocalStorage = () => {
  console.log("=== localStorage Debug ===");

  // List all keys
  console.log("All localStorage keys:", Object.keys(localStorage));

  // Check user data
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log("User data:", user);
      console.log("User partyId:", user.partyId);
      console.log("User partyId type:", typeof user.partyId);
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  } else {
    console.log("No 'user' key found in localStorage");
  }

  // Check selected assignment
  const selectedAssignmentStr = localStorage.getItem("selectedAssignment");
  if (selectedAssignmentStr) {
    try {
      const selectedAssignment = JSON.parse(selectedAssignmentStr);
      console.log("Selected assignment:", selectedAssignment);
      console.log("stateMasterData_id:", selectedAssignment.stateMasterData_id);
      console.log(
        "stateMasterData_id type:",
        typeof selectedAssignment.stateMasterData_id
      );
    } catch (error) {
      console.error("Error parsing selected assignment:", error);
    }
  } else {
    console.log("No 'selectedAssignment' key found in localStorage");
  }

  // Check access token
  const accessToken = localStorage.getItem("accessToken");
  console.log("Access token exists:", !!accessToken);

  console.log("========================");
};

// Call this function to debug localStorage
if (typeof window !== "undefined") {
  (window as any).debugLocalStorage = debugLocalStorage;
}
