# Booth Management Module

This module manages booth management agents for polling centers in the Assembly level.

## Features

- **Dashboard**: Overview of all booth agents with statistics
- **Agent Management**: Create, update, delete, and toggle status of agents
- **Category-based Listing**: Separate views for each team category
- **Polling Center Integration**: Link agents to polling centers and booths
- **Search & Filters**: Search by name, phone, email and filter by status

## Agent Categories

### 1. Booth Inside Team

- Booth Agent
- Table Coordinator

### 2. Booth Outside Team

- Voter Field Coordination

### 3. Polling Center Support Team

- Polling Center Incharge
- Water Incharge
- Food Incharge

## Routes

- `/assembly/booth-management/dashboard` - Dashboard with statistics
- `/assembly/booth-management/agents` - All agents listing
- `/assembly/booth-management/inside` - Booth Inside Team
- `/assembly/booth-management/outside` - Booth Outside Team
- `/assembly/booth-management/polling-support` - Polling Center Support Team

## API Endpoints

All endpoints are prefixed with `/api/booth-agents`

- `POST /create` - Create new agent
- `GET /all` - Get all agents with filters
- `GET /category/:category` - Get agents by category
- `GET /single/:id` - Get single agent
- `PUT /update/:id` - Update agent
- `PATCH /:id/toggle-status` - Toggle agent status
- `DELETE /delete/:id` - Delete agent
- `GET /hierarchy/:assemblyId` - Get polling centers and booths

## File Structure

```
booth-management/
├── components/
│   └── BoothAgentForm.tsx       # Form for creating/editing agents
├── pages/
│   ├── BoothManagementDashboard.tsx
│   ├── AllAgentsPage.tsx
│   ├── BoothInsideTeamPage.tsx
│   ├── BoothOutsideTeamPage.tsx
│   ├── PollingSupportTeamPage.tsx
│   ├── BoothAgentsList.tsx      # Reusable listing component
│   └── index.ts
├── services/
│   └── boothAgentApi.ts         # API service layer
├── types/
│   └── index.ts                 # TypeScript types
└── README.md
```

## Usage

### Creating an Agent

1. Navigate to any booth management page
2. Click "Add New Agent"
3. Fill in the required fields:
   - Category (required)
   - Role (required, based on category)
   - Name (required)
   - Phone (required, 10 digits)
   - Email (optional)
   - Password (required for new agents)
4. Optionally select polling center and booths
5. Set device availability (Android Phone, Laptop, Two Wheeler, Four Wheeler)
6. Click "Create Agent"

### Editing an Agent

1. Find the agent in the listing
2. Click "Edit"
3. Update the fields
4. Password is optional when editing
5. Click "Update Agent"

### Filtering Agents

- Use the search box to search by name, phone, or email
- Use the status dropdown to filter by Active/Inactive
- Results update automatically

## Notes

- Phone numbers must be exactly 10 digits
- Email validation is performed
- Password must be at least 8 characters for new agents
- Agents can be linked to multiple booths
- Status can be toggled between Active/Inactive
- Soft delete is used (agents are marked as deleted, not removed)
