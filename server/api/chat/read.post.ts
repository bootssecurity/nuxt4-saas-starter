import { db } from 'hub:db'
import { conversationParticipants } from '~~/server/database/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
    conversationId: z.number()
})

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event)
    const body = await readValidatedBody(event, schema.parse)

    await db.update(conversationParticipants)
        .set({
            lastReadAt: new Date()
        })
        .where(and(
            eq(conversationParticipants.conversationId, body.conversationId),
            eq(conversationParticipants.userId, user.id)
        ))

    return { success: true }
})
