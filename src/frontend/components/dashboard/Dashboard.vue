<template>
  <main class="p-8 pb-12 overflow-x-hidden">
    <!-- Header Dashboard -->
    <div class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1">
           <i class="ph-bold ph-squares-four text-moxgreen"></i> Ringkasan Infrastruktur
        </h2>
        <p class="text-slate-400 text-sm">Pemantauan performa cluster Proxmox VE dan konektivitas jaringan.</p>
      </div>
      <div class="flex gap-3">
        <button class="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg flex items-center gap-2 hover:bg-slate-800 text-sm font-medium transition">
          <i class="ph-bold ph-arrows-clockwise"></i> Perbarui Data
        </button>
        <button class="px-4 py-2 bg-moxgreen text-moxdark rounded-lg flex items-center gap-2 hover:bg-emerald-400 text-sm font-bold transition">
          <i class="ph-bold ph-download-simple"></i> Ekspor Laporan
        </button>
      </div>
    </div>
    
    <!-- Widgets Grid -->
    <div class="grid grid-cols-4 gap-5 mb-6">
      <!-- Widget 1 -->
      <div class="bg-moxcard border border-slate-800 p-5 rounded-xl shadow-lg">
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pengguna</p>
          <div class="p-1.5 bg-slate-800/80 rounded-md text-indigo-400"><i class="ph ph-users text-lg"></i></div>
        </div>
        <h3 class="text-2xl font-bold text-white mb-1">14 <span class="text-sm font-normal text-slate-400">Akun Terdaftar</span></h3>
        <div class="flex items-center gap-1.5 text-xs text-moxgreen font-medium mt-4">
          <i class="ph-fill ph-check-circle"></i> 3 Role Aktif Terverifikasi
        </div>
      </div>

      <!-- Widget 2 -->
      <div class="bg-moxcard border border-slate-800 p-5 rounded-xl shadow-lg">
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Server Proxmox VE</p>
          <div class="p-1.5 bg-slate-800/80 rounded-md text-moxgreen"><i class="ph ph-hard-drives text-lg"></i></div>
        </div>
        <h3 class="text-2xl font-bold text-moxgreen mb-1">8 / 8 <span class="text-sm font-normal text-slate-400">Node Online</span></h3>
        <div class="flex items-center gap-1.5 text-xs text-moxgreen font-medium mt-4">
          <span class="w-1.5 h-1.5 rounded-full bg-moxgreen"></span> 100% Cluster Healthy
        </div>
      </div>

      <!-- Widget 3 -->
      <div class="bg-moxcard border border-slate-800 p-5 rounded-xl shadow-lg">
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target Ping (ICMP)</p>
          <div class="p-1.5 bg-slate-800/80 rounded-md text-amber-500"><i class="ph ph-waves text-lg"></i></div>
        </div>
        <h3 class="text-2xl font-bold text-white mb-1">24 <span class="text-sm font-bold text-rose-500">(1 RTO)</span></h3>
        <div class="flex items-center gap-1.5 text-xs text-slate-400 mt-4">
          <i class="ph ph-clock-counter-clockwise"></i> Avg Latency: <span class="text-white font-medium">12.4 ms</span>
        </div>
      </div>

      <!-- Widget 4 -->
      <div class="bg-moxcard border border-slate-800 p-5 rounded-xl shadow-lg">
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target TCP Port</p>
          <div class="p-1.5 bg-slate-800/80 rounded-md text-purple-400"><i class="ph ph-cpu text-lg"></i></div>
        </div>
        <h3 class="text-2xl font-bold text-white mb-1">42 <span class="text-sm font-normal text-slate-400">Port Aktif</span></h3>
        <div class="flex items-center gap-1.5 text-xs text-moxgreen font-medium mt-4">
          <i class="ph-bold ph-check"></i> OK
        </div>
      </div>
    </div>

    <!-- Chart Area -->
    <div class="bg-moxcard border border-slate-800 p-6 rounded-xl shadow-lg mb-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-md font-bold text-white flex items-center gap-2">
            <i class="ph-bold ph-trend-up text-moxgreen"></i> Rata-rata Penggunaan CPU & RAM (24 Jam Terakhir)
          </h3>
          <p class="text-xs text-slate-400 mt-1">Agregasi performa 8 Node Proxmox VE</p>
        </div>
        <div class="flex items-center gap-6">
          <div class="flex gap-4 text-xs font-medium">
            <span class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-moxgreen"></div> CPU Usage (%)</span>
            <span class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-blue-400"></div> RAM Usage (%)</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="text-slate-400">Interval:</span>
            <select class="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 outline-none focus:border-moxgreen">
              <option>1 Jam</option>
              <option>6 Jam</option>
              <option>1 Hari</option>
            </select>
          </div>
        </div>
      </div>
      <!-- Canvas Wrapper -->
      <div class="h-64 w-full relative">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>

    <!-- Table Area -->
    <div class="bg-moxcard border border-slate-800 p-6 rounded-xl shadow-lg">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-md font-bold text-white flex items-center gap-2">
            <i class="ph-bold ph-warning text-rose-500"></i> Log Alert & Incident Terbaru
          </h3>
          <p class="text-xs text-slate-400 mt-1">Notifikasi otomatis berdasarkan batas threshold ambang batas</p>
        </div>
        <a href="#" class="text-xs text-moxgreen hover:text-emerald-400 font-medium transition">Lihat Semua Log &rarr;</a>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-700 text-[11px] uppercase tracking-wider text-slate-400">
              <th class="pb-3 font-semibold">Waktu (WIB)</th>
              <th class="pb-3 font-semibold">Severity</th>
              <th class="pb-3 font-semibold">Komponen Target</th>
              <th class="pb-3 font-semibold w-5/12">Deskripsi Peristiwa</th>
              <th class="pb-3 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr class="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
              <td class="py-4 text-slate-300 font-mono text-xs">12:31:04</td>
              <td class="py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> CRITICAL
                </span>
              </td>
              <td class="py-4 font-medium text-slate-200">Target Ping OPD-Bappeda</td>
              <td class="py-4 text-slate-400 text-xs">Koneksi RTO (Request Time Out) > 4 paket berturut-turut</td>
              <td class="py-4 text-right font-bold text-rose-500 text-xs">INVESTIGASI</td>
            </tr>
            <tr class="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
              <td class="py-4 text-slate-300 font-mono text-xs">11:45:28</td>
              <td class="py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> WARNING
                </span>
              </td>
              <td class="py-4 font-medium text-slate-200">Node PVE-Node-03</td>
              <td class="py-4 text-slate-400 text-xs">Penggunaan CPU melebihi ambang batas (84.6% > 80.0%)</td>
              <td class="py-4 text-right font-bold text-amber-500 text-xs">TRIGGERED</td>
            </tr>
            <tr class="hover:bg-slate-800/30 transition">
              <td class="py-4 text-slate-300 font-mono text-xs">09:12:00</td>
              <td class="py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> RESOLVED
                </span>
              </td>
              <td class="py-4 font-medium text-slate-200">TCP Port 3306 (MySQL SIKD)</td>
              <td class="py-4 text-slate-400 text-xs">Port kembali merespons dengan latency 2.1 ms</td>
              <td class="py-4 text-right font-bold text-emerald-500 text-xs">NORMAL</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const chartCanvas = ref(null);

onMounted(() => {
  if (window.Chart && chartCanvas.value) {
    const ctx = chartCanvas.value.getContext('2d');
    
    const gradientCPU = ctx.createLinearGradient(0, 0, 0, 300);
    gradientCPU.addColorStop(0, 'rgba(16, 185, 129, 0.2)'); 
    gradientCPU.addColorStop(1, 'rgba(16, 185, 129, 0)');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', 'Now'],
        datasets: [
          {
            label: 'CPU Usage',
            data: [28, 22, 19, 21, 45, 68, 80, 75, 65, 52, 40, 35, 42],
            borderColor: '#10b981',
            backgroundColor: gradientCPU,
            borderWidth: 2,
            pointBackgroundColor: '#0f172a',
            pointBorderColor: '#10b981',
            pointBorderWidth: 2,
            pointRadius: 3,
            fill: true,
            tension: 0.4 
          },
          {
            label: 'RAM Usage',
            data: [54, 55, 54, 56, 60, 65, 71, 68, 69, 65, 60, 58, 61],
            borderColor: '#60a5fa',
            borderWidth: 2,
            pointBackgroundColor: '#0f172a',
            pointBorderColor: '#60a5fa',
            pointBorderWidth: 2,
            pointRadius: 3,
            fill: false,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false } 
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(51, 65, 85, 0.4)',
              drawBorder: false,
            },
            ticks: {
              color: '#94a3b8',
              font: { size: 10 }
            }
          },
          y: {
            grid: {
              color: 'rgba(51, 65, 85, 0.4)',
              drawBorder: false,
            },
            ticks: {
              color: '#94a3b8',
              font: { size: 10 },
              callback: function(value) { return value + '%' }, 
              stepSize: 10
            },
            min: 0,
            max: 100
          }
        },
        interaction: {
          mode: 'index',
          intersect: false,
        }
      }
    });
  }
});
</script>