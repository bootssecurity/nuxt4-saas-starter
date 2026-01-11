<template>
  <div class="p-6 space-y-8">
      <!-- Consent Preferences -->
      <UPageCard 
        title="Consent Preferences" 
        description="Control how we use your data"
        icon="i-heroicons-hand-raised"
      >
        <div v-if="loadingConsent" class="flex justify-center py-4">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin" />
        </div>
        
        <div v-else class="space-y-4">
          <div class="flex items-center justify-between py-3 border-b border-default">
            <div>
              <p class="font-medium">Marketing Communications</p>
              <p class="text-sm text-muted">Receive product updates, newsletters, and promotional content</p>
            </div>
            <USwitch v-model="consent.marketing" @update:model-value="updateConsent('marketing', $event)" />
          </div>
          
          <div class="flex items-center justify-between py-3">
            <div>
              <p class="font-medium">Analytics & Improvements</p>
              <p class="text-sm text-muted">Help us improve by sharing anonymous usage data</p>
            </div>
            <USwitch v-model="consent.analytics" @update:model-value="updateConsent('analytics', $event)" />
          </div>
          
          <p class="text-xs text-muted mt-4">
            Last updated: {{ consent.consentTimestamp ? formatDate(consent.consentTimestamp) : 'Never' }}
          </p>
        </div>
      </UPageCard>

      <!-- Legal Documents -->
      <UPageCard 
        title="Legal Documents" 
        description="Review our policies"
        icon="i-heroicons-document-text"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-document" class="w-5 h-5 text-muted" />
              <div>
                <p class="font-medium">Privacy Policy</p>
                <p class="text-xs text-muted">Version {{ consent.privacyPolicyVersion || 'N/A' }}</p>
              </div>
            </div>
            <UButton to="/legal/privacy" variant="ghost" size="sm" icon="i-heroicons-arrow-top-right-on-square">
              View
            </UButton>
          </div>
          
          <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-document" class="w-5 h-5 text-muted" />
              <div>
                <p class="font-medium">Terms of Service</p>
                <p class="text-xs text-muted">Version {{ consent.termsVersion || 'N/A' }}</p>
              </div>
            </div>
            <UButton to="/legal/terms" variant="ghost" size="sm" icon="i-heroicons-arrow-top-right-on-square">
              View
            </UButton>
          </div>
        </div>
      </UPageCard>

      <!-- Data Export -->
      <UPageCard 
        title="Export Your Data" 
        description="Download a copy of all your personal data"
        icon="i-heroicons-arrow-down-tray"
      >
        <p class="text-sm text-muted mb-4">
          Under GDPR, you have the right to request a copy of all personal data we hold about you.
          This includes your profile, consent history, session logs, and activity records.
        </p>
        
        <UButton
          color="neutral"
          icon="i-heroicons-arrow-down-tray"
          :loading="exporting"
          @click="exportData"
        >
          Download My Data
        </UButton>
      </UPageCard>

      <!-- Delete Account -->
      <UPageCard 
        title="Delete Account" 
        description="Permanently remove your account and data"
        icon="i-heroicons-trash"
        class="border-error/30"
      >
        <UAlert
          color="warning"
          icon="i-heroicons-exclamation-triangle"
          class="mb-4"
        >
          <template #title>This action cannot be undone</template>
          <template #description>
            Deleting your account will immediately remove access and schedule your data for permanent deletion within 30 days.
          </template>
        </UAlert>
        
        <UButton
          color="error"
          variant="soft"
          icon="i-heroicons-trash"
          @click="showDeleteConfirm = true"
        >
          Delete My Account
        </UButton>
      </UPageCard>
    </div>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteConfirm">
      <template #content>
        <div class="p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-error" />
            </div>
            <div>
              <h3 class="font-semibold text-lg">Delete Your Account?</h3>
              <p class="text-sm text-muted">This action is permanent</p>
            </div>
          </div>
          
          <p class="text-muted mb-4">
            To confirm, please enter your email address: <strong>{{ session?.user?.email }}</strong>
          </p>
          
          <UFormField label="Confirm Email" class="mb-4">
            <UInput
              v-model="deleteConfirmEmail"
              placeholder="Enter your email"
              type="email"
            />
          </UFormField>
          
          <UFormField label="Reason (optional)" class="mb-6">
            <UTextarea
              v-model="deleteReason"
              placeholder="Why are you leaving? (helps us improve)"
              :rows="2"
            />
          </UFormField>
          
          <div class="flex gap-3 justify-end">
            <UButton
              color="neutral"
              variant="ghost"
              @click="showDeleteConfirm = false"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              :loading="deleting"
              :disabled="!deleteConfirmEmail"
              @click="deleteAccount"
            >
              Delete Forever
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
  title: 'Privacy & Data'
})

const toast = useToast()
const { session, clear: clearSession } = useUserSession()

// Consent state
const loadingConsent = ref(true)
const consent = reactive({
  marketing: false,
  analytics: false,
  privacyPolicyVersion: null as string | null,
  termsVersion: null as string | null,
  consentTimestamp: null as string | null
})

// Export state
const exporting = ref(false)

// Delete state
const showDeleteConfirm = ref(false)
const deleteConfirmEmail = ref('')
const deleteReason = ref('')
const deleting = ref(false)

// Load consent preferences
onMounted(async () => {
  try {
    const response = await $fetch('/api/user/consent')
    if (response.consent) {
      Object.assign(consent, response.consent)
    }
  } catch (err) {
    toast.add({ title: 'Failed to load preferences', color: 'error' })
  } finally {
    loadingConsent.value = false
  }
})

// Update consent preference
async function updateConsent(type: 'marketing' | 'analytics', value: boolean) {
  try {
    await $fetch('/api/user/consent', {
      method: 'POST',
      body: { [type]: value }
    })
    toast.add({ title: 'Preferences updated', color: 'success' })
  } catch (err: any) {
    // Revert on error
    consent[type] = !value
    toast.add({ title: 'Failed to update', description: err.data?.message, color: 'error' })
  }
}

// Export data
async function exportData() {
  exporting.value = true
  
  try {
    const response = await $fetch('/api/user/data-export', { method: 'POST' })
    
    // Download as JSON file
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `my-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.add({ title: 'Data exported successfully', color: 'success' })
  } catch (err: any) {
    toast.add({ 
      title: 'Export failed', 
      description: err.data?.message || 'Please try again later',
      color: 'error' 
    })
  } finally {
    exporting.value = false
  }
}

// Delete account
async function deleteAccount() {
  deleting.value = true
  
  try {
    await $fetch('/api/user/delete-account', {
      method: 'POST',
      body: {
        confirmEmail: deleteConfirmEmail.value,
        reason: deleteReason.value
      }
    })
    
    // Clear session and redirect
    await clearSession()
    
    toast.add({ 
      title: 'Account deleted', 
      description: 'Your data will be permanently removed within 30 days.',
      color: 'success' 
    })
    
    navigateTo('/')
  } catch (err: any) {
    toast.add({ 
      title: 'Failed to delete account', 
      description: err.data?.message,
      color: 'error' 
    })
  } finally {
    deleting.value = false
  }
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>
