# Booth Management Agent API Documentation

## Overview

This API manages booth management agents for polling centers. Agents are categorized into three teams:

- **Booth Inside Team**: Booth Agent, Table Coordinator
- **Booth Outside Team**: Voter Field Coordination
- **Polling Center Support Team**: Polling Center Incharge, Water Incharge, Food Incharge

## Base URL

```
http://localhost:5000/api/booth-agents
```

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## API Endpoints

### 1. Create Booth Agent

**POST** `/api/booth-agents/create`

Creates a new booth management agent.

#### Required Fields

- `category` (enum): "Booth Inside Team", "Booth Outside Team", or "Polling Center Support Team"
- `role` (enum): Must match the category
- `name` (string): Agent's full name
- `phone` (string): 10-digit phone number
- `email` (string): Valid email address
- `password` (string): Min 8 chars, must contain uppercase, lowercase, number, and special char (@$\_-\*#)

#### Optional Fields

- `father_name` (string)
- `alternate_no` (string): 10-digit phone number
- `address` (string)
- `aadhar_card` (string)
- `photo` (string)
- `voter_id_file` (string)
- `android_phone` (enum): "Yes" or "No" (default: "No")
- `laptop` (enum): "Yes" or "No" (default: "No")
- `twoWheeler` (enum): "Yes" or "No" (default: "No")
- `fourWheeler` (enum): "Yes" or "No" (default: "No")
- `polling_center_id` (number): ID from afterAssemblyData table where levelName='PollingCenter'
- `status` (number): 0 or 1 (default: 1)

#### Request Example

```json
{
  "category": "Booth Inside Team",
  "role": "Booth Agent",
  "name": "Rajesh Kumar",
  "father_name": "Suresh Kumar",
  "phone": "9876543210",
  "alternate_no": "9876543211",
  "email": "rajesh.kumar@example.com",
  "password": "SecurePass@123",
  "address": "123 Main Street, Delhi",
  "aadhar_card": "1234-5678-9012",
  "android_phone": "Yes",
  "laptop": "No",
  "twoWheeler": "Yes",
  "fourWheeler": "No",
  "polling_center_id": 45,
  "status": 1
}
```

#### Success Response (201)

```json
{
  "success": true,
  "message": "Booth management agent created successfully",
  "data": {
    "agent_id": 1,
    "category": "Booth Inside Team",
    "role": "Booth Agent",
    "name": "Rajesh Kumar",
    "father_name": "Suresh Kumar",
    "phone": "9876543210",
    "alternate_no": "9876543211",
    "email": "rajesh.kumar@example.com",
    "address": "123 Main Street, Delhi",
    "aadhar_card": "1234-5678-9012",
    "photo": null,
    "voter_id_file": null,
    "android_phone": "Yes",
    "laptop": "No",
    "twoWheeler": "Yes",
    "fourWheeler": "No",
    "polling_center_id": 45,
    "polling_center_name": "Polling Center #123",
    "created_at": "2024-12-08T10:30:00.000Z",
    "updated_at": "2024-12-08T10:30:00.000Z",
    "status": 1,
    "isDelete": 0
  }
}
```

#### Error Responses

```json
// 409 - Duplicate Email
{
  "success": false,
  "error": {
    "message": "Email already exists",
    "code": "DUPLICATE_EMAIL",
    "timestamp": "2024-12-08T10:30:00.000Z"
  }
}

// 409 - Duplicate Phone
{
  "success": false,
  "error": {
    "message": "Phone number already exists",
    "code": "DUPLICATE_PHONE",
    "timestamp": "2024-12-08T10:30:00.000Z"
  }
}

// 400 - Invalid Polling Center
{
  "success": false,
  "error": {
    "message": "Invalid polling_center_id or not a polling center",
    "code": "INVALID_POLLING_CENTER_ID",
    "timestamp": "2024-12-08T10:30:00.000Z"
  }
}

// 400 - Validation Error
{
  "success": false,
  "error": {
    "message": "Validation Error",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "path": "role",
        "message": "Role does not match the selected category"
      }
    ],
    "timestamp": "2024-12-08T10:30:00.000Z"
  }
}
```

---

### 2. Get All Booth Agents (with Filters)

**GET** `/api/booth-agents/all`

Retrieves a paginated list of booth agents with optional filters.

#### Query Parameters

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `search` (string, optional): Search by name, email, phone, or father_name
- `category` (string, optional): Filter by category
- `role` (string, optional): Filter by role
- `status` (boolean/string, optional): Filter by status (true/1 or false/0)
- `polling_center_id` (number, optional): Filter by polling center
- `sort_by` (string, optional): Sort field (created_at, name, email, phone, updated_at) - default: created_at
- `order` (string, optional): Sort order (asc, desc) - default: desc

#### Request Example

```
GET /api/booth-agents/all?page=1&limit=10&category=Booth Inside Team&status=1&sort_by=name&order=asc
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Booth management agents retrieved successfully",
  "data": [
    {
      "agent_id": 1,
      "category": "Booth Inside Team",
      "role": "Booth Agent",
      "name": "Rajesh Kumar",
      "father_name": "Suresh Kumar",
      "phone": "9876543210",
      "alternate_no": "9876543211",
      "email": "rajesh.kumar@example.com",
      "address": "123 Main Street, Delhi",
      "aadhar_card": "1234-5678-9012",
      "photo": null,
      "voter_id_file": null,
      "android_phone": "Yes",
      "laptop": "No",
      "twoWheeler": "Yes",
      "fourWheeler": "No",
      "polling_center_id": 45,
      "polling_center_name": "Polling Center #123",
      "created_at": "2024-12-08T10:30:00.000Z",
      "updated_at": "2024-12-08T10:30:00.000Z",
      "status": 1,
      "isDelete": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### 3. Get Booth Inside Team List

**GET** `/api/booth-agents/category/Booth Inside Team`

Retrieves agents from Booth Inside Team (Booth Agent, Table Coordinator).

#### Query Parameters

Same as "Get All Booth Agents" endpoint (page, limit, search, role, status, polling_center_id, sort_by, order)

#### Request Example

```
GET /api/booth-agents/category/Booth%20Inside%20Team?page=1&limit=10&status=1
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Booth Inside Team agents retrieved successfully",
  "data": [
    {
      "agent_id": 1,
      "category": "Booth Inside Team",
      "role": "Booth Agent",
      "name": "Rajesh Kumar",
      "phone": "9876543210",
      "email": "rajesh.kumar@example.com",
      "polling_center_name": "Polling Center #123",
      "status": 1,
      "created_at": "2024-12-08T10:30:00.000Z"
    },
    {
      "agent_id": 2,
      "category": "Booth Inside Team",
      "role": "Table Coordinator",
      "name": "Priya Sharma",
      "phone": "9876543220",
      "email": "priya.sharma@example.com",
      "polling_center_name": "Polling Center #123",
      "status": 1,
      "created_at": "2024-12-08T11:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

---

### 4. Get Booth Outside Team List

**GET** `/api/booth-agents/category/Booth Outside Team`

Retrieves agents from Booth Outside Team (Voter Field Coordination).

#### Request Example

```
GET /api/booth-agents/category/Booth%20Outside%20Team?page=1&limit=10
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Booth Outside Team agents retrieved successfully",
  "data": [
    {
      "agent_id": 10,
      "category": "Booth Outside Team",
      "role": "Voter Field Coordination",
      "name": "Amit Patel",
      "phone": "9876543230",
      "email": "amit.patel@example.com",
      "polling_center_name": "Polling Center #123",
      "status": 1,
      "created_at": "2024-12-08T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "totalPages": 1
  }
}
```

---

### 5. Get Polling Center Support Team List

**GET** `/api/booth-agents/category/Polling Center Support Team`

Retrieves agents from Polling Center Support Team (Polling Center Incharge, Water Incharge, Food Incharge).

#### Request Example

```
GET /api/booth-agents/category/Polling%20Center%20Support%20Team?page=1&limit=10
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Polling Center Support Team agents retrieved successfully",
  "data": [
    {
      "agent_id": 20,
      "category": "Polling Center Support Team",
      "role": "Polling Center Incharge",
      "name": "Sunil Verma",
      "phone": "9876543240",
      "email": "sunil.verma@example.com",
      "polling_center_name": "Polling Center #123",
      "status": 1,
      "created_at": "2024-12-08T09:00:00.000Z"
    },
    {
      "agent_id": 21,
      "category": "Polling Center Support Team",
      "role": "Water Incharge",
      "name": "Kavita Singh",
      "phone": "9876543250",
      "email": "kavita.singh@example.com",
      "polling_center_name": "Polling Center #123",
      "status": 1,
      "created_at": "2024-12-08T09:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 12,
    "totalPages": 2
  }
}
```

---

### 6. Get Single Booth Agent

**GET** `/api/booth-agents/single/:id`

Retrieves a single booth agent by ID.

#### Request Example

```
GET /api/booth-agents/single/1
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Booth management agent retrieved successfully",
  "data": {
    "agent_id": 1,
    "category": "Booth Inside Team",
    "role": "Booth Agent",
    "name": "Rajesh Kumar",
    "father_name": "Suresh Kumar",
    "phone": "9876543210",
    "alternate_no": "9876543211",
    "email": "rajesh.kumar@example.com",
    "address": "123 Main Street, Delhi",
    "aadhar_card": "1234-5678-9012",
    "photo": null,
    "voter_id_file": null,
    "android_phone": "Yes",
    "laptop": "No",
    "twoWheeler": "Yes",
    "fourWheeler": "No",
    "polling_center_id": 45,
    "polling_center_name": "Polling Center #123",
    "created_at": "2024-12-08T10:30:00.000Z",
    "updated_at": "2024-12-08T10:30:00.000Z",
    "status": 1,
    "isDelete": 0
  }
}
```

#### Error Response (404)

```json
{
  "success": false,
  "error": {
    "message": "Booth agent not found",
    "code": "AGENT_NOT_FOUND",
    "timestamp": "2024-12-08T10:30:00.000Z"
  }
}
```

---

### 7. Update Booth Agent

**PUT** `/api/booth-agents/update/:id`

Updates an existing booth agent. All fields are optional.

#### Request Example

```json
PUT /api/booth-agents/update/1

{
  "name": "Rajesh Kumar Updated",
  "phone": "9876543299",
  "address": "456 New Street, Delhi",
  "android_phone": "No",
  "status": 1
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Booth management agent updated successfully",
  "data": {
    "agent_id": 1,
    "category": "Booth Inside Team",
    "role": "Booth Agent",
    "name": "Rajesh Kumar Updated",
    "father_name": "Suresh Kumar",
    "phone": "9876543299",
    "alternate_no": "9876543211",
    "email": "rajesh.kumar@example.com",
    "address": "456 New Street, Delhi",
    "android_phone": "No",
    "status": 1,
    "updated_at": "2024-12-08T14:30:00.000Z"
  }
}
```

---

### 8. Toggle Agent Status

**PATCH** `/api/booth-agents/:id/toggle-status`

Activates or deactivates a booth agent.

#### Request Example

```json
PATCH /api/booth-agents/1/toggle-status

{
  "status": 0
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Booth management agent deactivated successfully",
  "data": {
    "agent_id": 1,
    "name": "Rajesh Kumar",
    "status": 0,
    "updated_at": "2024-12-08T15:00:00.000Z"
  }
}
```

---

### 9. Delete Booth Agent

**DELETE** `/api/booth-agents/delete/:id`

Soft deletes a booth agent (sets isDelete = 1).

#### Request Example

```
DELETE /api/booth-agents/delete/1
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Booth management agent deleted successfully"
}
```

---

## Category and Role Mapping

### Booth Inside Team

- Booth Agent
- Table Coordinator

### Booth Outside Team

- Voter Field Coordination

### Polling Center Support Team

- Polling Center Incharge
- Water Incharge
- Food Incharge

---

## Common Error Codes

| Code                      | Status | Description                   |
| ------------------------- | ------ | ----------------------------- |
| DUPLICATE_EMAIL           | 409    | Email already exists          |
| DUPLICATE_PHONE           | 409    | Phone number already exists   |
| AGENT_NOT_FOUND           | 404    | Agent not found               |
| INVALID_POLLING_CENTER_ID | 400    | Invalid polling center ID     |
| VALIDATION_ERROR          | 400    | Request validation failed     |
| NO_UPDATE_FIELDS          | 400    | No fields provided for update |
| DATABASE_ERROR            | 500    | Database operation failed     |

---

## Testing Tips

1. **Get JWT Token**: First login using `/api/users/login` or `/api/admin-users/login` to get authentication token
2. **Create Polling Center**: Ensure you have a polling center created in `afterAssemblyData` table with `levelName='PollingCenter'`
3. **Test Category Filtering**: Use the category-specific endpoints to filter agents by team
4. **Test Search**: Use the search parameter to find agents by name, email, or phone
5. **Test Pagination**: Try different page and limit values to test pagination

---

## Postman Collection Variables

```json
{
  "base_url": "http://localhost:5000",
  "auth_token": "{{your_jwt_token}}",
  "agent_id": "1",
  "polling_center_id": "45"
}
```

Use these variables in your Postman requests:

- URL: `{{base_url}}/api/booth-agents/all`
- Headers: `Authorization: Bearer {{auth_token}}`

// this api is for polling center and booth get in dropdown select of booth agent form
Api Url = https://backend.peopleconnect.in/api/booth-agents/hierarchy/:assemblyid

// reponse of this api
{
"success": true,
"message": "Polling center hierarchy retrieved successfully",
"data": [
{
"id": 3,
"levelName": "PollingCenter",
"displayName": "Bajali Mandal PollingCenter",
"parentId": 2,
"parentAssemblyId": null,
"partyLevelId": 6,
"isActive": 1,
"created_at": "2025-12-03 14:51:32",
"updated_at": "2025-12-03 14:51:32",
"booths": [],
"boothCount": 0
},
{
"id": 7,
"levelName": "PollingCenter",
"displayName": "Polling Center Mandal bajali",
"parentId": 2,
"parentAssemblyId": null,
"partyLevelId": 6,
"isActive": 1,
"created_at": "2025-12-04 15:34:00",
"updated_at": "2025-12-04 15:34:00",
"booths": [],
"boothCount": 0
}
],
"count": 2
}
