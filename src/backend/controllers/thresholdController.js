import db from '../config/database.js';

// ==========================================
// FUNGSI HELPER UNTUK LOGGING SISTEM
// ==========================================
const addSystemLog = async (level, source, message) => {
    try {
        await db.query('INSERT INTO system_logs (level, source, message) VALUES (?, ?, ?)', [level, source, message]);
    } catch (err) {
        console.error('Gagal menulis log konfigurasi:', err);
    }
};

// ==========================================
// 1. THRESHOLD NETWORK (ICMP/TCP)
// ==========================================

export const getNetworkThresholds = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM monitoring_targets WHERE is_alert_enabled = 1 ORDER BY id ASC');
        
        const formattedData = rows.map(row => ({
            id: row.id, name: row.name, type: row.protocol.includes('ICMP') ? 'ICMP' : 'TCP',
            host: row.ip_address, port: row.port, rtoTolerance: row.max_retries || 3,
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
            id: row.id, name: row.name, type: row.protocol.includes('ICMP') ? 'ICMP' : 'TCP', host: row.ip_address, port: row.port
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
        // Ambil data aktif sebelum direset untuk deteksi jejak (Audit Trail)
        const [oldActive] = await db.query('SELECT id, name FROM monitoring_targets WHERE is_alert_enabled = 1');
        const oldIds = oldActive.map(t => t.id);
        const newIds = targets ? targets.map(t => t.id) : [];

        // a. Reset semua target menjadi tidak aktif (0) terlebih dahulu
        await db.query('UPDATE monitoring_targets SET is_alert_enabled = 0');

        // b. Jika ada data target yang dikirim, aktifkan (1) dan update nilainya
        if (targets && targets.length > 0) {
            for (const target of targets) {
                await db.query(`
                    UPDATE monitoring_targets 
                    SET is_alert_enabled = 1, max_retries = ?, latency_warning = ?, latency_critical = ?, check_interval = ?, 
                        notify_warning_max = ?, notify_warning_type = ?, notify_critical_max = ?, notify_critical_type = ?, 
                        notify_down_max = ?, notify_down_type = ?
                    WHERE id = ?
                `, [
                    target.rtoTolerance, target.latency.warning, target.latency.critical, target.alertSettings.checkInterval, 
                    target.alertSettings.warning.maxCount, target.alertSettings.warning.type, target.alertSettings.critical.maxCount, 
                    target.alertSettings.critical.type, target.alertSettings.down.maxCount, target.alertSettings.down.type, target.id
                ]);

                // Perekaman Jejak: Tambah vs Edit
                if (oldIds.includes(target.id)) {
                    await addSystemLog('INFO', 'THRESHOLD NETWORK', `Konfigurasi diperbarui: ${target.name}`);
                } else {
                    await addSystemLog('INFO', 'THRESHOLD NETWORK', `Target ditambahkan ke Notifikasi: ${target.name}`);
                }
            }
        }

        // c. Perekaman Jejak: Hapus (Dinonaktifkan dari Notifikasi)
        const removedTargets = oldActive.filter(t => !newIds.includes(t.id));
        for (const target of removedTargets) {
            await addSystemLog('WARNING', 'THRESHOLD NETWORK', `Target dihapus dari Notifikasi: ${target.name}`);
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

export const getProxmoxCatalog = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, vmid, name, type, node FROM proxmox_targets WHERE is_alert_enabled = 0 ORDER BY name ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error getProxmoxCatalog:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil katalog proxmox' });
    }
};

export const getProxmoxThresholds = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM proxmox_targets WHERE is_alert_enabled = 1 ORDER BY id ASC');
        const formattedData = rows.map(row => ({
            id: row.id, vmid: row.vmid, name: row.name, type: row.type, node: row.node,
            cpu: { warning: row.cpu_warning || 75, critical: row.cpu_critical || 90 },
            ram: { warning: row.ram_warning || 80, critical: row.ram_critical || 95 },
            ioDelay: { warning: row.io_warning || 5, critical: row.io_critical || 15 },
            alertSettings: {
                checkInterval: row.check_interval || 10,
                warning: { maxCount: row.notify_warning_max || 1, type: row.notify_warning_type || 'Pesan' },
                critical: { maxCount: row.notify_critical_max || 3, type: row.notify_critical_type || 'Call' },
                down: { maxCount: row.notify_down_max || 5, type: row.notify_down_type || 'Call' }
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
        // 1. Reset semua target menjadi tidak aktif (0) sementara
        await db.query('UPDATE proxmox_targets SET is_alert_enabled = 0');

        // 2. Masukkan (INSERT) atau Perbarui (UPDATE) target yang masih aktif di UI
        if (targets && targets.length > 0) {
            for (const target of targets) {
                const [existing] = await db.query(
                    'SELECT id FROM proxmox_targets WHERE type = ? AND node = ? AND (vmid = ? OR name = ?)',
                    [target.type, target.node, target.vmid || null, target.name]
                );

                if (existing.length > 0) {
                    await db.query(`
                        UPDATE proxmox_targets 
                        SET is_alert_enabled = 1, cpu_warning = ?, cpu_critical = ?, ram_warning = ?, ram_critical = ?, 
                            io_warning = ?, io_critical = ?, check_interval = ?, notify_warning_max = ?, notify_warning_type = ?, 
                            notify_critical_max = ?, notify_critical_type = ?, notify_down_max = ?, notify_down_type = ?
                        WHERE id = ?
                    `, [
                        target.cpu.warning, target.cpu.critical, target.ram.warning, target.ram.critical, 
                        target.ioDelay?.warning || 10, target.ioDelay?.critical || 20, target.alertSettings.checkInterval, 
                        target.alertSettings.warning.maxCount, target.alertSettings.warning.type, target.alertSettings.critical.maxCount, 
                        target.alertSettings.critical.type, target.alertSettings.down.maxCount, target.alertSettings.down.type, existing[0].id
                    ]);
                    // Perekaman Jejak: Edit
                    await addSystemLog('INFO', 'THRESHOLD PROXMOX', `Konfigurasi diperbarui: ${target.name} (${target.type})`);
                } else {
                    await db.query(`
                        INSERT INTO proxmox_targets 
                        (vmid, name, type, node, is_alert_enabled, cpu_warning, cpu_critical, ram_warning, ram_critical, 
                        io_warning, io_critical, check_interval, notify_warning_max, notify_warning_type, notify_critical_max, 
                        notify_critical_type, notify_down_max, notify_down_type) 
                        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        target.vmid || null, target.name, target.type, target.node, target.cpu.warning, target.cpu.critical, 
                        target.ram.warning, target.ram.critical, target.ioDelay?.warning || 10, target.ioDelay?.critical || 20, 
                        target.alertSettings.checkInterval, target.alertSettings.warning.maxCount, target.alertSettings.warning.type, 
                        target.alertSettings.critical.maxCount, target.alertSettings.critical.type, target.alertSettings.down.maxCount, target.alertSettings.down.type
                    ]);
                    // Perekaman Jejak: Tambah
                    await addSystemLog('INFO', 'THRESHOLD PROXMOX', `Target ditambahkan ke Notifikasi: ${target.name} (${target.type})`);
                }
            }
        }

        // 3. Perekaman Jejak: Deteksi target yang dihapus dari UI
        const [deletedTargets] = await db.query('SELECT name, type FROM proxmox_targets WHERE is_alert_enabled = 0');
        for (const del of deletedTargets) {
            await addSystemLog('WARNING', 'THRESHOLD PROXMOX', `Target dihapus dari Notifikasi: ${del.name} (${del.type})`);
        }

        // 4. Hapus permanen data mesin yang sudah tidak terpakai/dihapus dari UI
        await db.query('DELETE FROM proxmox_targets WHERE is_alert_enabled = 0');

        res.json({ success: true, message: 'Konfigurasi Proxmox berhasil disimpan' });
    } catch (error) {
        console.error("Error saveProxmoxThresholds:", error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan konfigurasi proxmox' });
    }
};