<template>
  <main class="p-8 pb-12 overflow-x-hidden min-h-screen">
    <!-- Header Halaman & Toggle Tab -->
    <div class="flex justify-between items-end mb-6 pb-5">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1 flex items-center gap-3">
          <i class="ph-bold ph-sliders text-moxgreen"></i> Konfigurasi Threshold
        </h2>
        <p class="text-slate-400 text-sm">Atur pemicu notifikasi alarm untuk infrastruktur Anda.</p>
      </div>
      
      <!-- TOGGLE MODE BUTTON -->
      <div class="flex bg-slate-900 border border-slate-700 p-1 rounded-lg shadow-inner">
        <button 
          @click="activeTab = 'proxmox'" 
          class="px-5 py-2 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-2"
          :class="activeTab === 'proxmox' ? 'bg-moxgreen text-moxdark shadow' : 'text-slate-400 hover:text-white'">
          <i class="ph-bold ph-hard-drives"></i> PROXMOX API
        </button>
        <button 
          @click="activeTab = 'network'" 
          class="px-5 py-2 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-2"
          :class="activeTab === 'network' ? 'bg-blue-500 text-white shadow' : 'text-slate-400 hover:text-white'">
          <i class="ph-bold ph-activity"></i> ICMP / TCP
        </button>
      </div>
    </div>

    <!-- Render Komponen Berdasarkan Tab Aktif -->
   <transition name="fade" mode="out-in">
      <component :is="activeTab === 'proxmox' ? ThresholdProxmox : ThresholdNetwork" />
    </transition>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import ThresholdProxmox from '@/components/layout/ThresholdProxmox.vue'; // Sesuaikan path jika ditaruh di folder components
import ThresholdNetwork from '@/components/layout/ThresholdIcmpTcp.vue';   // Sesuaikan path jika ditaruh di folder components

const activeTab = ref('proxmox');
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>