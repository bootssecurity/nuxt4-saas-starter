# Business API

## Endpoints

### `GET /api/business/users`
List all users (employees) associated with the current business.
- **Access**: Protected (Business Owner only)
- **Response**: `{ users: [...] }`

### `POST /api/business/users`
Invite or add a new user to the business.
- **Access**: Protected (Business Owner only)
- **Body**:
  ```json
  {
    "email": "employee@company.com",
    "firstName": "Alice",
    "lastName": "Smith",
    "role": "employee"
  }
  ```
- **Response**: `{ success: true, message: "User added and invitation sent" }`

### `DELETE /api/business/users/[id]`
Remove a user from the business.
- **Access**: Protected (Business Owner only)
- **Response**: `{ success: true }`
