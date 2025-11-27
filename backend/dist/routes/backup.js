"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const backupController_1 = require("../controllers/backupController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Configurar multer para upload de backups
const backupStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/app/backups');
    },
    filename: (req, file, cb) => {
        // Manter o nome original do arquivo
        cb(null, file.originalname);
    }
});
const uploadBackup = (0, multer_1.default)({
    storage: backupStorage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB max
    },
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.tar.gz')) {
            cb(null, true);
        }
        else {
            cb(new Error('Apenas arquivos .tar.gz são permitidos'));
        }
    }
});
// Todas as rotas requerem autenticação
router.use(auth_1.authMiddleware);
// GET /api/backup - Listar backups (usuário vê apenas do seu tenant, SuperAdmin vê stats se sem tenantId)
router.get('/', backupController_1.BackupController.listBackups);
// POST /api/backup - Criar backup manual
router.post('/', backupController_1.BackupController.createBackup);
// POST /api/backup/schedule - Configurar agendamento (apenas SuperAdmin)
router.post('/schedule', backupController_1.BackupController.scheduleBackup);
// POST /api/backup/restore - Restaurar backup (apenas SuperAdmin)
router.post('/restore', backupController_1.BackupController.restoreBackup);
// GET /api/backup/stats - Estatísticas completas (apenas SuperAdmin)
router.get('/stats', backupController_1.BackupController.getBackupStats);
// ========== ROTAS PARA BACKUP GLOBAL DO SISTEMA ==========
// POST /api/backup/system - Criar backup completo do sistema (apenas SuperAdmin)
router.post('/system', backupController_1.BackupController.createSystemBackup);
// GET /api/backup/system - Listar backups do sistema (apenas SuperAdmin)
router.get('/system', backupController_1.BackupController.listSystemBackups);
// POST /api/backup/system/restore - Restaurar backup do sistema (apenas SuperAdmin)
router.post('/system/restore', backupController_1.BackupController.restoreSystemBackup);
// POST /api/backup/system/configure - Configurar backup automático (apenas SuperAdmin)
router.post('/system/configure', backupController_1.BackupController.configureSystemBackup);
// GET /api/backup/system/config - Obter configuração de backup automático (apenas SuperAdmin)
router.get('/system/config', backupController_1.BackupController.getSystemBackupConfig);
// GET /api/backup/system/download/:fileName - Download de backup do sistema (apenas SuperAdmin)
router.get('/system/download/:fileName', backupController_1.BackupController.downloadSystemBackup);
// POST /api/backup/system/upload - Upload de backup para restauração (apenas SuperAdmin)
router.post('/system/upload', uploadBackup.single('backup'), backupController_1.BackupController.uploadSystemBackup);
exports.default = router;
//# sourceMappingURL=backup.js.map