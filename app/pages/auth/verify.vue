<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
    <UPageCard class="w-full max-w-md">
      <div class="text-center py-6 space-y-4">
        <!-- Loading State -->
        <template v-if="loading">
          <UIcon name="i-heroicons-arrow-path" class="w-16 h-16 text-primary mx-auto animate-spin" />
          <div>
            <h1 class="text-2xl font-bold text-highlighted">Verifying...</h1>
            <p class="text-muted mt-2">Please wait while we verify your magic link.</p>
          </div>
        </template>

        <!-- Error State -->
        <template v-else-if="error">
          <UIcon name="i-heroicons-x-circle" class="w-16 h-16 text-error mx-auto" />
          <div>
            <h1 class="text-2xl font-bold text-highlighted">Verification Failed</h1>
            <p class="text-muted mt-2">{{ error }}</p>
          </div>
          <UButton to="/auth/login" variant="outline" color="neutral">
            Try Again
          </UButton>
        </template>

        <!-- Success State -->
        <template v-else>
          <UIcon name="i-heroicons-check-circle" class="w-16 h-16 text-success mx-auto" />
          <div>
            <h1 class="text-2xl font-bold text-highlighted">Success!</h1>
            <p class="text-muted mt-2">Redirecting to dashboard...</p>
          </div>
        </template>
      </div>
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  auth: false
})

const route = useRoute()
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const token = route.query.token as string
  
  if (!token) {
    error.value = 'No verification token provided'
    loading.value = false
    return
  }

  try {
    await $fetch(`/api/auth/verify?token=${token}`)
    
    // Wait a moment for visual feedback
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Redirect to dashboard
    navigateTo('/dashboard')
  } catch (err: any) {
    error.value = err.data?.message || 'Invalid or expired verification link'
  } finally {
    loading.value = false
  }
})
</script>
