<template>
    <div class="animate-fade-in">
        <!-- Header Halaman ICMP -->
        <div class="flex flex-nowrap justify-between items-center gap-4 mb-6">
            <div class="shrink-0">
                <h2 class="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                    <i class="ph-bold ph-tree-structure text-moxgreen"></i> Daftar Layanan Ping & TCP
                </h2>
                <p class="text-slate-400 text-sm">Pemantauan status untuk protokol ICMP Ping dan TCP Port.</p>
            </div>
            
            <div class="flex flex-wrap lg:flex-nowrap gap-3 items-center">
                <!-- TOGGLE MODE BUTTON -->
                <div class="flex bg-slate-900 border border-slate-700 p-1 rounded-lg shadow-inner h-[42px] items-center shrink-0">
                    <button type="button" aria-pressed="true" class="px-3 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-1.5 bg-emerald-500 text-slate-900 shadow cursor-default whitespace-nowrap h-full">
                        <i class="ph-bold ph-plugs text-sm"></i> ICMP / TCP
                    </button>
                    <button type="button" aria-pressed="false" @click="$emit('change-view', 'proxmox')" class="px-3 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-1.5 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer whitespace-nowrap h-full">
                        <i class="ph-bold ph-hard-drives text-sm"></i> PROXMOX
                    </button>
                </div>
                
                <!-- SEARCH BAR -->
                <div class="relative h-[42px] flex items-center grow min-w-[200px]">
                    <i class="ph ph-magnifying-glass absolute left-3 text-slate-400 pointer-events-none"></i>
                    <input type="text" v-model="searchQuery" placeholder="Cari nama, IP, atau deskripsi..." class="pl-9 pr-8 h-full w-full border border-slate-700 bg-slate-800/50 text-white rounded-lg text-sm font-medium hover:bg-slate-700 focus:bg-slate-900 focus:border-emerald-400 transition outline-none">
                    <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-3 text-slate-400 hover:text-white transition">
                        <i class="ph-bold ph-x"></i>
                    </button>
                </div>
                
                <!-- Filter Status -->
                <div class="relative h-[42px] w-[42px] shrink-0">
                    <select v-model="filterStatus" title="Filter Status" class="w-full h-full border border-slate-700 bg-slate-800/50 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700 transition outline-none appearance-none cursor-pointer text-center opacity-0 absolute inset-0 z-10">
                        <option value="ALL">Semua Status</option>
                        <option value="UP">UP (Online)</option>
                        <option value="DOWN">DOWN (Offline)</option>
                        <option value="PAUSED">PAUSED</option>
                    </select>
                    <div class="w-full h-full border border-slate-700 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-300 pointer-events-none transition hover:bg-slate-700">
                        <i class="ph-bold ph-funnel text-base" :class="{'text-emerald-400': filterStatus !== 'ALL'}"></i>
                    </div>
                </div>
                
                <!-- Tombol Tambah -->
                <button @click="openAddModal" class="px-4 h-[42px] bg-moxgreen text-moxdark rounded-lg flex items-center gap-2 hover:bg-emerald-400 text-sm font-bold transition shadow-lg whitespace-nowrap shrink-0">
                    <i class="ph-bold ph-plus-circle text-lg"></i> TAMBAH TARGET
                </button>
            </div>
        </div>

        <!-- Tabel ICMP/TCP -->
        <div class="bg-moxcard border border-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-800/50 border-b border-slate-700 text-[11px] uppercase tracking-wider text-slate-400">
                            <th class="px-6 py-4 font-semibold w-1/4">Nama Layanan</th>
                            <th class="px-6 py-4 font-semibold">Jenis Protokol</th>
                            <th class="px-6 py-4 font-semibold">Target (IP / Port)</th>
                            <th class="px-6 py-4 font-semibold">Latency / Terakhir Dicek</th>
                            <th class="px-6 py-4 font-semibold">Status Terkini</th>
                            <th class="px-6 py-4 font-semibold text-right w-32">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm">
                        <tr v-if="isLoading" class="border-b border-slate-800/50">
                            <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                                <i class="ph-bold ph-spinner animate-spin text-2xl text-moxgreen mb-2 inline-block"></i>
                                <p>Memuat dan menyinkronkan data target...</p>
                            </td>
                        </tr>
                        <tr v-else-if="filteredTargets.length === 0" class="border-b border-slate-800/50">
                            <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                                <i class="ph-duotone ph-magnifying-glass text-4xl mb-2" v-if="searchQuery"></i>
                                <i class="ph-duotone ph-tree-structure text-4xl mb-2" v-else></i>
                                <p v-if="searchQuery">Tidak ada target yang cocok dengan kata kunci "<span class="text-white">{{ searchQuery }}</span>".</p>
                                <p v-else>Tidak ada target yang cocok dengan filter.</p>
                            </td>
                        </tr>
                        <template v-else v-for="target in paginatedTargets" :key="target.id">
                            <tr @click="toggleExpanded(target)" class="border-b border-slate-800/50 transition cursor-pointer group" :class="[ !target.is_active ? 'bg-slate-800/20 opacity-60' : target.status === 'DOWN' ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-slate-800/30', expandedTargetId === target.id ? 'bg-slate-800/40 border-b-transparent' : '' ]">
                                <td class="px-6 py-4">
                                    <p class="font-bold text-slate-200 group-hover:text-moxgreen transition flex items-center gap-2">
                                        {{ target.name }}
                                        <i v-if="expandedTargetId === target.id" class="ph-bold ph-caret-up text-xs text-slate-500"></i>
                                        <i v-else class="ph-bold ph-caret-down text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition"></i>
                                    </p>
                                    <p :class="['text-xs mt-0.5', target.status === 'DOWN' && target.is_active ? 'text-rose-500' : 'text-slate-400']">
                                        {{ target.description }}
                                    </p>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="inline-block bg-slate-900/80 border border-slate-700 text-blue-400 font-mono text-[10px] px-2.5 py-1 rounded">
                                        {{ target.protocol }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-slate-300 font-mono text-xs font-bold">
                                    {{ target.ip_address }} <span v-if="target.protocol === 'TCP SOCKET' && target.port" class="text-slate-500">: {{ target.port }}</span>
                                </td>
                                <td class="px-6 py-4 text-xs">
                                    <span v-if="!target.is_active" class="text-slate-500 italic">PAUSED</span>
                                    <template v-else>
                                        <span :class="['font-bold', target.status === 'DOWN' ? 'text-rose-500' : 'text-white']">
                                            {{ target.last_latency || '-' }}
                                        </span>
                                        <span class="text-slate-500 ml-1">({{ formatTimeAgo(target.last_check) }})</span>
                                    </template>
                                </td>
                                
                                <!-- ===================================== -->
                                <!-- PERUBAHAN: Kolom Status dengan Uptime -->
                                <!-- ===================================== -->
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex flex-col gap-1 items-start">
                                        <!-- Badge Status Utama -->
                                        <span v-if="!target.is_active" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold">
                                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> PAUSED
                                        </span>
                                        <span v-else-if="target.status === 'UP' || target.status === 'TERHUBUNG'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> UP
                                        </span>
                                        <span v-else-if="target.status === 'DOWN'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                                            <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> DOWN
                                        </span>
                                        <span v-else class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-bold">
                                            <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span> UNKNOWN
                                        </span>
                                        
                                        <!-- Indikator Uptime (Hanya jika sedang aktif & UP) -->
                                        <span v-if="target.is_active && (target.status === 'UP' || target.status === 'TERHUBUNG')" class="text-[10px] font-medium text-slate-500 pl-1">
                                            Uptime: <span class="text-slate-400">{{ getUptimeDuration(target.last_status_change) }}</span>
                                        </span>
                                    </div>
                                </td>
                                <!-- ===================================== -->

                                <td class="px-6 py-4 text-right" @click.stop>
                                    <div class="flex items-center justify-end gap-3 text-slate-500">
                                        <button @click="togglePause(target)" class="hover:text-amber-400 transition" :title="target.is_active ? 'Jeda Monitoring' : 'Mulai Monitoring'">
                                            <i :class="target.is_active ? 'ph-bold ph-pause' : 'ph-bold ph-play'" class="text-lg"></i>
                                        </button>
                                        <button @click="editTarget(target)" class="hover:text-blue-400 transition" title="Pengaturan">
                                            <i class="ph ph-gear text-lg"></i>
                                        </button>
                                        <button @click="confirmDeleteTarget(target)" class="hover:text-rose-500 transition" title="Hapus">
                                            <i class="ph ph-trash text-lg"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <!-- Dropdown Grafik ICMP -->
                            <tr v-if="expandedTargetId === target.id">
                                <td colspan="6" class="p-0 border-b border-slate-800/50 bg-slate-800/20">
                                    <div class="px-8 py-6 flex gap-6 animate-fade-in">
                                        <div class="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 h-[200px] relative">
                                            <div class="flex justify-between items-center mb-2">
                                                <h4 class="text-xs font-bold text-slate-400 flex items-center gap-2">
                                                    <i class="ph-fill ph-chart-line-up text-moxgreen"></i> Riwayat Latency
                                                </h4>
                                                <button @click="fetchHistory(target.id, false)" class="text-slate-500 hover:text-moxgreen transition text-xs flex items-center gap-1">
                                                    <i class="ph-bold ph-arrows-clockwise" :class="{'animate-spin text-moxgreen': isLoadingHistory}"></i> Segarkan
                                                </button>
                                            </div>
                                            <div v-if="isLoadingHistory && !chartData" class="absolute inset-0 flex items-center justify-center">
                                                <i class="ph-bold ph-spinner animate-spin text-2xl text-slate-500"></i>
                                            </div>
                                            <div v-else-if="chartData" class="w-full h-[140px]">
                                                <Line :data="chartData" :options="chartOptions" />
                                            </div>
                                        </div>
                                        
                                        <div class="w-64 bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-4">
                                            <h4 class="text-xs font-bold text-slate-400 mb-2 border-b border-slate-700/50 pb-2">Konfigurasi Daemon</h4>
                                            <div>
                                                <p class="text-[10px] uppercase text-slate-500 font-bold">Interval Pengecekan</p>
                                                <p class="text-sm text-slate-200 font-mono">{{ target.check_interval }} detik</p>
                                            </div>
                                            <div>
                                                <p class="text-[10px] uppercase text-slate-500 font-bold">Toleransi time Out</p>
                                                <p class="text-sm text-slate-200 font-mono">{{ target.max_retries }} kali gagal</p>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div v-if="!isLoading && filteredTargets.length > 0" class="bg-slate-900/30 px-6 py-4 flex items-center justify-between border-t border-slate-800">
                <span class="text-xs text-slate-400">
                    Menampilkan <span class="font-bold text-white">{{ (currentPage - 1) * itemsPerPage + 1 }}</span> sampai <span class="font-bold text-white">{{ Math.min(currentPage * itemsPerPage, filteredTargets.length) }}</span> dari <span class="font-bold text-white">{{ filteredTargets.length }}</span> target
                </span>
                <div class="flex items-center gap-3">
                    <button @click="prevPage" :disabled="currentPage === 1" class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 transition">
                        <i class="ph-bold ph-caret-left"></i>
                    </button>
                    <button @click="nextPage" :disabled="currentPage === totalPages" class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 transition">
                        <i class="ph-bold ph-caret-right"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- MODAL FORM... (Sama seperti sebelumnya) -->
        <Teleport to="body">
            <!-- Modal Edit/Tambah, Delete, dan Toast tetap sama -->
            <div v-if="showModal" class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in">
                <div class="bg-[#151e2b] border border-slate-700 rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden">
                    <div class="flex justify-between items-center p-6 border-b border-slate-800">
                        <h3 class="text-lg font-bold text-white flex items-center gap-2">
                            <i class="ph-fill ph-gear text-emerald-400"></i> {{ isEditMode ? 'Edit Target Monitoring' : 'Tambah Target Baru' }}
                        </h3>
                        <button @click="closeModal" class="text-slate-400 hover:text-white"><i class="ph ph-x text-xl"></i></button>
                    </div>
                    <form @submit.prevent="saveTarget" class="p-6 space-y-5">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Nama Layanan</label>
                                <input type="text" v-model="form.name" required placeholder="Contoh: Core Gateway Diskominfo" class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 focus:border-emerald-400 outline-none transition">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Deskripsi Layanan</label>
                                <input type="text" v-model="form.description" placeholder="Contoh: Router Utama Mikrotik CCR" class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 focus:border-emerald-400 outline-none transition">
                            </div>
                        </div>
                        <div class="p-4 bg-slate-800/30 border border-slate-700/80 rounded-lg space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Jenis Protokol</label>
                                <select v-model="form.protocol" class="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 focus:border-emerald-400 outline-none appearance-none cursor-pointer">
                                    <option value="ICMP PING">ICMP PING (Test Konektivitas)</option>
                                    <option value="TCP SOCKET">TCP SOCKET (Test Port Spesifik)</option>
                                </select>
                            </div>
                            <div class="flex gap-4">
                                <div class="flex-[2]">
                                    <label class="block text-xs font-bold text-slate-400 uppercase mb-2">IP Address / Host</label>
                                    <input type="text" v-model="form.ip_address" required placeholder="Contoh: 10.10.0.1" class="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 font-mono focus:border-emerald-400 outline-none transition">
                                </div>
                                <div class="flex-1" v-if="form.protocol === 'TCP SOCKET'">
                                    <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Port</label>
                                    <input type="number" v-model="form.port" required placeholder="443" class="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 font-mono focus:border-emerald-400 outline-none transition">
                                </div>
                            </div>
                        </div>
                        <div class="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-4">
                            <h4 class="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <i class="ph-fill ph-sliders"></i> Parameter Pengecekan
                            </h4>
                            <div class="flex gap-4">
                                <div class="flex-1">
                                    <label class="block text-xs font-bold text-slate-400 mb-2">Interval Cek (Detik)</label>
                                    <div class="relative">
                                        <input type="number" v-model="form.check_interval" required min="1" class="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg pl-4 pr-10 py-2 focus:border-amber-500 outline-none transition">
                                        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">dtk</span>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <label class="block text-xs font-bold text-slate-400 mb-2">Batas Gagal (Retries)</label>
                                    <div class="relative">
                                        <input type="number" v-model="form.max_retries" required min="1" max="10" class="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg pl-4 pr-12 py-2 focus:border-amber-500 outline-none transition">
                                        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">kali</span>
                                    </div>
                                </div>
                            </div>
                            <p class="text-[10px] text-slate-400 leading-relaxed mt-2">
                                Sistem akan melakukan test setiap <span class="font-bold text-white">{{ form.check_interval }} detik</span>. Jika terjadi Timeout berturut-turut <span class="font-bold text-white">{{ form.max_retries }} kali</span>, status akan diubah ke <span class="text-rose-500 font-bold">DOWN</span>.
                            </p>
                        </div>
                        <div class="pt-4 border-t border-slate-800 flex justify-end gap-3 mt-6">
                            <button type="button" @click="closeModal" class="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition">Batal</button>
                            <button type="submit" class="px-5 py-2.5 bg-emerald-500 text-slate-900 rounded-lg text-sm font-bold hover:bg-emerald-400 transition" :disabled="isSaving">
                                {{ isSaving ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Target') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Teleport>

        <!-- Modal Confirm Delete (Sama) -->
        <Teleport to="body">
            <div v-if="showDeleteModal" class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-fade-in">
                <div class="bg-[#151e2b] border border-slate-700 shadow-2xl rounded-xl w-full max-w-md overflow-hidden transform transition-all relative">
                    <div class="h-1.5 w-full bg-rose-500 absolute top-0 left-0"></div>
                    <div class="p-6 pt-7">
                        <div class="flex items-start gap-4">
                            <div class="flex-shrink-0 w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mt-0.5">
                                <i class="ph-fill ph-warning-circle text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white mb-2">Hapus Target Monitoring?</h3>
                                <p class="text-sm text-slate-400 leading-relaxed">
                                    Anda akan menghapus target <span class="font-bold text-white">{{ targetToDelete?.name }}</span> (<span class="font-mono text-slate-300 text-xs">{{ targetToDelete?.ip_address }}</span>). <br><br> Sistem daemon tidak akan lagi memantau infrastruktur ini. Tindakan ini tidak dapat dibatalkan.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-slate-800/40 px-6 py-4 flex justify-end gap-3 border-t border-slate-700/80">
                        <button @click="closeDeleteModal" class="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/80 transition"> Batal </button>
                        <button @click="executeDeleteTarget" class="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-bold transition shadow-[0_4px_12px_rgba(244,63,94,0.3)] flex items-center gap-2" :disabled="isDeleting">
                            <i class="ph-bold ph-trash" v-if="!isDeleting"></i> {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus Target' }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Toast (Sama) -->
        <Teleport to="body">
            <div v-if="toast.show" class="fixed top-8 right-8 z-[1100] w-[400px] bg-[#151e2b] border-t-4 rounded-b-xl rounded-t-sm shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-5 flex gap-4 animate-slide-in" :class="toast.type === 'success' ? 'border-emerald-400' : 'border-rose-500'">
                <div class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border" :class="toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'">
                    <i class="text-2xl" :class="toast.type === 'success' ? 'ph-fill ph-check-circle' : 'ph-fill ph-warning-circle'"></i>
                </div>
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <h3 class="text-white font-bold text-lg leading-none mb-2.5">{{ toast.title }}</h3>
                        <button @click="toast.show = false" class="text-slate-400 hover:text-white transition"><i class="ph ph-x"></i></button>
                    </div>
                    <p class="text-slate-300 text-sm leading-relaxed">{{ toast.message }}</p>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';
import { Line } from 'vue-chartjs';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

defineEmits(['change-view']);
const targets = ref([]);
const isLoading = ref(true);
const expandedTargetId = ref(null);
const isLoadingHistory = ref(false);
const chartData = ref(null);
let pollTimerICMP = null;

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
        x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 0 } }
    },
    elements: {
        line: { tension: 0.3, borderWidth: 2, borderColor: '#10b981' },
        point: { radius: 2, backgroundColor: '#10b981' }
    }
};

const filterStatus = ref('ALL');
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 15;

const showModal = ref(false);
const isSaving = ref(false);
const isEditMode = ref(false);
const editTargetId = ref(null);
const form = ref({ name: '', description: '', protocol: 'ICMP PING', ip_address: '', port: null, check_interval: 60, max_retries: 3 });

const showDeleteModal = ref(false);
const targetToDelete = ref(null);
const isDeleting = ref(false);

const toast = ref({ show: false, type: 'success', title: '', message: '' });
let toastTimer = null;
const showToast = (type, title, message) => {
    toast.value = { show: true, type, title, message };
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.value.show = false; }, 5000);
};

const filteredTargets = computed(() => {
    let list = targets.value;
    if (searchQuery.value.trim() !== '') {
        const query = searchQuery.value.toLowerCase();
        list = list.filter(t => t.name.toLowerCase().includes(query) || t.ip_address.toLowerCase().includes(query) || (t.description && t.description.toLowerCase().includes(query)));
    }
    if (filterStatus.value === 'PAUSED') return list.filter(t => t.is_active === 0);
    else if (filterStatus.value !== 'ALL') return list.filter(t => t.status === filterStatus.value && t.is_active === 1);
    return list;
});

watch(searchQuery, () => { currentPage.value = 1; });

const totalPages = computed(() => Math.ceil(filteredTargets.value.length / itemsPerPage) || 1);
const paginatedTargets = computed(() => filteredTargets.value.slice((currentPage.value - 1) * itemsPerPage, currentPage.value * itemsPerPage));
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };

const fetchTargets = async (isBackground = false) => {
    if (!isBackground) isLoading.value = true;
    try {
        const res = await fetch('/api/targets');
        const data = await res.json();
        if (data.success) {
            targets.value = data.data;
            if (expandedTargetId.value && isBackground) fetchHistory(expandedTargetId.value, true);
        }
    } catch (error) {
        console.error(error);
    } finally {
        isLoading.value = false;
    }
};

const togglePause = async (target) => {
    const newStatus = target.is_active ? 0 : 1;
    try {
        await fetch(`/api/targets/${target.id}/toggle`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: newStatus })
        });
        fetchTargets(true);
    } catch (err) {}
};

const toggleExpanded = (target) => {
    if (expandedTargetId.value === target.id) {
        expandedTargetId.value = null;
        chartData.value = null;
    } else {
        expandedTargetId.value = target.id;
        fetchHistory(target.id, false);
    }
};

const fetchHistory = async (targetId, isSilent) => {
    if (!isSilent) isLoadingHistory.value = true;
    try {
        const res = await fetch(`/api/targets/${targetId}/history`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
            const labels = data.data.map(d => d.time);
            const dataPoints = data.data.map(d => d.status === 'DOWN' ? 0 : (d.latency_ms || 0));
            chartData.value = { labels: labels, datasets: [{ data: dataPoints, backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true }] };
        } else {
            chartData.value = null;
        }
    } catch (err) {} finally {
        isLoadingHistory.value = false;
    }
};

const openAddModal = () => {
    isEditMode.value = false;
    form.value = { name: '', description: '', protocol: 'ICMP PING', ip_address: '', port: null, check_interval: 60, max_retries: 3 };
    showModal.value = true;
};

const editTarget = (target) => {
    isEditMode.value = true;
    editTargetId.value = target.id;
    form.value = { ...target };
    showModal.value = true;
};

const saveTarget = async () => {
    isSaving.value = true;
    try {
        const url = isEditMode.value ? `/api/targets/${editTargetId.value}` : '/api/targets';
        const method = isEditMode.value ? 'PUT' : 'POST';
        if (form.value.protocol === 'ICMP PING') form.value.port = null;
        
        const res = await fetch(url, {
            method: method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form.value)
        });
        
        const data = await res.json();
        if (data.success) {
            closeModal();
            fetchTargets();
            showToast('success', isEditMode.value ? 'Target Diperbarui' : 'Target Ditambahkan', data.message);
        } else {
            showToast('error', 'Gagal', data.message);
        }
    } catch (error) {
        showToast('error', 'Kesalahan', 'Gagal server.');
    } finally {
        isSaving.value = false;
    }
};

const confirmDeleteTarget = (target) => { targetToDelete.value = target; showDeleteModal.value = true; };
const closeDeleteModal = () => { showDeleteModal.value = false; targetToDelete.value = null; };
const executeDeleteTarget = async () => {
    if (!targetToDelete.value) return;
    isDeleting.value = true;
    try {
        const res = await fetch(`/api/targets/${targetToDelete.value.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) { await fetchTargets(); showToast('success', 'Target Dihapus', data.message); closeDeleteModal(); }
    } catch (error) {} finally { isDeleting.value = false; }
};
const closeModal = () => { showModal.value = false; };

// =====================================
// PERBAIKAN: Fungsi Waktu Tahan Banting
// =====================================

const parseMySQLDate = (timestamp) => {
    if (!timestamp) return null;
    
    // Jika datanya sudah berupa objek Date atau string ISO (mengandung 'T' atau 'Z')
    // Langsung lemparkan ke Date parser bawaan browser.
    if (timestamp instanceof Date || timestamp.includes('T')) {
        return new Date(timestamp);
    }
    
    // Jika datanya berupa string MySQL mentah tanpa zona waktu (contoh: "2026-10-21 09:00:00")
    // Paksa browser membacanya sebagai UTC dengan menambahkan 'Z'
    const isoString = timestamp.trim().replace(' ', 'T') + 'Z';
    return new Date(isoString);
};

const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Belum dicek';
    
    const dateObj = parseMySQLDate(timestamp);
    // Jika gagal di-parsing, kembalikan '-' agar tidak muncul NaN
    if (!dateObj || isNaN(dateObj.getTime())) return '-';
    
    const diffInSeconds = Math.floor((new Date() - dateObj) / 1000);
    
    if (diffInSeconds < 60) return `${Math.max(0, diffInSeconds)} dtk lalu`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} mnt lalu`;
    
    return '> 1 jam lalu';
};

const getUptimeDuration = (timestamp) => {
    if (!timestamp) return '-';
    
    const dateObj = parseMySQLDate(timestamp);
    // Jika gagal di-parsing, kembalikan '-' agar tidak muncul NaN
    if (!dateObj || isNaN(dateObj.getTime())) return '-';
    
    const diffSeconds = Math.floor((new Date() - dateObj) / 1000);
    
    if (diffSeconds < 0) return '0 dtk';
    if (diffSeconds < 60) return `${diffSeconds} dtk`;
    
    const d = Math.floor(diffSeconds / 86400);
    const h = Math.floor((diffSeconds % 86400) / 3600);
    const m = Math.floor((diffSeconds % 3600) / 60);
    
    if (d > 0) return `${d}h ${h}j`;
    if (h > 0) return `${h}j ${m}m`;
    return `${m} mnt`;
};

onMounted(() => {
    fetchTargets();
    pollTimerICMP = setInterval(() => { fetchTargets(true); }, 5000);
});

onUnmounted(() => {
    if (pollTimerICMP) clearInterval(pollTimerICMP);
});
</script>

<style scoped>
@keyframes slide-in { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
.animate-slide-in { animation: slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
</style>