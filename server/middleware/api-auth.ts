/**
 * Global API Authorization Middleware
 * 
 * This middleware protects ALL API routes by default, requiring authentication.
 * Routes that need to be public must be explicitly whitelisted.
 * 
 * Security Pattern: Deny by default, allow explicitly
 * 
 * Features:
 * - Authenticates all /api/* routes by default
 * - Provides role-based access control for admin routes
 * - Whitelists public routes (auth endpoints)
 * - Logs unauthorized access attempts
 */

import {
    logFailure,
    AuditEventTypes,
    AuditActions
} from '~~/server/utils/audit'

/**
 * Routes that don't require authentication
 * Use exact match or pattern matching
 */
const PUBLIC_ROUTES: string[] = [
    // Auth endpoints (login, signup, verify)
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/verify',
    '/api/auth/signup/business',
    '/api/auth/signup/employee',

    // Business code validation (needed during signup)
    '/api/business/validate-code',

    // Health check (if needed)
    '/api/health',
]

/**
 * Routes that require specific roles
 * Maps route patterns to allowed roles
 */
const ROLE_PROTECTED_ROUTES: Record<string, string[]> = {
    '/api/admin': ['admin', 'business_owner'],
}

/**
 * Check if a path matches any pattern in the list
 * Supports exact match and prefix match (ending with *)
 */
function matchesRoute(path: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
        if (pattern.endsWith('*')) {
            // Prefix match
            return path.startsWith(pattern.slice(0, -1))
        }
        // Exact match
        return path === pattern
    })
}

/**
 * Check if user has required role for a route
 */
function hasRequiredRole(path: string, userRole: string): boolean {
    for (const [routePrefix, allowedRoles] of Object.entries(ROLE_PROTECTED_ROUTES)) {
        if (path.startsWith(routePrefix)) {
            return allowedRoles.includes(userRole)
        }
    }
    // No role restriction for this route
    return true
}

export default defineEventHandler(async (event) => {
    const path = getRequestURL(event).pathname

    // Only apply to API routes
    if (!path.startsWith('/api/')) {
        return
    }

    // Skip public routes
    if (matchesRoute(path, PUBLIC_ROUTES)) {
        return
    }

    // Get user session
    const { user } = await getUserSession(event)

    // Check authentication
    if (!user) {
        await logFailure(event, AuditEventTypes.AUTH_UNAUTHORIZED, AuditActions.READ,
            'Unauthenticated API access attempt', {
            metadata: { path, method: getMethod(event) }
        })

        throw createError({
            statusCode: 401,
            statusMessage: 'Authentication required'
        })
    }

    // Check if user account is active
    if (user.status !== 'active') {
        // Allow logout even for inactive accounts
        if (!path.startsWith('/api/auth/logout')) {
            await logFailure(event, AuditEventTypes.AUTH_FORBIDDEN, AuditActions.READ,
                'Inactive account API access attempt', {
                actorId: user.id,
                actorEmail: user.email,
                metadata: { path, status: user.status }
            })

            throw createError({
                statusCode: 403,
                statusMessage: 'Account is not active'
            })
        }
    }

    // Check role-based access control
    if (!hasRequiredRole(path, user.role)) {
        await logFailure(event, AuditEventTypes.AUTH_FORBIDDEN, AuditActions.READ,
            'Insufficient permissions', {
            actorId: user.id,
            actorEmail: user.email,
            metadata: { path, userRole: user.role }
        })

        throw createError({
            statusCode: 403,
            statusMessage: 'Insufficient permissions'
        })
    }

    // User is authenticated and authorized
    // Individual route handlers can still perform additional checks if needed
})
