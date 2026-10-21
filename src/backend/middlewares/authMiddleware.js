import db from '../config/database.js';
import { getTokenExpiryMs } from '../config/timezone.js';

export const verifyApiToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // Cek apakah header Authorization ada dan formatnya benar
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: 'Akses ditolak. Token otorisasi tidak ditemukan.' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Ambil data lengkap user (termasuk name), status aktif, dan batas waktu token
        const [users] = await db.query(
            'SELECT id, name, username, role, is_active, token_expires_at FROM users WHERE api_token = ?', 
            [token]
        );
        
        // 1. Cek apakah token ada di database
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token tidak valid atau tidak terdaftar.' 
            });
        }

        const user = users[0];

        // 2. Cek apakah akun sedang dinonaktifkan (Toggled Off)
        if (user.is_active === 0) {
            return res.status(403).json({ 
                success: false, 
                message: 'Akses ditolak. Akun Anda telah dinonaktifkan oleh Admin.' 
            });
        }

        // 3. Cek apakah masa berlaku token sudah habis (Kadaluarsa)
        if (user.token_expires_at) {
            // Token berlaku sampai akhir hari kedaluwarsa menurut WIB
            const expiresAtMs = getTokenExpiryMs(user.token_expires_at);

            if (expiresAtMs !== null && Date.now() >= expiresAtMs) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Sesi token Anda telah kadaluarsa. Silakan login kembali dari aplikasi.' 
                });
            }
        }

        // Jika semua lolos, simpan data user ke request
        req.user = user; 
        next(); 
    } catch (error) {
        console.error("Error verifyApiToken:", error);
        res.status(500).json({ success: false, message: 'Server error saat memverifikasi token.' });
    }
};

// Middleware Hybrid: Jika request menyertakan Bearer Token (misal dari aplikasi Mobile ke endpoint umum),
// validasi token tersebut dan isi req.user. Jika tidak ada header Bearer, lanjutkan (untuk Web).
export const attachMobileUserIfPresent = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return verifyApiToken(req, res, next);
    }
    next();
};
