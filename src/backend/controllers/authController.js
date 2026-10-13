import db from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Cari user di database
    const [rows] = await db.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Username tidak ditemukan.' });
    }

    const user = rows[0];

    // 2. Cek status aktif
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Akun Anda dinonaktifkan.' });
    }

    // 3. Validasi Role (Hanya Admin)
    if (user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Akses ditolak! Hanya role Admin yang diizinkan masuk.' });
    }

    // 4. Validasi Password (Bcrypt)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
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

    return res.status(200).json({ 
      success: true, 
      message: 'Login berhasil', 
      user: { name: user.name, username: user.username, role: user.role } 
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};