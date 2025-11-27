# Campaign Implementation Guide

This document explains how the campaign functionality works with automatic data mapping based on user context and hierarchy.

## Overview

The campaign system automatically picks the correct `state_id` and `party_id` based on:

- **stateMasterData_id** from selected state for `state_id`
- **partyId** from user for `party_id`
- **hierarchy data** for district and assembly level campaigns

## Key Files

### API Service

- `src/services/campaignApi.ts` - Main API service with automatic data mapping
- `src/types/campaign-api.ts` - TypeScript types for campaign API

### Components

- `src/components/CampaignForm.tsx` - Form for creating campaigns
- `src/components/CampaignExample.tsx` - Complete example with all functionality

### Utilities

- `src/hooks/useCampaign.ts` - React hook for campaign operations
- `src/utils/campaignDataMapper.ts` - Data mapping utilities
- `src/schemas/campaignSchema.ts` - Validation schemas

## Data Mapping Logic

### User Context (from localStorage)

```javascript
// User data
{
  "id": 3,
  "partyId": 1,
  "partyName": "Bhartiye Janta Party",
  "userType": "partyadmin"
}

// Selected Assignment
{
  "assignment_id": 63,
  "stateMasterData_id": 1,
  "levelName": "Haryana",
  "levelType": "State"
}
```

### Automatic ID Resolution

#### For State Level Campaigns

```javascript
const { state_id, party_id } = getCampaignContextualIds("State");
// Result: { state_id: 1, party_id: 1 }
// Uses: selectedAssignment.stateMasterData_id and user.partyId
```

#### For District/Assembly Level Campaigns

```javascript
const hierarchySelections = [
  {
    hierarchy_type: "stateMasterData",
    hierarchy_id: 5, // District ID
    toggle_on: true,
  },
];

const { state_id, party_id } = getCampaignContextualIds(
  "District",
  hierarchySelections
);
// Result: { state_id: 5, party_id: 1 }
// Uses: hierarchy selection for state_id, user.partyId for party_id
```

## Usage Examples

### 1. Basic Campaign Creation

```tsx
import { useCampaign } from "../hooks/useCampaign";

const MyComponent = () => {
  const { createCampaign, loading, error } = useCampaign();

  const handleSubmit = async (formData) => {
    try {
      const campaign = await createCampaign({
        name: "State Election Campaign 2025",
        description: "Comprehensive campaign for state elections",
        start_date: "2025-01-01",
        end_date: "2025-12-31",
        campaign_level: "State",
        hierarchy_selections: [
          {
            hierarchy_type: "stateMasterData",
            hierarchy_id: 1,
            toggle_on: true,
          },
        ],
      });

      console.log("Campaign created:", campaign);
    } catch (err) {
      console.error("Failed to create campaign:", err);
    }
  };
};
```

### 2. Using the Complete Form Component

```tsx
import { CampaignForm } from "../components/CampaignForm";

const CampaignPage = () => {
  const handleCampaignCreated = (campaign) => {
    alert(`Campaign "${campaign.name}" created successfully!`);
    // Navigate or refresh data
  };

  return (
    <CampaignForm
      onSuccess={handleCampaignCreated}
      onCancel={() => navigate("/campaigns")}
    />
  );
};
```

### 3. Campaign Management

```tsx
import { CampaignExample } from "../components/CampaignExample";

// This component shows:
// - Current user context
// - List of assigned campaigns
// - List of created campaigns
// - Accept/decline functionality
// - Acceptance details for created campaigns

const CampaignManagement = () => {
  return <CampaignExample />;
};
```

## API Endpoints

### Create Campaign

```
POST /api/campaigns/create
```

**Request Body:**

```json
{
  "name": "State Election Campaign 2025",
  "description": "Comprehensive campaign for state elections",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "campaign_level": "State",
  "hierarchy_selections": [
    {
      "hierarchy_type": "stateMasterData",
      "hierarchy_id": 5,
      "toggle_on": true
    }
  ]
}
```

**Note:** `state_id` and `party_id` are automatically added by the API service based on user context.

### Get My Campaigns

```
GET /api/campaigns/my-campaigns?isActive=1&sort_by=created_at&order=desc
```

### Accept/Decline Campaign

```
POST /api/campaign-acceptance/{campaignId}
```

**Request Body:**

```json
{
  "status": "accepted" // or "declined"
}
```

### Get Acceptance Details (Creator Only)

```
GET /api/campaigns/{campaignId}/acceptance-details
```

## Data Flow

1. **User Authentication**: User data stored in localStorage after login
2. **Assignment Selection**: Selected assignment stored in localStorage
3. **Campaign Creation**:
   - Form collects campaign details and hierarchy selections
   - API service automatically maps `state_id` and `party_id`
   - Request sent to backend with complete data
4. **Campaign Management**:
   - Users can view assigned campaigns
   - Users can accept/decline campaigns
   - Creators can view acceptance details

## Error Handling

The system includes comprehensive error handling:

```javascript
// Validation before API call
const validation = validateCampaignData(campaignLevel, hierarchySelections);
if (!validation.isValid) {
  throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
}

// API error handling
try {
  const response = await campaignApi.createCampaign(data);
  return response.data;
} catch (error) {
  console.error("API Error:", error.message);
  throw error;
}
```

## Debugging

Use the debug utility to inspect current context:

```javascript
import { debugCampaignContext } from "../utils/campaignDataMapper";

// Call this to log current user context
debugCampaignContext();
```

## Integration Steps

1. **Install Dependencies**: Ensure React Hook Form and Yup are installed
2. **Import Components**: Add campaign components to your routing
3. **Update Navigation**: Add links to campaign management pages
4. **Test Data Flow**: Use the debug utility to verify data mapping
5. **Handle Permissions**: Ensure proper role-based access control

## Best Practices

1. **Always validate data** before API calls
2. **Handle loading states** in UI components
3. **Provide clear error messages** to users
4. **Use the debug utility** during development
5. **Test with different user roles** and assignments
6. **Implement proper error boundaries** for React components

## Troubleshooting

### Common Issues

1. **"User not found in localStorage"**

   - Ensure user is logged in
   - Check localStorage keys match expected format

2. **"Assignment selection required"**

   - Ensure selectedAssignment is set for non-state campaigns
   - Verify assignment data structure

3. **"Invalid hierarchy type selected"**

   - Check hierarchy_type values are "stateMasterData" or "afterAssemblyData"
   - Verify hierarchy_id values are valid numbers

4. **API Authentication Errors**
   - Ensure accessToken is stored in localStorage
   - Check token expiration and refresh logic
