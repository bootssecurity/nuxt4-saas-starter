# Security Documentation

This document describes the security architecture and features of the Nuxt SaaS Starter.

## Overview

The application implements defense-in-depth security with multiple layers of protection:

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│  1. Security Headers (HSTS, CSP, X-Frame-Options)           │
│  2. Global API Authorization (api-auth middleware)           │
│  3. Rate Limiting (per-endpoint, IP-based)                  │
│  4. Input Validation & Sanitization                         │
│  5. Role-Based Access Control                               │
│  6. Audit Logging                                           │
└─────────────────────────────────────────────────────────────┘
```

## Global API Authorization

**File**: `server/middleware/api-auth.ts`

All `/api/*` routes are protected by default. The middleware enforces:

1. **Authentication**: Validates user session exists
2. **Account Status**: Blocks inactive/suspended accounts  
3. **Role-Based Access**: Checks user role for restricted routes

### Public Routes

Routes that don't require authentication:

```typescript
const PUBLIC_ROUTES = [
    '/api/auth/login',
    '/api/auth/logout', 
    '/api/auth/verify',
    '/api/auth/signup/business',
    '/api/auth/signup/employee',
    '/api/business/validate-code',
    '/api/health',
]
```

### Adding a New Public Route

Edit `server/middleware/api-auth.ts`:

```typescript
const PUBLIC_ROUTES = [
    // ... existing routes
    '/api/your-new-public-route',
]
```

### Role-Protected Routes

```typescript
const ROLE_PROTECTED_ROUTES = {
    '/api/admin': ['admin', 'business_owner'],
}
```

## Rate Limiting

**File**: `server/utils/rateLimit.ts`

Uses sliding window algorithm with Cloudflare KV storage.

| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 requests | 60 seconds |
| Signup | 3 requests | 60 seconds |
| Verify | 10 requests | 60 seconds |
| Upload | 20 requests | 60 seconds |
| General API | 100 requests | 60 seconds |

### Rate Limit Headers

All responses include:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Seconds until window resets

## Timing Attack Prevention

**File**: `server/api/auth/login.post.ts`

Login endpoint uses constant-time responses (minimum 500ms) to prevent user enumeration:

```typescript
const MIN_RESPONSE_TIME_MS = 500

// Response takes same time whether user exists or not
await ensureMinResponseTime()
```

## Security Headers

**File**: `server/middleware/security.ts`

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | max-age=31536000; includeSubDomains; preload | Force HTTPS |
| `X-Content-Type-Options` | nosniff | Prevent MIME sniffing |
| `X-Frame-Options` | DENY | Prevent clickjacking |
| `X-XSS-Protection` | 1; mode=block | Legacy XSS protection |
| `Referrer-Policy` | strict-origin-when-cross-origin | Control referrer info |
| `Permissions-Policy` | camera=(), microphone=()... | Disable browser features |
| `Content-Security-Policy` | (production only) | Prevent XSS/injection |

## Input Sanitization

**File**: `server/utils/security/sanitize.ts`

All user inputs are sanitized:

| Function | Purpose |
|----------|---------|
| `sanitizeEmail()` | Lowercase, remove HTML, control chars |
| `sanitizeString()` | Strip HTML, limit length |
| `sanitizeName()` | Allow only letters, spaces, hyphens |
| `sanitizePhone()` | Keep only digits and leading + |
| `sanitizeBusinessCode()` | Uppercase alphanumeric only |
| `sanitizeUrl()` | Validate http/https protocol |

## Audit Logging

**File**: `server/utils/audit/`

All security events are logged to the database:

### Event Types

| Category | Events |
|----------|--------|
| Authentication | login.attempt, login.success, login.failure, logout |
| Authorization | unauthorized, forbidden |
| Tokens | token.created, token.used, token.expired |
| Sessions | session.created, session.revoked |
| Files | file.upload, file.list, file.download |
| Users | user.create, user.update, user.delete |
| Admin | admin.audit.view |

### Log Structure

```typescript
{
    timestamp: Date,
    eventType: string,      // e.g., 'auth.login.success'
    action: string,         // e.g., 'login'
    status: string,         // 'success' | 'failure' | 'blocked'
    actorId: number,        // User who performed action
    actorEmail: string,
    actorIp: string,
    actorUserAgent: string,
    actorCountry: string,
    resourceType: string,   // e.g., 'user', 'file'
    resourceId: number,
    failureReason: string,
    metadata: object,       // Additional context
    businessId: number      // Multi-tenant support
}
```

## File Upload Security

**File**: `server/api/upload.post.ts`

| Feature | Implementation |
|---------|----------------|
| Authentication | Required via global middleware |
| File Type Whitelist | jpeg, png, gif, webp, svg, pdf, txt, csv, json |
| Size Limit | 10 MB maximum |
| Filename Sanitization | Remove special chars, prevent path traversal |
| Business Scoping | Files stored in `uploads/{business-id}/` |
| Rate Limiting | 20 uploads per minute |
| Audit Logging | All uploads logged with metadata |

## Session Management

Sessions are stored in cookies with:
- `HttpOnly`: Not accessible via JavaScript
- `Secure`: Only sent over HTTPS
- `SameSite`: Strict CSRF protection

Active sessions are tracked in database for:
- Device information
- IP address tracking
- Manual revocation
- Automatic expiry

## GDPR Compliance

| Feature | Implementation |
|---------|----------------|
| Data Export | `POST /api/user/data-export` |
| Account Deletion | `POST /api/user/delete-account` |
| Consent Management | Granular marketing/analytics consent |
| Audit Trail | Complete activity history per user |

## Best Practices for Development

1. **Never add routes to PUBLIC_ROUTES unless absolutely necessary**
2. **Always validate and sanitize user input**
3. **Use parameterized queries (Drizzle handles this)**
4. **Log all security-relevant events**
5. **Keep dependencies updated**
6. **Test for timing attacks on auth endpoints**
7. **Review audit logs regularly**
