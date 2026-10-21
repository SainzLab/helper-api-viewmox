<template>
  <main class="p-8 pb-12 overflow-x-hidden">
    <!-- Header Dashboard -->
    <div class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1 flex items-center gap-2.5">
          <i class="ph-bold ph-squares-four text-moxgreen"></i> Ringkasan Infrastruktu
        </h2>
        <p class="text-slate-400 text-sm">Pemantauan performa cluster Proxmox VE dan konektivitas jaringan secara langsung.</p>
      </div>
      <div class="flex gap-3 items-center">
        <button
          @click="fetchDashboardData(true)"
          class="px-4 py-2 border border-slate-700 bg-slate-800/50 text-slate-300 rounded-lg flex items-center gap-2 hover:bg-slate-700 hover:text-emerald-400 text-sm font-medium transition shadow-sm"
          title="Segarkan Data Secara Manual"
        >
          <i class="ph-bold ph-arrows-clockwise text-base" :class="{ 'animate-spin text-emerald-400': isRefreshing }"></i>
        </button>
        <button
          @click="exportDashboardPdf"
          :disabled="isExporting"
          class="px-4 py-2 bg-moxgreen text-moxdark rounded-lg flex items-center gap-2 hover:bg-emerald-400 disabled:opacity-50 text-sm font-bold transition shadow-lg shadow-emerald-500/20"
        >
          <i class="ph-bold" :class="isExporting ? 'ph-spinner animate-spin' : 'ph-download-simple'"></i>
          {{ isExporting ? 'Menyiapkan PDF...' : 'Ekspor Laporan' }}
        </button>
      </div>
    </div>
    
    <!-- Widgets Grid (4 Kartu Utama) -->
    <div class="grid grid-cols-4 gap-5 mb-6">
      <!-- Widget 1: Total Pengguna -->
      <div class="bg-moxcard border border-slate-800 p-5 rounded-xl shadow-lg">
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pengguna</p>
          <div class="p-1.5 bg-slate-800/80 rounded-md text-indigo-400"><i class="ph ph-users text-lg"></i></div>
        </div>
        <h3 class="text-2xl font-bold text-white mb-1">
          {{ summary.users.total }} <span class="text-sm font-normal text-slate-400">Akun Terdaftar</span>
        </h3>
        <div class="flex items-center gap-1.5 text-xs text-moxgreen font-medium mt-4">
          <i class="ph-fill ph-check-circle"></i>
          {{ summary.users.active }} Akun Aktif ({{ summary.users.active_roles }} Role Terverifikasi)
        </div>
      </div>

      <!-- Widget 2: Server Proxmox VE -->
      <div class="bg-moxcard border border-slate-800 p-5 rounded-xl shadow-lg">
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Server Proxmox VE</p>
          <div class="p-1.5 bg-slate-800/80 rounded-md text-moxgreen"><i class="ph ph-hard-drives text-lg"></i></div>
        </div>
        <h3 class="text-2xl font-bold mb-1" :class="summary.proxmox.online_nodes > 0 && summary.proxmox.offline_nodes === 0 ? 'text-moxgreen' : (summary.proxmox.online_nodes > 0 ? 'text-amber-400' : 'text-rose-500')">
          {{ summary.proxmox.online_nodes }} / {{ summary.proxmox.total_nodes }}
          <span class="text-sm font-normal text-slate-400">Node Online</span>
        </h3>
        <div class="flex items-center justify-between text-xs font-medium mt-4">
          <span class="flex items-center gap-1.5" :class="summary.proxmox.health_percent === 100 ? 'text-moxgreen' : (summary.proxmox.health_percent > 0 ? 'text-amber-400' : 'text-rose-500')">
            <span class="w-1.5 h-1.5 rounded-full" :class="summary.proxmox.health_percent === 100 ? 'bg-moxgreen' : (summary.proxmox.health_percent > 0 ? 'bg-amber-400' : 'bg-rose-500')"></span>
            {{ summary.proxmox.health_percent }}% Cluster Healthy
          </span>
          <span class="text-[11px] text-slate-400">{{ summary.proxmox.running_vms }}/{{ summary.proxmox.total_vms }} VM/CT</span>
        </div>
      </div>

      <!-- Widget 3: Target Ping (ICMP) -->
      <div class="bg-moxcard border border-slate-800 p-5 rounded-xl shadow-lg">
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target Ping (ICMP)</p>
          <div class="p-1.5 bg-slate-800/80 rounded-md text-amber-500"><i class="ph ph-waves text-lg"></i></div>
        </div>
        <h3 class="text-2xl font-bold text-white mb-1">
          {{ summary.icmp.total }}
          <span v-if="summary.icmp.down > 0" class="text-sm font-bold text-rose-500">({{ summary.icmp.down }} RTO)</span>
          <span v-else class="text-sm font-normal text-slate-400">Target ({{ summary.icmp.up }} UP)</span>
        </h3>
        <div class="flex items-center gap-1.5 text-xs text-slate-400 mt-4">
          <i class="ph ph-clock-counter-clockwise"></i> Avg Latency:
          <span class="text-white font-medium">{{ summary.icmp.avg_latency_ms }} ms</span>
        </div>
      </div>

      <!-- Widget 4: Target TCP Port -->
      <div class="bg-moxcard border border-slate-800 p-5 rounded-xl shadow-lg">
        <div class="flex justify-between items-start mb-2">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target TCP Port</p>
          <div class="p-1.5 bg-slate-800/80 rounded-md text-purple-400"><i class="ph ph-cpu text-lg"></i></div>
        </div>
        <h3 class="text-2xl font-bold text-white mb-1">
          {{ summary.tcp.total }}
          <span v-if="summary.tcp.down > 0" class="text-sm font-bold text-rose-500">({{ summary.tcp.down }} Down)</span>
          <span v-else class="text-sm font-normal text-slate-400">Port Aktif</span>
        </h3>
        <div class="flex items-center justify-between text-xs mt-4">
          <span v-if="summary.tcp.down === 0 && summary.tcp.active > 0" class="flex items-center gap-1.5 text-moxgreen font-medium">
            <i class="ph-bold ph-check"></i> OK ({{ summary.tcp.up }} UP)
          </span>
          <span v-else-if="summary.tcp.down > 0" class="flex items-center gap-1.5 text-rose-500 font-medium">
            <i class="ph-bold ph-warning"></i> {{ summary.tcp.down }} Port Terputus
          </span>
          <span v-else class="text-slate-500">Belum ada target aktif</span>
          <span class="text-slate-400">Avg: <strong class="text-white">{{ summary.tcp.avg_latency_ms }} ms</strong></span>
        </div>
      </div>
    </div>

    <!-- Chart Area 1: Rata-rata Penggunaan CPU, RAM & IO Delay Proxmox VE -->
    <div class="bg-moxcard border border-slate-800 p-6 rounded-xl shadow-lg mb-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-md font-bold text-white flex items-center gap-2">
            <i class="ph-bold ph-trend-up text-moxgreen"></i> Rata-rata Penggunaan CPU, RAM &amp; IO Delay ({{ timeframeLabel }})
          </h3>
          <p class="text-xs text-slate-400 mt-1">
            Agregasi performa {{ summary.proxmox.total_nodes }} Node Proxmox VE
            <span v-if="summary.proxmox.node_names.length" class="text-slate-500">({{ summary.proxmox.node_names.join(', ') }})</span>
            &bull; Saat ini: CPU <span class="text-moxgreen font-bold">{{ summary.proxmox.avg_cpu }}%</span> | RAM <span class="text-blue-400 font-bold">{{ summary.proxmox.avg_ram }}%</span> | IO Delay <span class="text-amber-400 font-bold">{{ summary.proxmox.avg_io }}%</span>
          </p>
        </div>
        <div class="flex items-center gap-6">
          <div class="flex gap-4 text-xs font-medium">
            <span class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-moxgreen"></div> CPU Usage (%)</span>
            <span class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-blue-400"></div> RAM Usage (%)</span>
            <span class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-amber-400"></div> IO Delay (%)</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="text-slate-400">Rekap:</span>
            <select
              v-model="selectedTimeframe"
              @change="fetchDashboardData(true)"
              class="bg-slate-800 border border-slate-700 text-white rounded px-2.5 py-1.5 outline-none focus:border-moxgreen cursor-pointer"
            >
              <option value="1h">1 Jam</option>
              <option value="24h">24 Jam</option>
              <option value="7d">7 Hari</option>
            </select>
          </div>
        </div>
      </div>
      <!-- Canvas Wrapper -->
      <div class="h-64 w-full relative">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>

    <!-- Chart Area 2: Grafik & Ringkasan Total Uptime, Total Downtime, MTTR & Availability -->
    <div class="bg-moxcard border border-slate-800 p-6 rounded-xl shadow-lg mb-6">
      <div class="flex flex-wrap justify-between items-center gap-4 mb-5">
        <div>
          <h3 class="text-md font-bold text-white flex items-center gap-2">
            <i class="ph-bold ph-chart-bar text-moxgreen"></i> Analitik Kinerja SLA (Uptime, Downtime, MTTR &amp; Availability)
          </h3>
          <p class="text-xs text-slate-400 mt-1">
            Rekap keandalan sistem &bull; {{ slaFilterLabel }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Filter Level Severity SLA -->
          <div class="flex bg-slate-900/60 border border-slate-800 rounded-lg p-1">
            <button @click="setSlaSeverity('ALL')" class="px-3 py-1 rounded-md text-xs font-bold transition" :class="slaSeverity === 'ALL' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'">Semua</button>
            <button @click="setSlaSeverity('DOWN')" class="px-3 py-1 rounded-md text-xs font-bold transition" :class="slaSeverity === 'DOWN' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-rose-400'">Down</button>
            <button @click="setSlaSeverity('CRITICAL')" class="px-3 py-1 rounded-md text-xs font-bold transition" :class="slaSeverity === 'CRITICAL' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-orange-400'">Critical</button>
            <button @click="setSlaSeverity('WARNING')" class="px-3 py-1 rounded-md text-xs font-bold transition" :class="slaSeverity === 'WARNING' ? 'bg-amber-400 text-moxdark shadow' : 'text-slate-400 hover:text-amber-400'">Warning</button>
          </div>
          <!-- Filter Periode SLA -->
          <div class="flex bg-slate-900/60 border border-slate-800 rounded-lg p-1">
            <button @click="setSlaPeriod('24h')" class="px-3.5 py-1 rounded-md text-xs font-bold transition" :class="slaPeriod === '24h' ? 'bg-moxgreen text-moxdark' : 'text-slate-400 hover:text-white'">24 Jam</button>
            <button @click="setSlaPeriod('7d')" class="px-3.5 py-1 rounded-md text-xs font-bold transition" :class="slaPeriod === '7d' ? 'bg-moxgreen text-moxdark' : 'text-slate-400 hover:text-white'">7 Hari</button>
            <button @click="setSlaPeriod('30d')" class="px-3.5 py-1 rounded-md text-xs font-bold transition" :class="slaPeriod === '30d' ? 'bg-moxgreen text-moxdark' : 'text-slate-400 hover:text-white'">30 Hari</button>
          </div>
        </div>
      </div>

      <!-- 4 Mini KPI Cards (Total Uptime, Total Downtime, MTTR, Availability) -->
      <div class="grid grid-cols-4 gap-4 mb-5">
        <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <i class="ph-bold ph-arrow-circle-up text-emerald-400"></i> Total Uptime
          </p>
          <h4 class="text-xl font-bold text-white leading-none">{{ formatPreciseDuration(slaAnalytics.summary.total_uptime_sec) }}</h4>
          <p class="text-[11px] text-slate-500 mt-1.5">Waktu sistem beroperasi normal</p>
        </div>

        <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <i class="ph-bold ph-arrow-circle-down text-rose-400"></i> Total Downtime
          </p>
          <h4 class="text-xl font-bold text-white leading-none">{{ formatPreciseDuration(slaAnalytics.summary.total_downtime_sec) }}</h4>
          <p class="text-[11px] text-slate-500 mt-1.5">Akumulasi durasi gangguan ({{ slaAnalytics.summary.incident_count }} insiden)</p>
        </div>

        <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <i class="ph-bold ph-timer text-cyan-400"></i> MTTR
          </p>
          <h4 class="text-xl font-bold text-white leading-none">{{ formatPreciseDuration(slaAnalytics.summary.mttr_sec) }}</h4>
          <p class="text-[11px] text-slate-500 mt-1.5">Rata-rata waktu pemulihan</p>
        </div>

        <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <i class="ph-bold ph-shield-check text-moxgreen"></i> Availability
          </p>
          <h4 class="text-xl font-bold leading-none" :class="slaAvailabilityColor">
            {{ slaAnalytics.summary.availability }}<span class="text-xs font-medium ml-0.5">%</span>
          </h4>
          <div class="w-full h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
            <div class="h-full rounded-full transition-all duration-700" :class="slaAvailabilityBar" :style="{ width: Math.min(100, slaAnalytics.summary.availability) + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 2 Grafik Berdampingan: (1) Total Uptime, Total Downtime & MTTR | (2) Availability (%) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <div class="flex justify-between items-center mb-1">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider">Grafik Total Uptime, Downtime &amp; MTTR</h4>
            <span class="text-[10px] text-slate-500">Satuan sumbu: {{ slaDurationUnit.name }}</span>
          </div>
          <p class="text-[11px] text-slate-500 mb-2">Perbandingan durasi operasional vs gangguan per {{ slaPeriod === '24h' ? 'jam' : 'hari' }}</p>
          <apexchart type="bar" height="250" :options="slaDurationChartOptions" :series="slaDurationSeries" />
        </div>

        <div class="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <div class="flex justify-between items-center mb-1">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider">Grafik Availability (%) &amp; MTTR</h4>
            <span class="text-[10px] text-emerald-400 font-semibold">Target SLA: 99.00%</span>
          </div>
          <p class="text-[11px] text-slate-500 mb-2">Persentase ketersediaan sistem per {{ slaPeriod === '24h' ? 'jam' : 'hari' }}</p>
          <apexchart type="area" height="250" :options="slaAvailabilityChartOptions" :series="slaAvailabilitySeries" />
        </div>
      </div>
    </div>

    <!-- Table Area: Log Alert & Incident Terbaru -->
    <div class="bg-moxcard border border-slate-800 p-6 rounded-xl shadow-lg">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-md font-bold text-white flex items-center gap-2">
            <i class="ph-bold ph-warning text-rose-500"></i> Log Alert &amp; Incident Terbaru
          </h3>
          <p class="text-xs text-slate-400 mt-1">Notifikasi otomatis berdasarkan batas threshold ambang batas</p>
        </div>
        <router-link to="/rekap-gangguan" class="text-xs text-moxgreen hover:text-emerald-400 font-medium transition flex items-center gap-1">
          Lihat Semua Insiden <i class="ph-bold ph-arrow-right"></i>
        </router-link>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-700 text-[11px] uppercase tracking-wider text-slate-400">
              <th class="pb-3 font-semibold w-44">Waktu (WIB)</th>
              <th class="pb-3 font-semibold w-36">Severity</th>
              <th class="pb-3 font-semibold w-56">Komponen Target</th>
              <th class="pb-3 font-semibold">Deskripsi Peristiwa</th>
              <th class="pb-3 font-semibold text-right w-36">Status</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr v-if="isLoading && summary.recent_incidents.length === 0">
              <td colspan="5" class="py-8 text-center text-slate-400 text-xs">
                <i class="ph-bold ph-spinner animate-spin text-lg text-moxgreen block mb-1"></i>
                Memuat data insiden terbaru...
              </td>
            </tr>
            <tr v-else-if="summary.recent_incidents.length === 0">
              <td colspan="5" class="py-8 text-center text-slate-500 text-xs">
                Belum ada riwayat alert atau insiden yang tercatat.
              </td>
            </tr>
            <tr
              v-else
              v-for="inc in summary.recent_incidents"
              :key="inc.id"
              class="border-b border-slate-800/50 last:border-b-0 hover:bg-slate-800/30 transition"
            >
              <td class="py-4 text-slate-300 font-mono text-xs whitespace-nowrap">
                {{ formatWibDateTime(inc.time) }}
              </td>
              <td class="py-4">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border"
                  :class="getSeverityBadgeClass(inc.severity)"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="getSeverityDotClass(inc.severity)"></span>
                  {{ inc.severity }}
                </span>
              </td>
              <td class="py-4 font-medium text-slate-200 text-xs">
                <span class="text-slate-500 font-bold mr-1">[{{ inc.target_type }}]</span> {{ inc.target_name }}
              </td>
              <td class="py-4 text-slate-400 text-xs">{{ inc.message }}</td>
              <td class="py-4 text-right font-bold text-xs" :class="getStatusTextClass(inc.status_label)">
                {{ inc.status_label }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatWibDateTime } from '../../utils/datetime.js';

const apexchart = VueApexCharts;

const chartCanvas = ref(null);
let chartInstance = null;
let refreshTimer = null;

const isLoading = ref(false);
const isRefreshing = ref(false);
const isExporting = ref(false);
const selectedTimeframe = ref('1h');

// STATE ANALITIK SLA (UPTIME, DOWNTIME, MTTR, AVAILABILITY)
const slaPeriod = ref('24h');
const slaSeverity = ref('ALL');
const slaAnalytics = ref({
  summary: {
    total_uptime_sec: 0,
    total_downtime_sec: 0,
    mttr_sec: 0,
    availability: 100,
    incident_count: 0
  },
  chartData: []
});

const slaFilterLabel = computed(() => {
  const pTxt = slaPeriod.value === '24h' ? '24 Jam Terakhir' : (slaPeriod.value === '7d' ? '7 Hari Terakhir' : '30 Hari Terakhir');
  const sTxt = slaSeverity.value === 'ALL' ? 'Semua Level (Warning, Critical, Down)' : `Level ${slaSeverity.value}`;
  return `${pTxt} - ${sTxt}`;
});

const slaAvailabilityColor = computed(() => {
  const a = slaAnalytics.value.summary.availability;
  return a >= 99 ? 'text-moxgreen' : a >= 95 ? 'text-amber-400' : 'text-rose-500';
});

const slaAvailabilityBar = computed(() => {
  const a = slaAnalytics.value.summary.availability;
  return a >= 99 ? 'bg-moxgreen shadow-[0_0_8px_#10b981]' : a >= 95 ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]';
});

const formatPreciseDuration = (totalSeconds) => {
  if (!totalSeconds || totalSeconds <= 0) return '0d';
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d} hari`);
  if (h > 0) parts.push(`${h}j`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}d`);
  return parts.join(' ');
};

const CHART_UNITS = [
  { name: 'Detik', div: 1 },
  { name: 'Menit', div: 60 },
  { name: 'Jam', div: 3600 },
  { name: 'Hari', div: 86400 }
];

const pickChartUnit = (maxSec) => {
  if (maxSec < 120) return CHART_UNITS[0];
  if (maxSec < 7200) return CHART_UNITS[1];
  if (maxSec < 172800) return CHART_UNITS[2];
  return CHART_UNITS[3];
};

const slaDurationUnit = computed(() => {
  const maxVal = Math.max(
    0,
    ...slaAnalytics.value.chartData.map(d => Math.max(d.total_uptime_sec || 0, d.total_downtime_sec || 0, d.mttr_sec || 0))
  );
  return pickChartUnit(maxVal);
});

const slaLabels = computed(() => slaAnalytics.value.chartData.map(d => d.label));

const slaDurationSeries = computed(() => {
  const div = slaDurationUnit.value.div;
  return [
    {
      name: 'Total Uptime',
      data: slaAnalytics.value.chartData.map(d => Number(((d.total_uptime_sec || 0) / div).toFixed(2)))
    },
    {
      name: 'Total Downtime',
      data: slaAnalytics.value.chartData.map(d => Number(((d.total_downtime_sec || 0) / div).toFixed(2)))
    },
    {
      name: 'MTTR',
      data: slaAnalytics.value.chartData.map(d => Number(((d.mttr_sec || 0) / div).toFixed(2)))
    }
  ];
});

const slaDurationChartOptions = computed(() => {
  const unit = slaDurationUnit.value;
  return {
    chart: { type: 'bar', background: 'transparent', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' },
    theme: { mode: 'dark' },
    colors: ['#10b981', '#f43f5e', '#06b6d4'],
    plotOptions: { bar: { borderRadius: 3, columnWidth: '65%' } },
    grid: { borderColor: '#1e293b', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: slaLabels.value,
      labels: { style: { colors: '#94a3b8', fontSize: '10px' } },
      axisBorder: { color: '#334155' },
      axisTicks: { color: '#334155' }
    },
    yaxis: {
      min: 0,
      labels: {
        style: { colors: '#94a3b8', fontSize: '10px' },
        formatter: (v) => formatPreciseDuration(Math.round(v * unit.div))
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (v, { seriesIndex, dataPointIndex }) => {
          const row = slaAnalytics.value.chartData[dataPointIndex];
          if (!row) return '0d';
          const rawSec = seriesIndex === 0
            ? row.total_uptime_sec
            : (seriesIndex === 1 ? row.total_downtime_sec : row.mttr_sec);
          return formatPreciseDuration(rawSec);
        }
      }
    },
    legend: { labels: { colors: '#cbd5e1' }, fontSize: '11px', position: 'top' }
  };
});

const slaAvailabilitySeries = computed(() => [
  {
    name: 'Availability (%)',
    data: slaAnalytics.value.chartData.map(d => d.availability)
  }
]);

const slaAvailabilityChartOptions = computed(() => {
  const vals = slaAnalytics.value.chartData.map(d => d.availability);
  const minVal = vals.length ? Math.max(0, Math.floor(Math.min(...vals)) - 1) : 0;
  return {
    chart: { type: 'area', background: 'transparent', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' },
    theme: { mode: 'dark' },
    colors: ['#10b981'],
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02 } },
    grid: { borderColor: '#1e293b', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: slaLabels.value,
      labels: { style: { colors: '#94a3b8', fontSize: '10px' } },
      axisBorder: { color: '#334155' },
      axisTicks: { color: '#334155' }
    },
    yaxis: {
      min: minVal,
      max: 100,
      labels: {
        style: { colors: '#94a3b8', fontSize: '10px' },
        formatter: (v) => `${v.toFixed(1)}%`
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (v, { dataPointIndex }) => {
          const row = slaAnalytics.value.chartData[dataPointIndex];
          const mttrStr = row ? formatPreciseDuration(row.mttr_sec) : '0d';
          return `${Number(v).toFixed(2)}% (MTTR: ${mttrStr})`;
        }
      }
    },
    legend: { labels: { colors: '#cbd5e1' }, fontSize: '11px', position: 'top' }
  };
});

const summary = ref({
  users: { total: 0, active: 0, active_roles: 0 },
  proxmox: {
    total_nodes: 0,
    online_nodes: 0,
    offline_nodes: 0,
    health_percent: 0,
    total_vms: 0,
    running_vms: 0,
    avg_cpu: 0,
    avg_ram: 0,
    avg_io: 0,
    node_names: [],
    chart: { labels: [], cpu: [], ram: [], io: [] }
  },
  icmp: { total: 0, active: 0, up: 0, down: 0, avg_latency_ms: 0 },
  tcp: { total: 0, active: 0, up: 0, down: 0, avg_latency_ms: 0 },
  recent_incidents: []
});

const timeframeLabel = computed(() => {
  if (selectedTimeframe.value === '24h') return '24 Jam Terakhir';
  if (selectedTimeframe.value === '7d') return '7 Hari Terakhir';
  return '1 Jam Terakhir';
});

const getSeverityBadgeClass = (sev) => {
  switch (sev) {
    case 'DOWN':
    case 'CRITICAL':
      return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    case 'WARNING':
      return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
    case 'RECOVERED':
      return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    case 'RESOLVED':
    default:
      return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
  }
};

const getSeverityDotClass = (sev) => {
  switch (sev) {
    case 'DOWN':
    case 'CRITICAL':
      return 'bg-rose-500';
    case 'WARNING':
      return 'bg-amber-500';
    case 'RECOVERED':
      return 'bg-blue-400';
    case 'RESOLVED':
    default:
      return 'bg-emerald-500';
  }
};

const getStatusTextClass = (statusLabel) => {
  if (statusLabel === 'NORMAL') return 'text-emerald-500';
  if (statusLabel === 'INVESTIGASI') return 'text-cyan-400';
  return 'text-rose-500';
};

const initOrUpdateChart = () => {
  if (!window.Chart || !chartCanvas.value) return;

  const labels = summary.value.proxmox.chart.labels || [];
  const cpuData = summary.value.proxmox.chart.cpu || [];
  const ramData = summary.value.proxmox.chart.ram || [];
  const ioData = summary.value.proxmox.chart.io || [];

  if (chartInstance) {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = cpuData;
    chartInstance.data.datasets[1].data = ramData;
    chartInstance.data.datasets[2].data = ioData;
    chartInstance.update('none');
    return;
  }

  const ctx = chartCanvas.value.getContext('2d');
  const gradientCPU = ctx.createLinearGradient(0, 0, 0, 300);
  gradientCPU.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
  gradientCPU.addColorStop(1, 'rgba(16, 185, 129, 0)');

  chartInstance = new window.Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'CPU Usage (%)',
          data: cpuData,
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
          label: 'RAM Usage (%)',
          data: ramData,
          borderColor: '#60a5fa',
          borderWidth: 2,
          pointBackgroundColor: '#0f172a',
          pointBorderColor: '#60a5fa',
          pointBorderWidth: 2,
          pointRadius: 3,
          fill: false,
          tension: 0.4
        },
        {
          label: 'IO Delay (%)',
          data: ioData,
          borderColor: '#fbbf24',
          borderWidth: 2,
          pointBackgroundColor: '#0f172a',
          pointBorderColor: '#fbbf24',
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
      animation: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(51, 65, 85, 0.4)',
            drawBorder: false
          },
          ticks: {
            color: '#94a3b8',
            font: { size: 10 }
          }
        },
        y: {
          grid: {
            color: 'rgba(51, 65, 85, 0.4)',
            drawBorder: false
          },
          ticks: {
            color: '#94a3b8',
            font: { size: 10 },
            callback: function (value) { return value + '%'; },
            stepSize: 10
          },
          min: 0,
          max: 100
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    }
  });
};

const fetchSlaAnalytics = async () => {
  try {
    const res = await fetch(`/api/analytics?period=${slaPeriod.value}&severity=${slaSeverity.value}`);
    const json = await res.json();
    if (json.success && json.summary) {
      const sum = json.summary;
      slaAnalytics.value = {
        summary: {
          total_uptime_sec: sum.total_uptime_sec || 0,
          total_downtime_sec: sum.total_downtime_sec || 0,
          mttr_sec: sum.mttr_sec || 0,
          availability: parseFloat(sum.availability || 100),
          incident_count: sum.incident_count || 0
        },
        chartData: (json.chartData || []).map(d => ({
          label: d.label,
          total_uptime_sec: d.total_uptime_sec || 0,
          total_downtime_sec: d.total_downtime_sec || 0,
          mttr_sec: d.mttr_sec || 0,
          availability: parseFloat(d.availability || 100),
          incident_count: d.incident_count || 0
        }))
      };
    }
  } catch (err) {
    console.error('Gagal memuat data analitik SLA di Dashboard:', err);
  }
};

const setSlaPeriod = (period) => {
  if (slaPeriod.value === period) return;
  slaPeriod.value = period;
  fetchSlaAnalytics();
};

const setSlaSeverity = (sev) => {
  if (slaSeverity.value === sev) return;
  slaSeverity.value = sev;
  fetchSlaAnalytics();
};

const fetchDashboardData = async (isBackground = false) => {
  if (isBackground && document.hidden) return;
  if (!isBackground) isLoading.value = true;
  isRefreshing.value = true;

  const startTime = Date.now();

  try {
    const [resSummary] = await Promise.all([
      fetch(`/api/dashboard/summary?timeframe=${selectedTimeframe.value}`),
      fetchSlaAnalytics()
    ]);
    const json = await resSummary.json();
    if (json.success && json.data) {
      summary.value = json.data;
      initOrUpdateChart();
    }
  } catch (error) {
    console.error('Gagal memuat data ringkasan dashboard:', error);
  } finally {
    isLoading.value = false;

    // Pastikan animasi putar tombol refresh terlihat halus minimal 1 detik seperti di ProxmoxMonitor.vue
    const timeElapsed = Date.now() - startTime;
    const minimumSpinTime = 1000;
    if (timeElapsed < minimumSpinTime) {
      setTimeout(() => {
        isRefreshing.value = false;
      }, minimumSpinTime - timeElapsed);
    } else {
      isRefreshing.value = false;
    }
  }
};

const exportDashboardPdf = () => {
  if (isExporting.value) return;
  isExporting.value = true;
  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 30, 'F');
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('VIEWMOX - LAPORAN RINGKASAN INFRASTRUKTUR & SLA', 14, 13);

    doc.setTextColor(226, 232, 240);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Waktu Cetak: ${formatWibDateTime(new Date())} WIB   |   Resource: ${timeframeLabel.value}   |   SLA: ${slaFilterLabel.value}`, 14, 22);

    // 1. Ringkasan KPI Infrastruktur
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. Ringkasan Status Infrastruktur', 14, 38);

    autoTable(doc, {
      startY: 41,
      head: [['Total Pengguna', 'Node Proxmox VE', 'VM / LXC Aktif', 'Rata-rata CPU / RAM / IO', 'Target Ping (ICMP)', 'Target TCP Port']],
      body: [[
        `${summary.value.users.total} Akun (${summary.value.users.active} Aktif)`,
        `${summary.value.proxmox.online_nodes} / ${summary.value.proxmox.total_nodes} Online (${summary.value.proxmox.health_percent}%)`,
        `${summary.value.proxmox.running_vms} / ${summary.value.proxmox.total_vms} Running`,
        `CPU: ${summary.value.proxmox.avg_cpu}% | RAM: ${summary.value.proxmox.avg_ram}% | IO: ${summary.value.proxmox.avg_io}%`,
        `${summary.value.icmp.total} Target (${summary.value.icmp.down} RTO, Avg ${summary.value.icmp.avg_latency_ms} ms)`,
        `${summary.value.tcp.total} Port (${summary.value.tcp.down} Down, Avg ${summary.value.tcp.avg_latency_ms} ms)`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8.5 },
      bodyStyles: { halign: 'center', fontSize: 8.5, fontStyle: 'bold', textColor: [30, 41, 59] },
      margin: { left: 14, right: 14 }
    });

    // 2. Ringkasan SLA (Total Uptime, Downtime, MTTR, Availability)
    let nextY = doc.lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`2. Ringkasan Metrik SLA (${slaFilterLabel.value})`, 14, nextY);

    autoTable(doc, {
      startY: nextY + 3,
      head: [['Total Uptime', 'Total Downtime', 'MTTR (Rata-rata Pemulihan)', 'Availability (%)', 'Total Insiden']],
      body: [[
        formatPreciseDuration(slaAnalytics.value.summary.total_uptime_sec),
        formatPreciseDuration(slaAnalytics.value.summary.total_downtime_sec),
        formatPreciseDuration(slaAnalytics.value.summary.mttr_sec),
        `${slaAnalytics.value.summary.availability}%`,
        `${slaAnalytics.value.summary.incident_count} Insiden`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8.5 },
      bodyStyles: { halign: 'center', fontSize: 8.5, fontStyle: 'bold', textColor: [30, 41, 59] },
      margin: { left: 14, right: 14 }
    });

    // 3. Tabel Log Alert & Incident Terbaru
    nextY = doc.lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. Log Alert & Incident Terbaru', 14, nextY);

    const incRows = summary.value.recent_incidents.length > 0
      ? summary.value.recent_incidents.map((inc, i) => [
          i + 1,
          inc.ticket_id,
          formatWibDateTime(inc.time),
          inc.severity,
          `[${inc.target_type}] ${inc.target_name}`,
          inc.message,
          inc.status_label
        ])
      : [['-', '-', '-', '-', '-', 'Belum ada riwayat alert atau insiden.', '-']];

    autoTable(doc, {
      startY: nextY + 3,
      head: [['No', 'ID Tiket', 'Waktu (WIB)', 'Severity', 'Komponen Target', 'Deskripsi Peristiwa', 'Status']],
      body: incRows,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      margin: { left: 14, right: 14 }
    });

    const stamp = new Date().toISOString().slice(0, 10);
    doc.save(`Ringkasan_Infrastruktur_Viewmox_${stamp}.pdf`);
  } catch (err) {
    console.error('Error exportDashboardPdf:', err);
  } finally {
    isExporting.value = false;
  }
};

const handleVisibilityChange = () => {
  if (!document.hidden) {
    fetchDashboardData(true);
  }
};

onMounted(() => {
  fetchDashboardData(false);
  refreshTimer = setInterval(() => {
    fetchDashboardData(true);
  }, 5000);
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>
