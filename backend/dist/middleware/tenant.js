"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticatedOnly = exports.tenantAdminOnly = exports.superAdminOnly = exports.requireRole = exports.attachTenant = void 0;
const attachTenant = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Usuário não autenticado'
            });
            return;
        }
        if (req.user.role === 'SUPERADMIN' && req.user.tenantId === undefined) {
            next();
            return;
        }
        if (!req.user.tenantId) {
            res.status(401).json({
                success: false,
                message: 'Tenant não definido para o usuário'
            });
            return;
        }
        if (!req.tenant) {
            res.status(500).json({
                success: false,
                message: 'Erro ao carregar informações do tenant'
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error('Erro no middleware attachTenant:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.attachTenant = attachTenant;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Usuário não autenticado'
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Acesso negado. Permissão insuficiente.'
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.superAdminOnly = (0, exports.requireRole)(['SUPERADMIN']);
exports.tenantAdminOnly = (0, exports.requireRole)(['TENANT_ADMIN', 'SUPERADMIN']);
exports.authenticatedOnly = (0, exports.requireRole)(['USER', 'TENANT_ADMIN', 'SUPERADMIN']);
//# sourceMappingURL=tenant.js.map