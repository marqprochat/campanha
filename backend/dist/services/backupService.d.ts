interface BackupConfig {
    enabled: boolean;
    schedule: string;
    retentionDays: number;
    storageType: 'local' | 's3';
}
interface SystemBackupInfo {
    backupPath: string;
    fileName: string;
    size: number;
    createdAt: Date;
    status: 'success' | 'failed' | 'in_progress';
    type: 'full' | 'database' | 'uploads';
    error?: string;
}
interface TenantBackupInfo {
    tenantId: string;
    tenantSlug: string;
    backupPath: string;
    size: number;
    createdAt: Date;
    status: 'success' | 'failed' | 'in_progress';
    error?: string;
}
export declare class BackupService {
    private static instance;
    private backupJobs;
    private readonly BACKUP_BASE_DIR;
    private constructor();
    static getInstance(): BackupService;
    private initializeBackupDirectory;
    private loadScheduledBackups;
    scheduleBackup(tenantId: string, config: BackupConfig): Promise<void>;
    unscheduleBackup(tenantId: string): void;
    createBackup(tenantId: string): Promise<TenantBackupInfo>;
    private collectTenantData;
    listBackups(tenantId: string): Promise<TenantBackupInfo[]>;
    restoreBackup(tenantId: string, backupPath: string): Promise<void>;
    private cleanOldBackups;
    getBackupStats(): Promise<any>;
    backupAllTenants(): Promise<TenantBackupInfo[]>;
    private execWithRetry;
    createSystemBackup(): Promise<SystemBackupInfo>;
    listSystemBackups(): Promise<SystemBackupInfo[]>;
    restoreSystemBackup(backupPath: string): Promise<void>;
    private systemBackupJob;
    configureSystemBackup(config: BackupConfig): void;
    private cleanOldSystemBackups;
    getSystemBackupConfig(): BackupConfig | null;
}
export declare function initializeBackupService(): void;
export declare function getBackupService(): BackupService;
export {};
//# sourceMappingURL=backupService.d.ts.map