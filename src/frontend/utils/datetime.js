// Helper waktu frontend.
// Backend/database selalu UTC; semua tampilan dikonversi ke WIB (Asia/Jakarta).
export const APP_TIMEZONE = 'Asia/Jakarta';

// Parse nilai waktu dari API menjadi Date yang benar.
// - Date / ISO ber-zona ('...Z' atau '+hh:mm') -> dipakai apa adanya
// - String tanpa zona ('YYYY-MM-DD HH:mm:ss' / 'YYYY-MM-DDTHH:mm:ss') -> dianggap UTC
export const parseUtcDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  let s = String(value).trim().replace(' ', 'T');
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(s)) s += 'Z';
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

// '21 Okt 2026 17:00:05'
export const formatWibDateTime = (value, withSeconds = true) => {
  const d = parseUtcDate(value);
  if (!d) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: APP_TIMEZONE, day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', ...(withSeconds ? { second: '2-digit' } : {}), hour12: false
  }).format(d).replace(/\./g, ':');
};

// '17:00:05'
export const formatWibTime = (value) => {
  const d = parseUtcDate(value);
  if (!d) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(d);
};

// '21 Okt - 17:00'
export const formatWibShort = (value) => {
  const d = parseUtcDate(value);
  if (!d) return '-';
  return d.toLocaleDateString('id-ID', {
    timeZone: APP_TIMEZONE, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  }).replace(',', ' -').replace(/\./g, ':');
};

// 'YYYY-MM-DD' menurut WIB (untuk input type="date")
export const toWibDateInput = (value) => {
  const d = parseUtcDate(value);
  return d ? d.toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE }) : '';
};

// Token berlaku sampai akhir hari kedaluwarsa menurut WIB.
// token_expires_at dari API = 00:00 UTC tanggal tsb -> batas = +17 jam (= 00:00 WIB hari berikutnya).
export const isTokenExpired = (value) => {
  const d = parseUtcDate(value);
  if (!d) return false;
  return Date.now() >= d.getTime() + 17 * 60 * 60 * 1000;
};
