# User API

## Endpoints

### `GET /api/auth/me`
Returns current session user details.
- **Access**: Protected
- **Response**: `{ user: { id, email, role, ... } }`

### `PUT /api/user/profile`
Updates user profile information.
- **Access**: Protected
- **Body**:
  ```json
  {
    "firstName": "Jane", // optional
    "lastName": "Doe",   // optional
    "phone": "..."       // optional
  }
  ```
- **Response**: `{ success: true, message: "Profile updated successfully" }`

### `POST /api/user/data-export`
Triggers a GDPR data export (DSAR).
- **Access**: Protected
- **Rate Limit**: 3 requests / hour
- **Response**: `{ success: true, data: { ... } }`

### `POST /api/user/delete-account`
Requests account deletion (Right to Erasure).
- **Access**: Protected
- **Rate Limit**: 1 request / hour
- **Body**:
  ```json
  {
    "confirmEmail": "user@example.com",
    "reason": "Optional reason"
  }
  ```
- **Response**: `{ success: true, message: "Your account has been scheduled for deletion..." }`

---

## Session Management

### `GET /api/user/sessions`
Get all active sessions for the current user.
- **Access**: Protected
- **Response**:
  ```json
  {
    "success": true,
    "sessions": [{
      "id": 1,
      "ipAddress": "192.168.1.1",
      "device": { "browser": "Chrome", "os": "macOS", "isMobile": false },
      "country": "US",
      "createdAt": "ISO-date",
      "lastActiveAt": "ISO-date",
      "expiresAt": "ISO-date",
      "isCurrent": true
    }]
  }
  ```

### `DELETE /api/user/sessions/[id]`
Revoke a specific session.
- **Access**: Protected
- **Response**: `{ success: true }`

### `POST /api/user/sessions/revoke-all`
Revoke all sessions except the current one.
- **Access**: Protected
- **Response**: `{ success: true, message: "Revoked X sessions" }`

---

## Consent Management (GDPR)

### `GET /api/user/consent`
Get current consent preferences.
- **Access**: Protected
- **Response**:
  ```json
  {
    "success": true,
    "consent": {
      "marketing": true,
      "analytics": false,
      "privacyPolicyVersion": "1.0",
      "termsVersion": "1.0",
      "consentTimestamp": "ISO-date"
    }
  }
  ```

### `POST /api/user/consent`
Update consent preferences.
- **Access**: Protected
- **Body**: `{ marketing?: boolean, analytics?: boolean }`
- **Response**: `{ success: true }`

---

## Activity Log

### `GET /api/user/activity`
Get activity log for the current user (security events only).
- **Access**: Protected
- **Query Params**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 50)
  - `startDate`: Filter from date (ISO format)
  - `endDate`: Filter to date (ISO format)
- **Response**:
  ```json
  {
    "success": true,
    "logs": [{
      "id": 1,
      "timestamp": "ISO-date",
      "eventType": "auth.login.success",
      "action": "User logged in",
      "status": "success",
      "actorIp": "192.168.1.1",
      "actorCountry": "US"
    }],
    "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
  }
  ```
