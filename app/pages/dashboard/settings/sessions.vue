<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Active Sessions">
      <template #leading>
        <UIcon name="i-heroicons-device-phone-mobile" class="w-6 h-6" />
      </template>
      <template #trailing>
        <UButton
          color="error"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          :loading="revokingAll"
          @click="showRevokeAllConfirm = true"
        >
          Revoke All Other Sessions
        </UButton>
      </template>
    </UDashboardNavbar>

    <div class="p-6 space-y-6">
      <!-- Info Alert -->
      <UAlert
        color="info"
        icon="i-heroicons-information-circle"
        title="Session Security"
        description="These are all the devices and browsers currently signed into your account. If you notice any unfamiliar sessions, revoke them immediately and consider changing your email."
      />

      <!-- Loading State -->
      <div v-if="pending" class="flex items-center justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
      </div>

      <!-- Error State -->
      <UAlert
        v-else-if="error"
        color="error"
        icon="i-heroicons-exclamation-triangle"
        title="Failed to load sessions"
        :description="error.message"
      />

      <!-- Sessions List -->
      <div v-else class="space-y-4">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="border border-default rounded-lg p-4 flex items-center justify-between gap-4"
          :class="{ 'border-primary bg-primary/5': session.isCurrent }"
        >
          <div class="flex items-center gap-4">
            <!-- Device Icon -->
            <div class="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <UIcon
                :name="getDeviceIcon(session.device)"
                class="w-6 h-6"
              />
            </div>

            <!-- Session Info -->
            <div>
              <div class="flex items-center gap-2">
                <p class="font-medium">
                  {{ session.device?.browser || 'Unknown Browser' }} on {{ session.device?.os || 'Unknown OS' }}
                </p>
                <UBadge v-if="session.isCurrent" color="primary" size="xs">
                  This Device
                </UBadge>
              </div>
              <p class="text-sm text-muted">
                {{ session.ipAddress }}
                <span v-if="session.country"> · {{ session.country }}</span>
              </p>
              <p class="text-xs text-muted mt-1">
                Last active: {{ formatRelativeTime(session.lastActiveAt) }}
                <span class="mx-1">·</span>
                Signed in: {{ formatDate(session.createdAt) }}
              </p>
            </div>
          </div>

          <!-- Revoke Button -->
          <UButton
            v-if="!session.isCurrent"
            color="error"
            variant="ghost"
            icon="i-heroicons-x-mark"
            :loading="revokingId === session.id"
            @click="revokeSession(session.id)"
          >
            Revoke
          </UButton>
          <UBadge v-else color="success" variant="soft">
            Current Session
          </UBadge>
        </div>

        <!-- Empty State -->
        <div v-if="sessions.length === 0" class="text-center py-12 text-muted">
          <UIcon name="i-heroicons-device-phone-mobile" class="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No active sessions found</p>
        </div>
      </div>

      <!-- Session Security Tips -->
      <UPageCard title="Security Tips" icon="i-heroicons-shield-check">
        <ul class="text-sm text-muted space-y-2">
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <span>Regularly review your active sessions and revoke any you don't recognize</span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <span>Sessions automatically expire after 24 hours of inactivity</span>
          </li>
          <li class="flex items-start gap-2">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <span>If you suspect unauthorized access, revoke all sessions and contact support</span>
          </li>
        </ul>
      </UPageCard>
    </div>

    <!-- Revoke All Confirmation Modal -->
    <UModal v-model:open="showRevokeAllConfirm">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-error" />
            </div>
            <div>
              <h3 class="font-semibold text-lg">Revoke All Sessions?</h3>
              <p class="text-sm text-muted">This action cannot be undone</p>
            </div>
          </div>
          
          <p class="text-muted mb-6">
            This will sign you out from all other devices and browsers. You will remain signed in on this device.
          </p>
          
          <div class="flex gap-3 justify-end">
            <UButton
              color="neutral"
              variant="ghost"
              @click="showRevokeAllConfirm = false"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              :loading="revokingAll"
              @click="revokeAllSessions"
            >
              Revoke All Sessions
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const toast = useToast()

const revokingId = ref<number | null>(null)
const revokingAll = ref(false)
const showRevokeAllConfirm = ref(false)

// Fetch sessions
const { data, pending, error, refresh } = await useFetch('/api/user/sessions')

const sessions = computed(() => {
  const list = data.value?.sessions || []
  // Mark the most recently active session as current (simplified logic)
  // In production, you'd track the actual session token
  if (list.length > 0) {
    const sorted = [...list].sort((a, b) => 
      new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
    )
    sorted[0].isCurrent = true
  }
  return list
})

// Revoke single session
async function revokeSession(sessionId: number) {
  revokingId.value = sessionId
  
  try {
    await $fetch(`/api/user/sessions/${sessionId}`, { method: 'DELETE' })
    toast.add({ title: 'Session revoked', color: 'success' })
    refresh()
  } catch (err: any) {
    toast.add({ 
      title: 'Failed to revoke session', 
      description: err.data?.message || 'Please try again',
      color: 'error' 
    })
  } finally {
    revokingId.value = null
  }
}

// Revoke all sessions
async function revokeAllSessions() {
  revokingAll.value = true
  
  try {
    const result = await $fetch('/api/user/sessions/revoke-all', { method: 'POST' })
    toast.add({ 
      title: 'Sessions revoked', 
      description: result.message,
      color: 'success' 
    })
    showRevokeAllConfirm.value = false
    refresh()
  } catch (err: any) {
    toast.add({ 
      title: 'Failed to revoke sessions', 
      description: err.data?.message || 'Please try again',
      color: 'error' 
    })
  } finally {
    revokingAll.value = false
  }
}

// Helpers
function getDeviceIcon(device: any): string {
  if (!device) return 'i-heroicons-computer-desktop'
  if (device.isMobile) {
    if (device.device?.includes('iPhone') || device.device?.includes('iPad')) {
      return 'i-heroicons-device-phone-mobile'
    }
    return 'i-heroicons-device-phone-mobile'
  }
  return 'i-heroicons-computer-desktop'
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
