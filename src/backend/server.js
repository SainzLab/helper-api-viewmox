import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

import { login, mobileLogin } from './controllers/authController.js';
import { getUsers, createUser, updateUser, deleteUser, getToken, resetToken, toggleUserStatus } from './controllers/userController.js';
import { getTargets, createTarget, updateTarget, deleteTarget, toggleTargetStatus, getTargetHistory, getSystemStatus } from './controllers/targetController.js';
import { startMonitoringDaemon } from './services/monitoringDaemon.js';
import { getProxmoxNodes, createProxmoxNode, updateProxmoxNode, deleteProxmoxNode, testProxmoxConnection, getProxmoxResources, getProxmoxNodeStatus } from './controllers/proxmoxController.js';
import { getSystemLogs } from './controllers/systemLogController.js';
import { getNetworkThresholds, saveNetworkThresholds, getProxmoxThresholds, saveProxmoxThresholds, getNetworkCatalog, getProxmoxCatalog } from './controllers/thresholdController.js';
import { getActiveAlerts, getAlertHistory } from './controllers/mobileAlertController.js';
import { getTasksLog, getClusterLog, getTaskDetailLog } from './controllers/proxmoxLogController.js';
import { verifyApiToken } from './middlewares/authMiddleware.js';
import { getIncidents, joinIncident, resolveIncident, getAnalytics } from './controllers/incidentController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Middleware Parsing
app.use(express.json()); 
app.use(cookieParser());

// Konfigurasi EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(process.cwd(), 'public')));

// Route Auth
app.post('/api/auth/login', login);

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

// Route Status Konektivitas Node
app.get('/api/system/status', getSystemStatus);

// ROUTE API PROXMOX LOGS 
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

// Route Notifikasi Gangguan Aktif (untuk dashboard web)
app.get('/api/alerts/active', getActiveAlerts);
app.get('/api/alerts/history', getAlertHistory);

// Route Threshold 
app.get('/api/thresholds/network/catalog', getNetworkCatalog);
app.get('/api/thresholds/network', getNetworkThresholds);
app.put('/api/thresholds/network', saveNetworkThresholds);

// Route Threshold Proxmox
app.get('/api/thresholds/proxmox/catalog', getProxmoxCatalog);
app.get('/api/thresholds/proxmox', getProxmoxThresholds);
app.put('/api/thresholds/proxmox', saveProxmoxThresholds);

// Gunakan middleware verifyApiToken agar rute ini wajib menggunakan Token di header
app.get('/api/mobile/v1/alerts/active', verifyApiToken, getActiveAlerts);
app.get('/api/mobile/v1/targets', verifyApiToken, getTargets);
app.post('/api/mobile/v1/auth/login', mobileLogin);
app.get('/api/mobile/v1/alerts/active', verifyApiToken, getActiveAlerts);

// Tambahkan di bawah kumpulan rute yang sudah ada
app.get('/api/incidents', getIncidents);
app.get('/api/analytics', getAnalytics);
app.post('/api/incidents/join', joinIncident);
app.post('/api/incidents/resolve', resolveIncident);

// Route Utama
app.get(/^(?!\/api).*/, (req, res) => {
  res.render('index', { isProd });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  startMonitoringDaemon();
});