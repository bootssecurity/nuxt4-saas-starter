<template>
  <UDashboardGroup>
    <UDashboardSidebar>
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 px-2 w-full">
           <UIcon name="i-heroicons-cube-transparent" class="w-8 h-8 text-primary shrink-0" />
           <span v-if="!collapsed" class="font-bold text-gray-900 text-lg truncate">Nuxt Starter</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <div class="flex-1 flex flex-col gap-4">
           <UNavigationMenu :items="links" orientation="vertical" :collapsed="collapsed" />
           <div class="mt-auto">
             <UNavigationMenu :items="bottomLinks" orientation="vertical" :collapsed="collapsed" />
           </div>
        </div>
      </template>

      <template #footer="{ collapsed }">
        <div class="flex items-center gap-3 w-full">
          <UAvatar
            :alt="user?.firstName"
            size="sm"
          />
          <div v-if="!collapsed" class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ user?.firstName }}
            </p>
            <p class="text-xs text-gray-500 truncate">
              {{ user?.email }}
            </p>
          </div>
           <UButton
            icon="i-heroicons-arrow-right-on-rectangle"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="logout"
            :class="{ 'ml-auto': !collapsed }"
          />
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <UDashboardNavbar :title="title">
        <template #right>
           <ChatWidget />
        </template>
      </UDashboardNavbar>

      <div class="flex-1 overflow-y-auto p-4">
        <slot />
      </div>
    </UDashboardPanel>
  </UDashboardGroup>
</template>

<script setup lang="ts">
const { user, clear } = useUserSession()

const links = computed(() => {
  const items = [
    {
      label: 'Dashboard',
      icon: 'i-heroicons-home',
      to: '/dashboard'
    }
  ]

  if (user.value?.role === 'business_owner') {
    items.push({
      label: 'Users',
      icon: 'i-heroicons-users',
      to: '/dashboard/users'
    })
  }

  items.push({
    label: 'Settings',
    icon: 'i-heroicons-cog-6-tooth',
    to: '/dashboard/settings'
  })

  return items
})

const bottomLinks = [
  {
    label: 'Help & Support',
    icon: 'i-heroicons-question-mark-circle',
    to: '#'
  }
]

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  clear()
  navigateTo('/auth/login')
}

const route = useRoute()
const title = computed(() => {
  return (route.meta.title as string) || 'Dashboard'
})

// Unlock audio on first interaction
import { useChatStore } from '~/stores/chat'
const chatStore = useChatStore()

function unlockAudio() {
  chatStore.initAudio()
  window.removeEventListener('click', unlockAudio)
  window.removeEventListener('keydown', unlockAudio)
}

onMounted(() => {
  window.addEventListener('click', unlockAudio)
  window.addEventListener('keydown', unlockAudio)
})
</script>

