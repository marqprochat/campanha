import { Server as HTTPServer } from 'http';
export declare class WebSocketService {
    private static instance;
    private io;
    private connectedUsers;
    private constructor();
    static getInstance(): WebSocketService;
    initialize(server: HTTPServer): void;
    private addUserConnection;
    private removeUserConnection;
    notifyUser(userId: string, notification: {
        title: string;
        message: string;
        type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CAMPAIGN' | 'BACKUP' | 'SYSTEM';
        data?: any;
    }): Promise<void>;
    notifyTenant(tenantId: string, notification: {
        title: string;
        message: string;
        type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CAMPAIGN' | 'BACKUP' | 'SYSTEM';
        data?: any;
    }): Promise<void>;
    notifySuperAdmins(notification: {
        title: string;
        message: string;
        type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CAMPAIGN' | 'BACKUP' | 'SYSTEM';
        data?: any;
    }): Promise<void>;
    emitCampaignProgress(tenantId: string, campaignData: {
        campaignId: string;
        campaignName: string;
        progress: number;
        totalContacts: number;
        sentCount: number;
        failedCount: number;
        status: string;
    }): void;
    private emitUserCount;
    private emitUnreadCount;
    emitSystemStatus(status: {
        type: 'backup' | 'campaign' | 'system' | 'database';
        message: string;
        status: 'success' | 'error' | 'warning' | 'info';
        data?: any;
    }): void;
    get isInitialized(): boolean;
    get activeConnections(): number;
}
export declare const websocketService: WebSocketService;
//# sourceMappingURL=websocketService.d.ts.map