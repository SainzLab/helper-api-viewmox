<template>
  <div class="min-h-screen flex text-slate-200 bg-moxdark">
    <!-- Sidebar -->
    <!-- Kita passing event @navigate ke Sidebar untuk menangkap klik menu -->
    <Sidebar @navigate="changeMenu" :activeMenu="currentMenu" />

    <!-- Main Content -->
    <div class="ml-64 flex-1 flex flex-col w-[calc(100%-16rem)]">
      <!-- Navbar -->
      <Navbar />

      <!-- Area Dinamis (Berubah sesuai menu yang diklik) -->
      <component :is="activeComponent" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import Navbar from '@/components/layout/Navbar.vue';
import Dashboard from '@/components/dashboard/Dashboard.vue';
import KelolaPengguna from '@/components/dashboard/KelolaPengguna.vue';
import TargetMonitoring from '@/components/dashboard/TargetMonitoring.vue';
import ThresholdConfig from '@/components/dashboard/ThresholdConfig.vue';
import ProxmoxConfig from '@/components/config/ProxmoxConfig.vue';
import RekapGangguan from '@/components/dashboard/RekapGangguan.vue';
// State untuk melacak menu yang aktif (default: dashboard)
const currentMenu = ref('dashboard');

// Fungsi untuk mengganti menu dari Sidebar
const changeMenu = (menuName) => {
  currentMenu.value = menuName;
};

// Computed property untuk menentukan komponen mana yang dirender
const activeComponent = computed(() => {
  switch (currentMenu.value) {
    case 'dashboard': return Dashboard;
    case 'kelola-pengguna': return KelolaPengguna;
    case 'target-monitoring': return TargetMonitoring;
    case 'threshold-config': return ThresholdConfig;
    case 'proxmox-config': return ProxmoxConfig;
    case 'rekap-gangguan': return RekapGangguan;
    default: return Dashboard;
  }
});
</script>