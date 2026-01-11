<template>
  <div 
    class="flex flex-col flex-1 min-w-0 overflow-hidden relative"
    :class="{ 'flex-grow': grow }"
  >
    <div v-if="$slots.header" class="shrink-0">
      <slot name="header" />
    </div>

    <div v-if="$slots.default || $slots.body" class="flex-1 overflow-y-auto w-full">
         <div v-if="$slots.default" class="h-full">
            <slot />
         </div>
         <div v-else-if="$slots.body" class="p-4 sm:p-6 h-full">
            <slot name="body" />
         </div>
    </div>

    <div v-if="$slots.footer" class="shrink-0 border-t border-gray-200 bg-white">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  resizable: {
    type: Boolean,
    default: false
  },
  grow: {
    type: Boolean,
    default: true
  }
})
</script>
