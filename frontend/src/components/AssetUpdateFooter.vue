<template>
  <div class="w-full bg-base-100 rounded-b-lg text-center py-2">
    <span v-if="dates.local" class="block text-xs text-white/80 font-normal" style="font-size: 0.6rem;">
      Updated {{ dates.local }} ({{ dates.utc }})
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatLocalUtc } from '../utils/issuanceTime.js';

const props = defineProps({
  asset: { type: Object, required: true },
  activeTab: { type: String, required: true }, // 'classic' | 'counterparty'
});

const updatedAtMs = computed(() => {
  // Use only per-service timestamp; if absent, show nothing
  const svcField = props.activeTab === 'classic' ? 'updatedClassic' : 'updatedCounterparty';
  const ts = props.asset?.[svcField];
  try {
    if (ts && typeof ts.toMillis === 'function') return ts.toMillis();
  } catch {}
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') {
    const d = Date.parse(ts);
    return Number.isFinite(d) ? d : null;
  }
  return null;
});

const dates = computed(() => formatLocalUtc(updatedAtMs.value));
</script>

<style scoped>
</style>
