import { eq } from 'drizzle-orm'
import { db } from 'hub:db'
import { users, magicTokens } from '~~/server/db/schema'
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
 * - Constant-time response to prevent timing attacks
 * - All attempts are audit logged
 */

// Minimum response time in milliseconds to prevent timing attacks
const MIN_RESPONSE_TIME_MS = 500

export default defineEventHandler(async (event) => {
    const startTime = Date.now()

    // Helper to ensure minimum response time
    const ensureMinResponseTime = async () => {
        const elapsed = Date.now() - startTime
        if (elapsed < MIN_RESPONSE_TIME_MS) {
            await new Promise(resolve => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed))
        }
    }

    // Apply rate limiting
    await rateLimit(event, RATE_LIMITS.login)

    const body = await readBody(event)
    const { email, token: turnstileToken } = body

    // Verify Turnstile Token
    const turnstile = await verifyTurnstileToken(turnstileToken)
    if (!turnstile.success) {
        await logFailure(event, AuditEventTypes.AUTH_LOGIN_ATTEMPT, AuditActions.LOGIN,
            'Invalid captcha token', { metadata: { email } })

        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid captcha'
        })
    }

    if (!email) {
        await logFailure(event, AuditEventTypes.AUTH_LOGIN_ATTEMPT, AuditActions.LOGIN,
            'Email not provided', { metadata: { email: null } })

        await ensureMinResponseTime()
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

        await ensureMinResponseTime()
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

        // Wait for minimum response time to prevent timing attacks
        await ensureMinResponseTime()

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

    // Ensure minimum response time even for successful requests
    await ensureMinResponseTime()

    return {
        success: true,
        message: 'If this email exists, a magic link has been sent'
    }
})
