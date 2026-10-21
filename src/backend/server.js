import './config/timezone.js';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { login, logout, mobileLogin } from './controllers/authController.js';
import { getUsers, createUser, updateUser, deleteUser, getToken, resetToken, toggleUserStatus } from './controllers/userController.js';
import { getTargets, createTarget, updateTarget, deleteTarget, toggleTargetStatus, getTargetHistory, getSystemStatus } from './controllers/targetController.js';
import { startMonitoringDaemon } from './services/monitoringDaemon.js';
import { getProxmoxNodes, createProxmoxNode, updateProxmoxNode, deleteProxmoxNode, testProxmoxConnection, getProxmoxResources, getProxmoxNodeStatus } from './controllers/proxmoxController.js';
import { getSystemLogs } from './controllers/systemLogController.js';
import { getNetworkThresholds, saveNetworkThresholds, getProxmoxThresholds, saveProxmoxThresholds, getNetworkCatalog, getProxmoxCatalog } from './controllers/thresholdController.js';
import { getActiveAlerts, getAlertHistory } from './controllers/mobileAlertController.js';
import { getTasksLog, getClusterLog, getTaskDetailLog } from './controllers/proxmoxLogController.js';
import { verifyApiToken, attachMobileUserIfPresent } from './middlewares/authMiddleware.js';
import { getIncidents, joinIncident, resolveIncident, getAnalytics } from './controllers/incidentController.js';
import { getCleanupSettings, saveCleanupSettings, runManualCleanup } from './controllers/cleanupController.js';
import { getDashboardSummary } from './controllers/dashboardController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Helper pembaca manifest hasil build Vite untuk mode Production / Staging
const resolveViteManifestAssets = () => {
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'dist', '.vite', 'manifest.json');
    if (!fs.existsSync(manifestPath)) return null;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const entry = manifest['src/frontend/main.js'];
    if (!entry) return null;
    return {
      js: entry.file || null,
      css: Array.isArray(entry.css) ? entry.css : []
    };
  } catch (err) {
    console.error('[MANIFEST ERROR] Gagal membaca manifest Vite:', err.message);
    return null;
  }
};

// Middleware CORS, Parsing & Cookie
app.use(cors({ origin: true, credentials: true }));
app.use(express.json()); 
app.use(cookieParser());

// Konfigurasi EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files (mendukung /dist/assets/... dan fallback /assets/... untuk dynamic chunk Vite)
app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/assets', express.static(path.join(process.cwd(), 'public', 'dist', 'assets')));

// Route Auth (Web)
app.post('/api/auth/login', login);
app.post('/api/auth/logout', logout);

// Route Users
app.get('/api/users', getUsers);
app.post('/api/users', createUser);
app.put('/api/users/:id', updateUser);
app.delete('/api/users/:id', deleteUser);
app.get('/api/users/:id/token', getToken);          
app.post('/api/users/:id/token/reset', resetToken);
app.put('/api/users/:id/toggle-status', toggleUserStatus);

// Route Target Monitoring
app.get('/api/targets', getTargets);
app.post('/api/targets', createTarget);
app.put('/api/targets/:id', updateTarget);
app.delete('/api/targets/:id', deleteTarget);
app.put('/api/targets/:id/toggle', toggleTargetStatus);
app.get('/api/targets/:id/history', getTargetHistory);

// Route Status Konektivitas Node & Ringkasan Dashboard
app.get('/api/system/status', getSystemStatus);
app.get('/api/dashboard/summary', getDashboardSummary);

// Route API Proxmox Logs
app.get('/api/proxmox/logs/tasks', getTasksLog);
app.get('/api/proxmox/logs/cluster', getClusterLog);
app.get('/api/proxmox/logs/task-detail', getTaskDetailLog);

// Route API Proxmox (Node Config & Metrik)
app.get('/api/proxmox', getProxmoxNodes);
app.post('/api/proxmox', createProxmoxNode);
app.put('/api/proxmox/:id', updateProxmoxNode);
app.delete('/api/proxmox/:id', deleteProxmoxNode);
app.post('/api/proxmox/:id/test', testProxmoxConnection);
app.get('/api/proxmox/:id/resources', getProxmoxResources);
app.get('/api/proxmox/:id/status', getProxmoxNodeStatus);

// Route API System Log (Internal)
app.get('/api/logs/system', getSystemLogs);

// Route Notifikasi Gangguan Aktif & Riwayat (Dashboard Web)
app.get('/api/alerts/active', getActiveAlerts);
app.get('/api/alerts/history', getAlertHistory);

// Route Pengaturan Cronjob Pembersihan Otomatis (Log & Riwayat Gangguan)
app.get('/api/settings/cleanup', getCleanupSettings);
app.put('/api/settings/cleanup', saveCleanupSettings);
app.post('/api/settings/cleanup/run', runManualCleanup);

// Route Threshold Network & Proxmox
app.get('/api/thresholds/network/catalog', getNetworkCatalog);
app.get('/api/thresholds/network', getNetworkThresholds);
app.put('/api/thresholds/network', saveNetworkThresholds);

app.get('/api/thresholds/proxmox/catalog', getProxmoxCatalog);
app.get('/api/thresholds/proxmox', getProxmoxThresholds);
app.put('/api/thresholds/proxmox', saveProxmoxThresholds);

// Route Insiden & Analitik SLA (Mendukung Web maupun Bearer Token Mobile via attachMobileUserIfPresent)
app.get('/api/incidents', attachMobileUserIfPresent, getIncidents);
app.get('/api/analytics', attachMobileUserIfPresent, getAnalytics);
app.post('/api/incidents/join', attachMobileUserIfPresent, joinIncident);
app.post('/api/incidents/resolve', attachMobileUserIfPresent, resolveIncident);

// ==========================================
// ROUTE API MOBILE V1 (Wajib Bearer Token)
// ==========================================
app.post('/api/mobile/v1/auth/login', mobileLogin);
app.get('/api/mobile/v1/system/status', verifyApiToken, getSystemStatus);
app.get('/api/mobile/v1/dashboard', verifyApiToken, getDashboardSummary);
app.get('/api/mobile/v1/alerts/active', verifyApiToken, getActiveAlerts);
app.get('/api/mobile/v1/alerts/history', verifyApiToken, getAlertHistory);
app.post('/api/mobile/v1/alerts/join', verifyApiToken, joinIncident);
app.post('/api/mobile/v1/alerts/resolve', verifyApiToken, resolveIncident);
app.get('/api/mobile/v1/incidents', verifyApiToken, getIncidents);
app.post('/api/mobile/v1/incidents/join', verifyApiToken, joinIncident);
app.post('/api/mobile/v1/incidents/resolve', verifyApiToken, resolveIncident);
app.get('/api/mobile/v1/analytics', verifyApiToken, getAnalytics);
app.get('/api/mobile/v1/targets', verifyApiToken, getTargets);
app.get('/api/mobile/v1/targets/:id/history', verifyApiToken, getTargetHistory);
app.get('/api/mobile/v1/proxmox', verifyApiToken, getProxmoxNodes);
app.get('/api/mobile/v1/proxmox/:id/status', verifyApiToken, getProxmoxNodeStatus);
app.get('/api/mobile/v1/proxmox/:id/resources', verifyApiToken, getProxmoxResources);

// Route Utama SPA
app.get(/^(?!\/api).*/, (req, res) => {
  const viteAssets = isProd ? resolveViteManifestAssets() : null;
  res.render('index', { isProd, viteAssets });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  startMonitoringDaemon();
});
