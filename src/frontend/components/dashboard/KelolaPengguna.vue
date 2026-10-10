<template>
  <main class="p-8 pb-12 overflow-x-hidden">
    <!-- Header Halaman -->
    <div class="flex justify-between items-end mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1 flex items-center gap-3">
          <i class="ph-bold ph-user-list text-moxgreen"></i> Kelola Pengguna Sistem
        </h2>
        <p class="text-slate-400 text-sm">Daftar operator dan hak akses user ke API daemon serta dasbor mymomox.</p>
      </div>
      <div>
        <button class="px-4 py-2.5 bg-moxgreen text-moxdark rounded-lg flex items-center gap-2 hover:bg-emerald-400 text-sm font-bold transition">
          <i class="ph-bold ph-user-plus text-lg"></i> TAMBAH PENGGUNA BARU
        </button>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="bg-moxcard border border-slate-800 p-4 rounded-xl shadow-lg mb-6 flex justify-between items-center">
      <div class="relative w-96">
        <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg"></i>
        <input 
          type="text" 
          placeholder="Cari nama atau username..." 
          class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-moxgreen transition"
        >
      </div>
      
      <div class="flex items-center gap-4">
        <select class="bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg px-4 py-2 outline-none focus:border-moxgreen appearance-none pr-8 relative">
          <option>Semua Role</option>
          <option>Admin</option>
          <option>Teknisi</option>
          <option>Kepala Bidang</option>
        </select>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-moxcard border border-slate-800 rounded-xl shadow-lg overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-800/50 border-b border-slate-700 text-[11px] uppercase tracking-wider text-slate-400">
            <th class="px-6 py-4 font-semibold">Nama Lengkap</th>
            <th class="px-6 py-4 font-semibold">Username</th>
            <th class="px-6 py-4 font-semibold">Role Akses</th>
            <th class="px-6 py-4 font-semibold">Status Token API</th>
            <th class="px-6 py-4 font-semibold text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-for="(user, index) in users" :key="index" class="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
            <!-- Kolom Profil -->
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div :class="`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${user.avatarBg} ${user.avatarText}`">
                  {{ user.initials }}
                </div>
                <div>
                  <p class="text-slate-200 font-bold">{{ user.name }}</p>
                  <p class="text-slate-500 text-xs">{{ user.email }}</p>
                </div>
              </div>
            </td>
            
            <!-- Kolom Username -->
            <td class="px-6 py-4 text-slate-300 font-mono text-xs">
              {{ user.username }}
            </td>
            
            <!-- Kolom Role -->
            <td class="px-6 py-4">
              <span :class="`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${user.roleClass}`">
                <i :class="user.roleIcon"></i> {{ user.role }}
              </span>
            </td>
            
            <!-- Kolom Status -->
            <td class="px-6 py-4">
              <div class="flex items-center gap-1.5 text-xs font-bold" :class="user.statusColor">
                <span v-if="user.isActive" class="w-1.5 h-1.5 rounded-full" :class="user.dotColor"></span>
                {{ user.statusText }}
              </div>
            </td>
            
            <!-- Kolom Aksi -->
            <td class="px-6 py-4 text-center">
              <div class="flex items-center justify-center gap-3 text-slate-400">
                <button class="hover:text-moxgreen transition"><i class="ph ph-pencil-simple text-lg"></i></button>
                <button class="hover:text-rose-500 transition"><i class="ph ph-trash text-lg"></i></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue';

// Data Mockup sesuai dengan desain gambar
const users = ref([
  {
    initials: 'BW', name: 'Budi Wicaksono, S.Kom', email: 'budi.w@diskominfo.go.id', username: '@budi_admin',
    avatarBg: 'bg-emerald-500/20', avatarText: 'text-emerald-400',
    role: 'Admin', roleIcon: 'ph-bold ph-circle', roleClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    isActive: true, statusText: 'Aktif (Exp: 2025-12-31)', statusColor: 'text-emerald-400', dotColor: 'bg-emerald-500'
  },
  {
    initials: 'RA', name: 'Rizky Ananda', email: 'rizky.infra@diskominfo.go.id', username: '@rizky_netops',
    avatarBg: 'bg-blue-500/20', avatarText: 'text-blue-400',
    role: 'Teknisi', roleIcon: 'ph-bold ph-wrench', roleClass: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    isActive: true, statusText: 'Aktif (Exp: 2025-06-30)', statusColor: 'text-emerald-400', dotColor: 'bg-emerald-500'
  },
  {
    initials: 'DR', name: 'Drs. H. Rahman Hakim, M.T.', email: 'kabid.tik@diskominfo.go.id', username: '@kabid_rahman',
    avatarBg: 'bg-purple-500/20', avatarText: 'text-purple-400',
    role: 'Kepala Bidang', roleIcon: 'ph-bold ph-medal', roleClass: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    isActive: true, statusText: 'Read-Only Active', statusColor: 'text-emerald-400', dotColor: 'bg-emerald-500'
  },
  {
    initials: 'FS', name: 'Fajar Sidik', email: 'fajar.magang@diskominfo.go.id', username: '@fajar_intern',
    avatarBg: 'bg-slate-600/40', avatarText: 'text-slate-300',
    role: 'Teknisi', roleIcon: 'ph-bold ph-wrench', roleClass: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    isActive: false, statusText: 'Kedaluwarsa', statusColor: 'text-rose-500', dotColor: 'bg-rose-500'
  }
]);
</script>