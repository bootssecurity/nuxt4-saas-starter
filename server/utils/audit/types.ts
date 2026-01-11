/**
 * Audit Event Types
 * Standardized event types for SOC2/GDPR/HIPAA compliance logging
 */
export const AuditEventTypes = {
    // Authentication Events
    AUTH_LOGIN_ATTEMPT: 'auth.login.attempt',
    AUTH_LOGIN_SUCCESS: 'auth.login.success',
    AUTH_LOGIN_FAILURE: 'auth.login.failure',
    AUTH_LOGOUT: 'auth.logout',
    AUTH_SIGNUP_ATTEMPT: 'auth.signup.attempt',
    AUTH_SIGNUP_SUCCESS: 'auth.signup.success',
    AUTH_SIGNUP_FAILURE: 'auth.signup.failure',

    // Token Events
    AUTH_TOKEN_CREATED: 'auth.token.created',
    AUTH_TOKEN_USED: 'auth.token.used',
    AUTH_TOKEN_EXPIRED: 'auth.token.expired',
    AUTH_TOKEN_INVALID: 'auth.token.invalid',

    // Rate Limiting
    RATE_LIMIT_EXCEEDED: 'security.rate_limit.exceeded',

    // Session Events
    SESSION_CREATED: 'session.created',
    SESSION_REFRESHED: 'session.refreshed',
    SESSION_EXPIRED: 'session.expired',
    SESSION_REVOKED: 'session.revoked',
    SESSION_REVOKED_ALL: 'session.revoked_all',

    // User Events
    USER_CREATE: 'user.create',
    USER_READ: 'user.read',
    USER_UPDATE: 'user.update',
    USER_DELETE: 'user.delete',
    USER_DELETE_REQUEST: 'user.delete_request',
    USER_DATA_EXPORT: 'user.data_export',

    // Consent Events (GDPR)
    CONSENT_GRANTED: 'consent.granted',
    CONSENT_REVOKED: 'consent.revoked',
    CONSENT_UPDATED: 'consent.updated',

    // Business Events
    BUSINESS_CREATED: 'business.created',
    BUSINESS_UPDATE: 'business.update',

    // Admin Events
    ADMIN_USER_VIEW: 'admin.user.view',
    ADMIN_USER_UPDATE: 'admin.user.update',
    ADMIN_AUDIT_VIEW: 'admin.audit.view',
} as const

export type AuditEventType = typeof AuditEventTypes[keyof typeof AuditEventTypes]

/**
 * Audit Actions
 */
export const AuditActions = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    LOGIN: 'login',
    LOGOUT: 'logout',
    ATTEMPT: 'attempt',
    GRANT: 'grant',
    REVOKE: 'revoke',
    EXPORT: 'export',
    BLOCK: 'block',
} as const

export type AuditAction = typeof AuditActions[keyof typeof AuditActions]

/**
 * Audit Status
 */
export const AuditStatus = {
    SUCCESS: 'success',
    FAILURE: 'failure',
    BLOCKED: 'blocked',
    PENDING: 'pending',
} as const

export type AuditStatusType = typeof AuditStatus[keyof typeof AuditStatus]

/**
 * Resource Types
 */
export const ResourceTypes = {
    USER: 'user',
    BUSINESS: 'business',
    SESSION: 'session',
    TOKEN: 'token',
    CONSENT: 'consent',
    EXPORT: 'export',
} as const

export type ResourceType = typeof ResourceTypes[keyof typeof ResourceTypes]
