import { blob } from 'hub:blob'
import {
    logSuccess,
    AuditEventTypes,
    AuditActions,
    ResourceTypes
} from '~~/server/utils/audit'

/**
 * GET /api/files
 * 
 * Secure file listing endpoint with:
 * - Authentication (handled by global api-auth middleware)
 * - Scoped to user's business/personal files
 * - Audit logging
 */
export default defineEventHandler(async (event) => {
    // Authentication is now handled by global api-auth middleware
    const { user } = await getUserSession(event)

    const query = getQuery(event)

    // Scope files to user's business or personal folder
    // Users can only see files in their scope
    const scope = user!.businessId ? `business-${user!.businessId}` : `user-${user!.id}`
    const basePrefix = `uploads/${scope}/`

    // User can optionally filter within their scope
    const additionalPrefix = (query.prefix as string) || ''
    // Sanitize additional prefix to prevent path traversal
    const safeAdditionalPrefix = additionalPrefix.replace(/\.\./g, '').replace(/^\/+/, '')
    const fullPrefix = basePrefix + safeAdditionalPrefix

    // List blobs with the scoped prefix
    const files = await blob.list({ prefix: fullPrefix })

    // Log file listing access
    await logSuccess(event, AuditEventTypes.FILE_LIST, AuditActions.READ, {
        actorId: user!.id,
        actorEmail: user!.email,
        resourceType: ResourceTypes.FILE,
        businessId: user!.businessId ?? undefined,
        metadata: {
            prefix: fullPrefix,
            filesCount: files.blobs.length
        }
    })

    return {
        files: files.blobs.map(file => ({
            ...file,
            // Return relative path without exposing internal structure
            pathname: file.pathname.replace(basePrefix, '')
        })),
        total: files.blobs.length
    }
})
