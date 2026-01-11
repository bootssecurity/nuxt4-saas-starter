<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <div>
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
          <UIcon name="i-heroicons-clock" class="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
        </div>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
          Account Pending Approval
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Your account is currently inactive. Please contact the Business Owner to approve your account.
        </p>
      </div>
      
      <div class="mt-8 space-y-4">
        <UAlert
          icon="i-heroicons-information-circle"
          color="warning"
          variant="soft"
          title="No Access"
          description="You cannot access the dashboard until your account is activated."
        />

        <UButton
          size="lg"
          block
          color="neutral"
          variant="ghost"
          icon="i-heroicons-arrow-right-on-rectangle"
          @click="logout"
          :loading="loggingOut"
        >
          Sign out
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  // No specific layout, uses default or we can set layout: false
})

const { clear } = useUserSession()
const loggingOut = ref(false)

async function logout() {
  loggingOut.value = true
  await clear()
  await navigateTo('/auth/login')
}
</script>
