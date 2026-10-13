import db from '../config/database.js';

// ==========================================
// 1. GET SEMUA TARGET
// ==========================================
export const getTargets = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM monitoring_targets ORDER BY created_at DESC');
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Get Targets Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data monitoring.' });
  }
};

// ==========================================
// 2. TAMBAH TARGET BARU
// ==========================================
export const createTarget = async (req, res) => {
  const { name, description, protocol, ip_address, port, check_interval, max_retries } = req.body;
  try {
    const targetPort = protocol === 'TCP SOCKET' ? port : null;
    
    await db.query(
      `INSERT INTO monitoring_targets (name, description, protocol, ip_address, port, check_interval, max_retries, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, protocol, ip_address, targetPort, check_interval || 60, max_retries || 3, true]
    );
    res.status(201).json({ success: true, message: 'Target monitoring berhasil ditambahkan.' });
  } catch (error) {
    console.error('Create Target Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan target monitoring.' });
  }
};

// ==========================================
// 3. UPDATE TARGET
// ==========================================
export const updateTarget = async (req, res) => {
  const { id } = req.params;
  const { name, description, protocol, ip_address, port, check_interval, max_retries } = req.body;
  try {
    const targetPort = protocol === 'TCP SOCKET' ? port : null;

    await db.query(
      `UPDATE monitoring_targets SET name=?, description=?, protocol=?, ip_address=?, port=?, check_interval=?, max_retries=? WHERE id=?`,
      [name, description, protocol, ip_address, targetPort, check_interval, max_retries, id]
    );
    res.status(200).json({ success: true, message: 'Data target berhasil diperbarui.' });
  } catch (error) {
    console.error('Update Target Error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui target.' });
  }
};

// ==========================================
// 4. HAPUS TARGET
// ==========================================
export const deleteTarget = async (req, res) => {
  const { id } = req.params;
  try {
    // Riwayat (target_history) akan otomatis terhapus karena ON DELETE CASCADE di database
    await db.query('DELETE FROM monitoring_targets WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Target berhasil dihapus.' });
  } catch (error) {
    console.error('Delete Target Error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus target.' });
  }
};

// ==========================================
// 5. TOGGLE PAUSE / START (is_active)
// ==========================================
export const toggleTargetStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  try {
    await db.query('UPDATE monitoring_targets SET is_active = ? WHERE id = ?', [is_active, id]);
    res.status(200).json({ success: true, message: is_active ? 'Monitoring Dilanjutkan' : 'Monitoring Dijeda' });
  } catch (error) {
    console.error('Toggle Target Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengubah status.' });
  }
};

// ==========================================
// 6. AMBIL RIWAYAT GRAFIK LATENCY
// ==========================================
export const getTargetHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT latency_ms, status, DATE_FORMAT(created_at, "%H:%i:%s") as time FROM target_history WHERE target_id = ? ORDER BY id ASC',
      [id]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat grafik.' });
  }
};

// ==========================================
// 7. AMBIL STATUS KONEKTIVITAS NODE GLOBAL
// ==========================================
export const getSystemStatus = async (req, res) => {
  try {
    // Ambil semua target untuk dianalisa status globalnya
    const [targets] = await db.query('SELECT protocol, status, is_active FROM monitoring_targets');

    // Analisa Status ICMP
    const icmpTargets = targets.filter(t => t.protocol === 'ICMP PING' && t.is_active === 1);
    let icmpStatus = 'DOWN';
    if (icmpTargets.length > 0) {
      // Jika ada minimal 1 yang UP, berarti fungsi Ping di server berjalan normal
      const isAnyUp = icmpTargets.some(t => t.status === 'UP');
      icmpStatus = isAnyUp ? 'ACTIVE' : 'DOWN';
    }

    // Analisa Status TCP
    const tcpTargets = targets.filter(t => t.protocol === 'TCP SOCKET' && t.is_active === 1);
    let tcpStatus = 'DOWN';
    if (tcpTargets.length > 0) {
      const isAnyUp = tcpTargets.some(t => t.status === 'UP');
      tcpStatus = isAnyUp ? 'ACTIVE' : 'DOWN';
    }

    res.status(200).json({
      success: true,
      data: {
        proxmox: 'DOWN', // Set DOWN karena belum diintegrasikan
        icmp: icmpStatus,
        tcp: tcpStatus
      }
    });
  } catch (error) {
    console.error('Get System Status Error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil status sistem' });
  }
};