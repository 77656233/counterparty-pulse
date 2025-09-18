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
  issuancesCount: [Number, String], // from stats.issuancesCount (can be string from Firestore)
  burns: [Number, String],
  addressBurns: [Number, String], 
  supply: [Number, String],
  availableSupply: [Number, String],
  divisible: Boolean
});

// Convert string props to numbers for calculations
const issuancesCountNum = computed(() => Number(props.issuancesCount) || 0);
const burnsNum = computed(() => Number(props.burns) || 0);
const addressBurnsNum = computed(() => Number(props.addressBurns) || 0);
const supplyNum = computed(() => Number(props.supply) || 0);
const availableSupplyNum = computed(() => Number(props.availableSupply) || 0);

// 100% reference = issuances amount = supply + burns (address burns are NOT part of issuances)
const issuancesAmount = computed(() => supplyNum.value + burnsNum.value);
const baseAmount = computed(() => issuancesAmount.value > 0 ? issuancesAmount.value : 1);

function widthAmount(v){
  const n = Number(v)||0;
  if (n <= 0) return 0;
  return Math.max(2, (n / baseAmount.value) * 100); // min 2% visible when > 0
}

const formatted = computed(() => ({
  issuances: formatAssetQuantity(issuancesAmount.value, props.divisible),
  burns: formatAssetQuantity(burnsNum.value, props.divisible),
  addressBurns: formatAssetQuantity(addressBurnsNum.value, props.divisible),
  supply: formatAssetQuantity(supplyNum.value, props.divisible),
  availableSupply: formatAssetQuantity(availableSupplyNum.value, props.divisible)
}));

const rows = computed(() => [
  // Order: Issuances, Burns, Supply, Address Burns, Available Supply
  { key: 'issuances', label: 'Issuances', display: formatted.value.issuances, width: issuancesAmount.value > 0 ? 100 : 0, bg: 'bg-gray-400' },
  { key: 'burns', label: 'Burns', display: formatted.value.burns, width: widthAmount(burnsNum.value), bg: 'bg-red-500' },
  { key: 'supply', label: 'Supply', display: formatted.value.supply, width: widthAmount(supplyNum.value), bg: 'bg-gray-400' },
  { key: 'addressBurns', label: 'Address Burns', display: formatted.value.addressBurns, width: widthAmount(addressBurnsNum.value), bg: 'bg-red-500' },
  { key: 'availableSupply', label: 'Available Supply', display: formatted.value.availableSupply, width: widthAmount(availableSupplyNum.value), bg: 'bg-green-500' }
]);
</script>

<style scoped>
.compact-tile :deep(.card-body){
  padding-top: 0.65rem !important;
  padding-bottom: 0.65rem !important;
}
</style>
