import { revokeAllUserSessions } from '~~/server/utils/session'

/**
 * POST /api/user/sessions/revoke-all
 * Revoke all sessions except the current one
 * 
 * Useful when user suspects account compromise
 */
export default defineEventHandler(async (event) => {
    // Require authentication
    const session = await requireUserSession(event)

    // Get current session token to exclude from revocation
    const currentSessionToken = getCookie(event, 'nuxt-session')

    // Revoke all other sessions
    const count = await revokeAllUserSessions(
        event,
        session.user.id,
        'User revoked all sessions via security settings',
        currentSessionToken || undefined
    )

    return {
        success: true,
        message: count > 0
            ? `${count} session(s) revoked successfully`
            : 'No other sessions to revoke',
        revokedCount: count
    }
})
