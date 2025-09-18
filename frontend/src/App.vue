<template>
  <div class="min-h-screen bg-base-200 flex flex-col overflow-hidden">
    <!-- Global top-of-window loading bar (only during initial full load) -->
    <div
      v-if="!initialLoaded"
      class="fixed top-0 left-0 right-0 h-1 z-50 bg-green-600/20"
      aria-label="Loading project items"
    >
      <div
        class="h-full bg-green-500 transition-all duration-300"
        :class="{ 'animate-pulse': !hasKnownTotal }"
        :style="{ width: progressBarWidth }"
      ></div>
    </div>
    <!-- Centered percent overlay while loading everything for the selected project -->
    <div v-if="!initialLoaded" class="fixed inset-0 z-40 flex items-center justify-center">
      <div class="px-4 py-2 rounded bg-base-100/80 text-base-content text-2xl font-semibold">
        {{ hasKnownTotal ? prefetchProgressPercent + '%' : 'Loading…' }}
      </div>
    </div>
    <!-- Full-width Sticky Top Bar with centered pagination; filter opener is fixed so it won't affect centering -->
  <div v-if="initialLoaded" class="sticky top-0 z-20 bg-base-300 px-4 border-b border-base-300 h-12 flex items-center">
      <!-- Fixed icon-only opener on tablet/mobile -->
      <button
        class="btn btn-sm btn-ghost lg:hidden fixed left-2 top-2 z-30 border-none ring-0 focus:ring-0 focus:outline-none active:outline-none"
        aria-label="Open filters"
        @click="sidebarOpen = true"
      >
        ☰
      </button>
      <div class="w-full flex justify-center">
        <Pagination
          :total-items="totalItemsForPagination"
          :page-size="pageSize"
          :current-page="currentPage"
          @update:currentPage="onPageChange"
        />
      </div>
    </div>
  <div v-if="initialLoaded" class="flex flex-1 min-h-0">
      <!-- Sidebar Desktop -->
      <div class="hidden lg:block">
        <FiltersSidebar
          class="flex-shrink-0 h-[calc(100vh-3rem)] overflow-auto"
          :projects="projects"
          :selected-project="selectedProject"
          :sort-order="sortOrder"
          :search-query="searchQuery"
          :require-divisible="requireDivisible"
          :require-locked="requireLocked"
          :require-special="requireSpecial"
          :has-special="hasSpecialInProject"
          @update:selectedProject="val => selectedProject = val"
          @update:sortOrder="val => sortOrder = val"
          @update:searchQuery="val => searchQuery = val"
          @update:requireDivisible="val => requireDivisible = val"
          @update:requireLocked="val => requireLocked = val"
          @update:requireSpecial="val => requireSpecial = val"
        />
      </div>
      <!-- Sidebar Overlay for tablet/mobile -->
      <div v-if="sidebarOpen" class="lg:hidden fixed inset-0 z-30">
        <div class="absolute inset-0 bg-black/50" @click="sidebarOpen = false"></div>
        <div class="absolute left-0 top-0 h-full w-full bg-base-300 shadow-xl p-0">
          <div class="p-3 border-b border-base-200 flex items-center justify-between">
            <span class="font-semibold">Filters</span>
            <button class="btn btn-xs btn-ghost border-none ring-0 focus:ring-0 focus:outline-none active:outline-none" @click="sidebarOpen = false">✕</button>
          </div>
          <div class="h-[calc(100%-44px)] overflow-auto p-4">
            <FiltersSidebar
              :projects="projects"
              :selected-project="selectedProject"
              :sort-order="sortOrder"
              :search-query="searchQuery"
              :require-divisible="requireDivisible"
              :require-locked="requireLocked"
              :require-special="requireSpecial"
              :has-special="hasSpecialInProject"
              @update:selectedProject="val => selectedProject = val"
              @update:sortOrder="val => sortOrder = val"
              @update:searchQuery="val => searchQuery = val"
              @update:requireDivisible="val => requireDivisible = val"
              @update:requireLocked="val => requireLocked = val"
              @update:requireSpecial="val => requireSpecial = val"
            />
          </div>
        </div>
      </div>
      <!-- Content -->
      <main class="flex-1 bg-base-200 p-0 overflow-y-auto h-[calc(100vh-3rem)]">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 py-4">
          <Card v-for="asset in pagedAssets" :key="asset.name" :asset="asset" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import Card from "./components/Card.vue";
import FiltersSidebar from "./components/FiltersSidebar.vue";
import Pagination from "./components/Pagination.vue";

import { collection, documentId, getCountFromServer, getDocs, orderBy, limit as qlimit, query, startAfter, where } from "firebase/firestore";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { db } from "./firebase";
import { getFirstIssuanceTimestamp } from "./utils/issuanceTime.js";

const assets = ref([]); // incrementally loaded docs
const loading = ref(false);
const hasMore = ref(true);
let _lastDoc = null;
// Text search within the selected project (client-side)
const searchQuery = ref("");
// Track whether server-side where(project)==... with orderBy(name) is supported; fall back if index missing
const serverFilterSupported = ref(true);
// Fast total count for selected project (server-side aggregate)
const projectTotalCount = ref(null);
// Server-aggregate counts per project (fast count endpoint)
const projectCounts = ref({});
// Initial, full load finished for current project
const initialLoaded = ref(false);
// Responsive page size: mobile 15, tablet 20, desktop 18
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280);
function onResize(){
  try { viewportWidth.value = window.innerWidth; } catch {}
}
onMounted(() => { try { window.addEventListener('resize', onResize); } catch {} });
onUnmounted(() => { try { window.removeEventListener('resize', onResize); } catch {} });
const pageSize = computed(() => {
  const w = viewportWidth.value;
  if (w < 768) return 15; // mobile
  if (w < 1024) return 20; // tablet
  return 18; // desktop
});
const currentPage = ref(1);
// Selected project: default 'Spells of Genesis', can be overridden by URL ?project=
const selectedProject = ref("Spells of Genesis");
const sortOrder = ref("dateAsc"); // default: date oldest first
const requireDivisible = ref(false); // toggle: only show divisible when true
const requireLocked = ref(false); // toggle: only show locked when true
const requireSpecial = ref(false); // toggle: only show items with special text when true
const sidebarOpen = ref(false);

// Project list with counts (fallback to 'Spells of Genesis' if missing)
const KNOWN_PROJECTS = ['Spells of Genesis', 'TEST'];
const projects = computed(() => {
  // Collect candidate names from known list, selected, and loaded assets
  const names = new Set(KNOWN_PROJECTS);
  names.add(selectedProject.value);
  for (const a of assets.value) names.add(a.project || 'Spells of Genesis');
  // Build array with counts: prefer server aggregate from projectCounts, fallback to local loaded count
  const arr = Array.from(names).map((name) => {
    const serverCount = projectCounts.value?.[name];
    if (typeof serverCount === 'number') return { name, count: serverCount };
    const localCount = assets.value.reduce((acc, a) => acc + (((a.project || 'Spells of Genesis') === name) ? 1 : 0), 0);
    return { name, count: localCount };
  });
  // Ensure selected project's count is exact if projectTotalCount is available
  const idx = arr.findIndex(p => p.name === selectedProject.value);
  if (idx !== -1 && projectTotalCount.value != null) {
    arr[idx] = { ...arr[idx], count: projectTotalCount.value };
  }
  return arr;
});
const totalAssetCount = computed(() => assets.value.length);

function aggFirstIssuanceTs(a) {
  const tc = getFirstIssuanceTimestamp(a, 'counterparty');
  const tl = getFirstIssuanceTimestamp(a, 'classic');
  if (tc && tl) return Math.min(tc, tl);
  return tc || tl || 0;
}

function aggSupply(a) {
  const sc = Number(a?.data?.counterparty?.supply) || 0;
  const sl = Number(a?.data?.classic?.supply) || 0;
  return Math.max(sc, sl);
}

function aggHolders(a) {
  const hc = Array.isArray(a?.data?.counterparty?.holders) ? a.data.counterparty.holders.length : 0;
  const hl = Array.isArray(a?.data?.classic?.holders?.data) ? a.data.classic.holders.data.length : 0;
  return Math.max(hc, hl);
}

function aggDivisible(a) {
  const dc = !!a?.data?.counterparty?.divisible;
  const dl = !!a?.data?.classic?.divisible;
  return dc || dl;
}

function aggLocked(a) {
  const lc = !!a?.data?.counterparty?.locked;
  const ll = !!a?.data?.classic?.locked;
  return lc || ll;
}

// Aggregated available supply with memoization to avoid re-computing burns repeatedly
import { calcAddressBurns } from "./utils/addressBurns.js";
const _availCache = new Map();
function aggAvailableSupply(a) {
  const cs = Number(a?.data?.counterparty?.supply) || 0;
  const ch = Array.isArray(a?.data?.counterparty?.holders) ? a.data.counterparty.holders : [];
  const cd = !!a?.data?.counterparty?.divisible;
  const ls = Number(a?.data?.classic?.supply) || 0;
  const lh = Array.isArray(a?.data?.classic?.holders?.data) ? a.data.classic.holders.data : [];
  const ld = !!a?.data?.classic?.divisible;
  const key = `${a.name}|${cs}|${ch.length}|${cd}|${ls}|${lh.length}|${ld}`;
  if (_availCache.has(key)) return _availCache.get(key);
  const cBurns = calcAddressBurns(ch, { divisible: cd });
  const cAvail = cs - cBurns;
  const lBurns = calcAddressBurns(lh, { divisible: ld });
  const lAvail = ls - lBurns;
  const val = Math.max(cAvail, lAvail);
  _availCache.set(key, val);
  return val;
}

const filteredAssets = computed(() => {
  return assets.value.filter((a) => {
    // Project filter (always one project selected)
    const proj = a.project || 'Spells of Genesis';
    if (proj !== selectedProject.value) return false;
    // Optional name search within the selected project
    const q = searchQuery.value.trim().toLowerCase();
    if (q) {
      const name = String(a.name || '').toLowerCase();
      if (!name.includes(q)) return false;
    }
    // Divisible toggle
    if (requireDivisible.value) {
      const isDiv = aggDivisible(a);
      if (!isDiv) return false;
    }
    // Locked toggle
    if (requireLocked.value) {
      const isLocked = aggLocked(a);
      if (!isLocked) return false;
    }
    // Special toggle: require a non-empty special string
    if (requireSpecial.value) {
      const s = a?.special;
      if (!(typeof s === 'string' && s.trim().length > 0)) return false;
    }
    return true;
  });
});

const sortedAssets = computed(() => {
  const arr = [...filteredAssets.value];
  switch (sortOrder.value) {
    case 'dateDesc':
      arr.sort((a, b) => aggFirstIssuanceTs(b) - aggFirstIssuanceTs(a));
      break;
    case 'supplyAsc':
      arr.sort((a, b) => aggSupply(a) - aggSupply(b));
      break;
    case 'supplyDesc':
      arr.sort((a, b) => aggSupply(b) - aggSupply(a));
      break;
    case 'availableSupplyAsc':
      arr.sort((a, b) => aggAvailableSupply(a) - aggAvailableSupply(b));
      break;
    case 'availableSupplyDesc':
      arr.sort((a, b) => aggAvailableSupply(b) - aggAvailableSupply(a));
      break;
    case 'holdersAsc':
      arr.sort((a, b) => aggHolders(a) - aggHolders(b));
      break;
    case 'holdersDesc':
      arr.sort((a, b) => aggHolders(b) - aggHolders(a));
      break;
    case 'dateAsc':
    default:
      arr.sort((a, b) => aggFirstIssuanceTs(a) - aggFirstIssuanceTs(b));
  }
  return arr;
});

const visibleAssets = computed(() => sortedAssets.value);

// Active client-side filters besides the project itself (sorting doesn't change count)
const hasActiveClientFilters = computed(() => !!searchQuery.value.trim() || requireDivisible.value || requireLocked.value || requireSpecial.value);

// Determine if current project has any asset with non-empty `special`
const hasSpecialInProject = computed(() => {
  const proj = selectedProject.value;
  return assets.value.some(a => ((a.project || 'Spells of Genesis') === proj) && typeof a?.special === 'string' && a.special.trim().length > 0);
});

// Reset special filter if not available
watch(hasSpecialInProject, (available) => {
  if (!available && requireSpecial.value) {
    requireSpecial.value = false;
  }
});

// After initial full load, we know all items; use visible length
const totalItemsForPagination = computed(() => visibleAssets.value.length);

const totalPages = computed(() => {
  return pageSize.value ? Math.max(1, Math.ceil(totalItemsForPagination.value / pageSize.value)) : 1;
});

const pagedAssets = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return visibleAssets.value.slice(start, end);
});

// Progress for top bar loading indicator
const loadedProjectCount = computed(() => assets.value.reduce((acc, a) => acc + (((a.project || 'Spells of Genesis') === selectedProject.value) ? 1 : 0), 0));
const hasKnownTotal = computed(() => projectTotalCount.value != null && projectTotalCount.value > 0);
const prefetchProgressPercent = computed(() => {
  const total = projectTotalCount.value || 0;
  if (!total) return 0;
  const loaded = loadedProjectCount.value;
  const pct = Math.min(100, Math.floor((loaded / total) * 100));
  return pct;
});
const progressBarWidth = computed(() => (hasKnownTotal.value ? prefetchProgressPercent.value + '%' : '30%'));

// Clamp to valid page range when data changes
watch(
  () => visibleAssets.value.length + pageSize.value, // include pageSize in dependency to clamp on resize
  (len) => {
    const total = pageSize.value ? Math.ceil(len / pageSize.value) : 1;
    if (total === 0) {
      currentPage.value = 1;
      return;
    }
    if (currentPage.value > total) currentPage.value = total;
    if (currentPage.value < 1) currentPage.value = 1;
  }
);

function onPageChange(val) {
  currentPage.value = val;
  // persist current page
  try { localStorage.setItem('cpulse.currentPage', String(val)); } catch {}
  // Smooth scroll to top of the content area
  nextTick(() => {
    const main = document.querySelector('main');
    if (main && typeof main.scrollTo === 'function') {
      main.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

async function loadProjectCount() {
  try {
    const q = query(collection(db, 'assets'), where('project', '==', selectedProject.value));
    const snapshot = await getCountFromServer(q);
    projectTotalCount.value = snapshot.data().count || 0;
  } catch (e) {
    console.warn('Failed to load project count:', e?.code || e);
    projectTotalCount.value = null;
  }
}

async function loadAllProjectCounts() {
  try {
    const names = new Set(KNOWN_PROJECTS);
    names.add(selectedProject.value);
    for (const a of assets.value) names.add(a.project || 'Spells of Genesis');
    const updates = {};
    for (const name of names) {
      try {
        const qn = query(collection(db, 'assets'), where('project', '==', name));
        const snap = await getCountFromServer(qn);
        updates[name] = snap.data().count || 0;
      } catch (e) {
        // ignore individual failures; keep previous value if any
      }
    }
    projectCounts.value = { ...projectCounts.value, ...updates };
  } catch {}
}

async function loadNextBatch(reset = false) {
  if (loading.value) return;
  loading.value = true;
  try {
    if (reset) {
      // Only remove entries from the currently selected project,
      // to keep previously loaded projects in the list.
      const proj = selectedProject.value;
      assets.value = assets.value.filter(a => (a.project || 'Spells of Genesis') !== proj ? true : false);
      hasMore.value = true;
      _lastDoc = null;
    }
    if (!hasMore.value) return;
    const colRef = collection(db, 'assets');
    // Base query: try to filter by selected project on server; order by name for stable pagination
    const batchSize = Math.max(qlimitSize(reset), 10);
    const buildQueryByMode = (mode) => {
      switch (mode) {
        case 'project+name':
          return _lastDoc
            ? query(colRef, where('project', '==', selectedProject.value), orderBy('name'), startAfter(_lastDoc), qlimit(batchSize))
            : query(colRef, where('project', '==', selectedProject.value), orderBy('name'), qlimit(batchSize));
        case 'project+docid':
          return _lastDoc
            ? query(colRef, where('project', '==', selectedProject.value), orderBy(documentId()), startAfter(_lastDoc.id || _lastDoc), qlimit(batchSize))
            : query(colRef, where('project', '==', selectedProject.value), orderBy(documentId()), qlimit(batchSize));
        case 'name':
        default:
          return _lastDoc
            ? query(colRef, orderBy('name'), startAfter(_lastDoc), qlimit(batchSize))
            : query(colRef, orderBy('name'), qlimit(batchSize));
      }
    };
    let snap;
    let modeUsed = null;
    try {
      const m1 = serverFilterSupported.value ? 'project+name' : 'name';
      const q1 = buildQueryByMode(m1);
      snap = await getDocs(q1);
      modeUsed = m1;
    } catch (e1) {
      try {
        // Fallback: server-side project filter with documentId ordering (no composite index required)
        const m2 = 'project+docid';
        const q2 = buildQueryByMode(m2);
        snap = await getDocs(q2);
        modeUsed = m2;
        serverFilterSupported.value = false; // we lost name-order server-side
      } catch (e2) {
        console.warn('Firestore query fallback to name-only ordering:', e1?.code || e1, e2?.code || e2);
        // Last resort: no server filter, order by name
        const m3 = 'name';
        const q3 = buildQueryByMode(m3);
        snap = await getDocs(q3);
        modeUsed = m3;
        serverFilterSupported.value = false;
      }
    }
    const rawDocs = snap.docs.map(d => ({ ...d.data() }));
    // If we had to query without a server-side project filter, drop non-matching docs client-side
    const docs = (modeUsed === 'name')
      ? rawDocs.filter(d => ((d.project || 'Spells of Genesis') === selectedProject.value))
      : rawDocs;
    const endOfCollectionBatch = snap.docs.length === 0 || snap.docs.length < batchSize;
    if (docs.length === 0) {
      // No docs for this project in this batch. Keep paginating unless we've reached the end of collection.
      if (endOfCollectionBatch) hasMore.value = false;
    } else {
      assets.value = assets.value.concat(docs);
      _lastDoc = snap.docs[snap.docs.length - 1];
      // If we reached end-of-collection batch, no more data
      if (endOfCollectionBatch) hasMore.value = false;
      // If we know the total, stop once we've loaded it all (even when docs.length === batchSize)
      const total = projectTotalCount.value;
      if (typeof total === 'number' && total > 0) {
        const loadedSoFar = assets.value.reduce((acc, a) => acc + (((a.project || 'Spells of Genesis') === selectedProject.value) ? 1 : 0), 0);
        if (loadedSoFar >= total) hasMore.value = false;
      }
    }
  } finally {
    loading.value = false;
  }
}

function qlimitSize(reset = false){
  // Fixed batch size so the loading progress advances in visible steps
  return 80;
}

async function loadAllForProject() {
  await loadNextBatch(true);
  let guard = 0;
  while (hasMore.value && guard < 500) {
    await loadNextBatch(false);
    guard++;
  }
}

onMounted(async () => {
  // Read ?project= from URL if present
  try {
    const url = new URL(window.location.href);
    const p = url.searchParams.get('project');
    if (p && typeof p === 'string' && p.trim()) {
      selectedProject.value = p.trim();
      // ensure URL is normalized (in case of casing/spacing differences)
      try {
        url.searchParams.set('project', selectedProject.value);
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
  } catch {}
  // Load counts for all known/discovered projects (non-blocking)
  loadAllProjectCounts().catch(() => {});
  // Restore page from localStorage
  try {
    const saved = localStorage.getItem('cpulse.currentPage');
    if (saved) {
      const n = parseInt(saved, 10);
      if (!Number.isNaN(n) && n > 0) currentPage.value = n;
    }
  } catch {}
  // Load server count (for accurate %), then load all items upfront for the selected project
  initialLoaded.value = false;
  await loadProjectCount();
  await loadAllForProject();
  initialLoaded.value = true;
});

// Keep localStorage in sync when page changes via clamp
watch(currentPage, (val) => {
  try { localStorage.setItem('cpulse.currentPage', String(val)); } catch {}
});

// On project change: fully reload
watch(selectedProject, async () => {
  currentPage.value = 1;
  serverFilterSupported.value = true;
  initialLoaded.value = false;
  // Update URL param ?project=
  try {
    const url = new URL(window.location.href);
    if (selectedProject.value) url.searchParams.set('project', selectedProject.value);
    else url.searchParams.delete('project');
    window.history.replaceState({}, '', url.toString());
  } catch {}
  // Refresh project counts (non-blocking) so dropdown shows accurate numbers
  loadAllProjectCounts().catch(() => {});
  await loadProjectCount();
  await loadAllForProject();
  initialLoaded.value = true;
});

// Search only affects client-side filtering (everything is loaded)
watch(searchQuery, () => { currentPage.value = 1; });

// Reset to first page when toggles or sort change to avoid landing on empty pages
watch([requireDivisible, requireLocked, requireSpecial], () => { currentPage.value = 1; });
watch(sortOrder, () => { currentPage.value = 1; });

// No server interaction needed on page/pageSize changes after full load

// No background prefetch (we load everything upfront per project)
</script>
