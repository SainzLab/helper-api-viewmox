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
            <!-- STATE 1: LOADING -->
            <template v-if="isLoading">
              <tr class="border-b border-slate-800/50">
                <td colspan="4" class="px-6 py-12 text-center text-slate-400">
                  <i class="ph-bold ph-spinner animate-spin text-2xl text-blue-400 mb-2 inline-block"></i>
                  <p class="font-sans">Memuat log sistem...</p>
                </td>
              </tr>
            </template>
            
            <!-- STATE 2: DATA KOSONG -->
            <template v-else-if="filteredLogs.length === 0">
              <tr class="border-b border-slate-800/50">
                <td colspan="4" class="px-6 py-12 text-center text-slate-500 font-sans">
                  <span v-if="searchQuery || filterLevel !== 'ALL'">
                    Tidak ada log yang cocok dengan filter dan pencarian Anda.
                  </span>
                  <span v-else>Tidak ada data log yang ditemukan.</span>
                </td>
              </tr>
            </template>
            
            <!-- STATE 3: DATA TERSEDIA -->
            <template v-else>
              <!-- UBAH DARI "log in logs" MENJADI "log in filteredLogs" -->
              <tr v-for="log in filteredLogs" :key="log.id" class="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                <td class="px-6 py-3 text-slate-400 text-xs">{{ log.timestamp }}</td>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

defineEmits(['change-view']);

const isLoading = ref(false);
const searchQuery = ref('');
const filterLevel = ref('ALL');
const logs = ref([]);
let logInterval = null;

// Filter pencarian dan level
const filteredLogs = computed(() => {
  let result = logs.value;

  if (filterLevel.value !== 'ALL') {
    result = result.filter(log => log.level === filterLevel.value);
  }

  if (searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(log => 
      log.message.toLowerCase().includes(query) || 
      log.source.toLowerCase().includes(query)
    );
  }

  return result;
});

// Fetch data dari Backend
const fetchSystemLogs = async (isSilent = false) => {
  if (!isSilent) isLoading.value = true;
  
  try {
    const res = await fetch('/api/logs/system');
    const data = await res.json();
    
    if (data.success) {
      logs.value = data.data;
    }
  } catch (error) {
    console.error("Gagal menarik data log sistem:", error);
  } finally {
    if (!isSilent) isLoading.value = false;
  }
};

onMounted(() => {
  fetchSystemLogs(false); // Hit pertama kali dengan loading
  
  // Auto-refresh setiap 5 detik secara transparan
  logInterval = setInterval(() => {
    fetchSystemLogs(true);
  }, 5000);
});

onUnmounted(() => {
  if (logInterval) clearInterval(logInterval);
});
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
</style>