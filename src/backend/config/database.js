import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { DB_TZ_OFFSET } from './timezone.js';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: DB_TZ_OFFSET // konversi Date <-> DATETIME memakai UTC
});

// Pastikan NOW()/CURRENT_TIMESTAMP/CURRENT_DATE/DATE_FORMAT di MySQL memakai UTC
pool.pool.on('connection', (conn) => {
  conn.query(`SET time_zone = '${DB_TZ_OFFSET}'`);
});

export default pool;
