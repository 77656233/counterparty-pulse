
<template>
  <div v-if="holders && holders.length">
    <div class="overflow-x-auto" style="max-height: 260px; min-height: 80px;">
      <table class="table table-zebra w-full text-[11px]">
        <tbody>
          <tr v-for="holder in sortedHolders" :key="holder.address">
            <td class="font-mono break-all">{{ holder.address }}</td>
            <td>{{ formatQuantity(holder._quantity) }}</td>
            <td>{{ holder._percentage }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { prepareHolders } from '../utils/holders.js';
import { formatQuantity as fmt } from '../utils/numberFormat.js';

const props = defineProps({ holders: Array, divisible: Boolean, showTitle: { type: Boolean, default: true } });

const sortedHolders = computed(() => prepareHolders(props.holders, { divisible: props.divisible, fromAtomic: true }));
function formatQuantity(q){ return fmt(q, { divisible: props.divisible, decimals: 8, trim: false }); }
</script>

<style scoped>
/* Wrap long addresses and values to avoid horizontal overflow */
.table :where(tbody tr td){
  white-space: normal; /* override DaisyUI nowrap defaults */
  overflow-wrap: anywhere;
  word-break: break-word;
}
/* Do NOT wrap quantity (2nd col) and percent (3rd col) */
.table :where(tbody tr td:nth-child(2)),
.table :where(tbody tr td:nth-child(3)){
  white-space: nowrap;
  overflow-wrap: normal;
  word-break: normal;
}
</style>
