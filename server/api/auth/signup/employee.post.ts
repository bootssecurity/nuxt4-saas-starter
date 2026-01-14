import { eq } from 'drizzle-orm'
import { db } from 'hub:db'
import { businesses, users, magicTokens } from '~~/server/db/schema'
import {
    logSuccess,
    logFailure,
    AuditEventTypes,
    AuditActions,
    ResourceTypes
} from '~~/server/utils/audit'

/**
 * POST /api/auth/signup/employee
 * Initiate employee signup - sends magic link email
 * 
 * Security:
 * - Rate limited: 3 requests per 60 seconds
 * - Does not reveal if email exists (returns same success message)
 * - Company code validation is separate and rate-limited
 * - All attempts are audit logged
 */
export default defineEventHandler(async (event) => {
    // Apply rate limiting
    await rateLimit(event, RATE_LIMITS.signup)

    const body = await readBody(event)

    // Validate required fields
    const { email, firstName, lastName, phone, companyCode, token: turnstileToken } = body

    // Verify Turnstile Token
    const turnstile = await verifyTurnstileToken(turnstileToken)
    if (!turnstile.success) {
        await logFailure(event, AuditEventTypes.AUTH_SIGNUP_ATTEMPT, AuditActions.ATTEMPT,
            'Invalid captcha token', { metadata: { email, signupType: 'employee' } })

        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid captcha'
        })
    }

    if (!email || !firstName || !lastName || !companyCode) {
        await logFailure(event, AuditEventTypes.AUTH_SIGNUP_ATTEMPT, AuditActions.ATTEMPT,
            'Missing required fields', {
            metadata: {
                hasEmail: !!email,
                hasFirstName: !!firstName,
                hasLastName: !!lastName,
                hasCompanyCode: !!companyCode,
                signupType: 'employee'
            }
        })

        throw createError({
            statusCode: 400,
            statusMessage: 'Email, first name, last name, and company code are required'
        })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        await logFailure(event, AuditEventTypes.AUTH_SIGNUP_ATTEMPT, AuditActions.ATTEMPT,
            'Invalid email format', { metadata: { email, signupType: 'employee' } })

        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid email format'
        })
    }

    // Validate company code exists
    const business = await db.select()
        .from(businesses)
        .where(eq(businesses.code, companyCode.toUpperCase()))
        .get()

    if (!business) {
        await logFailure(event, AuditEventTypes.AUTH_SIGNUP_ATTEMPT, AuditActions.ATTEMPT,
            'Invalid company code', {
            metadata: {
                companyCode: companyCode.toUpperCase(),
                signupType: 'employee'
            }
        })

        throw createError({
            statusCode: 404,
            statusMessage: 'Invalid company code'
        })
    }

    // Check if email already exists
    const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .get()

    if (existingUser) {
        // Security: Don't reveal if email exists
        await logFailure(event, AuditEventTypes.AUTH_SIGNUP_ATTEMPT, AuditActions.ATTEMPT,
            'Email already registered', {
            metadata: {
                email: email.toLowerCase(),
                signupType: 'employee',
                businessId: business.id
            }
        })

        return {
            success: true,
            message: 'If eligible, a verification link has been sent to your email',
            businessName: business.name
        }
    }

    // Generate magic token
    const token = generateMagicToken()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store signup data in metadata
    const metadata = JSON.stringify({
        email: email.toLowerCase(),
        firstName,
        lastName,
        phone: phone || null,
        businessId: business.id,
        companyCode: companyCode.toUpperCase()
    })

    // Delete any existing tokens for this email
    await db.delete(magicTokens)
        .where(eq(magicTokens.email, email.toLowerCase()))

    // Create new magic token
    await db.insert(magicTokens).values({
        email: email.toLowerCase(),
        token,
        type: 'signup_employee',
        metadata,
        expiresAt
    })

    // Log token creation
    await logSuccess(event, AuditEventTypes.AUTH_TOKEN_CREATED, AuditActions.CREATE, {
        resourceType: ResourceTypes.TOKEN,
        businessId: business.id,
        metadata: {
            tokenType: 'signup_employee',
            email: email.toLowerCase(),
            businessName: business.name,
            expiresAt: expiresAt.toISOString()
        }
    })

    // Build magic link URL using getPublicUrl utility
    const appUrl = getPublicUrl(event)
    const magicLink = `${appUrl}/auth/verify?token=${token}`

    // Send magic link email
    await sendMagicLinkEmail({
        to: email,
        firstName,
        type: 'signup_employee',
        magicLink
    })

    // Log successful signup attempt
    await logSuccess(event, AuditEventTypes.AUTH_SIGNUP_ATTEMPT, AuditActions.ATTEMPT, {
        resourceType: ResourceTypes.USER,
        businessId: business.id,
        metadata: {
            email: email.toLowerCase(),
            signupType: 'employee',
            businessName: business.name,
            method: 'magic_link'
        }
    })

    return {
        success: true,
        message: 'If eligible, a verification link has been sent to your email',
        businessName: business.name
    }
})
