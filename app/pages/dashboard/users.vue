<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'dashboard'
})

// Fetch users with proper loading and error states
const { data, status, error, refresh } = await useFetch('/api/business/users')
const toast = useToast()

const users = computed(() => {
  return data.value?.list?.map(u => ({
    ...u,
    name: `${u.firstName} ${u.lastName}`
  })) || []
})

// Use simplified type or explicit correct one for UserRow
type UserRow = {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
  phone?: string
  lastLoginAt?: string | Date
  status?: string
  name: string
}

const formatDate = (date: string | Date | undefined) => {
  if (!date) return 'Never'
  return new Date(date).toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit' 
  })
}

const columns: TableColumn<any>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    meta: {
      class: {
        th: 'min-w-[150px]'
      }
    }
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'role',
    header: 'Role'
  },
  {
    accessorKey: 'lastLoginAt',
    header: 'Last Login'
  },
  {
    accessorKey: 'status',
    header: 'Status'
  },
  {
    accessorKey: 'actions',
    header: '',
    meta: {
      class: {
        th: 'w-12'
      }
    }
  }
]

// -- Add User --
const isAddUserOpen = ref(false)
const newUser = reactive({
  firstName: '',
  lastName: '',
  email: '',
  role: 'employee'
})

const addUser = async () => {
  try {
    await $fetch('/api/business/users', {
      method: 'POST',
      body: newUser
    })
    toast.add({ title: 'User invited', description: 'Invitation email sent', color: 'success' })
    isAddUserOpen.value = false
    // Reset form
    newUser.firstName = ''
    newUser.lastName = ''
    newUser.email = ''
    newUser.role = 'employee'
    refresh()
  } catch (e: any) {
    toast.add({ title: 'Error adding user', description: e.data?.message || e.message, color: 'error' })
  }
}

// -- Manage User --
const isEditOpen = ref(false)
const selectedUser = ref<any>(null)
const state = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  role: 'employee'
})

const editUser = (user: any) => {
  selectedUser.value = user
  state.firstName = user.firstName
  state.lastName = user.lastName
  state.phone = user.phone || ''
  state.role = user.role
  isEditOpen.value = true
}

const saveUser = async () => {
  try {
    await $fetch(`/api/business/users/${selectedUser.value.id}`, {
      method: 'PUT',
      body: state
    })
    toast.add({ title: 'User updated', color: 'success' })
    isEditOpen.value = false
    refresh() // Refresh list
  } catch (e: any) {
    toast.add({ title: 'Error updating user', description: e.data?.message || e.message, color: 'error' })
  }
}

const updateStatus = async (user: UserRow, newStatus: boolean) => {
  // Optimistic update
  const originalStatus = user.status
  user.status = newStatus ? 'active' : 'suspended'

  try {
    await $fetch(`/api/business/users/${user.id}`, {
      method: 'PUT',
      body: { 
        ...user, 
        role: user.role, // Ensure role is preserved
        status: newStatus ? 'active' : 'suspended' 
      }
    })
    toast.add({ title: 'Status updated', color: 'success' })
  } catch (e: any) {
    // Revert on failure
    user.status = originalStatus
    toast.add({ title: 'Error updating status', description: e.data?.message || e.message, color: 'error' })
  }
}

// -- Delete User --
const isDeleteOpen = ref(false)
const userToDelete = ref<any>(null)

const confirmDelete = (user: any) => {
  userToDelete.value = user
  isDeleteOpen.value = true
}

const deleteUser = async () => {
  try {
    await $fetch(`/api/business/users/${userToDelete.value.id}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'User deleted', color: 'success' })
    isDeleteOpen.value = false
    refresh()
  } catch (e: any) {
    toast.add({ title: 'Error deleting user', description: e.data?.message || e.message, color: 'error' })
  }
}

// -- Dropdown Items --
const getItems = (row: any) => [
  [
    {
      label: 'Edit',
      icon: 'i-heroicons-pencil-square-20-solid',
      onSelect: () => editUser(row.original)
    },
    {
      label: 'Delete',
      icon: 'i-heroicons-trash-20-solid',
      onSelect: () => confirmDelete(row.original),
      color: 'error' as const
    }
  ]
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Users">
        <template #right>
           <!-- Placeholder for Add User -->
           <!-- Add User Button -->
           <UButton label="Add User" icon="i-heroicons-plus-20-solid" @click="isAddUserOpen = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <!-- Error State -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-heroicons-exclamation-triangle"
      title="Failed to load users"
      :description="error.message"
      class="mb-4"
    >
      <template #footer>
         <UButton color="error" variant="outline" size="xs" @click="() => refresh()">Retry</UButton>
      </template>
    </UAlert>

    <!-- Table -->
    <UTable 
      :data="users" 
      :columns="columns" 
      class="flex-1"
      :loading="status === 'pending'"
    >
      <!-- Custom Name Column with Avatar -->
      <template #name-cell="{ row }">
        <div class="flex items-center gap-3">
           <UAvatar 
            :alt="row.original.firstName" 
            size="xs"
            class="bg-primary/10 text-primary"
          />
           <div class="flex flex-col">
              <span class="font-medium text-gray-900 dark:text-white">{{ row.getValue('name') }}</span>
           </div>
        </div>
      </template>

      <!-- Custom Role Column with Badge -->
      <template #role-cell="{ row }">
         <UBadge 
          :color="row.getValue('role') === 'business_owner' ? 'primary' : 'neutral'"
          variant="subtle"
          size="xs"
        >
          {{ row.getValue('role') === 'business_owner' ? 'Owner' : 'Employee' }}
        </UBadge>
      </template>

      <!-- Custom Last Login Column -->
      <template #lastLoginAt-cell="{ row }">
         <span class="text-sm text-gray-500 dark:text-gray-400">
           {{ formatDate(row.getValue('lastLoginAt')) }}
         </span>
      </template>

      <!-- Custom Status Column -->
      <template #status-cell="{ row }">
        <USwitch
          :model-value="row.original.status === 'active'"
          @update:model-value="(val) => updateStatus(row.original, val)"
          size="xs"
          :color="row.original.status === 'active' ? 'success' : 'neutral'"
          :label="row.original.status === 'active' ? 'Active' : 'Inactive'"
          :disabled="row.original.role === 'business_owner'"
        />
      </template>

      <!-- Actions -->
      <template #actions-cell="{ row }">
        <UDropdownMenu :items="getItems(row)">
           <UButton color="neutral" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
        </UDropdownMenu>
      </template>
    </UTable>

    <!-- Slideover for Add User -->
    <USlideover
      v-model:open="isAddUserOpen"
      title="Add New User"
      description="Invite a new member to your business."
    >
      <template #body>
        <UForm :state="newUser" class="space-y-4" @submit="addUser">
          <UFormField label="First Name" name="firstName" required>
            <UInput v-model="newUser.firstName" />
          </UFormField>
          <UFormField label="Last Name" name="lastName" required>
             <UInput v-model="newUser.lastName" />
          </UFormField>
          <UFormField label="Email" name="email" required>
             <UInput v-model="newUser.email" type="email" />
          </UFormField>
           <UFormField label="Role" name="role" required>
             <USelect v-model="newUser.role" :items="['business_owner', 'employee']" />
          </UFormField>
        </UForm>
      </template>
      <template #footer>
        <UButton label="Cancel" color="neutral" variant="ghost" @click="isAddUserOpen = false" />
        <UButton label="Send Invitation" color="primary" @click="addUser" />
      </template>
    </USlideover>

    <!-- Slideover for Edit -->
    <USlideover
      v-model:open="isEditOpen"
      title="Edit User"
      description="Update user details and role."
    >
      <template #body>
        <UForm :state="state" class="space-y-4" @submit="saveUser">
          <UFormField label="First Name" name="firstName">
            <UInput v-model="state.firstName" />
          </UFormField>
          <UFormField label="Last Name" name="lastName">
             <UInput v-model="state.lastName" />
          </UFormField>
          <UFormField label="Email">
             <UInput :model-value="selectedUser?.email" disabled class="bg-gray-50 dark:bg-gray-800" />
          </UFormField>
          <UFormField label="Phone" name="phone">
             <UInput v-model="state.phone" />
          </UFormField>
           <UFormField label="Role" name="role">
             <USelect v-model="state.role" :items="['business_owner', 'employee']" />
          </UFormField>
        </UForm>
      </template>
      <template #footer>
        <UButton label="Cancel" color="neutral" variant="ghost" @click="isEditOpen = false" />
        <UButton label="Save Changes" color="primary" @click="saveUser" />
      </template>
    </USlideover>

    <!-- Modal for Delete -->
    <UModal
      v-model:open="isDeleteOpen"
      title="Delete User"
      description="Are you sure you want to delete this user? This action cannot be undone."
    >
      <template #footer>
        <UButton label="Cancel" color="neutral" variant="ghost" @click="isDeleteOpen = false" />
        <UButton label="Delete" color="error" @click="deleteUser" />
      </template>
    </UModal>
  </UDashboardPanel>
</template>
