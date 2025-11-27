export declare class TenantSettingsService {
    getTenantSettings(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        openaiApiKey: string | null;
        groqApiKey: string | null;
        customBranding: import("@prisma/client/runtime/library").JsonValue | null;
        chatwootUrl: string | null;
        chatwootAccountId: string | null;
        chatwootApiToken: string | null;
    }>;
    updateTenantSettings(tenantId: string, data: {
        openaiApiKey?: string | null;
        groqApiKey?: string | null;
        customBranding?: any;
        chatwootUrl?: string | null;
        chatwootAccountId?: string | null;
        chatwootApiToken?: string | null;
    }): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        openaiApiKey: string | null;
        groqApiKey: string | null;
        customBranding: import("@prisma/client/runtime/library").JsonValue | null;
        chatwootUrl: string | null;
        chatwootAccountId: string | null;
        chatwootApiToken: string | null;
    }>;
}
export declare const tenantSettingsService: TenantSettingsService;
//# sourceMappingURL=tenantSettingsService.d.ts.map