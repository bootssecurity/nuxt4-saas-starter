<template>
  <div class="p-6 space-y-6">
      <!-- Info -->
      <UAlert
        color="info"
        icon="i-heroicons-information-circle"
        title="Your Activity History"
        description="View all security-relevant actions on your account including logins, profile changes, and session activity."
      />

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 items-end">
        <UFormField label="Start Date">
          <UInput
            v-model="filters.startDate"
            type="date"
            @change="fetchLogs"
          />
        </UFormField>
        
        <UFormField label="End Date">
          <UInput
            v-model="filters.endDate"
            type="date"
            @change="fetchLogs"
          />
        </UFormField>
        
        <UButton
          variant="ghost"
          icon="i-heroicons-arrow-path"
          @click="resetFilters"
        >
          Reset
        </UButton>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
      </div>

      <!-- Error -->
      <UAlert
        v-else-if="error"
        color="error"
        icon="i-heroicons-exclamation-triangle"
        title="Failed to load activity"
        :description="error.message"
      />

      <!-- Activity List -->
      <div v-else class="space-y-3">
        <div
          v-for="log in logs"
          :key="log.id"
          class="border border-default rounded-lg p-4"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-3">
              <!-- Event Icon -->
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                :class="getEventBgColor(log.eventType)"
              >
                <UIcon :name="getEventIcon(log.eventType)" class="w-5 h-5" />
              </div>
              
              <!-- Event Details -->
              <div>
                <p class="font-medium">{{ getEventLabel(log.eventType) }}</p>
                <p class="text-sm text-muted">
                  {{ formatDate(log.timestamp) }}
                </p>
              </div>
            </div>
            
            <!-- Status Badge -->
            <UBadge :color="getStatusColor(log.status)" size="sm">
              {{ log.status }}
            </UBadge>
          </div>
          
          <!-- Additional Details -->
          <div class="mt-3 pt-3 border-t border-default text-sm text-muted flex flex-wrap gap-4">
            <span v-if="log.actorIp" class="flex items-center gap-1">
              <UIcon name="i-heroicons-globe-alt" class="w-4 h-4" />
              {{ log.actorIp }}
            </span>
            <span v-if="log.actorCountry" class="flex items-center gap-1">
              <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
              {{ log.actorCountry }}
            </span>
            <span v-if="log.resourceType" class="flex items-center gap-1">
              <UIcon name="i-heroicons-cube" class="w-4 h-4" />
              {{ log.resourceType }}
            </span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="logs.length === 0" class="text-center py-12 text-muted">
          <UIcon name="i-heroicons-clipboard-document-list" class="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No activity found</p>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.totalPages > 1" class="flex justify-center pt-4">
        <UPagination
          v-model="currentPage"
          :total="pagination.total"
          :page-count="pagination.limit"
          @update:model-value="fetchLogs"
        />
      </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
  title: 'Activity Log'
})

const filters = reactive({
  startDate: '',
  endDate: ''
})

const currentPage = ref(1)
const logs = ref<any[]>([])
const pagination = ref<any>(null)
const pending = ref(true)
const error = ref<any>(null)

async function fetchLogs() {
  pending.value = true
  error.value = null
  
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: '20'
    })
    
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    
    const response = await $fetch(`/api/user/activity?${params}`)
    logs.value = response.logs || []
    pagination.value = response.pagination
  } catch (err: any) {
    error.value = err
  } finally {
    pending.value = false
  }
}

function resetFilters() {
  filters.startDate = ''
  filters.endDate = ''
  currentPage.value = 1
  fetchLogs()
}

// Event type helpers
function getEventIcon(eventType: string): string {
  if (eventType.includes('login')) return 'i-heroicons-arrow-right-on-rectangle'
  if (eventType.includes('logout')) return 'i-heroicons-arrow-left-on-rectangle'
  if (eventType.includes('signup')) return 'i-heroicons-user-plus'
  if (eventType.includes('session')) return 'i-heroicons-device-phone-mobile'
  if (eventType.includes('consent')) return 'i-heroicons-hand-raised'
  if (eventType.includes('export')) return 'i-heroicons-arrow-down-tray'
  if (eventType.includes('update')) return 'i-heroicons-pencil'
  if (eventType.includes('delete')) return 'i-heroicons-trash'
  return 'i-heroicons-clipboard-document-list'
}

function getEventBgColor(eventType: string): string {
  if (eventType.includes('login.success')) return 'bg-green-100 text-green-600'
  if (eventType.includes('login.failure')) return 'bg-red-100 text-red-600'
  if (eventType.includes('logout')) return 'bg-gray-100 text-gray-600'
  if (eventType.includes('signup')) return 'bg-blue-100 text-blue-600'
  if (eventType.includes('session')) return 'bg-purple-100 text-purple-600'
  if (eventType.includes('consent')) return 'bg-yellow-100 text-yellow-600'
  return 'bg-primary/10 text-primary'
}

function getEventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    'auth.login.success': 'Signed In',
    'auth.login.failure': 'Sign In Failed',
    'auth.login.attempt': 'Sign In Attempt',
    'auth.logout': 'Signed Out',
    'auth.signup.success': 'Account Created',
    'auth.signup.attempt': 'Signup Attempt',
    'session.created': 'New Session',
    'session.revoked': 'Session Revoked',
    'session.revoked_all': 'All Sessions Revoked',
    'consent.granted': 'Consent Given',
    'consent.revoked': 'Consent Revoked',
    'user.update': 'Profile Updated',
    'user.data_export': 'Data Exported',
    'user.delete': 'Account Deleted'
  }
  return labels[eventType] || eventType.replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getStatusColor(status: string): 'success' | 'error' | 'warning' | 'neutral' {
  if (status === 'success') return 'success'
  if (status === 'failure') return 'error'
  if (status === 'blocked') return 'warning'
  return 'neutral'
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

// Initial fetch
onMounted(() => {
  fetchLogs()
})
</script>
