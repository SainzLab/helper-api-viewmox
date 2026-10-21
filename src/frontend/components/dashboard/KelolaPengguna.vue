<template>
  <main class="p-8 pb-12 overflow-x-hidden relative">
    <!-- Header Halaman -->
    <div class="flex justify-between items-end mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1 flex items-center gap-3">
          <i class="ph-bold ph-user-list text-moxgreen"></i> Kelola Pengguna Sistem
        </h2>
        <p class="text-slate-400 text-sm">Daftar operator dan hak akses user ke API daemon.</p>
      </div>
      <div>
        <button @click="openAddModal" class="px-4 py-2.5 bg-moxgreen text-moxdark rounded-lg flex items-center gap-2 hover:bg-emerald-400 text-sm font-bold transition shadow-lg">
          <i class="ph-bold ph-user-plus text-lg"></i> TAMBAH PENGGUNA BARU
        </button>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="bg-moxcard border border-slate-800 p-4 rounded-xl shadow-lg mb-6 flex justify-between items-center">
      <div class="relative w-96">
        <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg"></i>
        <input type="text" v-model="searchQuery" placeholder="Cari nama atau username..." class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-moxgreen transition" >
      </div>
      <div class="flex items-center gap-4">
        <!-- V-MODEL untuk Filter Role -->
        <select v-model="filterRole" class="bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 outline-none focus:border-moxgreen appearance-none pr-8 relative cursor-pointer">
          <option value="Semua Role">Semua Role</option>
          <option value="Admin">Admin</option>
          <option value="Teknisi">Teknisi</option>
          <option value="Kepala Bidang">Kepala Bidang</option>
        </select>
      </div>
    </div>

    <!-- Data Table & Pagination Container -->
    <div class="bg-moxcard border border-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-800/50 border-b border-slate-700 text-[11px] uppercase tracking-wider text-slate-400">
              <th class="px-6 py-4 font-semibold">Nama Lengkap</th>
              <th class="px-6 py-4 font-semibold">Username</th>
              <th class="px-6 py-4 font-semibold">Role Akses</th>
              <th class="px-6 py-4 font-semibold">Status Token API</th>
              <th class="px-6 py-4 font-semibold text-center">Status Akun</th>
              <th class="px-6 py-4 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr v-if="isLoading" class="border-b border-slate-800/50">
              <td colspan="6" class="px-6 py-8 text-center text-slate-400">
                <i class="ph-bold ph-spinner animate-spin text-2xl text-moxgreen mb-2 inline-block"></i>
                <p>Memuat data pengguna...</p>
              </td>
            </tr>
            <tr v-else-if="filteredUsers.length === 0" class="border-b border-slate-800/50">
              <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                <i class="ph-duotone ph-users-slash text-4xl mb-2"></i>
                <p>Tidak ada pengguna yang ditemukan.</p>
              </td>
            </tr>
            
            <!-- Looping menggunakan paginatedUsers (Maks 10) -->
            <tr v-else v-for="user in paginatedUsers" :key="user.id" 
                class="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                :class="!user.is_active ? 'opacity-50 grayscale-[30%]' : ''">
              
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" :class="getAvatarStyle(user.role)">
                    {{ getInitials(user.name) }}
                  </div>
                  <div>
                    <p class="text-slate-200 font-bold flex items-center gap-2">
                      {{ user.name }}
                      <i v-if="!user.is_active" class="ph-fill ph-lock-key text-rose-500 text-xs" title="Akun Dinonaktifkan"></i>
                    </p>
                    <p class="text-slate-500 text-xs">{{ user.email || '-' }}</p>
                  </div>
                </div>
              </td>
              
              <td class="px-6 py-4 text-slate-300 font-mono text-xs">@{{ user.username }}</td>
              
              <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold" :class="getRoleStyle(user.role).class">
                  <i :class="getRoleStyle(user.role).icon"></i> {{ user.role }}
                </span>
              </td>
              
              <td class="px-6 py-4">
                <div class="flex items-center gap-1.5 text-xs font-bold" :class="getTokenStatus(user).color">
                  <span class="w-1.5 h-1.5 rounded-full" :class="getTokenStatus(user).dot"></span>
                  {{ getTokenStatus(user).text }}
                </div>
              </td>
              
              <!-- KOLOM TOGGLE STATUS AKUN -->
              <td class="px-6 py-4 text-center">
                 <button 
                  @click="toggleStatus(user)" 
                  :disabled="isToggling === user.id"
                  class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none transition-colors duration-300 ease-in-out"
                  :class="user.is_active ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-700/50 border border-slate-600'"
                  :title="user.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'">
                  <span class="sr-only">Toggle user status</span>
                  <span 
                    class="pointer-events-none flex h-5 w-5 items-center justify-center transform rounded-full shadow ring-0 transition duration-300 ease-in-out"
                    :class="user.is_active ? 'translate-x-2.5 bg-emerald-500' : '-translate-x-2.5 bg-slate-400'">
                    <i v-if="isToggling === user.id" class="ph-bold ph-spinner animate-spin text-white text-[10px]"></i>
                  </span>
                </button>
              </td>

              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-3 text-slate-400">
                  <button v-if="user.role !== 'Admin'" @click="openTokenModal(user)" class="hover:text-amber-400 transition" title="Manajemen Token API">
                    <i class="ph ph-key text-lg"></i>
                  </button>
                  <button @click="editUser(user)" class="hover:text-blue-400 transition" title="Edit Pengguna">
                    <i class="ph ph-pencil-simple text-lg"></i>
                  </button>
                  <button @click="confirmDeleteUser(user)" class="hover:text-rose-500 transition" title="Hapus Pengguna">
                    <i class="ph ph-trash text-lg"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ========================================== -->
      <!-- PAGINATION CONTROLS                        -->
      <!-- ========================================== -->
      <div v-if="!isLoading && filteredUsers.length > 0" class="bg-slate-900/30 px-6 py-4 flex items-center justify-between border-t border-slate-800">
        <span class="text-xs text-slate-400">
          Menampilkan <span class="font-bold text-white">{{ (currentPage - 1) * itemsPerPage + 1 }}</span> 
          sampai <span class="font-bold text-white">{{ Math.min(currentPage * itemsPerPage, filteredUsers.length) }}</span> 
          dari <span class="font-bold text-white">{{ filteredUsers.length }}</span> pengguna
        </span>
        <div class="flex items-center gap-2">
          <button @click="prevPage" :disabled="currentPage === 1" class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
            <i class="ph-bold ph-caret-left"></i>
          </button>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
            <i class="ph-bold ph-caret-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL MANAJEMEN TOKEN API                  -->
    <!-- ========================================== -->
    <div v-if="showTokenModal" class="fixed inset-0 z-[40] flex items-center justify-center bg-moxdark/90 backdrop-blur-sm p-4 animate-fade-in">
      <div class="bg-moxcard border border-slate-700 shadow-2xl rounded-xl w-full max-w-lg overflow-hidden transform transition-all relative">
        <div class="h-1.5 w-full bg-amber-500 absolute top-0 left-0"></div>
        <div class="flex justify-between items-center p-6 border-b border-slate-800 mt-1">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <i class="ph-fill ph-key text-amber-500"></i> Manajemen Token Mobile
          </h3>
          <button @click="closeTokenModal" class="text-slate-400 hover:text-white"><i class="ph ph-x text-xl"></i></button>
        </div>
        <div class="p-6 space-y-6">
          <p class="text-sm text-slate-400 leading-relaxed">
            API Token untuk pengguna <span class="font-bold text-white">@{{ activeTokenUser?.username }}</span>. Gunakan kunci ini pada aplikasi Mobile untuk otentifikasi.
          </p>
          <div v-if="isLoadingToken" class="flex justify-center py-6">
            <i class="ph-bold ph-spinner animate-spin text-3xl text-amber-500"></i>
          </div>
          <div v-else>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Access Token</label>
            <div class="flex gap-2">
              <div class="relative flex-1">
                <input :type="showApiToken ? 'text' : 'password'" :value="apiTokenString" readonly class="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg pl-4 pr-10 py-2.5 outline-none font-mono selection:bg-moxgreen/30" >
                <button type="button" @click="showApiToken = !showApiToken" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                  <i :class="showApiToken ? 'ph ph-eye-slash' : 'ph ph-eye'" class="text-lg"></i>
                </button>
              </div>
              <button @click="copyToken" class="px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg transition flex items-center justify-center gap-2" title="Salin Token">
                <i class="ph-bold ph-copy"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="bg-slate-800/40 px-6 py-4 flex justify-between items-center border-t border-slate-700/80">
          <button @click="confirmResetToken" class="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500 hover:text-moxdark text-amber-500 border border-amber-500/20 rounded-lg text-sm font-bold transition flex items-center gap-2">
            <i class="ph-bold ph-arrows-clockwise"></i> Generate Ulang Token
          </button>
          <button @click="closeTokenModal" class="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition border border-slate-700">
            Tutup
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL KONFIRMASI GENERATE ULANG TOKEN      -->
    <!-- ========================================== -->
    <div v-if="showConfirmResetTokenModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-moxdark/90 backdrop-blur-sm p-4 animate-fade-in">
      <div class="bg-[#151e2b] border border-slate-700 shadow-2xl rounded-xl w-full max-w-md overflow-hidden transform transition-all relative">
        <div class="h-1.5 w-full bg-amber-500 absolute top-0 left-0"></div>
        <div class="p-6 pt-7">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-500 mt-0.5">
              <i class="ph-bold ph-arrows-clockwise text-2xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white mb-2">Generate Token Baru?</h3>
              <p class="text-sm text-slate-400 leading-relaxed">
                Anda akan mereset API Token untuk <span class="font-bold text-white">@{{ activeTokenUser?.username }}</span>. <br><br>
                Token lama akan langsung <span class="text-amber-400 font-bold">hangus</span> dan semua perangkat mobile yang menggunakan token tersebut akan terputus dari server.
              </p>
            </div>
          </div>
        </div>
        <div class="bg-slate-800/40 px-6 py-4 flex justify-end gap-3 border-t border-slate-700/80">
          <button @click="closeConfirmResetTokenModal" class="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/80 transition">
            Batal
          </button>
          <button @click="executeResetToken" class="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-moxdark rounded-lg text-sm font-bold transition shadow-[0_4px_12px_rgba(245,158,11,0.3)] flex items-center gap-2" :disabled="isResettingToken">
            <i class="ph-bold ph-arrows-clockwise" :class="{'animate-spin': isResettingToken}"></i>
            {{ isResettingToken ? 'Memproses...' : 'Ya, Generate Baru' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL FORM PENGGUNA (TAMBAH / EDIT) -->
    <div v-if="showModal" class="fixed inset-0 z-[40] flex items-center justify-center bg-moxdark/80 backdrop-blur-sm p-4">
      <div class="bg-moxcard border border-slate-700 rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden">
        <div class="flex justify-between items-center p-6 border-b border-slate-800">
          <h3 class="text-lg font-bold text-white">{{ isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru' }}</h3>
          <button @click="closeModal" class="text-slate-400 hover:text-white"><i class="ph ph-x text-xl"></i></button>
        </div>
        <form @submit.prevent="saveUser" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Nama Lengkap</label>
              <input type="text" v-model="form.name" required class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 focus:border-moxgreen outline-none transition">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Email</label>
              <input type="email" v-model="form.email" class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 focus:border-moxgreen outline-none transition">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Username</label>
            <input type="text" v-model="form.username" required class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 focus:border-moxgreen outline-none transition">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Password <span v-if="isEditMode" class="text-[9px] font-normal lowercase text-emerald-400">(Opsional)</span></label>
              <div class="relative">
                <input :type="showPassword ? 'text' : 'password'" v-model="form.password" :required="!isEditMode" class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg pl-4 pr-10 py-2 focus:border-moxgreen outline-none transition">
                <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <i :class="showPassword ? 'ph ph-eye-slash' : 'ph ph-eye'" class="text-lg"></i>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Konfirmasi Password</label>
              <div class="relative">
                <input :type="showConfirmPassword ? 'text' : 'password'" v-model="form.password_confirm" :required="form.password.length > 0" class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg pl-4 pr-10 py-2 focus:border-moxgreen outline-none transition">
                <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <i :class="showConfirmPassword ? 'ph ph-eye-slash' : 'ph ph-eye'" class="text-lg"></i>
                </button>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Role Akses</label>
            <select v-model="form.role" class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 focus:border-moxgreen outline-none appearance-none cursor-pointer">
              <option value="Admin">Admin (Akses Web Penuh)</option>
              <option value="Teknisi">Teknisi (Akses Mobile APP API)</option>
              <option value="Kepala Bidang">Kepala Bidang (Read-Only Mobile API)</option>
            </select>
          </div>
          
          <div v-if="form.role === 'Teknisi' || form.role === 'Kepala Bidang'" class="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mt-2">
            <label class="block text-xs font-bold text-amber-400 uppercase mb-2">
              <i class="ph-fill ph-key"></i> Masa Berlaku Token API Mobile
            </label>
            <input type="date" v-model="form.token_expires_at" required class="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 focus:border-amber-400 outline-none transition">
            <p v-if="isEditMode" class="text-[10px] text-emerald-400 mt-2 font-medium">* Ubah tanggal ini untuk me-renew (memperpanjang) masa aktif token.</p>
            <p v-else class="text-[10px] text-slate-500 mt-2">Sistem akan men-generate API Token unik saat pengguna disimpan.</p>
          </div>

          <div class="pt-4 border-t border-slate-800 flex justify-end gap-3 mt-6">
            <button type="button" @click="closeModal" class="px-5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition">Batal</button>
            <button type="submit" class="px-5 py-2 bg-moxgreen text-moxdark rounded-lg text-sm font-bold hover:bg-emerald-400 transition" :disabled="isSaving">
              {{ isSaving ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Simpan Pengguna') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL KONFIRMASI HAPUS -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-[50] flex items-center justify-center bg-moxdark/90 backdrop-blur-sm p-4 animate-fade-in">
      <div class="bg-[#151e2b] border border-slate-700 shadow-2xl rounded-xl w-full max-w-md overflow-hidden transform transition-all relative">
        <div class="h-1.5 w-full bg-rose-500 absolute top-0 left-0"></div>
        <div class="p-6 pt-7">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mt-0.5">
              <i class="ph-fill ph-warning-circle text-2xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white mb-2">Hapus Akses Pengguna?</h3>
              <p class="text-sm text-slate-400 leading-relaxed">
                Anda akan menghapus akun <span class="font-bold text-white">@{{ userToDelete?.username }}</span> (<span class="text-slate-300">{{ userToDelete?.name }}</span>) secara permanen. <br><br>
                Pengguna ini tidak akan bisa lagi mengakses API daemon maupun ProxView.
              </p>
            </div>
          </div>
        </div>
        <div class="bg-slate-800/40 px-6 py-4 flex justify-end gap-3 border-t border-slate-700/80">
          <button @click="closeDeleteModal" class="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/80 transition">
            Batal
          </button>
          <button @click="executeDeleteUser" class="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-bold transition shadow-[0_4px_12px_rgba(244,63,94,0.3)] flex items-center gap-2" :disabled="isDeleting">
            <i class="ph-bold ph-trash" v-if="!isDeleting"></i>
            {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen' }}
          </button>
        </div>
      </div>
    </div>

    <!-- TOAST NOTIFICATION -->
    <div v-if="toast.show" class="fixed top-8 right-8 z-[100] w-[400px] bg-[#151e2b] border-t-4 rounded-b-xl rounded-t-sm shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-5 flex gap-4 animate-slide-in"
         :class="toast.type === 'success' ? 'border-blue-500' : 'border-rose-500'">
      <div class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border"
           :class="toast.type === 'success' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'">
        <i class="text-2xl" :class="toast.type === 'success' ? 'ph-fill ph-floppy-disk' : 'ph-fill ph-warning-circle'"></i>
      </div>
      <div class="flex-1">
        <div class="flex justify-between items-start">
          <h3 class="text-white font-bold text-lg leading-none mb-2.5">{{ toast.title }}</h3>
          <button @click="toast.show = false" class="text-slate-400 hover:text-white transition">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <p class="text-slate-300 text-sm leading-relaxed">{{ toast.message }}</p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { toWibDateInput, isTokenExpired } from '../../utils/datetime.js';

const users = ref([]);
const isLoading = ref(true);
const showModal = ref(false);
const isSaving = ref(false);
const isToggling = ref(null); // Menyimpan ID user yang sedang diubah statusnya

// Fitur Search, Filter, dan Pagination
const searchQuery = ref('');
const filterRole = ref('Semua Role');
const currentPage = ref(1);
const itemsPerPage = 10;

const isEditMode = ref(false);
const editUserId = ref(null);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// State Modal Hapus
const showDeleteModal = ref(false);
const userToDelete = ref(null);
const isDeleting = ref(false);

// State Modal Token
const showTokenModal = ref(false);
const activeTokenUser = ref(null);
const apiTokenString = ref('');
const showApiToken = ref(false);
const isLoadingToken = ref(false);
const isResettingToken = ref(false);

// State Confirm Reset Token (Kustom Pop-up)
const showConfirmResetTokenModal = ref(false);

// State Toast Notification
const toast = ref({ show: false, type: 'success', title: '', message: '' });
let toastTimer = null;

const form = ref({
  name: '', email: '', username: '', password: '', password_confirm: '', role: 'Teknisi', token_expires_at: ''
});

// Helper Fungsi Show Toast
const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value.show = false; }, 5000);
};

// ==========================================
// LOGIKA FILTER & PAGINATION
// ==========================================
const filteredUsers = computed(() => {
  let result = users.value;
  if (filterRole.value !== 'Semua Role') {
    result = result.filter(user => user.role === filterRole.value);
  }
  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase();
    result = result.filter(user => 
      user.name.toLowerCase().includes(lowerCaseQuery) || 
      user.username.toLowerCase().includes(lowerCaseQuery)
    );
  }
  return result;
});

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage) || 1);
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredUsers.value.slice(start, end);
});

const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };

watch([searchQuery, filterRole], () => { currentPage.value = 1; });

// ==========================================
// API Fetch Data Users
const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const res = await fetch('/api/users');
    const data = await res.json();
    if (data.success) users.value = data.data;
  } catch (error) {
    showToast('error', 'Koneksi Terputus', 'Gagal memuat data pengguna dari server.');
  } finally {
    isLoading.value = false;
  }
};

// FUNGSI TOGGLE STATUS AKUN (ON/OFF)
const toggleStatus = async (user) => {
  isToggling.value = user.id;
  try {
    const res = await fetch(`/api/users/${user.id}/toggle-status`, { method: 'PUT' });
    const data = await res.json();
    
    if (data.success) {
      // Memperbarui state lokal agar tombol langsung bereaksi tanpa me-reload data
      user.is_active = data.is_active; 
      showToast('success', 'Status Diperbarui', data.message);
    } else {
      showToast('error', 'Gagal', data.message);
    }
  } catch (error) {
    showToast('error', 'Kesalahan', 'Gagal terhubung ke server saat mengubah status akun.');
  } finally {
    isToggling.value = null;
  }
};

// FUNGSI MANAJEMEN TOKEN
const openTokenModal = async (user) => {
  activeTokenUser.value = user;
  showApiToken.value = false;
  apiTokenString.value = '';
  showTokenModal.value = true;
  isLoadingToken.value = true;
  
  try {
    const res = await fetch(`/api/users/${user.id}/token`);
    const data = await res.json();
    if(data.success) {
      apiTokenString.value = data.token || 'Token API belum dibuat untuk pengguna ini.';
    } else {
      showToast('error', 'Gagal', data.message);
      closeTokenModal();
    }
  } catch(e) {
    showToast('error', 'Kesalahan', 'Gagal terhubung ke server saat mengambil token.');
    closeTokenModal();
  } finally {
    isLoadingToken.value = false;
  }
};

const closeTokenModal = () => {
  showTokenModal.value = false;
  activeTokenUser.value = null;
};

const copyToken = async () => {
  if(!apiTokenString.value || apiTokenString.value.includes('belum dibuat')) return;
  try {
    await navigator.clipboard.writeText(apiTokenString.value);
    showToast('success', 'Berhasil Disalin', 'Token API telah disalin ke clipboard Anda.');
  } catch (err) {
    showToast('error', 'Gagal', 'Sistem tidak dapat menyalin token secara otomatis.');
  }
};

const confirmResetToken = () => { showConfirmResetTokenModal.value = true; };
const closeConfirmResetTokenModal = () => { showConfirmResetTokenModal.value = false; };

const executeResetToken = async () => {
  isResettingToken.value = true;
  try {
    const res = await fetch(`/api/users/${activeTokenUser.value.id}/token/reset`, { method: 'POST' });
    const data = await res.json();
    if(data.success) {
      apiTokenString.value = data.token;
      showToast('success', 'Token Diperbarui', 'Token API yang baru berhasil dibuat.');
      closeConfirmResetTokenModal();
    } else {
      showToast('error', 'Gagal', data.message);
    }
  } catch(e) {
    showToast('error', 'Kesalahan', 'Gagal mereset token ke server.');
  } finally {
    isResettingToken.value = false;
  }
};

const openAddModal = () => {
  isEditMode.value = false;
  form.value = { name: '', email: '', username: '', password: '', password_confirm: '', role: 'Teknisi', token_expires_at: '' };
  showPassword.value = false;
  showConfirmPassword.value = false;
  showModal.value = true;
};

const editUser = (user) => {
  isEditMode.value = true;
  editUserId.value = user.id;
  
  let formattedDate = '';
  if (user.token_expires_at) {
    formattedDate = toWibDateInput(user.token_expires_at);
  }
  
  form.value = { 
    name: user.name, email: user.email || '', username: user.username, 
    password: '', password_confirm: '', role: user.role, token_expires_at: formattedDate 
  };
  showPassword.value = false; showConfirmPassword.value = false;
  showModal.value = true;
};

const saveUser = async () => {
  if (form.value.password !== form.value.password_confirm) {
    showToast('error', 'Validasi Gagal', 'Konfirmasi password yang Anda masukkan tidak cocok!');
    return;
  }
  isSaving.value = true;
  try {
    const url = isEditMode.value ? `/api/users/${editUserId.value}` : '/api/users';
    const method = isEditMode.value ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method: method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });
    const data = await res.json();
    if (data.success) {
      closeModal();
      fetchUsers();
      showToast('success', isEditMode.value ? 'Data Berhasil Diperbarui' : 'Pengguna Berhasil Disimpan', data.message || `Data pengguna ${form.value.name} telah disimpan.`);
    } else {
      showToast('error', 'Gagal Menyimpan', data.message || 'Periksa kembali data masukan Anda.');
    }
  } catch (error) {
    showToast('error', 'Kesalahan Jaringan', 'Terjadi kesalahan saat mencoba terhubung ke database server.');
  } finally {
    isSaving.value = false;
  }
};

const confirmDeleteUser = (user) => {
  userToDelete.value = user;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => { showDeleteModal.value = false; userToDelete.value = null; };

const executeDeleteUser = async () => {
  if (!userToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await fetch(`/api/users/${userToDelete.value.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      fetchUsers();
      showToast('success', 'Pengguna Dihapus', `Akun ${userToDelete.value.name} berhasil dihapus secara permanen dari sistem.`);
      closeDeleteModal();
      if (paginatedUsers.value.length === 1 && currentPage.value > 1) {
        currentPage.value--;
      }
    } else {
      showToast('error', 'Gagal Menghapus', data.message || 'Pengguna tersebut gagal dihapus.');
    }
  } catch (error) {
    showToast('error', 'Kesalahan Jaringan', 'Terjadi kesalahan saat menghapus pengguna.');
  } finally {
    isDeleting.value = false;
  }
};

const closeModal = () => { showModal.value = false; };

// --- Helper UI ---
const getInitials = (name) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getAvatarStyle = (role) => {
  if (role === 'Admin') return 'bg-emerald-500/20 text-emerald-400';
  if (role === 'Kepala Bidang') return 'bg-purple-500/20 text-purple-400';
  return 'bg-blue-500/20 text-blue-400';
};

const getRoleStyle = (role) => {
  if (role === 'Admin') return { class: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', icon: 'ph-bold ph-shield-star' };
  if (role === 'Kepala Bidang') return { class: 'bg-purple-500/10 border-purple-500/20 text-purple-400', icon: 'ph-bold ph-medal' };
  return { class: 'bg-blue-500/10 border-blue-500/20 text-blue-400', icon: 'ph-bold ph-wrench' };
};

const getTokenStatus = (user) => {
  if (user.role === 'Admin') return { text: 'Akses Web Penuh', color: 'text-slate-400', dot: 'hidden' };
  if (!user.token_expires_at) return { text: 'Token Tidak Aktif', color: 'text-slate-500', dot: 'bg-slate-500' };
  
  // Token berlaku sampai akhir hari kedaluwarsa (WIB)
  if (isTokenExpired(user.token_expires_at)) {
    return { text: 'Kedaluwarsa', color: 'text-rose-500', dot: 'bg-rose-500' };
  }
  const formattedDate = toWibDateInput(user.token_expires_at);
  return { text: `Aktif (Exp: ${formattedDate})`, color: 'text-blue-400', dot: 'bg-blue-500' };
};

onMounted(() => { fetchUsers(); });
</script>

<style scoped>
@keyframes slide-in {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
.animate-slide-in { animation: slide-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
.animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
@keyframes bounce-in {
  0% { transform: scale(0.9); opacity: 0; }
  50% { transform: scale(1.02); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-bounce-in { animation: bounce-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
</style>