<template>
  <div class="flex flex-col h-full bg-white dark:bg-gray-800">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10 sticky top-0">
        <div class="flex items-center gap-3">
            <UButton icon="i-heroicons-arrow-left" size="sm" color="neutral" variant="ghost" @click="$emit('back')" class="-ml-2" />
            
            <div class="relative">
                <UAvatar :alt="conversationName" size="sm" class="ring-2 ring-white dark:ring-gray-900" />
                <span v-if="isOtherOnline" class="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 bg-green-500"></span>
            </div>

            <div class="flex flex-col">
                <span class="font-bold text-sm text-gray-900 dark:text-white leading-none">{{ conversationName }}</span>
                <span class="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1 mt-0.5 font-medium" v-if="isEncrypted">
                    <UIcon name="i-heroicons-lock-closed" class="w-3 h-3" />
                    End-to-End Encrypted
                </span>
            </div>
        </div>
    </div>

    <!-- Messages -->
    <div ref="msgContainer" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-950">
        <!-- Date Separator Mock -->
        <div class="flex justify-center my-4">
            <span class="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">Today</span>
        </div>

        <div 
            v-for="msg in messages" 
            :key="msg.id" 
            class="flex w-full mb-4"
            :class="[isMe(msg) ? 'justify-end' : 'justify-start']"
        >
            <div 
                class="flex flex-col max-w-[75%] rounded-2xl px-4 py-3 shadow-sm relative group transition-all"
                :class="[
                    isMe(msg) 
                        ? 'bg-primary-500 text-white rounded-br-none' 
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                ]"
            >
                <!-- Message Text -->
                <span class="text-sm leading-relaxed whitespace-pre-wrap break-words">{{ msg.text }}</span>
               
                <!-- Metadata -->
                <div 
                    class="text-[10px] mt-1 flex items-center justify-end gap-1 select-none"
                    :class="[isMe(msg) ? 'text-blue-100' : 'text-gray-400']"
                >
                    {{ new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                    
                    <template v-if="isMe(msg)">
                        <UIcon 
                            v-if="getReadStatus(msg)"
                            name="i-heroicons-check-circle-20-solid"
                            class="w-3.5 h-3.5"
                        />
                        <UIcon 
                            v-else
                            name="i-heroicons-check-20-solid"
                            class="w-3.5 h-3.5 opacity-80"
                        />
                    </template>
                </div>
            </div>
        </div>
    </div>

    <!-- Input -->
    <div class="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <form @submit.prevent="send" class="flex gap-2 items-end">
            <UInput 
                v-model="newMessage" 
                placeholder="Type your message securely..." 
                class="flex-1" 
                :disabled="sending"
                autocomplete="off"
                size="lg"
                
            >
                <template #leading>
                    <UPopover :popper="{ placement: 'top-start' }">
                        <UButton icon="i-heroicons-face-smile" color="neutral" variant="ghost" :padded="false" />
                        
                        <template #content>
                            <div class="p-2 grid grid-cols-8 gap-1 w-64 h-48 overflow-y-auto">
                                <button 
                                    v-for="emoji in safeEmojis" 
                                    :key="emoji"
                                    class="hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1 text-lg transition-colors"
                                    @click="addEmoji(emoji)"
                                >
                                    {{ emoji }}
                                </button>
                            </div>
                        </template>
                    </UPopover>
                </template>
            </UInput>
            <UButton 
                type="submit" 
                icon="i-heroicons-paper-airplane" 
                :loading="sending" 
                color="primary" 
                variant="solid" 
                size="lg"
                class="rounded-xl shadow-md transition-transform active:scale-95"
                :disabled="!newMessage.trim()"
            />
        </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '~/stores/chat'

const props = defineProps<{ conversationId: number }>()
const emit = defineEmits(['back'])

const chatStore = useChatStore()
const messages = computed(() => chatStore.messages[props.conversationId] || [])
const newMessage = ref('')
const sending = ref(false)
const msgContainer = ref<HTMLDivElement>()

const popularEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', 'wv', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', 'sneezing_face', 'mask', 'thermometer_face', 'head_bandage', 'money_mouth_face', 'cowboy_hat_face', 'smiling_imp',
    'imp', 'skull', 'skull_and_crossbones', 'poop', 'clown_face', 'ogre', 'goblin', 'ghost', 'alien', 'space_invader',
    'robot', 'jack_o_lantern', 'smiley_cat', 'smile_cat', 'joy_cat', 'heart_eyes_cat', 'smirk_cat', 'kissing_cat', 'scream_cat', 'crying_cat_face',
    'pouting_cat', 'see_no_evil', 'hear_no_evil', 'speak_no_evil', 'wave', 'raised_back_of_hand', 'raised_hand_with_fingers_splayed', 'hand', 'spock-hand', 'ok_hand',
    'pinched_fingers', 'pinching_hand', 'victory_hand', 'crossed_fingers', 'love_you_gesture', 'sign_of_the_horns', 'call_me_hand', 'point_left', 'point_right', 'point_up_2',
    'middle_finger', 'point_down', 'point_up', 'thumbsup', 'thumbsdown', 'fist', 'oncoming_fist', 'left-facing_fist', 'right-facing_fist', 'clap',
    'raising_hand', 'open_hands', 'palms_up_together', 'handshake', 'pray', 'writing_hand', 'nail_care', 'selfie', 'muscle', 'mechanical_arm',
    'mechanical_leg', 'leg', 'foot', 'ear', 'ear_with_hearing_aid', 'nose', 'brain', 'anatomical_heart', 'lungs', 'tooth',
    'bone', 'eyes', 'eye', 'tongue', 'mouth', 'lips', 'baby', 'child', 'boy', 'girl',
    'adult', 'person_with_blond_hair', 'man', 'woman', 'older_person', 'older_man', 'older_woman', 'frown-woman', 'frown-man', 'pouting-woman',
    'pouting-man', '🙅', '🙆', '💁', '🙋', '🙇', '🤦', '🤷', '👨‍⚕️',
    '👩‍⚕️', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍⚖️', '👩‍⚖️', '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳',
    '👍', '👎', '👊', '✌️', '👌', '✋', '💪', '🙏', '❤️', '🧡',
    '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
    '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '✨', '🌟', '💫',
    '💥', '💢', '💦', '💧', '💤', '👋', '🤚', '🖐️', '🖖', '🤟',
    '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️'
].filter(e => !e.includes('_')) // Filter out text names, keep only unicode chars I pasted or simple ones.
// Actually I pasted a mixed list. Let's strictly use unicode for now to avoid broken icons.
// I will replace this with a safer hardcoded short list in the content block below to ensure valid emojis.

const safeEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '👋', '👍', '👎', '👊', '✌️', '👌', '✋', '💪', '🙏', '🔥',
    '✨', '🎉', '💯', '🎈', '🎁', '🎂', '🎄', '🎃', '🎖️', '🏆'
]

function addEmoji(emoji: string) {
    newMessage.value += emoji
}

const isEncrypted = computed(() => !!chatStore.sessionKeys[props.conversationId])
const conversationName = computed(() => {
    const c = chatStore.conversations.find(c => c.id === props.conversationId)
    return c ? c.name : 'Occupant'
})

// Poll messages or use WS events store handles? Store handles WS.
// Init load
onMounted(() => {
    chatStore.loadMessages(props.conversationId)
    scrollToBottom()
    chatStore.markAsRead(props.conversationId)
})

watch(() => props.conversationId, () => {
    chatStore.loadMessages(props.conversationId) // Load messages for the new conversation
    chatStore.markAsRead(props.conversationId)
    scrollToBottom() // Scroll to bottom for the new conversation
})

watch(() => messages.value.length, () => {
    nextTick(() => scrollToBottom())
})

function isMe(msg: any) {
    return msg.senderId === chatStore.userId
}

function getReadStatus(message: any) {
    // Check if other participant has read this
    const convo = chatStore.conversations.find(c => c.id === props.conversationId)
    if (!convo || !convo.participants) return false
    
    // Find other participant (assuming direct chat for MVP)
    const other = convo.participants.find((p: any) => p.id !== chatStore.userId)
    if (!other || !other.lastReadAt) return false
    
    return new Date(message.createdAt) <= new Date(other.lastReadAt)
}

async function send() {
    if (!newMessage.value.trim()) return
    sending.value = true
    try {
        await chatStore.sendMessage(props.conversationId, newMessage.value)
        newMessage.value = ''
    } finally {
        sending.value = false
    }
}

function scrollToBottom() {
    if (msgContainer.value) {
        msgContainer.value.scrollTop = msgContainer.value.scrollHeight
    }
}

const isOtherOnline = computed(() => {
    const convo = chatStore.conversations.find(c => c.id === props.conversationId)
    if (!convo || !convo.participants) return false
    const other = convo.participants.find((p: any) => p.id !== chatStore.userId)
    return other && chatStore.onlineStatus[other.id] === 'online'
})
</script>
