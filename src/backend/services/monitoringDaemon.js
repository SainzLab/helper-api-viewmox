import db from '../config/database.js';
import ping from 'ping';
import net from 'net';

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
// MESIN NOTIFIKASI (STATE ENGINE)
// ==========================================

const triggerAlert = async (target, moduleType, severity, actionType, maxCount, message) => {
    const stateKey = `${moduleType}_${target.id}`;

    if (!alertStateTracker[stateKey]) {
        alertStateTracker[stateKey] = { failCount: 0, isAlerting: false, currentSeverity: null };
    }

    const state = alertStateTracker[stateKey];
    
    // Reset hitungan jika level severity berubah (misal dari Warning naik ke Critical)
    if (state.currentSeverity !== severity) {
        state.failCount = 1;
        state.currentSeverity = severity;
    } else {
        state.failCount += 1;
    }

    // Jika jumlah kegagalan berturut-turut mencapai batas limit
    if (state.failCount >= maxCount) {
        try {
            const [existing] = await db.query(
                'SELECT id, severity FROM active_alerts WHERE target_id = ? AND target_type = ? AND is_resolved = 0',
                [target.id, moduleType]
            );

            if (existing.length === 0) {
                // Buat Notifikasi Baru
                await db.query(
                    `INSERT INTO active_alerts (target_id, target_type, target_name, severity, action_type, message) VALUES (?, ?, ?, ?, ?, ?)`,
                    [target.id, moduleType, target.name, severity, actionType, message]
                );
                console.log(`[ALERT TRIGGERED] ${target.name} - ${severity}`);
            } else if (existing[0].severity !== severity) {
                // Eskalasi Notifikasi (Update data lama)
                await db.query(
                    `UPDATE active_alerts SET severity = ?, action_type = ?, message = ? WHERE id = ?`,
                    [severity, actionType, message, existing[0].id]
                );
                console.log(`[ALERT ESCALATED] ${target.name} to ${severity}`);
            }
            state.isAlerting = true;
        } catch (error) {
            console.error("[ALERT ERROR] Gagal menyimpan alert:", error);
        }
    }
};

const resolveAlert = async (target, moduleType) => {
    const stateKey = `${moduleType}_${target.id}`;
    
    if (alertStateTracker[stateKey] && alertStateTracker[stateKey].isAlerting) {
        try {
            await db.query(
                `UPDATE active_alerts SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE target_id = ? AND target_type = ? AND is_resolved = 0`,
                [target.id, moduleType]
            );
            console.log(`[ALERT RESOLVED] ${target.name} kembali normal.`);
        } catch (error) {
            console.error("[ALERT ERROR] Gagal resolve alert:", error);
        }
    }

    // Reset Tracker
    alertStateTracker[stateKey] = { failCount: 0, isAlerting: false, currentSeverity: null };
};

// ==========================================
// FUNGSI UTAMA DAEMON
// ==========================================

export const startMonitoringDaemon = async () => {
    const startupMsg = 'Layanan Monitoring (Daemon) berhasil diaktifkan.';
    console.log(`[INFO] ${startupMsg}`);
    await addDaemonLog('INFO', startupMsg);

    setInterval(async () => {
        try {
            const [targets] = await db.query(`
                SELECT *, TIMESTAMPDIFF(SECOND, IFNULL(last_check, '1970-01-01 00:00:00'), NOW()) AS elapsed_seconds 
                FROM monitoring_targets 
                WHERE is_active = 1
            `);

            for (const target of targets) {
                // Gunakan check_interval dari tabel, pastikan tidak 0 untuk mencegah loop gila
                const interval = target.check_interval || 10; 

                if (target.elapsed_seconds >= interval) {
                    console.log(`[TRACE] Mengecek ${target.protocol} ke ${target.name} (${target.ip_address})...`);
                    
                    let result;
                    if (target.protocol === 'ICMP PING') {
                        result = await checkIcmp(target.ip_address);
                    } else if (target.protocol === 'TCP SOCKET') {
                        result = await checkTcp(target.ip_address, target.port);
                    }

                    // =======================================
                    // 1. EVALUASI NOTIFIKASI / THRESHOLD (Khusus yang diaktifkan)
                    // =======================================
                    if (target.is_alert_enabled === 1) {
                        if (!result.isUp) {
                            await triggerAlert(
                                target, 'NETWORK', 'DOWN', 
                                target.notify_down_type || 'Call', 
                                target.notify_down_max || 5, 
                                `Koneksi Timeout (RTO) / Port Tertutup`
                            );
                        } else {
                            if (target.latency_critical && result.latency >= target.latency_critical) {
                                await triggerAlert(
                                    target, 'NETWORK', 'CRITICAL', 
                                    target.notify_critical_type || 'Pesan', 
                                    target.notify_critical_max || 3, 
                                    `Latency Kritis: ${result.latency}ms`
                                );
                            } else if (target.latency_warning && result.latency >= target.latency_warning) {
                                await triggerAlert(
                                    target, 'NETWORK', 'WARNING', 
                                    target.notify_warning_type || 'Pesan', 
                                    target.notify_warning_max || 1, 
                                    `Latency Tinggi: ${result.latency}ms`
                                );
                            } else {
                                await resolveAlert(target, 'NETWORK');
                            }
                        }
                    }

                    // =======================================
                    // 2. LOGIKA STATUS DASHBOARD (Bawaan)
                    // =======================================
                    let currentFails = failureCounts.get(target.id) || 0;
                    let newStatus = target.status;

                    if (result.isUp) {
                        if (target.status === 'DOWN') {
                            const recMsg = `Koneksi Pulih: ${target.name} (${target.ip_address}) kembali ONLINE. Latency: ${result.latency}ms`;
                            console.log(`[INFO] ${recMsg}`);
                            await addDaemonLog('INFO', recMsg);
                        }
                        currentFails = 0;
                        newStatus = 'UP';
                    } else {
                        currentFails++;
                        const limitRTO = target.max_retries || 3;
                        
                        if (currentFails < limitRTO) {
                            const warnMsg = `RTO/Timeout: ${target.name} (${target.ip_address}). Percobaan gagal ke-${currentFails} dari ${limitRTO}.`;
                            console.log(`[WARNING] ${warnMsg}`);
                        } else if (currentFails >= limitRTO) {
                            newStatus = 'DOWN';
                            if (target.status !== 'DOWN') {
                                const errMsg = `Koneksi Terputus: ${target.name} (${target.ip_address}) dinyatakan OFFLINE setelah ${limitRTO} kali gagal.`;
                                console.log(`[ERROR] ${errMsg}`);
                                await addDaemonLog('ERROR', errMsg);
                            }
                        }
                    }
                    
                    failureCounts.set(target.id, currentFails);
                    const latencyStr = result.latency !== null ? `${result.latency} ms` : 'TIMEOUT';

                    // Update Status Dashboard Utama
                    await db.query(
                        'UPDATE monitoring_targets SET status = ?, last_latency = ?, last_check = NOW() WHERE id = ?',
                        [newStatus, latencyStr, target.id]
                    );

                    // Masukkan Riwayat Latency
                    await db.query(
                        'INSERT INTO target_history (target_id, latency_ms, status) VALUES (?, ?, ?)',
                        [target.id, result.latency, newStatus]
                    );

                    // Pembersihan Riwayat (Maksimal 20 baris per target)
                    await db.query(`
                        DELETE FROM target_history 
                        WHERE target_id = ? AND id NOT IN (
                            SELECT id FROM (SELECT id FROM target_history WHERE target_id = ? ORDER BY id DESC LIMIT 20) foo
                        )`, [target.id, target.id]
                    );
                }
            }
        } catch (error) {
            const sysErrMsg = `Daemon Master Loop Error: ${error.message}`;
            console.error(`[ERROR] ${sysErrMsg}`);
            await addDaemonLog('ERROR', sysErrMsg);
        }
    }, 1000);
};