import db from '../config/database.js';
import ping from 'ping';
import net from 'net';

const failureCounts = new Map();

// Helper untuk mencatat log ke Database (system_logs)
const addDaemonLog = async (level, message) => {
  try {
    await db.query('INSERT INTO system_logs (level, source, message) VALUES (?, ?, ?)', [level, 'DAEMON', message]);
  } catch (err) {
    console.error('[DAEMON ERROR] Gagal menulis log ke database:', err);
  }
};

// Test ICMP Ping
const checkIcmp = async (ip) => {
  try {
    const res = await ping.promise.probe(ip, { timeout: 2 });
    return { isUp: res.alive, latency: res.alive ? Math.round(res.time) : null };
  } catch (err) {
    return { isUp: false, latency: null };
  }
};

// Test TCP Socket (Port)
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
    
    socket.on('timeout', () => { socket.destroy(); resolve({ isUp: false, latency: null }); });
    socket.on('error', () => { socket.destroy(); resolve({ isUp: false, latency: null }); });
    socket.connect(port, ip);
  });
};

// PASTIKAN ADA KATA 'export' DI SINI
export const startMonitoringDaemon = async () => {
  const startupMsg = 'Layanan Monitoring (Daemon) berhasil diaktifkan.';
  console.log(`[INFO] ${startupMsg}`);
  await addDaemonLog('INFO', startupMsg);

  setInterval(async () => {
    try {
      const [targets] = await db.query('SELECT * FROM monitoring_targets WHERE is_active = 1');
      const now = new Date();

      for (const target of targets) {
        const lastCheck = target.last_check ? new Date(target.last_check) : new Date(0);
        const elapsedSeconds = (now - lastCheck) / 1000;

        // Jika waktunya dicek
        if (elapsedSeconds >= target.check_interval) {
          
          // Log interaksi terkecil ke terminal (tidak ke DB agar performa terjaga)
          console.log(`[TRACE] Mengecek ${target.protocol} ke ${target.name} (${target.ip_address})...`);

          let result;
          if (target.protocol === 'ICMP PING') {
            result = await checkIcmp(target.ip_address);
          } else if (target.protocol === 'TCP SOCKET') {
            result = await checkTcp(target.ip_address, target.port);
          }

          let currentFails = failureCounts.get(target.id) || 0;
          let newStatus = target.status;

          // Evaluasi Hasil
          if (result.isUp) {
            // Jika sebelumnya DOWN dan sekarang UP (Recovery)
            if (target.status === 'DOWN') {
              const recMsg = `Koneksi Pulih: ${target.name} (${target.ip_address}) kembali ONLINE. Latency: ${result.latency}ms`;
              console.log(`[INFO] ${recMsg}`);
              await addDaemonLog('INFO', recMsg);
            }
            currentFails = 0;
            newStatus = 'UP';
          } else {
            currentFails++;
            
            // Jika belum melewati batas maksimal gagal (Fase Warning/Retry)
            if (currentFails < target.max_retries) {
              const warnMsg = `RTO/Timeout: ${target.name} (${target.ip_address}). Percobaan gagal ke-${currentFails} dari ${target.max_retries}.`;
              console.log(`[WARNING] ${warnMsg}`);
              await addDaemonLog('WARNING', warnMsg);
            } 
            // Jika sudah melewati batas maksimal gagal dan sebelumnya UP (Fase Down)
            else if (currentFails >= target.max_retries) {
              newStatus = 'DOWN';
              if (target.status !== 'DOWN') {
                const errMsg = `Koneksi Terputus: ${target.name} (${target.ip_address}) dinyatakan OFFLINE setelah ${target.max_retries} kali gagal.`;
                console.log(`[ERROR] ${errMsg}`);
                await addDaemonLog('ERROR', errMsg);
              }
            }
          }

          failureCounts.set(target.id, currentFails);
          
          const latencyStr = result.latency !== null ? `${result.latency} ms` : 'TIMEOUT';

          // 1. Update tabel utama
          await db.query(
            'UPDATE monitoring_targets SET status = ?, last_latency = ?, last_check = NOW() WHERE id = ?',
            [newStatus, latencyStr, target.id]
          );

          // 2. Insert ke tabel riwayat
          await db.query(
            'INSERT INTO target_history (target_id, latency_ms, status) VALUES (?, ?, ?)',
            [target.id, result.latency, newStatus]
          );

          // 3. Batasi riwayat 20 baris per target
          await db.query(
            `DELETE FROM target_history WHERE target_id = ? AND id NOT IN (
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
  }, 5000); 
};