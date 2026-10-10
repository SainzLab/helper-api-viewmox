<template>
  <header class="h-16 bg-moxdark border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
    
    <!-- Breadcrumb & Jam Digital -->
    <div class="text-xs font-medium text-slate-400 flex items-center gap-2 uppercase tracking-wide">
      <div class="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/80 px-2.5 py-1 rounded text-slate-200 tracking-wider">
        <i class="ph-fill ph-clock text-moxgreen text-sm"></i>
        <span class="font-mono text-[11px] font-bold">{{ currentTime }}</span>
      </div>
    </div>
    
    <!-- Tombol Notifikasi -->
    <div>
      <button class="w-9 h-9 flex items-center justify-center bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 hover:text-white border border-slate-700 transition relative">
        <i class="ph ph-bell text-lg"></i>
        <span class="absolute top-2 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-slate-800"></span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const currentTime = ref('');
let timer = null;

const updateClock = () => {
  const now = new Date();
  
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  currentTime.value = `${hours}:${minutes}:${seconds} WIB`;
};

onMounted(() => {
  updateClock(); // Set waktu pertama kali agar tidak kosong sesaat
  timer = setInterval(updateClock, 1000); // Jalankan fungsi update setiap 1000ms (1 detik)
});

// Lifecycle Hooks: Dijalankan saat komponen dihancurkan (Unmount)
onUnmounted(() => {
  if (timer) {
    clearInterval(timer); // Hapus interval untuk mencegah memory leak
  }
});
</script>