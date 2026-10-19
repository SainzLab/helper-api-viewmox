<template>
  <div class="animate-fade-in">
    <!-- Action Bar Child -->
    <div class="flex justify-end gap-3 mb-6">
      <button @click="openAddModal" class="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg flex items-center gap-2 hover:bg-slate-700 text-sm font-bold transition shadow">
        <i class="ph-bold ph-plus text-lg"></i> Tambah Target Proxmox
      </button>
      
      <button v-if="hasUnsavedChanges && !isSaving" @click="discardChanges" class="px-4 py-2 text-slate-400 hover:text-white rounded-lg flex items-center gap-2 text-sm font-bold transition">
        Batal
      </button>

      <button 
        @click="saveChanges" 
        :disabled="!hasUnsavedChanges || isSaving"
        class="px-5 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all duration-300"
        :class="hasUnsavedChanges ? 'bg-moxgreen text-moxdark hover:bg-emerald-400 shadow-[0_4px_12px_rgba(52,211,153,0.4)] cursor-pointer' : 'bg-slate-800/50 text-slate-600 border border-slate-700/50 cursor-not-allowed'">
        <i class="text-lg" :class="isSaving ? 'ph-bold ph-spinner animate-spin' : 'ph-bold ph-floppy-disk'"></i> 
        {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
      </button>
    </div>

    <!-- Grid Konfigurasi Per Target -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <div v-for="(target, index) in monitoredTargets" :key="target.id" class="bg-moxcard border border-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col transition-all hover:border-slate-700">
        
        <!-- Target Header -->
        <div class="px-6 py-4 bg-slate-800/40 border-b border-slate-700/80 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div>
              <h3 class="text-white font-bold flex items-center gap-2">
                {{ target.name }}
                <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold border" :class="target.type === 'NODE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : (target.type === 'VM' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20')">
                  {{ target.type }} {{ target.vmid || target.node }}
                </span>
              </h3>
              <p class="text-slate-400 text-xs">Node: <span class="font-mono text-slate-300">{{ target.node }}</span></p>
            </div>
          </div>
          <button @click="removeTarget(index)" class="text-slate-500 hover:text-rose-500 transition"><i class="ph-bold ph-trash text-lg"></i></button>
        </div>

        <div class="p-6 space-y-6 flex-1">
          <!-- CPU Configuration -->
          <div>
            <div class="flex justify-between items-end mb-3">
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><i class="ph-fill ph-cpu text-slate-400"></i> Utilisasi CPU</label>
              <span class="text-[10px] text-slate-500">Durasi pemicu: > 5 menit</span>
            </div>
            <div class="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
              <div class="flex items-center gap-4">
                <div class="w-20 text-xs font-bold text-amber-400">WARNING</div>
                <input type="range" min="1" max="99" v-model="target.cpu.warning" @input="triggerChange" class="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer">
                <div class="w-12 text-right text-sm font-bold text-white">{{ target.cpu.warning }}%</div>
              </div>
              <div class="flex items-center gap-4">
                <div class="w-20 text-xs font-bold text-rose-500">CRITICAL</div>
                <input type="range" min="1" max="100" v-model="target.cpu.critical" @input="triggerChange" class="w-full accent-rose-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer">
                <div class="w-12 text-right text-sm font-bold text-white">{{ target.cpu.critical }}%</div>
              </div>
            </div>
          </div>

          <!-- RAM Configuration -->
          <div>
            <div class="flex justify-between items-end mb-3">
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><i class="ph-fill ph-memory text-slate-400"></i> Penggunaan Memory (RAM)</label>
            </div>
            <div class="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
              <div class="flex items-center gap-4">
                <div class="w-20 text-xs font-bold text-amber-400">WARNING</div>
                <input type="range" min="1" max="99" v-model="target.ram.warning" @input="triggerChange" class="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer">
                <div class="w-12 text-right text-sm font-bold text-white">{{ target.ram.warning }}%</div>
              </div>
              <div class="flex items-center gap-4">
                <div class="w-20 text-xs font-bold text-rose-500">CRITICAL</div>
                <input type="range" min="1" max="100" v-model="target.ram.critical" @input="triggerChange" class="w-full accent-rose-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer">
                <div class="w-12 text-right text-sm font-bold text-white">{{ target.ram.critical }}%</div>
              </div>
            </div>
          </div>

          <!-- IO DELAY -->
          <div v-if="target.type === 'NODE'">
            <div class="flex justify-between items-end mb-3">
              <label class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><i class="ph-fill ph-hard-drives text-slate-400"></i> Keterlambatan I/O Disk (IO Delay)</label>
              <span class="text-[10px] text-slate-500">Durasi pemicu: > 3 menit</span>
            </div>
            <div class="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
              <div class="flex items-center gap-4">
                <div class="w-20 text-xs font-bold text-amber-400">WARNING</div>
                <input type="range" min="1" max="99" v-model="target.ioDelay.warning" @input="triggerChange" class="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer">
                <div class="w-12 text-right text-sm font-bold text-white">{{ target.ioDelay.warning }}%</div>
              </div>
              <div class="flex items-center gap-4">
                <div class="w-20 text-xs font-bold text-rose-500">CRITICAL</div>
                <input type="range" min="1" max="100" v-model="target.ioDelay.critical" @input="triggerChange" class="w-full accent-rose-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer">
                <div class="w-12 text-right text-sm font-bold text-white">{{ target.ioDelay.critical }}%</div>
              </div>
            </div>
          </div>

          <!-- Aturan Notifikasi -->
          <div class="pt-5 border-t border-slate-700/80">
            <div class="flex justify-between items-end mb-4">
              <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <i class="ph-fill ph-bell-ringing text-slate-400"></i> Aturan Notifikasi
              </label>
              <div class="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                <span class="text-[10px] font-bold text-slate-400 uppercase">Cek API per:</span>
                <input type="number" v-model="target.alertSettings.checkInterval" @input="triggerChange" class="w-10 bg-transparent text-white font-bold text-center outline-none border-b border-slate-600 focus:border-moxgreen transition appearance-none">
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
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const monitoredTargets = ref([
  {
    id: 1, vmid: null, name: 'Main Server', type: 'NODE', node: 'pve-dev',
    cpu: { warning: 75, critical: 90 }, ram: { warning: 80, critical: 95 }, ioDelay: { warning: 5, critical: 15 }, 
    alertSettings: { checkInterval: 10, warning: { maxCount: 1, type: 'Pesan' }, critical: { maxCount: 3, type: 'Call' }, down: { maxCount: 5, type: 'Call' } }
  },
  {
    id: 2, vmid: 100, name: 'Web Server', type: 'VM', node: 'pve-dev',
    cpu: { warning: 75, critical: 90 }, ram: { warning: 80, critical: 95 },
    alertSettings: { checkInterval: 15, warning: { maxCount: 1, type: 'Pesan' }, critical: { maxCount: 3, type: 'Call' }, down: { maxCount: 5, type: 'Call' } }
  }
]);

const hasUnsavedChanges = ref(false);
const isSaving = ref(false);

const triggerChange = () => { hasUnsavedChanges.value = true; };
const saveChanges = () => {
  if (!hasUnsavedChanges.value) return;
  isSaving.value = true;
  setTimeout(() => { isSaving.value = false; hasUnsavedChanges.value = false; alert("Konfigurasi Proxmox berhasil disimpan!"); }, 800);
};
const discardChanges = () => {
  if (confirm("Batalkan perubahan pada Proxmox?")) { hasUnsavedChanges.value = false; /* fetch again */ }
};

const removeTarget = (index) => {
  if(confirm('Hapus target ini dari sistem monitoring?')) { monitoredTargets.value.splice(index, 1); triggerChange(); }
};

const openAddModal = () => { alert('Pop-up Modal Tambah Target Proxmox'); };

watch(monitoredTargets, (newTargets) => {
  newTargets.forEach(target => {
    if (parseInt(target.cpu.warning) >= parseInt(target.cpu.critical)) target.cpu.warning = target.cpu.critical - 1;
    if (parseInt(target.ram.warning) >= parseInt(target.ram.critical)) target.ram.warning = target.ram.critical - 1;
    if (target.type === 'NODE' && parseInt(target.ioDelay.warning) >= parseInt(target.ioDelay.critical)) target.ioDelay.warning = target.ioDelay.critical - 1;
  });
}, { deep: true });
</script>

<style scoped>
@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
input[type=range] { -webkit-appearance: none; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #ffffff; cursor: pointer; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); margin-top: -6px; }
input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; border-radius: 4px; }
input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
</style>