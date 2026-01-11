import {
    logSuccess,
    AuditEventTypes,
    AuditActions,
    ResourceTypes
} from '~~/server/utils/audit'

/**
 * POST /api/auth/logout
 * End user session
 * 
 * Security:
 * - Clears user session
 * - Logs logout event for audit trail (SOC2/GDPR/HIPAA)
 */
export default defineEventHandler(async (event) => {
    // Get current session for logging
    const session = await getUserSession(event)

    if (session?.user) {
        // Log logout event before clearing session
        await logSuccess(event, AuditEventTypes.AUTH_LOGOUT, AuditActions.LOGOUT, {
            actorId: session.user.id,
            actorEmail: session.user.email,
            resourceType: ResourceTypes.SESSION,
            businessId: session.user.businessId ?? undefined,
            metadata: {
                sessionStart: session.loggedInAt,
                sessionDuration: session.loggedInAt
                    ? Math.floor((Date.now() - new Date(session.loggedInAt).getTime()) / 1000)
                    : null
            }
        })
    }

    // Clear the session
    await clearUserSession(event)

    return {
        success: true,
        message: 'Logged out successfully'
    }
})
