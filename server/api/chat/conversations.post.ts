import { z } from 'zod'
import { eq, inArray } from 'drizzle-orm'
import { db } from 'hub:db'
import { conversations, conversationParticipants, users } from '~~/server/db/schema'
import {
    logSuccess,
    logFailure,
    AuditEventTypes,
    AuditActions,
    ResourceTypes
} from '~~/server/utils/audit'

/**
 * POST /api/chat/conversations
 * Create a new conversation (direct or group chat)
 * 
 * Security:
 * - Authentication required (via global middleware)
 * - Participants must belong to the same business as the creator
 * - Creator is automatically added as a participant
 */
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

    // Extract participant user IDs
    const participantUserIds = body.participants.map(p => p.userId)

    // Ensure the creator is included in participants
    if (!participantUserIds.includes(user.id)) {
        participantUserIds.push(user.id)
    }

    // Security: Verify all participants belong to the same business as the creator
    if (user.businessId) {
        // Fetch users to verify business membership
        const participantUsers = await db.select({
            id: users.id,
            businessId: users.businessId
        })
            .from(users)
            .where(inArray(users.id, participantUserIds))

        // Check each participant belongs to the same business
        const invalidParticipants = participantUsers.filter(
            p => p.businessId !== user.businessId
        )

        if (invalidParticipants.length > 0) {
            await logFailure(event, AuditEventTypes.AUTH_FORBIDDEN, AuditActions.CREATE,
                'Attempted to add participants from different business', {
                actorId: user.id,
                actorEmail: user.email,
                businessId: user.businessId,
                metadata: {
                    invalidUserIds: invalidParticipants.map(p => p.id),
                    conversationType: body.type
                }
            })

            throw createError({
                statusCode: 403,
                statusMessage: 'Cannot add participants from outside your business'
            })
        }

        // Verify all requested users exist
        if (participantUsers.length !== participantUserIds.length) {
            const foundIds = participantUsers.map(p => p.id)
            const missingIds = participantUserIds.filter(id => !foundIds.includes(id))

            await logFailure(event, AuditEventTypes.AUTH_FORBIDDEN, AuditActions.CREATE,
                'Some participant users do not exist', {
                actorId: user.id,
                actorEmail: user.email,
                metadata: { missingUserIds: missingIds }
            })

            throw createError({
                statusCode: 400,
                statusMessage: 'One or more participants do not exist'
            })
        }
    }

    // Create Conversation
    const convo = await db.insert(conversations).values({
        type: body.type,
        name: body.name,
        createdAt: new Date()
    }).returning().get()

    // Add Participants
    if (convo) {
        // Build participant records - ensure creator is included with their encrypted key
        const participantRecords = body.participants.map(p => ({
            conversationId: convo.id,
            userId: p.userId,
            encryptedKey: p.encryptedKey,
            joinedAt: new Date()
        }))

        await db.insert(conversationParticipants).values(participantRecords)

        // Log successful conversation creation
        await logSuccess(event, AuditEventTypes.USER_CREATE, AuditActions.CREATE, {
            actorId: user.id,
            actorEmail: user.email,
            resourceType: ResourceTypes.USER,
            resourceId: convo.id,
            businessId: user.businessId ?? undefined,
            metadata: {
                conversationType: body.type,
                participantCount: participantRecords.length
            }
        })
    }

    return { conversation: convo }
})
