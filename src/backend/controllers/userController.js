import db from '../config/database.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

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
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username sudah digunakan.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let apiToken = null;
    let expiresAt = null;

    if (role === 'Teknisi' || role === 'Kepala Bidang') {
      apiToken = crypto.randomBytes(32).toString('hex');
      expiresAt = token_expires_at || null; 
    }

    await db.query(
      `INSERT INTO users (name, email, username, password, role, api_token, token_expires_at, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, username, hashedPassword, role, apiToken, expiresAt, true]
    );

    // CATAT LOG
    await addSystemLog('INFO', 'KELOLA PENGGUNA', `Pengguna baru ditambahkan: ${name} (${role})`);

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
    const [existing] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username sudah digunakan oleh akun lain.' });
    }

    const [currentUser] = await db.query('SELECT api_token FROM users WHERE id = ?', [id]);
    if (currentUser.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    let apiToken = currentUser[0].api_token;
    let expiresAt = token_expires_at || null;

    if ((role === 'Teknisi' || role === 'Kepala Bidang') && !apiToken) {
      apiToken = crypto.randomBytes(32).toString('hex');
    } else if (role === 'Admin') {
      apiToken = null;
      expiresAt = null;
    }

    let queryParams = [];
    let queryStr = '';

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      queryStr = 'UPDATE users SET name=?, email=?, username=?, password=?, role=?, api_token=?, token_expires_at=? WHERE id=?';
      queryParams = [name, email, username, hashedPassword, role, apiToken, expiresAt, id];
    } else {
      queryStr = 'UPDATE users SET name=?, email=?, username=?, role=?, api_token=?, token_expires_at=? WHERE id=?';
      queryParams = [name, email, username, role, apiToken, expiresAt, id];
    }

    await db.query(queryStr, queryParams);

    // CATAT LOG
    await addSystemLog('INFO', 'KELOLA PENGGUNA', `Data pengguna diperbarui: ${name} (${username})`);

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
    // Ambil data nama sebelum dihapus untuk keperluan log
    const [rows] = await db.query('SELECT name, username FROM users WHERE id = ?', [id]);
    const userName = rows.length > 0 ? rows[0].name : `ID ${id}`;
    const userUsername = rows.length > 0 ? rows[0].username : '';

    await db.query('DELETE FROM users WHERE id = ?', [id]);

    // CATAT LOG
    await addSystemLog('WARNING', 'KELOLA PENGGUNA', `Pengguna dihapus dari sistem: ${userName} (${userUsername})`);

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
    // Ambil nama user untuk log
    const [rows] = await db.query('SELECT name FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    
    const userName = rows[0].name;
    const newToken = crypto.randomBytes(32).toString('hex');
    
    await db.query('UPDATE users SET api_token = ? WHERE id = ?', [newToken, id]);
    
    // CATAT LOG
    await addSystemLog('INFO', 'KELOLA PENGGUNA', `Token API direset/digenerate ulang untuk pengguna: ${userName}`);

    res.status(200).json({ success: true, token: newToken, message: 'Token berhasil diperbarui.' });
  } catch (error) {
    console.error('Reset Token Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mereset token.' });
  }
};