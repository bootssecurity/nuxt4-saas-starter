import { eq } from 'drizzle-orm'
import { db } from 'hub:db'
import { users } from '~~/server/db/schema'
import { sanitizeName, sanitizePhone, isValidPhone } from '~~/server/utils/security/sanitize'
import { logSuccess, AuditEventTypes, AuditActions, ResourceTypes } from '~~/server/utils/audit'

/**
 * PUT /api/user/profile
 * Update user profile information
 */
export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event)
    const body = await readBody(event)

    const { firstName, lastName, phone } = body

    // Validate and sanitize inputs
    const updates: Record<string, any> = {}

    if (firstName !== undefined) {
        const sanitizedFirstName = sanitizeName(firstName)
        if (sanitizedFirstName.length < 1) {
            throw createError({
                statusCode: 400,
                statusMessage: 'First name is required'
            })
        }
        updates.firstName = sanitizedFirstName
    }

    if (lastName !== undefined) {
        const sanitizedLastName = sanitizeName(lastName)
        if (sanitizedLastName.length < 1) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Last name is required'
            })
        }
        updates.lastName = sanitizedLastName
    }

    if (phone !== undefined) {
        const sanitizedPhone = sanitizePhone(phone)
        if (sanitizedPhone && !isValidPhone(sanitizedPhone)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid phone number format'
            })
        }
        updates.phone = sanitizedPhone || null
    }

    if (Object.keys(updates).length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'No valid updates provided'
        })
    }

    updates.updatedAt = new Date()

    // Update user
    await db.update(users)
        .set(updates)
        .where(eq(users.id, session.user.id))

    // Log the update
    await logSuccess(event, AuditEventTypes.USER_UPDATE, AuditActions.UPDATE, {
        actorId: session.user.id,
        actorEmail: session.user.email,
        resourceType: ResourceTypes.USER,
        resourceId: session.user.id,
        metadata: { updatedFields: Object.keys(updates).filter(k => k !== 'updatedAt') }
    })

    return {
        success: true,
        message: 'Profile updated successfully'
    }
})
