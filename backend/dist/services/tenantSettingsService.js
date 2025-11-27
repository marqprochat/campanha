"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantSettingsService = exports.TenantSettingsService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class TenantSettingsService {
    async getTenantSettings(tenantId) {
        try {
            console.log('📋 TenantSettingsService.getTenantSettings - tenantId:', tenantId, 'type:', typeof tenantId);
            if (!tenantId || tenantId === 'undefined' || tenantId === 'null') {
                console.error('❌ TenantID inválido recebido:', tenantId);
                throw new Error(`TenantID inválido: ${tenantId}`);
            }
            let settings = await prisma.tenantSettings.findUnique({
                where: { tenantId }
            });
            if (!settings) {
                console.log('⚠️ TenantSettings não encontrado, criando novo para tenantId:', tenantId);
                settings = await prisma.tenantSettings.create({
                    data: {
                        tenantId,
                        openaiApiKey: null,
                        groqApiKey: null,
                        customBranding: undefined
                    }
                });
            }
            return settings;
        }
        catch (error) {
            console.error('❌ Error getting tenant settings for tenantId:', tenantId, 'error:', error);
            throw error;
        }
    }
    async updateTenantSettings(tenantId, data) {
        try {
            const settings = await prisma.tenantSettings.upsert({
                where: { tenantId },
                update: {
                    openaiApiKey: data.openaiApiKey !== undefined ? data.openaiApiKey : undefined,
                    groqApiKey: data.groqApiKey !== undefined ? data.groqApiKey : undefined,
                    customBranding: data.customBranding !== undefined ? data.customBranding : undefined,
                    chatwootUrl: data.chatwootUrl !== undefined ? data.chatwootUrl : undefined,
                    chatwootAccountId: data.chatwootAccountId !== undefined ? data.chatwootAccountId : undefined,
                    chatwootApiToken: data.chatwootApiToken !== undefined ? data.chatwootApiToken : undefined
                },
                create: {
                    tenantId,
                    openaiApiKey: data.openaiApiKey || null,
                    groqApiKey: data.groqApiKey || null,
                    customBranding: data.customBranding || undefined,
                    chatwootUrl: data.chatwootUrl || null,
                    chatwootAccountId: data.chatwootAccountId || null,
                    chatwootApiToken: data.chatwootApiToken || null
                }
            });
            return settings;
        }
        catch (error) {
            console.error('Error updating tenant settings:', error);
            throw error;
        }
    }
}
exports.TenantSettingsService = TenantSettingsService;
exports.tenantSettingsService = new TenantSettingsService();
//# sourceMappingURL=tenantSettingsService.js.map