import db from '../config/database.js';

// GET /api/mobile/v1/alerts/active
export const getActiveAlerts = async (req, res) => {
    try {
        // Hanya ambil notifikasi yang belum diselesaikan (is_resolved = 0)
        const [alerts] = await db.query(
            'SELECT * FROM active_alerts WHERE is_resolved = 0 ORDER BY created_at DESC'
        );
        
        res.json({
            success: true,
            total_active: alerts.length,
            data: alerts
        });
    } catch (error) {
        console.error("Error getActiveAlerts:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// GET /api/alerts/history
// Riwayat gangguan yang sudah selesai (is_resolved = 1), dipakai dashboard web
export const getAlertHistory = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 500);
        const [alerts] = await db.query(
            'SELECT * FROM active_alerts WHERE is_resolved = 1 ORDER BY resolved_at DESC, created_at DESC LIMIT ?',
            [limit]
        );

        res.json({
            success: true,
            total: alerts.length,
            data: alerts
        });
    } catch (error) {
        console.error("Error getAlertHistory:", error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
