import db from '../config/database.js';

// ==========================================
// FUNGSI HELPER: KALKULASI DURASI
// ==========================================
const formatDuration = (startTime, endTime) => {
    if (!startTime) return '-';
    
    const start = new Date(startTime);
    // Jika endTime tidak ada (belum selesai), hitung sampai detik ini (Live)
    const end = endTime ? new Date(endTime) : new Date();
    
    const diffMs = end - start;
    if (diffMs <= 0) return '< 1m';

    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) return `${hours}j ${mins}m`;
    return `${mins}m`;
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
                MIN(h.joined_at) AS handled_at, -- Waktu teknisi pertama kali bergabung
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
                
                // --- DATA KALKULASI WAKTU ---
                // Total waktu dari mesin mati sampai hidup kembali
                downtime_duration: formatDuration(row.created_at, row.resolved_at),
                // Total waktu pengerjaan (dari teknisi konfirmasi sampai selesai)
                handling_duration: row.handled_at ? formatDuration(row.handled_at, row.resolved_at) : '-'
            };
        });

        res.json({ success: true, data: formattedTickets });
    } catch (error) {
        console.error("Error getIncidents:", error);
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