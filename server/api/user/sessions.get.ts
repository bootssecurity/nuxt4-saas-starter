import { getActiveSessions } from '~~/server/utils/session'

/**
 * GET /api/user/sessions
 * Get all active sessions for the current user
 * 
 * Returns list of sessions with device info, location, and activity timestamps
 */
export default defineEventHandler(async (event) => {
    // Require authentication
    const session = await requireUserSession(event)

    const sessions = await getActiveSessions(session.user.id)

    // Get current session token to mark "this device"
    const currentSessionToken = getCookie(event, 'nuxt-session')

    return {
        success: true,
        sessions: sessions.map(s => ({
            ...s,
            isCurrent: false, // Will be determined by frontend or enhanced logic
            createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
            lastActiveAt: s.lastActiveAt instanceof Date ? s.lastActiveAt.toISOString() : s.lastActiveAt,
            expiresAt: s.expiresAt instanceof Date ? s.expiresAt.toISOString() : s.expiresAt
        }))
    }
})
