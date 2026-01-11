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
