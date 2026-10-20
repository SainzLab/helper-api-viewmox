import db from '../config/database.js';

// ==========================================
// FUNGSI HELPER: KALKULASI DURASI
// ==========================================
const formatDuration = (startTime, endTime) => {
    if (!startTime) return '-';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    
    const diffMs = end - start;
    if (diffMs <= 0) return '0d';

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    let result = [];
    if (hours > 0) result.push(`${hours}j`);
    if (mins > 0 || hours > 0) result.push(`${mins}m`);
    result.push(`${secs}d`);

    return result.join(' ');
};

// ==========================================
// 1. AMBIL SEMUA TIKET (DASHBOARD)
// ==========================================
export const getIncidents = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                a.id, a.target_type, a.target_name, a.severity, a.message, a.created_at, a.resolved_at, a.is_resolved,
                GROUP_CONCAT(h.user_name SEPARATOR ', ') AS technicians,
                MIN(h.joined_at) AS handled_at,
                COUNT(h.id) AS handler_count
            FROM active_alerts a
            LEFT JOIN alert_handlers h ON a.id = h.alert_id
            GROUP BY a.id
            ORDER BY a.is_resolved ASC, a.created_at DESC
        `);

        const formattedTickets = rows.map(row => {
            let status = 'Gangguan Aktif';
            if (row.is_resolved === 1) status = 'Selesai';
            else if (row.handler_count > 0) status = 'Dalam Penanganan';

            const year = new Date(row.created_at).getFullYear();
            const ticketId = `#INC-${year}-${String(row.id).padStart(4, '0')}`;

            return {
                id: ticketId,
                db_id: row.id,
                time: row.created_at,
                title: row.message,
                target: `${row.target_type} - ${row.target_name}`,
                status: status,
                severity: row.severity,
                technicians: row.technicians || null,
                is_resolved: row.is_resolved,
                downtime_duration: formatDuration(row.created_at, row.resolved_at),
                handling_duration: row.handled_at ? formatDuration(row.handled_at, row.resolved_at) : '-'
            };
        });

        res.json({ success: true, data: formattedTickets });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memuat rekap tiket' });
    }
};

// ==========================================
// 2. TEKNISI KONFIRMASI (JOIN TIKET)
// ==========================================
export const joinIncident = async (req, res) => {
    const { alert_id, user_id, user_name } = req.body;
    try {
        await db.query('INSERT IGNORE INTO alert_handlers (alert_id, user_id, user_name) VALUES (?, ?, ?)', [alert_id, user_id, user_name]);
        
        await db.query('INSERT INTO system_logs (level, source, message) VALUES (?, ?, ?)', 
            ['INFO', 'TICKET SYSTEM', `Teknisi ${user_name} mengkonfirmasi penanganan tiket #${alert_id}`]);
        
        res.json({ success: true, message: 'Berhasil bergabung dalam penanganan tiket' });
    } catch (error) {
        console.error("Error joinIncident:", error);
        res.status(500).json({ success: false, message: 'Gagal mengkonfirmasi tiket' });
    }
};

// ==========================================
// 3. TEKNISI TANDAI SELESAI (RESOLVE)
// ==========================================
export const resolveIncident = async (req, res) => {
    const { alert_id, user_name } = req.body;
    try {
        // Validasi Keamanan: Apakah daemon benar-benar sudah mendeteksi sistem hidup?
        const [alertData] = await db.query('SELECT severity FROM active_alerts WHERE id = ?', [alert_id]);
        
        if (alertData.length === 0) {
            return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan.' });
        }

        // Jika statusnya belum berubah jadi RECOVERED (Pulih), TOLAK PERMINTAAN!
        if (alertData[0].severity !== 'RECOVERED') {
            return res.status(400).json({ 
                success: false, 
                message: '❌ Gagal! Sistem masih mendeteksi adanya gangguan. Pastikan perbaikan fisik/jaringan telah selesai dan indikator sistem kembali normal sebelum menutup tiket.' 
            });
        }

        // Jika lolos (Sistem sudah RECOVERED), izinkan tiket ditutup
        await db.query('UPDATE active_alerts SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE id = ?', [alert_id]);
        
        await db.query('INSERT INTO system_logs (level, source, message) VALUES (?, ?, ?)', 
            ['INFO', 'TICKET SYSTEM', `Tiket #${alert_id} ditutup (Selesai) secara manual oleh teknisi ${user_name}`]);

        res.json({ success: true, message: 'Tiket berhasil ditandai selesai' });
    } catch (error) {
        console.error("Error resolveIncident:", error);
        res.status(500).json({ success: false, message: 'Gagal menyelesaikan tiket' });
    }
};

// ==========================================
// 4. API BARU: ANALITIK KINERJA SISTEM (Update Acuan Tanggal & Filter)
// ==========================================
export const getAnalytics = async (req, res) => {
    try {
        // Tambahkan pengambilan parameter severity dari query URL
        const { filter, severity } = req.query; 

        const [netTargets] = await db.query('SELECT COUNT(id) as count FROM monitoring_targets WHERE is_active = 1');
        const [pxTargets] = await db.query('SELECT COUNT(id) as count FROM proxmox_targets WHERE is_alert_enabled = 1');
        const totalDevices = (netTargets[0].count || 0) + (pxTargets[0].count || 0) || 1;

        // Cari tanggal mulai dari tabel active_alerts
        const [sysStart] = await db.query('SELECT MIN(created_at) as start_date FROM active_alerts');
        
        // Jika belum ada tiket sama sekali, jadikan hari ini sebagai titik nol
        const systemStartDate = sysStart[0].start_date ? new Date(sysStart[0].start_date) : new Date();
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const startYear = systemStartDate.getFullYear();
        const startMonth = systemStartDate.getMonth() + 1;
        const startDate = systemStartDate.getDate();

        let query = `
            SELECT 
                TIMESTAMPDIFF(SECOND, created_at, resolved_at) as downtime_seconds,
                MONTH(created_at) as month,
                DAY(created_at) as day
            FROM active_alerts 
            WHERE is_resolved = 1 
        `;

        // Terapkan Filter Khusus original_severity (misal: ?severity=DOWN)
        if (severity) {
            query += ` AND original_severity = '${severity}'`;
        }

        if (filter === 'year') {
            query += ` AND YEAR(created_at) = YEAR(CURRENT_DATE)`;
        } else {
            query += ` AND MONTH(created_at) = MONTH(CURRENT_DATE) AND YEAR(created_at) = YEAR(CURRENT_DATE)`;
        }

        const [alerts] = await db.query(query);

        // Format waktu dinamis (Menit/Jam)
        const formatWaktu = (totalSeconds) => {
            if (totalSeconds < 3600) return { val: Math.max(0, Math.floor(totalSeconds / 60)), unit: 'Menit' };
            return { val: (totalSeconds / 3600).toFixed(1), unit: 'Jam' };
        };

        const hitungMetrik = (dataTiket, daysOperational) => {
            const numFailures = dataTiket.length;
            const totalDowntimeSec = dataTiket.reduce((sum, t) => sum + t.downtime_seconds, 0);
            
            const totalTimeSec = totalDevices * daysOperational * 24 * 3600;
            const totalUptimeSec = Math.max(0, totalTimeSec - totalDowntimeSec);

            if (numFailures === 0) {
                // Memaksa nilai MTBF dan MTTF menjadi 0 jika tidak ada riwayat kerusakan
                return { 
                    mttr: 0, mtbf: 0, mttf: 0, availability: 100.00,
                    mttr_sec: 0, mtbf_sec: 0, mttf_sec: 0,
                    mttr_val: 0, mttr_unit: 'Menit', mtbf_val: 0, mtbf_unit: 'Jam', mttf_val: 0, mttf_unit: 'Jam'
                };
            }

            const mttrSec = totalDowntimeSec / numFailures; 
            const mtbfSec = totalUptimeSec / numFailures; 
            const availability = (mtbfSec / (mtbfSec + mttrSec)) * 100;

            const mttrFmt = formatWaktu(mttrSec);
            const mtbfFmt = formatWaktu(mtbfSec);

            return {
                mttr: (mttrSec / 3600).toFixed(2),
                mtbf: (mtbfSec / 3600).toFixed(2), 
                mttf: (mtbfSec / 3600).toFixed(2), 
                availability: availability.toFixed(2),
                // Detik utuh (tanpa pembulatan jam) agar frontend bisa menampilkan hingga hitungan detik
                mttr_sec: Math.round(mttrSec), 
                mtbf_sec: Math.round(mtbfSec), 
                mttf_sec: Math.round(mtbfSec),
                mttr_val: mttrFmt.val, mttr_unit: mttrFmt.unit, 
                mtbf_val: mtbfFmt.val, mtbf_unit: mtbfFmt.unit,
                mttf_val: mtbfFmt.val, mttf_unit: mtbfFmt.unit
            };
        };

        let chartData = [];
        let summary = {};
        const namaBulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

        if (filter === 'year') {
            const startM = (startYear === currentYear) ? startMonth : 1; 
            const daysInYearOperational = Math.max(1, Math.ceil((now - systemStartDate) / (1000 * 3600 * 24)));
            
            summary = hitungMetrik(alerts, daysInYearOperational);
            
            for (let m = startM; m <= currentMonth; m++) {
                const bulanan = alerts.filter(a => a.month === m);
                let daysInThisMonth = new Date(now.getFullYear(), m, 0).getDate();
                
                if (m === startMonth && startYear === currentYear) daysInThisMonth = daysInThisMonth - startDate + 1;
                if (m === currentMonth) daysInThisMonth = now.getDate() - (m === startMonth ? startDate - 1 : 0);
                
                chartData.push({ label: namaBulan[m-1], ...hitungMetrik(bulanan, Math.max(1, daysInThisMonth)) });
            }
        } else {
            let startD = 1;
            // Jika filter di bulan awal rilis, mulai grafik dari tanggal rilis (Misal: 19)
            if (currentMonth === startMonth && currentYear === startYear) {
                startD = startDate;
            }
            
            const currentDay = now.getDate();
            const daysOperationalMonth = Math.max(1, currentDay - startD + 1);

            summary = hitungMetrik(alerts, daysOperationalMonth);

            for (let d = startD; d <= currentDay; d++) {
                const harian = alerts.filter(a => a.day === d);
                chartData.push({ label: `Tgl ${d}`, ...hitungMetrik(harian, 1) });
            }
        }

        res.json({ success: true, summary, chartData });
    } catch (error) {
        console.error("Error Analytics:", error);
        res.status(500).json({ success: false, message: 'Gagal memuat grafik analitik' });
    }
};