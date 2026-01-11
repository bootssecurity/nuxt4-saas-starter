import { eq } from 'drizzle-orm'
import { db } from 'hub:db'
import { users, magicTokens } from '~~/server/database/schema'
import {
    logSuccess,
    logFailure,
    AuditEventTypes,
    AuditActions,
    ResourceTypes
} from '~~/server/utils/audit'

/**
 * POST /api/auth/login
 * Initiate login - sends magic link email
 * 
 * Security:
 * - Rate limited: 5 requests per 60 seconds
 * - Does not reveal if email exists (returns same message regardless)
 * - All attempts are audit logged
 */
export default defineEventHandler(async (event) => {
    // Apply rate limiting
    await rateLimit(event, RATE_LIMITS.login)

    const body = await readBody(event)
    const { email } = body

    if (!email) {
        await logFailure(event, AuditEventTypes.AUTH_LOGIN_ATTEMPT, AuditActions.LOGIN,
            'Email not provided', { metadata: { email: null } })

        throw createError({
            statusCode: 400,
            statusMessage: 'Email is required'
        })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        await logFailure(event, AuditEventTypes.AUTH_LOGIN_ATTEMPT, AuditActions.LOGIN,
            'Invalid email format', { metadata: { email } })

        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid email format'
        })
    }

    // Check if user exists
    const user = await db.select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .get()

    if (!user) {
        // Log attempt but don't reveal if user exists
        await logFailure(event, AuditEventTypes.AUTH_LOGIN_ATTEMPT, AuditActions.LOGIN,
            'User not found', { metadata: { email: email.toLowerCase() } })

        // Don't reveal if user exists - still show success message
        return {
            success: true,
            message: 'If this email exists, a magic link has been sent'
        }
    }

    // Generate magic token
    const token = generateMagicToken()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store user ID in metadata
    const metadata = JSON.stringify({
        userId: user.id
    })

    // Delete any existing tokens for this email
    await db.delete(magicTokens)
        .where(eq(magicTokens.email, email.toLowerCase()))

    // Create new magic token
    await db.insert(magicTokens).values({
        email: email.toLowerCase(),
        token,
        type: 'login',
        metadata,
        expiresAt
    })

    // Log successful token creation
    await logSuccess(event, AuditEventTypes.AUTH_TOKEN_CREATED, AuditActions.CREATE, {
        actorId: user.id,
        actorEmail: user.email,
        resourceType: ResourceTypes.TOKEN,
        businessId: user.businessId ?? undefined,
        metadata: { tokenType: 'login', expiresAt: expiresAt.toISOString() }
    })

    // Build magic link URL using getPublicUrl utility
    const appUrl = getPublicUrl(event)
    const magicLink = `${appUrl}/auth/verify?token=${token}`

    // Send magic link email
    await sendMagicLinkEmail({
        to: email,
        firstName: user.firstName,
        type: 'login',
        magicLink
    })

    // Log successful login attempt (magic link sent)
    await logSuccess(event, AuditEventTypes.AUTH_LOGIN_ATTEMPT, AuditActions.ATTEMPT, {
        actorId: user.id,
        actorEmail: user.email,
        resourceType: ResourceTypes.USER,
        resourceId: user.id,
        businessId: user.businessId ?? undefined,
        metadata: { method: 'magic_link' }
    })

    return {
        success: true,
        message: 'If this email exists, a magic link has been sent'
    }
})
