<template>
  <div class="p-6 space-y-8">
    <!-- Profile Picture -->
      <UPageCard 
        title="Profile Picture" 
        description="Your avatar shown across the platform"
        icon="i-heroicons-photo"
      >
        <div class="flex items-center gap-6">
          <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {{ initials }}
          </div>
          <div>
            <p class="text-sm text-muted mb-2">Upload a photo to personalize your profile</p>
            <UButton size="sm" variant="soft" disabled>
              Upload Photo (Coming Soon)
            </UButton>
          </div>
        </div>
      </UPageCard>

      <!-- Personal Information -->
      <UPageCard 
        title="Personal Information" 
        description="Update your personal details"
        icon="i-heroicons-user"
      >
        <form @submit.prevent="updateProfile" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="First Name">
              <UInput v-model="form.firstName" placeholder="John" />
            </UFormField>
            
            <UFormField label="Last Name">
              <UInput v-model="form.lastName" placeholder="Doe" />
            </UFormField>
          </div>
          
          <UFormField label="Email Address">
            <UInput v-model="form.email" type="email" disabled />
            <template #hint>
              <span class="text-xs text-muted">Email cannot be changed for security reasons</span>
            </template>
          </UFormField>
          
          <UFormField label="Phone Number (Optional)">
            <UInput v-model="form.phone" type="tel" placeholder="+1 (555) 123-4567" />
          </UFormField>
          
          <div class="pt-4">
            <UButton type="submit" :loading="saving">
              Save Changes
            </UButton>
          </div>
        </form>
      </UPageCard>

      <!-- Account Information -->
      <UPageCard 
        title="Account Information" 
        description="Your account details"
        icon="i-heroicons-identification"
      >
        <dl class="space-y-4">
          <div class="flex justify-between py-2 border-b border-default">
            <dt class="text-muted">Account ID</dt>
            <dd class="font-mono text-sm">{{ session?.user?.id || 'N/A' }}</dd>
          </div>
          
          <div class="flex justify-between py-2 border-b border-default">
            <dt class="text-muted">Role</dt>
            <dd>
              <UBadge :color="roleColor">{{ session?.user?.role || 'User' }}</UBadge>
            </dd>
          </div>
          
          <div v-if="session?.user?.businessId" class="flex justify-between py-2 border-b border-default">
            <dt class="text-muted">Business ID</dt>
            <dd class="font-mono text-sm">{{ session.user.businessId }}</dd>
          </div>
          
          <div class="flex justify-between py-2">
            <dt class="text-muted">Account Status</dt>
            <dd>
              <UBadge color="success">Active</UBadge>
            </dd>
          </div>
        </dl>
      </UPageCard>

      <!-- Danger Zone -->
      <UPageCard 
        title="Danger Zone" 
        description="Irreversible actions"
        icon="i-heroicons-exclamation-triangle"
        class="border-error/30"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">Delete Account</p>
            <p class="text-sm text-muted">Permanently delete your account and all data</p>
          </div>
          <UButton to="/dashboard/settings/privacy" color="error" variant="soft">
            Manage in Privacy Settings
          </UButton>
        </div>
      </UPageCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
  title: 'Profile Settings'
})

const toast = useToast()
const { session } = useUserSession()

const saving = ref(false)

const form = reactive({
  firstName: session.value?.user?.firstName || '',
  lastName: session.value?.user?.lastName || '',
  email: session.value?.user?.email || '',
  phone: ''
})

const initials = computed(() => {
  const first = form.firstName?.charAt(0) || ''
  const last = form.lastName?.charAt(0) || ''
  return (first + last).toUpperCase() || 'U'
})

const roleColor = computed(() => {
  const role = session.value?.user?.role
  if (role === 'admin') return 'error'
  if (role === 'business_owner') return 'primary'
  return 'neutral'
})

async function updateProfile() {
  saving.value = true
  
  try {
    await $fetch('/api/user/profile', {
      method: 'PUT',
      body: {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone
      }
    })
    
    toast.add({ title: 'Profile updated', color: 'success' })
  } catch (err: any) {
    toast.add({ 
      title: 'Failed to update profile', 
      description: err.data?.message || 'Please try again',
      color: 'error' 
    })
  } finally {
    saving.value = false
  }
}
</script>
