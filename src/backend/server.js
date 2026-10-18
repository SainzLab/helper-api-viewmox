import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

import { login } from './controllers/authController.js';
import { getUsers, createUser, updateUser, deleteUser, getToken, resetToken, toggleUserStatus } from './controllers/userController.js';
import { getTargets, createTarget, updateTarget, deleteTarget, toggleTargetStatus, getTargetHistory, getSystemStatus } from './controllers/targetController.js';
import { startMonitoringDaemon } from './services/monitoringDaemon.js';
import { getProxmoxNodes, createProxmoxNode, updateProxmoxNode, deleteProxmoxNode, testProxmoxConnection, getProxmoxResources, getProxmoxNodeStatus } from './controllers/proxmoxController.js';
import { getSystemLogs } from './controllers/systemLogController.js';

// IMPORT CONTROLLER LOG PROXMOX BARU
import { getTasksLog, getClusterLog, getTaskDetailLog } from './controllers/proxmoxLogController.js';

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

// Route Utama
app.get(/^(?!\/api).*/, (req, res) => {
  res.render('index', { isProd });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  startMonitoringDaemon();
});