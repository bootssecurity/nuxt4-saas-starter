<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="p-4 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex justify-between items-center sticky top-0 z-10">
      <h3 class="font-bold text-gray-900 dark:text-white">Messages</h3>
      <UTooltip text="Start New Chat">
        <UButton icon="i-heroicons-pencil-square" size="sm" color="neutral" variant="ghost" class="-mr-2" @click="isCreating = true" />
      </UTooltip>
    </div>

    <!-- Create Mode -->
    <div v-if="isCreating" class="p-4 flex-1 flex flex-col gap-3 animate-in fade-in duration-200">
        <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">New Message</h4>
            <UButton icon="i-heroicons-x-mark" size="xs" color="neutral" variant="ghost" @click="isCreating = false" />
        </div>
        
        <UInput 
            placeholder="To: Search Name or Email" 
            v-model="searchQuery" 
            icon="i-heroicons-magnifying-glass"
            autofocus
            :ui="{ icon: { trailing: { pointer: '' } } }"
        />

        <div class="mt-2 flex-1 overflow-y-auto space-y-1">
            <div 
                v-for="user in searchResults" 
                :key="user.id" 
                class="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl cursor-pointer transition-colors group"
                @click="startChat(user.id)"
            >
                <UAvatar :alt="user.name" size="sm" class="ring-2 ring-white dark:ring-gray-900" />
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm text-gray-900 dark:text-gray-100">{{ user.name }}</div>
                    <div class="text-xs text-gray-500 truncate" v-if="user.email">{{ user.email }}</div>
                </div>
                <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
             <div v-if="searchQuery && searchResults.length === 0" class="text-center py-8 text-gray-400 text-sm">
                No users found
            </div>
        </div>
    </div>

    <!-- Conversation List -->
    <div v-else class="flex-1 overflow-y-auto p-2 space-y-1">
      <div 
        v-for="convo in conversations" 
        :key="convo.id"
        class="group p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
        @click="$emit('select', convo.id)"
      >
        <div class="flex items-center gap-4">
          <div class="relative">
             <UAvatar :alt="convo.name || 'User'" size="md" class="ring-2 ring-white dark:ring-gray-900 shadow-sm" />
             <!-- Online Status Indicator -->
             <span v-if="chatStore.onlineStatus[getOtherUserId(convo)] === 'online'" class="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 bg-green-400"></span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-baseline mb-0.5">
                <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" :class="{ 'font-bold': convo.unreadCount > 0 }">{{ convo.name || 'Anonymous' }}</p>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] text-gray-400">{{ convo.updatedAt ? new Date(convo.updatedAt).toLocaleDateString() : 'New' }}</span>
                    <span v-if="convo.unreadCount > 0" class="w-2 h-2 rounded-full bg-red-500"></span>
                </div>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate group-hover:text-primary-500 transition-colors h-4" :class="{ 'font-bold text-gray-900 dark:text-white': convo.unreadCount > 0 }">
                {{ convo.lastMessagePreview || 'Tap to start chatting' }}
            </p>
          </div>
        </div>
      </div>
       <div v-if="conversations.length === 0" class="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <UIcon name="i-heroicons-chat-bubble-oval-left" class="w-8 h-8 text-gray-400" />
          </div>
          <div class="space-y-1">
            <h4 class="font-medium text-gray-900 dark:text-white">No messages yet</h4>
            <p class="text-xs text-gray-500 max-w-[200px]">Start a secure, end-to-end encrypted conversation with your team.</p>
          </div>
          <UButton label="Start Chat" color="primary" size="sm" @click="isCreating = true" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '~/stores/chat'

const chatStore = useChatStore()
const emit = defineEmits(['select'])
const conversations = computed(() => chatStore.conversations)

const isCreating = ref(false)
const searchQuery = ref('')
const searchResults = ref<{id: number, name: string, email?: string}[]>([])

// Real User Search
watch(searchQuery, async (q) => {
    // Debounce ideally
    if (q.length >= 0) { // Allow empty search to show default list
        try {
            const { users } = await $fetch('/api/chat/users', { params: { q } })
            searchResults.value = users
        } catch (e: any) {
            if (e.statusCode !== 401 && e.statusCode !== 403) {
                 console.error('Failed to search users', e)
            }
        }
    }
}, { immediate: true }) // Fetch immediately on open


async function startChat(userId: number) {
    if (!chatStore.userId || !chatStore.keyPair) {
        alert('Your secure identity is not loaded. Please refresh the page or try again.')
        return
    }

    // 1. Fetch user's Public Key
    const keys = await $fetch('/api/chat/keys', {
        params: { userIds: [userId] }
    }) as any
    
    if (!keys || !keys[userId]) {
        alert('This user has not established a secure identity yet. They need to log in at least once.')
        return
    }

    let pubKeyJwk;
    try {
        pubKeyJwk = JSON.parse(keys[userId])
    } catch (e) {
        console.error('Values to parse', keys[userId])
        alert('User key is corrupted.')
        return
    }

    if (!pubKeyJwk || !pubKeyJwk.kty) {
        alert('User has an invalid public key format.')
        return
    }

    const recipientKey = await importKey(pubKeyJwk, 'public')
    
    // 2. Generate Conversation Key
    const convoKey = await generateSymmetricKey()
    
    // 3. Encrypt Convo Key for Recipient (ECIES-ish)
    // Ephemeral Key Pair for us
    const ephKeyPair = await generateKeyPair()
    
    // Encrypt for Recipient
    const sharedSecretRecip = await deriveInternalSharedKey(ephKeyPair.privateKey, recipientKey)
    const { content: cRecip, iv: ivRecip } = await wrapKey(convoKey, sharedSecretRecip)
    
    // Encrypt for Us (To be able to read updated history on other devices)
    // Ideally we fetch our own other keys, but for now just use current generic key
    // Actually, we use our Identity Key to encrypt for ourself? 
    // Yes, we can treat ourselves as a recipient.
    const mySharedSecret = await deriveInternalSharedKey(ephKeyPair.privateKey, chatStore.keyPair!.publicKey)
    const { content: cMe, iv: ivMe } = await wrapKey(convoKey, mySharedSecret)

    // Prepare JSON blobs
    const encryptedKeyRecip = JSON.stringify({
        ephemPubKey: await exportKey(ephKeyPair.publicKey),
        content: cRecip,
        iv: ivRecip
    })
    
     const encryptedKeyMe = JSON.stringify({
        ephemPubKey: await exportKey(ephKeyPair.publicKey),
        content: cMe,
        iv: ivMe
    })

    if (!chatStore.userId) {
        console.error('Cannot create chat: User ID missing')
        return
    }

    // 4. Create Conversation
    const { conversation } = await $fetch('/api/chat/conversations', {
        method: 'POST',
        body: {
            type: 'direct',
            participants: [
                { userId: userId, encryptedKey: encryptedKeyRecip },
                { userId: chatStore.userId, encryptedKey: encryptedKeyMe }
            ]
        }
    })
    // WAIT: My API implementation in `conversations.post.ts` ONLY iterates `body.participants`.
    // It does NOT add the current user automatically.
    // AND I don't have my User ID in frontend store yet.
    // I should fix the API to auto-add current user.
    
    // For now, I'll update API `conversations.post.ts` in next step.
    
    
    isCreating.value = false
    await chatStore.fetchConversations()
    // Open the new chat
    if (conversation) {
        // We need to wait for store to process it? 
        // fetchConversations updates store.
        // Let's find it.
        // Simple way: Select it
        emit('select', conversation.id)
    }
}

// Imports from crypto util (auto-import needed or manual)
import { importKey, generateKeyPair, generateSymmetricKey, exportKey, deriveInternalSharedKey, wrapKey } from '~/utils/crypto'

function getOtherUserId(convo: any) {
    if (!convo.participants) return null
    const other = convo.participants.find((p: any) => p.id !== chatStore.userId)
    return other ? other.id : null
}

</script>
