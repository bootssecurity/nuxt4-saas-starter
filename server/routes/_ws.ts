import { defineWebSocketHandler } from 'h3'
import { db } from 'hub:db'
import { messages, conversationParticipants } from '~~/server/db/schema'
import { eq, and } from 'drizzle-orm'

const peers = new Map<any, { userId: number | null, channels: Set<string> }>()

export default defineWebSocketHandler({
    open(peer) {
        peers.set(peer, { userId: null, channels: new Set() })
    },

    async message(peer, message) {
        const textMsg = message.text()

        if (textMsg.includes('ping')) {
            peer.send('pong')
            return
        }

        try {
            const parsed = JSON.parse(textMsg)

            // Handle subscription
            if (parsed.type === 'subscribe' && parsed.conversationId) {
                const channel = `conversation:${parsed.conversationId}`
                peer.subscribe(channel)

                // Track state
                const peerData = peers.get(peer)
                if (peerData) {
                    peerData.channels.add(channel)
                    if (parsed.userId) peerData.userId = parsed.userId
                }

                // Broadcast ONLINE status to this channel
                if (parsed.userId) {
                    peer.publish(channel, JSON.stringify({
                        type: 'status',
                        userId: parsed.userId,
                        status: 'online',
                        conversationId: parsed.conversationId
                    }))

                    // Send existing online users in this channel TO the new user
                    for (const [otherPeer, data] of peers.entries()) {
                        if (otherPeer !== peer && data.channels.has(channel) && data.userId) {
                            peer.send(JSON.stringify({
                                type: 'status',
                                userId: data.userId,
                                status: 'online',
                                conversationId: parsed.conversationId
                            }))
                        }
                    }
                }
                return
            }

            // Handle new message
            if (parsed.type === 'message' && parsed.conversationId && parsed.content && parsed.iv && parsed.senderId) {
                // Persist to DB
                await db.insert(messages).values({
                    conversationId: parsed.conversationId,
                    senderId: parsed.senderId,
                    content: parsed.content,
                    iv: parsed.iv,
                    createdAt: new Date()
                })

                // Broadcast to conversation channel
                peer.publish(`conversation:${parsed.conversationId}`, textMsg)
            }

            // Handle read receipt
            if (parsed.type === 'read' && parsed.conversationId && parsed.userId) {
                // Persist to DB
                await db.update(conversationParticipants)
                    .set({ lastReadAt: new Date() })
                    .where(and(
                        eq(conversationParticipants.conversationId, parsed.conversationId),
                        eq(conversationParticipants.userId, parsed.userId)
                    ))

                // Broadcast to conversation channel
                peer.publish(`conversation:${parsed.conversationId}`, JSON.stringify({
                    type: 'read',
                    conversationId: parsed.conversationId,
                    userId: parsed.userId,
                    lastReadAt: new Date()
                }))
            }
        } catch (e) {
            console.error('WS Error:', e)
        }
    },

    close(peer, event) {
        const peerData = peers.get(peer)
        if (peerData && peerData.userId) {
            // Broadcast OFFLINE to all subscribed channels
            for (const channel of peerData.channels) {
                // We need to parse conversationId from channel name 'conversation:123'
                const conversationId = parseInt(channel.split(':')[1])
                peer.publish(channel, JSON.stringify({
                    type: 'status',
                    userId: peerData.userId,
                    status: 'offline',
                    conversationId
                }))
            }
        }
        peers.delete(peer)
    },

    error(peer, error) {
        // console.log('[ws] error', peer, error)
        peers.delete(peer)
    },
})
