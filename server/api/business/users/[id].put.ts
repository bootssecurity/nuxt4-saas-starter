import { eq, and } from 'drizzle-orm'
import { db } from 'hub:db'
import { users } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event)
    const userId = getRouterParam(event, 'id')
    const body = await readBody(event)

    // Ensure user is business owner
    if (session.user.role !== 'business_owner') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden'
        })
    }

    if (!session.user.businessId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'No business associated'
        })
    }

    // Ensure target user belongs to same business
    const id = parseInt(userId!)

    if (isNaN(id)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid ID'
        })
    }

    const { firstName, lastName, phone, role, status } = body

    // Security: Business owners must always be active.
    // We enforce this by checking if the target user is an owner, OR if the new role is owner.
    // However, since we don't fetch the user first (for performance), we can ensure it in the update query 
    // or by fetching. Fetching is safer for complex logic.

    // Fetch user to verify role before update
    const targetUser = await db.select().from(users).where(and(eq(users.id, id), eq(users.businessId, session.user.businessId!))).get()

    if (!targetUser) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found'
        })
    }

    // If target is business owner, force status to active
    const newStatus = (targetUser.role === 'business_owner' || role === 'business_owner') ? 'active' : status

    // Update user
    const updatedUser = await db.update(users)
        .set({
            firstName,
            lastName,
            phone,
            role,
            status: newStatus
        })
        .where(eq(users.id, id))
        .returning()
        .get()

    if (!updatedUser) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found'
        })
    }

    return updatedUser
})
