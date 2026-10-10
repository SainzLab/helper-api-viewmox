<template>
  <main class="p-8 pb-12 overflow-x-hidden">
    <!-- Header Halaman -->
    <div class="flex justify-between items-end mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1">
           <i class="ph-bold ph-ticket text-moxgreen"></i> Rekap & Pelacakan Status Gangguan
        </h2>
        <p class="text-slate-400 text-sm">Pelacakan proses perbaikan sistem & jaringan secara real-time.</p>
      </div>
      <div class="flex gap-3">
        <button class="px-5 py-2.5 bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg text-sm font-medium transition">
          Export Laporan
        </button>
        <button class="px-5 py-2.5 bg-moxgreen text-moxdark rounded-lg flex items-center gap-2 hover:bg-emerald-400 text-sm font-bold transition">
          <i class="ph-bold ph-plus"></i> Buat Tiket Baru
        </button>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="bg-moxcard border border-slate-800 rounded-xl shadow-lg mb-6 flex">
      <div class="flex-1 p-5 border-r border-slate-800/80 flex items-center gap-4">
        <div class="w-1.5 h-10 bg-rose-500 rounded-full"></div>
        <div>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gangguan Aktif</p>
          <h3 class="text-2xl font-bold text-white leading-none">3 <span class="text-sm font-medium text-rose-500">Insiden</span></h3>
        </div>
      </div>
      <div class="flex-1 p-5 border-r border-slate-800/80 flex items-center gap-4">
        <div class="w-1.5 h-10 bg-amber-500 rounded-full"></div>
        <div>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dalam Penanganan</p>
          <h3 class="text-2xl font-bold text-white leading-none">2 <span class="text-sm font-medium text-amber-500">Proses</span></h3>
        </div>
      </div>
      <div class="flex-1 p-5 border-r border-slate-800/80 flex items-center gap-4">
        <div class="w-1.5 h-10 bg-emerald-500 rounded-full"></div>
        <div>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Selesai</p>
          <h3 class="text-2xl font-bold text-white leading-none">9 <span class="text-sm font-medium text-emerald-500">Tiket</span></h3>
        </div>
      </div>
      <div class="flex-1 p-5 flex items-center gap-4">
        <div class="w-1.5 h-10 bg-cyan-400 rounded-full"></div>
        <div>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rata-rata MTTR</p>
          <h3 class="text-2xl font-bold text-white leading-none">24 <span class="text-sm font-medium text-cyan-400">Menit</span></h3>
        </div>
      </div>
    </div>

    <!-- Filter & Search -->
    <div class="flex gap-4 mb-6">
      <div class="relative flex-1">
        <i class="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg"></i>
        <input 
          type="text" 
          placeholder="Cari tiket / server / IP / jenis gangguan..." 
          class="w-full bg-slate-900/50 border border-slate-800 text-white text-sm rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-moxgreen transition shadow-sm"
        >
      </div>
      <select class="bg-slate-900/50 border border-slate-800 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-moxgreen shadow-sm w-48 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22%2394a3b8%22%20viewBox%3D%220%200%20256%20256%22%3E%3Cpath%20d%3D%22M213.66%2C101.66l-80%2C80a8%2C8%2C0%2C0%2C1-11.32%2C0l-80-80A8%2C8%2C0%2C0%2C1%2C53.66%2C90.34L128%2C164.69l74.34-74.35a8%2C8%2C0%2C0%2C1%2C11.32%2C11.32Z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center]">
        <option>Semua Status</option>
        <option>Gangguan</option>
        <option>Proses</option>
        <option>Selesai</option>
      </select>
    </div>

    <!-- Ticket List -->
    <div class="space-y-4">
      
      <!-- List Items di-generate menggunakan v-for -->
      <div v-for="(ticket, index) in tickets" :key="index" 
           class="bg-moxcard border rounded-xl overflow-hidden shadow-lg transition-colors duration-300"
           :class="ticket.isExpanded ? 'border-slate-700 ring-1 ring-slate-800' : 'border-slate-800/80'">
        
        <!-- Baris Utama Tiket (Header) -->
        <div class="flex items-center p-5 relative" 
             :class="ticket.isExpanded ? 'bg-slate-800/30' : 'hover:bg-slate-800/30'">
          <!-- Indikator Warna Garis Kiri -->
          <div class="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-10 rounded-full" :class="ticket.indicatorColor"></div>
          
          <div class="pl-6 flex-1">
            <div class="text-[11px] font-bold text-slate-400 mb-1">
              <span class="text-white">{{ ticket.id }}</span> &bull; <span class="text-moxgreen">{{ ticket.time }}</span>
            </div>
            <h3 class="text-base font-bold text-white mb-1" :class="ticket.isExpanded ? 'text-moxgreen' : ''">
              {{ ticket.title }}
            </h3>
            <p class="text-xs text-slate-500 flex items-center gap-1.5">
              <i class="ph ph-hard-drive"></i> {{ ticket.target }}
            </p>
          </div>
          
          <div>
            <button @click="ticket.isExpanded = !ticket.isExpanded" 
                    class="px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
                    :class="ticket.isExpanded 
                      ? 'bg-moxgreen text-moxdark hover:bg-emerald-400' 
                      : 'border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'">
              <template v-if="ticket.isExpanded">
                <i class="ph-bold ph-shield-check"></i> Tutup Pelacakan <i class="ph-bold ph-caret-up ml-1"></i>
              </template>
              <template v-else>
                <i class="ph-bold ph-shield-check"></i> {{ ticket.actionText }} <i class="ph-bold ph-caret-right ml-1"></i>
              </template>
            </button>
          </div>
        </div>

        <!-- Bagian Expand (Hanya tampil jika di-klik/isExpanded = true) -->
        <div v-if="ticket.isExpanded" class="border-t border-slate-800/80 p-6 bg-slate-900/20">
          
          <div class="flex items-center gap-2 mb-8">
            <div class="w-1.5 h-1.5 rounded-full bg-moxgreen shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <h4 class="text-[11px] font-bold text-white uppercase tracking-wider">Status Perbaikan</h4>
          </div>

          <!-- PERBAIKAN BUG TIMELINE: -->
          <div class="relative px-4 mb-10 mt-6">
            <!-- Garis Background (Slate) -->
            <!-- left-16 & right-16 menyesuaikan dengan titik tengah node w-24 di tepi kiri dan kanan -->
            <div class="absolute top-4 left-16 right-16 h-[2px] bg-slate-800 z-0"></div>
            <!-- Garis Progress (Hijau ke Orange) -->
            <div class="absolute top-4 left-16 h-[2px] bg-gradient-to-r from-moxgreen to-amber-500 z-0" style="width: 50%;"></div>

            <!-- Nodes -->
            <!-- Menggunakan items-start memastikan ikon bulat selalu nempel di atas dan sejajar sama garis -->
            <div class="relative z-10 flex justify-between items-start">
              
              <!-- Node 1 -->
              <div class="flex flex-col items-center gap-3 w-24">
                <div class="w-8 h-8 shrink-0 rounded-full bg-moxgreen text-moxdark flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  <i class="ph-bold ph-check text-lg"></i>
                </div>
                <span class="text-xs font-bold text-slate-300 text-center leading-tight">Gangguan Terdeteksi</span>
              </div>

              <!-- Node 3 -->
              <div class="flex flex-col items-center gap-3 w-24">
                <div class="w-8 h-8 shrink-0 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  <i class="ph-fill ph-wrench text-lg"></i>
                </div>
                <span class="text-xs font-bold text-amber-500 text-center leading-tight">Perbaikan</span>
              </div>

              <!-- Node 4 -->
              <div class="flex flex-col items-center gap-3 w-24">
                <div class="w-8 h-8 shrink-0 rounded-full bg-slate-800 text-slate-500 border border-slate-700 flex items-center justify-center">
                  <span class="font-bold text-sm">4</span>
                </div>
                <span class="text-xs font-medium text-slate-500 text-center leading-tight">Selesai</span>
              </div>
            </div>
          </div>

          <!-- Footer Internal Expand -->
          <div class="bg-slate-900/50 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
            <p class="text-xs text-slate-400">
              Teknisi <span class="font-bold text-slate-300">Rizky Ananda (NetOps Diskominfo)</span>
            </p>
            <button class="px-4 py-2 bg-moxgreen text-moxdark rounded-lg flex items-center gap-2 hover:bg-emerald-400 text-sm font-bold transition">
              <i class="ph-bold ph-check"></i> Tandai Selesai
            </button>
          </div>

        </div>
      </div>

    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue';

// State Data Mockup berdasarkan image_79753c.png
const tickets = ref([
  {
    id: '#INC-2025-0042',
    time: '15 mnt lalu (12:31 WIB)',
    title: 'Koneksi RTO Link FO Gedung Bappeda Putus',
    target: '10.20.15.2 (Jalur FO Bappeda)',
    indicatorColor: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
    actionText: 'Lacak Status',
    isExpanded: true // Tiket pertama otomatis terbuka seperti di gambar
  },
  {
    id: '#INC-2025-0041',
    time: '11:45 WIB',
    title: 'Node PVE-Node-03 CPU Spike High Load 94%',
    target: 'Proxmox Cluster Node 3 (10.10.10.13)',
    indicatorColor: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    actionText: 'Lacak Status',
    isExpanded: false
  },
  {
    id: '#INC-2025-0040',
    time: '09:12 WIB',
    title: 'TCP Port 3306 MySQL SIKD Galera Latency High',
    target: '10.10.20.100:3306',
    indicatorColor: 'bg-emerald-500',
    actionText: 'Lihat Detail',
    isExpanded: false
  },
  {
    id: '#INC-2025-0038',
    time: '06:20 WIB',
    title: 'Core Gateway Mikrotik CCR BGP Session Flapping',
    target: '10.10.0.1 (CCR 1072)',
    indicatorColor: 'bg-emerald-500',
    actionText: 'Lihat Detail',
    isExpanded: false
  }
]);
</script>