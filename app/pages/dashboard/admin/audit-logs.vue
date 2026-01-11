<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Audit Logs">
      <template #leading>
        <UIcon name="i-heroicons-document-magnifying-glass" class="w-6 h-6" />
      </template>
      <template #trailing>
        <UButton
          icon="i-heroicons-arrow-down-tray"
          color="neutral"
          variant="ghost"
          :loading="exporting"
          @click="exportLogs"
        >
          Export CSV
        </UButton>
      </template>
    </UDashboardNavbar>

    <!-- Filters -->
    <div class="p-4 border-b border-default space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Event Type Filter -->
        <UFormField label="Event Type">
          <USelect
            v-model="filters.eventType"
            :items="eventTypeOptions"
            placeholder="All Events"
            class="w-full"
          />
        </UFormField>

        <!-- Status Filter -->
        <UFormField label="Status">
          <USelect
            v-model="filters.status"
            :items="statusOptions"
            placeholder="All Statuses"
            class="w-full"
          />
        </UFormField>

        <!-- Actor Email Filter -->
        <UFormField label="Actor Email">
          <UInput
            v-model="filters.actorEmail"
            placeholder="Search by email..."
            icon="i-heroicons-magnifying-glass"
          />
        </UFormField>

        <!-- Date Range -->
        <UFormField label="Date Range">
          <UPopover>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-heroicons-calendar"
              class="w-full justify-start"
            >
              {{ dateRangeLabel }}
            </UButton>
            <template #content>
              <div class="p-4 space-y-4 w-72">
                <UFormField label="Start Date">
                  <UInput v-model="filters.startDate" type="date" />
                </UFormField>
                <UFormField label="End Date">
                  <UInput v-model="filters.endDate" type="date" />
                </UFormField>
                <UButton block @click="applyDateFilter">Apply</UButton>
              </div>
            </template>
          </UPopover>
        </UFormField>
      </div>

      <div class="flex justify-between items-center">
        <p class="text-sm text-muted">
          {{ pagination.total }} log entries found
        </p>
        <UButton variant="ghost" color="neutral" size="sm" @click="clearFilters">
          Clear Filters
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-4">
      <UAlert
        color="error"
        icon="i-heroicons-exclamation-triangle"
        title="Failed to load audit logs"
        :description="error.message"
      />
    </div>

    <!-- Data Table -->
    <div v-else class="overflow-x-auto">
      <UTable :columns="columns" :data="logs">
        <!-- Timestamp Column -->
        <template #timestamp-cell="{ row }">
          <div class="text-sm">
            <p class="font-medium">{{ formatDate(row.original.timestamp) }}</p>
            <p class="text-muted text-xs">{{ formatTime(row.original.timestamp) }}</p>
          </div>
        </template>

        <!-- Event Type Column -->
        <template #eventType-cell="{ row }">
          <UBadge
            :color="getEventColor(row.original.eventType)"
            variant="subtle"
            size="sm"
          >
            {{ formatEventType(row.original.eventType) }}
          </UBadge>
        </template>

        <!-- Status Column -->
        <template #status-cell="{ row }">
          <UBadge
            :color="getStatusColor(row.original.status)"
            size="sm"
          >
            {{ row.original.status }}
          </UBadge>
        </template>

        <!-- Actor Column -->
        <template #actorEmail-cell="{ row }">
          <div class="text-sm">
            <p>{{ row.original.actorEmail || 'Anonymous' }}</p>
            <p class="text-muted text-xs">{{ row.original.actorIp }}</p>
          </div>
        </template>

        <!-- Details Column -->
        <template #metadata-cell="{ row }">
          <UPopover v-if="row.original.metadata || row.original.failureReason">
            <UButton variant="ghost" size="xs" icon="i-heroicons-information-circle">
              Details
            </UButton>
            <template #content>
              <div class="p-4 max-w-sm">
                <p v-if="row.original.failureReason" class="text-error text-sm mb-2">
                  <strong>Reason:</strong> {{ row.original.failureReason }}
                </p>
                <pre v-if="row.original.metadata" class="text-xs bg-muted p-2 rounded overflow-auto max-h-40">{{ JSON.stringify(row.original.metadata, null, 2) }}</pre>
              </div>
            </template>
          </UPopover>
          <span v-else class="text-muted">—</span>
        </template>
      </UTable>
    </div>

    <!-- Pagination -->
    <div class="p-4 border-t border-default flex justify-between items-center">
      <p class="text-sm text-muted">
        Page {{ pagination.page }} of {{ pagination.totalPages }}
      </p>
      <UPagination
        v-model:page="currentPage"
        :total="pagination.total"
        :items-per-page="pagination.limit"
        show-edges
        :sibling-count="1"
      />
    </div>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

// Filters
const filters = reactive({
  eventType: undefined as string | undefined,
  status: undefined as string | undefined,
  actorEmail: '',
  startDate: '',
  endDate: ''
})

const currentPage = ref(1)
const exporting = ref(false)

// Options for filters
const eventTypeOptions = [
  { label: 'All Events', value: undefined },
  { label: 'Login Attempt', value: 'auth.login.attempt' },
  { label: 'Login Success', value: 'auth.login.success' },
  { label: 'Login Failure', value: 'auth.login.failure' },
  { label: 'Logout', value: 'auth.logout' },
  { label: 'Signup Attempt', value: 'auth.signup.attempt' },
  { label: 'Signup Success', value: 'auth.signup.success' },
  { label: 'Token Created', value: 'auth.token.created' },
  { label: 'Token Used', value: 'auth.token.used' },
  { label: 'Session Created', value: 'session.created' },
  { label: 'Session Revoked', value: 'session.revoked' },
  { label: 'User Update', value: 'user.update' },
  { label: 'Data Export', value: 'user.data_export' },
  { label: 'Rate Limited', value: 'security.rate_limit.exceeded' }
]

const statusOptions = [
  { label: 'All Statuses', value: undefined },
  { label: 'Success', value: 'success' },
  { label: 'Failure', value: 'failure' },
  { label: 'Blocked', value: 'blocked' }
]

// Computed query string for API
const queryParams = computed(() => {
  const params: Record<string, string | number> = {
    page: currentPage.value,
    limit: 50
  }
  
  if (filters.eventType) params.eventType = filters.eventType
  if (filters.status) params.status = filters.status
  if (filters.actorEmail) params.actorEmail = filters.actorEmail
  if (filters.startDate) params.startDate = new Date(filters.startDate).toISOString()
  if (filters.endDate) params.endDate = new Date(filters.endDate).toISOString()
  
  return params
})

// Fetch audit logs
const { data, pending, error, refresh } = await useFetch('/api/admin/audit-logs', {
  query: queryParams,
  watch: [queryParams]
})

const logs = computed(() => data.value?.data || [])
const pagination = computed(() => data.value?.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 })

// Watch for filter changes to reset page
watch([() => filters.eventType, () => filters.status, () => filters.actorEmail], () => {
  currentPage.value = 1
})

// Date range label
const dateRangeLabel = computed(() => {
  if (filters.startDate && filters.endDate) {
    return `${filters.startDate} - ${filters.endDate}`
  }
  if (filters.startDate) return `From ${filters.startDate}`
  if (filters.endDate) return `Until ${filters.endDate}`
  return 'Select dates...'
})

function applyDateFilter() {
  currentPage.value = 1
  refresh()
}

function clearFilters() {
  filters.eventType = undefined
  filters.status = undefined
  filters.actorEmail = ''
  filters.startDate = ''
  filters.endDate = ''
  currentPage.value = 1
}

// Table columns
const columns: TableColumn<any>[] = [
  { accessorKey: 'timestamp', header: 'Timestamp' },
  { accessorKey: 'eventType', header: 'Event' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actorEmail', header: 'Actor' },
  { accessorKey: 'resourceType', header: 'Resource' },
  { accessorKey: 'metadata', header: 'Details' }
]

// Formatters
function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString()
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString()
}

function formatEventType(eventType: string): string {
  return eventType.split('.').pop()?.replace(/_/g, ' ') || eventType
}

function getEventColor(eventType: string): 'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral' {
  if (eventType.includes('success')) return 'success'
  if (eventType.includes('failure') || eventType.includes('invalid')) return 'error'
  if (eventType.includes('blocked') || eventType.includes('rate_limit')) return 'warning'
  if (eventType.includes('logout') || eventType.includes('revoked')) return 'info'
  return 'primary'
}

function getStatusColor(status: string): 'success' | 'error' | 'warning' | 'neutral' {
  switch (status) {
    case 'success': return 'success'
    case 'failure': return 'error'
    case 'blocked': return 'warning'
    default: return 'neutral'
  }
}

// Export functionality
async function exportLogs() {
  exporting.value = true
  
  try {
    // Fetch all logs for export (up to 1000)
    const response = await $fetch('/api/admin/audit-logs', {
      query: { ...queryParams.value, limit: 1000 }
    })
    
    if (!response.data?.length) {
      useToast().add({ title: 'No logs to export', color: 'warning' })
      return
    }
    
    // Convert to CSV
    const headers = ['Timestamp', 'Event Type', 'Status', 'Actor Email', 'Actor IP', 'Resource Type', 'Failure Reason']
    const rows = response.data.map((log: any) => [
      new Date(log.timestamp).toISOString(),
      log.eventType,
      log.status,
      log.actorEmail || '',
      log.actorIp,
      log.resourceType || '',
      log.failureReason || ''
    ])
    
    const csv = [headers, ...rows].map(row => row.map((cell: any) => `"${cell}"`).join(',')).join('\n')
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    useToast().add({ title: 'Export complete', color: 'success' })
  } catch (err) {
    useToast().add({ title: 'Export failed', color: 'error' })
  } finally {
    exporting.value = false
  }
}
</script>
