<template>
  <div>
    <!-- Cookie Consent Banner -->
    <Transition
      enter-from-class="translate-y-full opacity-0"
      enter-active-class="transition-all duration-300"
      leave-active-class="transition-all duration-200"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="showBanner"
        class="fixed bottom-0 left-0 right-0 z-50 p-4 bg-elevated border-t border-default shadow-lg"
      >
        <div class="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <div class="flex-1">
            <p class="text-sm">
              We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
              <NuxtLink to="/legal/privacy" class="text-primary hover:underline">
                Learn more
              </NuxtLink>
            </p>
          </div>
          
          <div class="flex gap-2 flex-shrink-0">
            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showCustomize = true"
            >
              Customize
            </UButton>
            <UButton
              variant="soft"
              color="neutral"
              size="sm"
              @click="rejectAll"
            >
              Reject All
            </UButton>
            <UButton
              color="primary"
              size="sm"
              @click="acceptAll"
            >
              Accept All
            </UButton>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Customize Modal -->
    <UModal v-model:open="showCustomize">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">Cookie Preferences</h3>
          
          <div class="space-y-4 mb-6">
            <!-- Essential (always on) -->
            <div class="flex items-center justify-between py-2 border-b border-default">
              <div>
                <p class="font-medium">Essential Cookies</p>
                <p class="text-sm text-muted">Required for the website to function properly</p>
              </div>
              <USwitch :model-value="true" disabled />
            </div>
            
            <!-- Analytics -->
            <div class="flex items-center justify-between py-2 border-b border-default">
              <div>
                <p class="font-medium">Analytics Cookies</p>
                <p class="text-sm text-muted">Help us understand how you use our website</p>
              </div>
              <USwitch v-model="preferences.analytics" />
            </div>
            
            <!-- Marketing -->
            <div class="flex items-center justify-between py-2">
              <div>
                <p class="font-medium">Marketing Cookies</p>
                <p class="text-sm text-muted">Used to deliver personalized advertisements</p>
              </div>
              <USwitch v-model="preferences.marketing" />
            </div>
          </div>
          
          <div class="flex gap-3 justify-end">
            <UButton
              color="neutral"
              variant="ghost"
              @click="showCustomize = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              @click="savePreferences"
            >
              Save Preferences
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const COOKIE_CONSENT_KEY = 'cookie_consent'
const COOKIE_PREFERENCES_KEY = 'cookie_preferences'

const showBanner = ref(false)
const showCustomize = ref(false)

const preferences = reactive({
  analytics: false,
  marketing: false
})

// Check if consent has been given
onMounted(() => {
  const consent = useCookie(COOKIE_CONSENT_KEY)
  if (!consent.value) {
    showBanner.value = true
  } else {
    // Load saved preferences
    const saved = useCookie(COOKIE_PREFERENCES_KEY)
    if (saved.value) {
      try {
        const parsed = JSON.parse(saved.value as string)
        preferences.analytics = parsed.analytics ?? false
        preferences.marketing = parsed.marketing ?? false
      } catch {
        // Invalid JSON, ignore
      }
    }
  }
})

function acceptAll() {
  preferences.analytics = true
  preferences.marketing = true
  saveAndClose()
}

function rejectAll() {
  preferences.analytics = false
  preferences.marketing = false
  saveAndClose()
}

function savePreferences() {
  showCustomize.value = false
  saveAndClose()
}

function saveAndClose() {
  // Save consent timestamp
  const consentCookie = useCookie(COOKIE_CONSENT_KEY, {
    maxAge: 365 * 24 * 60 * 60 // 1 year
  })
  consentCookie.value = new Date().toISOString()
  
  // Save preferences
  const prefsCookie = useCookie(COOKIE_PREFERENCES_KEY, {
    maxAge: 365 * 24 * 60 * 60
  })
  prefsCookie.value = JSON.stringify({
    analytics: preferences.analytics,
    marketing: preferences.marketing
  })
  
  showBanner.value = false
  
  // Emit event for analytics integration
  if (import.meta.client) {
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', {
      detail: preferences
    }))
  }
}
</script>
