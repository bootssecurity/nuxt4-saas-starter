# Authentication API

## Security Features

| Feature | Description |
|---------|-------------|
| **Timing Attack Prevention** | All login requests take minimum 500ms to prevent user enumeration |
| **Rate Limiting** | 5 requests per 60 seconds for login, 3 for signup |
| **User Enumeration Protection** | Same response for existing and non-existing users |
| **Magic Link Expiry** | Tokens expire after 15 minutes |
| **Single-Use Tokens** | Each magic link can only be used once |
| **Audit Logging** | All authentication attempts are logged |

## Endpoints

### `POST /api/auth/login`
Initiates a passwordless login flow by sending a magic link to the user's email.

- **Access**: Public
- **Rate Limit**: 5 requests / 60s per IP
- **Min Response Time**: 500ms (timing attack prevention)
- **Body**: 
  ```json
  { "email": "user@example.com" }
  ```
- **Response**: 
  ```json
  { "success": true, "message": "If this email exists, a magic link has been sent" }
  ```

> **Security Note**: The response is identical whether the email exists or not. This prevents attackers from discovering which emails are registered.

### `GET /api/auth/verify?token=...`
Verifies the magic link token and creates a user session.

- **Access**: Public
- **Rate Limit**: 10 requests / 60s per IP
- **Query Params**: `token` (string, required)
- **Success Response**: 
  ```json
  {
    "success": true,
    "user": { "id": 1, "email": "...", "firstName": "...", "lastName": "...", "role": "..." },
    "business": { "id": 1, "name": "...", "code": "..." }
  }
  ```
- **Error Responses**:
  - `400`: Invalid or expired token
  - `400`: Token already used

### `GET /api/auth/me`
Returns the currently authenticated user's information.

- **Access**: Protected (requires authentication)
- **Response**: 
  ```json
  {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "business_owner",
      "businessId": 1,
      "businessName": "Acme Corp",
      "businessCode": "ABC123",
      "status": "active"
    }
  }
  ```

### `POST /api/auth/logout`
Destroys the current user session.

- **Access**: Protected
- **Response**: `{ "success": true }`

### `POST /api/auth/signup/business`
Registers a new business account. Sends a magic link to complete registration.

- **Access**: Public
- **Rate Limit**: 3 requests / 60s per IP
- **Body**:
  ```json
  {
    "email": "owner@company.com",
    "firstName": "John",
    "lastName": "Doe",
    "businessName": "Acme Corp",
    "phone": "+1234567890"  // optional
  }
  ```
- **Response**: `{ "success": true, "message": "Please check your email to complete registration" }`

### `POST /api/auth/signup/employee`
Registers a new employee account using a business code.

- **Access**: Public
- **Rate Limit**: 3 requests / 60s per IP
- **Body**:
  ```json
  {
    "email": "employee@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "companyCode": "ABC123",
    "phone": "+1234567890"  // optional
  }
  ```
- **Response**: `{ "success": true, "message": "Please check your email to complete registration" }`
