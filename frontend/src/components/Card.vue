<template>
  <div>
  <AssetImageModal :show="showModal" :name="asset.name" :alt="asset.name" @close="showModal = false" :zoom="true" />
  <div class="card bg-base-100 shadow-xl text-base-content group p-0 rounded-b-none">
      <div class="flex flex-col items-center">
        <div class="w-full flex flex-col items-center justify-center mb-2 bg-base-300 rounded-t-lg">
          <span class="block shadow text-1xl font-bold text-white tracking-wide px-6 pt-3 pb-1">
            {{ asset.name }}
          </span>
          <span v-if="issuanceDates.local" class="block text-xs text-white/80 font-normal pb-3 text-center px-2" style="font-size: 0.7rem; line-height: 1.2;">
            <span class="block sm:inline">{{ issuanceDates.local }}</span>
            <span class="block sm:inline sm:ml-1">({{ issuanceDates.utc }})</span>
          </span>
        </div>
  <AssetImage :name="asset.name" :alt="asset.name" @click="showModal = true" />
      </div>
  <div class="card-body p-4 rounded-b-none">
        <div>
          <div v-if="hasCounterparty || hasClassic" class="w-full flex justify-center mb-4">
            <div class="tabs tabs-box w-full flex justify-center px-1">
              <button v-if="hasCounterparty"
                :class="['tab', hasClassic ? 'w-1/2' : 'w-full', activeTab === 'counterparty' ? 'tab-active bg-primary text-white font-bold' : 'bg-base-200 text-base-content']"
                @click="activeTab = 'counterparty'"
              >Counterparty</button>
              <button v-if="hasClassic"
                :class="['tab', hasCounterparty ? 'w-1/2' : 'w-full', activeTab === 'classic' ? 'tab-active bg-primary text-white font-bold' : 'bg-base-200 text-base-content']"
                @click="activeTab = 'classic'"
              >Classic</button>
            </div>
          </div>
          <div v-if="activeTab === 'counterparty' && hasCounterparty">
            <CounterpartyAssetMeta
              v-if="asset.data.counterparty?.info"
              :issuer="asset.data.counterparty?.info?.issuer"
              :divisible="counterpartyStats(asset).divisible"
              :locked="!!counterpartyStats(asset).locked"
            />
            <CounterpartyAssetSupplyProgress
              v-if="asset.data.counterparty?.info"
              :issuancesCount="counterpartyStats(asset).issuancesCount"
              :supply="Number(asset.data.counterparty?.info?.supply) || 0"
              :burns="Number(counterpartyStats(asset).burns) || 0"
              :addressBurns="counterpartyAddressBurns"
              :availableSupply="counterpartyAvailableSupply"
              :divisible="counterpartyStats(asset).divisible"
            />
            <div class="collapse collapse-arrow bg-base-200 mt-2">
              <input type="checkbox" />
              <div class="collapse-title text-sm font-semibold flex items-center min-h-[3.5rem]">Asset details</div>
              <div class="collapse-content">
                <AssetDetailsTable
                  :issuer="asset.data.counterparty?.info?.issuer"
                  :owner="asset.data.counterparty?.info?.owner"
                  :info="asset.data.counterparty?.info?.description"
                  :special="asset.special"
                />
              </div>
            </div>
            <div class="collapse collapse-arrow holders-collapse bg-base-200 mt-4">
              <input type="checkbox" />
              <div class="collapse-title text-sm font-semibold flex items-center min-h-[3.5rem]">Holders ({{ (asset.data.counterparty?.holders || []).length || 0 }})</div>
              <div class="collapse-content">
                <CounterpartyHoldersTable :holders="asset.data.counterparty?.holders" :divisible="counterpartyStats(asset).divisible" :showTitle="false" />
              </div>
            </div>
          </div>
          <div v-else-if="activeTab === 'classic' && hasClassic">
            <ClassicAssetMeta
              v-if="asset.data.classic?.info"
              :issuer="asset.data.classic?.info?.issuer"
              :divisible="classicStats(asset).divisible"
              :locked="!!classicStats(asset).locked"
              :firstIssuanceTime="null"
            />
            <ClassicAssetSupplyProgress
              v-if="asset.data.classic?.info"
              :issuancesCount="classicStats(asset).issuancesCount"
              :supply="Number(asset.data.classic?.info?.supply) || 0"
              :burns="Number(classicStats(asset).burns) || 0"
              :addressBurns="classicAddressBurns"
              :availableSupply="classicAvailableSupply"
              :divisible="classicStats(asset).divisible"
            />
            <div class="collapse collapse-arrow bg-base-200 mt-2">
              <input type="checkbox" />
              <div class="collapse-title text-sm font-semibold flex items-center min-h-[3.5rem]">Asset details</div>
              <div class="collapse-content">
                <AssetDetailsTable
                  :issuer="asset.data.classic?.info?.issuer"
                  :owner="asset.data.classic?.info?.owner"
                  :info="asset.data.classic?.info?.description"
                  :special="asset.special"
                />
              </div>
            </div>
            <div class="collapse collapse-arrow holders-collapse bg-base-200 mt-4">
              <input type="checkbox" />
              <div class="collapse-title text-sm font-semibold flex items-center min-h-[3.5rem]">Holders ({{ (asset.data.classic?.holders?.data || []).length || 0 }})</div>
              <div class="collapse-content">
                <ClassicHoldersTable :holders="asset.data.classic?.holders?.data" :divisible="classicStats(asset).divisible" :showTitle="false" />
              </div>
            </div>
          </div>
          <div v-else class="text-center text-sm text-base-content/60 mt-2">
            No data available
          </div>
        </div>
      </div>
    </div>
    <AssetUpdateFooter :asset="asset" :activeTab="activeTab" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { calcAddressBurns } from '../utils/addressBurns.js';
import { getClassicStats, getCounterpartyStats } from "../utils/assetIssuances.js";
import { formatIssuanceDates, getFirstIssuanceTimestamp } from '../utils/issuanceTime.js';
import AssetImage from './AssetImage.vue';
import AssetImageModal from './AssetImageModal.vue';
// Legacy ClassicAssetInfo import removed (replaced by ClassicAssetMeta)
import ClassicAssetSupplyProgress from './ClassicAssetSupplyProgress.vue';
import ClassicHoldersTable from './ClassicHoldersTable.vue';
// Legacy CounterpartyAssetInfo import removed (replaced by CounterpartyAssetMeta)
import AssetDetailsTable from './AssetDetailsTable.vue';
import AssetUpdateFooter from './AssetUpdateFooter.vue';
import ClassicAssetMeta from './ClassicAssetMeta.vue';
import CounterpartyAssetMeta from './CounterpartyAssetMeta.vue';
import CounterpartyAssetSupplyProgress from './CounterpartyAssetSupplyProgress.vue';
import CounterpartyHoldersTable from './CounterpartyHoldersTable.vue';

const props = defineProps({ asset: Object });
const hasCounterparty = computed(() => !!props.asset?.data?.counterparty);
const hasClassic = computed(() => !!props.asset?.data?.classic);
const activeTab = ref(hasCounterparty.value ? 'counterparty' : (hasClassic.value ? 'classic' : 'counterparty'));
const showModal = ref(false);

const counterpartyRaw = computed(() => props.asset.data.counterparty || {});
const classicRaw = computed(() => props.asset.data.classic || {});
const counterpartyStatsData = computed(() => getCounterpartyStats({
  ...(counterpartyRaw.value.info || {}),
  issuances: counterpartyRaw.value.issuances || []
}));
const classicStatsData = computed(() => getClassicStats({
  ...(classicRaw.value.info || {}),
  issuances: classicRaw.value.issuances || []
}));

// Address burns calculation similar to AssetInfo
const counterpartyAddressBurns = computed(() => calcAddressBurns(counterpartyRaw.value.holders || [], { divisible: counterpartyStatsData.value.divisible }));
const classicAddressBurns = computed(() => calcAddressBurns(classicRaw.value.holders?.data || [], { divisible: classicStatsData.value.divisible }));

// Supply is already (issued - burns); Available = supply - addressBurns
const counterpartyAvailableSupply = computed(() => (Number(counterpartyRaw.value.supply)||0) - counterpartyAddressBurns.value);
const classicAvailableSupply = computed(() => (Number(classicRaw.value.supply)||0) - classicAddressBurns.value);

const issuanceTs = computed(() => getFirstIssuanceTimestamp(props.asset, activeTab.value));
const issuanceDates = computed(() => formatIssuanceDates(issuanceTs.value));

// When available chains change (e.g., after data loading), adjust active tab
watch([hasCounterparty, hasClassic], () => {
  if (hasCounterparty.value && activeTab.value !== 'counterparty' && !hasClassic.value) {
    activeTab.value = 'counterparty';
  } else if (hasClassic.value && activeTab.value !== 'classic' && !hasCounterparty.value) {
    activeTab.value = 'classic';
  }
});

function counterpartyStats(asset){ return counterpartyStatsData.value; }
function classicStats(asset){ return classicStatsData.value; }
</script>

<style scoped>
.card { padding: 0 !important; }
.shine-img { position: relative; }
.shine-img::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); opacity: 0; transition: opacity 0.3s; }
.group:hover .shine-img::after { opacity: 0.8; animation: shine 1s linear; }
@keyframes shine { 0% { opacity: 0; left: -100%; } 50% { opacity: 1; left: 50%; } 100% { opacity: 0; left: 100%; } }
.group:hover .shine-img { filter: brightness(1.1) drop-shadow(0 0 10px #fff5); transform: scale(1.02) rotate(-2deg); transition: all 0.1s cubic-bezier(.4,2,.3,1); }
.shine-img { border: 3px solid #222; border-radius: 0.75rem; }
.holders-collapse :global(.collapse-title) {
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
}
.holders-collapse :global(.collapse-title:after) {
  /* DaisyUI arrow is an ::after pseudo-element; nudge it upward */
  transform: translateY(-2px) rotate(var(--tw-rotate));
}
/* Tighten table cell paddings inside collapses */
:global(.collapse .table :where(thead tr th, tbody tr td)){
  padding-top: 0.35rem;
  padding-bottom: 0.35rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
</style>
