import { eq } from 'drizzle-orm'
import { db } from 'hub:db'
import { businesses } from '~~/server/database/schema'

/**
 * GET /api/business/validate-code
 * Validate if a company code exists
 * 
 * Security:
 * - Rate limited: 10 requests per 60 seconds (prevents brute force)
 */
export default defineEventHandler(async (event) => {
    // Apply rate limiting to prevent brute-force code guessing
    await rateLimit(event, RATE_LIMITS.validateCode)

    const query = getQuery(event)
    const code = query.code as string

    if (!code) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Company code is required'
        })
    }

    // Validate code format (must be 6 characters: 3 letters + 3 numbers)
    const codeRegex = /^[A-Z]{3}\d{3}$/
    if (!codeRegex.test(code.toUpperCase())) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid company code format'
        })
    }

    const business = await db.select({
        id: businesses.id,
        name: businesses.name,
    })
        .from(businesses)
        .where(eq(businesses.code, code.toUpperCase()))
        .get()

    if (!business) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Invalid company code'
        })
    }

    return {
        valid: true,
        businessName: business.name
    }
})
