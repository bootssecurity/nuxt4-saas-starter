<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        :fields="fields"
        :submit="submitButton"
        :loading="loading"
        :disabled="isRateLimited"
        title="Sign In"
        description="We'll send you a magic link to sign in"
        icon="i-heroicons-arrow-right-on-rectangle"
        @submit="onSubmit"
      >
        <template #validation>
          <!-- Rate limit warning -->
          <UAlert 
            v-if="isRateLimited" 
            color="warning" 
            icon="i-heroicons-clock" 
            :title="`Too many attempts. Please wait ${retrySeconds} seconds.`"
          />
          <!-- General error -->
          <UAlert 
            v-else-if="error" 
            color="error" 
            icon="i-heroicons-exclamation-circle" 
            :title="error" 
          />
        </template>
        <template #footer>
          <div class="space-y-4">
            <div class="space-y-2">
              <p class="text-sm text-muted">
                Don't have an account?
              </p>
              <div class="flex gap-4 justify-center">
                <ULink to="/auth/signup/business" class="text-primary font-medium">
                  Sign up as Business
                </ULink>
                <ULink to="/auth/signup/employee" class="text-primary font-medium">
                  Sign up as Employee
                </ULink>
              </div>
            </div>
            <!-- GDPR Compliance Links -->
            <p class="text-xs text-muted text-center border-t border-default pt-4">
              By signing in, you agree to our
              <NuxtLink to="/legal/terms" class="text-primary hover:underline">Terms of Service</NuxtLink>
              and
              <NuxtLink to="/legal/privacy" class="text-primary hover:underline">Privacy Policy</NuxtLink>
            </p>
          </div>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

definePageMeta({
  auth: false
})

const { loggedIn, ready, fetch: fetchSession } = useUserSession()

// Wait for session to be ready, then redirect if logged in
onMounted(async () => {
  // Fetch the latest session state
  await fetchSession()
  
  // Redirect logged-in users to dashboard
  if (loggedIn.value) {
    navigateTo('/dashboard')
  }
})

// Also watch for changes (in case session updates after mount)
watch([ready, loggedIn], ([isReady, isLoggedIn]) => {
  if (isReady && isLoggedIn) {
    navigateTo('/dashboard')
  }
})

const loading = ref(false)
const error = ref('')
const isRateLimited = ref(false)
const retrySeconds = ref(0)

// Countdown timer for rate limiting
let countdownInterval: ReturnType<typeof setInterval> | null = null

function startRateLimitCountdown(seconds: number) {
  isRateLimited.value = true
  retrySeconds.value = seconds
  
  if (countdownInterval) clearInterval(countdownInterval)
  
  countdownInterval = setInterval(() => {
    retrySeconds.value--
    if (retrySeconds.value <= 0) {
      isRateLimited.value = false
      error.value = ''
      if (countdownInterval) clearInterval(countdownInterval)
    }
  }, 1000)
}

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'Email Address',
  placeholder: 'john@company.com',
  required: true
}]

const schema = z.object({
  email: z.email('Please enter a valid email address')
})

type Schema = z.output<typeof schema>

const submitButton = computed(() => ({
  label: loading.value ? 'Sending...' : isRateLimited.value ? `Wait ${retrySeconds.value}s` : 'Send Magic Link',
  icon: isRateLimited.value ? 'i-heroicons-clock' : 'i-heroicons-paper-airplane',
  loading: loading.value
}))

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  if (isRateLimited.value) return
  
  error.value = ''
  loading.value = true

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: payload.data.email }
    })

    navigateTo('/auth/check-email')
  } catch (err: any) {
    // Handle rate limiting specifically
    if (err.statusCode === 429) {
      const retryAfter = err.data?.retryAfter || 60
      startRateLimitCountdown(retryAfter)
    } else {
      error.value = err.data?.message || err.data?.statusMessage || 'Failed to send magic link. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>
