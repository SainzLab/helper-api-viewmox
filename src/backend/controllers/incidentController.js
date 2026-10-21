import db from '../config/database.js';

// ==========================================
// FUNGSI HELPER: KALKULASI DURASI
// ==========================================
const formatSec = (totalSeconds) => {
    if (totalSeconds == null) return '-';
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    
    let parts = [];
    if (d > 0) parts.push(`${d} hari`);
    if (h > 0) parts.push(`${h}j`);
    if (m > 0 || h > 0) parts.push(`${m}m`);
    parts.push(`${s}d`);
    return parts.join(' ');
};

// ==========================================
// 1. AMBIL SEMUA TIKET (DASHBOARD)
// ==========================================
export const getIncidents = async (req, res) => {
    try {
        // PERBAIKAN: Hitung selisih detik (downtime & handling) murni dari mesin Database MySQL
        const [rows] = await db.query(`
            SELECT 
                a.id, a.target_type, a.target_name, a.severity, a.message, a.created_at, a.resolved_at, a.is_resolved,
                GROUP_CONCAT(h.user_name SEPARATOR ', ') AS technicians,
                MIN(h.joined_at) AS handled_at,
                COUNT(h.id) AS handler_count,
                TIMESTAMPDIFF(SECOND, a.created_at, IFNULL(a.resolved_at, CURRENT_TIMESTAMP)) AS downtime_sec,
                TIMESTAMPDIFF(SECOND, MIN(h.joined_at), IFNULL(a.resolved_at, CURRENT_TIMESTAMP)) AS handling_sec
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
                downtime_duration: formatSec(row.downtime_sec),
                handling_duration: row.handled_at ? formatSec(row.handling_sec) : '-'
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
// 4. ANALITIK KEANDALAN SISTEM (DOWN_HISTORY)
// ==========================================
// Jendela waktu tetap yang didukung
const PERIODS = {
    '24h': { ms: 24 * 3600 * 1000, bucket: 'hour' },
    '7d':  { ms: 7 * 24 * 3600 * 1000, bucket: 'day' },
    '30d': { ms: 30 * 24 * 3600 * 1000, bucket: 'day' }
};

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Fungsi Helper untuk perhitungan Analitik Matematika
const hitungMetrikITIL = (incidents, winStart, winEnd, totalDevices) => {
    
    // Hanya hitung bagian insiden yang benar-benar beririsan (terjadi) di dalam jendela waktu yang dipilih
    const overlapped = incidents
        .map(i => ({ sec: Math.max(0, (Math.min(i.end, winEnd) - Math.max(i.start, winStart)) / 1000) }))
        .filter(i => i.sec > 0);

    // Total Waktu Periode = Panjang jendela waktu x Jumlah semua alat yang dipantau (detik)
    const totalPeriodSec = Math.max(1, Math.round(((winEnd - winStart) / 1000) * totalDevices));

    // 1. Total Downtime = Akumulasi detik dari seluruh insiden terpotong
    const totalDowntimeSec = Math.min(totalPeriodSec, Math.round(overlapped.reduce((sum, i) => sum + i.sec, 0)));

    // 2. Total Uptime = Sisa waktu dari alat yang tidak pernah mati
    const totalUptimeSec = totalPeriodSec - totalDowntimeSec;
    const incidentCount = overlapped.length;

    // 3. MTTR (Mean Time To Recovery) = Total Downtime / Jumlah Insiden
    const mttrSec = incidentCount > 0 ? Math.round(totalDowntimeSec / incidentCount) : 0;

    // 4. Availability (%) = Persentase keandalan murni (Uptime / Total Waktu)
    const availability = ((totalPeriodSec - totalDowntimeSec) / totalPeriodSec) * 100;

    return {
        total_period_sec: totalPeriodSec,
        total_downtime_sec: totalDowntimeSec,
        total_uptime_sec: totalUptimeSec,
        incident_count: incidentCount,
        mttr_sec: mttrSec,
        availability: availability.toFixed(2) // Format %
    };
};

export const getAnalytics = async (req, res) => {
    try {
        const periodKey = PERIODS[req.query.period] ? req.query.period : '24h';
        const period = PERIODS[periodKey];

        // 1. Dapatkan Total Perangkat yang dipantau agar kalkulasi Uptime akurat
        const [netTargets] = await db.query('SELECT COUNT(id) as count FROM monitoring_targets WHERE is_active = 1');
        const [pxTargets] = await db.query('SELECT COUNT(id) as count FROM proxmox_targets WHERE is_alert_enabled = 1');
        const totalDevices = (netTargets[0].count || 0) + (pxTargets[0].count || 0) || 1;

        const winEnd = Date.now();
        const winStart = winEnd - period.ms;

        // 2. Ambil data MURNI dari riwayat downtime Daemon, BUKAN dari resolusi tiket teknisi
        const [rows] = await db.query(`
            SELECT up_since, down_at 
            FROM down_history 
            WHERE down_at > ? AND up_since < ?
        `, [new Date(winStart), new Date(winEnd)]);

        const incidents = rows.map(r => ({
            start: new Date(r.up_since).getTime(),
            end: new Date(r.down_at).getTime()
        }));

        // 3. Kalkulasi Summary Global
        const summary = {
            period: periodKey,
            ...hitungMetrikITIL(incidents, winStart, winEnd, totalDevices)
        };

        // 4. Kalkulasi Data Grafik per Bucket (Jam/Hari)
        const chartData = [];
        const cursor = new Date(winStart);
        if (period.bucket === 'hour') cursor.setMinutes(0, 0, 0);
        else cursor.setHours(0, 0, 0, 0);

        while (cursor.getTime() < winEnd) {
            const bs = Math.max(cursor.getTime(), winStart);
            const next = new Date(cursor);
            if (period.bucket === 'hour') next.setHours(next.getHours() + 1);
            else next.setDate(next.getDate() + 1);
            
            const be = Math.min(next.getTime(), winEnd);
            const label = period.bucket === 'hour' ? `${String(cursor.getHours()).padStart(2, '0')}:00` : `${cursor.getDate()} ${BULAN[cursor.getMonth()]}`;
            
            chartData.push({
                label,
                ...hitungMetrikITIL(incidents, bs, be, totalDevices)
            });
            cursor.setTime(next.getTime());
        }

        res.json({ success: true, summary, chartData });
    } catch (error) {
        console.error("Error Analytics:", error);
        res.status(500).json({ success: false, message: 'Gagal memuat grafik analitik dari history' });
    }
};