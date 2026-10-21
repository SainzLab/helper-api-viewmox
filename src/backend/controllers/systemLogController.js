import db from '../config/database.js';

// 1. API: Menarik log untuk ditampilkan di Frontend Vue
export const getSystemLogs = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id, 
                level, 
                source, 
                message, 
                DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') as timestamp 
            FROM system_logs 
            ORDER BY created_at DESC 
            LIMIT 500
        `);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching system logs:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil log sistem.' });
    }
};

// 2. Helper Internal: Gunakan fungsi ini jika Anda ingin mencatat log dari file 
export const logSystemEvent = async (level, source, message) => {
    try {
        await db.query(
            'INSERT INTO system_logs (level, source, message) VALUES (?, ?, ?)',
            [level, source, message]
        );
    } catch (error) {
        console.error("Gagal menyimpan log ke database:", error);
    }
};