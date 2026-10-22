<template>
  <main class="bg-[#f8f9fa] min-h-screen font-sans p-8 pb-12 overflow-x-hidden relative animate-fade-in">
    <transition name="fade" mode="out-in">
      <!-- Render System Log Component -->
      <SystemLog 
        v-if="viewMode === 'system'" 
        @change-view="viewMode = $event" 
      />
      
      <!-- Render Proxmox Log Component -->
      <ProxmoxLog 
        v-else-if="viewMode === 'proxmox'" 
        @change-view="viewMode = $event" 
      />
    </transition>
  </main>
</template>

<script setup>
import { ref } from 'vue';

// Import kedua file komponen log
import SystemLog from '@/components/layout/SystemLog.vue';
import ProxmoxLog from '@/components/layout/ProxmoxLog.vue';
// Default view saat menu Log pertama kali dibuka
const viewMode = ref('system'); 
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>