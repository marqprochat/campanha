"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkConnectionQuota = exports.checkCampaignQuota = exports.checkContactQuota = exports.checkUserQuota = exports.quotaMiddleware = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const quotaMiddleware = (check) => {
    return async (req, res, next) => {
        try {
            // SUPERADMIN não tem limitações de quota
            if (req.user?.role === 'SUPERADMIN') {
                return next();
            }
            // Usuários precisam ter tenantId para verificação de quota
            if (!req.tenantId) {
                res.status(403).json({
                    success: false,
                    message: 'Acesso negado. Tenant não identificado.'
                });
                return;
            }
            // Buscar quotas do tenant
            const tenantQuota = await prisma.tenantQuota.findUnique({
                where: { tenantId: req.tenantId },
                include: {
                    tenant: {
                        include: {
                            _count: {
                                select: {
                                    users: true,
                                    contacts: true,
                                    campaigns: true,
                                    whatsappSessions: true
                                }
                            }
                        }
                    }
                }
            });
            if (!tenantQuota) {
                res.status(403).json({
                    success: false,
                    message: 'Configuração de quotas não encontrada para este tenant.'
                });
                return;
            }
            // Verificar quota baseada no recurso
            let currentCount = 0;
            let maxAllowed = 0;
            let resourceName = '';
            switch (check.resource) {
                case 'users':
                    currentCount = tenantQuota.tenant._count.users;
                    maxAllowed = tenantQuota.maxUsers;
                    resourceName = 'usuários';
                    break;
                case 'contacts':
                    currentCount = tenantQuota.tenant._count.contacts;
                    maxAllowed = tenantQuota.maxContacts;
                    resourceName = 'contatos';
                    break;
                case 'campaigns':
                    currentCount = tenantQuota.tenant._count.campaigns;
                    maxAllowed = tenantQuota.maxCampaigns;
                    resourceName = 'campanhas';
                    break;
                case 'connections':
                    currentCount = tenantQuota.tenant._count.whatsappSessions;
                    maxAllowed = tenantQuota.maxConnections;
                    resourceName = 'conexões WhatsApp';
                    break;
            }
            // Para criação, verificar se excederá o limite
            if (check.action === 'create' && currentCount >= maxAllowed) {
                res.status(403).json({
                    success: false,
                    message: `Limite de ${resourceName} atingido (${currentCount}/${maxAllowed}). Faça upgrade do seu plano para continuar expandindo.`,
                    upgradeRequired: true,
                    quota: {
                        resource: check.resource,
                        current: currentCount,
                        max: maxAllowed,
                        remaining: 0
                    }
                });
                return;
            }
            // Se chegou até aqui, quota OK
            next();
        }
        catch (error) {
            console.error('Erro no middleware de quota:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno ao verificar quotas'
            });
        }
    };
};
exports.quotaMiddleware = quotaMiddleware;
// Middlewares específicos para cada recurso
exports.checkUserQuota = (0, exports.quotaMiddleware)({ resource: 'users', action: 'create' });
exports.checkContactQuota = (0, exports.quotaMiddleware)({ resource: 'contacts', action: 'create' });
exports.checkCampaignQuota = (0, exports.quotaMiddleware)({ resource: 'campaigns', action: 'create' });
exports.checkConnectionQuota = (0, exports.quotaMiddleware)({ resource: 'connections', action: 'create' });
//# sourceMappingURL=quotaMiddleware.js.map