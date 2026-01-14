<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        :fields="fields"
        :submit="submitButton"
        :loading="loading"
        :disabled="isRateLimited"
        title="Create Business Account"
        description="Sign up your company and get a unique code for employees"
        icon="i-heroicons-building-office"
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
          
          <div class="mt-4 flex justify-center">
            <NuxtTurnstile v-model="token" />
          </div>
        </template>

        <template #footer>
          <div class="space-y-4">
            <div class="space-y-2">
              <p class="text-sm text-muted">
                Already have an account?
                <ULink to="/auth/login" class="text-primary font-medium">
                  Sign in
                </ULink>
              </p>
              <p class="text-sm text-muted">
                Have a company code?
                <ULink to="/auth/signup/employee" class="text-primary font-medium">
                  Sign up as Employee
                </ULink>
              </p>
            </div>
            <!-- GDPR Compliance Links -->
            <p class="text-xs text-muted text-center border-t border-default pt-4">
              By creating an account, you agree to our
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

const loading = ref(false)
const error = ref('')
const isRateLimited = ref(false)
const retrySeconds = ref(0)
const token = ref('')

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

const fields: AuthFormField[] = [
  {
    name: 'businessName',
    type: 'text',
    label: 'Business Name',
    placeholder: 'Acme Corporation',
    required: true
  },
  {
    name: 'firstName',
    type: 'text',
    label: 'First Name',
    placeholder: 'John',
    required: true
  },
  {
    name: 'lastName',
    type: 'text',
    label: 'Last Name',
    placeholder: 'Doe',
    required: true
  },
  {
    name: 'email',
    type: 'email',
    label: 'Email Address',
    placeholder: 'john@company.com',
    required: true
  },
  {
    name: 'phone',
    type: 'tel',
    label: 'Phone Number',
    placeholder: '+1 (555) 123-4567'
  }
]

const schema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.email('Please enter a valid email address'),
  phone: z.string().optional()
})

type Schema = z.output<typeof schema>

const submitButton = computed(() => ({
  label: loading.value ? 'Creating Account...' : isRateLimited.value ? `Wait ${retrySeconds.value}s` : 'Create Business Account',
  icon: isRateLimited.value ? 'i-heroicons-clock' : 'i-heroicons-arrow-right',
  loading: loading.value,
  disabled: !token.value
}))

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  if (isRateLimited.value) return
  if (!token.value) {
    error.value = 'Please complete the security check'
    return
  }
  
  error.value = ''
  loading.value = true

  try {
    await $fetch('/api/auth/signup/business', {
      method: 'POST',
      body: {
        businessName: payload.data.businessName,
        firstName: payload.data.firstName,
        lastName: payload.data.lastName,
        email: payload.data.email,
        phone: payload.data.phone,
        token: token.value
      }
    })

    navigateTo('/auth/check-email')
  } catch (err: any) {
    // Handle rate limiting specifically
    if (err.statusCode === 429) {
      const retryAfter = err.data?.retryAfter || 60
      startRateLimitCountdown(retryAfter)
    } else {
      error.value = err.data?.message || err.data?.statusMessage || 'Failed to create account. Please try again.'
    }
    // Reset token on error
    token.value = ''
  } finally {
    loading.value = false
  }
}
</script>
