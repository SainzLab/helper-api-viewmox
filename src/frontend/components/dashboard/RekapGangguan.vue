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
                <button @click="fetchDataAll" class="px-5 py-2.5 bg-moxgreen text-moxdark rounded-lg flex items-center gap-2 hover:bg-emerald-400 text-sm font-bold transition shadow-lg shadow-emerald-500/20">
                    <i class="ph-bold ph-arrows-clockwise"></i> Refresh Data
                </button>
            </div>
        </div>

        <!-- Stats Bar (5 Kolom) -->
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

        <!-- ANALITIK KINERJA SISTEM -->
        <div class="mb-6">
            <div class="flex items-center justify-between mb-4 mt-10">
                <div>
                    <h3 class="text-base font-bold text-white flex items-center gap-2">
                        <i class="ph-bold ph-chart-line-up text-moxgreen"></i> Analitik Kinerja Sistem
                    </h3>
                    <p class="text-xs text-slate-500 mt-0.5">Dihitung dari tiket yang sudah selesai &bull; {{ analyticsFilter === 'year' ? 'Tahun ' + currentYearLabel : 'Bulan ' + currentMonthLabel }}</p>
                </div>
                
                <!-- BAGIAN FILTER BARU -->
                <div class="flex gap-3 items-center">
                    
                    <!-- DROPDOWN FILTER SEVERITY -->
                    <select v-model="analyticsSeverity" @change="fetchAnalytics" class="bg-slate-900/80 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg px-4 py-2 outline-none focus:border-moxgreen shadow-sm appearance-none pr-9 cursor-pointer transition hover:border-slate-500 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22%2394a3b8%22%20viewBox%3D%220%200%20256%20256%22%3E%3Cpath%20d%3D%22M213.66%2C101.66l-80%2C80a8%2C8%2C0%2C0%2C1-11.32%2C0l-80-80A8%2C8%2C0%2C0%2C1%2C53.66%2C90.34L128%2C164.69l74.34-74.35a8%2C8%2C0%2C0%2C1%2C11.32%2C11.32Z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.75rem_center]">
                        <option value="">Semua Gangguan</option>
                        <option value="DOWN">🔥 Khusus DOWN (Mati Total)</option>
                        <option value="CRITICAL">🚨 Khusus CRITICAL</option>
                        <option value="WARNING">⚠️ Khusus WARNING</option>
                    </select>

                    <!-- FILTER WAKTU (BULAN/TAHUN) -->
                    <div class="flex bg-slate-900/50 border border-slate-800 rounded-lg p-1">
                        <button @click="setAnalyticsFilter('month')" class="px-4 py-1.5 rounded-md text-xs font-bold transition" :class="analyticsFilter === 'month' ? 'bg-moxgreen text-moxdark' : 'text-slate-400 hover:text-white'">Bulan Ini</button>
                        <button @click="setAnalyticsFilter('year')" class="px-4 py-1.5 rounded-md text-xs font-bold transition" :class="analyticsFilter === 'year' ? 'bg-moxgreen text-moxdark' : 'text-slate-400 hover:text-white'">Tahun Ini</button>
                    </div>
                </div>
            </div>

            <!-- KPI Cards dengan Formatting Presisi Detik -->
            <div class="grid grid-cols-4 gap-4 mb-4">
                <div class="bg-moxcard border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                    <div class="absolute -right-4 -top-4 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all"></div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10"><i class="ph-bold ph-timer text-cyan-400"></i> MTTR</p>
                    <h3 class="text-2xl font-bold text-white leading-none relative z-10">{{ formatPreciseDuration(analytics.summary.mttr_sec) }}</h3>
                    <p class="text-[11px] text-slate-500 mt-2 relative z-10">Rata-rata waktu pemulihan per gangguan</p>
                </div>
                <div class="bg-moxcard border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition-colors">
                    <div class="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10"><i class="ph-bold ph-heartbeat text-amber-400"></i> MTBF</p>
                    <h3 class="text-2xl font-bold text-white leading-none relative z-10">{{ formatPreciseDuration(analytics.summary.mtbf_sec) }}</h3>
                    <p class="text-[11px] text-slate-500 mt-2 relative z-10">Rata-rata jarak waktu antar gangguan</p>
                </div>
                <div class="bg-moxcard border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-violet-500/30 transition-colors">
                    <div class="absolute -right-4 -top-4 w-16 h-16 bg-violet-500/10 rounded-full blur-xl group-hover:bg-violet-500/20 transition-all"></div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10"><i class="ph-bold ph-hourglass-medium text-violet-400"></i> MTTF</p>
                    <h3 class="text-2xl font-bold text-white leading-none relative z-10">{{ formatPreciseDuration(analytics.summary.mttf_sec) }}</h3>
                    <p class="text-[11px] text-slate-500 mt-2 relative z-10">Rata-rata waktu operasi hingga gagal</p>
                </div>
                <div class="bg-moxcard border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                    <div class="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10"><i class="ph-bold ph-shield-check text-moxgreen"></i> Availability</p>
                    <h3 class="text-2xl font-bold leading-none relative z-10" :class="availabilityColor">{{ analytics.summary.availability }}<span class="text-sm font-medium ml-0.5">%</span></h3>
                    <div class="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden relative z-10">
                        <div class="h-full rounded-full transition-all duration-700" :class="availabilityBar" :style="{ width: Math.min(100, analytics.summary.availability) + '%' }"></div>
                    </div>
                </div>
            </div>

            <!-- Grafik -->
            <div v-if="analyticsError" class="bg-moxcard border border-rose-500/30 rounded-xl p-6 text-center text-sm text-rose-400 shadow-inner">
                <i class="ph-bold ph-warning"></i> {{ analyticsError }}
            </div>
            <div v-else class="grid grid-cols-2 gap-4">
                <div class="bg-moxcard border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-1">Availability (%)</h4>
                    <p class="text-[11px] text-slate-500 mb-2">Persentase ketersediaan sistem per {{ analyticsFilter === 'year' ? 'bulan' : 'hari' }}</p>
                    <apexchart type="area" height="260" :options="availabilityOptions" :series="availabilitySeries" />
                </div>
                <div class="bg-moxcard border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20">
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-1">MTTR (Hari / Jam / Menit / Detik)</h4>
                    <p class="text-[11px] text-slate-500 mb-2">Rata-rata durasi pemulihan per {{ analyticsFilter === 'year' ? 'bulan' : 'hari' }}</p>
                    <apexchart type="bar" height="260" :options="mttrOptions" :series="mttrSeries" />
                    <div v-if="mttrInfo" class="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-3 text-[11px]">
                        <div><p class="text-slate-500 mb-0.5">Terlama ({{ mttrInfo.peak.label }})</p><p class="font-bold text-rose-400">{{ formatPreciseDuration(mttrInfo.peak.mttr_sec) }}</p></div>
                        <div><p class="text-slate-500 mb-0.5">Tercepat ({{ mttrInfo.low.label }})</p><p class="font-bold text-emerald-400">{{ formatPreciseDuration(mttrInfo.low.mttr_sec) }}</p></div>
                        <div><p class="text-slate-500 mb-0.5">Rata-rata ({{ mttrInfo.count }} periode)</p><p class="font-bold text-cyan-400">{{ formatPreciseDuration(mttrInfo.avg) }}</p></div>
                    </div>
                </div>
                <div class="bg-moxcard border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20 col-span-2">
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-1">MTBF &amp; MTTF (Hari / Jam / Menit / Detik)</h4>
                    <p class="text-[11px] text-slate-500 mb-2">Ketahanan sistem sebelum mengalami gangguan per {{ analyticsFilter === 'year' ? 'bulan' : 'hari' }}</p>
                    <apexchart type="line" height="260" :options="reliabilityOptions" :series="reliabilitySeries" />
                    <div v-if="mtbfInfo" class="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-3 text-[11px]">
                        <div><p class="text-slate-500 mb-0.5">MTBF terpanjang ({{ mtbfInfo.peak.label }})</p><p class="font-bold text-emerald-400">{{ formatPreciseDuration(mtbfInfo.peak.mtbf_sec) }}</p></div>
                        <div><p class="text-slate-500 mb-0.5">MTBF terpendek ({{ mtbfInfo.low.label }})</p><p class="font-bold text-rose-400">{{ formatPreciseDuration(mtbfInfo.low.mtbf_sec) }}</p></div>
                        <div><p class="text-slate-500 mb-0.5">Rata-rata ({{ mtbfInfo.count }} periode)</p><p class="font-bold text-amber-400">{{ formatPreciseDuration(mtbfInfo.avg) }}</p></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filter & Search Box... (Tetap sama) -->
        <div class="flex gap-4 mb-6">
            <div class="relative flex-1">
                <i class="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg"></i>
                <input v-model="searchQuery" type="text" placeholder="Cari tiket / server / IP / jenis gangguan..." class="w-full bg-slate-900/50 border border-slate-800 text-white text-sm rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-moxgreen/50 focus:border-moxgreen transition shadow-sm" >
            </div>
            <select v-model="statusFilter" class="bg-slate-900/50 border border-slate-800 text-white text-sm rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-moxgreen/50 focus:border-moxgreen shadow-sm w-48 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22%2394a3b8%22%20viewBox%3D%220%200%20256%20256%22%3E%3Cpath%20d%3D%22M213.66%2C101.66l-80%2C80a8%2C8%2C0%2C0%2C1-11.32%2C0l-80-80A8%2C8%2C0%2C0%2C1%2C53.66%2C90.34L128%2C164.69l74.34-74.35a8%2C8%2C0%2C0%2C1%2C11.32%2C11.32Z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center]">
                <option value="">Semua Status</option>
                <option value="DOWN">DOWN</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="WARNING">WARNING</option>
                <option value="PROGRESS">Dalam Penanganan</option>
                <option value="RESOLVED">Selesai</option>
            </select>
        </div>

        <!-- Ticket List Dinamis -->
        <div class="space-y-4">
            <div v-if="isLoading" class="text-center py-10 text-slate-400">Memuat data tiket...</div>
            <div v-else-if="tickets.length === 0" class="text-center py-10 text-slate-500">Belum ada riwayat gangguan yang tercatat.</div>
            <div v-else-if="filteredTickets.length === 0" class="text-center py-10 text-slate-500">Tidak ada tiket yang cocok dengan pencarian/filter.</div>
            
            <div v-else v-for="ticket in filteredTickets" :key="ticket.id" class="bg-moxcard border rounded-xl overflow-hidden shadow-lg transition-colors duration-300" :class="ticket.isExpanded ? 'border-slate-700 ring-1 ring-slate-800' : 'border-slate-800/80'">
                <!-- Baris Utama Tiket (Header) -->
                <div class="flex items-center p-5 relative cursor-pointer" :class="ticket.isExpanded ? 'bg-slate-800/30' : 'hover:bg-slate-800/30'" @click="ticket.isExpanded = !ticket.isExpanded">
                    <div class="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-10 rounded-full" :class="getIndicatorColor(ticket)"></div>
                    <div class="pl-6 flex-1">
                        <div class="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-2">
                            <span class="text-white">{{ ticket.id }}</span> &bull; 
                            <span :class="ticket.is_resolved ? 'text-slate-500' : 'text-moxgreen'">{{ formatDate(ticket.time) }}</span>
                            <span v-if="ticket.is_resolved" class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Berhasil Ditangani</span>
                        </div>
                        <h3 class="text-base font-bold mb-1" :class="[ticket.isExpanded ? 'text-moxgreen' : '', ticket.is_resolved ? 'text-slate-300' : 'text-white']">
                            {{ ticket.title }}
                        </h3>
                        <div class="flex items-center gap-3">
                            <p class="text-xs text-slate-500 flex items-center gap-1.5"><i class="ph ph-hard-drive"></i> {{ ticket.target }}</p>
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" :class="getStatusBadge(ticket.status, ticket.severity)">
                                {{ ticket.severity === 'RECOVERED' ? 'PULIH (RECOVERED)' : (ticket.status === 'Gangguan Aktif' ? ticket.severity : ticket.status) }}
                            </span>
                        </div>
                    </div>
                    <div>
                        <button class="px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">
                            <template v-if="ticket.isExpanded"><i class="ph-bold ph-caret-up"></i> Tutup Laporan</template>
                            <template v-else>Lacak Laporan <i class="ph-bold ph-caret-right ml-1"></i></template>
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
                        <div class="absolute top-4 left-16 h-[2px] z-0 transition-all duration-1000 shadow-[0_0_8px_currentColor]" :class="getTimelineProgress(ticket.status)"></div>
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

                    <!-- FOOTER KETERANGAN DASHBOARD -->
                    <div class="bg-slate-900/50 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
                        <template v-if="ticket.status === 'Gangguan Aktif'">
                            <div class="flex items-center gap-3 text-slate-400">
                                <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-rose-400"><i class="ph-bold ph-bell-ringing"></i></div>
                                <div>
                                    <p class="text-xs font-bold text-slate-300">Menunggu Penanganan</p>
                                    <p class="text-[11px]">Sistem sedang menunggu respons dari teknisi via Aplikasi Mobile.</p>
                                </div>
                            </div>
                            <span class="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-md text-xs font-bold">TERDETEKSI</span>
                        </template>

                        <template v-else-if="ticket.status === 'Dalam Penanganan'">
                            <div class="flex items-center gap-3 text-slate-400">
                                <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400"><i class="ph-bold ph-users-three"></i></div>
                                <div class="flex flex-col gap-0.5">
                                    <p class="text-xs">Penanggung Jawab: <span class="font-bold text-cyan-400">{{ ticket.technicians }}</span></p>
                                    <p v-if="ticket.severity === 'RECOVERED'" class="text-[11px] font-bold text-blue-400 flex items-center gap-1.5"><i class="ph-bold ph-info"></i> Indikator telah pulih. Menunggu teknisi menutup tiket via Mobile.</p>
                                    <p v-else class="text-[11px] text-amber-400/80 flex items-center gap-1.5"><i class="ph-bold ph-wrench"></i> Sedang dikerjakan / perbaikan fisik lapangan.</p>
                                </div>
                            </div>
                            <span class="px-3 py-1 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-md text-xs font-bold animate-pulse">DIPROSES</span>
                        </template>

                        <template v-else>
                            <div class="flex items-center gap-3 text-slate-400">
                                <div class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20"><i class="ph-bold ph-check-circle"></i></div>
                                <p class="text-xs">Diselesaikan oleh: <span class="font-bold text-slate-300">{{ ticket.technicians || 'Sistem Otomatis (Auto-Recover)' }}</span></p>
                            </div>
                            <div class="flex gap-6 text-xs bg-slate-800/50 px-4 py-2.5 rounded border border-slate-700/50">
                                <p class="text-slate-400">Total Downtime: <span class="font-bold text-rose-400 ml-1">{{ ticket.downtime_duration }}</span></p>
                                <p class="text-slate-400 border-l border-slate-700 pl-4">Waktu Penanganan: <span class="font-bold text-cyan-400 ml-1">{{ ticket.handling_duration }}</span></p>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import VueApexCharts from 'vue3-apexcharts';

const apexchart = VueApexCharts;

// STATE UMUM
const tickets = ref([]);
const isLoading = ref(true);
const stats = ref({ down: 0, critical: 0, warning: 0, progress: 0, resolved: 0 });

// STATE SEARCH & FILTER TIKET
const searchQuery = ref('');
const statusFilter = ref('');
const filteredTickets = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    return tickets.value.filter(t => {
        const open = t.status !== 'Selesai';
        let okStatus = true;
        switch (statusFilter.value) {
            case 'DOWN': case 'CRITICAL': case 'WARNING':
                okStatus = t.severity === statusFilter.value && open; break;
            case 'PROGRESS': okStatus = t.status === 'Dalam Penanganan'; break;
            case 'RESOLVED': okStatus = t.status === 'Selesai'; break;
        }
        if (!okStatus) return false;
        if (!q) return true;
        return [t.id, t.title, t.target, t.severity, t.status, t.technicians]
            .some(v => v != null && String(v).toLowerCase().includes(q));
    });
});

// STATE ANALITIK
const currentMonthLabel = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
const currentYearLabel = new Date().toLocaleDateString('en-US', { year: 'numeric', timeZone: 'Asia/Jakarta' });
const analyticsFilter = ref('month');
const analyticsSeverity = ref(''); // STATE BARU UNTUK FILTER SEVERITY (KOSONG = SEMUA)
const analyticsError = ref('');
const analytics = ref({
    summary: { 
        mttr: 0, mtbf: 0, mttf: 0, availability: 100,
        mttr_sec: 0, mtbf_sec: 0, mttf_sec: 0, // Detik utuh dari backend
    },
    chartData: []
});

// Format Waktu & Warna Dasar
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace(',', ' -');
const getIndicatorColor = (t) => t.status === 'Selesai' ? 'bg-emerald-500' : t.severity === 'RECOVERED' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : t.severity === 'DOWN' ? 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.5)]' : t.severity === 'CRITICAL' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]';
const getStatusBadge = (s, sv) => s === 'Selesai' ? 'bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500/50' : sv === 'RECOVERED' ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/50' : s === 'Dalam Penanganan' ? 'bg-cyan-500/20 text-cyan-500' : sv === 'DOWN' ? 'bg-rose-600/20 text-rose-500' : sv === 'CRITICAL' ? 'bg-orange-500/20 text-orange-500' : 'bg-amber-400/20 text-amber-400';
const getTimelineProgress = (s) => s === 'Gangguan Aktif' ? 'bg-rose-500 w-0' : s === 'Dalam Penanganan' ? 'bg-gradient-to-r from-moxgreen to-cyan-500 w-[50%]' : 'bg-emerald-500 w-full';

// FORMATTER WAKTU PRESISI (Detik -> Hari, Jam, Menit, Detik)
const formatPreciseDuration = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return '0d';
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);

    let parts = [];
    if (d > 0) parts.push(`${d} hari`);
    if (h > 0) parts.push(`${h}j`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}d`);
    
    return parts.join(' ');
};

// PANGGILAN DATA API
const fetchDataAll = async () => {
    fetchTickets();
    fetchAnalytics();
};

const fetchTickets = async () => {
    isLoading.value = true;
    try {
        const response = await fetch('http://localhost:3000/api/incidents');
        const json = await response.json();
        if (json.success) {
            tickets.value = json.data.map((t, i) => ({ ...t, isExpanded: i === 0 && t.status !== 'Selesai' }));
            stats.value.down = tickets.value.filter(t => t.severity === 'DOWN' && t.is_resolved === 0).length;
            stats.value.critical = tickets.value.filter(t => t.severity === 'CRITICAL' && t.is_resolved === 0).length;
            stats.value.warning = tickets.value.filter(t => t.severity === 'WARNING' && t.is_resolved === 0).length;
            stats.value.progress = tickets.value.filter(t => t.status === 'Dalam Penanganan').length;
            stats.value.resolved = tickets.value.filter(t => t.is_resolved === 1).length;
        }
    } catch (e) { console.error(e); } finally { isLoading.value = false; }
};

const fetchAnalytics = async () => {
    try {
        // PENERAPAN QUERY SEVERITY
        let url = `http://localhost:3000/api/analytics?filter=${analyticsFilter.value}`;
        if (analyticsSeverity.value) {
            url += `&severity=${analyticsSeverity.value}`;
        }

        const response = await fetch(url);
        const json = await response.json();
        if (!json.success) throw new Error();
        
        analytics.value = {
            summary: {
                mttr: parseFloat(json.summary.mttr), 
                mtbf: parseFloat(json.summary.mtbf), 
                mttf: parseFloat(json.summary.mttf), 
                availability: parseFloat(json.summary.availability),
                mttr_sec: json.summary.mttr_sec, 
                mtbf_sec: json.summary.mtbf_sec, 
                mttf_sec: json.summary.mttf_sec
            },
            chartData: json.chartData.map(d => ({ 
                label: d.label, 
                mttr: parseFloat(d.mttr), 
                mtbf: parseFloat(d.mtbf), 
                mttf: parseFloat(d.mttf), 
                mttr_sec: d.mttr_sec ?? Math.round(parseFloat(d.mttr) * 3600),
                mtbf_sec: d.mtbf_sec ?? Math.round(parseFloat(d.mtbf) * 3600),
                mttf_sec: d.mttf_sec ?? Math.round(parseFloat(d.mttf) * 3600),
                availability: parseFloat(d.availability) 
            }))
        };
        analyticsError.value = '';
    } catch (e) {
        analyticsError.value = 'Gagal memuat grafik analitik.';
    }
};

const setAnalyticsFilter = (filter) => {
    if (analyticsFilter.value === filter) return;
    analyticsFilter.value = filter;
    fetchAnalytics();
};

// GRAFIK & VISUAL
const availabilityColor = computed(() => { const a = analytics.value.summary.availability; return a >= 99 ? 'text-moxgreen' : a >= 95 ? 'text-amber-400' : 'text-rose-500'; });
const availabilityBar = computed(() => { const a = analytics.value.summary.availability; return a >= 99 ? 'bg-moxgreen shadow-[0_0_8px_#10b981]' : a >= 95 ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'; });

// Konfigurasi ApexCharts
const chartLabels = computed(() => analytics.value.chartData.map(d => d.label));
const seriesOf = (key) => analytics.value.chartData.map(d => d[key]);

const baseChartOptions = (type) => ({
    chart: { type, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' },
    theme: { mode: 'dark' },
    grid: { borderColor: '#1e293b', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    xaxis: { categories: chartLabels.value, labels: { style: { colors: '#94a3b8', fontSize: '11px' } }, axisBorder: { color: '#334155' }, axisTicks: { color: '#334155' } },
    tooltip: { theme: 'dark' },
    legend: { labels: { colors: '#cbd5e1' }, fontSize: '11px' }
});

const availabilitySeries = computed(() => [{ name: 'Availability', data: seriesOf('availability') }]);
const availabilityOptions = computed(() => {
    const vals = seriesOf('availability');
    const minVal = vals.length ? Math.max(0, Math.floor(Math.min(...vals)) - 1) : 0;
    return {
        ...baseChartOptions('area'), colors: ['#10b981'], stroke: { curve: 'smooth', width: 2.5 },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02 } },
        yaxis: { min: minVal, max: 100, labels: { style: { colors: '#94a3b8', fontSize: '11px' }, formatter: (v) => `${v.toFixed(1)}%` } },
        tooltip: { y: { formatter: (v) => `${v.toFixed(2)}%` } }
    };
});

// ==========================================
// DETAIL WAKTU PADA CHART (Hari, Jam, Menit, Detik)
// ==========================================
// Nilai mentah chart dalam detik. Sumbu Y memakai satuan otomatis supaya skala rapi,
// tetapi label sumbu & tooltip tetap menampilkan hitungan Hari/Jam/Menit/Detik.
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
const seriesInUnit = (key, unit) => analytics.value.chartData.map(d => Math.round(((d[key] || 0) / unit.div) * 1000) / 1000);

// Versi lengkap untuk tooltip: "2 hari 3 jam 15 menit 42 detik (184.542 detik)"
const formatFullDuration = (totalSeconds) => {
    const total = Math.max(0, Math.round(Number(totalSeconds) || 0));
    if (total === 0) return 'Tidak ada data (0 detik)';
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const parts = [];
    if (d > 0) parts.push(`${d} hari`);
    if (h > 0) parts.push(`${h} jam`);
    if (m > 0) parts.push(`${m} menit`);
    if (s > 0) parts.push(`${s} detik`);
    return `${parts.join(' ')} (${total.toLocaleString('id-ID')} detik)`;
};

const mttrUnit = computed(() => pickChartUnit(Math.max(0, ...analytics.value.chartData.map(d => d.mttr_sec))));
const reliabilityUnit = computed(() => pickChartUnit(Math.max(0, ...analytics.value.chartData.flatMap(d => [d.mtbf_sec, d.mttf_sec]))));

// Ringkasan di bawah chart: periode dengan nilai tertinggi & rata-rata (hanya periode yang ada datanya)
const describeSeries = (key) => {
    const rows = analytics.value.chartData.filter(d => d[key] > 0);
    if (rows.length === 0) return null;
    const peak = rows.reduce((a, b) => (b[key] > a[key] ? b : a));
    const low = rows.reduce((a, b) => (b[key] < a[key] ? b : a));
    const avg = rows.reduce((sum, d) => sum + d[key], 0) / rows.length;
    return { peak, low, avg, count: rows.length };
};
const mttrInfo = computed(() => describeSeries('mttr_sec'));
const mtbfInfo = computed(() => describeSeries('mtbf_sec'));

const durationAxis = (unit) => ({
    min: 0,
    title: { text: `${unit.name} (label: hari/jam/menit/detik)`, style: { color: '#64748b', fontSize: '10px', fontWeight: 600 } },
    labels: {
        style: { colors: '#94a3b8', fontSize: '11px' },
        formatter: (v) => formatPreciseDuration(Math.round(v * unit.div))
    }
});

const mttrSeries = computed(() => [{ name: 'MTTR', data: seriesInUnit('mttr_sec', mttrUnit.value) }]);
const mttrOptions = computed(() => ({
    ...baseChartOptions('bar'), colors: ['#06b6d4'],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    yaxis: durationAxis(mttrUnit.value),
    tooltip: { theme: 'dark', y: { formatter: (v, { dataPointIndex }) => formatFullDuration(analytics.value.chartData[dataPointIndex]?.mttr_sec) } }
}));

const reliabilitySeries = computed(() => [
    { name: 'MTBF', data: seriesInUnit('mtbf_sec', reliabilityUnit.value) },
    { name: 'MTTF', data: seriesInUnit('mttf_sec', reliabilityUnit.value) }
]);
const reliabilityOptions = computed(() => ({
    ...baseChartOptions('line'), colors: ['#f59e0b', '#a78bfa'],
    stroke: { curve: 'smooth', width: [2.5, 2.5], dashArray: [0, 6] },
    yaxis: durationAxis(reliabilityUnit.value),
    tooltip: {
        theme: 'dark',
        y: {
            formatter: (v, { seriesIndex, dataPointIndex }) => {
                const d = analytics.value.chartData[dataPointIndex];
                return formatFullDuration(seriesIndex === 0 ? d?.mtbf_sec : d?.mttf_sec);
            }
        }
    }
}));
let refreshTimer = null;
onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer); });
onMounted(() => {
    fetchDataAll();
    refreshTimer = setInterval(fetchDataAll, 30000);
});
</script>