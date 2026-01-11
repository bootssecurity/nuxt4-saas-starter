<template>
  <header class="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-gray-200 bg-white shrink-0 gap-4">
    <div class="flex items-center gap-4 min-w-0">
       <!-- Toggle Logic for Mobile -->
        <UButton
            v-if="true" 
            icon="i-heroicons-bars-3"
            color="gray"
            variant="ghost"
            class="md:hidden"
            @click="toggleSidebar"
        />
        
        <div class="flex items-center gap-2 font-semibold text-gray-900 truncate">
            <UIcon v-if="icon" :name="icon" class="w-5 h-5" />
            <span v-if="title">{{ title }}</span>
        </div>

        <slot name="left" />
        <slot name="leading" />
    </div>

    <div class="flex items-center gap-2">
       <slot />
       <slot name="right" />
       <slot name="trailing" />
    </div>
  </header>
</template>

<script setup lang="ts">
const props = defineProps({
  title: String,
  icon: String,
  toggle: {
      type: Boolean,
      default: true
  }
})

const sidebarState = useState('dashboard-sidebar-open', () => false)

function toggleSidebar() {
    sidebarState.value = !sidebarState.value
}
</script>
