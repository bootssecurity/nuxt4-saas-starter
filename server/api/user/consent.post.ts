import { updateUserConsent } from '~~/server/utils/gdpr/consent'

/**
 * POST /api/user/consent
 * Update consent preferences
 */
export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event)
    const body = await readBody(event)

    const { marketing, analytics } = body

    // Validate input
    if (typeof marketing !== 'boolean' && typeof analytics !== 'boolean') {
        throw createError({
            statusCode: 400,
            statusMessage: 'At least one consent preference must be provided'
        })
    }

    await updateUserConsent(event, session.user.id, { marketing, analytics })

    return {
        success: true,
        message: 'Consent preferences updated'
    }
})
