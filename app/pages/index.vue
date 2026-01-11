<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-12">
        <div class="flex justify-center mb-4">
          <div class="p-4 bg-primary/10 rounded-2xl">
            <UIcon name="i-heroicons-cloud" class="w-12 h-12 text-primary" />
          </div>
        </div>
        <h1 class="text-4xl font-bold text-gray-900 mb-3">Nuxt + Cloudflare</h1>
        <p class="text-gray-600 text-lg">Full-stack application running on edge infrastructure</p>
      </div>

      <!-- Feature Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <UCard class="text-center" :ui="{ body: 'p-4' }">
          <UIcon name="i-heroicons-circle-stack" class="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p class="text-sm font-medium text-gray-700">D1 Database</p>
          <p class="text-xs text-gray-500">SQLite at edge</p>
        </UCard>

        <UCard class="text-center" :ui="{ body: 'p-4' }">
          <UIcon name="i-heroicons-archive-box" class="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p class="text-sm font-medium text-gray-700">R2 Storage</p>
          <p class="text-xs text-gray-500">Blob storage</p>
        </UCard>

        <UCard class="text-center" :ui="{ body: 'p-4' }">
          <UIcon name="i-heroicons-bolt" class="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p class="text-sm font-medium text-gray-700">Workers KV</p>
          <p class="text-xs text-gray-500">Key-value cache</p>
        </UCard>

        <UCard class="text-center" :ui="{ body: 'p-4' }">
          <UIcon name="i-heroicons-envelope" class="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p class="text-sm font-medium text-gray-700">Zeptomail</p>
          <p class="text-xs text-gray-500">Email service</p>
        </UCard>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-4 justify-center mb-12">
        <UButton
          to="/auth/signup/business"
          size="lg"
          icon="i-heroicons-building-office"
        >
          Sign Up as Business
        </UButton>

        <UButton
          to="/auth/signup/employee"
          size="lg"
          color="neutral"
          variant="outline"
          icon="i-heroicons-user-plus"
        >
          Sign Up as Employee
        </UButton>

        <UButton
          to="/auth/login"
          size="lg"
          color="neutral"
          variant="ghost"
          icon="i-heroicons-arrow-right-on-rectangle"
        >
          Sign In
        </UButton>
      </div>

      <!-- API Endpoints -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-code-bracket" class="w-5 h-5 text-primary" />
            <span class="font-semibold">API Endpoints</span>
          </div>
        </template>

        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
            <div class="flex items-center gap-3">
              <UBadge color="success" size="sm">GET</UBadge>
              <code class="text-sm text-gray-700">/api/users</code>
            </div>
            <span class="text-xs text-gray-500">D1 Database</span>
          </div>

          <div class="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
            <div class="flex items-center gap-3">
              <UBadge color="primary" size="sm">POST</UBadge>
              <code class="text-sm text-gray-700">/api/upload</code>
            </div>
            <span class="text-xs text-gray-500">R2 Storage</span>
          </div>

          <div class="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
            <div class="flex items-center gap-3">
              <UBadge color="warning" size="sm">GET/POST</UBadge>
              <code class="text-sm text-gray-700">/api/kv</code>
            </div>
            <span class="text-xs text-gray-500">Workers KV</span>
          </div>

          <div class="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
            <div class="flex items-center gap-3">
              <UBadge color="info" size="sm">POST</UBadge>
              <code class="text-sm text-gray-700">/api/email/send</code>
            </div>
            <span class="text-xs text-gray-500">Zeptomail</span>
          </div>
        </div>
      </UCard>

      <!-- Enterprise Compliance Features -->
      <div class="mt-12">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Enterprise Compliance Ready</h2>
          <p class="text-gray-600">SOC2, GDPR & HIPAA compliant features built-in</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <UCard :ui="{ body: 'p-4' }">
            <div class="flex items-start gap-3">
              <div class="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <UIcon name="i-heroicons-clipboard-document-list" class="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">Audit Logging</h3>
                <p class="text-sm text-gray-600">Complete activity trail with IP, device, and location tracking</p>
              </div>
            </div>
          </UCard>

          <UCard :ui="{ body: 'p-4' }">
            <div class="flex items-start gap-3">
              <div class="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <UIcon name="i-heroicons-shield-check" class="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">Session Security</h3>
                <p class="text-sm text-gray-600">Idle timeouts, device management & session revocation</p>
              </div>
            </div>
          </UCard>

          <UCard :ui="{ body: 'p-4' }">
            <div class="flex items-start gap-3">
              <div class="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <UIcon name="i-heroicons-user-circle" class="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">GDPR Rights</h3>
                <p class="text-sm text-gray-600">Data export, account deletion & consent management</p>
              </div>
            </div>
          </UCard>

          <UCard :ui="{ body: 'p-4' }">
            <div class="flex items-start gap-3">
              <div class="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <UIcon name="i-heroicons-lock-closed" class="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">Security Hardening</h3>
                <p class="text-sm text-gray-600">Rate limiting, HSTS, CSP & input sanitization</p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Legal Links -->
        <div class="flex justify-center gap-6 text-sm text-gray-500">
          <NuxtLink to="/legal/privacy" class="hover:text-primary transition-colors">
            Privacy Policy
          </NuxtLink>
          <span>·</span>
          <NuxtLink to="/legal/terms" class="hover:text-primary transition-colors">
            Terms of Service
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession()

// Redirect logged-in users to dashboard
if (loggedIn.value) {
  navigateTo('/dashboard')
}

// Watch for login state changes (e.g., after session is hydrated)
watch(loggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    navigateTo('/dashboard')
  }
})
</script>
