import { eq } from 'drizzle-orm'
import { db } from 'hub:db'
import { users, businesses } from '~~/server/database/schema'

/**
 * GET /api/auth/me
 * Get current user profile
 */
export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event)


    // Get fresh user data
    const user = await db.select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .get()

    if (!user) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found'
        })
    }

    // Get business if user has one
    let business = null
    if (user.businessId) {
        business = await db.select()
            .from(businesses)
            .where(eq(businesses.id, user.businessId))
            .get()
    }

    return {
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt
        },
        business: business ? {
            id: business.id,
            name: business.name,
            code: business.code,
            createdAt: business.createdAt
        } : null
    }
})
