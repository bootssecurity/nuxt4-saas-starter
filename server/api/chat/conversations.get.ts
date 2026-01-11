import { eq, desc, inArray, and, ne, gt, sql, isNull, or, count } from 'drizzle-orm'
import { db } from 'hub:db'
import { conversations, conversationParticipants, users, messages } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event)

    // Fetch conversations where user is a participant
    const userConversations = await db.select({
        id: conversations.id,
        type: conversations.type,
        name: conversations.name,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        encryptedKey: conversationParticipants.encryptedKey,
        lastReadAt: conversationParticipants.lastReadAt
    })
        .from(conversationParticipants)
        .innerJoin(conversations, eq(conversations.id, conversationParticipants.conversationId))
        .where(eq(conversationParticipants.userId, user.id))
        .orderBy(desc(conversations.updatedAt))

    if (userConversations.length === 0) {
        return { conversations: [] }
    }

    const conversationIds = userConversations.map(c => c.id)

    // Fetch unread counts
    const unreadCounts = await db.select({
        conversationId: messages.conversationId,
        count: count(messages.id)
    })
        .from(messages)
        .innerJoin(conversationParticipants, and(
            eq(messages.conversationId, conversationParticipants.conversationId),
            eq(conversationParticipants.userId, user.id)
        ))
        .where(and(
            inArray(messages.conversationId, conversationIds),
            ne(messages.senderId, user.id),
            or(
                isNull(conversationParticipants.lastReadAt),
                gt(messages.createdAt, conversationParticipants.lastReadAt!)
            )
        ))
        .groupBy(messages.conversationId)

    const unreadMap = new Map(unreadCounts.map(u => [u.conversationId, u.count]))

    // Fetch Last Message for each conversation
    // Ideally use window function `row_number()`, but simple N+1 in parallel is fine for small N. Use Promise.all
    const lastMessages = await Promise.all(
        conversationIds.map(async (cid) => {
            const msgs = await db.select({
                content: messages.content,
                iv: messages.iv,
                createdAt: messages.createdAt,
                senderId: messages.senderId
            })
                .from(messages)
                .where(eq(messages.conversationId, cid))
                .orderBy(desc(messages.createdAt))
                .limit(1)

            return {
                conversationId: cid,
                lastMessage: msgs[0] || null
            }
        })
    )
    const lastMessageMap = new Map(lastMessages.map(lm => [lm.conversationId, lm.lastMessage]))

    // Fetch all participants for these conversations
    const allParticipants = await db.select({
        conversationId: conversationParticipants.conversationId,
        userId: conversationParticipants.userId,
        lastReadAt: conversationParticipants.lastReadAt,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email
    })
        .from(conversationParticipants)
        .innerJoin(users, eq(users.id, conversationParticipants.userId))
        .where(inArray(conversationParticipants.conversationId, conversationIds))

    // Map participants to conversations
    const conversationsWithDetails = userConversations.map(convo => {
        const participants = allParticipants.filter(p => p.conversationId === convo.id)

        // Determine Display Name
        let displayName = convo.name
        if (!displayName) {
            if (convo.type === 'direct') {
                const other = participants.find(p => p.userId !== user.id)
                displayName = other ? `${other.firstName} ${other.lastName}` : 'Me (Notes)'
            } else {
                // Group chat fallback
                displayName = participants.map(p => p.firstName).join(', ')
            }
        }

        return {
            ...convo,
            name: displayName,
            unreadCount: unreadMap.get(convo.id) || 0,
            lastMessage: lastMessageMap.get(convo.id),
            participants: participants.map(p => ({
                id: p.userId,
                name: `${p.firstName} ${p.lastName}`,
                email: p.email,
                lastReadAt: p.lastReadAt
            }))
        }
    })

    return { conversations: conversationsWithDetails }
})
