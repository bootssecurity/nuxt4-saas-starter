<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
    <UPageCard class="w-full max-w-md">
      <!-- Step 1: Company Code Validation -->
      <template v-if="!codeValid">
        <UAuthForm
          :schema="codeSchema"
          :fields="codeFields"
          :submit="codeSubmitButton"
          :loading="validatingCode"
          :disabled="isCodeRateLimited"
          title="Join Your Company"
          description="Enter your company code to sign up as an employee"
          icon="i-heroicons-user-plus"
          @submit="validateCode"
        >
          <template #validation>
            <!-- Rate limit warning -->
            <UAlert 
              v-if="isCodeRateLimited" 
              color="warning" 
              icon="i-heroicons-clock" 
              :title="`Too many attempts. Please wait ${codeRetrySeconds} seconds.`"
            />
            <!-- General error -->
            <UAlert 
              v-else-if="codeError" 
              color="error" 
              icon="i-heroicons-exclamation-circle" 
              :title="codeError" 
            />
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
                  Want to register a company?
                  <ULink to="/auth/signup/business" class="text-primary font-medium">
                    Sign up as Business
                  </ULink>
                </p>
              </div>
              <!-- GDPR Compliance Links -->
              <p class="text-xs text-muted text-center border-t border-default pt-4">
                By signing up, you agree to our
                <NuxtLink to="/legal/terms" class="text-primary hover:underline">Terms of Service</NuxtLink>
                and
                <NuxtLink to="/legal/privacy" class="text-primary hover:underline">Privacy Policy</NuxtLink>
              </p>
            </div>
          </template>
        </UAuthForm>
      </template>

      <!-- Step 2: Personal Details (after valid code) -->
      <template v-else>
        <div class="mb-4">
          <UAlert color="success" icon="i-heroicons-check-circle" :title="`Joining: ${companyName}`" />
        </div>
        <UAuthForm
          :schema="detailsSchema"
          :fields="detailsFields"
          :submit="detailsSubmitButton"
          :loading="loading"
          :disabled="isRateLimited"
          title="Complete Your Profile"
          description="Enter your personal details to complete registration"
          icon="i-heroicons-user"
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
              <UButton variant="ghost" color="neutral" @click="resetCode" class="text-sm">
                <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 mr-1" />
                Use a different company code
              </UButton>
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
      </template>
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
const validatingCode = ref(false)
const error = ref('')
const codeError = ref('')
const codeValid = ref(false)
const companyName = ref('')
const validatedCode = ref('')
const token = ref('')

// Rate limiting state for code validation
const isCodeRateLimited = ref(false)
const codeRetrySeconds = ref(0)

// Rate limiting state for signup
const isRateLimited = ref(false)
const retrySeconds = ref(0)

// Countdown timers
let codeCountdownInterval: ReturnType<typeof setInterval> | null = null
let signupCountdownInterval: ReturnType<typeof setInterval> | null = null

function startCodeRateLimitCountdown(seconds: number) {
  isCodeRateLimited.value = true
  codeRetrySeconds.value = seconds
  
  if (codeCountdownInterval) clearInterval(codeCountdownInterval)
  
  codeCountdownInterval = setInterval(() => {
    codeRetrySeconds.value--
    if (codeRetrySeconds.value <= 0) {
      isCodeRateLimited.value = false
      codeError.value = ''
      if (codeCountdownInterval) clearInterval(codeCountdownInterval)
    }
  }, 1000)
}

function startSignupRateLimitCountdown(seconds: number) {
  isRateLimited.value = true
  retrySeconds.value = seconds
  
  if (signupCountdownInterval) clearInterval(signupCountdownInterval)
  
  signupCountdownInterval = setInterval(() => {
    retrySeconds.value--
    if (retrySeconds.value <= 0) {
      isRateLimited.value = false
      error.value = ''
      if (signupCountdownInterval) clearInterval(signupCountdownInterval)
    }
  }, 1000)
}

onUnmounted(() => {
  if (codeCountdownInterval) clearInterval(codeCountdownInterval)
  if (signupCountdownInterval) clearInterval(signupCountdownInterval)
})

// Code validation step
const codeFields: AuthFormField[] = [{
  name: 'companyCode',
  type: 'text',
  label: 'Company Code',
  placeholder: 'ABC123',
  required: true
}]

const codeSchema = z.object({
  companyCode: z.string().min(3, 'Company code must be at least 3 characters')
})

// Personal details step
const detailsFields: AuthFormField[] = [
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

const detailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.email('Please enter a valid email address'),
  phone: z.string().optional()
})

type CodeSchema = z.output<typeof codeSchema>
type DetailsSchema = z.output<typeof detailsSchema>

const codeSubmitButton = computed(() => ({
  label: validatingCode.value ? 'Validating...' : isCodeRateLimited.value ? `Wait ${codeRetrySeconds.value}s` : 'Validate Code',
  icon: isCodeRateLimited.value ? 'i-heroicons-clock' : 'i-heroicons-key',
  loading: validatingCode.value
}))

const detailsSubmitButton = computed(() => ({
  label: loading.value ? 'Joining Company...' : isRateLimited.value ? `Wait ${retrySeconds.value}s` : 'Join Company',
  icon: isRateLimited.value ? 'i-heroicons-clock' : 'i-heroicons-arrow-right',
  loading: loading.value,
  disabled: !token.value
}))

async function validateCode(payload: FormSubmitEvent<CodeSchema>) {
  if (isCodeRateLimited.value) return
  
  codeError.value = ''
  validatingCode.value = true

  try {
    const response = await $fetch(`/api/business/validate-code?code=${payload.data.companyCode}`)
    codeValid.value = true
    companyName.value = response.businessName
    validatedCode.value = payload.data.companyCode
  } catch (err: any) {
    // Handle rate limiting specifically
    if (err.statusCode === 429) {
      const retryAfter = err.data?.retryAfter || 60
      startCodeRateLimitCountdown(retryAfter)
    } else {
      codeError.value = err.data?.message || err.data?.statusMessage || 'Invalid company code'
    }
  } finally {
    validatingCode.value = false
  }
}

function resetCode() {
  codeValid.value = false
  companyName.value = ''
  validatedCode.value = ''
  error.value = ''
  token.value = ''
}

async function onSubmit(payload: FormSubmitEvent<DetailsSchema>) {
  if (isRateLimited.value) return
  if (!token.value) {
    error.value = 'Please complete the security check'
    return
  }
  
  error.value = ''
  loading.value = true

  try {
    await $fetch('/api/auth/signup/employee', {
      method: 'POST',
      body: {
        companyCode: validatedCode.value,
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
      startSignupRateLimitCountdown(retryAfter)
    } else {
      error.value = err.data?.message || err.data?.statusMessage || 'Failed to sign up. Please try again.'
    }
    // Reset token on error
    token.value = ''
  } finally {
    loading.value = false
  }
}
</script>
