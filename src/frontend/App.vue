<template>
  <div class="flex md:hidden min-h-screen bg-[#f8f9fa] items-center justify-center p-6 relative overflow-hidden font-sans">
    <!-- Efek Ambient -->
    <div class="absolute top-[-10%] left-[-10%] w-64 h-64 bg-rose-500/5 blur-[80px] rounded-full pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none"></div>

    <!-- Mobile Restriction Card -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative z-10">
      <div class="w-16 h-16 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
        <i class="ph-bold ph-monitor text-3xl"></i>
      </div>
      <h2 class="text-xl font-bold text-slate-900 mb-3 tracking-tight">Resolusi Tidak Didukung</h2>
      <p class="text-sm text-slate-500 font-medium leading-relaxed mb-8">
        Sistem ProxView ini dirancang khusus untuk layar besar agar pemantauan infrastruktur lebih maksimal. Mohon akses menggunakan <span class="font-bold text-slate-900">Tablet</span> atau <span class="font-bold text-slate-900">Desktop</span>.
      </p>
      <div class="flex items-center justify-center gap-4 text-slate-400">
        <div class="relative">
          <i class="ph ph-device-mobile text-4xl text-slate-300"></i>
          <i class="ph-fill ph-prohibit text-rose-500 absolute -bottom-1 -right-2 text-xl bg-white rounded-full border-2 border-white"></i>
        </div>
        <i class="ph-bold ph-arrow-right text-sm mx-2"></i>
        <i class="ph ph-device-tablet text-4xl text-blue-500"></i>
        <i class="ph ph-monitor text-4xl text-blue-500"></i>
      </div>
    </div>
  </div>

  <div class="hidden md:block relative font-sans">
    
    <!-- TOAST SUCCESS LOGIN -->
    <div v-if="showSuccessToast" class="fixed top-8 right-8 z-50 w-[400px] bg-white border-t-4 border-emerald-500 rounded-b-xl rounded-t-sm shadow-xl p-5 flex gap-4 animate-slide-in">
      <div class="flex-shrink-0 w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
        <div class="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-sm">
          <i class="ph-bold ph-check text-sm"></i>
        </div>
      </div>
      <div class="flex-1">
        <div class="flex justify-between items-start">
          <h3 class="text-slate-900 font-bold text-base tracking-tight leading-none mb-2.5">Login Berhasil!</h3>
          <button @click="showSuccessToast = false" class="text-slate-400 hover:text-slate-600 transition">
            <i class="ph-bold ph-x text-sm"></i>
          </button>
        </div>
        <p class="text-slate-500 font-medium text-sm mb-1.5">
          Selamat datang kembali, <span class="font-bold text-slate-900">{{ userName }}</span>.
        </p>
        <p class="text-slate-500 font-medium text-sm">
          Sesi otentikasi aktif untuk role <span class="text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-md font-mono tracking-tight font-bold text-[11px] uppercase ml-0.5">{{ userRole }}</span>.
        </p>
      </div>
    </div>

    <!-- TOAST LOGOUT -->
    <div v-if="showLogoutToast" class="fixed top-8 right-8 z-50 w-[400px] bg-white border border-slate-200 rounded-xl shadow-xl p-5 flex gap-4 animate-slide-in">
      <div class="flex-shrink-0 w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
        <i class="ph-bold ph-sign-out text-xl text-slate-600"></i>
      </div>
      <div class="flex-1">
        <div class="flex justify-between items-start">
          <h3 class="text-slate-900 font-bold text-base tracking-tight leading-none mb-2.5">Sesi Telah Ditutup</h3>
          <button @click="showLogoutToast = false" class="text-slate-400 hover:text-slate-600 transition">
            <i class="ph-bold ph-x text-sm"></i>
          </button>
        </div>
        <p class="text-slate-500 font-medium text-sm mb-1.5">
          Token sesi Anda telah berhasil dihapus.
        </p>
        <p class="text-slate-500 font-medium text-sm">
          Sampai jumpa kembali di konsol monitoring.
        </p>
      </div>
    </div>

    <!-- MODAL POP-UP TIMEOUT (Custom Alert) -->
    <div v-if="showTimeoutModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-opacity">
      <div class="bg-white border border-slate-200/80 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden animate-bounce-in">
        
        <!-- Dekorasi Background Modal -->
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-rose-50 rounded-full blur-[30px]"></div>
        
        <div class="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-5 relative z-10 shadow-sm">
          <i class="ph-fill ph-clock-countdown text-3xl"></i>
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2 relative z-10 tracking-tight">Sesi Telah Berakhir</h3>
        <p class="text-sm text-slate-500 font-medium mb-8 relative z-10 leading-relaxed">
          Sistem mendeteksi tidak ada aktivitas selama 1 menit. Demi keamanan server, Anda telah dikeluarkan secara otomatis.
        </p>
        <button @click="confirmTimeout" class="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-lg transition shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md relative z-10 flex justify-center items-center gap-2">
          Kembali ke Login <i class="ph-bold ph-arrow-right"></i>
        </button>
      </div>
    </div>

    <!-- Router View -->
    <router-view v-if="$route.name === 'login'" />

    <!-- Main Layout App Shell -->
    <div v-else class="min-h-screen flex text-slate-900 bg-[#f8f9fa]">
      <Sidebar />
      <div class="ml-64 flex-1 flex flex-col w-[calc(100%-16rem)]">
        <Navbar />
        <router-view />
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import Sidebar from '@/components/layout/Sidebar.vue';
import Navbar from '@/components/layout/Navbar.vue';

const route = useRoute();
const router = useRouter();

// ==========================================
// STATE NOTIFIKASI TOAST
// ==========================================
const showSuccessToast = ref(false);
const showLogoutToast = ref(false);
const userName = ref('');
const userRole = ref('');

// ==========================================
// FITUR AUTO-LOGOUT (INACTIVITY TIMEOUT)
// ==========================================
let timeoutTimer = null;
const INACTIVITY_LIMIT = 6000 * 100000; // 1 menit
const showTimeoutModal = ref(false);
let isAutoLogout = false; // Flag untuk membedakan auto-logout dan manual logout

const executeAutoLogout = () => {
  if (route.name !== 'login' && !showTimeoutModal.value) {
    showTimeoutModal.value = true;
    removeActivityListeners();
  }
};

const confirmTimeout = () => {
  isAutoLogout = true; // Tandai bahwa ini adalah proses auto-logout
  showTimeoutModal.value = false;
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userData');
  router.push('/login');
};

const resetTimer = () => {
  if (timeoutTimer) clearTimeout(timeoutTimer);
  if (route.name !== 'login' && !showTimeoutModal.value) {
    timeoutTimer = setTimeout(executeAutoLogout, INACTIVITY_LIMIT);
  }
};

const setupActivityListeners = () => {
  window.addEventListener('mousemove', resetTimer);
  window.addEventListener('mousedown', resetTimer);
  window.addEventListener('keydown', resetTimer);
  window.addEventListener('scroll', resetTimer);
  window.addEventListener('touchstart', resetTimer);
};

const removeActivityListeners = () => {
  window.removeEventListener('mousemove', resetTimer);
  window.removeEventListener('mousedown', resetTimer);
  window.removeEventListener('keydown', resetTimer);
  window.removeEventListener('scroll', resetTimer);
  window.removeEventListener('touchstart', resetTimer);
};

onMounted(() => {
  setupActivityListeners();
  resetTimer();
});

onUnmounted(() => {
  removeActivityListeners();
  if (timeoutTimer) clearTimeout(timeoutTimer);
});

// Reactivity pada perubahan router
watch(() => route.name, (newName, oldName) => {
  if (newName === 'login') {
    if (timeoutTimer) clearTimeout(timeoutTimer);
    removeActivityListeners();

    // Trigger Notifikasi Logout Berhasil (Manual Logout)
    if (oldName && oldName !== 'login') {
      if (isAutoLogout) {
        // Jika auto-logout, jangan tampilkan toast, reset flag-nya saja
        isAutoLogout = false;
      } else {
        // Jika manual logout, tampilkan toast
        showLogoutToast.value = true;
        setTimeout(() => {
          showLogoutToast.value = false;
        }, 5000);
      }
    }

  } else {
    setupActivityListeners();
    resetTimer();

    // Trigger Notifikasi Login Berhasil
    if (oldName === 'login') {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData.name) {
        userName.value = userData.name;
        userRole.value = userData.role;
        showSuccessToast.value = true;
        
        setTimeout(() => {
          showSuccessToast.value = false;
        }, 5000);
      }
    }
  }
});
</script>

<style scoped>
@keyframes bounce-in {
  0% { transform: scale(0.9); opacity: 0; }
  50% { transform: scale(1.02); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-bounce-in {
  animation: bounce-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes slide-in {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
.animate-slide-in {
  animation: slide-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
@keyframes slide-in {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
.animate-slide-in {
  animation: slide-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
</style>