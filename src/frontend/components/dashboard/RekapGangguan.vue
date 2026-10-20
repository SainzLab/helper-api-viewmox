<template>
    <main class="p-8 pb-12 overflow-x-hidden">
        <!-- Header Halaman -->
        <div class="flex justify-between items-end mb-6">
            <div>
                <h2 class="text-2xl font-bold text-white mb-1">
                    <i class="ph-bold ph-ticket text-moxgreen"></i> Rekap & Pelacakan Status Gangguan
                </h2>
                <p class="text-slate-400 text-sm">Pemantauan riwayat insiden dan performa respons teknisi.</p>
            </div>
            <div class="flex gap-3">
                <button class="px-5 py-2.5 bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg text-sm font-medium transition">
                    Export Laporan
                </button>
                <button @click="fetchTickets" class="px-5 py-2.5 bg-moxgreen text-moxdark rounded-lg flex items-center gap-2 hover:bg-emerald-400 text-sm font-bold transition shadow-lg shadow-emerald-500/20">
                    <i class="ph-bold ph-arrows-clockwise"></i> Refresh Data
                </button>
            </div>
        </div>

        <!-- Stats Bar (5 Kolom: Down, Critical, Warning, Penanganan, Selesai) -->
        <div class="bg-moxcard border border-slate-800 rounded-xl shadow-lg mb-6 grid grid-cols-5 divide-x divide-slate-800/80">
            <div class="p-5 flex items-center gap-4">
                <div class="w-1.5 h-10 bg-rose-600 rounded-full shadow-[0_0_8px_rgba(225,29,72,0.6)]"></div>
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Down</p>
                    <h3 class="text-2xl font-bold text-white leading-none">{{ stats.down }} <span class="text-sm font-medium text-rose-600">Tiket</span></h3>
                </div>
            </div>
            <div class="p-5 flex items-center gap-4">
                <div class="w-1.5 h-10 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Critical</p>
                    <h3 class="text-2xl font-bold text-white leading-none">{{ stats.critical }} <span class="text-sm font-medium text-orange-500">Tiket</span></h3>
                </div>
            </div>
            <div class="p-5 flex items-center gap-4">
                <div class="w-1.5 h-10 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div>
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Warning</p>
                    <h3 class="text-2xl font-bold text-white leading-none">{{ stats.warning }} <span class="text-sm font-medium text-amber-400">Tiket</span></h3>
                </div>
            </div>
            <div class="p-5 flex items-center gap-4">
                <div class="w-1.5 h-10 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Penanganan</p>
                    <h3 class="text-2xl font-bold text-white leading-none">{{ stats.progress }} <span class="text-sm font-medium text-cyan-500">Proses</span></h3>
                </div>
            </div>
            <div class="p-5 flex items-center gap-4">
                <div class="w-1.5 h-10 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Selesai</p>
                    <h3 class="text-2xl font-bold text-white leading-none">{{ stats.resolved }} <span class="text-sm font-medium text-emerald-500">Tiket</span></h3>
                </div>
            </div>
        </div>

        <!-- Filter & Search -->
        <div class="flex gap-4 mb-6">
            <div class="relative flex-1">
                <i class="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg"></i>
                <input type="text" placeholder="Cari tiket / server / IP / jenis gangguan..." class="w-full bg-slate-900/50 border border-slate-800 text-white text-sm rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-moxgreen transition shadow-sm" >
            </div>
            <select class="bg-slate-900/50 border border-slate-800 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-moxgreen shadow-sm w-48 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22%2394a3b8%22%20viewBox%3D%220%200%20256%20256%22%3E%3Cpath%20d%3D%22M213.66%2C101.66l-80%2C80a8%2C8%2C0%2C0%2C1-11.32%2C0l-80-80A8%2C8%2C0%2C0%2C1%2C53.66%2C90.34L128%2C164.69l74.34-74.35a8%2C8%2C0%2C0%2C1%2C11.32%2C11.32Z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center]">
                <option>Semua Status</option>
                <option>DOWN</option>
                <option>CRITICAL</option>
                <option>WARNING</option>
                <option>Selesai</option>
            </select>
        </div>

        <!-- Ticket List Dinamis -->
        <div class="space-y-4">
            <div v-if="isLoading" class="text-center py-10 text-slate-400">Memuat data tiket...</div>
            <div v-else-if="tickets.length === 0" class="text-center py-10 text-slate-500">Belum ada riwayat gangguan yang tercatat.</div>
            
            <div v-else v-for="(ticket, index) in tickets" :key="index" class="bg-moxcard border rounded-xl overflow-hidden shadow-lg transition-colors duration-300" :class="ticket.isExpanded ? 'border-slate-700 ring-1 ring-slate-800' : 'border-slate-800/80'">
                
                <!-- Baris Utama Tiket (Header) -->
                <div class="flex items-center p-5 relative cursor-pointer" :class="ticket.isExpanded ? 'bg-slate-800/30' : 'hover:bg-slate-800/30'" @click="ticket.isExpanded = !ticket.isExpanded">
                    
                    <!-- Indikator Warna Garis Kiri -->
                    <div class="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-10 rounded-full" :class="getIndicatorColor(ticket)"></div>
                    
                    <div class="pl-6 flex-1">
                        <div class="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-2">
                            <span class="text-white">{{ ticket.id }}</span> &bull; 
                            <span :class="ticket.is_resolved ? 'text-slate-500' : 'text-moxgreen'">{{ formatDate(ticket.time) }}</span>
                            <!-- Label Info khusus untuk Selesai -->
                            <span v-if="ticket.is_resolved" class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Berhasil Ditangani</span>
                        </div>
                        
                        <h3 class="text-base font-bold mb-1" :class="[ticket.isExpanded ? 'text-moxgreen' : '', ticket.is_resolved ? 'text-slate-300' : 'text-white']">
                            {{ ticket.title }}
                        </h3>
                        
                        <div class="flex items-center gap-3">
                            <p class="text-xs text-slate-500 flex items-center gap-1.5">
                                <i class="ph ph-hard-drive"></i> {{ ticket.target }} 
                            </p>
                            <!-- Badge Label Severity/Status -->
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" :class="getStatusBadge(ticket.status, ticket.severity)">
                                {{ ticket.severity === 'RECOVERED' ? 'PULIH (RECOVERED)' : (ticket.status === 'Gangguan Aktif' ? ticket.severity : ticket.status) }}
                            </span>
                        </div>
                    </div>
                    
                    <div>
                        <button class="px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">
                            <template v-if="ticket.isExpanded">
                                <i class="ph-bold ph-caret-up"></i> Tutup Laporan
                            </template>
                            <template v-else>
                                Lacak Laporan <i class="ph-bold ph-caret-right ml-1"></i>
                            </template>
                        </button>
                    </div>
                </div>

                <!-- Bagian Expand (Timeline Tracker) -->
                <div v-if="ticket.isExpanded" class="border-t border-slate-800/80 p-6 bg-slate-900/20">
                    <div class="flex items-center gap-2 mb-8">
                        <div class="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" :class="ticket.is_resolved ? 'bg-emerald-500' : 'bg-moxgreen'"></div>
                        <h4 class="text-[11px] font-bold text-white uppercase tracking-wider">Laporan Pemantauan</h4>
                    </div>

                    <!-- TIMELINE INTERAKTIF -->
                    <div class="relative px-4 mb-10 mt-6">
                        <div class="absolute top-4 left-16 right-16 h-[2px] bg-slate-800 z-0"></div>
                        <div class="absolute top-4 left-16 h-[2px] z-0 transition-all duration-1000" :class="getTimelineProgress(ticket.status)"></div>

                        <div class="relative z-10 flex justify-between items-start">
                            <div class="flex flex-col items-center gap-3 w-24">
                                <div class="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-moxdark shadow-[0_0_12px_rgba(16,185,129,0.3)]" :class="ticket.is_resolved ? 'bg-emerald-500' : 'bg-moxgreen'">
                                    <i class="ph-bold ph-check text-lg"></i>
                                </div>
                                <span class="text-xs font-bold text-slate-300 text-center leading-tight">Gangguan Terdeteksi</span>
                            </div>

                            <div class="flex flex-col items-center gap-3 w-24">
                                <div class="w-8 h-8 shrink-0 rounded-full border flex items-center justify-center transition-colors duration-500" 
                                     :class="ticket.status === 'Gangguan Aktif' ? 'bg-slate-800 text-slate-500 border-slate-700' : (ticket.status === 'Selesai' ? 'bg-emerald-500 text-white border-emerald-500' : (ticket.severity === 'RECOVERED' ? 'bg-blue-500/20 text-blue-400 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]' : 'bg-cyan-500/20 text-cyan-500 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'))">
                                    <i v-if="ticket.status === 'Selesai'" class="ph-bold ph-check text-lg"></i>
                                    <i v-else class="ph-fill ph-wrench text-lg"></i>
                                </div>
                                <span class="text-xs font-bold text-center leading-tight" :class="ticket.status === 'Gangguan Aktif' ? 'text-slate-500' : (ticket.status === 'Selesai' ? 'text-emerald-500' : (ticket.severity === 'RECOVERED' ? 'text-blue-400' : 'text-cyan-500'))">Perbaikan Mobile</span>
                            </div>

                            <div class="flex flex-col items-center gap-3 w-24">
                                <div class="w-8 h-8 shrink-0 rounded-full border flex items-center justify-center transition-colors duration-500"
                                     :class="ticket.status === 'Selesai' ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-slate-500 border-slate-700'">
                                    <i v-if="ticket.status === 'Selesai'" class="ph-bold ph-check text-lg"></i>
                                    <span v-else class="font-bold text-sm">3</span>
                                </div>
                                <span class="text-xs font-medium text-center leading-tight" :class="ticket.status === 'Selesai' ? 'text-emerald-500 font-bold' : 'text-slate-500'">Terkonfirmasi</span>
                            </div>
                        </div>
                    </div>

                    <!-- FOOTER KETERANGAN DASHBOARD (READ ONLY) -->
                    <div class="bg-slate-900/50 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
                        
                        <!-- JIKA STATUS: GANGGUAN AKTIF -->
                        <template v-if="ticket.status === 'Gangguan Aktif'">
                            <div class="flex items-center gap-3 text-slate-400">
                                <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-rose-400">
                                    <i class="ph-bold ph-bell-ringing"></i>
                                </div>
                                <div>
                                    <p class="text-xs font-bold text-slate-300">Menunggu Penanganan</p>
                                    <p class="text-[11px]">Sistem sedang menunggu respons dari teknisi via Aplikasi Mobile.</p>
                                </div>
                            </div>
                            <span class="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-md text-xs font-bold">TERDETEKSI</span>
                        </template>

                        <!-- JIKA STATUS: DALAM PENANGANAN -->
                        <template v-else-if="ticket.status === 'Dalam Penanganan'">
                            <div class="flex items-center gap-3 text-slate-400">
                                <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400">
                                    <i class="ph-bold ph-users-three"></i>
                                </div>
                                <div class="flex flex-col gap-0.5">
                                    <p class="text-xs">
                                        Penanggung Jawab: <span class="font-bold text-cyan-400">{{ ticket.technicians }}</span>
                                    </p>
                                    <!-- Keterangan Biru jika Daemon mendeteksi sistem sudah normal -->
                                    <p v-if="ticket.severity === 'RECOVERED'" class="text-[11px] font-bold text-blue-400 flex items-center gap-1.5">
                                        <i class="ph-bold ph-info"></i> Indikator telah pulih. Menunggu teknisi menutup tiket via Mobile.
                                    </p>
                                    <p v-else class="text-[11px] text-amber-400/80 flex items-center gap-1.5">
                                        <i class="ph-bold ph-wrench"></i> Sedang dikerjakan / perbaikan fisik lapangan.
                                    </p>
                                </div>
                            </div>
                            <span class="px-3 py-1 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-md text-xs font-bold animate-pulse">DIPROSES</span>
                        </template>

                        <!-- JIKA STATUS: SELESAI -->
                        <template v-else>
                            <div class="flex items-center gap-3 text-slate-400">
                                <div class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                    <i class="ph-bold ph-check-circle"></i>
                                </div>
                                <p class="text-xs">
                                    Diselesaikan oleh: <span class="font-bold text-slate-300">{{ ticket.technicians || 'Sistem Otomatis (Auto-Recover)' }}</span>
                                </p>
                            </div>
                            <div class="flex gap-6 text-xs bg-slate-800/50 px-4 py-2.5 rounded border border-slate-700/50">
                                <p class="text-slate-400">Total Downtime: <span class="font-bold text-rose-400 ml-1">{{ ticket.downtime_duration }}</span></p>
                                <p class="text-slate-400 border-l border-slate-700 pl-4">Waktu Penanganan (MTTR): <span class="font-bold text-cyan-400 ml-1">{{ ticket.handling_duration }}</span></p>
                            </div>
                        </template>

                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const tickets = ref([]);
const isLoading = ref(true);

const stats = ref({
    down: 0,
    critical: 0,
    warning: 0,
    progress: 0,
    resolved: 0
});

// Format Tanggal
const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options).replace(',', ' -');
};

// Penentu Warna Garis Kiri
const getIndicatorColor = (ticket) => {
    if (ticket.status === 'Selesai') return 'bg-emerald-500';
    if (ticket.severity === 'RECOVERED') return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
    if (ticket.severity === 'DOWN') return 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.5)]';
    if (ticket.severity === 'CRITICAL') return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]';
    return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]';
};

// Badge Status
const getStatusBadge = (status, severity) => {
    if (status === 'Selesai') return 'bg-emerald-500/20 text-emerald-500';
    if (severity === 'RECOVERED') return 'bg-blue-500/20 text-blue-400';
    if (status === 'Dalam Penanganan') return 'bg-cyan-500/20 text-cyan-500';
    if (severity === 'DOWN') return 'bg-rose-600/20 text-rose-500';
    if (severity === 'CRITICAL') return 'bg-orange-500/20 text-orange-500';
    return 'bg-amber-400/20 text-amber-400';
};

// Animasi Garis Timeline
const getTimelineProgress = (status) => {
    if (status === 'Gangguan Aktif') return 'bg-rose-500 w-0';
    if (status === 'Dalam Penanganan') return 'bg-gradient-to-r from-moxgreen to-cyan-500 w-[50%]';
    return 'bg-emerald-500 w-full';
};

// Fetch Data dari API Backend
const fetchTickets = async () => {
    isLoading.value = true;
    try {
        const response = await fetch('http://localhost:3000/api/incidents');
        const json = await response.json();
        
        if (json.success) {
            tickets.value = json.data.map((t, i) => ({
                ...t,
                isExpanded: i === 0 && t.status !== 'Selesai' // Buka tiket teratas jika masih aktif
            }));
            
            // Kalkulasi Statistik
            stats.value.down = tickets.value.filter(t => t.severity === 'DOWN' && t.is_resolved === 0).length;
            stats.value.critical = tickets.value.filter(t => t.severity === 'CRITICAL' && t.is_resolved === 0).length;
            stats.value.warning = tickets.value.filter(t => t.severity === 'WARNING' && t.is_resolved === 0).length;
            stats.value.progress = tickets.value.filter(t => t.status === 'Dalam Penanganan').length;
            stats.value.resolved = tickets.value.filter(t => t.is_resolved === 1).length;
        }
    } catch (error) {
        console.error("Gagal mengambil data tiket:", error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchTickets();
    
    // Opsional: Polling otomatis data setiap 30 detik untuk Dashboard NOC
    setInterval(fetchTickets, 30000); 
});
</script>