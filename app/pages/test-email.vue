<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-envelope" class="w-6 h-6 text-primary" />
          <h1 class="text-xl font-semibold">Test Email</h1>
        </div>
      </template>

      <form @submit.prevent="sendEmail" class="space-y-4">
        <!-- To Email -->
        <UFormField label="To Email" required>
          <UInput
            v-model="form.to"
            type="email"
            placeholder="recipient@example.com"
            icon="i-heroicons-at-symbol"
            size="lg"
          />
        </UFormField>

        <!-- Subject -->
        <UFormField label="Subject" required>
          <UInput
            v-model="form.subject"
            placeholder="Email subject"
            icon="i-heroicons-chat-bubble-bottom-center-text"
            size="lg"
          />
        </UFormField>

        <!-- Message -->
        <UFormField label="Message" required>
          <UTextarea
            v-model="form.message"
            :rows="4"
            placeholder="Enter your message..."
            autoresize
          />
        </UFormField>

        <!-- Send Button -->
        <UButton
          type="submit"
          :loading="loading"
          :disabled="loading"
          block
          size="lg"
          icon="i-heroicons-paper-airplane"
        >
          {{ loading ? 'Sending...' : 'Send Test Email' }}
        </UButton>
      </form>

      <!-- Result Alert -->
      <template v-if="result">
        <UDivider class="my-4" />
        <UAlert
          :color="result.success ? 'success' : 'error'"
          :icon="result.success ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
          :title="result.success ? 'Email Sent!' : 'Failed to Send'"
          :description="result.message"
        />
      </template>

      <template #footer>
        <div class="flex justify-center">
          <UButton
            to="/"
            variant="ghost"
            color="neutral"
            icon="i-heroicons-arrow-left"
          >
            Back to Home
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const form = ref({
  to: '',
  subject: 'Test Email from Nuxt App',
  message: 'Hello! This is a test email sent from our Nuxt application running on Cloudflare.'
})

const loading = ref(false)
const result = ref<{ success: boolean; message: string } | null>(null)

async function sendEmail() {
  loading.value = true
  result.value = null

  try {
    const response = await $fetch('/api/email/send', {
      method: 'POST',
      body: {
        to: form.value.to,
        subject: form.value.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 16px;">Test Email</h2>
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">${form.value.message}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">
              Sent from Nuxt App on Cloudflare • ${new Date().toLocaleString()}
            </p>
          </div>
        `
      }
    })

    result.value = {
      success: true,
      message: `Message ID: ${response.messageId}`
    }
    
  } catch (error: any) {
    result.value = {
      success: false,
      message: error.data?.message || error.message || 'An unexpected error occurred'
    }
  } finally {
    loading.value = false
  }
}
</script>
