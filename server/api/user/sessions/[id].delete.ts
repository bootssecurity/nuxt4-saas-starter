import { eq, and, isNull } from 'drizzle-orm'
import { db } from 'hub:db'
import { userSessions } from '~~/server/database/schema'
import { revokeSession } from '~~/server/utils/session'

/**
 * DELETE /api/user/sessions/[id]
 * Revoke a specific session
 * 
 * Users can only revoke their own sessions
 */
export default defineEventHandler(async (event) => {
    // Require authentication
    const session = await requireUserSession(event)

    // Get session ID from route params
    const sessionId = parseInt(getRouterParam(event, 'id') || '')

    if (!sessionId || isNaN(sessionId)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid session ID'
        })
    }

    // Verify the session belongs to the current user
    const targetSession = await db.select()
        .from(userSessions)
        .where(
            and(
                eq(userSessions.id, sessionId),
                eq(userSessions.userId, session.user.id),
                isNull(userSessions.revokedAt)
            )
        )
        .get()

    if (!targetSession) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Session not found'
        })
    }

    // Revoke the session
    await revokeSession(event, sessionId, session.user.id, 'User requested via session management')

    return {
        success: true,
        message: 'Session revoked successfully'
    }
})
