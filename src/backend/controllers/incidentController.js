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
// 4. ANALITIK KEANDALAN SISTEM (ITIL TIME-WINDOW)
// ==========================================
// Jendela waktu tetap yang didukung (parameter ?period=)
const PERIODS = {
    '24h': { ms: 24 * 3600 * 1000, bucket: 'hour' },
    '7d':  { ms: 7 * 24 * 3600 * 1000, bucket: 'day' },
    '30d': { ms: 30 * 24 * 3600 * 1000, bucket: 'day' }
};
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Rumus ITIL untuk satu jendela waktu [winStart, winEnd] (epoch ms)
// incidents: [{ start: ms, end: ms }] (hanya tiket yang sudah resolved)
const hitungMetrikITIL = (incidents, winStart, winEnd, totalDevices) => {
    // Hanya hitung bagian insiden yang beririsan dengan jendela waktu
    const overlapped = incidents
        .map(i => ({ sec: Math.max(0, (Math.min(i.end, winEnd) - Math.max(i.start, winStart)) / 1000) }))
        .filter(i => i.sec > 0);

    // Total Waktu Periode (detik) = panjang jendela x jumlah perangkat yang dipantau
    const totalPeriodSec = Math.max(1, Math.round(((winEnd - winStart) / 1000) * totalDevices));
    // 1. Total Downtime = akumulasi (resolved_at - created_at)
    const totalDowntimeSec = Math.min(totalPeriodSec, Math.round(overlapped.reduce((sum, i) => sum + i.sec, 0)));
    // 2. Total Uptime = Total Waktu Periode - Total Downtime
    const totalUptimeSec = totalPeriodSec - totalDowntimeSec;
    const incidentCount = overlapped.length;
    // 3. MTTR = Total Downtime / Jumlah Insiden (0 jika tidak ada insiden, hindari division by zero)
    const mttrSec = incidentCount > 0 ? Math.round(totalDowntimeSec / incidentCount) : 0;
    // 4. Availability (%) = ((Total Waktu Periode - Total Downtime) / Total Waktu Periode) * 100
    const availability = ((totalPeriodSec - totalDowntimeSec) / totalPeriodSec) * 100;

    return {
        total_period_sec: totalPeriodSec,
        total_downtime_sec: totalDowntimeSec,
        total_uptime_sec: totalUptimeSec,
        incident_count: incidentCount,
        mttr_sec: mttrSec,
        availability: availability.toFixed(2)
    };
};

export const getAnalytics = async (req, res) => {
    try {
        const { severity } = req.query;
        // Filter lama (month/year) dipetakan ke 30 hari; default 24 jam
        const legacy = req.query.filter ? '30d' : '24h';
        const periodKey = PERIODS[req.query.period] ? req.query.period : legacy;
        const period = PERIODS[periodKey];

        const [netTargets] = await db.query('SELECT COUNT(id) as count FROM monitoring_targets WHERE is_active = 1');
        const [pxTargets] = await db.query('SELECT COUNT(id) as count FROM proxmox_targets WHERE is_alert_enabled = 1');
        const totalDevices = (netTargets[0].count || 0) + (pxTargets[0].count || 0) || 1;

        const winEnd = Date.now();
        const winStart = winEnd - period.ms;

        // Ambil tiket resolved yang beririsan dengan jendela waktu
        let query = `
            SELECT created_at, resolved_at
            FROM active_alerts
            WHERE is_resolved = 1 AND resolved_at IS NOT NULL
              AND resolved_at > ? AND created_at < ?
        `;
        const params = [new Date(winStart), new Date(winEnd)];
        if (severity) {
            query += ' AND original_severity = ?';
            params.push(severity);
        }
        const [rows] = await db.query(query, params);
        const incidents = rows.map(r => ({ start: new Date(r.created_at).getTime(), end: new Date(r.resolved_at).getTime() }));

        const summary = { period: periodKey, ...hitungMetrikITIL(incidents, winStart, winEnd, totalDevices) };

        // Bucket grafik: per jam (24 jam) atau per hari (7/30 hari), mengikuti kalender WIB
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

            const label = period.bucket === 'hour'
                ? `${String(cursor.getHours()).padStart(2, '0')}:00`
                : `${cursor.getDate()} ${BULAN[cursor.getMonth()]}`;

            chartData.push({ label, ...hitungMetrikITIL(incidents, bs, be, totalDevices) });
            cursor.setTime(next.getTime());
        }

        res.json({ success: true, summary, chartData });
    } catch (error) {
        console.error("Error Analytics:", error);
        res.status(500).json({ success: false, message: 'Gagal memuat grafik analitik' });
    }
};
