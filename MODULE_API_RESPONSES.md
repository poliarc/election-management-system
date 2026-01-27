# Module API Responses Documentation

This document contains all API responses for the Module Management System, formatted like Postman test results.

## Module Master APIs

### 1. Create Module Master

**POST** `/api/modules/master/create`

**Request:**
```json
{
  "moduleName": "Campaign Management",
  "displayName": "Campaign",
  "isActive": true,
  "isDefault": false
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Module created successfully",
  "data": {
    "module_id": 1,
    "moduleName": "Campaign Management",
    "displayName": "Campaign",
    "isActive": 1,
    "isDelete": 0,
    "isDefault": 0,
    "created_at": "2026-01-21T10:30:00.000Z",
    "updated_at": "2026-01-21T10:30:00.000Z"
  }
}
```

**Error Response:** `409 Conflict` (Duplicate module name)
```json
{
  "success": false,
  "message": "Module name already exists",
  "error": "DUPLICATE_MODULE_NAME"
}
```

**Error Response:** `400 Bad Request` (Validation error)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "moduleName",
      "message": "moduleName is required"
    }
  ]
}
```

---

### 2. List All Module Masters

**GET** `/api/modules/master/all?page=1&limit=10&search=campaign&isActive=true`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Modules retrieved successfully",
  "data": [
    {
      "module_id": 1,
      "moduleName": "Campaign Management",
      "displayName": "Campaign",
      "isActive": 1,
      "isDelete": 0,
      "isDefault": 0,
      "created_at": "2026-01-21T10:30:00.000Z",
      "updated_at": "2026-01-21T10:30:00.000Z"
    },
    {
      "module_id": 2,
      "moduleName": "User Management",
      "displayName": "Users",
      "isActive": 1,
      "isDelete": 0,
      "isDefault": 1,
      "created_at": "2026-01-21T10:35:00.000Z",
      "updated_at": "2026-01-21T10:35:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

**Response:** `200 OK` (Empty result)
```json
{
  "success": true,
  "message": "Modules retrieved successfully",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 1
  }
}
```

---

### 3. Get Active Module Masters

**GET** `/api/modules/master/active`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Active modules retrieved successfully",
  "data": [
    {
      "module_id": 1,
      "moduleName": "Campaign Management",
      "displayName": "Campaign",
      "isActive": 1,
      "isDelete": 0,
      "isDefault": 0,
      "created_at": "2026-01-21T10:30:00.000Z",
      "updated_at": "2026-01-21T10:30:00.000Z"
    },
    {
      "module_id": 2,
      "moduleName": "User Management",
      "displayName": "Users",
      "isActive": 1,
      "isDelete": 0,
      "isDefault": 1,
      "created_at": "2026-01-21T10:35:00.000Z",
      "updated_at": "2026-01-21T10:35:00.000Z"
    }
  ]
}
```

---

### 4. Get Module Master by ID

**GET** `/api/modules/master/1`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Module retrieved successfully",
  "data": {
    "module_id": 1,
    "moduleName": "Campaign Management",
    "displayName": "Campaign",
    "isActive": 1,
    "isDelete": 0,
    "isDefault": 0,
    "created_at": "2026-01-21T10:30:00.000Z",
    "updated_at": "2026-01-21T10:30:00.000Z"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "message": "Module not found",
  "error": "MODULE_NOT_FOUND"
}
```

**Error Response:** `400 Bad Request` (Invalid ID)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "id",
      "message": "Invalid module ID"
    }
  ]
}
```

---

### 5. Update Module Master

**PUT** `/api/modules/master/1`

**Request:**
```json
{
  "displayName": "Campaign Manager",
  "isDefault": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Module updated successfully",
  "data": {
    "module_id": 1,
    "moduleName": "Campaign Management",
    "displayName": "Campaign Manager",
    "isActive": 1,
    "isDelete": 0,
    "isDefault": 1,
    "created_at": "2026-01-21T10:30:00.000Z",
    "updated_at": "2026-01-21T11:15:00.000Z"
  }
}
```

**Error Response:** `400 Bad Request` (No fields to update)
```json
{
  "success": false,
  "message": "No fields to update",
  "error": "NO_UPDATE_FIELDS"
}
```

---

### 6. Activate Module Master

**PATCH** `/api/modules/master/1/activate`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Module activated successfully",
  "data": {
    "module_id": 1,
    "moduleName": "Campaign Management",
    "displayName": "Campaign Manager",
    "isActive": 1,
    "isDelete": 0,
    "isDefault": 1,
    "created_at": "2026-01-21T10:30:00.000Z",
    "updated_at": "2026-01-21T11:20:00.000Z"
  }
}
```

---

### 7. Deactivate Module Master

**PATCH** `/api/modules/master/1/deactivate`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Module deactivated successfully",
  "data": {
    "module_id": 1,
    "moduleName": "Campaign Management",
    "displayName": "Campaign Manager",
    "isActive": 0,
    "isDelete": 0,
    "isDefault": 1,
    "created_at": "2026-01-21T10:30:00.000Z",
    "updated_at": "2026-01-21T11:25:00.000Z"
  }
}
```

---

### 8. Delete Module Master

**DELETE** `/api/modules/master/1`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Module deleted successfully"
}
```

---

## Module Level Access APIs

### 1. Create Module Level Access

**POST** `/api/modules/access/create`

**Request:**
```json
{
  "module_id": 1,
  "state_id": 1,
  "party_id": 1,
  "party_level_id": 1,
  "isDisplay": true,
  "isActive": true
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Module access created successfully",
  "data": {
    "id": 1,
    "module_id": 1,
    "state_id": 1,
    "party_id": 1,
    "party_level_id": 1,
    "isDisplay": 1,
    "isActive": 1,
    "isDelete": 0,
    "created_at": "2026-01-21T11:30:00.000Z",
    "updated_at": "2026-01-21T11:30:00.000Z"
  }
}
```

**Error Response:** `404 Not Found` (Module not found)
```json
{
  "success": false,
  "message": "Module not found",
  "error": "MODULE_NOT_FOUND"
}
```

**Error Response:** `404 Not Found` (State not found)
```json
{
  "success": false,
  "message": "State not found",
  "error": "STATE_NOT_FOUND"
}
```

**Error Response:** `404 Not Found` (Party not found)
```json
{
  "success": false,
  "message": "Party not found",
  "error": "PARTY_NOT_FOUND"
}
```

**Error Response:** `404 Not Found` (Party level not found)
```json
{
  "success": false,
  "message": "Party level not found",
  "error": "PARTY_LEVEL_NOT_FOUND"
}
```

**Error Response:** `409 Conflict` (Duplicate access)
```json
{
  "success": false,
  "message": "Module access already exists for this combination",
  "error": "DUPLICATE_MODULE_ACCESS"
}
```

---

### 2. List Module Level Access

**GET** `/api/modules/access/all?page=1&limit=10&state_id=1&party_id=1`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Module access list retrieved successfully",
  "data": [
    {
      "id": 1,
      "module_id": 1,
      "state_id": 1,
      "party_id": 1,
      "party_level_id": 1,
      "isDisplay": 1,
      "isActive": 1,
      "isDelete": 0,
      "created_at": "2026-01-21T11:30:00.000Z",
      "updated_at": "2026-01-21T11:30:00.000Z",
      "moduleName": "Campaign Management",
      "moduleDisplayName": "Campaign Manager",
      "state_name": "Maharashtra",
      "partyName": "BJP",
      "level_name": "District",
      "display_level_name": "District Level"
    },
    {
      "id": 2,
      "module_id": 2,
      "state_id": 1,
      "party_id": 1,
      "party_level_id": 1,
      "isDisplay": 1,
      "isActive": 1,
      "isDelete": 0,
      "created_at": "2026-01-21T11:35:00.000Z",
      "updated_at": "2026-01-21T11:35:00.000Z",
      "moduleName": "User Management",
      "moduleDisplayName": "Users",
      "state_name": "Maharashtra",
      "partyName": "BJP",
      "level_name": "District",
      "display_level_name": "District Level"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

---

### 3. Get Module Level Access by ID

**GET** `/api/modules/access/1`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Module access retrieved successfully",
  "data": {
    "id": 1,
    "module_id": 1,
    "state_id": 1,
    "party_id": 1,
    "party_level_id": 1,
    "isDisplay": 1,
    "isActive": 1,
    "isDelete": 0,
    "created_at": "2026-01-21T11:30:00.000Z",
    "updated_at": "2026-01-21T11:30:00.000Z",
    "moduleName": "Campaign Management",
    "moduleDisplayName": "Campaign Manager",
    "state_name": "Maharashtra",
    "partyName": "BJP",
    "level_name": "District",
    "display_level_name": "District Level"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "message": "Module access not found",
  "error": "MODULE_ACCESS_NOT_FOUND"
}
```

---

### 4. Update Module Level Access

**PUT** `/api/modules/access/1`

**Request:**
```json
{
  "isDisplay": false,
  "isActive": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Module access updated successfully",
  "data": {
    "id": 1,
    "module_id": 1,
    "state_id": 1,
    "party_id": 1,
    "party_level_id": 1,
    "isDisplay": 0,
    "isActive": 1,
    "isDelete": 0,
    "created_at": "2026-01-21T11:30:00.000Z",
    "updated_at": "2026-01-21T12:00:00.000Z"
  }
}
```

---

### 5. Activate Module Level Access

**PATCH** `/api/modules/access/1/activate`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Module access activated successfully",
  "data": {
    "id": 1,
    "module_id": 1,
    "state_id": 1,
    "party_id": 1,
    "party_level_id": 1,
    "isDisplay": 0,
    "isActive": 1,
    "isDelete": 0,
    "created_at": "2026-01-21T11:30:00.000Z",
    "updated_at": "2026-01-21T12:05:00.000Z"
  }
}
```

---

### 6. Deactivate Module Level Access

**PATCH** `/api/modules/access/1/deactivate`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Module access deactivated successfully",
  "data": {
    "id": 1,
    "module_id": 1,
    "state_id": 1,
    "party_id": 1,
    "party_level_id": 1,
    "isDisplay": 0,
    "isActive": 0,
    "isDelete": 0,
    "created_at": "2026-01-21T11:30:00.000Z",
    "updated_at": "2026-01-21T12:10:00.000Z"
  }
}
```

---

### 7. Delete Module Level Access

**DELETE** `/api/modules/access/1`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Module access deleted successfully"
}
```

---

## Main Sidebar API

### Get Sidebar Modules

**GET** `/api/modules/sidebar?state_id=1&party_id=1&party_level_id=1`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Sidebar modules retrieved successfully",
  "data": [
    {
      "module_id": 2,
      "moduleName": "User Management",
      "displayName": "Users",
      "isDefault": 1,
      "isDisplay": 1,
      "accessActive": 1
    },
    {
      "module_id": 1,
      "moduleName": "Campaign Management",
      "displayName": "Campaign Manager",
      "isDefault": 0,
      "isDisplay": 1,
      "accessActive": 1
    }
  ]
}
```

**Response:** `200 OK` (No modules found)
```json
{
  "success": true,
  "message": "Sidebar modules retrieved successfully",
  "data": []
}
```

**Error Response:** `400 Bad Request` (Missing required parameters)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "state_id",
      "message": "state_id is required"
    },
    {
      "field": "party_id",
      "message": "party_id is required"
    },
    {
      "field": "party_level_id",
      "message": "party_level_id is required"
    }
  ]
}
```

---

## Common Error Responses

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "INTERNAL_ERROR"
}
```

### 400 Bad Request (General Validation)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field validation message"
    }
  ]
}
```

### 401 Unauthorized (if authentication is implemented)
```json
{
  "success": false,
  "message": "Unauthorized access",
  "error": "UNAUTHORIZED"
}
```

### 403 Forbidden (if authorization is implemented)
```json
{
  "success": false,
  "message": "Access forbidden",
  "error": "FORBIDDEN"
}
```

---

## Testing Scenarios

### Scenario 1: Complete Module Setup Flow

1. **Create Module Master**
   - POST `/api/modules/master/create` → 201 Created
   
2. **Create Module Access**
   - POST `/api/modules/access/create` → 201 Created
   
3. **Get Sidebar Modules**
   - GET `/api/modules/sidebar?state_id=1&party_id=1&party_level_id=1` → 200 OK with modules

### Scenario 2: Error Handling Flow

1. **Create Duplicate Module**
   - POST `/api/modules/master/create` (same name) → 409 Conflict
   
2. **Access Non-existent Module**
   - GET `/api/modules/master/999` → 404 Not Found
   
3. **Create Access with Invalid References**
   - POST `/api/modules/access/create` (invalid module_id) → 404 Not Found

### Scenario 3: Filtering and Search

1. **Search Modules**
   - GET `/api/modules/master/all?search=campaign` → 200 OK with filtered results
   
2. **Filter by Active Status**
   - GET `/api/modules/master/all?isActive=true` → 200 OK with active modules only
   
3. **Filter Access by State**
   - GET `/api/modules/access/all?state_id=1` → 200 OK with state-specific access

---

## Response Headers

All successful responses include:
```
Content-Type: application/json
X-Powered-By: Express
```

All error responses include:
```
Content-Type: application/json
X-Powered-By: Express
```

## Status Code Summary

- `200 OK` - Successful GET, PUT, PATCH, DELETE operations
- `201 Created` - Successful POST operations
- `400 Bad Request` - Validation errors, missing required fields
- `401 Unauthorized` - Authentication required (if implemented)
- `403 Forbidden` - Access denied (if implemented)
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `500 Internal Server Error` - Server errors