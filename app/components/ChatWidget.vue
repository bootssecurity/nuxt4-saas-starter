<template>
  <div class="relative">
    <!-- Toggle Button -->
    <UButton
        icon="i-heroicons-chat-bubble-left-right-20-solid"
        color="neutral"
        variant="ghost"
        class="relative"
        @click="isOpen = !isOpen"
    >
        <span v-if="chatStore.totalUnreadCount > 0" class="absolute top-0 right-0 flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </span>
    </UButton>

    <!-- Chat List / Popover -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
        <div v-if="isOpen" class="absolute right-0 top-full mt-2 z-50 w-[360px] h-[500px] bg-white dark:bg-gray-900 shadow-xl rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden ring-1 ring-black/5 origin-top-right">
           <ChatList v-if="!activeConversationId" @select="openConversation" />
           <ChatWindow v-else :conversation-id="activeConversationId" @back="activeConversationId = null" />
        </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '~/stores/chat'

const chatStore = useChatStore()
const isOpen = ref(false)
const activeConversationId = ref<number | null>(null)

// Initialize store/crypto on mount (or lazy load)
onMounted(() => {
    chatStore.init()
})

function toggle() {
    isOpen.value = !isOpen.value
}

function openConversation(id: number) {
    activeConversationId.value = id
}
</script>
