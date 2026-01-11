<template>
  <!-- Desktop Sidebar -->
  <div 
    class="hidden md:flex flex-col w-64 border-r border-gray-200 bg-white h-full relative shrink-0 transition-all duration-300"
    :class="{ 'w-16': collapsed }"
  >
    <!-- Header -->
    <div v-if="$slots.header" class="h-16 flex items-center px-4 border-b border-gray-200 shrink-0">
      <slot name="header" :collapsed="collapsed" />
    </div>

    <!-- Main Content -->
     <div class="flex-1 overflow-y-auto p-4 gap-2 flex flex-col">
        <slot :collapsed="collapsed" />
     </div>

     <!-- Footer -->
     <div v-if="$slots.footer" class="p-4 border-t border-gray-200 shrink-0">
        <slot name="footer" :collapsed="collapsed" />
     </div>
  </div>

  <!-- Mobile Sidebar (Slideover) -->
  <USlideover v-model="isOpen" side="left" class="md:hidden">
    <div class="flex flex-col h-full bg-white">
        <!-- Header -->
        <div v-if="$slots.header" class="h-16 flex items-center px-4 border-b border-gray-200 shrink-0">
            <slot name="header" :collapsed="false" />
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" class="ml-auto" @click="isOpen = false" />
        </div>
        <div v-else class="h-16 flex items-center justify-end px-4 border-b border-gray-200 shrink-0">
             <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" @click="isOpen = false" />
        </div>

        <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            <slot :collapsed="false" />
        </div>

        <div v-if="$slots.footer" class="p-4 border-t border-gray-200 shrink-0">
            <slot name="footer" :collapsed="false" />
        </div>
    </div>
  </USlideover>
</template>

<script setup lang="ts">
const props = defineProps({
    collapsible: Boolean,
    width: {
        type: Number,
        default: 250 // Not used yet but compatible with API
    }
})

const collapsed = ref(false)
const isOpen = useState('dashboard-sidebar-open', () => false)

// Listen to close requests?
</script>
