import { eq, and } from 'drizzle-orm'
import { db } from 'hub:db'
import { users, magicTokens } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event)
    const userId = getRouterParam(event, 'id')

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

    // Prevent deleting self
    if (parseInt(userId!) === session.user.id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Cannot delete yourself'
        })
    }

    const id = parseInt(userId!)

    // Verify user belongs to business
    const existingUser = await db.select()
        .from(users)
        .where(
            and(
                eq(users.id, id),
                eq(users.businessId, session.user.businessId!)
            )
        )
        .get()

    if (!existingUser) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found'
        })
    }

    // Delete associated magic tokens first
    await db.delete(magicTokens).where(eq(magicTokens.email, existingUser.email))

    // Delete user
    await db.delete(users)
        .where(eq(users.id, id))

    return { success: true }
})
