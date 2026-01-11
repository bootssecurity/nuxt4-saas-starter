import { eq } from 'drizzle-orm'
import { db } from 'hub:db'
import { users } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event)

    // Ensure user is business owner
    if (session.user.role !== 'business_owner') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden. Only business owners can access this.'
        })
    }

    if (!session.user.businessId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'User is not associated with a business'
        })
    }

    // Fetch users for this business
    const businessUsers = await db.select()
        .from(users)
        .where(eq(users.businessId, session.user.businessId))
        .all()

    return {
        list: businessUsers
    }
})
