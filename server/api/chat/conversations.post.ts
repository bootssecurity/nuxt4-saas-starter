import { z } from 'zod'
import { db } from 'hub:db'
import { conversations, conversationParticipants } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event)

    const schema = z.object({
        type: z.enum(['direct', 'group']),
        name: z.string().optional(),
        participants: z.array(z.object({
            userId: z.number(),
            encryptedKey: z.string() // Key encrypted with user's Public Key
        }))
    })

    const body = await readValidatedBody(event, schema.parse)

    // Create Conversation
    const convo = await db.insert(conversations).values({
        type: body.type,
        name: body.name,
        createdAt: new Date()
    }).returning().get()

    // Add Participants
    if (convo) {
        await db.insert(conversationParticipants).values(
            body.participants.map(p => ({
                conversationId: convo.id,
                userId: p.userId,
                encryptedKey: p.encryptedKey,
                joinedAt: new Date()
            }))
        )
    }

    return { conversation: convo }
})
