<template> 
  <main class="bg-[#f8f9fa] min-h-screen font-sans p-8 pb-12 overflow-x-hidden relative"> 
    
    <!-- Render ICMP/TCP Component --> 
    <IcmpTcpMonitor 
      v-if="viewMode === 'icmp'" 
      @change-view="viewMode = $event" 
    /> 
    
    <!-- Render Proxmox Component --> 
    <ProxmoxMonitor 
      v-else-if="viewMode === 'proxmox'" 
      @change-view="viewMode = $event" 
    /> 
    
  </main> 
</template>

<script setup>
import { ref } from 'vue';

// Import kedua file komponen yang sudah dipisah
import IcmpTcpMonitor from '@/components/layout/IcmpTcpMonitor.vue';
import ProxmoxMonitor from '@/components/layout/ProxmoxMonitor.vue';

// Default view saat halaman pertama kali dibuka
const viewMode = ref('icmp'); 
</script>