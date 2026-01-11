import { z } from 'zod'
import { eq, and, desc, lt } from 'drizzle-orm'
import { db } from 'hub:db'
import { messages, conversationParticipants } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event)
    const query = getQuery(event)

    const conversationId = Number(query.conversationId)
    const limit = Number(query.limit) || 50
    const beforeId = query.beforeId ? Number(query.beforeId) : undefined

    if (!conversationId) {
        throw createError({ statusCode: 400, statusMessage: 'Missing conversationId' })
    }

    // Verify membership
    const member = await db.select().from(conversationParticipants)
        .where(and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, user.id)
        )).get()

    if (!member) {
        throw createError({ statusCode: 403, statusMessage: 'Not a member' })
    }

    // Fetch messages
    const conditions = [eq(messages.conversationId, conversationId)]
    if (beforeId) {
        conditions.push(lt(messages.id, beforeId))
    }

    const results = await db.select()
        .from(messages)
        .where(and(...conditions))
        .orderBy(desc(messages.createdAt))
        .limit(limit)

    return { messages: results.reverse() } // Return chronological order
})
