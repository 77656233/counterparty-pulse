<template>
  <div class="overflow-x-auto" style="max-height: 260px; min-height: 80px;">
    <table class="table table-zebra w-full text-[11px]">
      <tbody>
        <tr>
          <td class="w-28 text-base-content/70">Issuer</td>
          <td class="font-mono break-all">{{ issuer || '-' }}</td>
        </tr>
        <tr>
          <td class="w-28 text-base-content/70">Owner</td>
          <td class="font-mono break-all">{{ owner || '-' }}</td>
        </tr>
        <tr v-if="info">
          <td class="w-28 text-base-content/70">Info</td>
          <td class="break-words whitespace-pre-wrap">{{ info }}</td>
        </tr>
        <tr v-if="special">
          <td class="w-28 text-base-content/70">Special</td>
          <td class="break-words whitespace-pre-wrap">{{ special }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
// Props: data object per chain
const props = defineProps({
  issuer: { type: String, default: '' },
  owner: { type: String, default: '' },
  info: { type: String, default: '' },
  special: { type: String, default: '' },
});
const { issuer, owner, info, special } = props;
</script>

<style scoped>
/* Ensure long strings (addresses, URLs) wrap inside table cells */
.table :where(tbody tr td){
  white-space: normal; /* override DaisyUI nowrap defaults */
  overflow-wrap: anywhere;
  word-break: break-word;
}
</style>
