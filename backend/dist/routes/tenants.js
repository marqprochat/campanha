"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tenantController_1 = require("../controllers/tenantController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todas as rotas de tenants requerem autenticação e são limitadas a SUPERADMIN
router.use(auth_1.authMiddleware);
// GET /api/tenants - Listar todos os tenants
router.get('/', tenantController_1.TenantController.listTenants);
// POST /api/tenants - Criar novo tenant
router.post('/', tenantController_1.TenantController.createTenant);
// GET /api/tenants/:tenantId - Obter detalhes de um tenant
router.get('/:tenantId', tenantController_1.TenantController.getTenant);
// PUT /api/tenants/:tenantId - Atualizar tenant
router.put('/:tenantId', tenantController_1.TenantController.updateTenant);
// DELETE /api/tenants/:tenantId - Deletar tenant
router.delete('/:tenantId', tenantController_1.TenantController.deleteTenant);
exports.default = router;
//# sourceMappingURL=tenants.js.map