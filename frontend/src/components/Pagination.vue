<template>
  <div class="w-full flex items-center justify-center">
    <!-- Pagination controls centered -->
    <div class="join">
      <button
        class="join-item btn btn-sm border-0 no-animation focus:outline-none focus:ring-0 focus-visible:outline-none outline-none ring-0 bg-base-100 text-base-content hover:bg-base-200 transition-colors"
        :class="{ 'btn-disabled bg-base-300 text-base-content/50 hover:bg-base-300': currentPage === 1 }"
        :disabled="currentPage === 1"
  aria-label="First page"
        @click="goToPage(1)"
      >
        «
      </button>
      <button
        class="join-item btn btn-sm border-0 no-animation focus:outline-none focus:ring-0 focus-visible:outline-none outline-none ring-0 bg-base-100 text-base-content hover:bg-base-200 transition-colors"
        :class="{ 'btn-disabled bg-base-300 text-base-content/50 hover:bg-base-300': currentPage === 1 }"
        :disabled="currentPage === 1"
  aria-label="Previous page"
        @click="goToPage(currentPage - 1)"
      >
        ‹
      </button>

      <!-- Page numbers (windowed with ellipsis) -->
      <template v-for="(item, idx) in pageItems">
          <button
            v-if="typeof item === 'number'"
            :key="`p-${idx}`"
            class="join-item btn btn-sm border-0 no-animation focus:outline-none focus:ring-0 focus-visible:outline-none outline-none ring-0 bg-base-100 text-base-content hover:bg-base-200 transition-colors"
            :class="{ 'bg-green-500 text-white hover:bg-green-500 cursor-default': item === currentPage }"
            :aria-current="item === currentPage ? 'page' : undefined"
            @click="goToPage(item)"
          >
          {{ item }}
        </button>
        <button v-else :key="`e-${idx}`" class="join-item btn btn-sm btn-disabled border-0 no-animation bg-base-300 text-base-content/50" tabindex="-1">…</button>
      </template>

      <button
        class="join-item btn btn-sm border-0 no-animation focus:outline-none focus:ring-0 focus-visible:outline-none outline-none ring-0 bg-base-100 text-base-content hover:bg-base-200 transition-colors"
        :class="{ 'btn-disabled bg-base-300 text-base-content/50 hover:bg-base-300': currentPage === totalPages || totalPages === 0 }"
        :disabled="currentPage === totalPages || totalPages === 0"
  aria-label="Next page"
        @click="goToPage(currentPage + 1)"
      >
        ›
      </button>
      <button
        class="join-item btn btn-sm border-0 no-animation focus:outline-none focus:ring-0 focus-visible:outline-none outline-none ring-0 bg-base-100 text-base-content hover:bg-base-200 transition-colors"
        :class="{ 'btn-disabled bg-base-300 text-base-content/50 hover:bg-base-300': currentPage === totalPages || totalPages === 0 }"
        :disabled="currentPage === totalPages || totalPages === 0"
  aria-label="Last page"
        @click="goToPage(totalPages)"
      >
        »
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  totalItems: { type: Number, required: true },
  pageSize: { type: Number, default: 30 },
  currentPage: { type: Number, required: true }
})

const emit = defineEmits(['update:currentPage'])

const totalPages = computed(() => {
  if (!props.pageSize) return 0
  return Math.max(0, Math.ceil(props.totalItems / props.pageSize))
})

const pageItems = computed(() => {
  const t = totalPages.value
  const c = props.currentPage
  if (t === 0) return []
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1)

  const items = []
  items.push(1)
  if (c > 4) items.push('ellipsis-start')

  const start = Math.max(2, c - 1)
  const end = Math.min(t - 1, c + 1)
  for (let p = start; p <= end; p++) items.push(p)

  if (c < t - 3) items.push('ellipsis-end')
  items.push(t)
  return items
})

function goToPage(p) {
  const t = totalPages.value
  if (t === 0) return
  const clamped = Math.min(Math.max(1, p), t)
  if (clamped !== props.currentPage) emit('update:currentPage', clamped)
}
</script>
