<template>
  <div class="w-full space-y-4 mt-4 mb-4">   
    <div class="grid grid-cols-2 gap-1">
      <div class="card bg-base-200 shadow-sm" style="padding:0!important">
        <div class="card-body text-[11px] leading-tight" style="padding:0.8rem!important">
          <span class="inline-flex items-center gap-2 justify-center">
            <span :class="props.divisible ? 'bg-green-500' : 'bg-red-500'" class="inline-flex items-center justify-center w-6 h-6 rounded-full" aria-label="Divisible">
              <svg v-if="props.divisible" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 text-white">
                <path fill-rule="evenodd" d="M16.704 5.292a1 1 0 010 1.416l-7.5 7.5a1 1 0 01-1.416 0l-3-3a1 1 0 111.416-1.416L8.5 12.586l6.792-6.794a1 1 0 011.412 0z" clip-rule="evenodd"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 text-white">
                <path fill-rule="evenodd" d="M5.23 5.23a.75.75 0 011.06 0L10 8.94l3.71-3.71a.75.75 0 111.06 1.06L11.06 10l3.71 3.71a.75.75 0 11-1.06 1.06L10 11.06l-3.71 3.71a.75.75 0 11-1.06-1.06L8.94 10 5.23 6.29a.75.75 0 010-1.06z" clip-rule="evenodd"/>
              </svg>
            </span>
            <span class="font-semibold">Divisible</span>
          </span>
        </div>
      </div>
      <div class="card bg-base-200 shadow-sm" style="padding:0!important">
        <div class="card-body text-[11px] leading-tight" style="padding:0.8rem!important">
          <span class="inline-flex items-center gap-2 justify-center">
            <span :class="props.locked ? 'bg-green-500' : 'bg-red-500'" class="inline-flex items-center justify-center w-6 h-6 rounded-full" aria-label="Locked">
              <svg v-if="props.locked" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 text-white">
                <path fill-rule="evenodd" d="M16.704 5.292a1 1 0 010 1.416l-7.5 7.5a1 1 0 01-1.416 0l-3-3a1 1 0 111.416-1.416L8.5 12.586l6.792-6.794a1 1 0 011.412 0z" clip-rule="evenodd"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 text-white">
                <path fill-rule="evenodd" d="M5.23 5.23a.75.75 0 011.06 0L10 8.94l3.71-3.71a.75.75 0 111.06 1.06L11.06 10l3.71 3.71a.75.75 0 11-1.06 1.06L10 11.06l-3.71 3.71a.75.75 0 11-1.06-1.06L8.94 10 5.23 6.29a.75.75 0 010-1.06z" clip-rule="evenodd"/>
              </svg>
            </span>
            <span class="font-semibold">Locked</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ issuer: String, divisible: Boolean, locked: Boolean });
// Don't destructure props - use props.divisible directly in template
</script>

<style scoped>
</style>
