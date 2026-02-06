"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const fs = __importStar(require("fs"));
// Routes
const contactRoutes_1 = require("./routes/contactRoutes");
const categoryRoutes_1 = require("./routes/categoryRoutes");
const mockRoutes_1 = require("./routes/mockRoutes");
const csvImportRoutes_1 = require("./routes/csvImportRoutes");
const waha_1 = __importDefault(require("./routes/waha"));
const campaigns_1 = __importDefault(require("./routes/campaigns"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const mediaRoutes_1 = __importDefault(require("./routes/mediaRoutes"));
const tenants_1 = __importDefault(require("./routes/tenants"));
const userTenants_1 = __importDefault(require("./routes/userTenants"));
const backup_1 = __importDefault(require("./routes/backup"));
const system_1 = require("./routes/system");
const alerts_1 = __importDefault(require("./routes/alerts"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const messageTemplates_1 = __importDefault(require("./routes/messageTemplates"));
const reports_1 = __importDefault(require("./routes/reports"));
const automation_1 = __importDefault(require("./routes/automation"));
const chatwootRoutes_1 = __importDefault(require("./routes/chatwootRoutes"));
const leadPageRoutes_1 = __importDefault(require("./routes/leadPageRoutes"));
const groupRoutes_1 = require("./routes/groupRoutes");
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
// Services
const auth_2 = require("./middleware/auth");
require("./services/campaignSchedulerService");
const alertsMonitoringService_1 = require("./services/alertsMonitoringService");
const backupService_1 = require("./services/backupService");
const websocketService_1 = require("./services/websocketService");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
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
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://localhost:3000',
            'https://campanha.marqsolucoes.com.br'
        ];
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
// Middleware
// Exclude JSON/UrlEncoded processing for specific upload routes if needed, 
// but usually multer handles it fine even if body-parser runs first unless specifically configured otherwise.
// However, the previous code had an exclusion. Let's keep it safe.
app.use((req, res, next) => {
    if (req.path.includes('/media/upload') || req.path.includes('/upload/image')) {
        return next();
    }
    express_1.default.json({ limit: '50mb' })(req, res, next);
});
app.use((req, res, next) => {
    if (req.path.includes('/media/upload') || req.path.includes('/upload/image')) {
        return next();
    }
    express_1.default.urlencoded({ limit: '50mb', extended: true })(req, res, next);
});
// Serve uploads
app.use('/api/uploads', express_1.default.static(uploadDir));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/settings', settingsRoutes_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Protected Routes
app.use('/api/contatos', auth_2.authMiddleware, contactRoutes_1.contactRoutes);
app.use('/api/categorias', auth_2.authMiddleware, categoryRoutes_1.categoryRoutes);
app.use('/api/csv', auth_2.authMiddleware, csvImportRoutes_1.csvImportRoutes);
app.use('/api/waha', auth_2.authMiddleware, waha_1.default);
app.use('/api/campaigns', auth_2.authMiddleware, campaigns_1.default);
app.use('/api/users', auth_2.authMiddleware, users_1.default);
app.use('/api/tenants', auth_2.authMiddleware, tenants_1.default);
app.use('/api/user-tenants', auth_2.authMiddleware, userTenants_1.default);
app.use('/api/backup', auth_2.authMiddleware, backup_1.default);
app.use('/api/system', auth_2.authMiddleware, system_1.systemRoutes);
app.use('/api/alerts', auth_2.authMiddleware, alerts_1.default);
app.use('/api/analytics', auth_2.authMiddleware, analytics_1.default);
app.use('/api/notifications', auth_2.authMiddleware, notifications_1.default);
app.use('/api/templates', auth_2.authMiddleware, messageTemplates_1.default);
app.use('/api/reports', auth_2.authMiddleware, reports_1.default);
app.use('/api/automation', auth_2.authMiddleware, automation_1.default);
app.use('/api/chatwoot', auth_2.authMiddleware, chatwootRoutes_1.default);
app.use('/api/lead-pages', leadPageRoutes_1.default);
app.use('/api/groups', groupRoutes_1.groupRoutes);
app.use('/api/media', auth_2.authMiddleware, mediaRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
app.use('/api', auth_2.authMiddleware, mockRoutes_1.mockRoutes);
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    websocketService_1.websocketService.initialize(server);
    (0, alertsMonitoringService_1.initializeAlertsMonitoring)();
    (0, backupService_1.initializeBackupService)();
});
//# sourceMappingURL=server.js.map