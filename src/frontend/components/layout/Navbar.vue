<template>
  <header class="h-16 bg-moxdark border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-40">
    
    <!-- Breadcrumb & Jam Digital -->
    <div class="text-xs font-medium text-slate-400 flex items-center gap-2 uppercase tracking-wide">
      <div class="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/80 px-2.5 py-1 rounded text-slate-200 tracking-wider">
        <i class="ph-fill ph-clock text-moxgreen text-sm"></i>
        <span class="font-mono text-[11px] font-bold">{{ currentTime }}</span>
      </div>
    </div>
    
    <!-- Aksi Kanan Atas: Notifikasi & Pengaturan Cronjob -->
    <div class="flex items-center gap-2.5">
      <!-- Tombol Notifikasi + Dropdown -->
      <div class="relative" ref="notifWrapper">
        <button @click.stop="toggleDropdown"
                class="w-9 h-9 flex items-center justify-center bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 hover:text-white border border-slate-700 transition relative"
                :class="showDropdown ? 'bg-slate-700 text-white' : ''">
          <i class="ph ph-bell text-lg" :class="alerts.length > 0 ? 'animate-pulse text-rose-400' : ''"></i>
          <span v-if="alerts.length > 0"
                class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full border border-moxdark">
            {{ alerts.length > 99 ? '99+' : alerts.length }}
          </span>
        </button>

        <!-- Dropdown -->
        <div v-if="showDropdown"
             @click.stop
             class="absolute right-0 mt-3 w-96 bg-moxcard border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
          <div class="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <h4 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="ph-bold ph-bell-ringing text-moxgreen"></i> Notifikasi Gangguan
              <span class="w-1.5 h-1.5 rounded-full bg-moxgreen animate-ping" title="Realtime Sync"></span>
            </h4>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ alerts.length }} aktif</span>
          </div>

          <!-- Maksimal 4 item terlihat, sisanya bisa di-scroll (4 x 72px) -->
          <div class="max-h-[288px] overflow-y-auto divide-y divide-slate-800/80">
            <div v-if="isLoading && alerts.length === 0" class="p-6 text-center text-xs text-slate-500">
              <i class="ph ph-spinner animate-spin text-lg block mb-1"></i> Memuat notifikasi...
            </div>
            <div v-else-if="alerts.length === 0" class="p-6 text-center text-xs text-slate-500">
              <i class="ph ph-check-circle text-2xl text-moxgreen block mb-1"></i>
              Tidak ada gangguan aktif
            </div>
            <div v-else v-for="alert in alerts" :key="alert.id"
                 class="h-[72px] px-4 flex items-center gap-3 hover:bg-slate-800/40 transition">
              <div class="w-8 h-8 shrink-0 rounded-full flex items-center justify-center" :class="severityStyle(alert.severity).icon">
                <i class="ph-bold text-base" :class="severityStyle(alert.severity).iconClass"></i>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-white truncate">{{ alert.target_name }}</p>
                <p class="text-[11px] text-slate-400 truncate">{{ alert.message }}</p>
                <p class="text-[10px] text-slate-500 mt-0.5">{{ formatTime(alert.created_at) }}</p>
              </div>
              <span class="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded border uppercase" :class="severityStyle(alert.severity).badge">
                {{ alert.severity }}
              </span>
            </div>
          </div>

          <button @click="openAllModal"
                  class="w-full px-4 py-3 border-t border-slate-800 text-xs font-bold text-moxgreen hover:bg-slate-800/50 transition flex items-center justify-center gap-1.5">
            Lihat Semua <i class="ph-bold ph-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- Tombol Pengaturan Cronjob Pembersihan Otomatis -->
      <button
        @click.stop="openCleanupModal"
        title="Pengaturan Cronjob Pembersihan Log & Riwayat Gangguan"
        class="w-9 h-9 flex items-center justify-center bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 hover:text-moxgreen border border-slate-700 transition relative"
        :class="showCleanupModal ? 'bg-slate-700 text-moxgreen border-moxgreen/50' : ''"
      >
        <i class="ph ph-gear text-lg"></i>
      </button>
    </div>
  </header>

  <!-- Popup Pengaturan Cronjob Pembersihan Otomatis -->
  <Teleport to="body">
    <div v-if="showCleanupModal"
         class="fixed inset-0 z-[85] flex items-center justify-center bg-moxdark/90 backdrop-blur-sm p-4"
         @click.self="showCleanupModal = false">
      <div class="bg-moxcard border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="ph-bold ph-gear text-moxgreen"></i> Pengaturan Cronjob Pembersihan Otomatis
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Konfigurasi interval penghapusan otomatis secara terpisah untuk Log Sistem dan Riwayat Gangguan.</p>
          </div>
          <button @click="showCleanupModal = false"
                  class="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <i class="ph-bold ph-x"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto flex-1 space-y-5">
          <!-- Feedback Alert -->
          <div v-if="cleanupFeedback.message"
               class="px-4 py-3 rounded-lg border text-xs font-bold flex items-center justify-between"
               :class="cleanupFeedback.isError ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/30 text-moxgreen'">
            <span class="flex items-center gap-2">
              <i class="ph-bold" :class="cleanupFeedback.isError ? 'ph-warning-circle' : 'ph-check-circle'"></i>
              {{ cleanupFeedback.message }}
            </span>
            <button @click="cleanupFeedback.message = ''" class="text-slate-400 hover:text-white">
              <i class="ph-bold ph-x"></i>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- CARD 1: PEMBERSIHAN LOG SISTEM -->
            <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                  <div>
                    <div class="flex items-center gap-2">
                      <i class="ph-bold ph-terminal-window text-cyan-400 text-base"></i>
                      <h4 class="text-sm font-bold text-white">1. Cronjob Log Sistem</h4>
                    </div>
                    <p class="text-[11px] text-slate-400 mt-0.5">Tabel <code class="text-cyan-400">system_logs</code> ({{ cleanupForm.system_logs.current_count }} baris)</p>
                  </div>
                  <button
                    type="button"
                    @click="cleanupForm.system_logs.is_enabled = !cleanupForm.system_logs.is_enabled"
                    class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition"
                    :class="cleanupForm.system_logs.is_enabled ? 'bg-emerald-500/15 text-moxgreen border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'"
                  >
                    {{ cleanupForm.system_logs.is_enabled ? 'Aktif' : 'Nonaktif' }}
                  </button>
                </div>

                <!-- Pilihan Cepat Interval Log -->
                <div class="mb-3">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Preset Interval Cepat</label>
                  <div class="grid grid-cols-4 gap-1.5">
                    <button type="button" @click="applyPreset('system_logs', 1, 'HOURS')" class="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700/80 transition">1 Jam</button>
                    <button type="button" @click="applyPreset('system_logs', 24, 'HOURS')" class="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700/80 transition">24 Jam</button>
                    <button type="button" @click="applyPreset('system_logs', 7, 'DAYS')" class="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700/80 transition">7 Hari</button>
                    <button type="button" @click="applyPreset('system_logs', 30, 'DAYS')" class="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700/80 transition">30 Hari</button>
                  </div>
                </div>

                <!-- Input Interval Kustom Log -->
                <div class="mb-3">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Interval Penghapusan Otomatis</label>
                  <div class="flex gap-2">
                    <input
                      v-model.number="cleanupForm.system_logs.interval_value"
                      type="number"
                      min="1"
                      class="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-moxgreen"
                    />
                    <select
                      v-model="cleanupForm.system_logs.interval_unit"
                      class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-moxgreen"
                    >
                      <option value="MINUTES">Menit Sekali</option>
                      <option value="HOURS">Jam Sekali</option>
                      <option value="DAYS">Hari Sekali</option>
                    </select>
                  </div>
                </div>

                <!-- Mode Cakupan Penghapusan Log -->
                <div class="mb-4">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Metode Pembersihan Saat Cron Jalan</label>
                  <select
                    v-model="cleanupForm.system_logs.retention_mode"
                    class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-moxgreen"
                  >
                    <option value="OLDER_THAN">Hapus log yang lebih lama dari interval</option>
                    <option value="ALL">Hapus seluruh log setiap interval tercapai</option>
                  </select>
                </div>
              </div>

              <!-- Info Jadwal & Tombol Manual Log -->
              <div class="pt-3 border-t border-slate-800 space-y-2.5">
                <div class="text-[11px] text-slate-400 space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <p class="flex justify-between"><span>Terakhir jalan:</span> <span class="text-slate-200 font-medium">{{ formatTime(cleanupForm.system_logs.last_run) }}</span></p>
                  <p class="flex justify-between"><span>Jadwal berikutnya:</span> <span class="text-cyan-400 font-medium">{{ cleanupForm.system_logs.is_enabled ? formatTime(cleanupForm.system_logs.next_run) : 'Nonaktif' }}</span></p>
                </div>
                <button
                  type="button"
                  @click="triggerManualCleanup('system_logs')"
                  :disabled="isRunningManual === 'system_logs'"
                  class="w-full py-2 px-3 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <i class="ph-bold" :class="isRunningManual === 'system_logs' ? 'ph-spinner animate-spin' : 'ph-trash'"></i>
                  {{ isRunningManual === 'system_logs' ? 'Membersihkan Log...' : 'Bersihkan Seluruh Log Sekarang' }}
                </button>
              </div>
            </div>

            <!-- CARD 2: PEMBERSIHAN RIWAYAT GANGGUAN -->
            <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                  <div>
                    <div class="flex items-center gap-2">
                      <i class="ph-bold ph-clock-counter-clockwise text-amber-400 text-base"></i>
                      <h4 class="text-sm font-bold text-white">2. Cronjob Riwayat Gangguan</h4>
                    </div>
                    <p class="text-[11px] text-slate-400 mt-0.5">Tiket Selesai &amp; Down History ({{ cleanupForm.incident_history.current_count }} riwayat)</p>
                  </div>
                  <button
                    type="button"
                    @click="cleanupForm.incident_history.is_enabled = !cleanupForm.incident_history.is_enabled"
                    class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition"
                    :class="cleanupForm.incident_history.is_enabled ? 'bg-emerald-500/15 text-moxgreen border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'"
                  >
                    {{ cleanupForm.incident_history.is_enabled ? 'Aktif' : 'Nonaktif' }}
                  </button>
                </div>

                <!-- Pilihan Cepat Interval Riwayat -->
                <div class="mb-3">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Preset Interval Cepat</label>
                  <div class="grid grid-cols-4 gap-1.5">
                    <button type="button" @click="applyPreset('incident_history', 1, 'HOURS')" class="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700/80 transition">1 Jam</button>
                    <button type="button" @click="applyPreset('incident_history', 24, 'HOURS')" class="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700/80 transition">24 Jam</button>
                    <button type="button" @click="applyPreset('incident_history', 7, 'DAYS')" class="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700/80 transition">7 Hari</button>
                    <button type="button" @click="applyPreset('incident_history', 30, 'DAYS')" class="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700/80 transition">30 Hari</button>
                  </div>
                </div>

                <!-- Input Interval Kustom Riwayat -->
                <div class="mb-3">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Interval Penghapusan Otomatis</label>
                  <div class="flex gap-2">
                    <input
                      v-model.number="cleanupForm.incident_history.interval_value"
                      type="number"
                      min="1"
                      class="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-moxgreen"
                    />
                    <select
                      v-model="cleanupForm.incident_history.interval_unit"
                      class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-moxgreen"
                    >
                      <option value="MINUTES">Menit Sekali</option>
                      <option value="HOURS">Jam Sekali</option>
                      <option value="DAYS">Hari Sekali</option>
                    </select>
                  </div>
                </div>

                <!-- Mode Cakupan Penghapusan Riwayat -->
                <div class="mb-4">
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Metode Pembersihan Saat Cron Jalan</label>
                  <select
                    v-model="cleanupForm.incident_history.retention_mode"
                    class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-moxgreen"
                  >
                    <option value="OLDER_THAN">Hapus riwayat selesai yang lebih lama dari interval</option>
                    <option value="ALL">Hapus seluruh riwayat selesai setiap interval tercapai</option>
                  </select>
                  <p class="text-[10px] text-slate-500 mt-1.5">Gangguan yang masih aktif tidak akan dihapus oleh cronjob.</p>
                </div>
              </div>

              <!-- Info Jadwal & Tombol Manual Riwayat -->
              <div class="pt-3 border-t border-slate-800 space-y-2.5">
                <div class="text-[11px] text-slate-400 space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <p class="flex justify-between"><span>Terakhir jalan:</span> <span class="text-slate-200 font-medium">{{ formatTime(cleanupForm.incident_history.last_run) }}</span></p>
                  <p class="flex justify-between"><span>Jadwal berikutnya:</span> <span class="text-amber-400 font-medium">{{ cleanupForm.incident_history.is_enabled ? formatTime(cleanupForm.incident_history.next_run) : 'Nonaktif' }}</span></p>
                </div>
                <button
                  type="button"
                  @click="triggerManualCleanup('incident_history')"
                  :disabled="isRunningManual === 'incident_history'"
                  class="w-full py-2 px-3 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <i class="ph-bold" :class="isRunningManual === 'incident_history' ? 'ph-spinner animate-spin' : 'ph-trash'"></i>
                  {{ isRunningManual === 'incident_history' ? 'Membersihkan Riwayat...' : 'Bersihkan Riwayat Selesai Sekarang' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-800 flex justify-end items-center gap-3 shrink-0">
          <button
            type="button"
            @click="showCleanupModal = false"
            class="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg text-xs font-bold transition"
          >
            Tutup
          </button>
          <button
            type="button"
            @click="saveCleanupConfig"
            :disabled="isSavingCleanup"
            class="px-5 py-2 bg-moxgreen text-moxdark hover:bg-emerald-400 disabled:opacity-50 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <i class="ph-bold" :class="isSavingCleanup ? 'ph-spinner animate-spin' : 'ph-floppy-disk'"></i>
            {{ isSavingCleanup ? 'Menyimpan...' : 'Simpan Pengaturan Cronjob' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Popup Semua Notifikasi (Teleport agar tidak terkurung stacking context header) -->
  <Teleport to="body">
    <div v-if="showModal"
         class="fixed inset-0 z-[80] flex items-center justify-center bg-moxdark/90 backdrop-blur-sm p-4"
         @click.self="showModal = false">
      <div class="bg-moxcard border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <i class="ph-bold ph-warning text-rose-500"></i> Semua Notifikasi Gangguan
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">{{ alerts.length }} aktif &bull; {{ history.length }} riwayat selesai</p>
          </div>
          <button @click="showModal = false"
                  class="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <i class="ph-bold ph-x"></i>
          </button>
        </div>

        <!-- Tab: Gangguan Aktif / Riwayat Selesai -->
        <div class="px-6 pt-3 border-b border-slate-800 flex gap-6 shrink-0">
          <button @click="activeTab = 'active'"
                  class="pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2"
                  :class="activeTab === 'active' ? 'border-rose-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'">
            <i class="ph-bold ph-warning text-rose-500"></i> Gangguan Aktif
            <span class="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 text-[10px]">{{ alerts.length }}</span>
          </button>
          <button @click="activeTab = 'history'"
                  class="pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-2"
                  :class="activeTab === 'history' ? 'border-moxgreen text-white' : 'border-transparent text-slate-500 hover:text-slate-300'">
            <i class="ph-bold ph-check-circle text-moxgreen"></i> Riwayat Selesai
            <span class="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[10px]">{{ history.length }}</span>
          </button>
        </div>

        <!-- Tab Gangguan Aktif -->
        <div v-if="activeTab === 'active'" class="overflow-y-auto flex-1 divide-y divide-slate-800/80">
          <div v-if="alerts.length === 0" class="p-10 text-center text-sm text-slate-500">
            <i class="ph ph-check-circle text-3xl text-moxgreen block mb-2"></i>
            Tidak ada gangguan aktif
          </div>
          <div v-for="alert in alerts" :key="alert.id" class="px-6 py-4 flex items-start gap-4 hover:bg-slate-800/30 transition">
            <div class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center" :class="severityStyle(alert.severity).icon">
              <i class="ph-bold text-lg" :class="severityStyle(alert.severity).iconClass"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <p class="text-sm font-bold text-white truncate">{{ alert.target_name }}</p>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded border uppercase" :class="severityStyle(alert.severity).badge">
                  {{ alert.severity }}
                </span>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">{{ alert.target_type }}</span>
              </div>
              <p class="text-xs text-slate-300 break-words">{{ alert.message }}</p>
              <p class="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <i class="ph ph-clock"></i> {{ formatTime(alert.created_at) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Tab Riwayat Gangguan Selesai -->
        <div v-else class="overflow-y-auto flex-1 divide-y divide-slate-800/80">
          <div v-if="history.length === 0" class="p-10 text-center text-sm text-slate-500">
            <i class="ph ph-clock-counter-clockwise text-3xl block mb-2"></i>
            Belum ada riwayat gangguan yang selesai
          </div>
          <div v-for="item in history" :key="item.id" class="px-6 py-4 flex items-start gap-4 hover:bg-slate-800/30 transition">
            <div class="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-emerald-500/15 text-emerald-500">
              <i class="ph-bold ph-check-circle text-lg"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <p class="text-sm font-bold text-white truncate">{{ item.target_name }}</p>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded border uppercase" :class="severityStyle(item.original_severity || item.severity).badge">
                  {{ item.original_severity || item.severity }}
                </span>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">{{ item.target_type }}</span>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 uppercase">Selesai</span>
              </div>
              <p class="text-xs text-slate-300 break-words">{{ item.message }}</p>
              <div class="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5">
                <span class="flex items-center gap-1"><i class="ph ph-clock"></i> Mulai: {{ formatTime(item.created_at) }}</span>
                <span class="flex items-center gap-1"><i class="ph ph-check"></i> Selesai: {{ formatTime(item.resolved_at) }}</span>
                <span class="flex items-center gap-1 text-slate-400"><i class="ph ph-timer"></i> Durasi: {{ formatDuration(item.created_at, item.resolved_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-3 border-t border-slate-800 flex justify-between items-center shrink-0">
          <router-link to="/rekap-gangguan" @click="showModal = false"
                       class="text-xs font-bold text-moxgreen hover:text-emerald-400 transition">
            Buka Rekap Gangguan
          </router-link>
          <button @click="showModal = false"
                  class="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg text-sm font-medium transition">
            Tutup
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { parseUtcDate, formatWibDateTime } from '../../utils/datetime.js';

const currentTime = ref('');
let timer = null;

const updateClock = () => {
  // Selalu pakai zona waktu Asia/Jakarta, tidak bergantung zona waktu perangkat
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(new Date());
  
  currentTime.value = `${time} WIB`;
};

// ==========================================
// PENGATURAN CRONJOB PEMBERSIHAN OTOMATIS
// ==========================================
const showCleanupModal = ref(false);
const isSavingCleanup = ref(false);
const isRunningManual = ref('');
const cleanupFeedback = ref({ message: '', isError: false });

const cleanupForm = ref({
  system_logs: {
    is_enabled: true,
    interval_value: 7,
    interval_unit: 'DAYS',
    retention_mode: 'OLDER_THAN',
    last_run: null,
    next_run: null,
    last_deleted_count: 0,
    current_count: 0
  },
  incident_history: {
    is_enabled: true,
    interval_value: 30,
    interval_unit: 'DAYS',
    retention_mode: 'OLDER_THAN',
    last_run: null,
    next_run: null,
    last_deleted_count: 0,
    current_count: 0
  }
});

const fetchCleanupConfig = async () => {
  try {
    const res = await fetch('/api/settings/cleanup');
    const json = await res.json();
    if (json.success && json.data) {
      cleanupForm.value = {
        system_logs: { ...cleanupForm.value.system_logs, ...json.data.system_logs },
        incident_history: { ...cleanupForm.value.incident_history, ...json.data.incident_history }
      };
    }
  } catch (err) {
    console.error('Gagal memuat konfigurasi cronjob:', err);
  }
};

const openCleanupModal = () => {
  showDropdown.value = false;
  cleanupFeedback.value = { message: '', isError: false };
  showCleanupModal.value = true;
  fetchCleanupConfig();
};

const applyPreset = (targetKey, val, unit) => {
  if (!cleanupForm.value[targetKey]) return;
  cleanupForm.value[targetKey].interval_value = val;
  cleanupForm.value[targetKey].interval_unit = unit;
};

const saveCleanupConfig = async () => {
  isSavingCleanup.value = true;
  cleanupFeedback.value = { message: '', isError: false };
  try {
    const res = await fetch('/api/settings/cleanup', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_logs: cleanupForm.value.system_logs,
        incident_history: cleanupForm.value.incident_history
      })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal menyimpan pengaturan');
    await fetchCleanupConfig();
    cleanupFeedback.value = { message: json.message || 'Pengaturan cronjob berhasil disimpan.', isError: false };
  } catch (err) {
    cleanupFeedback.value = { message: err.message || 'Gagal menyimpan pengaturan cronjob.', isError: true };
  } finally {
    isSavingCleanup.value = false;
  }
};

const triggerManualCleanup = async (targetKey) => {
  if (isRunningManual.value) return;
  isRunningManual.value = targetKey;
  cleanupFeedback.value = { message: '', isError: false };
  try {
    const res = await fetch('/api/settings/cleanup/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: targetKey, mode: 'ALL' })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal menjalankan pembersihan');
    await fetchCleanupConfig();
    fetchHistory();
    cleanupFeedback.value = { message: json.message, isError: false };
  } catch (err) {
    cleanupFeedback.value = { message: err.message || 'Gagal menjalankan pembersihan manual.', isError: true };
  } finally {
    isRunningManual.value = '';
  }
};

// ==========================================
// NOTIFIKASI GANGGUAN (REALTIME AUTO-REFRESH)
// ==========================================
const alerts = ref([]);
const history = ref([]);
const activeTab = ref('active');
const isLoading = ref(false);
const showDropdown = ref(false);
const showModal = ref(false);
const notifWrapper = ref(null);
let alertTimer = null;

const fetchAlerts = async (silent = false) => {
  if (!silent) isLoading.value = true;
  try {
    const res = await fetch('/api/alerts/active');
    const json = await res.json();
    if (json.success) alerts.value = json.data;
  } catch (err) {
    console.error('Gagal memuat notifikasi:', err);
  } finally {
    if (!silent) isLoading.value = false;
  }
};

const fetchHistory = async () => {
  try {
    const res = await fetch('/api/alerts/history');
    const json = await res.json();
    if (json.success) history.value = json.data;
  } catch (err) {
    console.error('Gagal memuat riwayat gangguan:', err);
  }
};

const pollRealtimeNotifications = () => {
  fetchAlerts(true);
  if (showModal.value) {
    fetchHistory();
  }
};

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
  if (showDropdown.value) fetchAlerts(true);
};

const openAllModal = () => {
  showDropdown.value = false;
  showModal.value = true;
  activeTab.value = 'active';
  fetchAlerts(true);
  fetchHistory();
};

const formatDuration = (start, end) => {
  if (!start || !end) return '-';
  const diffMin = Math.max(0, Math.round((parseUtcDate(end) - parseUtcDate(start)) / 60000));
  if (diffMin < 1) return '< 1 menit';
  const d = Math.floor(diffMin / 1440);
  const h = Math.floor((diffMin % 1440) / 60);
  const m = diffMin % 60;
  return [d && `${d} hari`, h && `${h} jam`, m && `${m} menit`].filter(Boolean).join(' ');
};

const severityStyle = (severity) => {
  switch (severity) {
    case 'DOWN':
      return { icon: 'bg-rose-500/15 text-rose-500', iconClass: 'ph-warning-octagon', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/30' };
    case 'CRITICAL':
      return { icon: 'bg-orange-500/15 text-orange-500', iconClass: 'ph-warning', badge: 'bg-orange-500/10 text-orange-500 border-orange-500/30' };
    case 'RECOVERED':
      return { icon: 'bg-blue-500/15 text-blue-400', iconClass: 'ph-arrows-clockwise', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
    default:
      return { icon: 'bg-amber-500/15 text-amber-500', iconClass: 'ph-warning-circle', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };
  }
};

const formatTime = (value) => {
  if (!value) return '-';
  return formatWibDateTime(value, false) + ' WIB';
};

// Tutup dropdown saat klik di luar
const handleClickOutside = (e) => {
  if (showDropdown.value && notifWrapper.value && !notifWrapper.value.contains(e.target)) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  updateClock(); // Set waktu pertama kali agar tidak kosong sesaat
  timer = setInterval(updateClock, 1000); // Jalankan fungsi update setiap 1000ms (1 detik)

  fetchAlerts(false);
  alertTimer = setInterval(pollRealtimeNotifications, 3000); // Realtime polling tiap 3 detik
  document.addEventListener('click', handleClickOutside);
});

// Lifecycle Hooks: Dijalankan saat komponen dihancurkan (Unmount)
onUnmounted(() => {
  if (timer) {
    clearInterval(timer); // Hapus interval untuk mencegah memory leak
  }
  if (alertTimer) clearInterval(alertTimer);
  document.removeEventListener('click', handleClickOutside);
});
</script>
