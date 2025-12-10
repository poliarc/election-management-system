# Booth Management - Troubleshooting Guide

## Common Issues and Solutions

### 1. Booth Management Menu Not Visible in Sidebar

**Problem**: Can't see "Booth Management" in the sidebar

**Solutions**:

- Ensure you're logged in as an Assembly level user
- Check that you're on the Assembly dashboard (URL should start with `/assembly/`)
- Refresh the page
- Clear browser cache and reload

### 2. Polling Centers Not Loading

**Problem**: Polling center dropdown is empty or shows "Loading..."

**Solutions**:

- Check that your assembly has polling centers configured in the system
- Verify API endpoint: `GET /api/booth-agents/hierarchy/:assemblyId`
- Check browser console for API errors
- Ensure you have proper authentication token
- Try logging out and logging back in

**Debug Steps**:

```javascript
// Open browser console and check:
localStorage.getItem("token"); // Should return a token
localStorage.getItem("user"); // Should contain user data with assembly_id
```

### 3. Booths Not Appearing

**Problem**: Booth selection area is empty after selecting polling center

**Solutions**:

- Ensure the selected polling center has booths configured
- Check that booths are active in the system
- Verify the polling center has `booths` array in API response
- Try selecting a different polling center

**Note**: Booth selection is hidden for "Polling Center Support Team" category

### 4. Form Validation Errors

**Problem**: Can't submit form, getting validation errors

**Common Validation Issues**:

| Field           | Requirement                     | Error Message                                                     |
| --------------- | ------------------------------- | ----------------------------------------------------------------- |
| Category        | Required                        | "Category is required"                                            |
| Role            | Required                        | "Role is required"                                                |
| Name            | Required                        | "Name is required"                                                |
| Phone           | Required, 10 digits             | "Phone is required" / "Phone must be 10 digits"                   |
| Alternate Phone | Optional, 10 digits if provided | "Alternate number must be 10 digits"                              |
| Email           | Optional, valid format          | "Invalid email"                                                   |
| Password        | Required for new (8+ chars)     | "Password is required" / "Password must be at least 8 characters" |

**Solutions**:

- Check all required fields are filled
- Ensure phone numbers contain only digits (no spaces, dashes, or parentheses)
- Verify email format (must contain @ and domain)
- For new agents, password must be at least 8 characters
- When editing, password is optional

### 5. API Errors

**Problem**: Getting error messages when creating/updating agents

**Common API Errors**:

| Error Code | Message                       | Solution                      |
| ---------- | ----------------------------- | ----------------------------- |
| 409        | "Email already exists"        | Use a different email address |
| 409        | "Phone number already exists" | Use a different phone number  |
| 400        | "Invalid polling_center_id"   | Select a valid polling center |
| 401        | "Unauthorized"                | Log out and log back in       |
| 500        | "Database operation failed"   | Contact administrator         |

**Solutions**:

- Read the error message carefully
- For duplicate errors, check if agent already exists
- For authentication errors, try logging out and back in
- For server errors, contact system administrator

### 6. Status Toggle Not Working

**Problem**: Clicking status badge doesn't change agent status

**Solutions**:

- Check browser console for errors
- Verify you have permission to update agents
- Ensure agent is not deleted (isDelete = 0)
- Try refreshing the page and trying again
- Check API endpoint: `PATCH /api/booth-agents/:id/toggle-status`

### 7. Search Not Working

**Problem**: Search box doesn't filter results

**Solutions**:

- Type at least 2-3 characters
- Wait a moment for results to load
- Check that you're searching in the correct field (name, phone, or email)
- Try clearing the search and starting over
- Refresh the page

### 8. Pagination Issues

**Problem**: Can't navigate between pages or pages show wrong data

**Solutions**:

- Check that total pages is greater than 1
- Verify pagination controls are visible at bottom of table
- Try clicking "Previous" or "Next" buttons
- Check browser console for errors
- Refresh the page

### 9. Dashboard Statistics Not Loading

**Problem**: Dashboard shows 0 for all statistics or loading forever

**Solutions**:

- Check that agents exist in the system
- Verify API endpoints are accessible
- Check browser console for errors
- Try refreshing the page
- Clear browser cache

### 10. Role Dropdown Empty

**Problem**: Role dropdown is empty after selecting category

**Solutions**:

- Ensure you've selected a category first
- Check that the category is valid
- Try selecting a different category and then back
- Refresh the page

**Role Mapping**:

- Booth Inside Team → Booth Agent, Table Coordinator
- Booth Outside Team → Voter Field Coordination
- Polling Center Support Team → Polling Center Incharge, Water Incharge, Food Incharge

### 11. File Upload Issues

**Problem**: Can't upload photos or documents

**Solutions**:

- Check file size (should be reasonable, < 5MB)
- Verify file format (images: jpg, png; documents: pdf)
- Ensure you have stable internet connection
- Try a different file
- Check browser console for errors

### 12. Edit Form Not Populating Data

**Problem**: When clicking "Edit", form is empty

**Solutions**:

- Check that agent data exists
- Verify API endpoint: `GET /api/booth-agents/single/:id`
- Check browser console for errors
- Try refreshing and editing again
- Ensure agent is not deleted

### 13. Delete Not Working

**Problem**: Can't delete agents

**Solutions**:

- Confirm the deletion when prompted
- Check that you have permission to delete
- Verify API endpoint: `DELETE /api/booth-agents/delete/:id`
- Check browser console for errors
- Note: This is a soft delete (agent is marked as deleted, not removed)

## Browser Console Debugging

### How to Open Browser Console

- **Chrome/Edge**: Press F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
- **Firefox**: Press F12 or Ctrl+Shift+K (Cmd+Option+K on Mac)
- **Safari**: Enable Developer menu, then press Cmd+Option+C

### What to Look For

1. **Red errors**: API failures, JavaScript errors
2. **Network tab**: Check API requests and responses
3. **Console tab**: Check for error messages
4. **Application tab**: Check localStorage for token and user data

### Common Console Errors

```javascript
// Authentication Error
"Failed to fetch" or "401 Unauthorized"
→ Solution: Log out and log back in

// Network Error
"Network request failed"
→ Solution: Check internet connection

// API Error
"500 Internal Server Error"
→ Solution: Contact administrator

// CORS Error
"Access-Control-Allow-Origin"
→ Solution: Contact administrator (backend configuration issue)
```

## API Testing

### Test API Endpoints Manually

Using browser console or Postman:

```javascript
// Get token
const token = localStorage.getItem("token");

// Test get all agents
fetch("https://backend.peopleconnect.in/api/booth-agents/all", {
  headers: { Authorization: token },
})
  .then((r) => r.json())
  .then(console.log);

// Test get polling centers
const user = JSON.parse(localStorage.getItem("user"));
fetch(
  `https://backend.peopleconnect.in/api/booth-agents/hierarchy/${user.assembly_id}`,
  {
    headers: { Authorization: token },
  }
)
  .then((r) => r.json())
  .then(console.log);
```

## Performance Issues

### Slow Loading

**Solutions**:

- Check internet connection speed
- Reduce page size (use pagination)
- Clear browser cache
- Close unnecessary browser tabs
- Check if backend server is slow

### Memory Issues

**Solutions**:

- Close and reopen browser
- Clear browser cache
- Reduce number of open tabs
- Restart browser

## Contact Support

If issues persist after trying these solutions:

1. **Collect Information**:

   - What were you trying to do?
   - What error message did you see?
   - Screenshot of the error
   - Browser console errors
   - Steps to reproduce

2. **Contact**:
   - Email: support@example.com
   - Include all collected information
   - Mention "Booth Management Module"

## Preventive Measures

1. **Regular Maintenance**:

   - Clear browser cache weekly
   - Keep browser updated
   - Check for system updates

2. **Best Practices**:

   - Don't open too many tabs
   - Log out when done
   - Use strong, unique passwords
   - Don't share login credentials

3. **Data Entry**:
   - Double-check phone numbers
   - Use valid email addresses
   - Keep passwords secure
   - Save work frequently

## Known Limitations

1. Phone numbers must be exactly 10 digits (Indian format)
2. Email validation is basic (checks for @ and domain)
3. File uploads have size limits
4. Pagination shows 10 items per page by default
5. Search is case-insensitive but requires exact matches
6. Soft delete means deleted agents are hidden, not removed

## Future Improvements

These features are planned for future releases:

- Bulk upload from Excel
- Export to Excel
- Advanced search filters
- Agent profile pages
- Assignment history
- Performance metrics
- Email notifications
- Mobile app
