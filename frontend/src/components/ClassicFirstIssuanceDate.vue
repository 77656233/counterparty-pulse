<template>
  <span v-if="dateLocal && dateUTC">
    {{ dateLocal }} ({{ dateUTC }})
  </span>
</template>

<script setup>
const props = defineProps({ asset: Object });
let ts = null;
const arr = props.asset?.data?.classic?.issuances || [];
if (arr.length) {
  const first = arr.reduce((min, curr) => (!min || curr.timestamp < min.timestamp) ? curr : min, null);
  if (first?.timestamp) ts = first.timestamp * 1000;
}
const dateLocal = ts ? new Date(ts).toLocaleString() : null;
const dateUTC = ts ? new Date(ts).toISOString() : null;
</script>
