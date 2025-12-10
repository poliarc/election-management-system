# Backend Fix Required for Booth Management Agent Creation

## Issue

The frontend is correctly sending FormData with all required fields, but the backend validation is rejecting the request because `polling_center_id` is received as a string instead of a number.

## Root Cause

When sending data via `multipart/form-data` (required for file uploads), **all form fields are transmitted as strings**. This is standard behavior for FormData in browsers and HTTP multipart requests.

## Current Error

```json
{
  "success": false,
  "error": {
    "message": "Validation Error",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "path": "polling_center_id",
        "message": "Invalid input: expected number, received string"
      }
    ]
  }
}
```

## Backend Fix Required

### Option 1: Type Coercion Middleware (Recommended)

Add a middleware to convert string values to numbers for numeric fields BEFORE validation:

```javascript
// In your route handler, after multer but before validation
const coerceTypes = (req, res, next) => {
  if (req.body.polling_center_id) {
    req.body.polling_center_id = parseInt(req.body.polling_center_id, 10);
  }
  if (req.body.booth_id) {
    req.body.booth_id = parseInt(req.body.booth_id, 10);
  }
  if (req.body.status) {
    req.body.status = parseInt(req.body.status, 10);
  }
  next();
};

// Apply to route
router.post('/create', upload.fields([...]), coerceTypes, validateSchema, createAgent);
```

### Option 2: Update Validation Schema

Modify your Zod/Joi validation schema to accept strings and coerce them to numbers:

```javascript
// Zod example
polling_center_id: z.string().transform(val => parseInt(val, 10)).optional(),

// Or with validation
polling_center_id: z.preprocess(
  (val) => val ? parseInt(String(val), 10) : undefined,
  z.number().int().positive().optional()
),
```

### Option 3: Update Validation to Accept Strings

Change validation to accept strings for numeric fields when using multipart/form-data:

```javascript
polling_center_id: z.union([z.number(), z.string()]).optional(),
```

## Database Schema Notes

### Current Schema Issue

Your schema has:

```sql
booth_id INT
```

But the frontend sends comma-separated booth IDs (e.g., "10,11") for multiple booth assignments.

### Recommended Schema Changes

**Option A: Change to TEXT field**

```sql
booth_id TEXT  -- Store comma-separated IDs
```

**Option B: Create Junction Table (Better for relational integrity)**

```sql
CREATE TABLE boothAgentAssignments (
  assignment_id INT AUTO_INCREMENT PRIMARY KEY,
  agent_id INT NOT NULL,
  booth_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES boothManagementAgent(agent_id) ON DELETE CASCADE,
  FOREIGN KEY (booth_id) REFERENCES afterAssemblyData(id) ON DELETE CASCADE,
  UNIQUE KEY unique_assignment (agent_id, booth_id)
);
```

## Frontend Data Being Sent

The frontend correctly sends:

- `category`: "Booth Inside Team" (string)
- `role`: "Booth Agent" (string)
- `name`: "John Doe" (string)
- `phone`: "1234567890" (string)
- `email`: "test@example.com" (string)
- `password`: "Password123" (string)
- `polling_center_id`: "7" (string - needs backend conversion to number)
- `booth_id`: "10,11" (string - comma-separated IDs)
- `photo`: File object (if uploaded)
- `aadhar_card`: File object (if uploaded)
- `voter_id_file`: File object (if uploaded)
- Other fields...

## Testing in Postman

When testing in Postman with form-data:

1. All text fields are sent as strings
2. Numeric fields need to be sent as strings in form-data
3. The backend should handle type conversion

## Summary

**The frontend is working correctly.** The backend needs to:

1. ✅ Parse multipart/form-data using multer or similar
2. ❌ Convert string values to numbers for numeric fields (NEEDS FIX)
3. ❌ Handle comma-separated booth_id or use junction table (NEEDS FIX)
4. ✅ Then validate the data
5. ✅ Store in database

## Immediate Action Required

Update the backend route handler to convert `polling_center_id` from string to number before validation runs.
