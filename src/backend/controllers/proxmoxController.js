import db from '../config/database.js';
import axios from 'axios';
import https from 'https';

// Helper fungsi untuk mencatat Log ke database
export const addSystemLog = async (level, source, message) => {
  try {
    await db.query('INSERT INTO system_logs (level, source, message) VALUES (?, ?, ?)', [level, source, message]);
  } catch (error) {
    console.error('Gagal menulis log:', error);
  }
};

// ==========================================
// HELPER: BUAT INSTANCE AXIOS UNTUK PROXMOX
// ==========================================
const createProxmoxApi = (hostUrl, tokenId, tokenSecret) => {
  return axios.create({
    baseURL: hostUrl,
    timeout: 10000, // Timeout 10 detik
    headers: {
      'Authorization': `PVEAPIToken=${tokenId}=${tokenSecret}`
    },
    // Wajib: Mengabaikan SSL/TLS Error karena Proxmox pakai Self-Signed Certificate
    httpsAgent: new https.Agent({ rejectUnauthorized: false }) 
  });
};

// ==========================================
// 1. Ambil Semua Node Proxmox
// ==========================================
export const getProxmoxNodes = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, host_url as hostUrl, token_id as tokenId, status, latency, pve_version as pveVersion FROM proxmox_nodes');
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memuat data Proxmox.' });
  }
};

// ==========================================
// 2. Tambah Node Proxmox
// ==========================================
export const createProxmoxNode = async (req, res) => {
  const { name, hostUrl, tokenId, tokenSecret } = req.body;
  try {
    await db.query(
      'INSERT INTO proxmox_nodes (name, host_url, token_id, token_secret) VALUES (?, ?, ?, ?)',
      [name, hostUrl, tokenId, tokenSecret]
    );
    await addSystemLog('INFO', 'PROXMOX API', `Server Proxmox baru ditambahkan: ${name}`);
    res.status(201).json({ success: true, message: 'Server Proxmox berhasil ditambahkan.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menyimpan server Proxmox.' });
  }
};

// ==========================================
// 3. Update Node Proxmox
// ==========================================
export const updateProxmoxNode = async (req, res) => {
  const { id } = req.params;
  const { name, hostUrl, tokenId, tokenSecret } = req.body;
  try {
    if (tokenSecret && tokenSecret.trim() !== '') {
      await db.query(
        'UPDATE proxmox_nodes SET name=?, host_url=?, token_id=?, token_secret=? WHERE id=?',
        [name, hostUrl, tokenId, tokenSecret, id]
      );
    } else {
      await db.query(
        'UPDATE proxmox_nodes SET name=?, host_url=?, token_id=? WHERE id=?',
        [name, hostUrl, tokenId, id]
      );
    }
    await addSystemLog('INFO', 'PROXMOX API', `Konfigurasi Proxmox diperbarui: ${name}`);
    res.status(200).json({ success: true, message: 'Konfigurasi berhasil diperbarui.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui konfigurasi.' });
  }
};

// ==========================================
// 4. Hapus Node Proxmox
// ==========================================
export const deleteProxmoxNode = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM proxmox_nodes WHERE id = ?', [id]);
    await addSystemLog('WARNING', 'PROXMOX API', `Server Proxmox dihapus dari sistem (ID: ${id})`);
    res.status(200).json({ success: true, message: 'Server Proxmox dihapus.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus server.' });
  }
};

// ==========================================
// 5. TEST KONEKSI KE API PROXMOX ASLI
// ==========================================
export const testProxmoxConnection = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM proxmox_nodes WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Server tidak ditemukan.' });

    const node = rows[0];
    const api = createProxmoxApi(node.host_url, node.token_id, node.token_secret);

    const startTime = Date.now();
    
    // Tembak Endpoint Cek Versi Proxmox
    const response = await api.get('/api2/json/version');
    
    const latencyMs = Date.now() - startTime;
    const version = response.data.data.version; // Contoh output: '8.1.3'

    await db.query('UPDATE proxmox_nodes SET status="TERHUBUNG", latency=?, pve_version=? WHERE id=?', [`${latencyMs} ms`, version, id]);
    await addSystemLog('INFO', 'PROXMOX API', `Uji Koneksi ${node.name} Sukses (v${version})`);
    
    res.status(200).json({ success: true, message: 'Koneksi berhasil.', latency: `${latencyMs} ms`, pveVersion: version });

  } catch (error) {
    const nodeName = error.config ? error.config.baseURL : `Node ID ${id}`;
    await db.query('UPDATE proxmox_nodes SET status="GAGAL", latency="-" WHERE id=?', [id]);
    await addSystemLog('ERROR', 'PROXMOX API', `Uji koneksi gagal ke ${nodeName}. Err: ${error.message}`);
    
    res.status(400).json({ success: false, message: 'Token ditolak atau Server Host tidak merespon.' });
  }
};

// ==========================================
// 6. TARIK DATA RESOURCES (VM, LXC, STORAGE) ASLI
// ==========================================
export const getProxmoxResources = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM proxmox_nodes WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Server tidak ditemukan.' });

    const node = rows[0];
    const api = createProxmoxApi(node.host_url, node.token_id, node.token_secret);

    // Tembak endpoint cluster/resources (menarik SEMUA data di server sekaligus)
    const response = await api.get('/api2/json/cluster/resources');
    const resources = response.data.data;

    // Filter dan ekstrak VM (QEMU)
    const vms = resources.filter(r => r.type === 'qemu').map(vm => ({
      vmid: vm.vmid,
      name: vm.name,
      status: vm.status // 'running' atau 'stopped'
    }));

    // Filter dan ekstrak LXC Container
    const lxcs = resources.filter(r => r.type === 'lxc').map(lxc => ({
      vmid: lxc.vmid,
      name: lxc.name,
      status: lxc.status
    }));

    // Helper: Mengubah Byte ke Format Mudah Dibaca (GB/TB)
    const formatBytes = (bytes) => {
      if (bytes === 0 || !bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Filter dan ekstrak Data Storage
    const storages = resources.filter(r => r.type === 'storage').map(st => ({
      storage: st.storage,
      type: st.plugintype,
      used: formatBytes(st.disk),
      total: formatBytes(st.maxdisk)
    }));

    res.status(200).json({ success: true, data: { vms, lxcs, storages } });

  } catch (error) {
    console.error('Proxmox API Error:', error.message);
    res.status(500).json({ success: false, message: 'Gagal menarik data resource asli dari server Proxmox.' });
  }
};

// Helper: Mengubah Byte ke Format Mudah Dibaca (Bisa ditaruh di luar fungsi agar bisa dipakai global di file ini)
const formatBytes = (bytes) => {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper: Mengubah Uptime (detik) ke format Hari Jam Menit
const formatUptime = (seconds) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor(seconds % (3600 * 24) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  return `${d}h ${h}j ${m}m`;
};

// ==========================================
// 7. TARIK STATISTIK MENDALAM (CPU, RAM, IO DELAY, TRAFFIC, LOAD)
// ==========================================
export const getProxmoxNodeStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM proxmox_nodes WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Server tidak ditemukan.' });

    const node = rows[0];
    const api = createProxmoxApi(node.host_url, node.token_id, node.token_secret);

    // Langkah 1: Kita harus mencari tahu nama Node fisik di dalam cluster tersebut
    const nodesRes = await api.get('/api2/json/nodes');
    if (!nodesRes.data.data || nodesRes.data.data.length === 0) {
       return res.status(404).json({ success: false, message: 'Node fisik tidak ditemukan.' });
    }
    
    // Asumsi kita mengambil node pertama di cluster tersebut
    const physicalNodeName = nodesRes.data.data[0].node; 

    // Langkah 2: Tembak endpoint status khusus untuk node fisik tersebut
    const statusRes = await api.get(`/api2/json/nodes/${physicalNodeName}/status`);
    const stats = statusRes.data.data;

    // Langkah 3: Ekstrak dan format data yang Anda butuhkan
    const result = {
      node_name: physicalNodeName,
      cpu_usage: (stats.cpu * 100).toFixed(1) + ' %',
      cpu_cores: stats.cpuinfo.cpus,
      cpu_model: stats.cpuinfo.model,
      ram_used: formatBytes(stats.memory.used),
      ram_total: formatBytes(stats.memory.total),
      ram_percentage: ((stats.memory.used / stats.memory.total) * 100).toFixed(1) + ' %',
      io_delay: (stats.wait * 100).toFixed(2) + ' %',
      load_average: stats.loadavg.join(', '), // Output: "0.15, 0.20, 0.18"
      uptime: formatUptime(stats.uptime),
      network_traffic: {
        rx_in: formatBytes(stats.netin),   // Total Download / Masuk
        tx_out: formatBytes(stats.netout)  // Total Upload / Keluar
      }
    };

    res.status(200).json({ success: true, data: result });

  } catch (error) {
    console.error('Proxmox Status Error:', error.message);
    res.status(500).json({ success: false, message: 'Gagal menarik statistik mendalam dari server Proxmox.' });
  }
};