<template>
  <div class="animate-fade-in space-y-6">
    
    <!-- Header Khusus Proxmox -->
    <div class="flex justify-between items-end mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white mb-1 flex items-center gap-3">
          <i class="ph-bold ph-hard-drives text-emerald-400"></i> Proxmox Cluster Dashboard
        </h2>
        <p class="text-slate-400 text-sm">Pemantauan real-time resource Node, VM dan LXC.</p>
      </div>
      <div class="flex gap-4 items-center">
        <!-- TOGGLE MODE BUTTON -->
        <div class="flex bg-slate-900 border border-slate-700 p-1 rounded-lg shadow-inner">
          <button @click="$emit('change-view', 'icmp')" class="px-4 py-2 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-2 text-slate-400 hover:text-white">
            <i class="ph-bold ph-plugs"></i> ICMP / TCP
          </button>
          <button class="px-4 py-2 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-2 bg-emerald-500 text-moxdark shadow">
            <i class="ph-bold ph-hard-drives"></i> PROXMOX
          </button>
        </div>

        <router-link to="/proxmox-config" class="px-4 py-2.5 border border-slate-700 bg-slate-800/50 text-slate-300 rounded-lg flex items-center gap-2 hover:bg-slate-700 text-sm font-bold transition">
          <i class="ph-bold ph-gear"></i> Konfigurasi Node
        </router-link>
      </div>
    </div>

    <!-- PROXMOX DASHBOARD STATES -->
    <div v-if="isLoadingProxmox" class="flex flex-col items-center justify-center py-20">
      <i class="ph-bold ph-spinner animate-spin text-4xl text-emerald-500 mb-4"></i>
      <p class="text-slate-400">Menghubungkan ke API Cluster Proxmox...</p>
    </div>

    <div v-else-if="proxmoxNodesData.length === 0" class="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-xl">
      <i class="ph-duotone ph-hard-drives text-5xl text-slate-600 mb-3"></i>
      <h3 class="text-lg font-bold text-white">Tidak ada Node Proxmox terhubung.</h3>
      <p class="text-sm text-slate-400 mt-2">Silakan tambahkan server Proxmox terlebih dahulu di menu Konfigurasi.</p>
      <router-link to="/proxmox-config" class="inline-block mt-4 px-5 py-2.5 bg-emerald-500 text-moxdark font-bold text-sm rounded-lg hover:bg-emerald-400 transition">Ke Konfigurasi Node</router-link>
    </div>

    <!-- RENDER DATA CLUSTER -->
    <template v-else>
      <div v-for="cluster in proxmoxNodesData" :key="cluster.id" class="bg-moxcard border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        
        <!-- Header Cluster -->
        <div class="bg-slate-800/40 px-6 py-4 flex items-center justify-between border-b border-slate-700/50">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <i class="ph-fill ph-hard-drives text-2xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                {{ cluster.name }} 
                <span v-if="cluster.statusData && cluster.statusData.length > 0" class="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300 font-mono">
                  {{ cluster.statusData.length }} Nodes
                </span>
              </h3>
              <p class="text-xs text-slate-400 font-mono mt-0.5">{{ cluster.hostUrl }}</p>
            </div>
          </div>
          <div class="text-right flex flex-col items-end">
             <span v-if="cluster.status === 'TERHUBUNG'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
               <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> UP
             </span>
             <span v-else class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
               <span class="w-2 h-2 rounded-full bg-rose-500"></span> DOWN
             </span>
          </div>
        </div>

        <!-- Body Metrik (Looping Semua Physical Node) -->
        <div v-if="cluster.status === 'TERHUBUNG' && cluster.statusData && cluster.statusData.length > 0" class="p-6">
          <div v-for="physNode in cluster.statusData" :key="physNode.node_name" class="mb-10 border-b border-slate-700/50 pb-10 last:border-0 last:pb-8 last:mb-6">
            
            <!-- Judul Node Fisik -->
            <h4 class="text-sm font-bold text-white mb-5 flex items-center gap-2">
              <i class="ph-fill ph-server text-emerald-400 text-lg"></i> Node <span class="text-emerald-400">{{ physNode.node_name }}</span>
              <span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded ml-2 font-normal border border-slate-700">Uptime: {{ physNode.uptime }}</span>
            </h4>

            <!-- 4 Kolom Metrik Utama Host -->
            <div class="grid grid-cols-4 gap-6">
              <!-- CPU -->
              <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
                <div class="flex justify-between items-start mb-2">
                  <span class="text-xs font-bold text-slate-400 flex items-center gap-1.5"><i class="ph-fill ph-cpu text-blue-400 text-lg"></i> CPU Usage</span>
                  <span class="text-sm font-bold text-white">{{ physNode.cpu_usage }}</span>
                </div>
                <div class="w-full bg-slate-800 rounded-full h-1.5 mb-2 mt-3 overflow-hidden">
                  <div class="bg-blue-500 h-1.5 rounded-full transition-all duration-700 ease-in-out" :style="{ width: physNode.cpu_usage.replace(' ', '') }"></div>
                </div>
                <p class="text-[10px] text-slate-500 truncate" :title="physNode.cpu_model">{{ physNode.cpu_model }} ({{ physNode.cpu_cores }} Cores)</p>
              </div>

              <!-- RAM -->
              <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
                <div class="flex justify-between items-start mb-2">
                  <span class="text-xs font-bold text-slate-400 flex items-center gap-1.5"><i class="ph-fill ph-memory text-purple-400 text-lg"></i> Memory (RAM)</span>
                  <span class="text-sm font-bold text-white">{{ physNode.ram_percentage }}</span>
                </div>
                <div class="w-full bg-slate-800 rounded-full h-1.5 mb-2 mt-3 overflow-hidden">
                  <div class="bg-purple-500 h-1.5 rounded-full transition-all duration-700 ease-in-out" :style="{ width: physNode.ram_percentage.replace(' ', '') }"></div>
                </div>
                <p class="text-[10px] text-slate-500">{{ physNode.ram_used }} / {{ physNode.ram_total }}</p>
              </div>

              <!-- IO DELAY -->
              <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
                <div class="flex justify-between items-start mb-2">
                  <span class="text-xs font-bold text-slate-400 flex items-center gap-1.5"><i class="ph-fill ph-clock-counter-clockwise text-amber-400 text-lg"></i> IO Delay</span>
                  <span class="text-lg font-bold" :class="parseFloat(physNode.io_delay) > 5 ? 'text-rose-400' : 'text-amber-400'">{{ physNode.io_delay }}</span>
                </div>
                <p class="text-[10px] text-slate-500 mt-4">Load Average:</p>
                <p class="text-xs text-slate-300 font-mono">{{ physNode.load_average }}</p>
              </div>

              <!-- NETWORK -->
              <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
                <div class="flex items-center gap-1.5 mb-3">
                  <i class="ph-fill ph-arrows-down-up text-emerald-400 text-lg"></i> 
                  <span class="text-xs font-bold text-slate-400">Network Traffic</span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between items-center bg-slate-800/50 px-2 py-1.5 rounded">
                    <span class="text-[10px] text-slate-500 font-bold flex items-center gap-1"><i class="ph-bold ph-arrow-down text-emerald-400"></i> RX (In)</span>
                    <span class="text-xs text-white font-mono">{{ physNode.network_traffic.rx_in }}</span>
                  </div>
                  <div class="flex justify-between items-center bg-slate-800/50 px-2 py-1.5 rounded">
                    <span class="text-[10px] text-slate-500 font-bold flex items-center gap-1"><i class="ph-bold ph-arrow-up text-blue-400"></i> TX (Out)</span>
                    <span class="text-xs text-white font-mono">{{ physNode.network_traffic.tx_out }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div> <!-- Akhir Looping Node Fisik -->

          <!-- List VM, LXC & Storage Mendetail -->
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start" v-if="cluster.resourceData">
            
            <!-- Virtual Machines Detailed List (Kiri) -->
            <div class="border border-slate-700/30 rounded-xl overflow-hidden flex flex-col bg-slate-900/20 shadow-lg">
              <div class="bg-slate-800/40 px-5 py-4 border-b border-slate-700/30 flex justify-between items-center">
                <h4 class="text-sm font-bold text-slate-200 flex items-center gap-2"><i class="ph-fill ph-desktop text-blue-400 text-lg"></i> Virtual Machines (QEMU)</h4>
                <span class="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md font-bold border border-blue-500/20">{{ cluster.resourceData.vms.length }} Total</span>
              </div>
              <ul class="p-5 space-y-4">
                <li v-for="vm in cluster.resourceData.vms" :key="vm.vmid" 
                    @click="openProxmoxAdmin(cluster.hostUrl, 'qemu', vm.vmid)" 
                    class="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition flex flex-col gap-3 cursor-pointer group shadow-sm">
                  
                  <div class="flex justify-between items-center border-b border-slate-700/50 pb-3">
                    <div class="flex items-center gap-3">
                      <span class="w-2.5 h-2.5 rounded-full" :class="vm.status === 'running' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-slate-600'"></span>
                      <span class="font-bold text-white text-sm truncate max-w-[250px] group-hover:text-emerald-400 transition" :title="vm.name">{{ vm.name }}</span>
                    </div>
                    <span class="text-slate-400 font-mono text-xs bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50">
                      <span class="text-emerald-400">{{ vm.node }}</span> | ID: {{ vm.vmid }}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                    <div class="flex justify-between text-slate-400"><span>CPU:</span> <span class="text-slate-200 font-medium">{{ vm.cpu_usage }} ({{ vm.cpu_cores }}C)</span></div>
                    <div class="flex justify-between text-slate-400"><span>RAM:</span> <span class="text-slate-200 font-medium">{{ vm.ram_used }} / {{ vm.ram_total }}</span></div>
                    <div class="flex justify-between text-slate-400"><span>Disk:</span> <span class="text-slate-200 font-medium">{{ vm.disk_total }} <span class="text-[9px] text-slate-500 ml-1">(Alloc)</span></span></div>
                    <div class="flex justify-between text-slate-400"><span>Uptime:</span> <span class="text-slate-200 font-medium">{{ vm.uptime }}</span></div>
                    
                    <div class="col-span-2 flex justify-between text-slate-400 pt-3 mt-1 border-t border-slate-700/30">
                       <span class="flex items-center gap-1.5"><i class="ph-bold ph-arrow-down text-emerald-400"></i> RX: <span class="text-emerald-400 font-mono font-bold">{{ vm.net_in }}</span></span>
                       <span class="flex items-center gap-1.5"><i class="ph-bold ph-arrow-up text-blue-400"></i> TX: <span class="text-blue-400 font-mono font-bold">{{ vm.net_out }}</span></span>
                    </div>
                  </div>
                </li>
                <li v-if="cluster.resourceData.vms.length === 0" class="text-center text-slate-500 text-sm py-8 bg-slate-900/20 rounded-xl border border-dashed border-slate-700">Tidak ada VM ditemukan.</li>
              </ul>
            </div>

            <!-- LXC & Storage Gabungan (Kanan) -->
            <div class="flex flex-col gap-8">
              
              <!-- LXC Detailed List -->
              <div class="border border-slate-700/30 rounded-xl overflow-hidden flex flex-col bg-slate-900/20 shadow-lg">
                <div class="bg-slate-800/40 px-5 py-4 border-b border-slate-700/30 flex justify-between items-center">
                  <h4 class="text-sm font-bold text-slate-200 flex items-center gap-2"><i class="ph-fill ph-cube text-purple-400 text-lg"></i> LXC Containers</h4>
                  <span class="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-md font-bold border border-purple-500/20">{{ cluster.resourceData.lxcs.length }} Total</span>
                </div>
                <ul class="p-5 space-y-4">
                  <li v-for="lxc in cluster.resourceData.lxcs" :key="lxc.vmid" 
                      @click="openProxmoxAdmin(cluster.hostUrl, 'lxc', lxc.vmid)" 
                      class="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition flex flex-col gap-3 cursor-pointer group shadow-sm">
                    
                    <div class="flex justify-between items-center border-b border-slate-700/50 pb-3">
                      <div class="flex items-center gap-3">
                        <span class="w-2.5 h-2.5 rounded-full" :class="lxc.status === 'running' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-slate-600'"></span>
                        <span class="font-bold text-white text-sm truncate max-w-[250px] group-hover:text-emerald-400 transition" :title="lxc.name">{{ lxc.name }}</span>
                      </div>
                      <span class="text-slate-400 font-mono text-xs bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50">
                        <span class="text-emerald-400">{{ lxc.node }}</span> | ID: {{ lxc.vmid }}
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                      <div class="flex justify-between text-slate-400"><span>CPU:</span> <span class="text-slate-200 font-medium">{{ lxc.cpu_usage }} ({{ lxc.cpu_cores }}C)</span></div>
                      <div class="flex justify-between text-slate-400"><span>RAM:</span> <span class="text-slate-200 font-medium">{{ lxc.ram_used }} / {{ lxc.ram_total }}</span></div>
                      <div class="flex justify-between text-slate-400"><span>Disk:</span> <span class="text-slate-200 font-medium">{{ lxc.disk_used }} / {{ lxc.disk_total }}</span></div>
                      <div class="flex justify-between text-slate-400"><span>Uptime:</span> <span class="text-slate-200 font-medium">{{ lxc.uptime }}</span></div>
                      
                      <div class="col-span-2 flex justify-between text-slate-400 pt-3 mt-1 border-t border-slate-700/30">
                         <span class="flex items-center gap-1.5"><i class="ph-bold ph-arrow-down text-emerald-400"></i> RX: <span class="text-emerald-400 font-mono font-bold">{{ lxc.net_in }}</span></span>
                         <span class="flex items-center gap-1.5"><i class="ph-bold ph-arrow-up text-blue-400"></i> TX: <span class="text-blue-400 font-mono font-bold">{{ lxc.net_out }}</span></span>
                      </div>
                    </div>
                  </li>
                  <li v-if="cluster.resourceData.lxcs.length === 0" class="text-center text-slate-500 text-sm py-8 bg-slate-900/20 rounded-xl border border-dashed border-slate-700">Tidak ada LXC ditemukan.</li>
                </ul>
              </div>

              <!-- Storage -->
              <div class="border border-slate-700/30 rounded-xl overflow-hidden flex flex-col bg-slate-900/20 shadow-lg">
                <div class="bg-slate-800/40 px-5 py-4 border-b border-slate-700/30 flex justify-between items-center">
                  <h4 class="text-sm font-bold text-slate-200 flex items-center gap-2"><i class="ph-fill ph-hard-drive text-amber-400 text-lg"></i> Data Storage</h4>
                </div>
                <ul class="p-5 space-y-3">
                  <li v-for="storage in cluster.resourceData.storages" :key="storage.storage + storage.node" class="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition shadow-sm">
                    <div class="flex justify-between items-center mb-3 border-b border-slate-700/30 pb-2">
                      <span class="font-bold text-white text-sm flex items-center gap-2">
                        <i class="ph-fill ph-database text-amber-500"></i> {{ storage.storage }} 
                        <span class="text-[10px] text-slate-400 font-normal bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-700/50">Node: {{ storage.node }}</span>
                      </span> 
                      <span class="uppercase text-slate-300 text-[10px] font-bold bg-slate-700/50 border border-slate-600 px-2 py-1 rounded-md">{{ storage.type }}</span>
                    </div>
                    <div class="flex justify-between text-slate-400 text-xs">
                      <span>Terpakai: <span class="text-amber-400 font-bold ml-1">{{ storage.used }}</span></span> 
                      <span>Total: <span class="text-slate-200 font-bold">{{ storage.total }}</span></span>
                    </div>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>
        
        <!-- Jika Cluster Disconnect -->
        <div v-else-if="cluster.status !== 'TERHUBUNG'" class="p-6 text-center text-slate-500 text-sm">
          <p>API Node tidak merespon atau status koneksi terputus.</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

defineEmits(['change-view']);

const proxmoxNodesData = ref([]);
const isLoadingProxmox = ref(false);
let pollTimerProxmox = null;

const fetchProxmoxData = async (isBackground = false) => {
  if (!isBackground) isLoadingProxmox.value = true;
  try {
    const resNodes = await fetch('/api/proxmox');
    const nodesData = await resNodes.json();
    
    if (nodesData.success) {
      const nodes = nodesData.data;
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].status === 'TERHUBUNG') {
          try {
            const resStatus = await fetch(`/api/proxmox/${nodes[i].id}/status`);
            const statusJson = await resStatus.json();
            if (statusJson.success) nodes[i].statusData = statusJson.data;
          } catch (e) {}
          try {
            const resResources = await fetch(`/api/proxmox/${nodes[i].id}/resources`);
            const resJson = await resResources.json();
            if (resJson.success) nodes[i].resourceData = resJson.data;
          } catch (e) {}
        }
      }
      proxmoxNodesData.value = nodes;
    }
  } catch (error) { 
    console.error('Gagal memuat data Proxmox:', error); 
  } finally { 
    isLoadingProxmox.value = false; 
  }
};

onMounted(() => {
  fetchProxmoxData();
  pollTimerProxmox = setInterval(() => { fetchProxmoxData(true); }, 10000);
});

onUnmounted(() => {
  if (pollTimerProxmox) clearInterval(pollTimerProxmox);
});

// Fungsi Navigasi Tab Baru
const openProxmoxAdmin = (hostUrl, type, vmid) => {
  const baseUrl = hostUrl.endsWith('/') ? hostUrl.slice(0, -1) : hostUrl;
  const targetUrl = `${baseUrl}/#v1:0:=${type}/${vmid}`;
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
};
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { 
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; 
}
/* Menghilangkan scrollbar bawaan untuk area tertentu jika ada */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>