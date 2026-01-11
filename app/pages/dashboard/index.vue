<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
  title: 'Dashboard'
})

const { session } = useUserSession()
const toast = useToast()

function copyCode() {
  if (session.value?.user?.businessCode) {
    navigator.clipboard.writeText(session.value.user.businessCode)
    toast.add({
      title: 'Copied!',
      description: 'Company code copied to clipboard',
      icon: 'i-heroicons-clipboard-document-check',
      color: 'success'
    })
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Optional: Keep badge if needed, maybe move to page proper or use teleport? -->
    <!-- The user wanted role badge. In the layout I only added ChatWidget. -->
    <!-- I should probably add a slot in the layout for actions? -->
    <!-- Or just keep the badge here? -->
    <!-- But the navbar is in the layout now. -->
    <!-- If I want page-specific actions in the navbar, I need a teleport or a store. -->
    <!-- For now, I will omit the badge in the header to match "make sure all pages are using THIS header". -->
    <!-- If user wants the badge back, I can use <Teleport to="#navbar-actions"> if I add an ID. -->
    
    <!-- User Info Card -->
      <UCard class="mb-6">
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-user-circle" class="w-8 h-8 text-primary" />
            <div>
              <h2 class="text-lg font-semibold">{{ session?.user?.firstName }} {{ session?.user?.lastName }}</h2>
              <p class="text-sm text-gray-500">{{ session?.user?.email }}</p>
            </div>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Company Info -->
          <div v-if="session?.user?.businessName" class="bg-gray-50 rounded-lg p-4">
            <p class="text-sm text-gray-500 mb-1">Company</p>
            <p class="font-semibold">{{ session?.user?.businessName }}</p>
          </div>

          <!-- Company Code (for business owners) -->
          <div v-if="session?.user?.role === 'business_owner' && session?.user?.businessCode" class="bg-primary/5 rounded-lg p-4">
            <p class="text-sm text-gray-500 mb-1">Your Company Code</p>
            <div class="flex items-center gap-2">
              <code class="text-2xl font-bold text-primary tracking-wider">{{ session?.user?.businessCode }}</code>
              <UButton
                size="xs"
                variant="ghost"
                icon="i-heroicons-clipboard-document"
                @click="copyCode"
              />
            </div>
            <p class="text-xs text-gray-500 mt-2">Share this code with employees to join your company</p>
          </div>
        </div>
      </UCard>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-3 bg-blue-100 rounded-lg">
              <UIcon name="i-heroicons-users" class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Team</p>
              <p class="font-semibold">View Members</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-3 bg-green-100 rounded-lg">
              <UIcon name="i-heroicons-cog-6-tooth" class="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Settings</p>
              <p class="font-semibold">Account Settings</p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-3">
            <div class="p-3 bg-purple-100 rounded-lg">
              <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Analytics</p>
              <p class="font-semibold">View Reports</p>
            </div>
          </div>
        </UCard>
      </div>
    </div>
</template>
