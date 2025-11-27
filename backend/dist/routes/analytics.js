"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Todas as rotas requerem autenticação
router.use(auth_1.authMiddleware);
// GET /api/analytics/tenant - Relatório completo do tenant do usuário
router.get('/tenant', analyticsController_1.AnalyticsController.getTenantAnalytics);
// GET /api/analytics/system - Relatório consolidado do sistema (SuperAdmin only)
router.get('/system', analyticsController_1.AnalyticsController.getSystemAnalytics);
// GET /api/analytics/campaigns - Relatório de performance de campanhas
router.get('/campaigns', analyticsController_1.AnalyticsController.getCampaignAnalytics);
// GET /api/analytics/export/:type - Exporta dados em CSV (contacts, campaigns, analytics)
router.get('/export/:type', analyticsController_1.AnalyticsController.exportData);
// GET /api/analytics/tenant/:tenantId - Analytics de tenant específico (SuperAdmin only)
router.get('/tenant/:tenantId', analyticsController_1.AnalyticsController.getSpecificTenantAnalytics);
exports.default = router;
//# sourceMappingURL=analytics.js.map