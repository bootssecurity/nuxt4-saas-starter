# Utilities API

## Endpoints

### `POST /api/upload`
Upload files to Cloudflare R2 blob storage.
- **Access**: Protected
- **Body**: `FormData` (file)
- **Response**: `{ pathname, contentType, size, url }`

### `POST /api/email/send`
Internal endpoint to trigger transactional emails (ZeptoMail).
- **Access**: Server-side only (or protected admin)
- **Body**: `{ to, subject, html, ... }`

### `GET /api/kv` / `POST /api/kv`
Interact with Cloudflare Workers KV storage.
- **Access**: Protected / Internal use usually
