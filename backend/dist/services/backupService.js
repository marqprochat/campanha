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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
exports.initializeBackupService = initializeBackupService;
exports.getBackupService = getBackupService;
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util_1 = require("util");
const child_process_1 = require("child_process");
const cron = __importStar(require("node-cron"));
const websocketService_1 = require("./websocketService");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const prisma = new client_1.PrismaClient();
class BackupService {
    static instance;
    backupJobs = new Map();
    BACKUP_BASE_DIR = '/app/backups';
    constructor() {
        this.initializeBackupDirectory();
        this.loadScheduledBackups();
    }
    static getInstance() {
        if (!BackupService.instance) {
            BackupService.instance = new BackupService();
        }
        return BackupService.instance;
    }
    initializeBackupDirectory() {
        if (!fs.existsSync(this.BACKUP_BASE_DIR)) {
            fs.mkdirSync(this.BACKUP_BASE_DIR, { recursive: true });
            console.log('📁 Diretório de backup criado:', this.BACKUP_BASE_DIR);
        }
    }
    // Carrega backups agendados de todos os tenants ativos
    async loadScheduledBackups() {
        try {
            const tenants = await prisma.tenant.findMany({
                where: { active: true },
                select: { id: true, slug: true }
            });
            for (const tenant of tenants) {
                await this.scheduleBackup(tenant.id, {
                    enabled: true,
                    schedule: '0 2 * * *', // Diariamente às 2h
                    retentionDays: 30,
                    storageType: 'local'
                });
            }
            console.log(`📅 ${tenants.length} backups agendados carregados`);
        }
        catch (error) {
            console.error('❌ Erro ao carregar backups agendados:', error);
        }
    }
    // Agenda backup automático para um tenant
    async scheduleBackup(tenantId, config) {
        if (!config.enabled) {
            this.unscheduleBackup(tenantId);
            return;
        }
        // Remove agendamento anterior se existir
        this.unscheduleBackup(tenantId);
        const job = cron.schedule(config.schedule, async () => {
            console.log(`🔄 Iniciando backup agendado para tenant: ${tenantId}`);
            await this.createBackup(tenantId);
        });
        this.backupJobs.set(tenantId, job);
        console.log(`📅 Backup agendado para tenant ${tenantId} com schedule: ${config.schedule}`);
    }
    // Remove agendamento de backup
    unscheduleBackup(tenantId) {
        const existingJob = this.backupJobs.get(tenantId);
        if (existingJob) {
            existingJob.destroy();
            this.backupJobs.delete(tenantId);
            console.log(`📅 Backup desagendado para tenant: ${tenantId}`);
        }
    }
    // Cria backup completo dos dados de um tenant
    async createBackup(tenantId) {
        const startTime = Date.now();
        try {
            console.log(`🔄 Iniciando backup para tenant: ${tenantId}`);
            // Notificar início do backup
            await websocketService_1.websocketService.notifyTenant(tenantId, {
                title: 'Backup Iniciado',
                message: 'O processo de backup dos seus dados foi iniciado.',
                type: 'BACKUP',
                data: { tenantId, timestamp: new Date() }
            });
            // Busca dados do tenant
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { id: true, slug: true, name: true }
            });
            if (!tenant) {
                throw new Error(`Tenant não encontrado: ${tenantId}`);
            }
            // Cria diretório do tenant
            const tenantBackupDir = path.join(this.BACKUP_BASE_DIR, tenant.slug);
            if (!fs.existsSync(tenantBackupDir)) {
                fs.mkdirSync(tenantBackupDir, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `backup_${tenant.slug}_${timestamp}.json`;
            const backupPath = path.join(tenantBackupDir, backupFileName);
            // Coleta dados do tenant
            const backupData = await this.collectTenantData(tenantId);
            // Salva backup
            fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
            // Calcula tamanho do arquivo
            const stats = fs.statSync(backupPath);
            const backupInfo = {
                tenantId,
                tenantSlug: tenant.slug,
                backupPath,
                size: stats.size,
                createdAt: new Date(),
                status: 'success'
            };
            // Limpa backups antigos
            await this.cleanOldBackups(tenantId, 30);
            const duration = Date.now() - startTime;
            console.log(`✅ Backup concluído para ${tenant.slug} em ${duration}ms - Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
            // Notificar sucesso do backup
            await websocketService_1.websocketService.notifyTenant(tenantId, {
                title: 'Backup Concluído',
                message: `Backup realizado com sucesso em ${(duration / 1000).toFixed(1)}s. Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)}MB`,
                type: 'SUCCESS',
                data: {
                    tenantId,
                    tenantSlug: tenant.slug,
                    duration,
                    size: stats.size,
                    timestamp: new Date()
                }
            });
            return backupInfo;
        }
        catch (error) {
            console.error(`❌ Erro no backup para tenant ${tenantId}:`, error);
            // Notificar erro no backup
            await websocketService_1.websocketService.notifyTenant(tenantId, {
                title: 'Erro no Backup',
                message: `Falha ao realizar backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                type: 'ERROR',
                data: {
                    tenantId,
                    error: error instanceof Error ? error.message : 'Erro desconhecido',
                    timestamp: new Date()
                }
            });
            return {
                tenantId,
                tenantSlug: 'unknown',
                backupPath: '',
                size: 0,
                createdAt: new Date(),
                status: 'failed',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }
    // Coleta todos os dados de um tenant
    async collectTenantData(tenantId) {
        // Primeiro busca usuários
        const users = await prisma.user.findMany({ where: { tenantId } });
        const [tenant, contacts, campaigns, whatsAppSessions, notifications] = await Promise.all([
            // Dados do tenant
            prisma.tenant.findUnique({ where: { id: tenantId } }),
            // Contatos do tenant
            prisma.contact.findMany({ where: { tenantId } }),
            // Campanhas do tenant (sem include que não existe)
            prisma.campaign.findMany({ where: { tenantId } }),
            // Sessões WhatsApp do tenant
            prisma.whatsAppSession.findMany({ where: { tenantId } }),
            // Notificações dos usuários do tenant
            users.length > 0
                ? prisma.notification.findMany({ where: { userId: { in: users.map((u) => u.id) } } })
                : Promise.resolve([])
        ]);
        return {
            timestamp: new Date().toISOString(),
            version: '1.0',
            tenant,
            data: {
                users,
                contacts,
                campaigns,
                whatsAppSessions,
                notifications
            },
            statistics: {
                usersCount: users?.length || 0,
                contactsCount: contacts?.length || 0,
                campaignsCount: campaigns?.length || 0,
                sessionsCount: whatsAppSessions?.length || 0,
                notificationsCount: notifications?.length || 0
            }
        };
    }
    // Lista backups de um tenant
    async listBackups(tenantId) {
        try {
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { slug: true }
            });
            if (!tenant) {
                throw new Error(`Tenant não encontrado: ${tenantId}`);
            }
            const tenantBackupDir = path.join(this.BACKUP_BASE_DIR, tenant.slug);
            if (!fs.existsSync(tenantBackupDir)) {
                return [];
            }
            const files = fs.readdirSync(tenantBackupDir)
                .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
                .map(file => {
                const filePath = path.join(tenantBackupDir, file);
                const stats = fs.statSync(filePath);
                return {
                    tenantId,
                    tenantSlug: tenant.slug,
                    backupPath: filePath,
                    size: stats.size,
                    createdAt: stats.mtime,
                    status: 'success'
                };
            })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            return files;
        }
        catch (error) {
            console.error(`❌ Erro ao listar backups para tenant ${tenantId}:`, error);
            return [];
        }
    }
    // Restaura backup de um tenant
    async restoreBackup(tenantId, backupPath) {
        try {
            console.log(`🔄 Iniciando restore para tenant ${tenantId} do backup: ${backupPath}`);
            // Notificar início do restore
            await websocketService_1.websocketService.notifyTenant(tenantId, {
                title: 'Restauração Iniciada',
                message: 'O processo de restauração dos dados foi iniciado. Aguarde...',
                type: 'WARNING',
                data: { tenantId, backupPath, timestamp: new Date() }
            });
            if (!fs.existsSync(backupPath)) {
                throw new Error(`Arquivo de backup não encontrado: ${backupPath}`);
            }
            const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
            // Validação do backup
            if (!backupData.tenant || !backupData.data) {
                throw new Error('Formato de backup inválido');
            }
            // CUIDADO: Esta operação irá SUBSTITUIR todos os dados do tenant
            console.log(`⚠️ ATENÇÃO: Todos os dados atuais do tenant ${tenantId} serão substituídos!`);
            await prisma.$transaction(async (tx) => {
                // Remove dados existentes (em ordem reversa devido às dependências)
                // Primeiro buscar usuários para excluir notificações
                const existingUsers = await tx.user.findMany({ where: { tenantId } });
                if (existingUsers.length > 0) {
                    await tx.notification.deleteMany({
                        where: { userId: { in: existingUsers.map(u => u.id) } }
                    });
                }
                await tx.whatsAppSession.deleteMany({ where: { tenantId } });
                await tx.campaign.deleteMany({ where: { tenantId } });
                await tx.contact.deleteMany({ where: { tenantId } });
                await tx.user.deleteMany({ where: { tenantId } });
                // Restaura dados do backup
                if (backupData.data.users?.length > 0) {
                    await tx.user.createMany({ data: backupData.data.users });
                }
                if (backupData.data.contacts?.length > 0) {
                    await tx.contact.createMany({ data: backupData.data.contacts });
                }
                if (backupData.data.campaigns?.length > 0) {
                    for (const campaign of backupData.data.campaigns) {
                        const { contacts, ...campaignData } = campaign;
                        await tx.campaign.create({ data: campaignData });
                    }
                }
                if (backupData.data.whatsAppSessions?.length > 0) {
                    await tx.whatsAppSession.createMany({ data: backupData.data.whatsAppSessions });
                }
                if (backupData.data.notifications?.length > 0) {
                    await tx.notification.createMany({ data: backupData.data.notifications });
                }
            });
            console.log(`✅ Restore concluído para tenant ${tenantId}`);
            // Notificar sucesso do restore
            await websocketService_1.websocketService.notifyTenant(tenantId, {
                title: 'Restauração Concluída',
                message: 'Os dados foram restaurados com sucesso. O sistema já está atualizado.',
                type: 'SUCCESS',
                data: { tenantId, backupPath, timestamp: new Date() }
            });
        }
        catch (error) {
            console.error(`❌ Erro no restore para tenant ${tenantId}:`, error);
            // Notificar erro no restore
            await websocketService_1.websocketService.notifyTenant(tenantId, {
                title: 'Erro na Restauração',
                message: `Falha ao restaurar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                type: 'ERROR',
                data: {
                    tenantId,
                    backupPath,
                    error: error instanceof Error ? error.message : 'Erro desconhecido',
                    timestamp: new Date()
                }
            });
            throw error;
        }
    }
    // Limpa backups antigos
    async cleanOldBackups(tenantId, retentionDays) {
        try {
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { slug: true }
            });
            if (!tenant)
                return;
            const tenantBackupDir = path.join(this.BACKUP_BASE_DIR, tenant.slug);
            if (!fs.existsSync(tenantBackupDir))
                return;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            const files = fs.readdirSync(tenantBackupDir);
            let deletedCount = 0;
            for (const file of files) {
                if (!file.startsWith('backup_') || !file.endsWith('.json'))
                    continue;
                const filePath = path.join(tenantBackupDir, file);
                const stats = fs.statSync(filePath);
                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            }
            if (deletedCount > 0) {
                console.log(`🗑️ ${deletedCount} backups antigos removidos para tenant ${tenant.slug}`);
            }
        }
        catch (error) {
            console.error(`❌ Erro ao limpar backups antigos para tenant ${tenantId}:`, error);
        }
    }
    // Obtém estatísticas dos backups
    async getBackupStats() {
        try {
            const tenants = await prisma.tenant.findMany({
                where: { active: true },
                select: { id: true, slug: true, name: true }
            });
            const stats = await Promise.all(tenants.map(async (tenant) => {
                const backups = await this.listBackups(tenant.id);
                const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
                return {
                    tenantId: tenant.id,
                    tenantSlug: tenant.slug,
                    tenantName: tenant.name,
                    backupCount: backups.length,
                    totalSize,
                    lastBackup: backups[0]?.createdAt || null,
                    isScheduled: this.backupJobs.has(tenant.id)
                };
            }));
            return {
                totalTenants: tenants.length,
                totalBackups: stats.reduce((sum, stat) => sum + stat.backupCount, 0),
                totalSize: stats.reduce((sum, stat) => sum + stat.totalSize, 0),
                scheduledJobs: this.backupJobs.size,
                tenantStats: stats
            };
        }
        catch (error) {
            console.error('❌ Erro ao obter estatísticas de backup:', error);
            return {
                totalTenants: 0,
                totalBackups: 0,
                totalSize: 0,
                scheduledJobs: 0,
                tenantStats: []
            };
        }
    }
    // Inicia backup manual para todos os tenants
    async backupAllTenants() {
        try {
            const tenants = await prisma.tenant.findMany({
                where: { active: true },
                select: { id: true }
            });
            console.log(`🔄 Iniciando backup para ${tenants.length} tenants`);
            // Notificar SuperAdmins sobre início do backup global
            await websocketService_1.websocketService.notifySuperAdmins({
                title: 'Backup Global Iniciado',
                message: `Iniciando backup automático de ${tenants.length} tenants ativos.`,
                type: 'SYSTEM',
                data: { tenantsCount: tenants.length, timestamp: new Date() }
            });
            const results = await Promise.allSettled(tenants.map(tenant => this.createBackup(tenant.id)));
            const backupResults = results.map((result, index) => {
                if (result.status === 'fulfilled') {
                    return result.value;
                }
                else {
                    return {
                        tenantId: tenants[index].id,
                        tenantSlug: 'unknown',
                        backupPath: '',
                        size: 0,
                        createdAt: new Date(),
                        status: 'failed',
                        error: result.reason?.message || 'Erro desconhecido'
                    };
                }
            });
            // Calcular estatísticas do backup global
            const successCount = backupResults.filter(r => r.status === 'success').length;
            const failedCount = backupResults.filter(r => r.status === 'failed').length;
            const totalSize = backupResults
                .filter(r => r.status === 'success')
                .reduce((sum, r) => sum + r.size, 0);
            // Notificar SuperAdmins sobre conclusão do backup global
            await websocketService_1.websocketService.notifySuperAdmins({
                title: 'Backup Global Concluído',
                message: `Backup finalizado: ${successCount} sucessos, ${failedCount} falhas. Total: ${(totalSize / 1024 / 1024).toFixed(2)}MB`,
                type: successCount === tenants.length ? 'SUCCESS' : (failedCount > 0 ? 'WARNING' : 'INFO'),
                data: {
                    tenantsCount: tenants.length,
                    successCount,
                    failedCount,
                    totalSize,
                    timestamp: new Date()
                }
            });
            return backupResults;
        }
        catch (error) {
            console.error('❌ Erro no backup de todos os tenants:', error);
            // Notificar SuperAdmins sobre erro no backup global
            await websocketService_1.websocketService.notifySuperAdmins({
                title: 'Erro no Backup Global',
                message: `Falha crítica no processo de backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                type: 'ERROR',
                data: {
                    error: error instanceof Error ? error.message : 'Erro desconhecido',
                    timestamp: new Date()
                }
            });
            return [];
        }
    }
    // ========== NOVOS MÉTODOS PARA BACKUP GLOBAL DO SISTEMA ==========
    // Função auxiliar para executar comando com retry
    async execWithRetry(command, options, maxRetries = 5, delayMs = 3000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Tentativa ${attempt}/${maxRetries} de executar comando...`);
                const result = await execAsync(command, options);
                console.log(`✅ Comando executado com sucesso na tentativa ${attempt}`);
                return result;
            }
            catch (error) {
                console.error(`❌ Tentativa ${attempt}/${maxRetries} falhou:`, error instanceof Error ? error.message : error);
                if (attempt === maxRetries) {
                    throw error;
                }
                console.log(`⏳ Aguardando ${delayMs}ms antes da próxima tentativa...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                // Aumentar delay exponencialmente (mas limitado a 10 segundos)
                delayMs = Math.min(delayMs * 1.5, 10000);
            }
        }
    }
    // Cria backup completo do sistema (todos os dados + uploads)
    async createSystemBackup() {
        const startTime = Date.now();
        try {
            console.log('🔄 Iniciando backup completo do sistema');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `system_backup_${timestamp}.tar.gz`;
            const tempDir = path.join(this.BACKUP_BASE_DIR, 'temp', timestamp);
            const backupPath = path.join(this.BACKUP_BASE_DIR, backupFileName);
            // Criar diretório temporário
            fs.mkdirSync(tempDir, { recursive: true });
            // 1. Dump do banco de dados PostgreSQL
            console.log('📦 Exportando banco de dados...');
            const dbDumpPath = path.join(tempDir, 'database.sql');
            const databaseUrl = process.env.DATABASE_URL || '';
            // Parse DATABASE_URL
            const dbUrl = new URL(databaseUrl);
            const dbHost = dbUrl.hostname;
            const dbPort = dbUrl.port || '5432';
            const dbName = dbUrl.pathname.slice(1).split('?')[0];
            const dbUser = dbUrl.username;
            const dbPassword = dbUrl.password;
            // Executar pg_dump com retry (usa defaults: 5 tentativas, 3 segundos)
            await this.execWithRetry(`PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f ${dbDumpPath}`, { maxBuffer: 50 * 1024 * 1024 } // 50MB buffer
            );
            // 2. Copiar uploads
            console.log('📁 Copiando arquivos de upload...');
            const uploadsPath = '/app/uploads';
            const uploadsBackupPath = path.join(tempDir, 'uploads');
            if (fs.existsSync(uploadsPath)) {
                await execAsync(`cp -r ${uploadsPath} ${uploadsBackupPath}`);
            }
            // 3. Metadados do backup
            const metadata = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                type: 'full',
                database: {
                    host: dbHost,
                    port: dbPort,
                    name: dbName
                },
                system: {
                    nodeVersion: process.version,
                    platform: process.platform
                }
            };
            fs.writeFileSync(path.join(tempDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
            // 4. Compactar tudo
            console.log('🗜️ Compactando backup...');
            await execAsync(`tar -czf ${backupPath} -C ${tempDir} .`);
            // 5. Limpar diretório temporário
            await execAsync(`rm -rf ${tempDir}`);
            // 6. Calcular tamanho e retornar info
            const stats = fs.statSync(backupPath);
            const duration = Date.now() - startTime;
            console.log(`✅ Backup do sistema concluído em ${duration}ms - Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
            // Notificar SuperAdmins
            await websocketService_1.websocketService.notifySuperAdmins({
                title: 'Backup do Sistema Concluído',
                message: `Backup completo realizado com sucesso em ${(duration / 1000).toFixed(1)}s. Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)}MB`,
                type: 'SUCCESS',
                data: {
                    fileName: backupFileName,
                    size: stats.size,
                    duration,
                    timestamp: new Date()
                }
            });
            return {
                backupPath,
                fileName: backupFileName,
                size: stats.size,
                createdAt: new Date(),
                status: 'success',
                type: 'full'
            };
        }
        catch (error) {
            console.error('❌ Erro ao criar backup do sistema:', error);
            await websocketService_1.websocketService.notifySuperAdmins({
                title: 'Erro no Backup do Sistema',
                message: `Falha ao realizar backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                type: 'ERROR',
                data: {
                    error: error instanceof Error ? error.message : 'Erro desconhecido',
                    timestamp: new Date()
                }
            });
            throw error;
        }
    }
    // Lista todos os backups do sistema
    async listSystemBackups() {
        try {
            if (!fs.existsSync(this.BACKUP_BASE_DIR)) {
                return [];
            }
            const files = fs.readdirSync(this.BACKUP_BASE_DIR)
                .filter(file => file.startsWith('system_backup_') && file.endsWith('.tar.gz'))
                .map(file => {
                const filePath = path.join(this.BACKUP_BASE_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    backupPath: filePath,
                    fileName: file,
                    size: stats.size,
                    createdAt: stats.mtime,
                    status: 'success',
                    type: 'full'
                };
            })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            return files;
        }
        catch (error) {
            console.error('❌ Erro ao listar backups do sistema:', error);
            return [];
        }
    }
    // Restaura backup completo do sistema
    async restoreSystemBackup(backupPath) {
        try {
            console.log(`🔄 Iniciando restauração do sistema do backup: ${backupPath}`);
            await websocketService_1.websocketService.notifySuperAdmins({
                title: 'Restauração do Sistema Iniciada',
                message: '⚠️ ATENÇÃO: O sistema será restaurado. Todos os dados atuais serão substituídos!',
                type: 'WARNING',
                data: { backupPath, timestamp: new Date() }
            });
            if (!fs.existsSync(backupPath)) {
                throw new Error(`Arquivo de backup não encontrado: ${backupPath}`);
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const tempDir = path.join(this.BACKUP_BASE_DIR, 'restore', timestamp);
            // Criar diretório temporário
            fs.mkdirSync(tempDir, { recursive: true });
            // 1. Descompactar backup
            console.log('📦 Descompactando backup...');
            await execAsync(`tar -xzf ${backupPath} -C ${tempDir}`);
            // 2. Validar backup
            const metadataPath = path.join(tempDir, 'metadata.json');
            if (!fs.existsSync(metadataPath)) {
                throw new Error('Backup inválido: metadata.json não encontrado');
            }
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            console.log('📋 Metadata do backup:', metadata);
            // 3. Restaurar banco de dados
            console.log('🗄️ Restaurando banco de dados...');
            const dbDumpPath = path.join(tempDir, 'database.sql');
            if (!fs.existsSync(dbDumpPath)) {
                throw new Error('Backup inválido: database.sql não encontrado');
            }
            const databaseUrl = process.env.DATABASE_URL || '';
            const dbUrl = new URL(databaseUrl);
            const dbHost = dbUrl.hostname;
            const dbPort = dbUrl.port || '5432';
            const dbName = dbUrl.pathname.slice(1).split('?')[0];
            const dbUser = dbUrl.username;
            const dbPassword = dbUrl.password;
            // Forçar encerramento de todas as conexões ao banco antes de dropar
            console.log('🔌 Encerrando conexões ativas ao banco de dados...');
            await this.execWithRetry(`PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();"`, { maxBuffer: 50 * 1024 * 1024 });
            // Dropar e recriar banco com retry
            console.log('🗑️ Dropando banco de dados...');
            await this.execWithRetry(`PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "DROP DATABASE IF EXISTS ${dbName};"`, { maxBuffer: 50 * 1024 * 1024 });
            console.log('🆕 Criando novo banco de dados...');
            await this.execWithRetry(`PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "CREATE DATABASE ${dbName};"`, { maxBuffer: 50 * 1024 * 1024 });
            // Restaurar dump com retry
            console.log('📥 Importando dados do backup...');
            await this.execWithRetry(`PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${dbDumpPath}`, { maxBuffer: 50 * 1024 * 1024 });
            // 4. Restaurar uploads
            console.log('📁 Restaurando arquivos de upload...');
            const uploadsBackupPath = path.join(tempDir, 'uploads');
            const uploadsPath = '/app/uploads';
            if (fs.existsSync(uploadsBackupPath)) {
                // Limpar uploads atuais (exceto arquivos padrão)
                if (fs.existsSync(uploadsPath)) {
                    console.log('🧹 Limpando arquivos de upload atuais...');
                    const files = fs.readdirSync(uploadsPath);
                    for (const file of files) {
                        // Preservar arquivos padrão do sistema
                        if (file !== 'default_icon.png' && file !== 'default_favicon.png') {
                            const filePath = path.join(uploadsPath, file);
                            try {
                                if (fs.lstatSync(filePath).isDirectory()) {
                                    await execAsync(`rm -rf ${filePath}`);
                                }
                                else {
                                    fs.unlinkSync(filePath);
                                }
                            }
                            catch (err) {
                                console.warn(`⚠️ Não foi possível remover ${filePath}:`, err);
                            }
                        }
                    }
                }
                // Copiar novos arquivos do backup
                console.log('📋 Copiando arquivos do backup...');
                await execAsync(`cp -r ${uploadsBackupPath}/* ${uploadsPath}/ 2>/dev/null || true`);
            }
            // 5. Limpar diretório temporário
            await execAsync(`rm -rf ${tempDir}`);
            console.log('✅ Restauração do sistema concluída com sucesso');
            await websocketService_1.websocketService.notifySuperAdmins({
                title: 'Restauração do Sistema Concluída',
                message: '✅ O sistema foi restaurado com sucesso! Recomenda-se reiniciar os serviços.',
                type: 'SUCCESS',
                data: { backupPath, timestamp: new Date() }
            });
        }
        catch (error) {
            console.error('❌ Erro ao restaurar backup do sistema:', error);
            await websocketService_1.websocketService.notifySuperAdmins({
                title: 'Erro na Restauração do Sistema',
                message: `❌ Falha crítica: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                type: 'ERROR',
                data: {
                    backupPath,
                    error: error instanceof Error ? error.message : 'Erro desconhecido',
                    timestamp: new Date()
                }
            });
            throw error;
        }
    }
    // Configura backup automático do sistema
    systemBackupJob = null;
    configureSystemBackup(config) {
        if (this.systemBackupJob) {
            this.systemBackupJob.destroy();
            this.systemBackupJob = null;
        }
        if (!config.enabled) {
            console.log('📅 Backup automático do sistema desabilitado');
            return;
        }
        this.systemBackupJob = cron.schedule(config.schedule, async () => {
            console.log('🔄 Iniciando backup automático do sistema');
            try {
                await this.createSystemBackup();
                await this.cleanOldSystemBackups(config.retentionDays);
            }
            catch (error) {
                console.error('❌ Erro no backup automático do sistema:', error);
            }
        });
        console.log(`📅 Backup automático do sistema configurado: ${config.schedule}`);
    }
    // Limpa backups antigos do sistema
    async cleanOldSystemBackups(retentionDays) {
        try {
            if (!fs.existsSync(this.BACKUP_BASE_DIR))
                return;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            const files = fs.readdirSync(this.BACKUP_BASE_DIR);
            let deletedCount = 0;
            for (const file of files) {
                if (!file.startsWith('system_backup_') || !file.endsWith('.tar.gz'))
                    continue;
                const filePath = path.join(this.BACKUP_BASE_DIR, file);
                const stats = fs.statSync(filePath);
                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            }
            if (deletedCount > 0) {
                console.log(`🗑️ ${deletedCount} backups antigos do sistema removidos`);
            }
        }
        catch (error) {
            console.error('❌ Erro ao limpar backups antigos do sistema:', error);
        }
    }
    // Obtém configuração atual de backup automático
    getSystemBackupConfig() {
        // Por enquanto, retorna configuração padrão se houver job ativo
        if (this.systemBackupJob) {
            return {
                enabled: true,
                schedule: '0 2 * * *', // Diariamente às 2h
                retentionDays: 30,
                storageType: 'local'
            };
        }
        return null;
    }
}
exports.BackupService = BackupService;
// Inicializar serviço de backup
let backupService = null;
function initializeBackupService() {
    if (!backupService) {
        backupService = BackupService.getInstance();
        console.log('🔄 Serviço de backup inicializado');
    }
}
function getBackupService() {
    if (!backupService) {
        throw new Error('Serviço de backup não foi inicializado');
    }
    return backupService;
}
//# sourceMappingURL=backupService.js.map