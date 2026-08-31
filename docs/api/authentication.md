# Tripzo API Documentation — Authentication & User Management

## 1. Register User (Local)

**Endpoint:** `POST /api/v1/auth/register`  
**Authentication:** Public (None required)  
**Role:** Public  

### Description
Creates a new Tripzo user account using local credentials. Always creates accounts with `role: "USER"`.

### Request Body
```json
{
  "name": "Sachin Jaiswal",
  "email": "sachin@example.com",
  "phone_number": "9876543210",
  "password": "password123"
}
```

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
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
}
```

### Error Responses
- **409 Conflict**: `{"success": false, "message": "User with this email already exists", "error": {"code": "USER_ALREADY_EXISTS"}}`
- **400 Bad Request**: `{"success": false, "message": "Email is required", "error": {"code": "INVALID_INPUT"}}`

---

## 2. User Login (Local)

**Endpoint:** `POST /api/v1/auth/login`  
**Authentication:** Public  

### Request Body
```json
{
  "email": "sachin@example.com",
  "password": "password123"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "User authenticated successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_generated_id": "a9b8c7d6-e5f4-4a3b-8c2d-1e0f9a8b7c6d",
      "name": "Sachin Jaiswal",
      "email": "sachin@example.com",
      "role": "USER",
      "auth_provider": "LOCAL",
      "is_email_verified": false,
      "is_active": true
    }
  }
}
```

### Error Responses
- **401 Unauthorized**: Invalid email or password (`INVALID_CREDENTIALS`)
- **403 Forbidden**: Account deactivated (`ACCOUNT_INACTIVE`)

---

## 3. Google Sign-In / Sign-Up

**Endpoint:** `POST /api/v1/auth/google`  
**Authentication:** Public  

### Request Body
```json
{
  "credential": "GOOGLE_ID_TOKEN"
}
```

### Description
Verifies Google token, extracts verified identity, links existing accounts matching email, or registers a new `role: "USER"` account.

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Google authentication successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_generated_id": "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e",
      "name": "Test Google User",
      "email": "test.google@tripzo.io",
      "role": "USER",
      "auth_provider": "GOOGLE",
      "provider_id": "google_mock_id_123456789",
      "profile_picture": "https://lh3.googleusercontent.com/a/default-user",
      "is_email_verified": true,
      "is_active": true
    }
  }
}
```

---

## 4. Get Current User

**Endpoint:** `GET /api/v1/auth/me`  
**Authentication:** Required (`Authorization: Bearer <token>`)  

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Authenticated user retrieved",
  "data": {
    "user_generated_id": "a9b8c7d6-e5f4-4a3b-8c2d-1e0f9a8b7c6d",
    "name": "Sachin Jaiswal",
    "email": "sachin@example.com",
    "role": "USER",
    "auth_provider": "LOCAL",
    "is_email_verified": false,
    "is_active": true
  }
}
```

---

## 5. Logout

**Endpoint:** `POST /api/v1/auth/logout`  
**Authentication:** Public  

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Logout successful. Client should clear local token."
}
```
