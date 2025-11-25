# Campaign Module - Static Implementation Guide

## 📁 Project Structure

```
src/
├── modules/
│   └── campaigns/
│       └── data/
│           └── staticCampaignData.ts          # Static data source
│
├── pages/
│   └── State/
│       └── campaigns/
│           ├── CampaignsStatePage.tsx         # Main campaigns page
│           ├── CampaignReportsPage.tsx        # Reports aggregation page
│           ├── index.ts                        # Export barrel
│           └── components/
│               ├── CampaignListing.tsx        # Campaign list view
│               ├── CampaignForm.tsx           # Create/Edit form
│               └── CampaignDetails.tsx        # Campaign detail + reports
│
├── components/
│   └── StateSidebar.tsx                       # Updated with Campaign menu
│
├── types/
│   └── campaign.ts                            # TypeScript types
│
├── schemas/
│   └── campaignSchema.ts                      # Form validation
│
└── App.tsx                                     # Routes added for campaigns
```

## 🚀 Features Implemented

### 1. Campaign Creation

- ✅ Create new campaigns from State panel
- ✅ Form validation with Yup schema
- ✅ Static mode (no API calls)
- ✅ Simple fields: title, description, location, dates

### 2. Campaign Management

- ✅ View all campaigns in a list
- ✅ Filter by status (Active/Completed)
- ✅ Search campaigns
- ✅ Edit existing campaigns
- ✅ Delete campaigns
- ✅ End campaigns (change status to completed)
- ✅ View campaign images in gallery/carousel
- ✅ Full-screen image viewer

### 3. Campaign Response/Reports

- ✅ View campaign details
- ✅ See participant activity reports
- ✅ Filter reports by campaign
- ✅ Search reports by person/location
- ✅ View aggregated statistics

### 4. Campaign Reports Page

- ✅ Dedicated reports page at `/state/campaigns/reports`
- ✅ Campaign-wise filtering
- ✅ Search functionality
- ✅ Statistics dashboard
- ✅ Comprehensive report table

## 🔗 Navigation Flow

```
State Sidebar → Campaigns
                   ├── Campaign Listing (default)
                   │   ├── Create Campaign → Form → Back to Listing
                   │   ├── Edit Campaign → Form → Back to Listing
                   │   ├── View Details → Campaign Details → Back to Listing
                   │   ├── Delete Campaign → Confirmation → Listing Updates
                   │   └── View Reports → Campaign Reports Page
                   │
                   └── Campaign Reports Page
                       ├── Filter by Campaign
                       ├── Search Reports
                       └── View Statistics
```

## 📊 Static Data Structure

### Sample Campaign Data

Located in `src/modules/campaigns/data/staticCampaignData.ts`

**STATIC_CAMPAIGNS** - 5 sample campaigns:

1. Grassroots Outreach - Urban Areas (Active)
2. Youth Engagement Initiative (Active)
3. Health & Wellness Awareness (Completed)
4. Agricultural Development Drive (Active)
5. Women Empowerment Program (Completed)

**STATIC_CAMPAIGN_REPORTS** - 13 sample reports:

- Linked to campaigns via `campaign_id`
- Includes reporter details, attendees, location, date
- Images from Unsplash

### Helper Functions

```typescript
getAllCampaigns(); // Get all campaigns
getCampaignById(id); // Get single campaign
getReportsByCampaignId(campaignId); // Get reports for campaign
getAllReports(); // Get all reports
addCampaign(data); // Add new campaign (simulated)
updateCampaign(id, updates); // Update campaign (simulated)
deleteCampaign(id); // Delete campaign (simulated)
endCampaign(id); // Mark campaign as completed
```

## 🎯 How Components Connect

### CampaignsStatePage (Main Container)

- Manages view state (listing/form/details)
- Loads data from static source
- Handles CRUD operations
- Passes data to child components

### CampaignListing (List View)

- Displays campaigns in cards
- Filters and search
- Stats cards
- Image gallery with full-screen viewer
- Navigation to Reports page

### CampaignForm (Create/Edit)

- Form validation
- Handles both create and edit modes
- Simplified for static mode
- Note about features coming when backend connected

### CampaignDetails (Detail View)

- Shows campaign information
- Displays participant activity reports
- Search/filter reports
- Campaign status sidebar
- Edit/End campaign actions

### CampaignReportsPage (Reports Aggregation)

- Campaign-wise filtering
- Global search across all reports
- Statistics dashboard
- Comprehensive report table

## 📍 Routes Added

```typescript
// In App.tsx
<Route path="state" element={<StateLayout />}>
  {/* ... other routes ... */}
  <Route path="campaigns" element={<CampaignsStatePage />} />
  <Route path="campaigns/reports" element={<CampaignReportsPage />} />
</Route>
```

## 🎨 UI Components Used

### From External Libraries

- `react-hook-form` - Form handling
- `@hookform/resolvers/yup` - Validation
- `lucide-react` - Icons
- `react-router-dom` - Navigation

### Custom Components

- `ConfirmationModal` - Delete/End confirmations
- Campaign image carousel
- Full-screen image modal

## 🔄 Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Static Data Helper Function
    ↓
Update Local State
    ↓
Re-render Components
```

## ⚙️ Configuration

### Sidebar Menu

Updated in `src/components/StateSidebar.tsx`:

```typescript
{ to: "campaigns", label: "Campaigns", icon: Icons.campaigns }
```

### Form Validation

Defined in `src/schemas/campaignSchema.ts`:

- Title: 3-100 characters
- Description: 10-500 characters
- Location: max 200 characters
- End date must be after start date

### TypeScript Types

Defined in `src/types/campaign.ts`:

- `Campaign` - Main campaign interface
- `CampaignReport` - Report interface
- `CampaignStatus`, `CampaignMedia`, etc.

## 🚦 Next Steps (Backend Integration)

When ready to connect to backend:

1. **Replace static data imports** with API calls
2. **Add API service** in `src/store/api/campaignApi.ts`
3. **Use RTK Query hooks** instead of static helpers
4. **Enable real features**:
   - Image upload
   - Hierarchical targeting (District → Booth)
   - Participant management
   - Real-time updates
   - Notifications

## 📝 Usage Examples

### Creating a Campaign

1. Click "Campaigns" in State sidebar
2. Click "Create Campaign" button
3. Fill out the form
4. Click "Launch Campaign"
5. See new campaign in listing

### Viewing Reports

1. Click "View Reports" button in Campaign listing
2. Select a campaign filter (or view all)
3. Search by name/phone/location
4. View statistics and detailed report table

### Ending a Campaign

1. Click on campaign to view details
2. Click "End Campaign" in Actions sidebar
3. Confirm the action
4. Campaign status changes to "Completed"

## 🎓 Key Design Decisions

1. **Static Data First**: Allows testing UI/UX without backend
2. **Modular Structure**: Easy to swap static → API
3. **Reusable Components**: Listing/Form/Details can be used elsewhere
4. **Single Source of Truth**: All data comes from staticCampaignData.ts
5. **Simulated Delays**: Added setTimeout to mimic API calls
6. **Image URLs**: Using Unsplash for demo images

## 🐛 Known Limitations (Static Mode)

- ❌ No image upload (only Unsplash URLs)
- ❌ No hierarchical targeting (simplified)
- ❌ No real participant tracking
- ❌ Data resets on page reload
- ❌ No server-side validation
- ❌ No real-time updates

These will be resolved when backend is integrated.

## ✅ Testing Checklist

- [x] Campaign appears in State sidebar
- [x] Can create new campaign
- [x] Can view campaign list
- [x] Can filter/search campaigns
- [x] Can edit existing campaign
- [x] Can delete campaign
- [x] Can view campaign details
- [x] Can see campaign reports
- [x] Can navigate to Reports page
- [x] Can filter reports by campaign
- [x] Can end active campaign
- [x] Form validation works
- [x] Modals show correctly
- [x] Images display in gallery
- [x] Full-screen image viewer works

---

**Created:** November 24, 2025
**Mode:** Static Data (Demo)
**Status:** ✅ Fully Functional in Static Mode
