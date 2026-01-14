# API Documentation

This directory contains detailed documentation for all available API routes in the Nuxt SaaS Starter.

## Table of Contents

- [**Authentication**](./auth.md): Login, Signup, Magic Links, Session management.
- [**User Management**](./user.md): Profile updates, Sessions, Consent, Activity logs, Data export, Account deletion.
- [**Chat & Messaging**](./chat.md): Real-time messaging, E2E encryption, WebSocket API.
- [**Business Logic**](./business.md): Multi-tenant business operations and member management.
- [**Admin Controls**](./admin.md): System-wide audit logs and administrative tools.
- [**Utilities**](./utilities.md): File uploads, KV storage, Email services.

## General Information

- **Base URL**: `/api`
- **WebSocket**: `/_ws`
- **Response Format**: All endpoints return JSON.
- **Errors**: Standard HTTP status codes (200, 400, 401, 403, 404, 429, 500).

## 🔐 Global API Authorization

All API routes are **protected by default**. Authentication is enforced globally via the `api-auth` middleware.

### Public Routes (No Authentication Required)

The following routes are explicitly whitelisted and accessible without authentication:

| Route | Description |
|-------|-------------|
| `POST /api/auth/login` | Initiate magic link login |
| `POST /api/auth/logout` | Destroy session |
| `GET /api/auth/verify` | Verify magic link token |
| `POST /api/auth/signup/business` | Register new business |
| `POST /api/auth/signup/employee` | Register new employee |
| `GET /api/business/validate-code` | Validate business code during signup |
| `GET /api/health` | Health check endpoint |

### Role-Based Access Control

Some routes require specific roles:

| Route Prefix | Allowed Roles |
|--------------|---------------|
| `/api/admin/*` | `admin`, `business_owner` |

### Security Features

| Feature | Implementation |
|---------|----------------|
| **Timing Attack Prevention** | Login returns in constant time (500ms min) regardless of user existence |
| **Rate Limiting** | Sliding window algorithm using Cloudflare KV |
| **Audit Logging** | All auth attempts (success/failure) are logged |
| **Account Status Check** | Inactive/suspended accounts are blocked from API access |

### Authentication Errors

| Status Code | Meaning |
|-------------|---------|
| `401` | Not authenticated - no valid session |
| `403` | Forbidden - account inactive or insufficient permissions |
| `429` | Rate limited - too many requests |

### Example: Authenticated Request

```bash
# Cookies are automatically sent by the browser after login
curl -X GET http://localhost:3000/api/user/profile \
  -H "Cookie: nuxt-session=your-session-cookie"
```

### Example: Unauthenticated Request to Protected Route

```bash
curl -X GET http://localhost:3000/api/files
# Response: {"statusCode":401,"statusMessage":"Authentication required"}
```
