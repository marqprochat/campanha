export interface WhatsAppSessionData {
    name: string;
    displayName?: string;
    status: 'WORKING' | 'SCAN_QR_CODE' | 'STOPPED' | 'FAILED';
    provider: 'WAHA' | 'EVOLUTION' | 'QUEPASA';
    config?: any;
    me?: {
        id: string;
        pushName: string;
        lid?: string;
        jid?: string;
    };
    qr?: string;
    qrExpiresAt?: Date;
    assignedWorker?: string;
    tenantId?: string;
    quepasaToken?: string;
}
export declare class WhatsAppSessionService {
    static getAllSessions(tenantId?: string): Promise<{
        name: string;
        displayName: string;
        status: string;
        provider: "WAHA" | "EVOLUTION" | "QUEPASA";
        config: any;
        me: {
            id: string;
            pushName: string;
            lid: string | null;
            jid: string | null;
        } | undefined;
        qr: string | null;
        qrExpiresAt: Date | null;
        assignedWorker: string | null;
        tenantId: string | null;
        quepasaToken: string | null;
    }[]>;
    static getSession(name: string, tenantId?: string): Promise<{
        name: string;
        displayName: string;
        status: string;
        provider: string;
        config: any;
        me: {
            id: string;
            pushName: string;
            lid: string | null;
            jid: string | null;
        } | undefined;
        qr: string | null;
        qrExpiresAt: Date | null;
        assignedWorker: string | null;
        tenantId: string | null;
        quepasaToken: string | null;
    }>;
    static createOrUpdateSession(data: WhatsAppSessionData): Promise<{
        id: string;
        tenantId: string | null;
        criadoEm: Date;
        atualizadoEm: Date;
        name: string;
        displayName: string | null;
        status: string;
        config: string | null;
        meId: string | null;
        mePushName: string | null;
        meLid: string | null;
        meJid: string | null;
        qr: string | null;
        qrExpiresAt: Date | null;
        assignedWorker: string | null;
        provider: string;
        quepasaToken: string | null;
    }>;
    static deleteSession(name: string, tenantId?: string): Promise<void>;
    static updateSessionStatus(name: string, status: string, additionalData?: Partial<WhatsAppSessionData>, tenantId?: string): Promise<void>;
}
//# sourceMappingURL=whatsappSessionService.d.ts.map