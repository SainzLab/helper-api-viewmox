import db from '../config/database.js';
import ping from 'ping';
import net from 'net';

const failureCounts = new Map();

// Test ICMP Ping
const checkIcmp = async (ip) => {
  try {
    const res = await ping.promise.probe(ip, { timeout: 2 });
    // Pastikan jika sukses, kita bulatkan nilainya (misal 1.8 jadi 2) agar aman masuk ke database INT
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

export const startMonitoringDaemon = () => {
  console.log('[Daemon] Layanan Monitoring Aktif...');

  setInterval(async () => {
    try {
      const [targets] = await db.query('SELECT * FROM monitoring_targets WHERE is_active = 1');
      const now = new Date();

      for (const target of targets) {
        const lastCheck = target.last_check ? new Date(target.last_check) : new Date(0);
        const elapsedSeconds = (now - lastCheck) / 1000;

        // Jika waktunya dicek
        if (elapsedSeconds >= target.check_interval) {
          
          let result;
          if (target.protocol === 'ICMP PING') {
            result = await checkIcmp(target.ip_address);
          } else if (target.protocol === 'TCP SOCKET') {
            result = await checkTcp(target.ip_address, target.port);
          }

          let currentFails = failureCounts.get(target.id) || 0;
          let newStatus = target.status;

          if (result.isUp) {
            currentFails = 0;
            newStatus = 'UP';
          } else {
            currentFails++;
            if (currentFails >= target.max_retries) newStatus = 'DOWN';
          }

          failureCounts.set(target.id, currentFails);
          
          // String untuk tabel utama (bisa ada 'ms' atau 'TIMEOUT')
          const latencyStr = result.latency !== null ? `${result.latency} ms` : 'TIMEOUT';

          // 1. Update tabel utama
          await db.query(
            'UPDATE monitoring_targets SET status = ?, last_latency = ?, last_check = NOW() WHERE id = ?',
            [newStatus, latencyStr, target.id]
          );

          // 2. Insert ke tabel riwayat (target_history)
          await db.query(
            'INSERT INTO target_history (target_id, latency_ms, status) VALUES (?, ?, ?)',
            [target.id, result.latency, newStatus]
          );

          // 3. Hapus data lama agar tabel riwayat maksimal berisi 20 data per target
          await db.query(
            `DELETE FROM target_history WHERE target_id = ? AND id NOT IN (
              SELECT id FROM (SELECT id FROM target_history WHERE target_id = ? ORDER BY id DESC LIMIT 20) foo
            )`, [target.id, target.id]
          );
        }
      }
    } catch (error) {
      console.error('Daemon Error:', error);
    }
  }, 5000); // Daemon berjalan tiap 5 detik
};