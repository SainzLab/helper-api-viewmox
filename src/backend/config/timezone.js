// Aturan waktu aplikasi:
//  - Database & backend SELALU memakai UTC (semua DATETIME/TIMESTAMP disimpan sebagai UTC).
//  - Konversi ke WIB (Asia/Jakarta, UTC+7, tanpa DST) HANYA dilakukan saat ditampilkan di frontend
//    atau saat menentukan batas hari/jam laporan (lihat helper di bawah).
// Modul ini harus di-import paling awal agar seluruh Date di proses Node.js konsisten (UTC).
process.env.TZ = 'UTC';

export const APP_TIMEZONE = 'Asia/Jakarta';
export const DB_TZ_OFFSET = '+00:00';

// Offset WIB terhadap UTC (tetap, Indonesia tidak memakai DST)
export const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

// Tahun kalender menurut WIB (untuk nomor tiket #INC-YYYY-xxxx)
export const getWibYear = (date = new Date()) => {
  return new Date(new Date(date).getTime() + WIB_OFFSET_MS).getUTCFullYear();
};

// Batas kedaluwarsa token (eksklusif): token_expires_at berisi TANGGAL (YYYY-MM-DD),
// token berlaku sampai akhir hari tersebut menurut WIB (= tanggal berikutnya 00:00 WIB).
// Mengembalikan epoch ms, atau null jika tidak ada tanggal / tidak valid.
export const getTokenExpiryMs = (value) => {
  if (!value) return null;
  // mysql2 mengembalikan Date (00:00 UTC) untuk kolom DATE; string 'YYYY-MM-DD...' juga didukung
  const ymd = value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value).slice(0, 10);
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return null;
  // 00:00 WIB tanggal berikutnya, dalam epoch UTC
  return Date.UTC(y, m - 1, d + 1) - WIB_OFFSET_MS;
};
