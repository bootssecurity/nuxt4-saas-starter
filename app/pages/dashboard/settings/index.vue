<template>
  <UDashboardPanel>
    <UDashboardNavbar title="Settings">
      <template #leading>
        <UIcon name="i-heroicons-cog-6-tooth" class="w-6 h-6" />
      </template>
    </UDashboardNavbar>

    <div class="p-6">
      <!-- Settings Navigation Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Profile Settings -->
        <NuxtLink to="/dashboard/settings/profile">
          <UCard class="h-full hover:border-primary transition-colors cursor-pointer" :ui="{ body: 'p-5' }">
            <div class="flex items-start gap-4">
              <div class="p-3 bg-primary/10 rounded-lg">
                <UIcon name="i-heroicons-user-circle" class="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 class="font-semibold text-lg">Profile</h3>
                <p class="text-sm text-muted">Manage your personal information and preferences</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>

        <!-- Active Sessions -->
        <NuxtLink to="/dashboard/settings/sessions">
          <UCard class="h-full hover:border-primary transition-colors cursor-pointer" :ui="{ body: 'p-5' }">
            <div class="flex items-start gap-4">
              <div class="p-3 bg-green-100 rounded-lg">
                <UIcon name="i-heroicons-device-phone-mobile" class="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 class="font-semibold text-lg">Active Sessions</h3>
                <p class="text-sm text-muted">View and manage devices signed into your account</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>

        <!-- Privacy & Data -->
        <NuxtLink to="/dashboard/settings/privacy">
          <UCard class="h-full hover:border-primary transition-colors cursor-pointer" :ui="{ body: 'p-5' }">
            <div class="flex items-start gap-4">
              <div class="p-3 bg-purple-100 rounded-lg">
                <UIcon name="i-heroicons-shield-check" class="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 class="font-semibold text-lg">Privacy & Data</h3>
                <p class="text-sm text-muted">Consent preferences, data export, and account deletion</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>

        <!-- Activity Log -->
        <NuxtLink to="/dashboard/settings/activity">
          <UCard class="h-full hover:border-primary transition-colors cursor-pointer" :ui="{ body: 'p-5' }">
            <div class="flex items-start gap-4">
              <div class="p-3 bg-orange-100 rounded-lg">
                <UIcon name="i-heroicons-clipboard-document-list" class="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 class="font-semibold text-lg">Activity Log</h3>
                <p class="text-sm text-muted">View your login history and account activity</p>
              </div>
            </div>
          </UCard>
        </NuxtLink>

        <!-- Notifications (placeholder) -->
        <UCard class="h-full opacity-60" :ui="{ body: 'p-5' }">
          <div class="flex items-start gap-4">
            <div class="p-3 bg-yellow-100 rounded-lg">
              <UIcon name="i-heroicons-bell" class="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 class="font-semibold text-lg">Notifications</h3>
              <p class="text-sm text-muted">Email and push notification preferences</p>
              <UBadge color="neutral" size="xs" class="mt-2">Coming Soon</UBadge>
            </div>
          </div>
        </UCard>

        <!-- Security (placeholder) -->
        <UCard class="h-full opacity-60" :ui="{ body: 'p-5' }">
          <div class="flex items-start gap-4">
            <div class="p-3 bg-red-100 rounded-lg">
              <UIcon name="i-heroicons-lock-closed" class="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 class="font-semibold text-lg">Security</h3>
              <p class="text-sm text-muted">Two-factor authentication and security keys</p>
              <UBadge color="neutral" size="xs" class="mt-2">Coming Soon</UBadge>
            </div>
          </div>
        </UCard>

        <!-- Connected Apps (placeholder) -->
        <UCard class="h-full opacity-60" :ui="{ body: 'p-5' }">
          <div class="flex items-start gap-4">
            <div class="p-3 bg-blue-100 rounded-lg">
              <UIcon name="i-heroicons-puzzle-piece" class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 class="font-semibold text-lg">Connected Apps</h3>
              <p class="text-sm text-muted">Manage third-party app connections</p>
              <UBadge color="neutral" size="xs" class="mt-2">Coming Soon</UBadge>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Quick Stats -->
      <div class="mt-8">
        <h2 class="text-lg font-semibold mb-4">Account Overview</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UCard :ui="{ body: 'p-4 text-center' }">
            <p class="text-2xl font-bold text-primary">{{ activeSessions }}</p>
            <p class="text-sm text-muted">Active Sessions</p>
          </UCard>
          
          <UCard :ui="{ body: 'p-4 text-center' }">
            <p class="text-2xl font-bold text-green-600">{{ consentStatus }}</p>
            <p class="text-sm text-muted">Data Consent</p>
          </UCard>
          
          <UCard :ui="{ body: 'p-4 text-center' }">
            <p class="text-2xl font-bold text-purple-600">{{ session?.user?.role || 'User' }}</p>
            <p class="text-sm text-muted">Account Type</p>
          </UCard>
          
          <UCard :ui="{ body: 'p-4 text-center' }">
            <p class="text-2xl font-bold text-orange-600">{{ memberSince }}</p>
            <p class="text-sm text-muted">Member Since</p>
          </UCard>
        </div>
      </div>

      <!-- Legal Links -->
      <div class="mt-8 pt-8 border-t border-default">
        <div class="flex flex-wrap gap-4 text-sm text-muted">
          <NuxtLink to="/legal/privacy" class="hover:text-primary transition-colors">
            Privacy Policy
          </NuxtLink>
          <span>·</span>
          <NuxtLink to="/legal/terms" class="hover:text-primary transition-colors">
            Terms of Service
          </NuxtLink>
          <span>·</span>
          <span>Version 1.0</span>
        </div>
      </div>
    </div>
  </UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const { session } = useUserSession()

// Fetch active sessions count
const activeSessions = ref(0)
const consentStatus = ref('Configured')

onMounted(async () => {
  try {
    const sessionsResponse = await $fetch('/api/user/sessions')
    activeSessions.value = sessionsResponse.sessions?.length || 1
  } catch {
    activeSessions.value = 1
  }
  
  try {
    const consentResponse = await $fetch('/api/user/consent')
    const c = consentResponse.consent
    consentStatus.value = (c?.marketing || c?.analytics) ? 'Configured' : 'Minimal'
  } catch {
    consentStatus.value = 'Not Set'
  }
})

const memberSince = computed(() => {
  // This would come from session data in a real app
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const now = new Date()
  return `${months[now.getMonth()]} ${now.getFullYear()}`
})
</script>
