import db from '../config/database.js';

// ==========================================
// 1. THRESHOLD NETWORK (ICMP/TCP)
// ==========================================

export const getNetworkThresholds = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM monitoring_targets WHERE is_alert_enabled = 1 ORDER BY id ASC');
        const formattedData = rows.map(row => ({
            id: row.id,
            name: row.name,
            type: row.protocol.includes('ICMP') ? 'ICMP' : 'TCP',
            host: row.ip_address,
            port: row.port,
            rtoTolerance: row.max_retries || 3,
            latency: { warning: row.latency_warning || 50, critical: row.latency_critical || 150 },
            alertSettings: {
                checkInterval: row.check_interval || 5,
                warning: { maxCount: row.notify_warning_max || 1, type: row.notify_warning_type || 'Pesan' },
                critical: { maxCount: row.notify_critical_max || 3, type: row.notify_critical_type || 'Pesan' },
                down: { maxCount: row.notify_down_max || 5, type: row.notify_down_type || 'Call' }
            }
        }));
        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Error getNetworkThresholds:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data threshold network' });
    }
};

export const getNetworkCatalog = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, protocol, ip_address, port FROM monitoring_targets WHERE is_alert_enabled = 0 ORDER BY name ASC');
        const catalog = rows.map(row => ({
            id: row.id,
            name: row.name,
            type: row.protocol.includes('ICMP') ? 'ICMP' : 'TCP',
            host: row.ip_address,
            port: row.port
        }));
        res.json({ success: true, data: catalog });
    } catch (error) {
        console.error("Error getNetworkCatalog:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil katalog target' });
    }
};

export const saveNetworkThresholds = async (req, res) => {
    const { targets } = req.body; 
    try {
        // a. Reset semua target menjadi tidak aktif (0) terlebih dahulu
        await db.query('UPDATE monitoring_targets SET is_alert_enabled = 0');
        
        // b. Jika ada data target yang dikirim, aktifkan (1) dan update nilainya
        if (targets && targets.length > 0) {
            for (const target of targets) {
                await db.query(`
                    UPDATE monitoring_targets 
                    SET is_alert_enabled = 1,
                        max_retries = ?, latency_warning = ?, latency_critical = ?,
                        check_interval = ?, notify_warning_max = ?, notify_warning_type = ?,
                        notify_critical_max = ?, notify_critical_type = ?, notify_down_max = ?, notify_down_type = ?
                    WHERE id = ?
                `, [
                    target.rtoTolerance, target.latency.warning, target.latency.critical,
                    target.alertSettings.checkInterval, 
                    target.alertSettings.warning.maxCount, target.alertSettings.warning.type,
                    target.alertSettings.critical.maxCount, target.alertSettings.critical.type,
                    target.alertSettings.down.maxCount, target.alertSettings.down.type,
                    target.id
                ]);
            }
        }
        res.json({ success: true, message: 'Konfigurasi Network berhasil disimpan' });
    } catch (error) {
        console.error("Error saveNetworkThresholds:", error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan konfigurasi' });
    }
};

// ==========================================
// 2. THRESHOLD PROXMOX (NODE/VM/LXC)
// ==========================================

export const getProxmoxThresholds = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM proxmox_targets ORDER BY id ASC');
        
        const formattedData = rows.map(row => ({
            id: row.id,
            vmid: row.vmid,
            name: row.name,
            type: row.type,
            node: row.node,
            cpu: { warning: row.cpu_warning, critical: row.cpu_critical },
            ram: { warning: row.ram_warning, critical: row.ram_critical },
            ioDelay: { warning: row.io_warning, critical: row.io_critical },
            alertSettings: {
                checkInterval: row.check_interval,
                warning: { maxCount: row.notify_warning_max, type: row.notify_warning_type },
                critical: { maxCount: row.notify_critical_max, type: row.notify_critical_type },
                down: { maxCount: row.notify_down_max, type: row.notify_down_type }
            }
        }));

        res.json({ success: true, data: formattedData });
    } catch (error) {
        console.error("Error getProxmoxThresholds:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data threshold proxmox' });
    }
};

export const saveProxmoxThresholds = async (req, res) => {
    const { targets } = req.body;
    try {
        for (const target of targets) {
            await db.query(`
                UPDATE proxmox_targets 
                SET cpu_warning = ?, cpu_critical = ?, ram_warning = ?, ram_critical = ?, io_warning = ?, io_critical = ?,
                    check_interval = ?, notify_warning_max = ?, notify_warning_type = ?,
                    notify_critical_max = ?, notify_critical_type = ?, notify_down_max = ?, notify_down_type = ?
                WHERE id = ?
            `, [
                target.cpu.warning, target.cpu.critical, 
                target.ram.warning, target.ram.critical, 
                target.ioDelay?.warning || 10, target.ioDelay?.critical || 20,
                target.alertSettings.checkInterval, 
                target.alertSettings.warning.maxCount, target.alertSettings.warning.type,
                target.alertSettings.critical.maxCount, target.alertSettings.critical.type,
                target.alertSettings.down.maxCount, target.alertSettings.down.type,
                target.id
            ]);
        }
        res.json({ success: true, message: 'Konfigurasi Proxmox berhasil disimpan' });
    } catch (error) {
        console.error("Error saveProxmoxThresholds:", error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan konfigurasi proxmox' });
    }
};