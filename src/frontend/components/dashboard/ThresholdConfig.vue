<template>
  <main class="p-8 pb-12 overflow-x-hidden">
    <!-- Header Halaman -->
    <div class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1 flex items-center gap-3">
          <i class="ph-bold ph-sliders text-moxgreen"></i> Konfigurasi Ambang Batas (Threshold Trigger)
        </h2>
        <p class="text-slate-400 text-sm">Parameter pemicu alarm.</p>
      </div>
      <div>
        <button class="px-4 py-2.5 bg-moxgreen text-moxdark rounded-lg flex items-center gap-2 hover:bg-emerald-400 text-sm font-bold transition">
          <i class="ph-bold ph-download-simple text-lg"></i> Simpan Perubahan
        </button>
      </div>
    </div>

    <!-- Grid Konfigurasi -->
    <div class="grid grid-cols-3 gap-5">
      
      <!-- Card 1: CPU Alert -->
      <div class="bg-moxcard border border-slate-800 p-6 rounded-xl shadow-lg">
        <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">CPU Alert Threshold</p>
        <div class="flex items-center gap-4">
          <input 
            type="number" 
            v-model="cpuThreshold"
            class="w-20 bg-slate-900/80 border border-slate-700 text-white font-bold text-lg rounded-lg px-3 py-2 text-center outline-none focus:border-moxgreen transition appearance-none"
          >
          <span class="text-sm text-slate-400 leading-tight">
            % Utilisasi Berkelanjutan (> 5 mnt)
          </span>
        </div>
      </div>

      <!-- Card 2: RAM Alert -->
      <div class="bg-moxcard border border-slate-800 p-6 rounded-xl shadow-lg">
        <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">RAM Alert Threshold</p>
        <div class="flex items-center gap-4">
          <input 
            type="number" 
            v-model="ramThreshold"
            class="w-20 bg-slate-900/80 border border-slate-700 text-white font-bold text-lg rounded-lg px-3 py-2 text-center outline-none focus:border-moxgreen transition appearance-none"
          >
          <span class="text-sm text-slate-400 leading-tight">
            % pemakaian memory node
          </span>
        </div>
      </div>

      <!-- Card 3: Ping Packet Loss -->
      <div class="bg-moxcard border border-slate-800 p-6 rounded-xl shadow-lg">
        <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Ping Packet Loss Tolerance</p>
        <div class="flex items-center gap-4">
          <input 
            type="number" 
            v-model="pingTolerance"
            class="w-20 bg-slate-900/80 border border-slate-700 text-white font-bold text-lg rounded-lg px-3 py-2 text-center outline-none focus:border-moxgreen transition appearance-none"
          >
          <span class="text-sm text-slate-400 leading-tight">
            Paket RTO
          </span>
        </div>
      </div>

      <div class="bg-moxcard border border-slate-800 p-6 rounded-xl shadow-lg">
        <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Io Delay Tolerance</p>
        <div class="flex items-center gap-4">
          <input 
            type="number" 
            v-model="IoDelayProxmox"
            class="w-20 bg-slate-900/80 border border-slate-700 text-white font-bold text-lg rounded-lg px-3 py-2 text-center outline-none focus:border-moxgreen transition appearance-none"
          >
          <span class="text-sm text-slate-400 leading-tight">
            % Utilisasi Berkelanjutan (> 5 mnt)
          </span>
        </div>
      </div>

      <div class="bg-moxcard border border-slate-800 p-6 rounded-xl shadow-lg">
        <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Storage Tolerance</p>
        <div class="flex items-center gap-4">
          <input 
            type="number" 
            v-model="StorageTolerance"
            class="w-20 bg-slate-900/80 border border-slate-700 text-white font-bold text-lg rounded-lg px-3 py-2 text-center outline-none focus:border-moxgreen transition appearance-none"
          >
          <span class="text-sm text-slate-400 leading-tight">
            % Sisa Penyimpanan
          </span>
        </div>
      </div>

    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue';

// State untuk menyimpan nilai inputan threshold
const cpuThreshold = ref(80);
const ramThreshold = ref(85);
const pingTolerance = ref(3);
const IoDelayProxmox = ref(30);
const StorageTolerance = ref(80);
</script>

<style scoped>
/* Menghilangkan panah atas/bawah pada input number */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}

</style>