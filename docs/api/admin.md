# Admin API

## Endpoints

### `GET /api/admin/audit-logs`
Retrieve system audit logs with filtering options.
- **Access**: Protected (Admin & Business Owner)
- **Query Params**:
  - `page`: Page number (default 1)
  - `limit`: Items per page (default 50)
  - `eventType`: Filter by event type
  - `actorEmail`: Filter by user email
  - `status`: `success` | `failure`
- **Response**:
  ```json
  {
    "success": true,
    "data": [...],
    "pagination": { "total": 100, "page": 1, ... }
  }
  ```
