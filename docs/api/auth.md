# Authentication API

## Endpoints

### `POST /api/auth/login`
Initiates a passwordless login flow by sending a magic link to the user's email.
- **Access**: Public
- **Rate Limit**: 5 requests / 60s
- **Body**: `{ email: string }`
- **Response**: `{ success: true, message: "If this email exists, a magic link has been sent" }`

### `GET /api/auth/verify?token=...`
Verifies the magic link token and creates a user session.
- **Access**: Public
- **Params**: `token` (string)
- **Response**: Redirects to `/dashboard` on success.

### `POST /api/auth/logout`
Destroys the current user session.
- **Access**: Protected
- **Response**: `{ success: true }`

### `POST /api/auth/signup/business`
Registers a new business account.
- **Access**: Public
- **Rate Limit**: 3 requests / 60s
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "businessName": "Acme Corp",
    "phone": "1234567890" // optional
  }
  ```
- **Response**: `{ success: true, message: "..." }`

### `POST /api/auth/signup/employee`
Registers a new employee account (requires invitation).
- **Access**: Public (Invite-only logic usually handled via token)
- **Body**: `{ email, firstName, lastName, token }`
