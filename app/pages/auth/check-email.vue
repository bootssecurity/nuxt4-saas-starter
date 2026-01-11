<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
    <UPageCard class="w-full max-w-md">
      <div class="text-center py-6 space-y-4">
        <UIcon name="i-heroicons-envelope-open" class="w-16 h-16 text-primary mx-auto" />
        <div>
          <h1 class="text-2xl font-bold text-highlighted">Check Your Email</h1>
          <p class="text-muted mt-2">
            We've sent you a magic link to sign in.<br />
            Click the link in your email to continue.
          </p>
        </div>
        
        <UAlert 
          color="neutral" 
          variant="subtle"
          icon="i-heroicons-clock"
          title="The link will expire in 15 minutes"
        />

        <p class="text-sm text-muted">
          Didn't receive the email?
          <ULink to="/auth/login" class="text-primary font-medium ml-1">
            Resend
          </ULink>
        </p>
      </div>

      <template #footer>
        <div class="flex justify-center">
          <UButton to="/auth/login" variant="ghost" color="neutral" size="sm">
            <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-1" />
            Back to login
          </UButton>
        </div>
      </template>
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  auth: false
})

const { loggedIn, ready, fetch: fetchSession } = useUserSession()

// Wait for session to be ready, then redirect if logged in
onMounted(async () => {
  await fetchSession()
  if (loggedIn.value) {
    navigateTo('/dashboard')
  }
})

watch([ready, loggedIn], ([isReady, isLoggedIn]) => {
  if (isReady && isLoggedIn) {
    navigateTo('/dashboard')
  }
})
</script>
