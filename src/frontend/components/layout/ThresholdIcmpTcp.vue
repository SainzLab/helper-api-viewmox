<template>
  <div class="animate-fade-in relative min-h-[80vh] font-sans">
    
    <!-- Action Bar Child -->
    <div class="flex justify-end gap-3 mb-6">
      <button 
        @click="openAddModal" 
        class="px-4 h-[42px] bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg flex items-center gap-2 text-xs font-semibold transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
      >
        <i class="ph-bold ph-plus text-base"></i> Tambah Target Network
      </button>
      <button 
        v-if="hasUnsavedChanges && !isSaving" 
        @click="discardChanges" 
        class="px-4 h-[42px] bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg flex items-center gap-2 text-xs font-semibold transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
      >
        Batal
      </button>
      <button 
        @click="saveChanges" 
        :disabled="!hasUnsavedChanges || isSaving" 
        class="px-5 h-[42px] rounded-lg flex items-center gap-2 text-xs font-bold transition-all duration-300 shadow-sm" 
        :class="hasUnsavedChanges ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] cursor-pointer' : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'"
      >
        <i class="text-base" :class="isSaving ? 'ph-bold ph-spinner animate-spin' : 'ph-bold ph-floppy-disk'"></i> 
        {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
      </button>
    </div>

    <!-- State Loading -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-slate-500">
      <i class="ph-bold ph-spinner animate-spin text-2xl text-slate-400 mb-2"></i>
      <p class="font-medium text-xs">Memuat konfigurasi jaringan...</p>
    </div>

    <!-- Grid Konfigurasi Per Target ICMP/TCP -->
    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      
      <div 
        v-for="(target, index) in networkTargets" 
        :key="target.id" 
        class="bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col transition-all hover:border-slate-300 hover:shadow-md"
      >
        
        <!-- Target Header -->
        <div class="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div>
              <h3 class="text-slate-900 font-bold flex items-center gap-2 text-base tracking-tight">
                {{ target.name }}
                <!-- Badge Tipe Pastel -->
                <span 
                  class="px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wider border" 
                  :class="target.type === 'ICMP' ? 'bg-cyan-50 text-cyan-700 border-cyan-200/60' : 'bg-indigo-50 text-indigo-700 border-indigo-200/60'"
                >
                  {{ target.type }}
                </span>
              </h3>
              <p class="text-slate-500 text-[11px] font-mono tracking-tight font-medium mt-0.5">
                {{ target.host }} <span v-if="target.port" class="text-slate-400">:: {{ target.port }}</span>
              </p>
            </div>
          </div>
          <button @click="removeTarget(index)" class="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Hapus Notifikasi">
            <i class="ph-bold ph-trash text-lg"></i>
          </button>
        </div>
        
        <div class="p-6 space-y-6 flex-1">
          
          <!-- Latency (Ping) Configuration -->
          <div>
            <div class="flex justify-between items-end mb-3">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <i class="ph-fill ph-chart-line-up text-slate-400 text-sm"></i> Latensi Jaringan (ms)
              </label>
            </div>
            <div class="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 shadow-inner">
              <!-- Warning Slider -->
              <div class="flex items-center gap-4">
                <div class="w-20 text-[10px] font-bold text-amber-600 tracking-wider">WARNING</div>
                <input 
                  type="range" min="10" max="999" 
                  v-model="target.latency.warning" 
                  @input="triggerChange" 
                  class="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                >
                <div class="w-16 text-right text-sm font-black text-slate-900 font-mono tracking-tight">
                  {{ target.latency.warning }}<span class="text-[9px] text-slate-400 ml-0.5 font-sans font-medium">ms</span>
                </div>
              </div>
              <!-- Critical Slider -->
              <div class="flex items-center gap-4">
                <div class="w-20 text-[10px] font-bold text-rose-600 tracking-wider">CRITICAL</div>
                <input 
                  type="range" min="20" max="1000" 
                  v-model="target.latency.critical" 
                  @input="triggerChange" 
                  class="w-full accent-rose-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                >
                <div class="w-16 text-right text-sm font-black text-slate-900 font-mono tracking-tight">
                  {{ target.latency.critical }}<span class="text-[9px] text-slate-400 ml-0.5 font-sans font-medium">ms</span>
                </div>
              </div>
            </div>
          </div>

          <!-- RTO Configuration (Offline Trigger) -->
          <div>
            <div class="flex justify-between items-end mb-3">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <i class="ph-bold ph-power text-slate-400 text-sm"></i> Pemicu Offline (RTO/Timeout)
              </label>
            </div>
            <div class="flex items-center gap-4 bg-rose-50/50 p-4 rounded-xl border border-rose-100">
              <span class="text-[10px] font-bold text-rose-700 tracking-wider">STATUS DOWN JIKA:</span>
              <input 
                type="number" 
                v-model="target.rtoTolerance" 
                @input="triggerChange" 
                class="w-16 bg-white border border-rose-200 text-rose-700 font-mono font-bold text-center rounded-lg px-2 py-1.5 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 transition shadow-sm"
              >
              <span class="text-[11px] font-medium text-rose-600">Paket loss / RTO berturut-turut.</span>
            </div>
          </div>

          <!-- Aturan Notifikasi -->
          <div class="pt-5 border-t border-slate-100">
            <div class="flex justify-between items-end mb-4">
              <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <i class="ph-fill ph-bell-ringing text-slate-400 text-sm"></i> Aturan Notifikasi
              </label>
              
              <!-- Interval Polling -->
              <div class="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Cek Ping/TCP per:</span>
                <input 
                  type="number" 
                  v-model="target.alertSettings.checkInterval" 
                  @input="triggerChange" 
                  class="w-10 bg-transparent text-slate-900 font-mono font-bold text-center outline-none border-b border-slate-300 focus:border-slate-500 transition"
                >
                <span class="text-[9px] font-medium text-slate-500">detik</span>
              </div>
            </div>
            
            <div class="space-y-3">
              <!-- Warning Rule -->
              <div class="flex items-center justify-between bg-amber-50/30 p-3 rounded-xl border border-amber-200/60 shadow-sm">
                <div class="flex items-center gap-2 w-1/3">
                  <i class="ph-fill ph-warning text-amber-500 text-base"></i>
                  <span class="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Warning</span>
                </div>
                <div class="flex items-center justify-center gap-2 w-1/3 border-x border-slate-200/60 px-2">
                  <span class="text-[10px] font-medium text-slate-500">Ulangi</span>
                  <input 
                    type="number" 
                    v-model="target.alertSettings.warning.maxCount" 
                    @input="triggerChange" 
                    class="w-12 bg-white border border-slate-200 text-slate-900 font-mono font-bold text-center rounded-md text-[11px] py-1 outline-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                  <span class="text-[10px] font-medium text-slate-500">kali</span>
                </div>
                <div class="w-1/3 flex justify-end pl-2">
                  <select 
                    v-model="target.alertSettings.warning.type" 
                    @change="triggerChange" 
                    class="w-full bg-white border border-slate-200 text-slate-700 font-medium text-[11px] rounded-md py-1.5 pl-2 pr-6 outline-none cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <option value="Pesan">Teks Pesan</option>
                    <option value="Call">Panggilan</option>
                  </select>
                </div>
              </div>
              
              <!-- Critical Rule -->
              <div class="flex items-center justify-between bg-orange-50/30 p-3 rounded-xl border border-orange-200/60 shadow-sm">
                <div class="flex items-center gap-2 w-1/3">
                  <i class="ph-fill ph-warning-circle text-orange-500 text-base"></i>
                  <span class="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Critical</span>
                </div>
                <div class="flex items-center justify-center gap-2 w-1/3 border-x border-slate-200/60 px-2">
                  <span class="text-[10px] font-medium text-slate-500">Ulangi</span>
                  <input 
                    type="number" 
                    v-model="target.alertSettings.critical.maxCount" 
                    @input="triggerChange" 
                    class="w-12 bg-white border border-slate-200 text-slate-900 font-mono font-bold text-center rounded-md text-[11px] py-1 outline-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                  <span class="text-[10px] font-medium text-slate-500">kali</span>
                </div>
                <div class="w-1/3 flex justify-end pl-2">
                  <select 
                    v-model="target.alertSettings.critical.type" 
                    @change="triggerChange" 
                    class="w-full bg-white border border-slate-200 text-slate-700 font-medium text-[11px] rounded-md py-1.5 pl-2 pr-6 outline-none cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <option value="Pesan">Teks Pesan</option>
                    <option value="Call">Panggilan</option>
                  </select>
                </div>
              </div>
              
              <!-- Down Rule -->
              <div class="flex items-center justify-between bg-rose-50/30 p-3 rounded-xl border border-rose-200/60 shadow-sm">
                <div class="flex items-center gap-2 w-1/3">
                  <i class="ph-bold ph-power text-rose-500 text-base"></i>
                  <span class="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Down</span>
                </div>
                <div class="flex items-center justify-center gap-2 w-1/3 border-x border-slate-200/60 px-2">
                  <span class="text-[10px] font-medium text-slate-500">Ulangi</span>
                  <input 
                    type="number" 
                    v-model="target.alertSettings.down.maxCount" 
                    @input="triggerChange" 
                    class="w-12 bg-white border border-slate-200 text-slate-900 font-mono font-bold text-center rounded-md text-[11px] py-1 outline-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                  <span class="text-[10px] font-medium text-slate-500">kali</span>
                </div>
                <div class="w-1/3 flex justify-end pl-2">
                  <select 
                    v-model="target.alertSettings.down.type" 
                    @change="triggerChange" 
                    class="w-full bg-white border border-slate-200 text-slate-700 font-medium text-[11px] rounded-md py-1.5 pl-2 pr-6 outline-none cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <option value="Pesan">Teks Pesan</option>
                    <option value="Call">Panggilan</option>
                  </select>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
      
    </div>

    <!-- ========================================== -->
    <!-- MODAL PILIH TARGET NETWORK DARI DB         -->
    <!-- ========================================== -->
    <Teleport to="body">
      <div v-if="showAddModal" class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in font-sans" @click.self="closeAddModal">
        <div class="bg-white border border-slate-200/80 shadow-xl rounded-2xl w-full max-w-md overflow-hidden transform transition-all">
          
          <div class="flex justify-between items-center p-6 border-b border-slate-200/80 bg-slate-50/50">
            <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <i class="ph-bold ph-plus-circle text-emerald-500"></i> Aktifkan Notifikasi Target
            </h3>
            <button @click="closeAddModal" class="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center transition">
              <i class="ph-bold ph-x text-lg"></i>
            </button>
          </div>
          
          <div class="p-6 space-y-4">
            <!-- Pilih dari Database -->
            <div>
              <label class="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Pilih Target Dari Katalog</label>
              <div class="relative">
                <select 
                  v-model="selectedTargetId" 
                  class="w-full bg-white border border-slate-200 text-slate-900 text-sm font-medium rounded-lg pl-4 pr-10 py-2.5 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 appearance-none cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                >
                  <option value="" disabled>-- Pilih Target Jaringan --</option>
                  <option v-for="target in availableTargets" :key="target.id" :value="target.id">
                    {{ target.name }} ({{ target.host }}) - {{ target.type }}
                  </option>
                </select>
                <i class="ph-bold ph-caret-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
              </div>
              <p v-if="availableTargets.length === 0" class="text-xs font-medium text-amber-600 mt-2">Semua target yang terdaftar sudah diaktifkan notifikasinya.</p>
            </div>
            
            <div class="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-4">
              <button 
                type="button" 
                @click="closeAddModal" 
                class="px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                Batal
              </button>
              <button 
                @click="submitNewTarget" 
                :disabled="!selectedTargetId" 
                class="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition shadow-[0_1px_2px_rgba(0,0,0,0.04)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tambahkan
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </Teleport>

    <!-- ========================================== -->
    <!-- MODAL KONFIRMASI HAPUS / BATAL             -->
    <!-- ========================================== -->
    <Teleport to="body">
      <div v-if="confirmModal.show" class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in font-sans" @click.self="closeConfirmModal">
        <div class="bg-white border border-slate-200/80 shadow-xl rounded-2xl w-full max-w-md overflow-hidden transform transition-all relative">
          <div class="p-6 pt-7">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mt-0.5 border"
                   :class="confirmModal.type === 'danger' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-amber-50 border-amber-100 text-amber-600'">
                <i class="ph-bold ph-warning-circle text-2xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900 mb-2">{{ confirmModal.title }}</h3>
                <p class="text-sm text-slate-600 font-medium leading-relaxed">{{ confirmModal.message }}</p>
              </div>
            </div>
          </div>
          <div class="bg-slate-50/50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200/80">
            <button @click="closeConfirmModal" class="px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              Batal
            </button>
            <button @click="executeConfirmAction" class="px-5 py-2.5 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-2"
                    :class="confirmModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'">
              {{ confirmModal.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ========================================== -->
    <!-- TOAST NOTIFICATION                         -->
    <!-- ========================================== -->
    <Teleport to="body">
      <div v-if="toast.show" class="fixed top-8 right-8 z-[1100] w-[400px] bg-white border border-slate-200 shadow-xl rounded-xl p-4 flex gap-4 animate-slide-in font-sans">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border" :class="toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'">
          <i class="text-xl ph-bold" :class="toast.type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'"></i>
        </div>
        <div class="flex-1">
          <div class="flex justify-between items-start">
            <h3 class="text-slate-900 font-bold text-sm leading-none mb-1.5">{{ toast.title }}</h3>
            <button @click="toast.show = false" class="text-slate-400 hover:text-slate-600 transition">
              <i class="ph-bold ph-x text-sm"></i>
            </button>
          </div>
          <p class="text-slate-600 text-xs font-medium leading-relaxed">{{ toast.message }}</p>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const networkTargets = ref([]);
const catalogTargets = ref([]); // Data mentah katalog dari API
const availableTargets = ref([]); // Data untuk ditampilkan di dropdown dropdown
const selectedTargetId = ref('');

const hasUnsavedChanges = ref(false);
const isSaving = ref(false);
const isLoading = ref(true);

// === STATE MODAL & TOAST ===
const showAddModal = ref(false);
const toast = ref({ show: false, type: 'success', title: '', message: '' });
let toastTimer = null;
const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value.show = false; }, 5000);
};

const confirmModal = ref({ show: false, type: 'danger', title: '', message: '', confirmText: 'Ya, Lanjutkan', onConfirm: null });
const closeConfirmModal = () => { confirmModal.value.show = false; confirmModal.value.onConfirm = null; };
const executeConfirmAction = () => {
  if (typeof confirmModal.value.onConfirm === 'function') confirmModal.value.onConfirm();
  closeConfirmModal();
};

// === FETCH DATA DARI API ===
const fetchThresholds = async () => {
  isLoading.value = true;
  try {
    // 1. Tarik target yang AKTIF
    const resActive = await fetch('/api/thresholds/network');
    const dataActive = await resActive.json();
    if (dataActive.success) networkTargets.value = dataActive.data;

    // 2. Tarik target KATALOG (Dropdown)
    const resCatalog = await fetch('/api/thresholds/network/catalog');
    const dataCatalog = await resCatalog.json();
    if (dataCatalog.success) catalogTargets.value = dataCatalog.data;

    hasUnsavedChanges.value = false;
  } catch (error) {
    console.error("Gagal memuat data dari API:", error);
  } finally {
    isLoading.value = false;
  }
};

// === FUNGSI SIMPAN KE API ===
const saveChanges = async () => {
  if (!hasUnsavedChanges.value) return;
  
  isSaving.value = true;
  try {
    const res = await fetch('/api/thresholds/network', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets: networkTargets.value })
    });
    
    const data = await res.json();
    if (data.success) {
      hasUnsavedChanges.value = false;
      showToast('success', 'Konfigurasi Disimpan', 'Konfigurasi threshold Network berhasil disimpan.');
      fetchThresholds(); // Refresh data untuk memastikan sinkron dengan DB
    } else {
      showToast('error', 'Gagal Menyimpan', data.message || 'Gagal menyimpan konfigurasi.');
    }
  } catch (error) {
    console.error("Kesalahan jaringan saat menyimpan:", error);
    showToast('error', 'Kesalahan Jaringan', 'Terjadi kesalahan jaringan saat menyimpan konfigurasi.');
  } finally {
    isSaving.value = false;
  }
};

// === FUNGSI UI & LOGIKA LOKAL ===
const triggerChange = () => { hasUnsavedChanges.value = true; };

const discardChanges = () => {
  confirmModal.value = {
    show: true,
    type: 'warning',
    title: 'Batalkan Perubahan?',
    message: 'Semua perubahan konfigurasi threshold Network yang belum disimpan akan dikembalikan ke pengaturan awal.',
    confirmText: 'Ya, Batalkan',
    onConfirm: () => fetchThresholds()
  };
};

const removeTarget = (index) => {
  const target = networkTargets.value[index];
  confirmModal.value = {
    show: true,
    type: 'danger',
    title: 'Matikan Notifikasi Target?',
    message: `Anda akan menghapus target "${target?.name}" dari pemantauan Threshold. Jangan khawatir, tekan Simpan Perubahan untuk menerapkan.`,
    confirmText: 'Ya, Hapus',
    onConfirm: () => {
      const removedTarget = networkTargets.value.splice(index, 1)[0]; 
      catalogTargets.value.push({
        id: removedTarget.id, name: removedTarget.name, type: removedTarget.type, host: removedTarget.host, port: removedTarget.port
      });
      triggerChange();
    }
  };
};

const openAddModal = () => {
  selectedTargetId.value = '';
  availableTargets.value = [...catalogTargets.value]; // Copy katalog yang tersisa
  showAddModal.value = true; 
};

const closeAddModal = () => { showAddModal.value = false; };

const submitNewTarget = () => {
  const targetIndex = catalogTargets.value.findIndex(t => t.id === selectedTargetId.value);
  if (targetIndex !== -1) {
    const targetData = catalogTargets.value[targetIndex];
    // Masukkan ke daftar monitoring aktif
    networkTargets.value.push({
      id: targetData.id,
      type: targetData.type,
      name: targetData.name,
      host: targetData.host,
      port: targetData.port,
      latency: { warning: 50, critical: 150 }, // Nilai Default
      rtoTolerance: 3,
      alertSettings: { checkInterval: 5, warning: { maxCount: 1, type: 'Pesan' }, critical: { maxCount: 2, type: 'Pesan' }, down: { maxCount: 5, type: 'Call' } }
    });
    
    // Hapus dari katalog agar tidak bisa dipilih ganda
    catalogTargets.value.splice(targetIndex, 1);
    triggerChange();
  }
  closeAddModal();
};

// Pastikan Jarak Latency Warning dan Critical tidak tumpang tindih
watch(networkTargets, (newTargets) => {
  newTargets.forEach(target => {
    if (parseInt(target.latency.warning) >= parseInt(target.latency.critical)) {
      target.latency.warning = target.latency.critical - 10;
    }
  });
}, { deep: true });

onMounted(() => { fetchThresholds(); });
</script>

<style scoped>
input[type=range] { -webkit-appearance: none; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #ffffff; cursor: pointer; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); margin-top: -6px; }
input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; border-radius: 4px; }
input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
</style>