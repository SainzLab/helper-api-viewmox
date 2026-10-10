<template>
  <main class="p-8 pb-12 overflow-x-hidden">
    <!-- Header Halaman -->
    <div class="flex justify-between items-end mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1 flex items-center gap-3">
          <i class="ph-bold ph-tree-structure text-moxgreen"></i> Daftar Layanan Target Monitoring
        </h2>
        <p class="text-slate-400 text-sm">Pemantauan status berkala untuk protokol ICMP (Ping) dan TCP Port di lingkungan Diskominfo.</p>
      </div>
      <div class="flex gap-3">
        <button class="px-4 py-2.5 border border-slate-700 bg-slate-800/50 text-slate-300 rounded-lg flex items-center gap-2 hover:bg-slate-700 text-sm font-medium transition">
          <i class="ph ph-funnel"></i> Filter Status
        </button>
        <button class="px-4 py-2.5 bg-moxgreen text-moxdark rounded-lg flex items-center gap-2 hover:bg-emerald-400 text-sm font-bold transition">
          <i class="ph-bold ph-plus-circle text-lg"></i> TAMBAH TARGET MONITORING
        </button>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-moxcard border border-slate-800 rounded-xl shadow-lg overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-800/50 border-b border-slate-700 text-[11px] uppercase tracking-wider text-slate-400">
            <th class="px-6 py-4 font-semibold w-1/3">Nama Layanan</th>
            <th class="px-6 py-4 font-semibold">Jenis Protokol</th>
            <th class="px-6 py-4 font-semibold">Target (IP / Port)</th>
            <th class="px-6 py-4 font-semibold">Latency / Terakhir Dicek</th>
            <th class="px-6 py-4 font-semibold">Status Terkini</th>
            <th class="px-6 py-4 font-semibold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-for="(target, index) in monitoringTargets" :key="index" 
              :class="['border-b border-slate-800/50 transition', target.status === 'DOWN' ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-slate-800/30']">
            
            <!-- Kolom Nama Layanan -->
            <td class="px-6 py-4">
              <p class="font-bold text-slate-200">{{ target.name }}</p>
              <p :class="['text-xs mt-0.5', target.status === 'DOWN' ? 'text-rose-500' : 'text-slate-400']">
                {{ target.desc }}
              </p>
            </td>
            
            <!-- Kolom Jenis Protokol -->
            <td class="px-6 py-4">
              <span class="inline-block bg-slate-900/80 border border-slate-700 text-blue-400 font-mono text-[10px] px-2.5 py-1 rounded">
                {{ target.protocol }}
              </span>
            </td>

            <!-- Kolom Target (IP/Port) -->
            <td class="px-6 py-4 text-slate-300 font-mono text-xs font-bold">
              {{ target.ipPort }}
            </td>
            
            <!-- Kolom Latency -->
            <td class="px-6 py-4 text-xs">
              <span :class="['font-bold', target.status === 'DOWN' ? 'text-rose-500' : 'text-white']">
                {{ target.latency }}
              </span>
              <span class="text-slate-500 ml-1">({{ target.lastCheck }})</span>
            </td>
            
            <!-- Kolom Status -->
            <td class="px-6 py-4">
              <span v-if="target.status === 'UP'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> UP
              </span>
              <span v-else class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> DOWN
              </span>
            </td>
            
            <!-- Kolom Aksi -->
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-3 text-slate-400">
                <button class="hover:text-white transition" title="Test Manual"><i class="ph ph-play text-lg"></i></button>
                <button class="hover:text-moxgreen transition" title="Pengaturan"><i class="ph ph-gear text-lg"></i></button>
                <button class="hover:text-rose-500 transition" title="Hapus"><i class="ph ph-trash text-lg"></i></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue';

// Data Mockup sesuai dengan desain gambar image_7742fe.png
const monitoringTargets = ref([
  {
    name: 'Core Gateway Diskominfo', desc: 'Router Utama Mikrotik CCR', 
    protocol: 'ICMP PING', ipPort: '10.10.0.1', 
    latency: '1.8 ms', lastCheck: '5 dtk lalu', status: 'UP'
  },
  {
    name: 'Portal Resmi Pemda', desc: 'Nginx Ingress Cluster PVE', 
    protocol: 'TCP SOCKET', ipPort: '10.10.10.25 : 443', 
    latency: '8.4 ms', lastCheck: '10 dtk lalu', status: 'UP'
  },
  {
    name: 'Server OPD Bappeda', desc: 'Link FO Gedung Bappeda RTO', 
    protocol: 'ICMP PING', ipPort: '10.20.15.2', 
    latency: 'TIMEOUT', lastCheck: '1 dtk lalu', status: 'DOWN'
  },
  {
    name: 'Cluster MySQL Galera', desc: 'Master DB Aplikasi Kepegawaian', 
    protocol: 'TCP SOCKET', ipPort: '10.10.20.100 : 3306', 
    latency: '1.1 ms', lastCheck: '3 dtk lalu', status: 'UP'
  },
  {
    name: 'PVE API Endpoint', desc: 'Backend Metrics Collector', 
    protocol: 'TCP SOCKET', ipPort: '10.10.1.10 : 8006', 
    latency: '3.2 ms', lastCheck: '15 dtk lalu', status: 'UP'
  }
]);
</script>