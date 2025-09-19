<template>
  <span v-if="dateLocal && dateUTC">
    {{ dateLocal }} ({{ dateUTC }})
  </span>
</template>

<script setup>
const props = defineProps({ asset: Object });
let ts = null;
if (props.asset?.data?.counterparty?.info?.first_issuance_block_time) {
  ts = props.asset.data.counterparty.info.first_issuance_block_time * 1000;
}
const dateLocal = ts ? new Date(ts).toLocaleString() : null;
const dateUTC = ts ? new Date(ts).toISOString() : null;
</script>
