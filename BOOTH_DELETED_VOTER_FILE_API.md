# Booth Deleted Voter File API Documentation

This API allows assembly-level users to upload and manage deleted voter files for specific booths.

## Base URL

```
/api/booth-deleted-voter-files
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Upload Booth Deleted Voter File

**POST** `/create`

Upload a deleted voter file for a specific booth.

**Request:**

- **Content-Type:** `multipart/form-data`
- **Body:**
  - `voterFile` (file): The deleted voter file to upload
  - `stateId` (number): State ID
  - `stateName` (string): State name
  - `districtName` (string): District name
  - `assemblyName` (string): Assembly name
  - `boothId` (number): Target booth ID

**Example:**

```bash
curl -X POST \
  http://localhost:3000/api/booth-deleted-voter-files/create \
  -H 'Authorization: Bearer your-jwt-token' \
  -F 'voterFile=@deleted_voters.csv' \
  -F 'stateId=1' \
  -F 'stateName=Maharashtra' \
  -F 'districtName=Mumbai' \
  -F 'assemblyName=Bandra East' \
  -F 'boothId=123'
```

**Response:**

```json
{
  "success": true,
  "message": "Booth deleted voter file uploaded successfully",
  "data": {
    "id": 1,
    "stateId": 1,
    "stateName": "Maharashtra",
    "districtName": "Mumbai",
    "assemblyName": "Bandra East",
    "boothId": 123,
    "filePath": "https://s3.amazonaws.com/bucket/uploads/2025/01/07/1641234567890-123456789.csv",
    "isActive": 1,
    "isDelete": 0,
    "created_at": "2025-01-07T10:30:00.000Z",
    "updated_at": "2025-01-07T10:30:00.000Z"
  }
}
```

### 2. Get Single File

**GET** `/single/:id`

Retrieve a specific deleted voter file record.

**Parameters:**

- `id` (number): File record ID

**Example:**

```bash
curl -X GET \
  http://localhost:3000/api/booth-deleted-voter-files/single/1 \
  -H 'Authorization: Bearer your-jwt-token'
```

**Response:**

```json
{
  "success": true,
  "message": "Booth deleted voter file retrieved successfully",
  "data": {
    "id": 1,
    "stateId": 1,
    "stateName": "Maharashtra",
    "districtName": "Mumbai",
    "assemblyName": "Bandra East",
    "boothId": 123,
    "filePath": "https://s3.amazonaws.com/bucket/uploads/2025/01/07/1641234567890-123456789.csv",
    "stateNameFromMaster": "Maharashtra",
    "boothNameFromMaster": "Booth 123",
    "created_at": "2025-01-07T10:30:00.000Z",
    "updated_at": "2025-01-07T10:30:00.000Z"
  }
}
```

### 3. List All Files

**GET** `/all`

List all deleted voter files with filtering and pagination.

**Query Parameters:**

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `search` (string, optional): Search in state, district, assembly names, or file path
- `stateId` (number, optional): Filter by state ID
- `boothId` (number, optional): Filter by booth ID
- `stateName` (string, optional): Filter by state name
- `districtName` (string, optional): Filter by district name
- `assemblyName` (string, optional): Filter by assembly name
- `sort_by` (string, optional): Sort field (id, stateName, districtName, assemblyName, created_at)
- `order` (string, optional): Sort order (ASC, DESC)

**Example:**

```bash
curl -X GET \
  "http://localhost:3000/api/booth-deleted-voter-files/all?page=1&limit=10&stateId=1&search=Mumbai" \
  -H 'Authorization: Bearer your-jwt-token'
```

**Response:**

```json
{
  "success": true,
  "message": "Booth deleted voter files retrieved successfully",
  "data": [
    {
      "id": 1,
      "stateId": 1,
      "stateName": "Maharashtra",
      "districtName": "Mumbai",
      "assemblyName": "Bandra East",
      "boothId": 123,
      "filePath": "https://s3.amazonaws.com/bucket/uploads/2025/01/07/1641234567890-123456789.csv",
      "stateNameFromMaster": "Maharashtra",
      "boothNameFromMaster": "Booth 123",
      "created_at": "2025-01-07T10:30:00.000Z",
      "updated_at": "2025-01-07T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 4. Update File Record

**PUT** `/update/:id`

Update a deleted voter file record. Optionally upload a new file.

**Parameters:**

- `id` (number): File record ID

**Request:**

- **Content-Type:** `multipart/form-data`
- **Body (all optional):**
  - `voterFile` (file): New deleted voter file
  - `stateId` (number): State ID
  - `stateName` (string): State name
  - `districtName` (string): District name
  - `assemblyName` (string): Assembly name
  - `boothId` (number): Booth ID

**Example:**

```bash
curl -X PUT \
  http://localhost:3000/api/booth-deleted-voter-files/update/1 \
  -H 'Authorization: Bearer your-jwt-token' \
  -F 'stateName=Updated State Name' \
  -F 'voterFile=@new_deleted_voters.csv'
```

### 5. Delete File Record

**DELETE** `/delete/:id`

Soft delete a deleted voter file record.

**Parameters:**

- `id` (number): File record ID

**Example:**

```bash
curl -X DELETE \
  http://localhost:3000/api/booth-deleted-voter-files/delete/1 \
  -H 'Authorization: Bearer your-jwt-token'
```

**Response:**

```json
{
  "success": true,
  "message": "Booth deleted voter file deleted successfully"
}
```

### 6. Get Files by Booth

**GET** `/booth/:boothId`

Get all deleted voter files for a specific booth.

**Parameters:**

- `boothId` (number): Booth ID

**Query Parameters:**

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)

**Example:**

```bash
curl -X GET \
  "http://localhost:3000/api/booth-deleted-voter-files/booth/123?page=1&limit=5" \
  -H 'Authorization: Bearer your-jwt-token'
```

**Response:**

```json
{
  "success": true,
  "message": "Files retrieved successfully",
  "data": [
    {
      "id": 1,
      "stateId": 1,
      "stateName": "Maharashtra",
      "districtName": "Mumbai",
      "assemblyName": "Bandra East",
      "boothId": 123,
      "filePath": "https://s3.amazonaws.com/bucket/uploads/2025/01/07/1641234567890-123456789.csv",
      "stateNameFromMaster": "Maharashtra",
      "boothNameFromMaster": "Booth 123",
      "created_at": "2025-01-07T10:30:00.000Z",
      "updated_at": "2025-01-07T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "totalPages": 1
  }
}
```

## Authorization Rules

1. **Super Admin**: Can access all files across all booths
2. **Assembly-level Users**: Can only access files for booths they have permission to manage
3. **Booth Access Validation**: Non-super admin users must have access to the specific booth through the `userAfterAssemblyHierarchy` table

## File Upload Specifications

- **Supported File Types**: CSV, TXT, PDF, DOC, DOCX, XLS, XLSX
- **Maximum File Size**: 50MB
- **Storage**: Files are uploaded to AWS S3
- **File Organization**: `uploads/YYYY/MM/DD/timestamp-random.ext`

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "errors": [
      {
        "path": "stateId",
        "message": "State ID is required"
      }
    ]
  }
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "message": "You don't have access to this booth",
    "code": "FORBIDDEN"
  }
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "message": "Booth deleted voter file not found",
    "code": "NOT_FOUND"
  }
}
```

## Database Schema

The `boothDeletedVoterFile` table includes:

- `id`: Auto-increment primary key
- `stateId`: Foreign key to stateMasterData
- `stateName`: State name
- `districtName`: District name
- `assemblyName`: Assembly name
- `boothId`: Foreign key to afterAssemblyData (booth level)
- `filePath`: S3 URL of the uploaded file
- `isActive`: Active status flag
- `isDelete`: Soft delete flag
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
