import { getUserConsent, updateUserConsent } from '~~/server/utils/gdpr/consent'

/**
 * GET /api/user/consent
 * Get current consent preferences
 */
export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event)

    const consent = await getUserConsent(session.user.id)

    return {
        success: true,
        consent
    }
})
