<template>
  <aside class="w-80 max-w-full bg-base-300 p-4 text-base-content flex-shrink-0 h-full space-y-4">
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
  </aside>
</template>

<script setup>
const props = defineProps({
  projects: { type: Array, required: true }, // [{ name, count }]
  selectedProject: { type: String, required: true },
  sortOrder: { type: String, required: true },
  searchQuery: { type: String, required: true },
  requireDivisible: { type: Boolean, required: true },
  requireLocked: { type: Boolean, required: true },
  requireSpecial: { type: Boolean, required: true },
  hasSpecial: { type: Boolean, required: false, default: false },
});

const emit = defineEmits(['update:selectedProject', 'update:sortOrder', 'update:searchQuery', 'update:requireDivisible', 'update:requireLocked', 'update:requireSpecial']);

function onProjectChange(e) {
  emit('update:selectedProject', e.target.value);
}
</script>
