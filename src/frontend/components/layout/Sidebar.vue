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
        <!-- Bagian dalam Sidebar.vue, perbarui tag Menu Utama -->
        <ul class="space-y-1">
        <!-- Menu Dashboard -->
        <li>
            <a href="#" @click.prevent="$emit('navigate', 'dashboard')" 
            :class="['flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition', 
                        activeMenu === 'dashboard' ? 'bg-moxgreen/10 text-moxgreen border border-moxgreen/20 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
            <div class="flex items-center gap-3"><i class="ph ph-squares-four text-lg"></i> Dashboard</div>
            </a>
        </li>
        <li>
            <a href="#" @click.prevent="$emit('navigate', 'kelola-pengguna')" 
            :class="['flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition', 
                        activeMenu === 'kelola-pengguna' ? 'bg-moxgreen/10 text-moxgreen border border-moxgreen/20 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
            <i class="ph ph-users text-lg"></i> Kelola Pengguna
            </a>
        </li>
        <li>
            <a href="#" @click.prevent="$emit('navigate', 'target-monitoring')" 
                :class="['flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition', 
                        activeMenu === 'target-monitoring' ? 'bg-moxgreen/10 text-moxgreen border border-moxgreen/20 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
                <div class="flex items-center gap-3"><i class="ph ph-graph text-lg"></i> Monitoring Target</div>
                <span :class="['text-xs px-2 py-0.5 rounded border', 
                            activeMenu === 'target-monitoring' ? 'bg-moxgreen text-moxdark border-moxgreen font-bold' : 'bg-slate-800 text-slate-300 border-slate-700']">
                18
                </span>
            </a>
        </li>
        <li>
            <a href="#" @click.prevent="$emit('navigate', 'rekap-gangguan')" 
                :class="['flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition', 
                        activeMenu === 'rekap-gangguan' ? 'bg-moxgreen/10 text-moxgreen border border-moxgreen/20 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
                <i class="ph ph-ticket text-lg"></i> Rekap Insiden
                <!-- Indikator notifikasi kecil, opsi tambahan -->
                <span v-if="activeMenu !== 'rekap-gangguan'" class="ml-auto w-2 h-2 rounded-full bg-rose-500"></span>
            </a>
        </li>
        <li>
            <a href="#" @click.prevent="$emit('navigate', 'threshold-config')" 
                :class="['flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition', 
                        activeMenu === 'threshold-config' ? 'bg-moxgreen/10 text-moxgreen border border-moxgreen/20 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
                <i class="ph ph-sliders text-lg"></i> Threshold Config
            </a>
        </li>
        <li>
            <a href="#" @click.prevent="$emit('navigate', 'proxmox-config')" 
                :class="['flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition', 
                        activeMenu === 'proxmox-config' ? 'bg-moxgreen/10 text-moxgreen border border-moxgreen/20 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50']">
                <i class="ph ph-hard-drives text-lg"></i> Proxmox API Config
            </a>
        </li>
        </ul>
      </nav>

      <!-- Konektivitas Node -->
      <nav class="px-4">
        <p class="text-[11px] text-slate-500 mb-3 font-bold tracking-wider uppercase">Konektivitas Node</p>
        <ul class="space-y-2.5">
          <li class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2 text-slate-300">
              <div class="w-2 h-2 rounded-full bg-moxgreen shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              Proxmox Cluster
            </div>
            <span class="text-xs font-bold text-moxgreen">ACTIVE</span>
          </li>
          <li class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2 text-slate-300">
              <div class="w-2 h-2 rounded-full bg-moxgreen shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              ICMP / Ping
            </div>
            <span class="text-xs font-bold text-moxgreen">ACTIVE</span>
          </li>
          <li class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2 text-slate-300">
              <div class="w-2 h-2 rounded-full bg-moxgreen shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              TCP Port
            </div>
            <span class="text-xs font-bold text-moxgreen">ACTIVE</span>
          </li>
        </ul>
      </nav>
    </div>

    <!-- User Profile & Logout -->
    <div class="p-4 border-t border-slate-800">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-9 h-9 rounded-full bg-moxgreen text-moxdark flex items-center justify-center font-bold text-sm">
          AD
        </div>
        <div class="overflow-hidden">
          <p class="text-sm text-white font-medium truncate">Administrator Diskominfo</p>
          <p class="text-xs text-slate-400 truncate">admin@diskominfo.go.id</p>
        </div>
      </div>
      <button class="w-full flex items-center justify-center gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10 py-2 rounded-lg text-sm font-medium transition">
        <i class="ph ph-sign-out text-lg"></i> Keluar Sistem
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* Sembunyikan scrollbar bawaan browser tapi tetap bisa scroll */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>

<script setup>
defineProps({
  activeMenu: {
    type: String,
    default: 'dashboard'
  }
});
defineEmits(['navigate']);
</script>