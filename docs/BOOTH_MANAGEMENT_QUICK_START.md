# Booth Management - Quick Start Guide

## Accessing Booth Management

1. Login to the application as an Assembly level user
2. In the sidebar, find the "Booth Management" dropdown
3. Click to expand and see all available options:
   - Dashboard
   - Booth Agents (All)
   - Booth Inside Team
   - Booth Outside Team
   - Polling Center Support Team

## Creating a New Agent

1. Navigate to any Booth Management page
2. Click the "Add New Agent" button (top right)
3. Fill in the form:
   - **Category** (Required): Select from dropdown
   - **Role** (Required): Select based on category
   - **Name** (Required): Enter agent's full name
   - **Father Name** (Optional)
   - **Phone** (Required): 10-digit number
   - **Alternate Phone** (Optional): 10-digit number
   - **Email** (Optional)
   - **Password** (Required): Minimum 8 characters
   - **Polling Center** (Optional): Select from dropdown
   - **Booths** (Optional): Select one or more booths (only if polling center selected)
   - **Address** (Optional)
   - **Devices**: Select Yes/No for Android Phone, Laptop, Two Wheeler, Four Wheeler
4. Click "Create Agent"

## Editing an Agent

1. Find the agent in the listing
2. Click "Edit" in the Actions column
3. Update the fields (password is optional when editing)
4. Click "Update Agent"

## Toggling Agent Status

1. Find the agent in the listing
2. Click on the status badge (Active/Inactive)
3. Status will toggle immediately

## Deleting an Agent

1. Find the agent in the listing
2. Click "Delete" in the Actions column
3. Confirm the deletion
4. Agent will be soft-deleted (marked as deleted, not removed)

## Searching for Agents

1. Use the search box at the top of any listing page
2. Type name, phone number, or email
3. Results update automatically

## Filtering by Status

1. Use the "Status" dropdown
2. Select "All", "Active", or "Inactive"
3. Results update automatically

## Viewing Dashboard Statistics

1. Navigate to "Booth Management > Dashboard"
2. View statistics cards:
   - Total Agents
   - Booth Inside Team count
   - Booth Outside Team count
   - Polling Support count
   - Active agents
   - Inactive agents
3. Click any card to navigate to filtered view
4. View recent agents table at the bottom

## Category-Specific Pages

### Booth Inside Team

- Shows only Booth Agents and Table Coordinators
- Access via "Booth Management > Booth Inside Team"

### Booth Outside Team

- Shows only Voter Field Coordination agents
- Access via "Booth Management > Booth Outside Team"

### Polling Center Support Team

- Shows only Polling Center Incharge, Water Incharge, and Food Incharge
- Access via "Booth Management > Polling Center Support Team"
- Note: Booth selection is hidden for this category

## Tips

- **Required Fields**: Fields marked with \* are required
- **Phone Validation**: Phone numbers must be exactly 10 digits
- **Password**: Only required when creating new agents, optional when editing
- **Polling Center**: Must select polling center before booths appear
- **Multiple Booths**: You can assign an agent to multiple booths by checking multiple checkboxes
- **Status Toggle**: Click the status badge to quickly activate/deactivate agents
- **Pagination**: Use Previous/Next buttons at the bottom to navigate through pages

## Troubleshooting

### Polling Centers Not Loading

- Ensure you're logged in as an Assembly level user
- Check that your assembly has polling centers configured
- Refresh the page

### Booths Not Appearing

- Make sure you've selected a polling center first
- Check that the selected polling center has booths configured

### Form Validation Errors

- Check all required fields are filled
- Ensure phone numbers are exactly 10 digits
- Ensure email is in valid format
- Ensure password is at least 8 characters (for new agents)

### API Errors

- Check your internet connection
- Ensure you're logged in
- Contact administrator if error persists

## API Reference

For developers, see `BOOTH_MANAGEMENT_AGENT_API_GUIDE.md` for complete API documentation.
