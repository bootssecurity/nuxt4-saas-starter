import { defineStore } from 'pinia'
import * as crypto from '~/utils/crypto'

export const useChatStore = defineStore('chat', {
    state: () => ({
        userId: null as number | null,
        isOpen: false,
        conversations: [] as any[],
        messages: {} as Record<number, any[]>,
        activeConversationId: null as number | null,

        // Crypto
        keyPair: null as CryptoKeyPair | null,
        sessionKeys: {} as Record<number, CryptoKey>, // conversationId -> AES Key

        // WS
        ws: null as WebSocket | null,
        isConnected: false,
        onlineStatus: {} as Record<number, string> // userId -> 'online' | 'offline'
    }),

    actions: {
        async init() {
            // 0. Fetch User ID
            try {
                const { user } = await $fetch('/api/auth/me') as any
                if (user?.id) {
                    this.userId = user.id
                }
            } catch (e) {
                console.error('Failed to load session in ChatStore', e)
            }

            // 1. Load or Generate Identity Key
            await this.loadIdentity()

            // 2. Connect WS
            this.connectWs()

            // 3. Fetch Conversations
            await this.fetchConversations()
        },

        async loadIdentity() {
            if (!this.userId) return; // Wait for user ID

            const storedPrivate = localStorage.getItem(`chat_priv_key_${this.userId}`)
            const storedPublic = localStorage.getItem(`chat_pub_key_${this.userId}`)

            if (storedPrivate && storedPublic) {
                this.keyPair = {
                    privateKey: await crypto.importKey(JSON.parse(storedPrivate), 'private'),
                    publicKey: await crypto.importKey(JSON.parse(storedPublic), 'public')
                }
            } else {
                // Generate
                this.keyPair = await crypto.generateKeyPair()
                const exportedPrivate = await crypto.exportKey(this.keyPair.privateKey)
                const exportedPublic = await crypto.exportKey(this.keyPair.publicKey)

                localStorage.setItem(`chat_priv_key_${this.userId}`, JSON.stringify(exportedPrivate))
                localStorage.setItem(`chat_pub_key_${this.userId}`, JSON.stringify(exportedPublic))

                // Upload Public Key to Server
                await $fetch('/api/chat/keys', {
                    method: 'POST',
                    body: { publicKey: JSON.stringify(exportedPublic) }
                })
            }
        },

        async fetchConversations() {
            const { conversations } = await $fetch('/api/chat/conversations')
            this.conversations = conversations

            // Decrypt Session Keys for each conversation
            for (const convo of conversations) {
                if (convo.encryptedKey && this.keyPair) {
                    try {
                        // The encryptedKey stored in DB is actually: { content, iv } stringified? 
                        // Or we need to define that structure.
                        // For now assuming JSON string: { "content": "...", "iv": "..." }
                        // But wait, who encrypted it? The creator.
                        // The creator derived a shared secret with US.
                        // So we need:
                        // 1. Fetch Creator's Public Key? NO.
                        // We need the KEK. 
                        // Wait, the "encryptedKey" column is specific to the participant?
                        // YES. In `conversationParticipants` table.
                        // It is encrypted with a KEK derived from (Creator Private + Our Public) = (Our Private + Creator Public).
                        // BAD DESIGN: We don't know who created it easily here without looking up metadata.
                        // BETTER DESIGN: The 'encryptedKey' is purely the AES Key wrapped with OUR Public Key? 
                        // No, you can't wrap with just Public Key in ECDH. You need shared secret.
                        // OK, Standard Signal Protocol is complex.
                        // SIMPLIFIED APPROACH for this task:
                        // Use "Sender Box" pattern?
                        // Or simply: When Alice adds Bob, she derives Secret(AlicePriv, BobPub).
                        // She wraps ConversationKey with that Secret.
                        // Bob derives Secret(BobPriv, AlicePub). It's the same Secret.
                        // Bob unwraps.
                        // PROBLEM: We need Alice's identifiers to know WHICH Public Key to use to derive.
                        // If we are Bob, we need Alice's Public Key.
                        // Does `conversations` or `participants` tell us who added us?
                        // Maybe not.

                        // FALLBACK for MVP:
                        // The schema has `publicKey` on user.
                        // The `encryptedKey` field needs to store "creatorId" or similar?
                        // OR: We store `ephemeralPublicKey` in the `encryptedKey` JSON blob?
                        // YES. Alice generates Ephemeral Key pair. Derives Secret(EphPriv, BobPub). Wraps Key.
                        // Alice publishes { ephemeralPub: ..., ciphertext: ... } to Bob's entry.
                        // Bob uses Secret(BobPriv, EphPub) to unwrap.
                        // This works and is standard (ECIES).

                        // Refactor `crypto.ts` later if needed? 
                        // Let's assume the JSON blob has { ephemPubKey, ciphertext, iv }.

                        const payload = JSON.parse(convo.encryptedKey)
                        const ephemKey = await crypto.importKey(payload.ephemPubKey, 'public')
                        const content = payload.content
                        const iv = payload.iv

                        const sharedSecret = await crypto.deriveInternalSharedKey(this.keyPair.privateKey, ephemKey)
                        const sessionKey = await crypto.unwrapKey(content, iv, sharedSecret)

                        this.sessionKeys[convo.id] = sessionKey

                        // Decrypt Last Message if exists
                        if (convo.lastMessage) {
                            try {
                                const raw = await crypto.decryptMessage(sessionKey, convo.lastMessage.content, convo.lastMessage.iv)
                                const parsed = JSON.parse(raw)
                                convo.lastMessagePreview = parsed.text
                                convo.lastMessageTime = convo.lastMessage.createdAt
                            } catch (e) {
                                convo.lastMessagePreview = 'Unable to decrypt'
                            }
                        }
                    } catch (e) {
                        console.error('Failed to decrypt key for convo', convo.id, e)
                    }
                }
            }


            // Subscribe to these conversations if WS is open
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                console.log('[WS] Subscribing after fetch:', conversations.map(c => c.id))
                conversations.forEach(c => {
                    this.ws?.send(JSON.stringify({
                        type: 'subscribe',
                        conversationId: c.id,
                        userId: this.userId
                    }))
                })
            }
        },

        async loadMessages(conversationId: number) {
            const { messages } = await $fetch('/api/chat/messages', {
                params: { conversationId }
            })

            // Decrypt messages
            const sessionKey = this.sessionKeys[conversationId]
            if (!sessionKey) return

            const decrypted = await Promise.all(messages.map(async (m: any) => {
                try {
                    const raw = await crypto.decryptMessage(sessionKey, m.content, m.iv)
                    const parsed = JSON.parse(raw)
                    return { ...m, text: parsed.text }
                } catch (e) {
                    return { ...m, text: '[Decryption Error]' }
                }
            }))

            this.messages[conversationId] = decrypted

            // If already open, mark as read
            if (this.isOpen && this.activeConversationId === conversationId) {
                this.markAsRead(conversationId)
            }
        },

        async markAsRead(conversationId: number) {
            const convo = this.conversations.find(c => c.id === conversationId)
            if (convo && convo.unreadCount > 0) {
                convo.unreadCount = 0
                await $fetch('/api/chat/read', {
                    method: 'POST',
                    body: { conversationId }
                })

                // Broadcast read receipt via WS
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'read',
                        conversationId,
                        userId: this.userId
                    }))
                }
            }
        },

        initAudio() {
            // Unlock audio context by playing a silent sound
            try {
                if (typeof Audio !== 'undefined') {
                    const audio = new Audio('/notification.mp3')
                    audio.volume = 0
                    audio.play().then(() => {
                        console.log('[Audio] Unlocked')
                    }).catch(() => { })
                }
            } catch (e) { }
        },

        playSound() {
            try {
                // Determine if we are in browser
                if (typeof Audio !== 'undefined') {
                    const audio = new Audio('/notification.mp3') // Assume file exists or use data URI
                    audio.play().catch(e => console.log('Audio play failed (user interaction needed)', e))
                }
            } catch (e) {
                // Ignore
            }
        },

        async connectWs() {
            if (this.isConnected || this.ws) return

            const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
            this.ws = new WebSocket(`${protocol}//${location.host}/_ws`)

            this.ws.onopen = () => {
                console.log('[WS] Connected')
                this.isConnected = true
                // Subscribe to all known conversations
                console.log('[WS] Subscribing to conversations:', this.conversations.map(c => c.id))
                this.conversations.forEach(c => {
                    this.ws?.send(JSON.stringify({
                        type: 'subscribe',
                        conversationId: c.id,
                        userId: this.userId
                    }))
                })
            }

            this.ws.onmessage = async (event) => {
                // Handle incoming message
                try {
                    // Check if it's a pong or system message
                    if (event.data === 'pong') return

                    const payload = JSON.parse(event.data)

                    if (payload.type === 'message') {
                        // Decrypt if we have the session key
                        const sessionKey = this.sessionKeys[payload.conversationId]
                        if (sessionKey) {
                            try {
                                const raw = await crypto.decryptMessage(sessionKey, payload.content, payload.iv)
                                const parsed = JSON.parse(raw)
                                const text = parsed.text

                                // Update messages list
                                if (!this.messages[payload.conversationId]) {
                                    this.messages[payload.conversationId] = []
                                }

                                const msg = {
                                    ...payload,
                                    text,
                                    createdAt: payload.createdAt || new Date().toISOString()
                                }

                                // Avoid duplicates if we already pushed it via sendMessage
                                // Simple check: Last message ID? Or just push.
                                // Since we push optimistically, we might want to check unique ID or nonce.
                                // For now, simple push.
                                this.messages[payload.conversationId].push(msg)

                                // Handle Unread
                                if (payload.senderId !== this.userId) {
                                    // If chat is open focused
                                    if (this.isOpen && this.activeConversationId === payload.conversationId) {
                                        this.markAsRead(payload.conversationId)
                                        // Still play 'pop' sound for open chat? Maybe softer one? Or default one.
                                        this.playSound()
                                    } else {
                                        // Increment unread count
                                        const convo = this.conversations.find(c => c.id === payload.conversationId)
                                        if (convo) {
                                            convo.unreadCount = (convo.unreadCount || 0) + 1
                                            convo.lastMessagePreview = text
                                            convo.lastMessageTime = payload.createdAt
                                            this.playSound()
                                        }
                                    }
                                } else {
                                    // It's my own message (from another device potentially), update preview
                                    const convo = this.conversations.find(c => c.id === payload.conversationId)
                                    if (convo) {
                                        convo.lastMessagePreview = text
                                        convo.lastMessageTime = payload.createdAt
                                    }
                                }

                            } catch (e) {
                                console.error('Failed to decrypt incoming message', e)
                            }
                        }
                    } else if (payload.type === 'read') {
                        // Handle read receipt update
                        const convo = this.conversations.find(c => c.id === payload.conversationId)
                        if (convo && convo.participants) {
                            const participant = convo.participants.find((p: any) => p.id === payload.userId)
                            if (participant) {
                                participant.lastReadAt = payload.lastReadAt
                            }
                        }
                    } else if (payload.type === 'status') {
                        // Handle online/offline status
                        this.onlineStatus[payload.userId] = payload.status
                    }
                } catch (e) {
                    console.error('WS Message Error', e)
                }
            }

            this.ws.onclose = () => {
                this.isConnected = false
                this.ws = null
                // Reconnect logic could go here
            }
        },

        async sendMessage(conversationId: number, text: string) {
            const sessionKey = this.sessionKeys[conversationId]
            if (!sessionKey) return

            const { content, iv } = await crypto.encryptMessage(sessionKey, JSON.stringify({ text }))

            const payload = {
                type: 'message',
                conversationId,
                senderId: this.userId,
                content,
                iv,
                createdAt: new Date().toISOString() // Optimistic timestamp
            }

            // Send via WS
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(payload))

                // Optimistic Update: Add to local list immediately? 
                // Wait for echo to ensure it's saved?
                // For better UX, add immediately.
                if (!this.messages[conversationId]) {
                    this.messages[conversationId] = []
                }
                // Decrypt for display (it's essentially the text)
                this.messages[conversationId].push({
                    conversationId,
                    senderId: this.userId,
                    text, // displaying raw text since we sent it
                    createdAt: payload.createdAt
                })

                // Update Preview locally
                const convo = this.conversations.find(c => c.id === conversationId)
                if (convo) {
                    convo.lastMessagePreview = text
                    convo.lastMessageTime = payload.createdAt
                }
            }
        }
    },

    getters: {
        totalUnreadCount: (state) => {
            return state.conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)
        }
    }
})
