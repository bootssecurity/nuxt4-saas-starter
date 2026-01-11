import { exportUserData, createExportRequest, completeExportRequest } from '~~/server/utils/gdpr/dataExport'

/**
 * POST /api/user/data-export
 * Request a data export (GDPR DSAR)
 * 
 * Returns all user data in a structured JSON format
 */
export default defineEventHandler(async (event) => {
    // Rate limit data exports
    await rateLimit(event, { window: 3600, max: 3, prefix: 'ratelimit:data-export' })

    const session = await requireUserSession(event)

    // Create export request record
    const requestId = await createExportRequest(event, session.user.id)

    try {
        // Export all user data
        const data = await exportUserData(event, session.user.id, session.user.email)

        // Mark request as completed
        await completeExportRequest(requestId)

        return {
            success: true,
            message: 'Data export completed',
            data
        }
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to export data. Please try again later.'
        })
    }
})
