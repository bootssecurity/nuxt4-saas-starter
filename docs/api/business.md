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

### `PUT /api/business/users/[id]`
Update a business user's details.
- **Access**: Protected (Business Owner only)
- **Body**:
  ```json
  {
    "firstName": "Updated",
    "lastName": "Name",
    "role": "employee",
    "isActive": true
  }
  ```
- **Response**: `{ success: true, user: {...} }`

### `DELETE /api/business/users/[id]`
Remove a user from the business.
- **Access**: Protected (Business Owner only)
- **Response**: `{ success: true }`

### `GET /api/business/validate-code`
Validate a business invitation code.
- **Access**: Public
- **Query Params**: `code` - The invitation code
- **Response**: `{ valid: true, businessName: "Acme Corp" }`
