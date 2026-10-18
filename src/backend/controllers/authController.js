import db from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// ==========================================
// HELPER: Fungsi untuk mencatat Log ke database
// ==========================================
const addSystemLog = async (level, source, message) => {
  try {
    await db.query('INSERT INTO system_logs (level, source, message) VALUES (?, ?, ?)', [level, source, message]);
  } catch (error) {
    console.error('Gagal menulis log:', error);
  }
};

// ==========================================
// 1. LOGIN
// ==========================================
export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Cari user di database
    const [rows] = await db.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    
    if (rows.length === 0) {
      await addSystemLog('WARNING', 'AUTENTIFIKASI', `Percobaan login gagal: Username '${username}' tidak ditemukan.`);
      return res.status(401).json({ success: false, message: 'Username tidak ditemukan.' });
    }

    const user = rows[0];

    // 2. Cek status aktif
    if (!user.is_active) {
      await addSystemLog('WARNING', 'AUTENTIFIKASI', `Percobaan login ditolak: Akun '${username}' sedang dinonaktifkan.`);
      return res.status(403).json({ success: false, message: 'Akun Anda dinonaktifkan.' });
    }

    // 3. Validasi Role (Hanya Admin)
    if (user.role !== 'Admin') {
      await addSystemLog('WARNING', 'AUTENTIFIKASI', `Percobaan login ditolak: Pengguna '${username}' bukan Admin.`);
      return res.status(403).json({ success: false, message: 'Akses ditolak! Hanya role Admin yang diizinkan masuk.' });
    }

    // 4. Validasi Password (Bcrypt)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await addSystemLog('WARNING', 'AUTENTIFIKASI', `Percobaan login gagal: Password salah untuk pengguna '${username}'.`);
      return res.status(401).json({ success: false, message: 'Password salah.' });
    }

    // 5. Generate JWT Token
    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

    // 6. Set token ke HTTP-Only Cookie (Aman dari serangan XSS)
    res.cookie('mox_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 12 * 60 * 60 * 1000 // 12 Jam
    });

    // CATAT LOG LOGIN BERHASIL
    await addSystemLog('INFO', 'AUTENTIFIKASI', `Login berhasil: Pengguna '${username}' masuk ke sistem.`);

    return res.status(200).json({ 
      success: true, 
      message: 'Login berhasil', 
      user: { name: user.name, username: user.username, role: user.role } 
    });

  } catch (error) {
    console.error('Login Error:', error);
    await addSystemLog('ERROR', 'AUTENTIFIKASI', `Terjadi kesalahan sistem saat percobaan login '${username}'.`);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

// ==========================================
// 2. LOGOUT
// ==========================================
export const logout = async (req, res) => {
  try {
    // Ambil username dari request (jika middleware token sudah mem-parsingnya)
    const username = req.user ? req.user.username : 'Seorang pengguna';

    // Hapus HTTP-Only Cookie
    res.clearCookie('mox_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // CATAT LOG LOGOUT BERHASIL
    await addSystemLog('INFO', 'AUTENTIFIKASI', `Logout berhasil: ${username} telah keluar dari sistem.`);

    return res.status(200).json({ success: true, message: 'Logout berhasil.' });
  } catch (error) {
    console.error('Logout Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal melakukan logout.' });
  }
};