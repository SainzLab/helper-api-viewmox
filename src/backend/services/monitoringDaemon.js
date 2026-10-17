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

// Fungsi Utama Daemon
export const startMonitoringDaemon = async () => {
  const startupMsg = 'Layanan Monitoring (Daemon) berhasil diaktifkan.';
  console.log(`[INFO] ${startupMsg}`);
  await addDaemonLog('INFO', startupMsg);

  setInterval(async () => {
    try {
      // PERBAIKAN: Menggunakan TIMESTAMPDIFF agar hitungan detik 100% akurat dari sisi Database
      const [targets] = await db.query(`
        SELECT *, TIMESTAMPDIFF(SECOND, IFNULL(last_check, '1970-01-01 00:00:00'), NOW()) AS elapsed_seconds 
        FROM monitoring_targets 
        WHERE is_active = 1
      `);

      for (const target of targets) {
        
        // Membandingkan waktu dari MySQL langsung, bukan dari Node.js Date()
        if (target.elapsed_seconds >= target.check_interval) {
          
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
            if (target.status === 'DOWN') {
              const recMsg = `Koneksi Pulih: ${target.name} (${target.ip_address}) kembali ONLINE. Latency: ${result.latency}ms`;
              console.log(`[INFO] ${recMsg}`);
              await addDaemonLog('INFO', recMsg);
            }
            currentFails = 0;
            newStatus = 'UP';
          } else {
            currentFails++;
            
            if (currentFails < target.max_retries) {
              const warnMsg = `RTO/Timeout: ${target.name} (${target.ip_address}). Percobaan gagal ke-${currentFails} dari ${target.max_retries}.`;
              console.log(`[WARNING] ${warnMsg}`);
              await addDaemonLog('WARNING', warnMsg);
            } 
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

          // Update Status
          await db.query(
            'UPDATE monitoring_targets SET status = ?, last_latency = ?, last_check = NOW() WHERE id = ?',
            [newStatus, latencyStr, target.id]
          );

          // Masukkan Riwayat Latency
          await db.query(
            'INSERT INTO target_history (target_id, latency_ms, status) VALUES (?, ?, ?)',
            [target.id, result.latency, newStatus]
          );

          // Batasi Data Riwayat maksimal 20 per target
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
  }, 1000); 
};