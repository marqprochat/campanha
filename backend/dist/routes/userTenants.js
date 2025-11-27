"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userTenantController_1 = require("../controllers/userTenantController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todas as rotas requerem autenticação
router.use(auth_1.authMiddleware);
// Obter tenants disponíveis para o usuário
router.get('/', userTenantController_1.UserTenantController.getUserTenants);
// Obter tenant atual
router.get('/current', userTenantController_1.UserTenantController.getCurrentTenant);
// Trocar tenant ativo
router.post('/switch', userTenantController_1.UserTenantController.switchTenant);
// Gerenciar associações user-tenant (SUPERADMIN only)
router.post('/associations', userTenantController_1.UserTenantController.addUserToTenant);
router.delete('/associations/:userId/:tenantId', userTenantController_1.UserTenantController.removeUserFromTenant);
router.patch('/associations/:userId/:tenantId/role', userTenantController_1.UserTenantController.updateUserTenantRole);
// Listar usuários de um tenant (SUPERADMIN only)
router.get('/tenants/:tenantId/users', userTenantController_1.UserTenantController.getTenantUsers);
// Listar tenants de um usuário específico (SUPERADMIN only)
router.get('/users/:userId/tenants', userTenantController_1.UserTenantController.getUserTenantsById);
exports.default = router;
//# sourceMappingURL=userTenants.js.map