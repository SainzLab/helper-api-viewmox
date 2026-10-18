<template>
  <div class="animate-fade-in space-y-4 relative">
    <!-- Header Khusus Proxmox Log -->
    <div class="flex justify-between items-end mb-4">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1 flex items-center gap-3">
          <i class="ph-bold ph-hard-drives text-emerald-400"></i> Log Aktivitas Proxmox
        </h2>
        <p class="text-slate-400 text-sm">Riwayat tugas (Tasks) dan rekam jejak aksi (Cluster Log) Proxmox VE.</p>
      </div>
      
      <div class="flex gap-4 items-center">
        <!-- TOGGLE MODE BUTTON -->
        <div class="flex bg-slate-900 border border-slate-700 p-1 rounded-lg shadow-inner">
          <button @click="$emit('change-view', 'system')" class="px-4 py-2 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-2 text-slate-400 hover:text-white">
            <i class="ph-bold ph-terminal-window"></i> LOG SISTEM
          </button>
          <button class="px-4 py-2 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-2 bg-emerald-500 text-moxdark shadow">
            <i class="ph-bold ph-hard-drives"></i> LOG PROXMOX
          </button>
        </div>

        <!-- SEARCH BAR -->
        <div class="relative">
          <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
          <input type="text" v-model="searchQuery" :placeholder="activeTab === 'tasks' ? 'Cari deskripsi, user...' : 'Cari pesan, service...'" class="pl-9 pr-4 py-2.5 w-64 border border-slate-700 bg-slate-800/50 text-white rounded-lg text-sm font-medium hover:bg-slate-700 focus:bg-slate-900 focus:border-emerald-400 transition outline-none">
          <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition">
             <i class="ph-bold ph-x"></i>  
          </button>
        </div>
      </div>
    </div>

    <!-- SUB-TABS (TASKS vs CLUSTER LOG) -->
    <div class="flex gap-6 border-b border-slate-700/80 px-2">
      <button 
        @click="activeTab = 'tasks'" 
        class="pb-3 text-sm font-bold transition-all relative"
        :class="activeTab === 'tasks' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'"
      >
        <i class="ph-fill ph-list-checks mr-1.5"></i> Tasks
        <span v-if="activeTab === 'tasks'" class="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400 rounded-t-md shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
      </button>
      <button 
        @click="activeTab = 'cluster'" 
        class="pb-3 text-sm font-bold transition-all relative"
        :class="activeTab === 'cluster' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'"
      >
        <i class="ph-fill ph-list-dashes mr-1.5"></i> Cluster log
        <span v-if="activeTab === 'cluster'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-t-md shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
      </button>
    </div>

    <!-- WRAPPER TABEL -->
    <div class="bg-moxcard border border-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col mb-4">
      
      <!-- ================= TAB 1: TASKS LOG ================= -->
      <div v-if="activeTab === 'tasks'" class="overflow-x-auto animate-fade-in">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-800/40 border-b border-slate-700 text-[11px] uppercase tracking-wider text-slate-400">
              <th class="px-6 py-4 font-semibold w-40">Waktu Mulai</th>
              <th class="px-6 py-4 font-semibold w-40">Waktu Selesai</th>
              <th class="px-6 py-4 font-semibold w-24">Node</th>
              <th class="px-6 py-4 font-semibold w-32">User name</th>
              <th class="px-6 py-4 font-semibold">Deskripsi (Action)</th>
              <th class="px-6 py-4 font-semibold w-32">Status</th>
            </tr>
          </thead>
          <tbody class="text-sm font-sans">
            <template v-if="isLoading">
              <tr class="border-b border-slate-800/50">
                <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                  <i class="ph-bold ph-spinner animate-spin text-2xl text-emerald-400 mb-2 inline-block"></i>
                  <p>Menarik data Tasks Log dari API Proxmox...</p>
                </td>
              </tr>
            </template>
            <template v-else-if="displayedTasks.length === 0">
              <tr class="border-b border-slate-800/50">
                <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                  <span v-if="searchQuery">Tidak ada log Tasks yang cocok dengan pencarian "{{ searchQuery }}".</span>
                  <span v-else>Tidak ada data log Tasks yang ditemukan.</span>
                </td>
              </tr>
            </template>
            <template v-else>
              <!-- MENGGUNAKAN displayedTasks (Hasil Slice Infinite Scroll) -->
              <tr v-for="log in displayedTasks" :key="log.upid" @click="openLogDetail(log)" class="border-b border-slate-800/50 hover:bg-slate-800/50 transition cursor-pointer group">
                <td class="px-6 py-4 text-slate-400 text-xs">{{ log.starttime }}</td>
                <td class="px-6 py-4 text-slate-300 text-xs group-hover:text-emerald-400 transition">{{ log.endtime }}</td>
                <td class="px-6 py-4 text-slate-300 text-xs font-mono">{{ log.node }}</td>
                <td class="px-6 py-4 text-slate-400 text-xs">{{ log.user }}</td>
                <td class="px-6 py-4 text-emerald-400 text-xs font-bold">{{ log.description }}</td>
                <td class="px-6 py-4 flex items-center justify-between">
                  <span v-if="log.status === 'OK'" class="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded text-[10px] font-bold uppercase border border-emerald-500/20">OK</span>
                  <span v-else class="text-rose-400 bg-rose-500/10 px-2 py-1 rounded text-[10px] font-bold uppercase border border-rose-500/20">{{ log.status }}</span>
                  <i class="ph-bold ph-caret-right text-slate-600 group-hover:text-emerald-400 transition transform group-hover:translate-x-1"></i>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- ================= TAB 2: CLUSTER LOG ================= -->
      <div v-if="activeTab === 'cluster'" class="overflow-x-auto animate-fade-in">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-800/40 border-b border-slate-700 text-[11px] uppercase tracking-wider text-slate-400">
              <th class="px-6 py-4 font-semibold w-40">Time</th>
              <th class="px-6 py-4 font-semibold w-24">Node</th>
              <th class="px-6 py-4 font-semibold w-32">Service</th>
              <th class="px-6 py-4 font-semibold w-24">PID</th>
              <th class="px-6 py-4 font-semibold w-32">User name</th>
              <th class="px-6 py-4 font-semibold w-24">Severity</th>
              <th class="px-6 py-4 font-semibold">Message</th>
            </tr>
          </thead>
          <tbody class="text-sm font-sans">
            <template v-if="isLoading">
              <tr class="border-b border-slate-800/50">
                <td colspan="7" class="px-6 py-12 text-center text-slate-400">
                  <i class="ph-bold ph-spinner animate-spin text-2xl text-blue-400 mb-2 inline-block"></i>
                  <p>Menarik data Cluster Log dari API Proxmox...</p>
                </td>
              </tr>
            </template>
            <template v-else-if="displayedClusterLogs.length === 0">
              <tr class="border-b border-slate-800/50">
                <td colspan="7" class="px-6 py-12 text-center text-slate-500">
                  <span v-if="searchQuery">Tidak ada Cluster log yang cocok dengan pencarian "{{ searchQuery }}".</span>
                  <span v-else>Tidak ada data Cluster log yang ditemukan.</span>
                </td>
              </tr>
            </template>
            <template v-else>
              <!-- MENGGUNAKAN displayedClusterLogs (Hasil Slice Infinite Scroll) -->
              <tr v-for="(cLog, idx) in displayedClusterLogs" :key="idx" class="border-b border-slate-800/30 hover:bg-slate-800/50 transition">
                <td class="px-6 py-2.5 text-slate-400 text-[11px] font-mono whitespace-nowrap">{{ cLog.time }}</td>
                <td class="px-6 py-2.5 text-slate-300 text-xs">{{ cLog.node }}</td>
                <td class="px-6 py-2.5 text-slate-400 text-xs">{{ cLog.service }}</td>
                <td class="px-6 py-2.5 text-slate-400 text-xs font-mono">{{ cLog.pid }}</td>
                <td class="px-6 py-2.5 text-slate-400 text-xs">{{ cLog.user }}</td>
                <td class="px-6 py-2.5">
                  <span :class="cLog.severity === 'info' ? 'text-blue-400' : cLog.severity === 'error' ? 'text-rose-400' : 'text-amber-400'" class="text-[10px] font-bold uppercase tracking-wider">
                    {{ cLog.severity }}
                  </span>
                </td>
                <td class="px-6 py-2.5 text-slate-300 text-xs font-mono break-all">{{ cLog.message }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TRIGGER INFINITE SCROLL -->
    <!-- Elemen transparan ini berada di bawah tabel. Saat terlihat di layar, batas render akan ditambah. -->
    <div ref="loadMoreTrigger" class="h-10 w-full flex items-center justify-center">
       <i v-if="(activeTab === 'tasks' && displayedTasks.length < filteredTasks.length) || (activeTab === 'cluster' && displayedClusterLogs.length < filteredClusterLogs.length)" class="ph-bold ph-spinner animate-spin text-slate-500 text-xl"></i>
    </div>

    <!-- MODAL LOG DETAIL -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-[#111827] border border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
          <div class="flex justify-between items-center px-5 py-3 border-b border-slate-800 bg-slate-900">
            <h3 class="font-bold text-slate-200 flex items-center gap-2 text-sm">
              <i class="ph-bold ph-terminal text-emerald-400 text-lg"></i> 
              Task viewer: <span class="text-blue-400">{{ selectedLog?.description }}</span>
            </h3>
            <button @click="closeDetailModal" class="text-slate-400 hover:text-white transition"><i class="ph ph-x text-xl"></i></button>
          </div>
          <div class="px-5 py-3 bg-slate-800/30 border-b border-slate-800 flex flex-wrap gap-x-8 gap-y-2 text-xs">
            <div><span class="text-slate-500 font-bold">Node:</span> <span class="text-slate-300">{{ selectedLog?.node }}</span></div>
            <div><span class="text-slate-500 font-bold">User name:</span> <span class="text-slate-300">{{ selectedLog?.user }}</span></div>
            <div><span class="text-slate-500 font-bold">Status:</span> <span :class="selectedLog?.status === 'OK' ? 'text-emerald-400' : 'text-rose-400'">{{ selectedLog?.status }}</span></div>
            <div><span class="text-slate-500 font-bold">Start Time:</span> <span class="text-slate-300">{{ selectedLog?.starttime }}</span></div>
            <div><span class="text-slate-500 font-bold">End Time:</span> <span class="text-slate-300">{{ selectedLog?.endtime }}</span></div>
            <div class="w-full mt-1"><span class="text-slate-500 font-bold">Unique task ID:</span> <span class="font-mono text-[10px] text-slate-400 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700/50">{{ selectedLog?.upid }}</span></div>
          </div>
          <div class="flex-1 overflow-y-auto p-5 bg-[#0a0f18] font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed no-scrollbar relative">
            <div v-if="isLoadingDetail" class="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f18]/80 backdrop-blur-sm z-10 text-slate-400">
              <i class="ph-bold ph-spinner animate-spin text-3xl mb-3 text-emerald-400"></i>
              <p>Menarik detail log langsung dari daemon pveproxy node {{ selectedLog?.node }}...</p>
            </div>
            <div v-else>
              <template v-for="(line, idx) in detailedLogText" :key="idx">
                <div :class="line.toLowerCase().includes('error') || line.toLowerCase().includes('failed') ? 'text-rose-400' : ''">
                  {{ line }}
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'; // Tambahkan onUnmounted

defineEmits(['change-view']);

const isLoading = ref(false);
const searchQuery = ref('');
const activeTab = ref('tasks');

// === INFINITE SCROLL STATE ===
const displayLimit = ref(50); 
const loadMoreTrigger = ref(null);

watch([activeTab, searchQuery], () => {
  displayLimit.value = 50;
});

// === STATE: TASKS LOG ===
const showDetailModal = ref(false);
const selectedLog = ref(null);
const isLoadingDetail = ref(false);
const detailedLogText = ref([]);

const proxmoxTasks = ref([]);
const proxmoxClusterLogs = ref([]);

// === FUNGSI HELPER ===
const formatUnixTime = (unixTime) => {
  if (!unixTime) return '-';
  const date = new Date(unixTime * 1000);
  const options = { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  return date.toLocaleString('en-US', options).replace(/,/g, '');
};

const getSeverityLevel = (pri) => {
  if (pri <= 3) return 'error';
  if (pri === 4) return 'warning';
  return 'info';
};

const formatTaskDescription = (type, id) => {
  if (!type) return '-';
  const t = type.toLowerCase();
  if (t === 'aptupdate') return 'Update package database';
  if (t === 'vncproxy') return `VM/CT ${id} - Console`;
  if (t === 'spiceproxy') return `VM/CT ${id} - Console (SPICE)`;
  if (t === 'download') return `File ${id} - Download`;
  if (t === 'qmdestroy' || t === 'destroy') return `VM/CT ${id} - Destroy`;
  if (t === 'qmstart' || t === 'startall') return `VM/CT ${id || 'All'} - Start`;
  if (t === 'qmstop' || t === 'stopall') return `VM/CT ${id || 'All'} - Stop`;
  if (t === 'qmreboot') return `VM/CT ${id} - Reboot`;
  if (t === 'qmsuspend') return `VM/CT ${id} - Suspend`;
  if (t === 'qmresume') return `VM/CT ${id} - Resume`;
  if (t === 'vzdump') return `VM/CT ${id || ''} - Backup`;
  if (t === 'shell') return 'Shell';
  if (t === 'erasedata') return 'Erase data';
  if (t === 'vzcreate' || t === 'qmcreate') return `VM/CT ${id} - Create`;
  return id ? `${type} ${id}` : type; 
};

// === FILTER PENCARIAN KESELURUHAN DATA ===
const filteredTasks = computed(() => {
  if (!searchQuery.value) return proxmoxTasks.value;
  const q = searchQuery.value.toLowerCase();
  return proxmoxTasks.value.filter(l => 
    (l.user && l.user.toLowerCase().includes(q)) || 
    (l.node && l.node.toLowerCase().includes(q)) || 
    (l.description && l.description.toLowerCase().includes(q)) || 
    (l.upid && l.upid.toLowerCase().includes(q))
  );
});

const filteredClusterLogs = computed(() => {
  if (!searchQuery.value) return proxmoxClusterLogs.value;
  const q = searchQuery.value.toLowerCase();
  return proxmoxClusterLogs.value.filter(l => 
    (l.service && l.service.toLowerCase().includes(q)) || 
    (l.node && l.node.toLowerCase().includes(q)) || 
    (l.user && l.user.toLowerCase().includes(q)) || 
    (l.message && l.message.toLowerCase().includes(q))
  );
});
// === HASIL SLICE UNTUK RENDER (INFINITE SCROLL) ===
const displayedTasks = computed(() => filteredTasks.value.slice(0, displayLimit.value));
const displayedClusterLogs = computed(() => filteredClusterLogs.value.slice(0, displayLimit.value));
// === FETCH & ACTIONS ===
// Tambahkan parameter isSilent agar loading tidak muncul saat auto-refresh
const fetchProxmoxData = async (isSilent = false) => {
  if (!isSilent) isLoading.value = true;
  
  try {
    const resTasks = await fetch('/api/proxmox/logs/tasks');
    const dataTasks = await resTasks.json();
    if (dataTasks.success) {
      proxmoxTasks.value = dataTasks.data
        .map(t => ({
          upid: t.upid,
          rawStartTime: t.starttime, 
          starttime: formatUnixTime(t.starttime),
          endtime: formatUnixTime(t.endtime),
          user: t.user,
          node: t.node,
          description: formatTaskDescription(t.type, t.id), 
          status: t.status ? (t.status === 'OK' ? 'OK' : t.status) : 'RUNNING'
        }))
        .sort((a, b) => b.rawStartTime - a.rawStartTime); 
    }

    const resCluster = await fetch('/api/proxmox/logs/cluster');
    const dataCluster = await resCluster.json();
    if (dataCluster.success) {
      proxmoxClusterLogs.value = dataCluster.data
        .map(l => ({
          rawTime: l.time, 
          time: formatUnixTime(l.time),
          node: l.node,
          service: l.tag, 
          pid: l.pid,
          user: l.user,
          severity: getSeverityLevel(l.pri),
          message: l.msg
        }))
        .sort((a, b) => b.rawTime - a.rawTime);
    }
  } catch (error) {
    console.error("Gagal menarik data log dari backend:", error);
  } finally {
    if (!isSilent) isLoading.value = false;
  }
};

const openLogDetail = async (log) => {
  selectedLog.value = log;
  showDetailModal.value = true;
  isLoadingDetail.value = true;
  detailedLogText.value = [];

  try {
    const res = await fetch(`/api/proxmox/logs/task-detail?node=${log.node}&upid=${encodeURIComponent(log.upid)}`);
    const data = await res.json();
    
    if (data.success) {
      detailedLogText.value = data.data.map(line => line.t);
    } else {
      detailedLogText.value = ["Gagal merender log dari server Proxmox: " + data.message];
    }
  } catch (error) {
    detailedLogText.value = ["Koneksi terputus saat mencoba menarik detail log."];
  } finally {
    isLoadingDetail.value = false;
  }
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedLog.value = null;
  detailedLogText.value = [];
};

// === LIFECYCLE HOOKS ===
let logInterval = null; // Variabel untuk menyimpan timer auto-refresh

onMounted(() => {
  fetchProxmoxData(false); // Hit pertama dengan loading spinner

  // Fitur Auto-Refresh: Hit API secara SILENT (tanpa loading) setiap 10 detik
  logInterval = setInterval(() => {
    fetchProxmoxData(true); 
  }, 5000);

  // === SETUP OBSERVER UNTUK INFINITE SCROLL ===
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      displayLimit.value += 50; 
    }
  }, {
    rootMargin: '100px' 
  });

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }
});

// Hentikan interval polling saat user berpindah halaman agar tidak boros memory/bandwidth
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
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>