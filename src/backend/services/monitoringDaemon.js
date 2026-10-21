import db from '../config/database.js';
import ping from 'ping';
import net from 'net';
import jwt from 'jsonwebtoken';

// Tracker bawaan untuk UP/DOWN standar (Dashboard)
const failureCounts = new Map();

// Tracker in-memory khusus untuk Sistem Notifikasi (Flutter)
const alertStateTracker = {};

// ==========================================
// FUNGSI HELPER
// ==========================================
const addDaemonLog = async (level, message) => {
    try {
        await db.query('INSERT INTO system_logs (level, source, message) VALUES (?, ?, ?)', [level, 'DAEMON', message]);
    } catch (err) {
        console.error('[DAEMON ERROR] Gagal menulis log ke database:', err);
    }
};

const checkIcmp = async (ip) => {
    try {
        const res = await ping.promise.probe(ip, { timeout: 2 });
        return { isUp: res.alive, latency: res.alive ? Math.round(res.time) : null };
    } catch (err) {
        return { isUp: false, latency: null };
    }
};

const checkTcp = (ip, port) => {
    return new Promise((resolve) => {
        const start = Date.now();
        const socket = new net.Socket();
        socket.setTimeout(2000);

        socket.on('connect', () => {
            const latency = Date.now() - start;
            socket.destroy();
            resolve({ isUp: true, latency: Math.round(latency) });
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve({ isUp: false, latency: null });
        });
        socket.on('error', () => {
            socket.destroy();
            resolve({ isUp: false, latency: null });
        });

        socket.connect(port, ip);
    });
};

// ==========================================
// MESIN NOTIFIKASI (STATE ENGINE) - UPDATE KE SYSTEM_LOGS
// ==========================================
const triggerAlert = async (target, moduleType, severity, actionType, maxCount, message) => {
    const stateKey = `${moduleType}_${target.id}`;
    if (!alertStateTracker[stateKey]) {
        alertStateTracker[stateKey] = { failCount: 0, isAlerting: false, currentSeverity: null };
    }
    const state = alertStateTracker[stateKey];

    if (state.currentSeverity !== severity) {
        state.failCount = 1;
        state.currentSeverity = severity;
    } else {
        state.failCount += 1;
    }

    if (state.failCount >= maxCount) {
        try {
            const [existing] = await db.query(
                'SELECT id, severity FROM active_alerts WHERE target_id = ? AND target_type = ? AND is_resolved = 0',
                [target.id, moduleType]
            );

            // Tentukan Level Log untuk Database
            const logLevel = severity === 'WARNING' ? 'WARNING' : 'ERROR';

            if (existing.length === 0) {
                // Eksekusi pembuatan tiket dan simpan status ASLI (original_severity)
                const [result] = await db.query(
                    `INSERT INTO active_alerts (target_id, target_type, target_name, severity, original_severity, action_type, message) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [target.id, moduleType, target.name, severity, severity, actionType, message]
                );
                
                const ticketId = `#INC-${new Date().getFullYear()}-${String(result.insertId).padStart(4, '0')}`;
                const logMsg = `Tiket ${ticketId} otomatis dibuat: [${moduleType}] ${target.name} berstatus ${severity} (${message})`;
                console.log(`🚨 [ALERT TRIGGERED] ${logMsg}`);
                
                await addDaemonLog(logLevel, logMsg); 

            } else if (existing[0].severity !== severity) {
                // Update eskalasi tiket dan timpa original_severity dengan tingkat bahaya yang baru
                await db.query(
                    `UPDATE active_alerts SET severity = ?, original_severity = ?, action_type = ?, message = ? WHERE id = ?`,
                    [severity, severity, actionType, message, existing[0].id]
                );
                
                const ticketId = `#INC-${new Date().getFullYear()}-${String(existing[0].id).padStart(4, '0')}`;
                const logMsg = `Eskalasi Tiket ${ticketId}: [${moduleType}] ${target.name} naik menjadi ${severity} (${message})`;
                console.log(`🚨 [ALERT ESCALATED] ${logMsg}`);
                
                await addDaemonLog(logLevel, logMsg); 
            }
            state.isAlerting = true;
        } catch (error) {
            console.error("[ALERT ERROR] Gagal menyimpan alert:", error);
        }
    }
};

const resolveAlert = async (target, moduleType) => {
    const stateKey = `${moduleType}_${target.id}`;
    try {
        const [existing] = await db.query(
            'SELECT id, severity FROM active_alerts WHERE target_id = ? AND target_type = ? AND is_resolved = 0',
            [target.id, moduleType]
        );

        if (existing.length > 0) {
            const alertId = existing[0].id;
            
            if (existing[0].severity === 'RECOVERED') {
                alertStateTracker[stateKey] = { failCount: 0, isAlerting: false, currentSeverity: null };
                return;
            }

            const [handlers] = await db.query('SELECT COUNT(id) as count FROM alert_handlers WHERE alert_id = ?', [alertId]);

            if (handlers[0].count > 0) {
                await db.query(`UPDATE active_alerts SET severity = 'RECOVERED' WHERE id = ?`, [alertId]);
                console.log(`[ALERT RECOVERED] [${moduleType}] ${target.name} pulih. Menunggu validasi Teknisi.`);
                await addDaemonLog('INFO', `Menunggu Validasi: [${moduleType}] ${target.name} telah pulih.`);
            } else {
                await db.query(`UPDATE active_alerts SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE id = ?`, [alertId]);
                console.log(`✅ [ALERT RESOLVED] [${moduleType}] ${target.name} kembali normal (Otomatis).`);
                await addDaemonLog('INFO', `Insiden Selesai Otomatis: [${moduleType}] ${target.name} kembali normal.`);
            }
        }
    } catch (error) {
        console.error("[ALERT ERROR] Gagal resolve alert:", error);
    }
    
    alertStateTracker[stateKey] = { failCount: 0, isAlerting: false, currentSeverity: null };
};

// ==========================================
// CACHE & HELPER PROXMOX API
// ==========================================
const pxCache = { nodes: { data: null, expires: 0 }, status: {}, resources: {} };
const CACHE_TTL = 8000;

const getLocalApi = async (path, cacheCategory, cacheKey = null) => {
    const now = Date.now();
    const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
    const url = baseUrl + path;

    if (cacheKey) {
        if (pxCache[cacheCategory][cacheKey] && now < pxCache[cacheCategory][cacheKey].expires) return pxCache[cacheCategory][cacheKey].data;
    } else {
        if (pxCache[cacheCategory].data && now < pxCache[cacheCategory].expires) return pxCache[cacheCategory].data;
    }

    const internalToken = jwt.sign({ id: 999, username: 'daemon-internal', role: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '1m' });

    try {
        const res = await fetch(url, { headers: { 'Cookie': `mox_token=${internalToken}` } });
        if (!res.ok) return null;
        
        const json = await res.json();
        if (json.success) {
            if (cacheKey) pxCache[cacheCategory][cacheKey] = { data: json.data, expires: now + CACHE_TTL };
            else pxCache[cacheCategory] = { data: json.data, expires: now + CACHE_TTL };
            return json.data;
        }
    } catch (e) {
        // Abaikan sementara jika gagal terhubung ke backend sendiri
    }
    return null;
};

const fetchLiveProxmoxMetrics = async (pt) => {
    const nodes = await getLocalApi('/api/proxmox', 'nodes');
    if (!nodes) return { isUp: false };

    for (const pve of nodes) {
        if (pve.status !== 'TERHUBUNG') continue;

        if (pt.type === 'NODE') {
            const statusData = await getLocalApi(`/api/proxmox/${pve.id}/status`, 'status', pve.id);
            if (statusData && Array.isArray(statusData)) {
                const nodeData = statusData.find(n => n.node_name === pt.node || n.node === pt.node);
                if (nodeData) {
                    const isNodeOffline = nodeData.status && nodeData.status.toLowerCase() === 'offline';
                    return {
                        isUp: !isNodeOffline,
                        cpu: Math.round(parseFloat(nodeData.cpu_usage || 0)),
                        ram: Math.round(parseFloat(nodeData.ram_percentage || 0)),
                        ioDelay: parseFloat(nodeData.io_delay || 0).toFixed(1)
                    };
                }
            }
        } else {
            const resData = await getLocalApi(`/api/proxmox/${pve.id}/resources`, 'resources', pve.id);
            if (resData) {
                const array = pt.type === 'VM' ? resData.vms : resData.lxcs;
                if (array && Array.isArray(array)) {
                    const machine = array.find(m => String(m.vmid) === String(pt.vmid) && (m.node === pt.node || !m.node));
                    if (machine) {
                        return {
                            isUp: machine.status ? ['running', 'online', 'up'].includes(machine.status.toLowerCase()) : true,
                            cpu: Math.round(parseFloat(machine.cpu_usage || 0)),
                            ram: Math.round(parseFloat(machine.ram_percentage || 0)),
                            ioDelay: null
                        };
                    }
                }
            }
        }
    }
    return { isUp: false };
};

// ==========================================
// FUNGSI UTAMA DAEMON
// ==========================================
let isDaemonRunning = false; // Mencegah overlapping execution (bug ping bertumpuk)

export const startMonitoringDaemon = async () => {
    const startupMsg = 'Layanan Monitoring (Daemon) berhasil diaktifkan.';
    console.log(`[INFO] ${startupMsg}`);
    await addDaemonLog('INFO', startupMsg);

    // ==========================================
    // AUTO-CLEANUP: Tukang Sapu Database Grafik
    // ==========================================
    setInterval(async () => {
        try {
            // Hapus data riwayat grafik yang umurnya sudah lebih dari 2 jam
            await db.query(`DELETE FROM target_history WHERE created_at < NOW() - INTERVAL 2 HOUR`);
            // Opsional: Aktifkan console.log di bawah jika Anda ingin melihat kapan ia menyapu
            // console.log('[INFO] Pembersihan rutin tabel target_history berhasil.');
        } catch (err) {
            console.error('[CLEANUP ERROR] Gagal membersihkan history:', err.message);
        }
    }, 1000 * 60 * 5); // Berjalan otomatis setiap 1 jam sekali


    // ==========================================
    // LOOP UTAMA MONITORING
    // ==========================================
    setInterval(async () => {
        // Jika daemon masih sibuk dengan loop sebelumnya, skip putaran detik ini
        if (isDaemonRunning) return; 
        isDaemonRunning = true; 

        try {
            // =======================================
            // BAGIAN 1: NETWORK (Bawaan)
            // =======================================
            const [targets] = await db.query(`SELECT *, TIMESTAMPDIFF(SECOND, IFNULL(last_check, '1970-01-01 00:00:00'), NOW()) AS elapsed_seconds FROM monitoring_targets WHERE is_active = 1`);

            for (const target of targets) {
                const interval = target.check_interval || 10;
                
                if (target.elapsed_seconds >= interval) {
                    let result;
                    if (target.protocol === 'ICMP PING') result = await checkIcmp(target.ip_address);
                    else if (target.protocol === 'TCP SOCKET') result = await checkTcp(target.ip_address, target.port);

                    if (target.is_alert_enabled === 1) {
                        if (!result.isUp) await triggerAlert(target, 'NETWORK', 'DOWN', target.notify_down_type || 'Call', target.notify_down_max || 5, `Koneksi Timeout / Terputus`);
                        else {
                            if (target.latency_critical && result.latency >= target.latency_critical) await triggerAlert(target, 'NETWORK', 'CRITICAL', target.notify_critical_type || 'Pesan', target.notify_critical_max || 3, `Latency Kritis: ${result.latency}ms`);
                            else if (target.latency_warning && result.latency >= target.latency_warning) await triggerAlert(target, 'NETWORK', 'WARNING', target.notify_warning_type || 'Pesan', target.notify_warning_max || 1, `Latency Tinggi: ${result.latency}ms`);
                            else await resolveAlert(target, 'NETWORK');
                        }
                    }

                    let currentFails = failureCounts.get(target.id) || 0;
                    let newStatus = target.status;
                    
                    if (result.isUp) {
                        if (target.status === 'DOWN') {
                            const recMsg = `Koneksi Pulih: ${target.name} kembali ONLINE.`;
                            console.log(`[INFO] ${recMsg}`);
                            await addDaemonLog('INFO', recMsg);
                        }
                        currentFails = 0;
                        newStatus = 'UP';
                    } else {
                        currentFails++;
                        const limitRTO = target.max_retries || 3;
                        if (currentFails >= limitRTO) {
                            newStatus = 'DOWN';
                            if (target.status !== 'DOWN') {
                                const errMsg = `Koneksi Terputus: ${target.name} OFFLINE.`;
                                console.log(`[ERROR] ${errMsg}`);
                                await addDaemonLog('ERROR', errMsg);
                            }
                        }
                    }
                    
                    failureCounts.set(target.id, currentFails);

                    // ==========================================
                    // UPDATE STATUS & REKAM HISTORY UPTIME
                    // ==========================================
                    if (target.status !== newStatus) {
                        // JIKA STATUS BERUBAH DARI UP MENJADI DOWN -> REKAM KE HISTORY!
                        if (target.status === 'UP' && newStatus === 'DOWN') {
                            // TAMBAHAN: HANYA REKAM JIKA FITUR ALERT/THRESHOLD DIAKTIFKAN
                            if (target.is_alert_enabled === 1) {
                                const upSince = target.last_status_change ? new Date(target.last_status_change) : new Date();
                                const downAt = new Date();
                                const uptimeSeconds = Math.max(0, Math.floor((downAt - upSince) / 1000));
                                const reason = result.latency !== null ? `Terputus (Last Ping: ${result.latency}ms)` : 'Koneksi Timeout / Terputus';

                                await db.query(
                                    `INSERT INTO down_history (target_id, target_type, target_name, up_since, down_at, uptime_duration_sec, down_reason) 
                                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                    [target.id, 'NETWORK', target.name, upSince, downAt, uptimeSeconds, reason]
                                ).catch(err => console.error("[HISTORY ERROR] Gagal menyimpan riwayat down:", err));
                            }
                        }

                        // Perbarui status terkini dan last_status_change di tabel target
                        await db.query(
                            'UPDATE monitoring_targets SET status = ?, last_latency = ?, last_check = NOW(), last_status_change = NOW() WHERE id = ?', 
                            [newStatus, (result.latency !== null ? `${result.latency} ms` : 'TIMEOUT'), target.id]
                        );
                    } else {
                        // Jika status tetap, perbarui waktu cek saja
                        await db.query(
                            'UPDATE monitoring_targets SET status = ?, last_latency = ?, last_check = NOW() WHERE id = ?', 
                            [newStatus, (result.latency !== null ? `${result.latency} ms` : 'TIMEOUT'), target.id]
                        );
                    }

                    try {
                        await db.query(
                            `INSERT INTO target_history (target_id, status, latency_ms) VALUES (?, ?, ?)`,
                            [target.id, newStatus, result.latency]
                        );
                    } catch (historyErr) {
                        console.error("[CHART ERROR] Gagal menyimpan data grafik:", historyErr.message);
                    }
                }
            }

            // =======================================
            // BAGIAN 2: PROXMOX THRESHOLDS
            // =======================================
            const [pxTargets] = await db.query(`SELECT *, TIMESTAMPDIFF(SECOND, IFNULL(last_check, '1970-01-01 00:00:00'), NOW()) AS elapsed_seconds FROM proxmox_targets WHERE is_alert_enabled = 1`);

            for (const pt of pxTargets) {
                const interval = pt.check_interval || 10;
                
                if (pt.elapsed_seconds >= interval) {
                    // Update waktu cek terakhir
                    await db.query('UPDATE proxmox_targets SET last_check = NOW() WHERE id = ?', [pt.id]);

                    const metrics = await fetchLiveProxmoxMetrics(pt);
                    const newStatus = metrics.isUp ? 'UP' : 'DOWN';
                    
                    // 1. Logika Alerting (Tiket)
                    if (!metrics.isUp) {
                        await triggerAlert(pt, 'PROXMOX', 'DOWN', pt.notify_down_type || 'Call', pt.notify_down_max || 5, `Mesin Offline atau tidak merespon`);
                    } else {
                        let highestSeverity = null;
                        let actionType = 'Pesan';
                        let maxCount = 1;
                        let msgs = [];

                        if (metrics.cpu >= pt.cpu_critical) {
                            highestSeverity = 'CRITICAL'; actionType = pt.notify_critical_type; maxCount = pt.notify_critical_max;
                            msgs.push(`CPU Kritis (${metrics.cpu}%)`);
                        } else if (metrics.cpu >= pt.cpu_warning && highestSeverity !== 'CRITICAL') {
                            highestSeverity = 'WARNING'; actionType = pt.notify_warning_type; maxCount = pt.notify_warning_max;
                            msgs.push(`CPU Tinggi (${metrics.cpu}%)`);
                        }

                        if (metrics.ram >= pt.ram_critical) {
                            if (highestSeverity !== 'CRITICAL') { highestSeverity = 'CRITICAL'; actionType = pt.notify_critical_type; maxCount = pt.notify_critical_max; }
                            msgs.push(`RAM Kritis (${metrics.ram}%)`);
                        } else if (metrics.ram >= pt.ram_warning && highestSeverity !== 'CRITICAL') {
                            if (!highestSeverity) { highestSeverity = 'WARNING'; actionType = pt.notify_warning_type; maxCount = pt.notify_warning_max; }
                            msgs.push(`RAM Tinggi (${metrics.ram}%)`);
                        }

                        if (pt.type === 'NODE' && metrics.ioDelay !== null) {
                            if (metrics.ioDelay >= pt.io_critical) {
                                if (highestSeverity !== 'CRITICAL') { highestSeverity = 'CRITICAL'; actionType = pt.notify_critical_type; maxCount = pt.notify_critical_max; }
                                msgs.push(`IO Kritis (${metrics.ioDelay}%)`);
                            } else if (metrics.ioDelay >= pt.io_warning && highestSeverity !== 'CRITICAL') {
                                if (!highestSeverity) { highestSeverity = 'WARNING'; actionType = pt.notify_warning_type; maxCount = pt.notify_warning_max; }
                                msgs.push(`IO Tinggi (${metrics.ioDelay}%)`);
                            }
                        }

                        if (highestSeverity) {
                            await triggerAlert(pt, 'PROXMOX', highestSeverity, actionType, maxCount, msgs.join(' | '));
                        } else {
                            await resolveAlert(pt, 'PROXMOX');
                        }
                    }

                    // ==========================================
                    // 2. Logika Perekaman History Uptime Proxmox
                    // ==========================================
                    if (pt.status !== newStatus) {
                        // JIKA MESIN TIBA-TIBA MATI, REKAM KE DOWN_HISTORY
                        if (pt.status === 'UP' && newStatus === 'DOWN') {
                            const upSince = pt.last_status_change ? new Date(pt.last_status_change) : new Date();
                            const downAt = new Date();
                            const uptimeSeconds = Math.max(0, Math.floor((downAt - upSince) / 1000));
                            
                            // Gunakan nama mesin, jika kosong gunakan node ID-nya
                            const targetName = pt.node + (pt.vmid ? ` (VMID: ${pt.vmid})` : ' (Node Utama)');

                            await db.query(
                                `INSERT INTO down_history (target_id, target_type, target_name, up_since, down_at, uptime_duration_sec, down_reason) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                [pt.id, 'PROXMOX', targetName, upSince, downAt, uptimeSeconds, 'Mesin Proxmox Offline / Tidak merespon API']
                            ).catch(err => console.error("[HISTORY ERROR] Gagal menyimpan riwayat down Proxmox:", err));
                        }

                        // Perbarui status dan reset stopwatch (last_status_change)
                        await db.query(
                            'UPDATE proxmox_targets SET status = ?, last_status_change = NOW() WHERE id = ?', 
                            [newStatus, pt.id]
                        );
                    }
                }
            }
        } catch (error) {
            console.error(`[ERROR] Daemon Master Loop Error: ${error.message}`);
        } finally {
            // Setelah semua pengecekan tuntas, buka kunci kembali
            isDaemonRunning = false; 
        }
    }, 1000);
};