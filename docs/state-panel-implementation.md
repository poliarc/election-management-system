# State Panel Implementation

## Overview

Implemented dynamic district and assembly listings for the State panel that automatically update based on the selected state from localStorage.

## Features

### 1. State Selection

- Dropdown to select from multiple assigned states (if user has access to multiple states)
- Automatically loads the currently selected state from `auth_state` in localStorage
- Updates localStorage when state is changed

### 2. District Listing (`/state/districts`)

- Fetches districts for the selected state using API: `/api/user-state-hierarchies/hierarchy/children/${stateId}`
- Displays district information with:
  - Serial number
  - District name
  - Location type
  - Total users
  - Active users
  - View action button
- Search functionality
- Sorting by name, total users, or active users
- Pagination support

### 3. Assembly Listing (`/state/assembly`)

- Fetches assemblies for the selected state using the same API pattern
- Same UI features as district listing
- Automatically updates when state is changed

## Technical Implementation

### Files Created/Modified

1. **src/pages/State/districts/Districts.tsx** (New)

   - Main component for district listing
   - Handles state selection and data fetching

2. **src/pages/State/assembly/Assembly.tsx** (New)

   - Main component for assembly listing
   - Handles state selection and data fetching

3. **src/pages/State/districts/index.tsx** (Modified)

   - Updated to export the new Districts component

4. **src/pages/State/assembly/index.tsx** (Modified)

   - Updated to export the new Assembly component

5. **src/hooks/useHierarchyData.ts** (Modified)

   - Added `useSelectedStateId()` hook to get state ID from localStorage

6. **src/services/hierarchyApi.ts** (Modified)
   - Added `getSelectedState()` function to retrieve state info from localStorage

## Data Flow

1. Component loads and reads `auth_state` from localStorage
2. Extracts `selectedAssignment` to get current state ID and name
3. Extracts `stateAssignments` array for state dropdown (if multiple states)
4. Passes state ID to `useHierarchyData` hook
5. Hook fetches data from API: `/api/user-state-hierarchies/hierarchy/children/${stateId}`
6. Data is displayed in `HierarchyTable` component

## State Change Behavior

When user selects a different state:

1. `handleStateChange()` is triggered
2. Finds the new state assignment from `stateAssignments` array
3. Updates `selectedAssignment` in localStorage
4. Updates local state (stateId and stateName)
5. `useHierarchyData` hook automatically refetches data for new state
6. UI updates with new district/assembly data

## LocalStorage Structure

```json
{
  "accessToken": "...",
  "selectedAssignment": {
    "assignment_id": 5,
    "stateMasterData_id": 1,
    "levelName": "Haryana",
    "levelType": "State",
    "parentId": null,
    "parentLevelName": null,
    "parentLevelType": null
  },
  "stateAssignments": [
    {
      "assignment_id": 10,
      "stateMasterData_id": 106,
      "levelName": "Assam",
      "levelType": "State",
      ...
    },
    {
      "assignment_id": 5,
      "stateMasterData_id": 1,
      "levelName": "Haryana",
      "levelType": "State",
      ...
    }
  ],
  ...
}
```

## UI Components Used

- **HierarchyTable**: Reusable table component with search, sort, and pagination
- **State Selector**: Dropdown shown only when user has multiple state assignments
- **Loading State**: Spinner while data is being fetched
- **Error State**: Error message display if API fails
- **Empty State**: Message when no data is available

## API Integration

- Endpoint: `/api/user-state-hierarchies/hierarchy/children/${parentId}`
- Method: GET
- Headers: Authorization Bearer token from localStorage
- Query Parameters:
  - `page`: Current page number
  - `limit`: Items per page
  - `search`: Search query
  - `sort_by`: Field to sort by
  - `order`: Sort order (asc/desc)

## Type Safety

All components use TypeScript with proper type definitions:

- `StateAssignment` type from `src/types/api.ts`
- `HierarchyChild` type from `src/types/hierarchy.ts`
- No `any` types used in the implementation
