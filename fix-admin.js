import db from './src/backend/config/database.js';
import bcrypt from 'bcrypt';

const resetAdminPassword = async () => {
  try {
    const plainPassword = 'admin123';
    
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    const [result] = await db.query(
      "UPDATE users SET password = ? WHERE username = 'admin'", 
      [hashedPassword]
    );

    if (result.affectedRows > 0) {
      console.log('SUKSES: Password "admin" berhasil direset menjadi "admin123" dengan hash yang valid!');
    } else {
      console.log('GAGAL: User "admin" tidak ditemukan di database.');
    }
  } catch (error) {
    console.error('Terjadi error:', error);
  } finally {
    process.exit();
  }
};

resetAdminPassword();