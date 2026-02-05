# Supporters API Documentation

This document contains all API endpoints for the Supporters module with example requests and responses for testing purposes.

## Base URL
```
/api/supporters
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Create Supporter

**POST** `/api/supporters`

### Request Body
```json
{
  "party_id": 1,
  "state_id": 2,
  "district_id": 3,
  "assembly_id": 4,
  "block_id": 5,
  "mandal_id": 6,
  "booth_id": 7,
  "initials": "Mr",
  "first_name": "John",
  "last_name": "Doe",
  "father_name": "Robert Doe",
  "date_of_birth": "1990-05-15",
  "age": 34,
  "gender": "Male",
  "language": {
    "primary": "English",
    "secondary": ["Hindi", "Spanish"]
  },
  "religion": "Christianity",
  "category": "General",
  "caste": "None",
  "phone_no": "9876543210",
  "whatsapp_no": "9876543210",
  "voter_epic_id": "ABC1234567",
  "address": "123 Main Street, City, State",
  "remarks": "Active supporter"
}
```

### Alternative Language Formats
```json
// Simple string format
"language": "English"

// Array format
"language": ["English", "Hindi", "Spanish"]

// Object format (recommended)
"language": {
  "primary": "English",
  "secondary": ["Hindi", "Spanish"]
}
```

### Success Response (201)
```json
{
  "success": true,
  "message": "Supporter created successfully",
  "data": {
    "supporter_id": 1,
    "party_id": 1,
    "state_id": 2,
    "district_id": 3,
    "assembly_id": 4,
    "block_id": 5,
    "mandal_id": 6,
    "booth_id": 7,
    "initials": "Mr",
    "first_name": "John",
    "last_name": "Doe",
    "father_name": "Robert Doe",
    "date_of_birth": "1990-05-15",
    "age": 34,
    "gender": "Male",
    "language": {
      "primary": "English",
      "secondary": ["Hindi", "Spanish"]
    },
    "religion": "Christianity",
    "category": "General",
    "caste": "None",
    "phone_no": "9876543210",
    "whatsapp_no": "9876543210",
    "voter_epic_id": "ABC1234567",
    "address": "123 Main Street, City, State",
    "remarks": "Active supporter",
    "created_by": 1,
    "isActive": 1,
    "isDelete": 0,
    "created_at": "2024-02-04T10:30:00.000Z",
    "updated_at": "2024-02-04T10:30:00.000Z",
    "party_name": "Democratic Party",
    "state_name": "California",
    "district_name": "Los Angeles",
    "assembly_name": "Assembly District 1",
    "block_name": "Block A",
    "mandal_name": "Mandal 1",
    "booth_name": "Booth 1",
    "created_by_name": "Admin User"
  }
}
```

### Error Response (409) - Duplicate Phone
```json
{
  "success": false,
  "message": "Phone number already exists",
  "error": "DUPLICATE_PHONE"
}
```

### Error Response (409) - Duplicate EPIC ID
```json
{
  "success": false,
  "message": "Voter EPIC ID already exists",
  "error": "DUPLICATE_EPIC_ID"
}
```

---

## 2. Get All Supporters

**GET** `/api/supporters`

### Query Parameters
```
?page=1&limit=10&search=john&party_id=1&state_id=2&district_id=3&assembly_id=4&block_id=5&mandal_id=6&booth_id=7&created_by=1&first_name=John&last_name=Doe&initials=Mr&age=34&age_from=18&age_to=65&gender=Male&language=English&religion=Christianity&category=General&caste=None&isActive=true&created_at_from=2024-01-01&created_at_to=2024-12-31&sortBy=created_at&sortOrder=DESC
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Supporters retrieved successfully",
  "data": [
    {
      "supporter_id": 1,
      "party_id": 1,
      "state_id": 2,
      "district_id": 3,
      "assembly_id": 4,
      "block_id": 5,
      "mandal_id": 6,
      "booth_id": 7,
      "initials": "Mr",
      "first_name": "John",
      "last_name": "Doe",
      "father_name": "Robert Doe",
      "date_of_birth": "1990-05-15",
      "age": 34,
      "gender": "Male",
      "language": {
        "primary": "English",
        "secondary": ["Hindi", "Spanish"]
      },
      "religion": "Christianity",
      "category": "General",
      "caste": "None",
      "phone_no": "9876543210",
      "whatsapp_no": "9876543210",
      "voter_epic_id": "ABC1234567",
      "address": "123 Main Street, City, State",
      "remarks": "Active supporter",
      "created_by": 1,
      "isActive": 1,
      "isDelete": 0,
      "created_at": "2024-02-04T10:30:00.000Z",
      "updated_at": "2024-02-04T10:30:00.000Z",
      "party_name": "Democratic Party",
      "state_name": "California",
      "district_name": "Los Angeles",
      "assembly_name": "Assembly District 1",
      "block_name": "Block A",
      "mandal_name": "Mandal 1",
      "booth_name": "Booth 1",
      "created_by_name": "Admin User"
    },
    {
      "supporter_id": 2,
      "party_id": 1,
      "state_id": 2,
      "district_id": 3,
      "assembly_id": 4,
      "block_id": 5,
      "mandal_id": null,
      "booth_id": null,
      "initials": "Ms",
      "first_name": "Jane",
      "last_name": "Smith",
      "father_name": "Michael Smith",
      "date_of_birth": "1985-08-22",
      "age": 39,
      "gender": "Female",
      "language": ["English", "French"],
      "religion": "Catholic",
      "category": "OBC",
      "caste": "Smith",
      "phone_no": "9876543211",
      "whatsapp_no": null,
      "voter_epic_id": "XYZ9876543",
      "address": "456 Oak Avenue, City, State",
      "remarks": "New supporter",
      "created_by": 1,
      "isActive": 1,
      "isDelete": 0,
      "created_at": "2024-02-04T11:00:00.000Z",
      "updated_at": "2024-02-04T11:00:00.000Z",
      "party_name": "Democratic Party",
      "state_name": "California",
      "district_name": "Los Angeles",
      "assembly_name": "Assembly District 1",
      "block_name": "Block A",
      "mandal_name": null,
      "booth_name": null,
      "created_by_name": "Admin User"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "pages": 1
  }
}
```

---

## 3. Get Supporter by ID

**GET** `/api/supporters/:id`

### Example: GET `/api/supporters/1`

### Success Response (200)
```json
{
  "success": true,
  "message": "Supporter retrieved successfully",
  "data": {
    "supporter_id": 1,
    "party_id": 1,
    "state_id": 2,
    "district_id": 3,
    "assembly_id": 4,
    "block_id": 5,
    "mandal_id": 6,
    "booth_id": 7,
    "initials": "Mr",
    "first_name": "John",
    "last_name": "Doe",
    "father_name": "Robert Doe",
    "date_of_birth": "1990-05-15",
    "age": 34,
    "gender": "Male",
    "language": {
      "primary": "English",
      "secondary": ["Hindi", "Spanish"]
    },
    "religion": "Christianity",
    "category": "General",
    "caste": "None",
    "phone_no": "9876543210",
    "whatsapp_no": "9876543210",
    "voter_epic_id": "ABC1234567",
    "address": "123 Main Street, City, State",
    "remarks": "Active supporter",
    "created_by": 1,
    "isActive": 1,
    "isDelete": 0,
    "created_at": "2024-02-04T10:30:00.000Z",
    "updated_at": "2024-02-04T10:30:00.000Z",
    "party_name": "Democratic Party",
    "state_name": "California",
    "district_name": "Los Angeles",
    "assembly_name": "Assembly District 1",
    "block_name": "Block A",
    "mandal_name": "Mandal 1",
    "booth_name": "Booth 1",
    "created_by_name": "Admin User"
  }
}
```

### Error Response (404)
```json
{
  "success": false,
  "message": "Supporter not found",
  "error": "SUPPORTER_NOT_FOUND"
}
```

---

## 4. Update Supporter

**PUT** `/api/supporters/:id`

### Example: PUT `/api/supporters/1`

### Request Body
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "age": 35,
  "gender": "Male",
  "phone_no": "9876543211",
  "address": "456 New Street, City, State",
  "language": ["English", "Hindi"],
  "religion": "Hindu",
  "remarks": "Updated supporter information"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Supporter updated successfully",
  "data": {
    "supporter_id": 1,
    "party_id": 1,
    "state_id": 2,
    "district_id": 3,
    "assembly_id": 4,
    "block_id": 5,
    "mandal_id": 6,
    "booth_id": 7,
    "initials": "Mr",
    "first_name": "John",
    "last_name": "Smith",
    "father_name": "Robert Doe",
    "date_of_birth": "1990-05-15",
    "age": 35,
    "gender": "Male",
    "language": ["English", "Hindi"],
    "religion": "Hindu",
    "category": "General",
    "caste": "None",
    "phone_no": "9876543211",
    "whatsapp_no": "9876543210",
    "voter_epic_id": "ABC1234567",
    "address": "456 New Street, City, State",
    "remarks": "Updated supporter information",
    "created_by": 1,
    "isActive": 1,
    "isDelete": 0,
    "created_at": "2024-02-04T10:30:00.000Z",
    "updated_at": "2024-02-04T11:00:00.000Z",
    "party_name": "Democratic Party",
    "state_name": "California",
    "district_name": "Los Angeles",
    "assembly_name": "Assembly District 1",
    "block_name": "Block A",
    "mandal_name": "Mandal 1",
    "booth_name": "Booth 1",
    "created_by_name": "Admin User"
  }
}
```

---

## 5. Toggle Supporter Status

**PATCH** `/api/supporters/:id/status`

### Example: PATCH `/api/supporters/1/status`

### Request Body
```json
{
  "isActive": false
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Supporter deactivated successfully"
}
```

---

## 6. Delete Supporter

**DELETE** `/api/supporters/:id`

### Example: DELETE `/api/supporters/1`

### Success Response (200)
```json
{
  "success": true,
  "message": "Supporter deleted successfully"
}
```

---

## 7. Get Supporter Statistics

**GET** `/api/supporters/stats`

### Query Parameters
```
?party_id=1&state_id=2&district_id=3&assembly_id=4&block_id=5&created_by=1&date_from=2024-01-01&date_to=2024-12-31
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Supporter statistics retrieved successfully",
  "data": {
    "overview": {
      "total_supporters": 150,
      "active_supporters": 140,
      "inactive_supporters": 10,
      "supporters_with_epic": 120,
      "supporters_with_whatsapp": 130,
      "today_supporters": 5,
      "week_supporters": 25,
      "month_supporters": 80
    },
    "by_location": [
      {
        "state_id": 2,
        "state_name": "California",
        "supporter_count": 150
      }
    ],
    "top_contributors": [
      {
        "created_by": 1,
        "contributor_name": "Admin User",
        "supporter_count": 75
      },
      {
        "created_by": 2,
        "contributor_name": "Field Agent",
        "supporter_count": 50
      }
    ],
    "demographics": {
      "by_gender": [
        {"gender": "Male", "count": 85},
        {"gender": "Female", "count": 60},
        {"gender": "Other", "count": 5}
      ],
      "by_age_group": [
        {"age_group": "18-25", "count": 30},
        {"age_group": "26-35", "count": 45},
        {"age_group": "36-50", "count": 50},
        {"age_group": "51-65", "count": 20},
        {"age_group": "65+", "count": 5}
      ],
      "by_religion": [
        {"religion": "Christianity", "count": 60},
        {"religion": "Hindu", "count": 50},
        {"religion": "Islam", "count": 25},
        {"religion": "Other", "count": 15}
      ],
      "by_category": [
        {"category": "General", "count": 80},
        {"category": "OBC", "count": 40},
        {"category": "SC", "count": 20},
        {"category": "ST", "count": 10}
      ],
      "by_language": [
        {"language": "English", "count": 120},
        {"language": "Hindi", "count": 80},
        {"language": "Spanish", "count": 30}
      ]
    }
  }
}
```

---

## 8. Get Supporters by Party

**GET** `/api/supporters/party/:partyId`

### Example: GET `/api/supporters/party/1?page=1&limit=10`

### Success Response (200)
```json
{
  "success": true,
  "message": "Party supporters retrieved successfully",
  "data": [
    {
      "supporter_id": 1,
      "party_id": 1,
      "initials": "Mr",
      "first_name": "John",
      "last_name": "Doe",
      "father_name": "Robert Doe",
      "age": 34,
      "gender": "Male",
      "phone_no": "9876543210",
      "language": {
        "primary": "English",
        "secondary": ["Hindi", "Spanish"]
      },
      "religion": "Christianity",
      "category": "General",
      "party_name": "Democratic Party",
      "state_name": "California",
      "created_at": "2024-02-04T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

## 9. Get Supporters by State

**GET** `/api/supporters/state/:stateId`

### Example: GET `/api/supporters/state/2?page=1&limit=10`

### Success Response (200)
```json
{
  "success": true,
  "message": "State supporters retrieved successfully",
  "data": [
    {
      "supporter_id": 1,
      "state_id": 2,
      "initials": "Mr",
      "first_name": "John",
      "last_name": "Doe",
      "father_name": "Robert Doe",
      "age": 34,
      "gender": "Male",
      "phone_no": "9876543210",
      "language": {
        "primary": "English",
        "secondary": ["Hindi", "Spanish"]
      },
      "party_name": "Democratic Party",
      "state_name": "California",
      "created_at": "2024-02-04T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

## 10. Get Supporters by Party and State

**GET** `/api/supporters/party/:partyId/state/:stateId`

### Example: GET `/api/supporters/party/1/state/2?page=1&limit=10`

### Success Response (200)
```json
{
  "success": true,
  "message": "Party and state supporters retrieved successfully",
  "data": [
    {
      "supporter_id": 1,
      "party_id": 1,
      "state_id": 2,
      "initials": "Mr",
      "first_name": "John",
      "last_name": "Doe",
      "father_name": "Robert Doe",
      "age": 34,
      "gender": "Male",
      "phone_no": "9876543210",
      "language": {
        "primary": "English",
        "secondary": ["Hindi", "Spanish"]
      },
      "party_name": "Democratic Party",
      "state_name": "California",
      "created_at": "2024-02-04T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

## 11. Get Supporters by District

**GET** `/api/supporters/district/:districtId`

### Example: GET `/api/supporters/district/3?page=1&limit=10`

### Success Response (200)
```json
{
  "success": true,
  "message": "District supporters retrieved successfully",
  "data": [
    {
      "supporter_id": 1,
      "district_id": 3,
      "initials": "Mr",
      "first_name": "John",
      "last_name": "Doe",
      "father_name": "Robert Doe",
      "age": 34,
      "gender": "Male",
      "phone_no": "9876543210",
      "language": ["English", "Hindi"],
      "district_name": "Los Angeles",
      "created_at": "2024-02-04T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

## 12. Get Supporters by Assembly

**GET** `/api/supporters/assembly/:assemblyId`

### Example: GET `/api/supporters/assembly/4?page=1&limit=10`

### Success Response (200)
```json
{
  "success": true,
  "message": "Assembly supporters retrieved successfully",
  "data": [
    {
      "supporter_id": 1,
      "assembly_id": 4,
      "initials": "Mr",
      "first_name": "John",
      "last_name": "Doe",
      "father_name": "Robert Doe",
      "age": 34,
      "gender": "Male",
      "phone_no": "9876543210",
      "language": "English",
      "assembly_name": "Assembly District 1",
      "created_at": "2024-02-04T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

## 13. Get Supporters by Block

**GET** `/api/supporters/block/:blockId`

### Example: GET `/api/supporters/block/5?page=1&limit=10`

### Success Response (200)
```json
{
  "success": true,
  "message": "Block supporters retrieved successfully",
  "data": [
    {
      "supporter_id": 1,
      "block_id": 5,
      "initials": "Mr",
      "first_name": "John",
      "last_name": "Doe",
      "father_name": "Robert Doe",
      "age": 34,
      "gender": "Male",
      "phone_no": "9876543210",
      "language": {
        "primary": "English",
        "secondary": ["Hindi"]
      },
      "block_name": "Block A",
      "created_at": "2024-02-04T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

## 14. Get Supporters by Created By User

**GET** `/api/supporters/created-by/:createdBy`

### Example: GET `/api/supporters/created-by/1?page=1&limit=10`

### Success Response (200)
```json
{
  "success": true,
  "message": "Supporters retrieved successfully",
  "data": [
    {
      "supporter_id": 1,
      "created_by": 1,
      "initials": "Mr",
      "first_name": "John",
      "last_name": "Doe",
      "father_name": "Robert Doe",
      "age": 34,
      "gender": "Male",
      "phone_no": "9876543210",
      "language": ["English", "Hindi", "Spanish"],
      "created_by_name": "Admin User",
      "created_at": "2024-02-04T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

## 15. Bulk Operations

**POST** `/api/supporters/bulk`

### Request Body - Bulk Activate
```json
{
  "supporter_ids": [1, 2, 3, 4, 5],
  "operation": "activate"
}
```

### Request Body - Bulk Deactivate
```json
{
  "supporter_ids": [1, 2, 3, 4, 5],
  "operation": "deactivate"
}
```

### Request Body - Bulk Delete
```json
{
  "supporter_ids": [1, 2, 3, 4, 5],
  "operation": "delete"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Bulk activate operation completed",
  "data": {
    "processed": 5,
    "success": 5,
    "failed": 0
  }
}
```

---

## Common Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "phone_no",
      "message": "Phone number must be exactly 10 digits"
    },
    {
      "field": "initials",
      "message": "initials must be one of: Mr, Ms, Mrs, Dr"
    },
    {
      "field": "age",
      "message": "Age must be at least 1"
    },
    {
      "field": "gender",
      "message": "Gender must be one of: Male, Female, Other"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Access denied. Invalid token."
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Supporter not found",
  "error": "SUPPORTER_NOT_FOUND"
}
```

### Internal Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## Testing Information

1. **Authentication**: All endpoints require a valid JWT token
2. **Phone Number**: Must be exactly 10 digits and unique
3. **Voter EPIC ID**: Must be exactly 10 alphanumeric characters and unique (optional)
4. **Initials**: Must be one of: Mr, Ms, Mrs, Dr (defaults to Mr)
5. **Date of Birth**: Must be in YYYY-MM-DD format (optional)
6. **Age**: Must be between 1 and 120 (optional, integer)
7. **Gender**: Must be one of: Male, Female, Other (optional)
8. **Names**: First name and last name are required, minimum 2 characters each
9. **Language Field**: Can be provided in multiple formats:
   - **String**: `"English"`
   - **Array**: `["English", "Hindi", "Spanish"]`
   - **Object**: `{"primary": "English", "secondary": ["Hindi", "Spanish"]}`
10. **Pagination**: Default page=1, limit=10, max limit=100
11. **Search**: Searches across first_name, last_name, father_name, phone_no, whatsapp_no, voter_epic_id, address, language, religion, category, caste, and gender
12. **Sorting**: Available fields: supporter_id, first_name, last_name, father_name, phone_no, age, gender, created_at, updated_at
13. **Date Filters**: Use YYYY-MM-DD format
14. **Age Filters**: Use age_from and age_to for age range filtering
15. **Bulk Operations**: Maximum 100 supporters per operation
16. **Filter Fields**: Can filter by initials, age, gender, language, religion, category, and caste
17. **Demographics**: Statistics include breakdowns by gender, age groups, religion, category, and language
18. **JSON Storage**: Language data is stored as JSON in the database for flexibility

## Age and Gender Field Examples

### Age Field
```json
"age": 34
```

### Gender Field Options
```json
"gender": "Male"     // or "Female" or "Other"
```

### Age Range Filtering
```
?age_from=18&age_to=65
```

### Gender Filtering
```
?gender=Female
```

## Language Field Examples

### Simple String
```json
"language": "English"
```

### Array of Languages
```json
"language": ["English", "Hindi", "Spanish", "French"]
```

### Structured Object (Recommended)
```json
"language": {
  "primary": "English",
  "secondary": ["Hindi", "Spanish"]
}
```

## Postman Collection Import

You can create a Postman collection with these endpoints using the base URL and adding the authentication header to each request. The system now supports comprehensive demographic filtering including age ranges and gender-based queries for detailed supporter analysis.