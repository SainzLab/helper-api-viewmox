<template>
  <main class="p-8 pb-12 overflow-x-hidden relative">
    
    <!-- Header Halaman -->
    <div class="flex justify-between items-end mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1 flex items-center gap-3">
          <i class="ph-bold ph-hard-drives text-moxgreen"></i> Konfigurasi API Proxmox
        </h2>
        <p class="text-slate-400 text-sm">Pengaturan koneksi dan kredensial API Token untuk multi-server Proxmox VE.</p>
      </div>
      <div>
        <button @click="openAddModal" class="px-4 py-2.5 bg-moxgreen text-moxdark rounded-lg flex items-center gap-2 hover:bg-emerald-400 text-sm font-bold transition shadow-lg">
          <i class="ph-bold ph-plus-circle text-lg"></i> TAMBAH SERVER PROXMOX
        </button>
      </div>
    </div>

    <!-- Info Banner -->
    <div class="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl mb-6 flex gap-4 items-start">
      <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
        <i class="ph-fill ph-info text-xl"></i>
      </div>
      <div>
        <h4 class="text-sm font-bold text-blue-400 mb-1">Rekomendasi Keamanan Token API</h4>
        <p class="text-xs text-slate-400 leading-relaxed max-w-4xl">
          Disarankan untuk membuat API Token di Proxmox dengan hak akses (Privilege) <span class="text-slate-300 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded">PVEAuditor</span> pada path <span class="text-slate-300 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded">/</span>. Hal ini memastikan MoxView hanya dapat memantau data secara <i>Read-Only</i> dan tidak memiliki akses untuk mengubah atau menghapus VM/Container di server Anda.
        </p>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-moxcard border border-slate-800 rounded-xl shadow-lg overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-800/50 border-b border-slate-700 text-[11px] uppercase tracking-wider text-slate-400">
            <th class="px-6 py-4 font-semibold w-1/4">Label / Nama Server</th>
            <th class="px-6 py-4 font-semibold w-1/4">Host URL</th>
            <th class="px-6 py-4 font-semibold">API Token ID</th>
            <th class="px-6 py-4 font-semibold">Status Koneksi</th>
            <th class="px-6 py-4 font-semibold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-if="isLoading" class="border-b border-slate-800/50">
            <td colspan="5" class="px-6 py-12 text-center text-slate-400">
              <i class="ph-bold ph-spinner animate-spin text-2xl text-moxgreen mb-2 inline-block"></i>
              <p>Memuat data server Proxmox...</p>
            </td>
          </tr>
          <tr v-else-if="proxmoxNodes.length === 0" class="border-b border-slate-800/50">
            <td colspan="5" class="px-6 py-12 text-center text-slate-500">
              <i class="ph-duotone ph-hard-drives text-4xl mb-2"></i>
              <p>Belum ada server Proxmox yang ditambahkan.</p>
            </td>
          </tr>
          
          <!-- MENGGUNAKAN <template> UNTUK ACCORDION -->
          <template v-else v-for="node in proxmoxNodes" :key="node.id">
            
            <!-- Baris Utama (Bisa di-klik) -->
            <tr @click="toggleExpanded(node)" 
                class="border-b border-slate-800/50 transition cursor-pointer group"
                :class="expandedNodeId === node.id ? 'bg-slate-800/30' : 'hover:bg-slate-800/30'">
              
              <!-- Label Server -->
              <td class="px-6 py-4">
                <p class="font-bold text-slate-200 group-hover:text-moxgreen transition flex items-center gap-2">
                  {{ node.name }}
                  <i v-if="expandedNodeId === node.id" class="ph-bold ph-caret-up text-xs text-slate-500"></i>
                  <i v-else class="ph-bold ph-caret-down text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition"></i>
                </p>
                <p class="text-[10px] text-slate-500 mt-0.5" v-if="node.pveVersion">PVE Version: {{ node.pveVersion }}</p>
              </td>
              
              <!-- Host URL -->
              <td class="px-6 py-4 text-slate-300 font-mono text-xs">
                <a :href="node.hostUrl" target="_blank" @click.stop class="hover:text-blue-400 transition flex items-center gap-1.5 w-fit">
                  {{ node.hostUrl }} <i class="ph-bold ph-arrow-up-right text-[10px]"></i>
                </a>
              </td>

              <!-- Token ID -->
              <td class="px-6 py-4">
                <span class="inline-block bg-slate-900/80 border border-slate-700 text-slate-400 font-mono text-xs px-2.5 py-1 rounded">
                  {{ node.tokenId }}
                </span>
              </td>
              
              <!-- Status Koneksi -->
              <td class="px-6 py-4">
                <div v-if="node.isTesting" class="flex items-center gap-2 text-amber-500 text-xs font-bold">
                  <i class="ph-bold ph-spinner animate-spin text-lg"></i> Menguji...
                </div>
                <div v-else-if="node.status === 'TERHUBUNG'" class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> UP
                  </span>
                  <span class="text-[10px] text-slate-500">{{ node.latency }}</span>
                </div>
                <div v-else-if="node.status === 'GAGAL'" class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> DOWN
                  </span>
                </div>
                <div v-else class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-bold">
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span> BELUM DIUJI
                  </span>
                </div>
              </td>
              
              <!-- Aksi (@click.stop Mencegah row accordion terbuka) -->
              <td class="px-6 py-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-3 text-slate-400">
                  <button @click="testConnection(node)" class="hover:text-emerald-400 transition" title="Uji Koneksi API" :disabled="node.isTesting">
                    <i class="ph ph-plugs-connected text-lg" :class="{'animate-pulse text-amber-500': node.isTesting}"></i>
                  </button>
                  <button @click="editNode(node)" class="hover:text-blue-400 transition" title="Edit Konfigurasi">
                    <i class="ph ph-gear text-lg"></i>
                  </button>
                  <button @click="confirmDeleteNode(node)" class="hover:text-rose-500 transition" title="Hapus Server">
                    <i class="ph ph-trash text-lg"></i>
                  </button>
                </div>
              </td>
            </tr>

            <!-- Baris Detail (Hanya Di-render saat Node di-klik) -->
            <tr v-if="expandedNodeId === node.id">
              <td colspan="5" class="p-0 border-b border-slate-800/50 bg-slate-800/10">
                <div class="p-6 animate-fade-in">
                  
                  <!-- Loader saat Fetching API -->
                  <div v-if="isLoadingDetails" class="flex flex-col items-center justify-center py-10">
                    <i class="ph-bold ph-spinner animate-spin text-3xl text-moxgreen mb-3"></i>
                    <p class="text-sm text-slate-400">Menarik data Resources dari node {{ node.name }}...</p>
                  </div>
                  
                  <!-- Data Resources (Jika tidak UP) -->
                  <div v-else-if="node.status !== 'TERHUBUNG'" class="flex flex-col items-center justify-center py-8 text-slate-500">
                    <i class="ph-duotone ph-plugs text-4xl mb-2"></i>
                    <p class="text-sm">Silakan 'Uji Koneksi' terlebih dahulu agar sistem dapat menarik data resource.</p>
                  </div>

                  <div v-else class="grid grid-cols-3 gap-6">
                    
                    <div class="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                      <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between border-b border-slate-700/50 pb-2">
                        <span class="flex items-center gap-2"><i class="ph-fill ph-desktop text-blue-400"></i> Virtual Machines</span>
                        <span class="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[10px]">{{ nodeDetails.vms.length }}</span>
                      </h4>
                      <ul class="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                        <li v-for="vm in nodeDetails.vms" :key="vm.vmid" class="flex items-center justify-between text-xs p-2 rounded hover:bg-slate-800/50 transition">
                          <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full" :class="vm.status === 'running' ? 'bg-emerald-500' : 'bg-slate-600'"></span>
                            <span class="text-slate-300">{{ vm.name }}</span>
                          </div>
                          <span class="text-slate-500 font-mono">ID: {{ vm.vmid }}</span>
                        </li>
                        <li v-if="nodeDetails.vms.length === 0" class="text-xs text-slate-500 text-center py-2">Tidak ada VM ditemukan.</li>
                      </ul>
                    </div>

                    <div class="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                      <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between border-b border-slate-700/50 pb-2">
                        <span class="flex items-center gap-2"><i class="ph-fill ph-cube text-purple-400"></i> LXC Containers</span>
                        <span class="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-[10px]">{{ nodeDetails.lxcs.length }}</span>
                      </h4>
                      <ul class="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                        <li v-for="lxc in nodeDetails.lxcs" :key="lxc.vmid" class="flex items-center justify-between text-xs p-2 rounded hover:bg-slate-800/50 transition">
                          <div class="flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full" :class="lxc.status === 'running' ? 'bg-emerald-500' : 'bg-slate-600'"></span>
                            <span class="text-slate-300">{{ lxc.name }}</span>
                          </div>
                          <span class="text-slate-500 font-mono">ID: {{ lxc.vmid }}</span>
                        </li>
                        <li v-if="nodeDetails.lxcs.length === 0" class="text-xs text-slate-500 text-center py-2">Tidak ada LXC ditemukan.</li>
                      </ul>
                    </div>

                    <!-- Kolom Storage -->
                    <div class="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
                      <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between border-b border-slate-700/50 pb-2">
                        <span class="flex items-center gap-2"><i class="ph-fill ph-hard-drive text-amber-400"></i> Data Storages</span>
                        <span class="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded text-[10px]">{{ nodeDetails.storages.length }}</span>
                      </h4>
                      <ul class="space-y-3 max-h-40 overflow-y-auto no-scrollbar pr-1">
                        <li v-for="storage in nodeDetails.storages" :key="storage.storage" class="text-xs p-2 rounded bg-slate-800/30 border border-slate-700/30">
                          <div class="flex justify-between items-center mb-1.5">
                            <span class="font-bold text-slate-300">{{ storage.storage }}</span>
                            <span class="text-[9px] uppercase bg-slate-800 px-1 rounded text-slate-400 border border-slate-700">{{ storage.type }}</span>
                          </div>
                          <div class="flex items-center justify-between text-[10px]">
                            <span class="text-slate-400">Used: <span class="text-amber-400">{{ storage.used }}</span></span>
                            <span class="text-slate-500">Total: {{ storage.total }}</span>
                          </div>
                        </li>
                        <li v-if="nodeDetails.storages.length === 0" class="text-xs text-slate-500 text-center py-2">Tidak ada storage.</li>
                      </ul>
                    </div>

                  </div>
                </div>
              </td>
            </tr>
          </template>

        </tbody>
      </table>
    </div>

    <!-- ========================================== -->
    <!-- MODAL FORM PROXMOX (TAMBAH / EDIT)         -->
    <!-- ========================================== -->
    <div v-if="showModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-moxdark/90 backdrop-blur-sm p-4 animate-fade-in">
      <div class="bg-moxcard border border-slate-700 shadow-2xl rounded-2xl w-full max-w-xl overflow-hidden transform transition-all">
        <div class="flex justify-between items-center p-6 border-b border-slate-800">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <i class="ph-fill ph-hard-drives text-moxgreen"></i> {{ isEditMode ? 'Edit Server Proxmox' : 'Tambah Server Proxmox' }}
          </h3>
          <button @click="closeModal" class="text-slate-400 hover:text-white"><i class="ph ph-x text-xl"></i></button>
        </div>

        <form @submit.prevent="saveNode" class="p-6 space-y-5">
          <!-- Input Nama Label -->
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Label / Nama Server</label>
            <div class="relative">
              <i class="ph ph-tag absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg"></i>
              <input type="text" v-model="form.name" required placeholder="Contoh: Datacenter Utama" class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-moxgreen transition">
            </div>
          </div>

          <!-- Input Host URL -->
          <div>
            <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Proxmox Host URL</label>
            <div class="relative">
              <i class="ph ph-link absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg"></i>
              <input type="url" v-model="form.hostUrl" required placeholder="https://10.10.1.10:8006" class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm font-mono rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-moxgreen transition">
            </div>
            <p class="text-[10px] text-slate-500 mt-1.5">Gunakan protokol HTTPS dan port (default: 8006).</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Input Token ID -->
            <div>
              <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">API Token ID</label>
              <div class="relative">
                <i class="ph ph-identification-card absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg"></i>
                <input type="text" v-model="form.tokenId" required placeholder="root@pam!moxview" class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm font-mono rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-moxgreen transition">
              </div>
            </div>

            <!-- Input Token Secret -->
            <div>
              <label class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">API Token Secret</label>
              <div class="relative">
                <i class="ph ph-key absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg"></i>
                <input :type="showSecret ? 'text' : 'password'" v-model="form.tokenSecret" :required="!isEditMode" placeholder="UUID Kredensial" class="w-full bg-slate-900/50 border border-slate-700 text-white text-sm font-mono rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:border-moxgreen transition">
                <button type="button" @click="showSecret = !showSecret" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                  <i :class="showSecret ? 'ph ph-eye-slash' : 'ph ph-eye'" class="text-lg"></i>
                </button>
              </div>
            </div>
          </div>
          <p v-if="isEditMode" class="text-[10px] text-amber-500 mt-1 flex items-center gap-1"><i class="ph-fill ph-warning-circle"></i> Kosongkan Token Secret jika tidak ingin mengubah secret lama.</p>

          <div class="pt-4 border-t border-slate-800 flex justify-end gap-3 mt-6">
            <button type="button" @click="closeModal" class="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition">Batal</button>
            <button type="submit" class="px-5 py-2.5 bg-moxgreen text-moxdark rounded-lg text-sm font-bold hover:bg-emerald-400 transition" :disabled="isSaving">
              <i class="ph-bold ph-floppy-disk mr-1" v-if="!isSaving"></i>
              {{ isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- MODAL KONFIRMASI HAPUS                     -->
    <!-- ========================================== -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-[70] flex items-center justify-center bg-moxdark/90 backdrop-blur-sm p-4 animate-fade-in">
      <div class="bg-[#151e2b] border border-slate-700 shadow-2xl rounded-xl w-full max-w-md overflow-hidden transform transition-all relative">
        <div class="h-1.5 w-full bg-rose-500 absolute top-0 left-0"></div>
        <div class="p-6 pt-7">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mt-0.5">
              <i class="ph-fill ph-warning-circle text-2xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white mb-2">Hapus Server Proxmox?</h3>
              <p class="text-sm text-slate-400 leading-relaxed">
                Anda akan menghapus koneksi ke <span class="font-bold text-white">{{ nodeToDelete?.name }}</span>. 
                <br><br>
                Semua data metrik terkait server ini tidak akan dilacak lagi. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </div>
        </div>
        <div class="bg-slate-800/40 px-6 py-4 flex justify-end gap-3 border-t border-slate-700/80">
          <button @click="closeDeleteModal" class="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/80 transition">
            Batal
          </button>
          <button @click="executeDeleteNode" class="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-bold transition shadow-[0_4px_12px_rgba(244,63,94,0.3)] flex items-center gap-2" :disabled="isDeleting">
            <i class="ph-bold ph-trash" v-if="!isDeleting"></i>
            {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TOAST NOTIFICATION                         -->
    <!-- ========================================== -->
    <div v-if="toast.show" 
         class="fixed top-8 right-8 z-[100] w-[400px] bg-[#151e2b] border-t-4 rounded-b-xl rounded-t-sm shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-5 flex gap-4 animate-slide-in"
         :class="toast.type === 'success' ? 'border-emerald-400' : 'border-rose-500'">
      <div class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border" 
           :class="toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'">
        <i class="text-2xl" :class="toast.type === 'success' ? 'ph-fill ph-check-circle' : 'ph-fill ph-warning-circle'"></i>
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
import { ref, onMounted } from 'vue';

const proxmoxNodes = ref([]);
const isLoading = ref(true);

// State Accordion
const expandedNodeId = ref(null);
const isLoadingDetails = ref(false);
const nodeDetails = ref({ vms: [], lxcs: [], storages: [] });

// State Modal
const showModal = ref(false);
const isSaving = ref(false);
const isEditMode = ref(false);
const editNodeId = ref(null);
const showSecret = ref(false);

const form = ref({ name: '', hostUrl: '', tokenId: '', tokenSecret: '' });

// State Delete Modal
const showDeleteModal = ref(false);
const nodeToDelete = ref(null);
const isDeleting = ref(false);

const toast = ref({ show: false, type: 'success', title: '', message: '' });
let toastTimer = null;

const showToast = (type, title, message) => {
  toast.value = { show: true, type, title, message };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value.show = false; }, 5000);
};

// ==========================================
// API CALLS
// ==========================================
const fetchNodes = async () => {
  isLoading.value = true;
  try {
    const res = await fetch('/api/proxmox');
    const data = await res.json();
    if (data.success) {
      proxmoxNodes.value = data.data.map(node => ({ ...node, isTesting: false }));
    }
  } catch (error) {
    showToast('error', 'Gagal Memuat', 'Tidak dapat mengambil data server Proxmox.');
  } finally {
    isLoading.value = false;
  }
};

const saveNode = async () => {
  isSaving.value = true;
  try {
    const url = isEditMode.value ? `/api/proxmox/${editNodeId.value}` : '/api/proxmox';
    const method = isEditMode.value ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });
    const data = await res.json();

    if (data.success) {
      closeModal();
      fetchNodes();
      showToast('success', 'Berhasil', data.message);
    } else {
      showToast('error', 'Gagal', data.message);
    }
  } catch (error) {
    showToast('error', 'Kesalahan', 'Gagal menghubungi server.');
  } finally {
    isSaving.value = false;
  }
};

const executeDeleteNode = async () => {
  isDeleting.value = true;
  try {
    const res = await fetch(`/api/proxmox/${nodeToDelete.value.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      fetchNodes();
      if (expandedNodeId.value === nodeToDelete.value.id) expandedNodeId.value = null;
      showToast('success', 'Dihapus', data.message);
      closeDeleteModal();
    }
  } catch (error) {
    showToast('error', 'Kesalahan', 'Gagal menghapus server.');
  } finally {
    isDeleting.value = false;
  }
};

const testConnection = async (node) => {
  node.isTesting = true;
  if (expandedNodeId.value === node.id) isLoadingDetails.value = true;

  try {
    const res = await fetch(`/api/proxmox/${node.id}/test`, { method: 'POST' });
    const data = await res.json();
    
    if (data.success) {
      node.status = 'TERHUBUNG';
      node.latency = data.latency;
      node.pveVersion = data.pveVersion;
      showToast('success', 'Koneksi Berhasil', data.message);
      if (expandedNodeId.value === node.id) fetchNodeResources(node.id);
    } else {
      node.status = 'GAGAL';
      node.latency = '-';
      showToast('error', 'Koneksi Gagal', data.message);
      if (expandedNodeId.value === node.id) isLoadingDetails.value = false;
    }
  } catch (error) {
    showToast('error', 'Server Error', 'Sistem tidak dapat menguji koneksi.');
  } finally {
    node.isTesting = false;
  }
};

// ==========================================
// LAZY LOAD ACCORDION (VM, LXC, STORAGE)
// ==========================================
const toggleExpanded = (node) => {
  if (expandedNodeId.value === node.id) {
    expandedNodeId.value = null;
    nodeDetails.value = { vms: [], lxcs: [], storages: [] };
  } else {
    expandedNodeId.value = node.id;
    if (node.status === 'TERHUBUNG') fetchNodeResources(node.id);
  }
};

const fetchNodeResources = async (nodeId) => {
  isLoadingDetails.value = true;
  try {
    const res = await fetch(`/api/proxmox/${nodeId}/resources`);
    const data = await res.json();
    if (data.success) {
      nodeDetails.value = data.data;
    }
  } catch (error) {
    console.error('Fetch Resources Error:', error);
  } finally {
    isLoadingDetails.value = false;
  }
};

// ==========================================
// MODAL CONTROLS
// ==========================================
const openAddModal = () => {
  isEditMode.value = false;
  form.value = { name: '', hostUrl: '', tokenId: '', tokenSecret: '' };
  showSecret.value = false;
  showModal.value = true;
};

const editNode = (node) => {
  isEditMode.value = true;
  editNodeId.value = node.id;
  form.value = { name: node.name, hostUrl: node.hostUrl, tokenId: node.tokenId, tokenSecret: '' };
  showSecret.value = false;
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; };
const confirmDeleteNode = (node) => { nodeToDelete.value = node; showDeleteModal.value = true; };
const closeDeleteModal = () => { showDeleteModal.value = false; nodeToDelete.value = null; };

onMounted(() => {
  fetchNodes();
});
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

@keyframes slide-in {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
.animate-slide-in {
  animation: slide-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
</style>