<template>
  <div>
    <!-- FAQ Modal direkt hier -->
    <FaqModal :show="showFaqModal" @close="showFaqModal = false" />
    
    <aside class="w-80 max-w-full bg-base-300 p-4 text-base-content flex-shrink-0 h-full flex flex-col" style="width: 100%;">
      <!-- Main content area -->
    <div class="space-y-4 flex-1">
      <!-- Search by asset name -->
      <div class="form-control w-full">
        <label class="label pb-1">
          <span class="label-text text-sm">Search asset</span>
        </label>
        <input
          type="text"
          :value="searchQuery"
          placeholder="Type asset name..."
          class="input input-sm w-full border-none ring-0 focus:outline-none focus:ring-0 focus:border-transparent active:border-transparent"
          @input="e => emit('update:searchQuery', e.target.value)"
        />
      </div>

      <!-- Project -->
      <div class="form-control w-full">
        <label class="label pb-1">
          <span class="label-text text-sm">Project</span>
        </label>
        <select class="select select-sm w-full border-none ring-0 focus:outline-none focus:ring-0 focus:border-transparent active:border-transparent" :value="selectedProject" @change="onProjectChange">
          <option v-for="p in projects" :key="p.name" :value="p.name">{{ p.name }} ({{ p.count }})</option>
        </select>
      </div>

      <!-- Sort -->
      <div class="form-control w-full">
        <label class="label pb-1">
          <span class="label-text text-sm">Sort</span>
        </label>
        <select class="select select-sm w-full border-none ring-0 focus:outline-none focus:ring-0 focus:border-transparent active:border-transparent" :value="sortOrder" @change="e => emit('update:sortOrder', e.target.value)">
          <option value="dateAsc">Date: oldest first</option>
          <option value="dateDesc">Date: newest first</option>
          <option value="supplyAsc">Supply: ascending</option>
          <option value="supplyDesc">Supply: descending</option>
          <option value="availableSupplyAsc">Available supply: ascending</option>
          <option value="availableSupplyDesc">Available supply: descending</option>
          <option value="holdersAsc">Holders: ascending</option>
          <option value="holdersDesc">Holders: descending</option>
        </select>
      </div>

      <!-- Toggles stacked in a single container -->
      <div class="flex w-full space-y-2 gap-2 flex-col">
        <label class="label gap-2 cursor-pointer">
          <input type="checkbox" class="toggle toggle-sm" :checked="requireDivisible" @change="e => emit('update:requireDivisible', !!e.target.checked)" />
          <span class="label-text text-sm">Divisible</span>
        </label>
        <label class="label gap-2 cursor-pointer">
          <input type="checkbox" class="toggle toggle-sm" :checked="requireLocked" @change="e => emit('update:requireLocked', !!e.target.checked)" />
          <span class="label-text text-sm">Locked</span>
        </label>
        <label v-if="hasSpecial" class="label gap-2 cursor-pointer">
          <input type="checkbox" class="toggle toggle-sm" :checked="requireSpecial" @change="e => emit('update:requireSpecial', !!e.target.checked)" />
          <span class="label-text text-sm">Special</span>
        </label>
      </div>
    </div>
    
    <!-- Description -->
    <div class="mt-auto pt-2">
      <p class="text-xs text-base-content/60 text-center leading-relaxed mb-2 max-w-xs mx-auto">
        Track Counterparty assets on Classic and CP20. Monitor supply, holders, and marketplace offers.
      </p>
      
      <!-- FAQ Icon -->
      <div class="text-center mb-2">
        <button 
          @click="showFaqModal = true"
          class="btn btn-ghost btn-xs text-base-content/50 hover:text-base-content/80"
          style="border: none !important; outline: none !important; box-shadow: none !important; background: transparent !important;"
          title="Learn about card values"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" class="w-4 h-4">
            <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM320 240C302.3 240 288 254.3 288 272C288 285.3 277.3 296 264 296C250.7 296 240 285.3 240 272C240 227.8 275.8 192 320 192C364.2 192 400 227.8 400 272C400 319.2 364 339.2 344 346.5L344 350.3C344 363.6 333.3 374.3 320 374.3C306.7 374.3 296 363.6 296 350.3L296 342.2C296 321.7 310.8 307 326.1 302C332.5 299.9 339.3 296.5 344.3 291.7C348.6 287.5 352 281.7 352 272.1C352 254.4 337.7 240.1 320 240.1zM288 432C288 414.3 302.3 400 320 400C337.7 400 352 414.3 352 432C352 449.7 337.7 464 320 464C302.3 464 288 449.7 288 432z"/>
          </svg>
          FAQ
        </button>
      </div>
    </div>
    
    <!-- Version and Status in one line -->
    <div class="pt-1">
      <div class="flex items-center justify-between px-1">
        <span class="text-xs text-base-content/50">v1.0.0</span>
        <div class="flex items-center space-x-2">
          <div 
            :class="[
              'w-2 h-2 rounded-full transition-colors duration-300',
              isConnected ? 'bg-green-400' : 'bg-red-400 animate-pulse'
            ]"
          ></div>
          <span 
            class="text-xs"
            :class="isConnected ? 'text-green-600' : 'text-red-500'"
          >
            {{ isConnected ? 'Online' : 'Offline' }}
          </span>
        </div>
      </div>
    </div>
  </aside>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import FaqModal from './FaqModal.vue';

const showFaqModal = ref(false);

const props = defineProps({
  projects: { type: Array, required: true }, // [{ name, count }]
  selectedProject: { type: String, required: true },
  sortOrder: { type: String, required: true },
  searchQuery: { type: String, required: true },
  requireDivisible: { type: Boolean, required: true },
  requireLocked: { type: Boolean, required: true },
  requireSpecial: { type: Boolean, required: true },
  hasSpecial: { type: Boolean, required: false, default: false },
  isConnected: { type: Boolean, required: false, default: true },
});

const emit = defineEmits(['update:selectedProject', 'update:sortOrder', 'update:searchQuery', 'update:requireDivisible', 'update:requireLocked', 'update:requireSpecial']);

function onProjectChange(e) {
  emit('update:selectedProject', e.target.value);
}
</script>
