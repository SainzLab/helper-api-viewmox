<template>
  <header class="h-16 bg-moxdark border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
    
    <!-- Breadcrumb & Jam Digital -->
    <div class="text-xs font-medium text-slate-400 flex items-center gap-2 uppercase tracking-wide">
      <div class="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/80 px-2.5 py-1 rounded text-slate-200 tracking-wider">
        <i class="ph-fill ph-clock text-moxgreen text-sm"></i>
        <span class="font-mono text-[11px] font-bold">{{ currentTime }}</span>
      </div>
    </div>
    
    <!-- Tombol Notifikasi + Dropdown -->
    <div class="relative" ref="notifWrapper">
      <button @click="toggleDropdown"
              class="w-9 h-9 flex items-center justify-center bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 hover:text-white border border-slate-700 transition relative"
              :class="showDropdown ? 'bg-slate-700 text-white' : ''">
        <i class="ph ph-bell text-lg"></i>
        <span v-if="alerts.length > 0"
              class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full border border-moxdark">
          {{ alerts.length > 99 ? '99+' : alerts.length }}
        </span>
      </button>

      <!-- Dropdown -->
      <div v-if="showDropdown"
           class="absolute right-0 mt-3 w-96 bg-moxcard border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20">
        <div class="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h4 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="ph-bold ph-bell-ringing text-moxgreen"></i> Notifikasi Gangguan
          </h4>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ alerts.length }} aktif</span>
        </div>

        <!-- Maksimal 4 item terlihat, sisanya bisa di-scroll (4 x 72px) -->
        <div class="max-h-[288px] overflow-y-auto divide-y divide-slate-800/80">
          <div v-if="isLoading && alerts.length === 0" class="p-6 text-center text-xs text-slate-500">
            <i class="ph ph-spinner animate-spin text-lg block mb-1"></i> Memuat notifikasi...
          </div>
          <div v-else-if="alerts.length === 0" class="p-6 text-center text-xs text-slate-500">
            <i class="ph ph-check-circle text-2xl text-moxgreen block mb-1"></i>
            Tidak ada gangguan aktif
          </div>
          <div v-else v-for="alert in alerts" :key="alert.id"
               class="h-[72px] px-4 flex items-center gap-3 hover:bg-slate-800/40 transition">
            <div class="w-8 h-8 shrink-0 rounded-full flex items-center justify-center" :class="severityStyle(alert.severity).icon">
              <i class="ph-bold text-base" :class="severityStyle(alert.severity).iconClass"></i>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-bold text-white truncate">{{ alert.target_name }}</p>
              <p class="text-[11px] text-slate-400 truncate">{{ alert.message }}</p>
              <p class="text-[10px] text-slate-500 mt-0.5">{{ formatTime(alert.created_at) }}</p>
            </div>
            <span class="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded border uppercase" :class="severityStyle(alert.severity).badge">
              {{ alert.severity }}
            </span>
          </div>
        </div>

        <button @click="openAllModal"
                class="w-full px-4 py-3 border-t border-slate-800 text-xs font-bold text-moxgreen hover:bg-slate-800/50 transition flex items-center justify-center gap-1.5">
          Lihat Semua <i class="ph-bold ph-arrow-right"></i>
        </button>
      </div>
    </div>
  </header>

  <!-- Popup Semua Notifikasi (Teleport agar tidak terkurung stacking context header) -->
  <Teleport to="body">
    <div v-if="showModal"
         class="fixed inset-0 z-[80] flex items-center justify-center bg-moxdark/90 backdrop-blur-sm p-4"
         @click.self="showModal = false">
      <div class="bg-moxcard border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="ph-bold ph-warning text-rose-500"></i> Semua Notifikasi Gangguan
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">{{ alerts.length }} aktif &bull; {{ history.length }} riwayat selesai</p>
          </div>
          <button @click="showModal = false"
                  class="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <i class="ph-bold ph-x"></i>
          </button>
        </div>

        <!-- Tab: Gangguan Aktif / Riwayat Selesai -->
        <div class="px-6 pt-3 border-b border-slate-800 flex gap-6 shrink-0">
          <button @click="activeTab = 'active'"
                  class="pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2"
                  :class="activeTab === 'active' ? 'border-rose-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'">
            <i class="ph-bold ph-warning text-rose-500"></i> Gangguan Aktif
            <span class="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 text-[10px]">{{ alerts.length }}</span>
          </button>
          <button @click="activeTab = 'history'"
                  class="pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2"
                  :class="activeTab === 'history' ? 'border-moxgreen text-white' : 'border-transparent text-slate-500 hover:text-slate-300'">
            <i class="ph-bold ph-check-circle text-moxgreen"></i> Riwayat Selesai
            <span class="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[10px]">{{ history.length }}</span>
          </button>
        </div>

        <!-- Tab Gangguan Aktif -->
        <div v-if="activeTab === 'active'" class="overflow-y-auto flex-1 divide-y divide-slate-800/80">
          <div v-if="alerts.length === 0" class="p-10 text-center text-sm text-slate-500">
            <i class="ph ph-check-circle text-3xl text-moxgreen block mb-2"></i>
            Tidak ada gangguan aktif
          </div>
          <div v-for="alert in alerts" :key="alert.id" class="px-6 py-4 flex items-start gap-4 hover:bg-slate-800/30 transition">
            <div class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center" :class="severityStyle(alert.severity).icon">
              <i class="ph-bold text-lg" :class="severityStyle(alert.severity).iconClass"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <p class="text-sm font-bold text-white truncate">{{ alert.target_name }}</p>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded border uppercase" :class="severityStyle(alert.severity).badge">
                  {{ alert.severity }}
                </span>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">{{ alert.target_type }}</span>
              </div>
              <p class="text-xs text-slate-300 break-words">{{ alert.message }}</p>
              <p class="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <i class="ph ph-clock"></i> {{ formatTime(alert.created_at) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Tab Riwayat Gangguan Selesai -->
        <div v-else class="overflow-y-auto flex-1 divide-y divide-slate-800/80">
          <div v-if="history.length === 0" class="p-10 text-center text-sm text-slate-500">
            <i class="ph ph-clock-counter-clockwise text-3xl block mb-2"></i>
            Belum ada riwayat gangguan yang selesai
          </div>
          <div v-for="item in history" :key="item.id" class="px-6 py-4 flex items-start gap-4 hover:bg-slate-800/30 transition">
            <div class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-emerald-500/15 text-emerald-500">
              <i class="ph-bold ph-check-circle text-lg"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <p class="text-sm font-bold text-white truncate">{{ item.target_name }}</p>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded border uppercase" :class="severityStyle(item.severity).badge">
                  {{ item.severity }}
                </span>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">{{ item.target_type }}</span>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 uppercase">Selesai</span>
              </div>
              <p class="text-xs text-slate-300 break-words">{{ item.message }}</p>
              <div class="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                <span class="flex items-center gap-1"><i class="ph ph-clock"></i> Mulai: {{ formatTime(item.created_at) }}</span>
                <span class="flex items-center gap-1"><i class="ph ph-check"></i> Selesai: {{ formatTime(item.resolved_at) }}</span>
                <span class="flex items-center gap-1 text-slate-400"><i class="ph ph-timer"></i> Durasi: {{ formatDuration(item.created_at, item.resolved_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-3 border-t border-slate-800 flex justify-between items-center shrink-0">
          <router-link to="/rekap-gangguan" @click="showModal = false"
                       class="text-xs font-bold text-moxgreen hover:text-emerald-400 transition">
            Buka Rekap Gangguan
          </router-link>
          <button @click="showModal = false"
                  class="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg text-sm font-medium transition">
            Tutup
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const currentTime = ref('');
let timer = null;

const updateClock = () => {
  const now = new Date();
  
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  currentTime.value = `${hours}:${minutes}:${seconds} WIB`;
};

// ==========================================
// NOTIFIKASI GANGGUAN
// ==========================================
const alerts = ref([]);
const history = ref([]);
const activeTab = ref('active');
const isLoading = ref(false);
const showDropdown = ref(false);
const showModal = ref(false);
const notifWrapper = ref(null);
let alertTimer = null;

const fetchAlerts = async () => {
  isLoading.value = true;
  try {
    const res = await fetch('/api/alerts/active');
    const json = await res.json();
    if (json.success) alerts.value = json.data;
  } catch (err) {
    console.error('Gagal memuat notifikasi:', err);
  } finally {
    isLoading.value = false;
  }
};

const fetchHistory = async () => {
  try {
    const res = await fetch('/api/alerts/history');
    const json = await res.json();
    if (json.success) history.value = json.data;
  } catch (err) {
    console.error('Gagal memuat riwayat gangguan:', err);
  }
};

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
  if (showDropdown.value) fetchAlerts();
};

const openAllModal = () => {
  showDropdown.value = false;
  showModal.value = true;
  activeTab.value = 'active';
  fetchAlerts();
  fetchHistory();
};

const formatDuration = (start, end) => {
  if (!start || !end) return '-';
  const diffMin = Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));
  if (diffMin < 1) return '< 1 menit';
  const d = Math.floor(diffMin / 1440);
  const h = Math.floor((diffMin % 1440) / 60);
  const m = diffMin % 60;
  return [d && `${d} hari`, h && `${h} jam`, m && `${m} menit`].filter(Boolean).join(' ');
};

const severityStyle = (severity) => {
  switch (severity) {
    case 'DOWN':
      return { icon: 'bg-rose-500/15 text-rose-500', iconClass: 'ph-warning-octagon', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/30' };
    case 'CRITICAL':
      return { icon: 'bg-orange-500/15 text-orange-500', iconClass: 'ph-warning', badge: 'bg-orange-500/10 text-orange-500 border-orange-500/30' };
    default:
      return { icon: 'bg-amber-500/15 text-amber-500', iconClass: 'ph-warning-circle', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };
  }
};

const formatTime = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).replace(/\./g, ':') + ' WIB';
};

// Tutup dropdown saat klik di luar
const handleClickOutside = (e) => {
  if (showDropdown.value && notifWrapper.value && !notifWrapper.value.contains(e.target)) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  updateClock(); // Set waktu pertama kali agar tidak kosong sesaat
  timer = setInterval(updateClock, 1000); // Jalankan fungsi update setiap 1000ms (1 detik)

  fetchAlerts();
  alertTimer = setInterval(fetchAlerts, 30000); // Refresh notifikasi tiap 30 detik
  document.addEventListener('click', handleClickOutside);
});

// Lifecycle Hooks: Dijalankan saat komponen dihancurkan (Unmount)
onUnmounted(() => {
  if (timer) {
    clearInterval(timer); // Hapus interval untuk mencegah memory leak
  }
  if (alertTimer) clearInterval(alertTimer);
  document.removeEventListener('click', handleClickOutside);
});
</script>
