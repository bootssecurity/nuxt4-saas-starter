import { canDeleteAccount, softDeleteAccount } from '~~/server/utils/gdpr/accountDeletion'

/**
 * POST /api/user/delete-account
 * Request account deletion (GDPR Right to Erasure)
 * 
 * Performs soft delete immediately
 * Hard delete happens after retention period via scheduled job
 */
export default defineEventHandler(async (event) => {
    // Rate limit deletion requests
    await rateLimit(event, { window: 3600, max: 1, prefix: 'ratelimit:delete-account' })

    const session = await requireUserSession(event)
    const body = await readBody(event)

    // Require confirmation
    const { confirmEmail, reason } = body

    if (!confirmEmail) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Email confirmation is required'
        })
    }

    if (confirmEmail.toLowerCase() !== session.user.email.toLowerCase()) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Email does not match. Please enter your email address to confirm.'
        })
    }

    // Check if account can be deleted
    const eligibility = await canDeleteAccount(session.user.id)
    if (!eligibility.canDelete) {
        throw createError({
            statusCode: 400,
            statusMessage: eligibility.reason || 'Account cannot be deleted at this time'
        })
    }

    // Perform soft delete
    await softDeleteAccount(
        event,
        session.user.id,
        session.user.email,
        reason || 'User requested deletion'
    )

    // Clear the session
    await clearUserSession(event)

    return {
        success: true,
        message: 'Your account has been scheduled for deletion. All your data will be permanently removed within 30 days.'
    }
})
