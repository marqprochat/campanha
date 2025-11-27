"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemRoutes = void 0;
const express_1 = require("express");
const systemController_1 = require("../controllers/systemController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.systemRoutes = router;
// Aplicar middleware de autenticação para todas as rotas
router.use(auth_1.authMiddleware);
// Estatísticas gerais do sistema
router.get('/stats', systemController_1.getSystemStats);
// Estatísticas detalhadas por tenant
router.get('/tenant-stats', systemController_1.getTenantStats);
// Status de saúde do sistema
router.get('/health', systemController_1.getSystemHealth);
// Alertas de quotas excedidas
router.get('/quotas-alerts', systemController_1.getQuotasAlerts);
// Atualizar estatísticas materializadas
router.post('/refresh-stats', systemController_1.refreshStats);
//# sourceMappingURL=system.js.map