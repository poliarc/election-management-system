# Design Document

## Overview

The Dynamic Assembly Navigation system will transform the current static navigation into an intelligent, data-driven interface that adapts to flexible hierarchy structures. After Assembly level, any combination of levels (Block, Mandal, Polling Center, Booth) can exist independently - the system doesn't assume a strict hierarchical order. For example, an Assembly might have direct Booths without Blocks or Mandals, or have Blocks and Booths but no Polling Centers.

The system will consist of three main components: a Navigation Visibility Manager that controls sidebar items based on actual data presence, a Dynamic Filter Component that provides context-aware filtering based on available hierarchy levels, and a Data Availability Service that monitors data presence across all possible levels.

The solution will replace the current static navigation items in AssemblySidebar.tsx with dynamic ones, create a reusable DynamicFilterSection component that adapts to available hierarchy levels, and implement real-time data monitoring to ensure navigation accuracy regardless of hierarchy structure.

## Architecture

The system follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Assembly Module                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Navigation      │  │ Dynamic Filter  │  │ List        │ │
│  │ Visibility      │  │ Component       │  │ Components  │ │
│  │ Manager         │  │                 │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            Data Availability Service                    │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 API Layer                               │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Navigation Visibility Manager

**Purpose**: Controls the visibility of navigation items in the Assembly sidebar based on data availability.

**Interface**:
```typescript
interface NavigationVisibilityManager {
  checkDataAvailability(assemblyId: number): Promise<NavigationVisibility>
  updateNavigationItems(visibility: NavigationVisibility): void
  subscribeToDataChanges(callback: (visibility: NavigationVisibility) => void): void
}

interface NavigationVisibility {
  showBlocks: boolean
  showMandals: boolean
  showPollingCenters: boolean
  showBooths: boolean
}
```

### 2. Dynamic Filter Component

**Purpose**: Provides a reusable, context-aware filtering interface that adapts to available hierarchy levels for each assembly.

**Interface**:
```typescript
interface DynamicFilterProps {
  currentLevel: 'block' | 'mandal' | 'pollingCenter' | 'booth'
  assemblyId: number
  availableLevels: HierarchyLevel[]
  onFiltersChange: (filters: FilterState) => void
  initialFilters?: Partial<FilterState>
}

interface FilterState {
  assemblyId: number
  blockId?: number
  mandalId?: number
  pollingCenterId?: number
  searchTerm: string
  selectedItemFilter: string
}

interface HierarchyLevel {
  type: 'block' | 'mandal' | 'pollingCenter' | 'booth'
  hasData: boolean
  isRequired: boolean
  parentType?: string
}
```

### 3. Data Availability Service

**Purpose**: Monitors and provides information about data availability across hierarchy levels.

**Interface**:
```typescript
interface DataAvailabilityService {
  checkHierarchyData(assemblyId: number): Promise<HierarchyDataStatus>
  getFilterOptions(level: HierarchyLevel, parentId?: number): Promise<FilterOption[]>
  subscribeToDataUpdates(callback: (status: HierarchyDataStatus) => void): void
}

interface HierarchyDataStatus {
  assemblyId: number
  availableLevels: {
    blocks: { count: number; hasData: boolean; hasDirectChildren: boolean }
    mandals: { count: number; hasData: boolean; parentLevel?: string }
    pollingCenters: { count: number; hasData: boolean; parentLevel?: string }
    booths: { count: number; hasData: boolean; parentLevel?: string }
  }
  hierarchyStructure: HierarchyRelationship[]
}

interface HierarchyRelationship {
  parentType: string
  childType: string
  isActive: boolean
}
```

## Data Models

### Navigation Configuration
```typescript
interface NavigationConfig {
  id: string
  label: string
  icon: ReactNode
  route: string
  requiredData: 'blocks' | 'mandals' | 'pollingCenters' | 'booths'
  isVisible: boolean
}
```

### Filter Configuration
```typescript
interface FilterConfig {
  level: HierarchyLevel
  requiredFilters: FilterType[]
  optionalFilters: FilterType[]
  autoSelectFirst: boolean
}

type FilterType = 'assembly' | 'block' | 'mandal' | 'pollingCenter' | 'search'
type HierarchyLevel = 'block' | 'mandal' | 'pollingCenter' | 'booth'
```

### Data Availability Cache
```typescript
interface DataCache {
  assemblyId: number
  lastUpdated: Date
  hierarchyData: HierarchyDataStatus
  filterOptions: Record<string, FilterOption[]>
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN the Assembly_Module loads THEN the system SHALL check data availability for each Hierarchy_Level
  Thoughts: This is about system initialization behavior that should happen consistently every time the module loads. We can test this by loading the module with different data scenarios and verifying the check occurs.
  Testable: yes - property

1.2 WHEN a Hierarchy_Level has no data THEN the system SHALL hide the corresponding Navigation_Item from the sidebar
  Thoughts: This is a rule that should apply to all hierarchy levels - if any level has no data, its navigation item should be hidden. We can test this across all levels.
  Testable: yes - property

1.3 WHEN a Hierarchy_Level has data THEN the system SHALL display the corresponding Navigation_Item in the sidebar
  Thoughts: This is the inverse of 1.2 and should apply universally - any level with data should show its navigation item.
  Testable: yes - property

1.4 WHEN data availability changes THEN the system SHALL update the Navigation_Item visibility immediately
  Thoughts: This is about system responsiveness to data changes. We can test this by changing data and verifying navigation updates.
  Testable: yes - property

1.5 WHEN all Hierarchy_Levels have no data THEN the system SHALL display a message indicating no data is available
  Thoughts: This is a specific edge case that should be handled consistently.
  Testable: yes - example

2.1 WHEN viewing any list component THEN the system SHALL display a standardized Filter_Section
  Thoughts: This is about UI consistency across all list components. Every list should have the same filter interface.
  Testable: yes - property

2.2 WHEN the Filter_Section loads THEN the system SHALL populate dropdown options based on available data
  Thoughts: This is about data-driven UI population that should work consistently across all filter sections.
  Testable: yes - property

2.3 WHEN no data exists for a filter option THEN the system SHALL disable or hide that filter control
  Thoughts: This is a rule about UI state management based on data availability.
  Testable: yes - property

2.4 WHEN filter selections change THEN the system SHALL update the list results immediately
  Thoughts: This is about UI responsiveness that should work consistently across all filters.
  Testable: yes - property

2.5 WHEN clearing filters THEN the system SHALL reset all filter controls to their default state
  Thoughts: This is about state management and should work consistently for all filter clearing operations.
  Testable: yes - property

3.1 WHEN viewing Block list THEN the system SHALL show Assembly and Block filters only
  Thoughts: This is a specific case of context-aware filtering. We can test this as part of a broader property about context-appropriate filters.
  Testable: yes - example

3.2 WHEN viewing Mandal list THEN the system SHALL show Assembly, Block, and Mandal filters
  Thoughts: Another specific case of context-aware filtering.
  Testable: yes - example

3.3 WHEN viewing Polling Center list THEN the system SHALL show Assembly, Block, Mandal, and Polling Center filters
  Thoughts: Another specific case of context-aware filtering.
  Testable: yes - example

3.4 WHEN viewing Booth list THEN the system SHALL show all hierarchy level filters
  Thoughts: Another specific case of context-aware filtering.
  Testable: yes - example

3.5 WHEN a parent level has no selection THEN the system SHALL disable child level filters
  Thoughts: This is a rule about hierarchical dependencies that should apply to all parent-child relationships.
  Testable: yes - property

4.1 WHEN new data is added to any Hierarchy_Level THEN the system SHALL automatically show the corresponding Navigation_Item
  Thoughts: This is about automatic system adaptation that should work for any hierarchy level.
  Testable: yes - property

4.2 WHEN all data is removed from a Hierarchy_Level THEN the system SHALL automatically hide the corresponding Navigation_Item
  Thoughts: This is the inverse of 4.1 and should work universally.
  Testable: yes - property

4.3 WHEN the user switches between different assemblies THEN the system SHALL refresh Navigation_Item visibility based on the new assembly's data
  Thoughts: This is about system state management during assembly switching.
  Testable: yes - property

4.4 WHEN data is modified THEN the system SHALL update filter options to reflect current data
  Thoughts: This is about system responsiveness to data changes.
  Testable: yes - property

4.5 WHEN the system detects data changes THEN the system SHALL update the interface within 2 seconds
  Thoughts: This is a performance requirement with a specific time constraint.
  Testable: yes - property

5.1 WHEN a filter section loads THEN the system SHALL auto-select the first available option for required filters
  Thoughts: This is about default selection behavior that should work consistently.
  Testable: yes - property

5.2 WHEN a parent filter changes THEN the system SHALL auto-select the first available child option
  Thoughts: This is about cascading selection behavior in hierarchical filters.
  Testable: yes - property

5.3 WHEN only one option exists for a filter THEN the system SHALL auto-select that option
  Thoughts: This is about smart default selection behavior.
  Testable: yes - property

5.4 WHEN no options exist for a filter THEN the system SHALL display an appropriate message
  Thoughts: This is about error/empty state handling.
  Testable: yes - property

5.5 WHEN auto-selection occurs THEN the system SHALL immediately load the corresponding data
  Thoughts: This is about system responsiveness to automatic selections.
  Testable: yes - property

6.1 WHEN using search in any list component THEN the system SHALL provide real-time filtering as the user types
  Thoughts: This is about search behavior consistency across all components.
  Testable: yes - property

6.2 WHEN search results are empty THEN the system SHALL display a "no results found" message
  Thoughts: This is about empty state handling in search.
  Testable: yes - property

6.3 WHEN clearing search THEN the system SHALL restore the full filtered list
  Thoughts: This is about search state management.
  Testable: yes - property

6.4 WHEN search is combined with other filters THEN the system SHALL apply all filters simultaneously
  Thoughts: This is about filter combination behavior.
  Testable: yes - property

6.5 WHEN search input receives focus THEN the system SHALL provide visual feedback to indicate active search mode
  Thoughts: This is about UI feedback behavior.
  Testable: yes - property

### Property Reflection

After reviewing all properties, I identified several areas for consolidation:

**Navigation Visibility Properties (1.2, 1.3, 4.1, 4.2)** can be combined into a comprehensive property about navigation item visibility based on data availability.

**Filter State Management Properties (2.4, 2.5, 5.5)** can be consolidated into a property about filter responsiveness and state management.

**Context-Aware Filter Properties (3.1-3.4)** are specific examples that can be covered by a single property about hierarchical filter display.

**Auto-Selection Properties (5.1, 5.2, 5.3)** can be combined into one comprehensive property about smart default selections.

**Search Properties (6.1, 6.3, 6.4)** can be consolidated into a property about search functionality consistency.

Property 1: Navigation visibility reflects data availability
*For any* hierarchy level and data state, the navigation item visibility should match the data availability status (visible when data exists, hidden when no data exists)
**Validates: Requirements 1.2, 1.3, 4.1, 4.2**

Property 2: Filter sections adapt to available hierarchy levels
*For any* list component and assembly configuration, the filter section should display only the filters for levels that actually exist and have data in that assembly
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

Property 3: Filter state management is consistent
*For any* filter operation (selection, clearing, auto-selection), the system should immediately update the UI state and load corresponding data
**Validates: Requirements 2.4, 2.5, 5.5**

Property 4: Dynamic hierarchical filter dependencies are enforced
*For any* existing parent-child filter relationship in the current assembly structure, when the parent has no selection, all child filters should be disabled
**Validates: Requirements 3.5**

Property 5: Smart auto-selection works universally
*For any* filter with available options, the system should auto-select appropriately (first option for multiple choices, single option when only one exists, no selection when none exist)
**Validates: Requirements 5.1, 5.2, 5.3**

Property 6: Search functionality is consistent across components
*For any* list component with search capability, search should provide real-time filtering, handle empty results gracefully, and combine properly with other filters
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

Property 7: System responds to data changes promptly
*For any* data modification, the system should update navigation visibility, filter options, and interface state within the specified time limit
**Validates: Requirements 4.3, 4.4, 4.5**

Property 8: Data availability checking is comprehensive
*For any* assembly module load, the system should check data availability for all hierarchy levels and update navigation accordingly
**Validates: Requirements 1.1, 1.4**

## Error Handling

### Data Loading Errors
- **Network failures**: Display retry mechanism with exponential backoff
- **API timeouts**: Show loading state with timeout message after 10 seconds
- **Invalid data responses**: Log errors and show fallback empty state

### Navigation State Errors
- **Missing assembly data**: Redirect to assembly selection or show error message
- **Inconsistent hierarchy data**: Refresh data and reset navigation state
- **Permission errors**: Hide unauthorized navigation items gracefully

### Filter State Errors
- **Invalid filter combinations**: Reset to valid default state
- **Missing parent selections**: Auto-select first available parent option
- **Empty filter results**: Show appropriate empty state message

## Testing Strategy

### Unit Testing
- Test individual components (NavigationVisibilityManager, DynamicFilterComponent, DataAvailabilityService)
- Mock API responses to test various data availability scenarios
- Test filter state management and validation logic
- Test navigation item visibility calculations

### Property-Based Testing
The system will use **fast-check** as the property-based testing library for TypeScript/React applications. Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage of the input space.

Property-based tests will be implemented for each correctness property, with each test tagged using the format: **Feature: dynamic-assembly-navigation, Property {number}: {property_text}**

**Property Test Generators**:
- **HierarchyDataGenerator**: Creates random hierarchy data structures with varying data availability
- **FilterStateGenerator**: Generates valid and invalid filter state combinations
- **AssemblyConfigGenerator**: Creates different assembly configurations for testing navigation behavior
- **UserInteractionGenerator**: Simulates user interactions like clicks, selections, and searches

**Test Data Constraints**:
- Assembly IDs: Valid positive integers
- Hierarchy levels: Constrained to valid enum values
- Filter combinations: Respect parent-child relationships
- Search terms: Include edge cases like empty strings, special characters, and very long inputs