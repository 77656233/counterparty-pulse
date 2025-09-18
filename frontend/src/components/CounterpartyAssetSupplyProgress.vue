<template>
  <div class="card bg-base-200 shadow-sm mb-4 compact-tile">
    <div class="card-body py-2 px-3">
      <div class="w-full flex flex-col gap-1">
        <div v-for="row in rows" :key="row.key" class="flex items-center gap-2">
          <div class="h-3 rounded bg-base-100 overflow-hidden flex-1">
            <div :class="row.bg" class="h-full" :style="{ width: row.width + '%' }"></div>
          </div>
            <div class="flex justify-between w-[14rem] text-[10px]">
              <span class="font-medium">{{ row.label }}</span>
              <span>{{ row.display }}</span>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatAssetQuantity } from '../utils/addressBurns.js';

const props = defineProps({
  issuancesCount: Number, // from stats.issuancesCount
  burns: Number,
  addressBurns: Number,
  supply: Number,
  availableSupply: Number,
  divisible: Boolean
});

// 100% reference = issuances amount = supply + burns (address burns are NOT part of issuances)
const issuancesAmount = computed(() => (Number(props.supply)||0) + (Number(props.burns)||0));
const baseAmount = computed(() => issuancesAmount.value > 0 ? issuancesAmount.value : 1);

function widthAmount(v){
  const n = Number(v)||0;
  if (n <= 0) return 0;
  return Math.max(2, (n / baseAmount.value) * 100); // min 2% visible when > 0
}

const formatted = computed(() => ({
  issuances: formatAssetQuantity(issuancesAmount.value, props.divisible),
  burns: formatAssetQuantity(props.burns, props.divisible),
  addressBurns: formatAssetQuantity(props.addressBurns, props.divisible),
  supply: formatAssetQuantity(props.supply, props.divisible),
  availableSupply: formatAssetQuantity(props.availableSupply, props.divisible)
}));

const rows = computed(() => [
  // Order: Issuances, Burns, Supply, Address Burns, Available Supply
  { key: 'issuances', label: 'Issuances', display: formatted.value.issuances, width: issuancesAmount.value > 0 ? 100 : 0, bg: 'bg-gray-400' },
  { key: 'burns', label: 'Burns', display: formatted.value.burns, width: widthAmount(props.burns), bg: 'bg-red-500' },
  { key: 'supply', label: 'Supply', display: formatted.value.supply, width: widthAmount(props.supply), bg: 'bg-gray-400' },
  { key: 'addressBurns', label: 'Address Burns', display: formatted.value.addressBurns, width: widthAmount(props.addressBurns), bg: 'bg-red-500' },
  { key: 'availableSupply', label: 'Available Supply', display: formatted.value.availableSupply, width: widthAmount(props.availableSupply), bg: 'bg-green-500' }
]);
</script>

<style scoped>
.compact-tile :deep(.card-body){
  padding-top: 0.65rem !important;
  padding-bottom: 0.65rem !important;
}
</style>
