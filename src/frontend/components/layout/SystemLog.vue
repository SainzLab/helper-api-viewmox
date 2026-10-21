<template>
  <div class="animate-fade-in space-y-6">
    <!-- Header Khusus System Log -->
    <div class="flex justify-between items-end mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1 flex items-center gap-3">
          <i class="ph-bold ph-terminal-window text-emerald-400"></i> Log Sistem (Internal)
        </h2>
        <p class="text-slate-400 text-sm">Catatan aktivitas internal aplikasi, daemon dan autentifikasi.</p>
      </div>
      
      <div class="flex gap-4 items-center">
        <!-- TOGGLE MODE BUTTON -->
        <div class="flex bg-slate-900 border border-slate-700 p-1 rounded-lg shadow-inner">
          <button class="px-4 py-2 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-2 bg-blue-500 text-white shadow">
            <i class="ph-bold ph-terminal-window"></i> LOG SISTEM
          </button>
          <button @click="$emit('change-view', 'proxmox')" class="px-4 py-2 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-2 text-slate-400 hover:text-white">
            <i class="ph-bold ph-hard-drives"></i> LOG PROXMOX
          </button>
        </div>

        <!-- SEARCH BAR -->
        <div class="relative">
          <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
          <input type="text" v-model="searchQuery" placeholder="Cari pesan atau sumber..." class="pl-9 pr-8 py-2.5 w-64 border border-slate-700 bg-slate-800/50 text-white rounded-lg text-sm font-medium hover:bg-slate-700 focus:bg-slate-900 focus:border-blue-400 transition outline-none">
          <!-- Tombol silang untuk reset pencarian -->
          <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition">
             <i class="ph-bold ph-x"></i>
          </button>
        </div>

        <!-- FILTER LEVEL LOG (ICON ONLY DROPDOWN) -->
        <div class="relative h-[42px] w-[42px] shrink-0">
          <select v-model="filterLevel" title="Filter Level" class="w-full h-full border border-slate-700 bg-slate-800/50 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700 transition outline-none appearance-none cursor-pointer text-center opacity-0 absolute inset-0 z-10">
            <option value="ALL">Semua Level</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
          </select>
          <div class="w-full h-full border border-slate-700 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-300 pointer-events-none transition hover:bg-slate-700">
            <i class="ph-bold ph-funnel text-base" :class="{'text-emerald-400': filterLevel !== 'ALL'}"></i>
          </div>
        </div>

      </div>
    </div>

    <!-- TABEL LOG SISTEM -->
    <div class="bg-slate-900/40 border border-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-800/80 border-b border-slate-700 text-[11px] uppercase tracking-wider text-slate-400">
              <th class="px-6 py-4 font-semibold w-48">Waktu (Timestamp)</th>
              <th class="px-6 py-4 font-semibold w-32">Level</th>
              <th class="px-6 py-4 font-semibold w-40">Sumber (Source)</th>
              <th class="px-6 py-4 font-semibold">Pesan Aktivitas</th>
            </tr>
          </thead>
          <tbody class="text-sm font-mono">
            <!-- STATE 1: LOADING AWAL -->
            <template v-if="isLoading && logs.length === 0">
              <tr class="border-b border-slate-800/50">
                <td colspan="4" class="px-6 py-12 text-center text-slate-400">
                  <i class="ph-bold ph-spinner animate-spin text-2xl text-blue-400 mb-2 inline-block"></i>
                  <p class="font-sans">Memuat log sistem...</p>
                </td>
              </tr>
            </template>
            
            <!-- STATE 2: DATA KOSONG -->
            <template v-else-if="displayedLogs.length === 0">
              <tr class="border-b border-slate-800/50">
                <td colspan="4" class="px-6 py-12 text-center text-slate-500 font-sans">
                  <span v-if="searchQuery || filterLevel !== 'ALL'">
                    Tidak ada log yang cocok dengan filter dan pencarian Anda.
                  </span>
                  <span v-else>Tidak ada data log yang ditemukan.</span>
                </td>
              </tr>
            </template>
            
            <!-- STATE 3: DATA TERSEDIA (UNLIMITED SCROLL RENDER) -->
            <template v-else>
              <tr v-for="log in displayedLogs" :key="log.id" class="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                <td class="px-6 py-3 text-slate-400 text-xs whitespace-nowrap">{{ formatWibDateTime(log.timestamp) }}</td>
                <td class="px-6 py-3">
                  <span :class="{
                    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20': log.level === 'INFO',
                    'text-amber-400 bg-amber-500/10 border-amber-500/20': log.level === 'WARNING',
                    'text-rose-400 bg-rose-500/10 border-rose-500/20': log.level === 'ERROR'
                  }" class="px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider">
                    {{ log.level }}
                  </span>
                </td>
                <td class="px-6 py-3 text-slate-300 text-xs">{{ log.source }}</td>
                <td class="px-6 py-3 text-slate-300 text-xs">{{ log.message }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SENTINEL TRIGGER INFINITE / UNLIMITED SCROLL -->
    <div ref="loadMoreTrigger" class="h-10 w-full flex items-center justify-center text-xs text-slate-500 gap-2">
      <template v-if="hasMoreToRender">
        <i class="ph-bold ph-spinner animate-spin text-blue-400 text-base"></i>
        <span>Memuat baris log berikutnya ({{ displayedLogs.length }} / {{ filteredLogs.length }})...</span>
      </template>
      <template v-else-if="displayedLogs.length > 0">
        <span>Menampilkan seluruh {{ displayedLogs.length }} baris log.</span>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { formatWibDateTime } from '../../utils/datetime.js';

defineEmits(['change-view']);

const BATCH_SIZE = 30;
const isLoading = ref(false);
const searchQuery = ref('');
const filterLevel = ref('ALL');
const logs = ref([]);
const totalDbLogs = ref(0);

// === UNLIMITED SCROLL STATE ===
const displayLimit = ref(BATCH_SIZE);
const loadMoreTrigger = ref(null);
let observer = null;
let logInterval = null;

// Reset batas render ke ukuran batch awal saat user mengubah filter atau kata kunci pencarian
watch([searchQuery, filterLevel], () => {
  displayLimit.value = BATCH_SIZE;
});

// Filter pencarian dan level
const filteredLogs = computed(() => {
  let result = logs.value;

  if (filterLevel.value !== 'ALL') {
    result = result.filter(log => log.level === filterLevel.value);
  }

  if (searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(log => 
      (log.message && log.message.toLowerCase().includes(query)) || 
      (log.source && log.source.toLowerCase().includes(query))
    );
  }

  return result;
});

// Hanya me-render sejumlah baris sesuai displayLimit agar DOM tetap ringan
const displayedLogs = computed(() => filteredLogs.value.slice(0, displayLimit.value));

const hasMoreToRender = computed(() => {
  return displayedLogs.value.length < filteredLogs.value.length || logs.value.length < totalDbLogs.value;
});

// Fetch data dari Backend
const fetchSystemLogs = async (isSilent = false) => {
  if (isSilent && document.hidden) return;
  if (!isSilent && logs.value.length === 0) isLoading.value = true;
  
  try {
    // Tarik hanya sejumlah baris yang dibutuhkan oleh posisi scroll saat ini (+ buffer)
    const fetchLimit = Math.max(150, displayLimit.value + 90);
    const res = await fetch(`/api/logs/system?limit=${fetchLimit}`);
    const data = await res.json();
    
    if (data.success) {
      logs.value = data.data || [];
      totalDbLogs.value = Number(data.total) || logs.value.length;
    }
  } catch (error) {
    console.error("Gagal menarik data log sistem:", error);
  } finally {
    if (!isSilent) isLoading.value = false;
  }
};

const loadMoreRows = async () => {
  if (isLoading.value) return;
  if (displayedLogs.value.length < filteredLogs.value.length) {
    displayLimit.value += BATCH_SIZE;
    // Jika mendekati batas data yang sudah di-fetch tetapi di DB masih ada lebih banyak data, tarik lagi
    if (displayLimit.value + BATCH_SIZE >= logs.value.length && logs.value.length < totalDbLogs.value) {
      await fetchSystemLogs(true);
    }
  } else if (logs.value.length < totalDbLogs.value) {
    displayLimit.value += BATCH_SIZE;
    await fetchSystemLogs(true);
  }
};

const handleVisibilityChange = () => {
  if (!document.hidden) {
    fetchSystemLogs(true);
  }
};

onMounted(() => {
  // Hanya fetch dan render saat komponen SystemLog sedang dibuka
  fetchSystemLogs(false);
  
  // Auto-refresh realtime setiap 3 detik secara transparan
  logInterval = setInterval(() => {
    fetchSystemLogs(true);
  }, 3000);

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Setup IntersectionObserver untuk Unlimited Scroll
  observer = new IntersectionObserver(async (entries) => {
    if (entries[0]?.isIntersecting && hasMoreToRender.value) {
      await loadMoreRows();
      await nextTick();
    }
  }, {
    rootMargin: '150px'
  });

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }
});

onUnmounted(() => {
  if (logInterval) clearInterval(logInterval);
  if (observer) observer.disconnect();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
</style>
