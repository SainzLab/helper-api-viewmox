<template>
  <main class="p-8 pb-12 overflow-x-hidden">
    <!-- Header Halaman -->
    <div class="flex justify-between items-end mb-8">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1 flex items-center gap-3">
          <i class="ph-bold ph-hard-drives text-moxgreen"></i> Konfigurasi API Proxmox
        </h2>
        <p class="text-slate-400 text-sm">Pengaturan koneksi node dan kredensial API Token Proxmox VE.</p>
      </div>
      <div class="flex gap-3">
        <button class="px-4 py-2.5 border border-slate-700 bg-slate-800/50 text-slate-300 rounded-lg flex items-center gap-2 hover:bg-slate-700 text-sm font-medium transition">
          <i class="ph ph-plugs"></i> Uji Koneksi
        </button>
        <button class="px-4 py-2.5 bg-moxgreen text-moxdark rounded-lg flex items-center gap-2 hover:bg-emerald-400 text-sm font-bold transition">
          <i class="ph-bold ph-floppy-disk text-lg"></i> Simpan Konfigurasi
        </button>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <!-- Form Konfigurasi (Mengambil 2 Kolom) -->
      <div class="col-span-2 bg-moxcard border border-slate-800 p-6 rounded-xl shadow-lg">
        <h3 class="text-md font-bold text-white mb-6 border-b border-slate-800 pb-4">Detail Kredensial API</h3>
        
        <form @submit.prevent class="space-y-5">
          <!-- Input Host URL -->
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Proxmox Host URL
            </label>
            <div class="relative">
              <i class="ph ph-link absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg"></i>
              <input 
                type="text" 
                v-model="form.hostUrl"
                placeholder="https://10.10.1.10:8006"
                class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-moxgreen transition"
              >
            </div>
            <p class="text-xs text-slate-500 mt-1.5">Masukkan IP atau Domain lengkap dengan port (default: 8006).</p>
          </div>

          <!-- Input Token ID -->
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              API Token ID
            </label>
            <div class="relative">
              <i class="ph ph-identification-card absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg"></i>
              <input 
                type="text" 
                v-model="form.tokenId"
                placeholder="root@pam!moxview"
                class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-moxgreen transition"
              >
            </div>
            <p class="text-xs text-slate-500 mt-1.5">Format standar: <code class="text-slate-400 bg-slate-800 px-1 rounded">username@realm!token_name</code></p>
          </div>

          <!-- Input Token Secret -->
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              API Token Secret (UUID)
            </label>
            <div class="relative">
              <i class="ph ph-key absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg"></i>
              <input 
                :type="showSecret ? 'text' : 'password'" 
                v-model="form.tokenSecret"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:border-moxgreen transition font-mono"
              >
              <!-- Toggle Show Password -->
              <button 
                @click="showSecret = !showSecret"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                <i :class="showSecret ? 'ph ph-eye-slash' : 'ph ph-eye'" class="text-lg"></i>
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Card Status Koneksi (Mengambil 1 Kolom) -->
      <div class="col-span-1 space-y-6">
        <!-- Status -->
        <div class="bg-moxcard border border-slate-800 p-6 rounded-xl shadow-lg relative overflow-hidden">
          <!-- Dekorasi Background -->
          <div class="absolute -right-6 -top-6 text-emerald-500/5">
            <i class="ph-fill ph-check-circle" style="font-size: 8rem;"></i>
          </div>

          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 relative z-10">Status Koneksi Terakhir</p>
          
          <div class="flex items-center gap-4 relative z-10">
            <div class="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
              <i class="ph-bold ph-plugs-connected text-2xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-emerald-400">TERHUBUNG</h3>
              <p class="text-xs text-slate-400 mt-0.5">Ping Latency: 1.2ms</p>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-800/80 relative z-10">
            <p class="text-xs text-slate-500 flex justify-between">
              <span>Node Aktif:</span> <span class="text-slate-300 font-medium">8 Node</span>
            </p>
            <p class="text-xs text-slate-500 flex justify-between mt-2">
              <span>Versi PVE:</span> <span class="text-slate-300 font-medium">8.1.3</span>
            </p>
          </div>
        </div>

        <!-- Panduan Singkat -->
        <div class="bg-blue-500/5 border border-blue-500/20 p-5 rounded-xl">
          <div class="flex gap-3">
            <i class="ph-fill ph-info text-blue-400 text-xl shrink-0"></i>
            <div>
              <h4 class="text-sm font-bold text-blue-400 mb-1">Keamanan Token</h4>
              <p class="text-xs text-slate-400 leading-relaxed">
                Disarankan untuk membuat API Token di Proxmox dengan privilege (hak akses) <span class="text-slate-300 font-mono bg-slate-800/50 px-1 rounded">PVEAuditor</span> saja agar MoxView hanya bisa membaca data secara *Read-Only* tanpa risiko mengubah konfigurasi server Anda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue';

// State Form Data (Mockup)
const form = ref({
  hostUrl: 'https://10.10.1.10:8006',
  tokenId: 'mox_monitoring@pam!moxview',
  tokenSecret: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'
});

// State untuk toggle hide/show password secret
const showSecret = ref(false);
</script>