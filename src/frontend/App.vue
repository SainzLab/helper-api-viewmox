<template>
  <div class="flex md:hidden min-h-screen bg-moxdark items-center justify-center p-6 relative overflow-hidden">
    <div class="absolute top-[-10%] left-[-10%] w-64 h-64 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>

    <div class="bg-moxcard border border-slate-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_8px_30px_rgb(0,0,0,0.5)] relative z-10">
      <div class="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
        <i class="ph-bold ph-monitor text-3xl"></i>
      </div>
      <h2 class="text-xl font-bold text-white mb-3">Resolusi Tidak Didukung</h2>
      <p class="text-sm text-slate-400 leading-relaxed mb-8">
        Sistem ProxView ini dirancang khusus untuk layar besar agar pemantauan infrastruktur lebih maksimal. Mohon akses menggunakan <span class="font-bold text-slate-200">Tablet</span> atau <span class="font-bold text-slate-200">Desktop</span>.
      </p>
      <div class="flex items-center justify-center gap-4 text-slate-500">
        <div class="relative">
          <i class="ph ph-device-mobile text-4xl text-slate-600"></i>
          <i class="ph-fill ph-prohibit text-rose-500 absolute -bottom-1 -right-2 text-xl bg-moxcard rounded-full border border-moxcard"></i>
        </div>
        <i class="ph-bold ph-arrow-right text-sm mx-2"></i>
        <i class="ph ph-device-tablet text-4xl text-blue-400"></i>
        <i class="ph ph-monitor text-4xl text-blue-400"></i>
      </div>
    </div>
  </div>

  <div class="hidden md:block relative">
    <div v-if="showSuccessToast" class="fixed top-8 right-8 z-50 w-[400px] bg-[#151e2b] border-t-4 border-emerald-400 rounded-b-xl rounded-t-sm shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-5 flex gap-4 animate-slide-in">
      <div class="flex-shrink-0 w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
        <div class="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center text-slate-900">
          <i class="ph-bold ph-check text-sm"></i>
        </div>
      </div>
      <div class="flex-1">
        <div class="flex justify-between items-start">
          <h3 class="text-white font-bold text-lg leading-none mb-2.5">Login Berhasil!</h3>
          <button @click="showSuccessToast = false" class="text-slate-400 hover:text-white transition">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <p class="text-slate-300 text-sm mb-1.5">
          Selamat datang kembali, <span class="font-bold text-white">{{ userName }}</span>.
        </p>
        <p class="text-slate-300 text-sm">
          Sesi otentikasi aktif untuk role <span class="text-emerald-400 font-mono">{{ userRole }}</span>.
        </p>
      </div>
    </div>

    <div v-if="showLogoutToast" class="fixed top-8 right-8 z-50 w-[400px] bg-[#151e2b] border-t-4 border-slate-600 rounded-b-xl rounded-t-sm shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-5 flex gap-4 animate-slide-in">
      <div class="flex-shrink-0 w-12 h-12 bg-slate-700/30 border border-slate-600/50 rounded-xl flex items-center justify-center">
        <i class="ph-bold ph-sign-out text-xl text-slate-300"></i>
      </div>
      <div class="flex-1">
        <div class="flex justify-between items-start">
          <h3 class="text-white font-bold text-lg leading-none mb-2.5">Sesi Telah Ditutup</h3>
          <button @click="showLogoutToast = false" class="text-slate-400 hover:text-white transition">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <p class="text-slate-300 text-sm mb-1.5">
          Token sesi Anda telah berhasil dihapus.
        </p>
        <p class="text-slate-300 text-sm">
          Sampai jumpa kembali di konsol monitoring.
        </p>
      </div>
    </div>
    <!-- MODAL POP-UP TIMEOUT (Custom Alert) -->
    <div v-if="showTimeoutModal" class="fixed inset-0 z-50 flex items-center justify-center bg-moxdark/80 backdrop-blur-sm p-4 transition-opacity">
      <div class="bg-moxcard border border-rose-500/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_0_40px_rgba(244,63,94,0.15)] relative overflow-hidden animate-bounce-in">
        <!-- Dekorasi Background Modal -->
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 rounded-full blur-[30px]"></div>
        
        <div class="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 relative z-10">
          <i class="ph-fill ph-clock-countdown text-3xl"></i>
        </div>
        <h3 class="text-xl font-bold text-white mb-2 relative z-10">Sesi Telah Berakhir</h3>
        <p class="text-sm text-slate-400 mb-8 relative z-10 leading-relaxed">
          Sistem mendeteksi tidak ada aktivitas selama 1 menit. Demi keamanan server, Anda telah dikeluarkan secara otomatis.
        </p>
        <button @click="confirmTimeout" class="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-lg transition shadow-lg relative z-10 flex justify-center items-center gap-2">
          Kembali ke Login <i class="ph-bold ph-arrow-right"></i>
        </button>
      </div>
    </div>

    <!-- Router View -->
    <router-view v-if="$route.name === 'login'" />

    <div v-else class="min-h-screen flex text-slate-200 bg-moxdark">
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