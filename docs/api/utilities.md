# Utilities API

## File Upload & Storage

### `POST /api/upload`
Upload files to Cloudflare R2 blob storage.

- **Access**: Protected (authentication required)
- **Rate Limit**: 20 requests / 60s per IP
- **Content-Type**: `multipart/form-data`
- **Body**: FormData with `file` field

#### Security Features

| Feature | Value |
|---------|-------|
| **Authentication** | Required |
| **File Size Limit** | 10 MB |
| **Allowed Types** | image/jpeg, image/png, image/gif, image/webp, image/svg+xml, application/pdf, text/plain, text/csv, application/json |
| **Business Scoping** | Files stored in `uploads/{business-id}/` or `uploads/{user-id}/` |
| **Filename Sanitization** | Special characters removed, path traversal blocked |
| **Audit Logging** | All uploads logged with file metadata |

#### Request Example

```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Cookie: nuxt-session=..." \
  -F "file=@document.pdf"
```

#### Success Response

```json
{
  "success": true,
  "filename": "uploads/business-1/1705234567890-document.pdf",
  "size": 102400,
  "type": "application/pdf"
}
```

#### Error Responses

| Status | Message |
|--------|---------|
| `400` | No file provided |
| `401` | Authentication required |
| `413` | File too large. Maximum size is 10MB |
| `415` | File type not allowed |
| `429` | Rate limit exceeded |

---

### `GET /api/files`
List uploaded files for the current user's business/account.

- **Access**: Protected (authentication required)
- **Query Params**: `prefix` (optional) - filter files by path prefix

#### Security Features

| Feature | Description |
|---------|-------------|
| **Business Scoping** | Users can only see files from their own business |
| **Path Traversal Protection** | `..` sequences are stripped from prefix |
| **Audit Logging** | All file listings are logged |

#### Request Example

```bash
curl http://localhost:3000/api/files?prefix=documents/
```

#### Success Response

```json
{
  "files": [
    {
      "pathname": "documents/report.pdf",
      "size": 102400,
      "uploadedAt": "2025-01-14T12:00:00Z"
    }
  ],
  "total": 1
}
```

---

## Email Service

### `POST /api/email/send`
Internal endpoint to trigger transactional emails via ZeptoMail.

- **Access**: Protected (internal/admin use)
- **Body**:
  ```json
  {
    "to": "user@example.com",
    "subject": "Your Subject",
    "html": "<p>Email content</p>"
  }
  ```
- **Response**: `{ "success": true }`

---

## KV Storage

### `GET /api/kv`
Retrieve a value from Cloudflare Workers KV storage.

- **Access**: Protected
- **Query Params**: `key` (required)
- **Response**: `{ "key": "...", "value": "..." }`

### `POST /api/kv`
Store a value in Cloudflare Workers KV storage.

- **Access**: Protected
- **Body**:
  ```json
  {
    "key": "my-key",
    "value": "my-value",
    "ttl": 3600  // optional, seconds
  }
  ```
- **Response**: `{ "success": true, "key": "my-key", "message": "Value stored successfully" }`
