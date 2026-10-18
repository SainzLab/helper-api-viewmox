<template>
  <aside class="w-64 bg-moxcard h-screen fixed left-0 top-0 border-r border-slate-800 flex flex-col z-20">
    <!-- Logo -->
    <div class="p-5 border-b border-slate-800">
      <h1 class="text-xl font-bold flex items-center gap-2 text-white">
        <i class="ph-bold ph-activity text-moxgreen text-2xl"></i>
        ProxView
      </h1>
      <p class="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Monitoring Proxmox</p>
    </div>

    <!-- Navigation -->
    <div class="flex-1 overflow-y-auto py-4 flex flex-col gap-6 no-scrollbar">
      <!-- Menu Utama -->
      <nav class="px-4">
        <p class="text-[11px] text-slate-500 mb-3 font-bold tracking-wider uppercase">Menu Utama</p>
        <ul class="space-y-1">
          <li>
            <router-link to="/dashboard" 
              :class="['flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition', 
                        route.name === 'dashboard' ? 'bg-moxgreen/10 text-moxgreen border border-moxgreen/20 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
              <div class="flex items-center gap-3"><i class="ph ph-squares-four text-lg"></i> Dashboard</div>
            </router-link>
          </li>
          <li>
            <router-link to="/kelola-pengguna" 
              :class="['flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition', 
                        route.name === 'kelola-pengguna' ? 'bg-moxgreen/10 text-moxgreen border border-moxgreen/20 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
              <i class="ph ph-users text-lg"></i> Kelola Pengguna
            </router-link>
          </li>
          <li>
            <router-link to="/target-monitoring" 
                :class="['flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition', 
                          route.name === 'target-monitoring' ? 'bg-moxgreen/10 text-moxgreen border border-moxgreen/20 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
                <div class="flex items-center gap-3"><i class="ph ph-graph text-lg"></i> Monitoring</div>
                <span v-if="downCount > 0" class="text-xs px-2 py-0.5 rounded border bg-rose-500 text-white border-rose-500 font-bold animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)] transition-all">
                  {{ downCount }}
                </span>
            </router-link>
          </li>
          <li>
            <router-link to="/rekap-gangguan" 
                :class="['flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition', 
                          route.name === 'rekap-gangguan' ? 'bg-moxgreen/10 text-moxgreen border border-moxgreen/20 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
                <i class="ph ph-ticket text-lg"></i> Rekap Insiden
                <span v-if="downCount > 0" class="ml-auto w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            </router-link>
          </li>
          <li>
            <router-link to="/threshold-config" 
                :class="['flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition', 
                          route.name === 'threshold-config' ? 'bg-moxgreen/10 text-moxgreen border border-moxgreen/20 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
                <i class="ph ph-sliders text-lg"></i> Threshold Config
            </router-link>
          </li>
          <li>
            <router-link to="/proxmox-config" 
                :class="['flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition', 
                          route.name === 'proxmox-config' ? 'bg-moxgreen/10 text-moxgreen border border-moxgreen/20 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
                <i class="ph ph-hard-drives text-lg"></i> Proxmox API Config
            </router-link>
          </li>
          <li>
            <router-link to="/log" 
                :class="['flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition', 
                          route.name === 'Log' ? 'bg-moxgreen/10 text-moxgreen border border-moxgreen/20 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
                <i class="ph ph-terminal text-lg"></i> Log
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- Konektivitas Node Dinamis -->
      <nav class="px-4">
        <p class="text-[11px] text-slate-500 mb-3 font-bold tracking-wider uppercase">Konektivitas Node</p>
        <ul class="space-y-2.5">
          <!-- Proxmox -->
          <li class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2 text-slate-300">
              <div class="w-2 h-2 rounded-full transition-colors" :class="nodeStatus.proxmox === 'ACTIVE' ? 'bg-moxgreen shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'"></div>
              Proxmox Cluster
            </div>
            <span class="text-xs font-bold transition-colors" :class="nodeStatus.proxmox === 'ACTIVE' ? 'text-moxgreen' : 'text-rose-500'">{{ nodeStatus.proxmox }}</span>
          </li>
          <!-- ICMP -->
          <li class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2 text-slate-300">
              <div class="w-2 h-2 rounded-full transition-colors" :class="nodeStatus.icmp === 'ACTIVE' ? 'bg-moxgreen shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'"></div>
              ICMP / Ping
            </div>
            <span class="text-xs font-bold transition-colors" :class="nodeStatus.icmp === 'ACTIVE' ? 'text-moxgreen' : 'text-rose-500'">{{ nodeStatus.icmp }}</span>
          </li>
          <!-- TCP -->
          <li class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2 text-slate-300">
              <div class="w-2 h-2 rounded-full transition-colors" :class="nodeStatus.tcp === 'ACTIVE' ? 'bg-moxgreen shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'"></div>
              TCP Port
            </div>
            <span class="text-xs font-bold transition-colors" :class="nodeStatus.tcp === 'ACTIVE' ? 'text-moxgreen' : 'text-rose-500'">{{ nodeStatus.tcp }}</span>
          </li>
        </ul>
      </nav>
    </div>

    <!-- User Profile & Logout -->
    <div class="p-4 border-t border-slate-800">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-9 h-9 rounded-full bg-moxgreen text-moxdark flex items-center justify-center font-bold text-sm">
          {{ userProfile.initials }}
        </div>
        <div class="overflow-hidden">
          <p class="text-sm text-white font-medium truncate">{{ userProfile.name }}</p>
          <p class="text-xs text-slate-400 truncate">{{ userProfile.email || userProfile.role }}</p>
        </div>
      </div>
      <button @click="handleLogout" class="w-full flex items-center justify-center gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10 py-2 rounded-lg text-sm font-medium transition">
        <i class="ph ph-sign-out text-lg"></i> Keluar Sistem
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