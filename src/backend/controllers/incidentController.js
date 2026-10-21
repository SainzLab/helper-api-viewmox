import db from '../config/database.js';
import { WIB_OFFSET_MS, getWibYear } from '../config/timezone.js';

// ==========================================
// FUNGSI HELPER: FORMAT DETIK KE TEKS
// ==========================================
const formatSec = (totalSeconds) => {
    if (totalSeconds == null) return '-';
    if (totalSeconds <= 0) return '0d';
    
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);

    let result = [];
    if (d > 0) result.push(`${d} hari`);
    if (h > 0) result.push(`${h}j`);
    if (m > 0 || h > 0) result.push(`${m}m`);
    result.push(`${s}d`);

    return result.join(' ');
};

// ==========================================
// 1. AMBIL SEMUA TIKET (DASHBOARD)
// ==========================================
export const getIncidents = async (req, res) => {
    try {
        // PERBAIKAN: Hitung durasi detik langsung di dalam MySQL (TIMESTAMPDIFF).
        // Ini membasmi bug +7 Jam karena MySQL menghitungnya murni sebelum dikirim ke Javascript.
        const [rows] = await db.query(`
            SELECT 
                a.id, a.target_type, a.target_name, a.severity, a.message, 
                a.created_at, a.resolved_at, a.is_resolved,
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

            const year = getWibYear(row.created_at);
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
        const [alertData] = await db.query('SELECT severity FROM active_alerts WHERE id = ?', [alert_id]);
        
        if (alertData.length === 0) {
            return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan.' });
        }

        if (alertData[0].severity !== 'RECOVERED') {
            return res.status(400).json({ 
                success: false, 
                message: '❌ Gagal! Sistem masih mendeteksi adanya gangguan. Pastikan indikator sistem kembali normal sebelum menutup tiket.' 
            });
        }

        await db.query('UPDATE active_alerts SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE id = ?', [alert_id]);
        await db.query('INSERT INTO system_logs (level, source, message) VALUES (?, ?, ?)', 
            ['INFO', 'TICKET SYSTEM', `Tiket #${alert_id} ditutup secara manual oleh teknisi ${user_name}`]);

        res.json({ success: true, message: 'Tiket berhasil ditandai selesai' });
    } catch (error) {
        console.error("Error resolveIncident:", error);
        res.status(500).json({ success: false, message: 'Gagal menyelesaikan tiket' });
    }
};

// ==========================================
// 4. ANALITIK KINERJA SISTEM (MURNI ITIL SLA)
// ==========================================
const PERIODS = {
    '24h': { ms: 24 * 3600 * 1000, bucket: 'hour' },
    '7d':  { ms: 7 * 24 * 3600 * 1000, bucket: 'day' },
    '30d': { ms: 30 * 24 * 3600 * 1000, bucket: 'day' }
};

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const hitungMetrikITIL = (incidents, winStart, winEnd) => {
    // 1. Saring dan potong durasi insiden agar pas di dalam jendela pencarian
    const overlapped = incidents
        .map(i => ({ sec: Math.max(0, (Math.min(i.end, winEnd) - Math.max(i.start, winStart)) / 1000) }))
        .filter(i => i.sec > 0);

    // 2. Total Waktu Periode = Durasi jendela waktu (dalam detik)
    const totalPeriodSec = Math.max(1, Math.round((winEnd - winStart) / 1000));

    // 3. Total Downtime = Akumulasi seluruh durasi gangguan di periode ini
    const totalDowntimeSec = Math.min(totalPeriodSec, Math.round(overlapped.reduce((sum, i) => sum + i.sec, 0)));

    // 4. Total Uptime = Waktu Periode Bersih - Total Downtime
    const totalUptimeSec = totalPeriodSec - totalDowntimeSec;
    const incidentCount = overlapped.length;

    // 5. MTTR = Rata-rata waktu pemulihan (Total Downtime / Jumlah Insiden)
    const mttrSec = incidentCount > 0 ? Math.round(totalDowntimeSec / incidentCount) : 0;

    // 6. Availability = Persentase Uptime terhadap Total Waktu Periode
    const availability = (totalUptimeSec / totalPeriodSec) * 100;

    return {
        total_period_sec: totalPeriodSec,
        total_uptime_sec: totalUptimeSec,
        total_downtime_sec: totalDowntimeSec,
        incident_count: incidentCount,
        mttr_sec: mttrSec,
        availability: availability.toFixed(2)
    };
};

export const getAnalytics = async (req, res) => {
    try {
        const periodKey = PERIODS[req.query.period] ? req.query.period : '24h';
        const period = PERIODS[periodKey];

        const winEnd = Date.now();
        const winStart = winEnd - period.ms;

        // Mengambil riwayat uptime/downtime MURNI dari tabel mesin Daemon (bukan dari respon telat teknisi)
        const [rows] = await db.query(`
            SELECT up_since, down_at 
            FROM down_history 
            WHERE down_at > ? AND up_since < ?
        `, [new Date(winStart), new Date(winEnd)]);

        const incidents = rows.map(r => ({
            start: new Date(r.up_since).getTime(),
            end: new Date(r.down_at).getTime()
        }));

        const summary = {
            period: periodKey,
            ...hitungMetrikITIL(incidents, winStart, winEnd)
        };

        const chartData = [];
        // Batas jam/hari bucket mengikuti WIB (server berjalan UTC, WIB = UTC+7 tanpa DST)
        const stepMs = period.bucket === 'hour' ? 3600 * 1000 : 24 * 3600 * 1000;
        let cursorMs = Math.floor((winStart + WIB_OFFSET_MS) / stepMs) * stepMs - WIB_OFFSET_MS;

        while (cursorMs < winEnd) {
            const bs = Math.max(cursorMs, winStart);
            const nextMs = cursorMs + stepMs;
            const be = Math.min(nextMs, winEnd);

            // Geser +7 jam lalu baca komponen UTC = komponen waktu WIB
            const wib = new Date(cursorMs + WIB_OFFSET_MS);
            const label = period.bucket === 'hour'
                ? `${String(wib.getUTCHours()).padStart(2, '0')}:00`
                : `${wib.getUTCDate()} ${BULAN[wib.getUTCMonth()]}`;

            chartData.push({
                label,
                ...hitungMetrikITIL(incidents, bs, be)
            });
            cursorMs = nextMs;
        }

        res.json({ success: true, summary, chartData });
    } catch (error) {
        console.error("Error Analytics:", error);
        res.status(500).json({ success: false, message: 'Gagal memuat grafik analitik' });
    }
};