import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import * as fs from 'fs';
import path from 'path';

// Routes
import { contactRoutes } from './routes/contactRoutes';
import { categoryRoutes } from './routes/categoryRoutes';
import { mockRoutes } from './routes/mockRoutes';
import { csvImportRoutes } from './routes/csvImportRoutes';
import wahaRoutes from './routes/waha';
import campaignRoutes from './routes/campaigns';
import settingsRoutes from './routes/settingsRoutes';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import mediaRoutes from './routes/mediaRoutes';
import tenantRoutes from './routes/tenants';
import userTenantsRoutes from './routes/userTenants';
import backupRoutes from './routes/backup';
import { systemRoutes } from './routes/system';
import alertsRoutes from './routes/alerts';
import analyticsRoutes from './routes/analytics';
import notificationsRoutes from './routes/notifications';
import messageTemplatesRoutes from './routes/messageTemplates';
import reportsRoutes from './routes/reports';
import automationRoutes from './routes/automation';
import chatwootRoutes from './routes/chatwootRoutes';
import leadPageRoutes from './routes/leadPageRoutes';
import uploadRoutes from './routes/uploadRoutes';

// Services
import { authMiddleware } from './middleware/auth';
import './services/campaignSchedulerService';
import { initializeAlertsMonitoring } from './services/alertsMonitoringService';
import { initializeBackupService } from './services/backupService';
import { websocketService } from './services/websocketService';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Proxy configuration
app.set('trust proxy', 1);

// Upload directory configuration
const uploadDir = process.env.NODE_ENV === 'production'
  ? '/app/uploads'
  : './uploads'; // Check relative path if needed, often relative to process.cwd()

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Directory created: ${uploadDir}`);
}

// CORS Config
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://localhost:3000'
    ];

    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware
// Exclude JSON/UrlEncoded processing for specific upload routes if needed, 
// but usually multer handles it fine even if body-parser runs first unless specifically configured otherwise.
// However, the previous code had an exclusion. Let's keep it safe.
app.use((req, res, next) => {
  if (req.path.includes('/media/upload') || req.path.includes('/upload/image')) {
    return next();
  }
  express.json({ limit: '50mb' })(req, res, next);
});

app.use((req, res, next) => {
  if (req.path.includes('/media/upload') || req.path.includes('/upload/image')) {
    return next();
  }
  express.urlencoded({ limit: '50mb', extended: true })(req, res, next);
});

// Serve uploads
app.use('/api/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Protected Routes
app.use('/api/contatos', authMiddleware, contactRoutes);
app.use('/api/categorias', authMiddleware, categoryRoutes);
app.use('/api/csv', authMiddleware, csvImportRoutes);
app.use('/api/waha', authMiddleware, wahaRoutes);
app.use('/api/campaigns', authMiddleware, campaignRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/tenants', authMiddleware, tenantRoutes);
app.use('/api/user-tenants', authMiddleware, userTenantsRoutes);
app.use('/api/backup', authMiddleware, backupRoutes);
app.use('/api/system', authMiddleware, systemRoutes);
app.use('/api/alerts', authMiddleware, alertsRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/notifications', authMiddleware, notificationsRoutes);
app.use('/api/templates', authMiddleware, messageTemplatesRoutes);
app.use('/api/reports', authMiddleware, reportsRoutes);
app.use('/api/automation', authMiddleware, automationRoutes);
app.use('/api/chatwoot', authMiddleware, chatwootRoutes);
app.use('/api/lead-pages', leadPageRoutes);
app.use('/api/media', authMiddleware, mediaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', authMiddleware, mockRoutes);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  websocketService.initialize(server);
  initializeAlertsMonitoring();
  initializeBackupService();
});