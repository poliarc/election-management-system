# Initiative/Assigned Events Module - Implementation Documentation

## Overview

This document explains the complete static implementation of the Initiative (Assigned Events) module across District, Assembly, and Block panels. All dynamic APIs have been replaced with static JSON data for demonstration purposes.

## Folder Structure

```
src/
├── modules/
│   └── initative/
│       ├── data/
│       │   └── staticInitiativeData.ts         # Static campaigns, reports, and helper functions
│       ├── AssignedEventsPage.tsx              # Main page component (level-agnostic)
│       ├── CampaignDetailModal.tsx             # Modal for viewing campaign details
│       ├── CampaignList.tsx                    # List view of campaigns
│       ├── CampaignSlider.tsx                  # Slider/carousel view of campaigns
│       ├── CampaignNotificationCard.tsx        # Individual campaign card
│       ├── CampaignImageSlider.tsx             # Image carousel for campaigns
│       ├── CampaignInvitationForm.tsx          # Form for submitting campaign response
│       ├── EditReportModal.tsx                 # Modal for editing submitted reports
│       ├── ViewReportsModal.tsx                # Modal for viewing all reports
│       └── PartyCampaignPageWithAPI.tsx        # Legacy API-based version (kept for reference)
│
├── pages/
│   ├── District/
│   │   └── initiatives/
│   │       └── Initiatives.tsx                 # District-level wrapper
│   ├── Assembly/
│   │   └── assigned-events/
│   │       └── AssignedEvents.tsx              # Assembly-level wrapper
│   └── Block/
│       └── assigned-events/
│           └── AssignedEvents.tsx              # Block-level wrapper
│
├── types/
│   └── initative.ts                            # TypeScript type definitions
│
├── schemas/
│   └── initativeSchema.ts                      # Yup validation schemas
│
└── store/
    └── slices/
        └── initativeSlice.ts                   # Redux slice (static version)
```

## Key Files and Their Purpose

### 1. Static Data (`staticInitiativeData.ts`)

**Purpose**: Central repository for all campaign and report data.

**Key Elements**:

- `staticCampaigns`: Array of 7 sample campaigns with different statuses and levels
- `staticReports`: Array of sample reports linked to campaigns
- Helper functions:
  - `getCampaignsByLevel()`: Filter campaigns by user's level
  - `getCampaignById()`: Get specific campaign
  - `updateCampaignAcceptanceStatus()`: Accept/decline campaigns
  - `addCampaignReport()`: Submit new report
  - `mapCampaignToEvent()`: Convert Campaign to CampaignEvent for UI

**Sample Campaign**:

```typescript
{
  id: 1,
  name: "Youth Voter Registration Drive",
  description: "A comprehensive campaign...",
  start_date: "2025-12-01",
  end_date: "2025-12-15",
  image: ["url1", "url2"],
  levelType: "STATE",
  level_id: 1,
  acceptance_status: "pending",
  scope_level_type: "DISTRICT",
  scope_level_id: 1,
  // ...
}
```

### 2. Main Component (`AssignedEventsPage.tsx`)

**Purpose**: Level-agnostic page component for displaying assigned events.

**Props**:

- `userLevelType`: "DISTRICT" | "ASSEMBLY" | "BLOCK"
- `userLevelId`: number (the specific ID of that level)

**Features**:

- Loads campaigns based on user's level
- Displays statistics (total, pending, accepted, declined)
- Filter tabs (all/pending/accepted/declined)
- Event slider and list views
- Accept/Decline functionality
- Report submission

**Key Functions**:

```typescript
handleAcceptInvitation(); // Accept a campaign invitation
handleDeclineInvitation(); // Decline a campaign invitation
handleSendReport(); // Submit a report for accepted campaign
```

### 3. Page Wrappers

Each level has its own wrapper component that passes the appropriate level type and ID:

**District** (`pages/District/initiatives/Initiatives.tsx`):

```typescript
<AssignedEventsPage userLevelType="DISTRICT" userLevelId={1} />
```

**Assembly** (`pages/Assembly/assigned-events/AssignedEvents.tsx`):

```typescript
<AssignedEventsPage userLevelType="ASSEMBLY" userLevelId={10} />
```

**Block** (`pages/Block/assigned-events/AssignedEvents.tsx`):

```typescript
<AssignedEventsPage userLevelType="BLOCK" userLevelId={50} />
```

### 4. Supporting Components

**CampaignDetailModal.tsx**:

- Full-screen modal showing campaign details
- Image carousel
- Date, time, location information
- Accept/Decline buttons (for pending campaigns)
- Status indicators

**CampaignList.tsx**:

- Grid/list view of campaigns
- Individual cards with status badges
- Click to open detail modal

**CampaignSlider.tsx**:

- Horizontal scrolling carousel
- Featured campaigns display
- Quick access to campaign details

## Data Flow

### 1. Campaign Assignment Flow

```
State/Higher Level Creates Campaign
    ↓
Campaign assigned to specific scope (District/Assembly/Block)
    ↓
Appears in "Assigned Events" for that level
    ↓
User sees notification badge (pending count)
    ↓
User views campaign details
    ↓
User accepts or declines
    ↓
Status updates in static data
    ↓
UI refreshes to reflect new status
```

### 2. Report Submission Flow

```
User navigates to "Assigned Events"
    ↓
Filters to "Accepted" campaigns
    ↓
Clicks on accepted campaign
    ↓
Views campaign details
    ↓
Can submit multiple reports
    ↓
Report stored with campaign_acceptance_id
    ↓
Report count increments
    ↓
Reports viewable in detail modal
```

## Routing Configuration

### App.tsx Routes

```typescript
// District routes
<Route path="district" element={<DistrictLayout />}>
  <Route path="initiatives" element={<DistrictInitiatives />} />
  {/* other routes */}
</Route>

// Assembly routes
<Route path="assembly" element={<AssemblyLayout />}>
  <Route path="assigned-events" element={<AssemblyAssignedEvents />} />
  {/* other routes */}
</Route>

// Block routes
<Route path="block" element={<BlockLayout />}>
  <Route path="assigned-events" element={<BlockAssignedEvents />} />
  {/* other routes */}
</Route>
```

## Sidebar Integration

### DistrictSidebar.tsx

```typescript
const otherItems: NavItem[] = [
  { to: "campaigns", label: "Campaigns", icon: Icons.campaigns },
  {
    to: "assigned-campaigns",
    label: "Assigned Campaigns",
    icon: Icons.campaigns,
  },
  { to: "initiatives", label: "Assigned Events", icon: Icons.calendar },
];
```

### AssemblySidebar.tsx

```typescript
const otherItems: NavItem[] = [
  { to: "campaigns", label: "Campaigns", icon: Icons.campaigns },
  {
    to: "assigned-campaigns",
    label: "Assigned Campaigns",
    icon: Icons.campaigns,
  },
  { to: "assigned-events", label: "Assigned Events", icon: Icons.campaigns },
  { to: "search-voter", label: "Search Voter", icon: Icons.search },
];
```

### BlockSidebar.tsx

```typescript
const otherItems: NavItem[] = [
  { to: "assigned-events", label: "Assigned Events", icon: Icons.calendar },
];
```

## How Data is Filtered by Level

The `getCampaignsByLevel()` function filters campaigns based on:

1. **scope_level_type**: Must match the user's level type (DISTRICT/ASSEMBLY/BLOCK)
2. **scope_level_id**: Must match the user's specific ID

Example:

```typescript
// For Assembly Level User (Assembly ID = 10)
const campaigns = getCampaignsByLevel("ASSEMBLY", 10);

// This will return campaigns where:
// - scope_level_type === "ASSEMBLY"
// - scope_level_id === 10
```

## Sample Data Breakdown

### Campaigns Distribution:

- **District Level (ID 1)**: 3 campaigns assigned
  - Youth Voter Registration Drive (pending)
  - Clean & Green Initiative (declined)
- **Assembly Level (ID 10)**: 3 campaigns assigned
  - Community Health Camp (accepted, 2 reports)
  - Women Empowerment Workshop (pending)
- **Block Level (ID 50)**: 2 campaigns assigned
  - Road Safety Awareness Program (accepted, 1 report)
  - Digital Literacy Campaign (accepted, 3 reports)

### Status Distribution:

- **Pending**: 3 campaigns
- **Accepted**: 3 campaigns
- **Declined**: 1 campaign

## Features Implemented

### ✅ Completed Features:

1. **View Assigned Events** - Users can see all campaigns assigned to their level
2. **Filter by Status** - All/Pending/Accepted/Declined tabs
3. **Campaign Details** - Full modal with images, dates, location, description
4. **Accept/Decline** - Update campaign status with single click
5. **Statistics Dashboard** - Count cards showing totals by status
6. **Notification Badge** - Shows pending count in sidebar
7. **Report Submission** - Submit multiple reports for accepted campaigns
8. **Image Upload** - Convert File objects to data URLs for display
9. **Report Viewing** - See all submitted reports for a campaign
10. **Report Editing** - Update existing reports (via EditReportModal)

### 🔄 Replaced Dynamic APIs with Static Data:

- ❌ `useGetDistrictUserInitiativesQuery` → ✅ `getCampaignsByLevel()`
- ❌ `useAcceptDeclineCampaignMutation` → ✅ `updateCampaignAcceptanceStatus()`
- ❌ `useSubmitCampaignReportMutation` → ✅ `addCampaignReport()`
- ❌ `useUpdateCampaignReportMutation` → ✅ `updateCampaignReport()`
- ❌ `useGetUserCampaignReportsQuery` → ✅ `getReportsByCampaignAcceptanceId()`

## How to Use

### For District Users:

1. Login as District user
2. Click "Assigned Events" in sidebar
3. See campaigns assigned to District level
4. Accept/decline pending campaigns
5. Submit reports for accepted campaigns

### For Assembly Users:

1. Login as Assembly user
2. Click "Assigned Events" in sidebar
3. See campaigns assigned to Assembly level
4. Same accept/decline/report flow

### For Block Users:

1. Login as Block user
2. Click "Assigned Events" in sidebar
3. See campaigns assigned to Block level
4. Same accept/decline/report flow

## Extending the System

### Adding More Campaigns:

Edit `staticInitiativeData.ts` and add to `staticCampaigns` array:

```typescript
{
  id: 8,
  name: "New Campaign",
  description: "Description...",
  start_date: "2025-12-20",
  end_date: "2025-12-22",
  // ... other fields
  scope_level_type: "ASSEMBLY",  // Target level
  scope_level_id: 11,            // Target ID
}
```

### Adding More Levels:

1. Create new page wrapper in appropriate folder
2. Add route in App.tsx
3. Add sidebar item
4. Use `<AssignedEventsPage userLevelType="NEW_LEVEL" userLevelId={id} />`

### Connecting to Real API:

Replace static functions in component with API calls:

```typescript
// Instead of:
const campaigns = getCampaignsByLevel(userLevelType, userLevelId);

// Use:
const { data } = useGetCampaignsByLevelQuery({ levelType, levelId });
```

## Type Definitions

### Campaign

```typescript
interface Campaign {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  image?: string | string[] | null;
  location?: string | null;
  levelType: string; // Who created it
  level_id: number;
  acceptance_status: "pending" | "accepted" | "declined";
  scope_level_type: string; // Who it's assigned to
  scope_level_id: number;
  scope_id: number;
  acceptance_id?: number;
  report_count: number;
}
```

### CampaignEvent (UI Model)

```typescript
interface CampaignEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startDate: string;
  endDate: string;
  time: string;
  location: string;
  category: "social" | "meeting";
  priority: "low" | "medium" | "high";
  acceptance_status: "pending" | "accepted" | "declined";
  image: string | string[];
  campaign_id: number;
  scope_id?: number;
  acceptance_id?: number;
  // ...
}
```

### CampaignReport

```typescript
interface CampaignReport {
  id: number;
  campaign_acceptance_id: number;
  campaign_id: number;
  campaign_name: string;
  report_text: string;
  images: string[];
  created_at: string;
  userLevelType: string;
  userLevelId: number;
}
```

## Notes

1. **No Backend Required**: All data is stored in-memory using JavaScript arrays
2. **Data Persistence**: Refresh will reset all changes (no localStorage/sessionStorage)
3. **Image Handling**: Images are converted to data URLs for preview
4. **Static IDs**: Using hardcoded IDs (District=1, Assembly=10, Block=50) for demo
5. **Real Implementation**: Replace static functions with API calls when backend is ready

## Migration Path to Dynamic API

When ready to connect to real backend:

1. Create API endpoints in `src/store/api/initativeApi.ts`
2. Replace static function calls with RTK Query hooks
3. Update `initativeSlice.ts` to handle API responses
4. Remove hardcoded level IDs, use from auth context
5. Add proper error handling and loading states
6. Implement optimistic updates for better UX

## Troubleshooting

**Q: Not seeing any campaigns?**
A: Check that the static data has campaigns with matching scope_level_type and scope_level_id for your user level.

**Q: Accept/Decline not working?**
A: Ensure the campaign has a valid scope_id. Check browser console for errors.

**Q: Reports not showing?**
A: Reports are linked via acceptance_id. Campaign must be accepted first to have an acceptance_id.

**Q: Images not displaying?**
A: For static data, ensure image URLs are valid. For uploads, they're converted to data URLs automatically.

---

**Implementation Date**: November 25, 2025  
**Status**: ✅ Complete - Fully functional static implementation  
**Next Steps**: Connect to real API when backend is ready
