<template>
  <div v-if="show" class="modal modal-open">
    <div class="modal-box bg-base-100 flex flex-col items-center w-auto">
      <img :src="resolvedSrc" :alt="alt" class="max-w-lg h-auto rounded-xl shadow-2xl border-3 dark:border-gray-800 mx-auto" />
    </div>
    <div class="modal-backdrop" @click="$emit('close')"></div>
  </div>
  
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { resolveAssetImageUrl } from '../utils/resolveAssetImage.js';

const props = defineProps({
  show: Boolean,
  name: String,
  src: String,
  alt: String,
  zoom: Boolean
});

const resolvedSrc = ref(props.src || '');

watchEffect(async () => {
  if (props.src) {
    resolvedSrc.value = props.src;
    return;
  }
  if (props.name) {
    resolvedSrc.value = await resolveAssetImageUrl(props.name);
  }
});
</script>

<style scoped>
img {
  border: 3px solid #222;
  border-radius: 0.75rem;
}
</style>
