import { eq, and, gt } from 'drizzle-orm'
import { db } from 'hub:db'
import { businesses, users, magicTokens } from '~~/server/db/schema'
import {
    logSuccess,
    logFailure,
    AuditEventTypes,
    AuditActions,
    ResourceTypes
} from '~~/server/utils/audit'
import { createTrackedSession } from '~~/server/utils/session'

/**
 * GET /api/auth/verify
 * Verify magic link token and create session
 * 
 * Security:
 * - Rate limited: 10 requests per 60 seconds
 * - Tokens are single-use
 * - Tokens expire after 15 minutes
 * - All verification attempts are audit logged
 */
export default defineEventHandler(async (event) => {
    // Apply rate limiting
    await rateLimit(event, RATE_LIMITS.verify)

    const query = getQuery(event)
    const token = query.token as string

    if (!token) {
        await logFailure(event, AuditEventTypes.AUTH_TOKEN_INVALID, AuditActions.LOGIN,
            'Token not provided')

        throw createError({
            statusCode: 400,
            statusMessage: 'Token is required'
        })
    }

    // Find valid token
    const magicToken = await db.select()
        .from(magicTokens)
        .where(
            and(
                eq(magicTokens.token, token),
                eq(magicTokens.used, false),
                gt(magicTokens.expiresAt, new Date())
            )
        )
        .get()

    if (!magicToken) {
        // Check if token exists but is expired or used
        const expiredToken = await db.select()
            .from(magicTokens)
            .where(eq(magicTokens.token, token))
            .get()

        if (expiredToken?.used) {
            await logFailure(event, AuditEventTypes.AUTH_TOKEN_USED, AuditActions.LOGIN,
                'Token already used', { metadata: { tokenId: expiredToken.id } })
        } else if (expiredToken) {
            await logFailure(event, AuditEventTypes.AUTH_TOKEN_EXPIRED, AuditActions.LOGIN,
                'Token expired', { metadata: { tokenId: expiredToken.id } })
        } else {
            await logFailure(event, AuditEventTypes.AUTH_TOKEN_INVALID, AuditActions.LOGIN,
                'Token not found')
        }

        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid or expired token'
        })
    }

    // Parse metadata
    const metadata = magicToken.metadata ? JSON.parse(magicToken.metadata) : {}

    let user
    let business

    // Handle different token types
    if (magicToken.type === 'signup_business') {
        // Create business with unique code
        let businessCode = generateBusinessCode()

        // Ensure code is unique (retry if collision)
        let attempts = 0
        while (attempts < 10) {
            const existing = await db.select()
                .from(businesses)
                .where(eq(businesses.code, businessCode))
                .get()

            if (!existing) break
            businessCode = generateBusinessCode()
            attempts++
        }

        // Create business
        const businessResult = await db.insert(businesses)
            .values({
                name: metadata.businessName,
                code: businessCode
            })
            .returning()

        business = businessResult[0]

        // Log business creation
        await logSuccess(event, AuditEventTypes.BUSINESS_CREATED, AuditActions.CREATE, {
            resourceType: ResourceTypes.BUSINESS,
            resourceId: business.id,
            businessId: business.id,
            metadata: { businessName: business.name, businessCode: business.code }
        })

        // Create user as business owner
        const userResult = await db.insert(users)
            .values({
                email: metadata.email,
                firstName: metadata.firstName,
                lastName: metadata.lastName,
                phone: metadata.phone,
                role: 'business_owner',
                businessId: business.id,
                consentTimestamp: new Date(),
                privacyPolicyVersion: '1.0',
                termsVersion: '1.0'
            })
            .returning()

        user = userResult[0]

        // Log user creation
        await logSuccess(event, AuditEventTypes.AUTH_SIGNUP_SUCCESS, AuditActions.CREATE, {
            actorId: user.id,
            actorEmail: user.email,
            resourceType: ResourceTypes.USER,
            resourceId: user.id,
            businessId: business.id,
            metadata: { signupType: 'business', role: 'business_owner' }
        })

    } else if (magicToken.type === 'signup_employee') {
        // Create user as employee
        const userResult = await db.insert(users)
            .values({
                email: metadata.email,
                firstName: metadata.firstName,
                lastName: metadata.lastName,
                phone: metadata.phone,
                role: 'employee',
                businessId: metadata.businessId,
                consentTimestamp: new Date(),
                privacyPolicyVersion: '1.0',
                termsVersion: '1.0'
            })
            .returning()

        user = userResult[0]

        // Get business info
        business = await db.select()
            .from(businesses)
            .where(eq(businesses.id, metadata.businessId))
            .get()

        // Log user creation
        await logSuccess(event, AuditEventTypes.AUTH_SIGNUP_SUCCESS, AuditActions.CREATE, {
            actorId: user.id,
            actorEmail: user.email,
            resourceType: ResourceTypes.USER,
            resourceId: user.id,
            businessId: metadata.businessId,
            metadata: { signupType: 'employee', role: 'employee', businessName: business?.name }
        })

    } else if (magicToken.type === 'login') {
        // Get existing user
        user = await db.select()
            .from(users)
            .where(eq(users.id, metadata.userId))
            .get()

        if (!user) {
            await logFailure(event, AuditEventTypes.AUTH_LOGIN_FAILURE, AuditActions.LOGIN,
                'User not found during token verification', { metadata: { userId: metadata.userId } })

            throw createError({
                statusCode: 400,
                statusMessage: 'User not found'
            })
        }

        // Get business info if user has one
        if (user.businessId) {
            business = await db.select()
                .from(businesses)
                .where(eq(businesses.id, user.businessId))
                .get()
        }

        // Log successful login
        await logSuccess(event, AuditEventTypes.AUTH_LOGIN_SUCCESS, AuditActions.LOGIN, {
            actorId: user.id,
            actorEmail: user.email,
            resourceType: ResourceTypes.USER,
            resourceId: user.id,
            businessId: user.businessId ?? undefined,
            metadata: { method: 'magic_link' }
        })
    }

    // Mark token as used
    await db.update(magicTokens)
        .set({ used: true })
        .where(eq(magicTokens.id, magicToken.id))

    // Update user lastLoginAt
    await db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user!.id))

    // Log token used
    await logSuccess(event, AuditEventTypes.AUTH_TOKEN_USED, AuditActions.UPDATE, {
        actorId: user!.id,
        actorEmail: user!.email,
        resourceType: ResourceTypes.TOKEN,
        resourceId: magicToken.id,
        metadata: { tokenType: magicToken.type }
    })

    // Create tracked session in database
    const { sessionToken } = await createTrackedSession(event, user!.id, user!.email, user!.businessId ?? undefined)

    // Set user session using nuxt-auth-utils
    await setUserSession(event, {
        user: {
            id: user!.id,
            email: user!.email,
            firstName: user!.firstName,
            lastName: user!.lastName,
            role: user!.role as 'business_owner' | 'employee',
            businessId: user!.businessId,
            businessName: business?.name,
            businessCode: business?.code,
            status: user!.status || 'active' // Default to active for existing users
        },
        sessionToken,
        loggedInAt: new Date()
    })

    // Log session creation
    await logSuccess(event, AuditEventTypes.SESSION_CREATED, AuditActions.CREATE, {
        actorId: user!.id,
        actorEmail: user!.email,
        resourceType: ResourceTypes.SESSION,
        businessId: user!.businessId ?? undefined,
        metadata: { method: 'magic_link', sessionToken }
    })

    return {
        success: true,
        user: {
            id: user!.id,
            email: user!.email,
            firstName: user!.firstName,
            lastName: user!.lastName,
            role: user!.role
        },
        business: business ? {
            id: business.id,
            name: business.name,
            code: business.code
        } : null
    }
})
