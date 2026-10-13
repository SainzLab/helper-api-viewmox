import db from '../config/database.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// ==========================================
// 1. GET SEMUA USER
// ==========================================
export const getUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, username, role, is_active, token_expires_at FROM users ORDER BY created_at DESC');
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pengguna.' });
  }
};

// ==========================================
// 2. TAMBAH USER BARU
// ==========================================
export const createUser = async (req, res) => {
  const { name, email, username, password, role, token_expires_at } = req.body;

  try {
    // Cek apakah username sudah ada
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username sudah digunakan.' });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Logic Generate API Token khusus Teknisi & Kepala Bidang
    let apiToken = null;
    let expiresAt = null;

    if (role === 'Teknisi' || role === 'Kepala Bidang') {
      apiToken = crypto.randomBytes(32).toString('hex'); // Generate 64-karakter token acak
      expiresAt = token_expires_at || null; 
    }

    // Insert ke Database
    await db.query(
      `INSERT INTO users (name, email, username, password, role, api_token, token_expires_at, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, username, hashedPassword, role, apiToken, expiresAt, true]
    );

    res.status(201).json({ success: true, message: 'Pengguna berhasil ditambahkan.' });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan pengguna.' });
  }
};

// ==========================================
// 3. UPDATE USER (EDIT & RENEW TOKEN)
// ==========================================
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, username, password, role, token_expires_at } = req.body;

  try {
    // Cek username apakah sudah dipakai oleh user lain
    const [existing] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username sudah digunakan oleh akun lain.' });
    }

    // Ambil data user saat ini untuk mengecek token lama
    const [currentUser] = await db.query('SELECT api_token FROM users WHERE id = ?', [id]);
    if (currentUser.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    let apiToken = currentUser[0].api_token;
    let expiresAt = token_expires_at || null;

    // Jika role diubah menjadi Teknisi/Kepala Bidang tapi belum punya token, buatkan yang baru
    if ((role === 'Teknisi' || role === 'Kepala Bidang') && !apiToken) {
      apiToken = crypto.randomBytes(32).toString('hex');
    } else if (role === 'Admin') {
      // Jika diubah jadi Admin, hapus token mobile-nya
      apiToken = null;
      expiresAt = null;
    }

    let queryParams = [];
    let queryStr = '';

    // Jika password diisi, berarti admin ingin mereset password user tersebut
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      queryStr = 'UPDATE users SET name=?, email=?, username=?, password=?, role=?, api_token=?, token_expires_at=? WHERE id=?';
      queryParams = [name, email, username, hashedPassword, role, apiToken, expiresAt, id];
    } else {
      // Jika password kosong, pertahankan password lama
      queryStr = 'UPDATE users SET name=?, email=?, username=?, role=?, api_token=?, token_expires_at=? WHERE id=?';
      queryParams = [name, email, username, role, apiToken, expiresAt, id];
    }

    await db.query(queryStr, queryParams);
    res.status(200).json({ success: true, message: 'Data pengguna berhasil diperbarui.' });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui pengguna.' });
  }
};

// ==========================================
// 4. HAPUS USER (DELETE)
// ==========================================
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Pengguna berhasil dihapus.' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus pengguna.' });
  }
};

// ==========================================
// 5. LIHAT TOKEN API
// ==========================================
export const getToken = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT api_token FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    
    res.status(200).json({ success: true, token: rows[0].api_token });
  } catch (error) {
    console.error('Get Token Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil token.' });
  }
};

// ==========================================
// 6. RESET / GENERATE TOKEN BARU
// ==========================================
export const resetToken = async (req, res) => {
  const { id } = req.params;
  try {
    const newToken = crypto.randomBytes(32).toString('hex');
    await db.query('UPDATE users SET api_token = ? WHERE id = ?', [newToken, id]);
    
    res.status(200).json({ success: true, token: newToken, message: 'Token berhasil diperbarui.' });
  } catch (error) {
    console.error('Reset Token Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mereset token.' });
  }
};