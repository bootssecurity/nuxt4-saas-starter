import { blob } from 'hub:blob'
import {
    logSuccess,
    logFailure,
    AuditEventTypes,
    AuditActions,
    ResourceTypes
} from '~~/server/utils/audit'

/**
 * POST /api/upload
 * 
 * Secure file upload endpoint with:
 * - Authentication (handled by global api-auth middleware)
 * - Rate limiting
 * - File type validation (whitelist)
 * - File size validation
 * - Filename sanitization
 * - Audit logging
 */

// Allowed file types (MIME types)
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
]

// Maximum file size (10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

export default defineEventHandler(async (event) => {
    // Authentication is now handled by global api-auth middleware
    const { user } = await getUserSession(event)

    // Apply rate limiting for uploads
    await rateLimit(event, { window: 60, max: 20, prefix: 'ratelimit:upload' })

    const form = await readFormData(event)
    const file = form.get('file') as File

    if (!file || !(file instanceof File)) {
        await logFailure(event, AuditEventTypes.FILE_UPLOAD, AuditActions.CREATE,
            'No file provided', {
            actorId: user!.id,
            actorEmail: user!.email,
            resourceType: ResourceTypes.FILE,
            businessId: user!.businessId ?? undefined
        })

        throw createError({
            statusCode: 400,
            statusMessage: 'No file provided'
        })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        await logFailure(event, AuditEventTypes.FILE_UPLOAD, AuditActions.CREATE,
            'File too large', {
            actorId: user!.id,
            actorEmail: user!.email,
            resourceType: ResourceTypes.FILE,
            businessId: user!.businessId ?? undefined,
            metadata: { fileSize: file.size, maxSize: MAX_FILE_SIZE }
        })

        throw createError({
            statusCode: 413,
            statusMessage: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
        })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
        await logFailure(event, AuditEventTypes.FILE_UPLOAD, AuditActions.CREATE,
            'File type not allowed', {
            actorId: user!.id,
            actorEmail: user!.email,
            resourceType: ResourceTypes.FILE,
            businessId: user!.businessId ?? undefined,
            metadata: { fileType: file.type, allowedTypes: ALLOWED_TYPES }
        })

        throw createError({
            statusCode: 415,
            statusMessage: 'File type not allowed'
        })
    }

    // Sanitize filename - remove any path traversal attempts and special chars
    const originalName = file.name || 'unnamed'
    const safeFilename = originalName
        .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace special chars with underscore
        .replace(/\.+/g, '.')               // Remove consecutive dots
        .replace(/^\./, '_')                // Don't start with dot
        .substring(0, 100)                  // Limit length

    // Generate unique filename with timestamp and user/business scoping
    const timestamp = Date.now()
    const scope = user!.businessId ? `business-${user!.businessId}` : `user-${user!.id}`
    const filename = `uploads/${scope}/${timestamp}-${safeFilename}`

    // Upload to R2 blob storage
    const result = await blob.put(filename, file)

    // Log successful upload
    await logSuccess(event, AuditEventTypes.FILE_UPLOAD, AuditActions.CREATE, {
        actorId: user!.id,
        actorEmail: user!.email,
        resourceType: ResourceTypes.FILE,
        businessId: user!.businessId ?? undefined,
        metadata: {
            filename: result.pathname,
            originalName: file.name,
            size: file.size,
            type: file.type
        }
    })

    return {
        success: true,
        filename: result.pathname,
        size: file.size,
        type: file.type
    }
})
