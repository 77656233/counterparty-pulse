<template>
  <img
    :src="resolvedSrc"
    :alt="alt"
    loading="lazy"
    class="max-w-xs h-40 object-contain mx-auto transition-transform duration-300 group-hover:scale-105 group-hover:brightness-110 cursor-pointer shine-img border-3 dark:border-gray-800 rounded-xl mt-2"
    @click="onClick"
  />
  
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { resolveAssetImageUrl } from '../utils/resolveAssetImage.js';

const props = defineProps({
  // Either pass name (preferred) or direct src. If both given, src wins.
  name: String,
  src: String,
  alt: String,
  onClick: Function
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
