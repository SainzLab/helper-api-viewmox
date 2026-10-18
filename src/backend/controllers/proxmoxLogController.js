import axios from 'axios';
import https from 'https';
import db from '../config/database.js'; // Pastikan akhiran .js disertakan

// Helper: Membuat koneksi Axios ke API Proxmox
const getProxmoxClient = async () => {
    try {
        // PERBAIKAN: Sesuaikan nama tabel menjadi 'proxmox_nodes' 
        // dan hanya ambil node yang statusnya 'TERHUBUNG'
        const [rows] = await db.query("SELECT host_url, token_id, token_secret FROM proxmox_nodes WHERE status = 'TERHUBUNG' LIMIT 1");
        
        if (rows.length === 0) {
            throw new Error('Tidak ada server Proxmox dengan status TERHUBUNG di database.');
        }

        const server = rows[0];
        const baseURL = server.host_url.endsWith('/') ? server.host_url.slice(0, -1) : server.host_url;

        return axios.create({
            baseURL: baseURL,
            headers: {
                'Authorization': `PVEAPIToken=${server.token_id}=${server.token_secret}`
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });
    } catch (error) {
        console.error("Database Query Error di getProxmoxClient:", error.message);
        throw error;
    }
};

// 1. Mengambil Daftar Tasks Log
export const getTasksLog = async (req, res) => {
    try {
        const client = await getProxmoxClient();
        
        const response = await client.get('/api2/json/cluster/tasks'); 
        
        res.json({ 
            success: true, 
            data: response.data.data 
        });
    } catch (error) {
        console.error('Error getTasksLog:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal menarik daftar task dari Proxmox.',
            error: error.message 
        });
    }
};

// 2. Mengambil Daftar Cluster Log (Pesan Syslog/Daemon)
export const getClusterLog = async (req, res) => {
    try {
        const client = await getProxmoxClient();
        // Tarik 500 baris log cluster terakhir
        const response = await client.get('/api2/json/cluster/log?max=500'); 
        
        res.json({ 
            success: true, 
            data: response.data.data 
        });
    } catch (error) {
        console.error('Error getClusterLog:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal menarik cluster log dari Proxmox.',
            error: error.message 
        });
    }
};

// 3. Mengambil Detail Teks Terminal (Lazy Loading)
export const getTaskDetailLog = async (req, res) => {
    try {
        const { node, upid } = req.query;
        
        if (!node || !upid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Parameter node dan upid wajib disertakan.' 
            });
        }

        const client = await getProxmoxClient();
        
        // Panggil endpoint pembacaan log dari node spesifik
        const response = await client.get(`/api2/json/nodes/${node}/tasks/${upid}/log`);
        
        res.json({ 
            success: true, 
            data: response.data.data // Format asli PVE: [{n: 1, t: "baris text..."}, ...]
        });
    } catch (error) {
        console.error('Error getTaskDetailLog:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal menarik detail task log.',
            error: error.message 
        });
    }
};