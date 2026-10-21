// Paksa seluruh proses Node.js memakai zona waktu Asia/Jakarta (WIB, UTC+7).
// Modul ini harus di-import paling awal agar new Date().getHours()/getDate()/dll sesuai WIB.
process.env.TZ = 'Asia/Jakarta';
export const APP_TIMEZONE = 'Asia/Jakarta';
export const DB_TZ_OFFSET = '+07:00';
