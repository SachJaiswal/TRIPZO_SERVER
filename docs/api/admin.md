# Tripzo API Documentation — Admin User Management

All endpoints require:
- **Authentication:** `Authorization: Bearer <ADMIN_JWT>`
- **Authorization:** `role: "ADMIN"`

---

## 1. List All Users (Paginated & Filtered)

**Endpoint:** `GET /api/v1/admin/users`  
**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `search` (optional text search for name/email/phone)
- `role` (optional: `USER` or `ADMIN`)
- `status` (optional: `ACTIVE` or `INACTIVE`)

### Example Request
```http
GET /api/v1/admin/users?page=1&limit=10&role=USER&status=ACTIVE
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "user_generated_id": "a9b8c7d6-e5f4-4a3b-8c2d-1e0f9a8b7c6d",
      "name": "Sachin Jaiswal",
      "email": "sachin@example.com",
      "role": "USER",
      "auth_provider": "LOCAL",
      "is_email_verified": false,
      "is_active": true,
      "created_at": "2026-08-27T12:00:00.000Z",
      "updated_at": "2026-08-27T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## 2. Get User Details

**Endpoint:** `GET /api/v1/admin/users/:user_generated_id`  

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "User detail retrieved successfully",
  "data": {
    "user_generated_id": "a9b8c7d6-e5f4-4a3b-8c2d-1e0f9a8b7c6d",
    "name": "Sachin Jaiswal",
    "email": "sachin@example.com",
    "phone_number": "9876543210",
    "role": "USER",
    "auth_provider": "LOCAL",
    "is_email_verified": false,
    "is_active": true,
    "created_at": "2026-08-27T12:00:00.000Z",
    "updated_at": "2026-08-27T12:00:00.000Z"
  }
}
```

---

## 3. Activate / Deactivate User

**Endpoint:** `PATCH /api/v1/admin/users/:user_generated_id/status`  

### Request Body
```json
{
  "is_active": false
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "User status updated to INACTIVE successfully",
  "data": {
    "user_generated_id": "a9b8c7d6-e5f4-4a3b-8c2d-1e0f9a8b7c6d",
    "name": "Sachin Jaiswal",
    "email": "sachin@example.com",
    "is_active": false,
    "updated_at": "2026-08-27T12:05:00.000Z"
  }
}
```

### Error Responses
- **403 Forbidden (Last Admin Protection):** `{"success": false, "message": "Operation prohibited: Cannot deactivate the only remaining active administrator account", "error": {"code": "LAST_ADMIN_PROTECTION"}}`

---

## 4. Delete User

**Endpoint:** `DELETE /api/v1/admin/users/:user_generated_id`  

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Error Responses
- **403 Forbidden (Last Admin Protection):** `{"success": false, "message": "Operation prohibited: Cannot delete the only remaining active administrator account", "error": {"code": "LAST_ADMIN_PROTECTION"}}`
- **404 Not Found:** `{"success": false, "message": "User not found", "error": {"code": "USER_NOT_FOUND"}}`
