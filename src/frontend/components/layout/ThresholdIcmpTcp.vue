<template>
  <div class="animate-fade-in relative min-h-[80vh]">
    <!-- Action Bar Child -->
    <div class="flex justify-end gap-3 mb-6">
      <button @click="openAddModal" class="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg flex items-center gap-2 hover:bg-slate-700 text-sm font-bold transition shadow">
        <i class="ph-bold ph-plus text-lg"></i> Tambah Target Network
      </button>
      
      <button v-if="hasUnsavedChanges && !isSaving" @click="discardChanges" class="px-4 py-2 text-slate-400 hover:text-white rounded-lg flex items-center gap-2 text-sm font-bold transition">
        Batal
      </button>

      <button 
        @click="saveChanges" 
        :disabled="!hasUnsavedChanges || isSaving"
        class="px-5 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all duration-300"
        :class="hasUnsavedChanges ? 'bg-blue-500 text-white hover:bg-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.4)] cursor-pointer' : 'bg-slate-800/50 text-slate-600 border border-slate-700/50 cursor-not-allowed'">
        <i class="text-lg" :class="isSaving ? 'ph-bold ph-spinner animate-spin' : 'ph-bold ph-floppy-disk'"></i> 
        {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
      </button>
    </div>

    <!-- State Loading -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 text-slate-400">
      <i class="ph-bold ph-spinner animate-spin text-4xl text-blue-500 mb-4"></i>
      <p>Memuat konfigurasi jaringan...</p>
    </div>

    <!-- Grid Konfigurasi Per Target ICMP/TCP -->
    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <div v-for="(target, index) in networkTargets" :key="target.id" class="bg-moxcard border border-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col transition-all hover:border-slate-700">
        
        <!-- Target Header -->
        <div class="px-6 py-4 bg-slate-800/40 border-b border-slate-700/80 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div>
              <h3 class="text-white font-bold flex items-center gap-2">
                {{ target.name }}
                <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold border" :class="target.type === 'ICMP' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'">
                  {{ target.type }}
                </span>
              </h3>
              <p class="text-slate-400 text-xs font-mono">{{ target.host }} <span v-if="target.port">:: {{ target.port }}</span></p>
            </div>
          </div>
          <button @click="removeTarget(index)" class="text-slate-500 hover:text-rose-500 transition" title="Hapus Notifikasi"><i class="ph-bold ph-trash text-lg"></i></button>
        </div>

        <div class="p-6 space-y-6 flex-1">
          
          <!-- Latency (Ping) Configuration -->
          <div>
            <div class="flex justify-between items-end mb-3">
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><i class="ph-fill ph-chart-line-up text-slate-400"></i> Latensi Jaringan (ms)</label>
            </div>
            <div class="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
              <div class="flex items-center gap-4">
                <div class="w-20 text-xs font-bold text-amber-400">WARNING</div>
                <input type="range" min="10" max="999" v-model="target.latency.warning" @input="triggerChange" class="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer">
                <div class="w-16 text-right text-sm font-bold text-white">{{ target.latency.warning }}<span class="text-[10px] text-slate-400 ml-1">ms</span></div>
              </div>
              <div class="flex items-center gap-4">
                <div class="w-20 text-xs font-bold text-rose-500">CRITICAL</div>
                <input type="range" min="20" max="1000" v-model="target.latency.critical" @input="triggerChange" class="w-full accent-rose-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer">
                <div class="w-16 text-right text-sm font-bold text-white">{{ target.latency.critical }}<span class="text-[10px] text-slate-400 ml-1">ms</span></div>
              </div>
            </div>
          </div>

          <!-- RTO Configuration (Offline Trigger) -->
          <div>
            <div class="flex justify-between items-end mb-3">
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><i class="ph-bold ph-power text-slate-400"></i> Pemicu Offline (RTO/Timeout)</label>
            </div>
            <div class="flex items-center gap-4 bg-slate-900/50 p-4 rounded-lg border border-rose-500/20">
              <span class="text-xs font-bold text-rose-500">STATUS DOWN JIKA:</span>
              <input type="number" v-model="target.rtoTolerance" @input="triggerChange" class="w-16 bg-slate-800 border border-rose-500/50 text-rose-400 font-bold text-center rounded-lg px-2 py-1.5 outline-none focus:border-rose-500 transition appearance-none">
              <span class="text-xs text-slate-400">Paket loss / RTO berturut-turut.</span>
            </div>
          </div>

          <!-- Aturan Notifikasi -->
          <div class="pt-5 border-t border-slate-700/80">
            <div class="flex justify-between items-end mb-4">
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <i class="ph-fill ph-bell-ringing text-slate-400"></i> Aturan Notifikasi
              </label>
              <!-- Interval Polling (Lebih cepat untuk ICMP) -->
              <div class="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                <span class="text-[10px] font-bold text-slate-400 uppercase">Cek Ping/TCP per:</span>
                <input type="number" v-model="target.alertSettings.checkInterval" @input="triggerChange" class="w-10 bg-transparent text-white font-bold text-center outline-none border-b border-slate-600 focus:border-blue-500 transition appearance-none">
                <span class="text-[10px] text-slate-400">detik</span>
              </div>
            </div>
            <div class="space-y-2.5">
              <div class="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-amber-500/20">
                <div class="flex items-center gap-2 w-1/3"><i class="ph-fill ph-warning text-amber-500"></i><span class="text-[11px] font-bold text-amber-400 uppercase">Warning</span></div>
                <div class="flex items-center justify-center gap-2 w-1/3 border-x border-slate-700/50 px-2">
                  <span class="text-[10px] text-slate-400">Ulangi</span>
                  <input type="number" v-model="target.alertSettings.warning.maxCount" @input="triggerChange" class="w-12 bg-slate-800 border border-slate-600 text-white font-bold text-center rounded text-[11px] py-1 outline-none">
                  <span class="text-[10px] text-slate-400">kali</span>
                </div>
                <div class="w-1/3 flex justify-end pl-2">
                  <select v-model="target.alertSettings.warning.type" @change="triggerChange" class="w-full bg-slate-800 border border-slate-600 text-white text-[11px] rounded py-1 pl-2 pr-6 outline-none cursor-pointer">
                    <option value="Pesan">Teks Pesan</option>
                    <option value="Call">Panggilan</option>
                  </select>
                </div>
              </div>
              <div class="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-orange-500/20">
                <div class="flex items-center gap-2 w-1/3"><i class="ph-fill ph-warning-circle text-orange-500"></i><span class="text-[11px] font-bold text-orange-500 uppercase">Critical</span></div>
                <div class="flex items-center justify-center gap-2 w-1/3 border-x border-slate-700/50 px-2">
                  <span class="text-[10px] text-slate-400">Ulangi</span>
                  <input type="number" v-model="target.alertSettings.critical.maxCount" @input="triggerChange" class="w-12 bg-slate-800 border border-slate-600 text-white font-bold text-center rounded text-[11px] py-1 outline-none">
                  <span class="text-[10px] text-slate-400">kali</span>
                </div>
                <div class="w-1/3 flex justify-end pl-2">
                  <select v-model="target.alertSettings.critical.type" @change="triggerChange" class="w-full bg-slate-800 border border-slate-600 text-white text-[11px] rounded py-1 pl-2 pr-6 outline-none cursor-pointer">
                    <option value="Pesan">Teks Pesan</option>
                    <option value="Call">Panggilan</option>
                  </select>
                </div>
              </div>
              <div class="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-rose-500/20">
                <div class="flex items-center gap-2 w-1/3"><i class="ph-bold ph-power text-rose-500"></i><span class="text-[11px] font-bold text-rose-500 uppercase">Down</span></div>
                <div class="flex items-center justify-center gap-2 w-1/3 border-x border-slate-700/50 px-2">
                  <span class="text-[10px] text-slate-400">Ulangi</span>
                  <input type="number" v-model="target.alertSettings.down.maxCount" @input="triggerChange" class="w-12 bg-slate-800 border border-slate-600 text-white font-bold text-center rounded text-[11px] py-1 outline-none">
                  <span class="text-[10px] text-slate-400">kali</span>
                </div>
                <div class="w-1/3 flex justify-end pl-2">
                  <select v-model="target.alertSettings.down.type" @change="triggerChange" class="w-full bg-slate-800 border border-slate-600 text-white text-[11px] rounded py-1 pl-2 pr-6 outline-none cursor-pointer">
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
    <div v-if="showAddModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-moxdark/90 backdrop-blur-sm p-4 animate-fade-in">
      <div class="bg-moxcard border border-slate-700 shadow-2xl rounded-xl w-full max-w-md overflow-hidden transform transition-all">
        <div class="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <i class="ph-bold ph-plus-circle text-blue-500"></i> Aktifkan Notifikasi Target
          </h3>
          <button @click="closeAddModal" class="text-slate-400 hover:text-white"><i class="ph ph-x text-xl"></i></button>
        </div>
        
        <div class="p-6 space-y-4">
          <!-- Pilih dari Database -->
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pilih Target Dari Katalog</label>
            <div class="relative">
              <select v-model="selectedTargetId" class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg pl-4 pr-10 py-2.5 outline-none focus:border-blue-500 appearance-none cursor-pointer">
                <option value="" disabled>-- Pilih Target Jaringan --</option>
                <option v-for="target in availableTargets" :key="target.id" :value="target.id">
                  {{ target.name }} ({{ target.host }}) - {{ target.type }}
                </option>
              </select>
              <i class="ph ph-caret-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"></i>
            </div>
            <p v-if="availableTargets.length === 0" class="text-xs text-amber-500 mt-2">Semua target yang terdaftar sudah diaktifkan notifikasinya.</p>
          </div>

          <div class="pt-4 border-t border-slate-800 flex justify-end gap-3 mt-2">
            <button type="button" @click="closeAddModal" class="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition">Batal</button>
            <button @click="submitNewTarget" :disabled="!selectedTargetId" class="px-5 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-400 transition shadow disabled:opacity-50 disabled:cursor-not-allowed">Tambahkan</button>
          </div>
        </div>
      </div>
    </div>
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

// === STATE MODAL ===
const showAddModal = ref(false);

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
      alert("Konfigurasi Network berhasil disimpan!");
      fetchThresholds(); // Refresh data untuk memastikan sinkron dengan DB
    } else {
      alert("Gagal menyimpan: " + data.message);
    }
  } catch (error) {
    console.error("Kesalahan jaringan saat menyimpan:", error);
    alert("Terjadi kesalahan jaringan.");
  } finally {
    isSaving.value = false;
  }
};

// === FUNGSI UI & LOGIKA LOKAL ===
const triggerChange = () => { hasUnsavedChanges.value = true; };

const discardChanges = () => {
  if (confirm("Batalkan semua perubahan pada Network?")) { fetchThresholds(); }
};

const removeTarget = (index) => {
  if(confirm('Hapus target ini dari pemantauan Threshold (Notifikasi dimatikan)?')) { 
    // Pindahkan kembali ke katalog agar muncul lagi di dropdown
    const removedTarget = networkTargets.value.splice(index, 1)[0]; 
    catalogTargets.value.push({
      id: removedTarget.id, name: removedTarget.name, type: removedTarget.type, host: removedTarget.host, port: removedTarget.port
    });
    triggerChange(); 
  }
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
@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
input[type=range] { -webkit-appearance: none; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #ffffff; cursor: pointer; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); margin-top: -6px; }
input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; border-radius: 4px; }
input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
</style>