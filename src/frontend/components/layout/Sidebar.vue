<template>
  <aside class="w-64 bg-white h-screen fixed left-0 top-0 border-r border-slate-200/80 flex flex-col z-20 font-sans shadow-[1px_0_2px_rgba(0,0,0,0.02)]">
    
    <!-- Logo -->
    <div class="p-5 border-b border-slate-200/80">
      <h1 class="text-xl font-bold flex items-center gap-2 text-slate-900">
        <i class="ph-bold ph-activity text-slate-700 text-2xl"></i> ProxView
      </h1>
      <p class="text-[10px] text-slate-500 mt-1.5 uppercase tracking-wider font-semibold">Monitoring Proxmox</p>
    </div>

    <!-- Navigation -->
    <div class="flex-1 overflow-y-auto py-5 flex flex-col gap-8 no-scrollbar">
      
      <!-- Menu Utama -->
      <nav class="px-4">
        <p class="text-[11px] text-slate-400 mb-3 font-semibold tracking-wider uppercase">Menu Utama</p>
        <ul class="space-y-1">
          <li>
            <router-link 
              to="/dashboard" 
              :class="['flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition', 
                route.name === 'dashboard' ? 'bg-slate-900 text-white font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              ]"
            >
              <div class="flex items-center gap-3"><i class="ph ph-squares-four text-lg"></i> Dashboard</div>
              <!-- Aksen Dot Hijau untuk menu aktif -->
              <span v-if="route.name === 'dashboard'" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </router-link>
          </li>
          <li>
            <router-link 
              to="/kelola-pengguna" 
              :class="['flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition', 
                route.name === 'kelola-pengguna' ? 'bg-slate-900 text-white font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              ]"
            >
              <div class="flex items-center gap-3"><i class="ph ph-users text-lg"></i> Kelola Pengguna</div>
              <span v-if="route.name === 'kelola-pengguna'" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </router-link>
          </li>
          <li>
            <router-link 
              to="/target-monitoring" 
              :class="['flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition', 
                route.name === 'target-monitoring' ? 'bg-slate-900 text-white font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              ]"
            >
              <div class="flex items-center gap-3"><i class="ph ph-graph text-lg"></i> Monitoring</div>
              <div class="flex items-center gap-2">
                <!-- Badge Pastel jika ada downCount -->
                <span v-if="downCount > 0" class="text-[10px] px-1.5 py-0.5 rounded-md border bg-rose-50 text-rose-700 border-rose-200/60 font-bold font-mono animate-pulse">
                  {{ downCount }}
                </span>
                <span v-if="route.name === 'target-monitoring'" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
            </router-link>
          </li>
          <li>
            <router-link 
              to="/rekap-gangguan" 
              :class="['flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition', 
                route.name === 'rekap-gangguan' ? 'bg-slate-900 text-white font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              ]"
            >
              <div class="flex items-center gap-3"><i class="ph ph-ticket text-lg"></i> Rekap Gangguan</div>
              <div class="flex items-center gap-2">
                <span v-if="downCount > 0" class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span v-if="route.name === 'rekap-gangguan'" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
            </router-link>
          </li>
          <li>
            <router-link 
              to="/threshold-config" 
              :class="['flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition', 
                route.name === 'threshold-config' ? 'bg-slate-900 text-white font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              ]"
            >
              <div class="flex items-center gap-3"><i class="ph ph-sliders text-lg"></i> Threshold Config</div>
              <span v-if="route.name === 'threshold-config'" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </router-link>
          </li>
          <li>
            <router-link 
              to="/proxmox-config" 
              :class="['flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition', 
                route.name === 'proxmox-config' ? 'bg-slate-900 text-white font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              ]"
            >
              <div class="flex items-center gap-3"><i class="ph ph-hard-drives text-lg"></i> Proxmox API Config</div>
              <span v-if="route.name === 'proxmox-config'" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </router-link>
          </li>
          <li>
            <router-link 
              to="/log" 
              :class="['flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition', 
                route.name === 'Log' ? 'bg-slate-900 text-white font-medium shadow-[0_1px_2px_rgba(0,0,0,0.05)]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              ]"
            >
              <div class="flex items-center gap-3"><i class="ph ph-terminal text-lg"></i> Log Sistem</div>
              <span v-if="route.name === 'Log'" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- Konektivitas Node Dinamis -->
      <nav class="px-4">
        <p class="text-[11px] text-slate-400 mb-3 font-semibold tracking-wider uppercase">Konektivitas Node</p>
        <div class="bg-slate-50 border border-slate-100 rounded-xl p-3">
          <ul class="space-y-3">
            <!-- Proxmox -->
            <li class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2.5 text-slate-600 font-medium">
                <div class="w-2 h-2 rounded-full transition-colors" :class="nodeStatus.proxmox === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'"></div>
                Proxmox Cluster
              </div>
              <span class="text-[11px] tracking-wider font-bold font-mono transition-colors" :class="nodeStatus.proxmox === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'">{{ nodeStatus.proxmox }}</span>
            </li>
            <!-- ICMP -->
            <li class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2.5 text-slate-600 font-medium">
                <div class="w-2 h-2 rounded-full transition-colors" :class="nodeStatus.icmp === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'"></div>
                ICMP / Ping
              </div>
              <span class="text-[11px] tracking-wider font-bold font-mono transition-colors" :class="nodeStatus.icmp === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'">{{ nodeStatus.icmp }}</span>
            </li>
            <!-- TCP -->
            <li class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2.5 text-slate-600 font-medium">
                <div class="w-2 h-2 rounded-full transition-colors" :class="nodeStatus.tcp === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'"></div>
                TCP Port
              </div>
              <span class="text-[11px] tracking-wider font-bold font-mono transition-colors" :class="nodeStatus.tcp === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'">{{ nodeStatus.tcp }}</span>
            </li>
          </ul>
        </div>
      </nav>
      
    </div>

    <!-- User Profile & Logout -->
    <div class="p-4 border-t border-slate-200/80 bg-slate-50/50">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shadow-sm">
          {{ userProfile.initials }}
        </div>
        <div class="overflow-hidden">
          <p class="text-sm text-slate-900 font-semibold truncate">{{ userProfile.name }}</p>
          <p class="text-[11px] text-slate-500 font-medium truncate">{{ userProfile.email || userProfile.role }}</p>
        </div>
      </div>
      <button 
        @click="handleLogout" 
        class="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 py-2 rounded-lg text-xs font-semibold transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
      >
        <i class="ph-bold ph-sign-out text-base"></i> Keluar Sistem
      </button>
    </div>

  </aside>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

// State Sidebar
const targetCount = ref(0);
const downCount = ref(0);
const nodeStatus = ref({ proxmox: '...', icmp: '...', tcp: '...' });

const userProfile = ref({
  name: 'Administrator',
  email: 'admin@diskominfo.go.id',
  role: 'Admin',
  initials: 'AD'
});

let pollTimer = null;

// Fungsi Mengambil Data Sidebar
const fetchSidebarData = async () => {
  try {
    // 1. Ambil jumlah target dan deteksi target yang DOWN
    const resTargets = await fetch('/api/targets');
    if (resTargets.ok) {
      const dataTargets = await resTargets.json();
      if (dataTargets.success) {
        targetCount.value = dataTargets.data.length;
        downCount.value = dataTargets.data.filter(t => t.status === 'DOWN').length;
      }
    }

    // 2. Ambil status Konektivitas Node
    const resStatus = await fetch('/api/system/status');
    if (resStatus.ok) {
      const dataStatus = await resStatus.json();
      if (dataStatus.success) {
        nodeStatus.value = dataStatus.data;
      }
    } else {
      throw new Error("Server error");
    }
  } catch (error) {
    // Jika koneksi API / Server terputus
    nodeStatus.value.icmp = 'DOWN';
    nodeStatus.value.tcp = 'DOWN';
  }
};

const handleLogout = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userData');
  router.push('/login');
};

onMounted(() => {
  const storedUser = localStorage.getItem('userData');
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    userProfile.value.name = parsedUser.name || 'Administrator';
    userProfile.value.email = parsedUser.email || parsedUser.username;
    userProfile.value.role = parsedUser.role || 'Admin';
    userProfile.value.initials = (parsedUser.name ? parsedUser.name.substring(0, 2).toUpperCase() : 'AD');
  }

  fetchSidebarData();
  
  pollTimer = setInterval(fetchSidebarData, 10000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>