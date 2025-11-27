"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const alertsController_1 = require("../controllers/alertsController");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authMiddleware);
// GET /api/alerts - List alerts
router.get('/', alertsController_1.getAlerts);
// GET /api/alerts/summary - Alert summary for dashboard
router.get('/summary', alertsController_1.getAlertsSummary);
// POST /api/alerts - Create new alert (Admin+ only)
router.post('/', alertsController_1.createAlert);
// PUT /api/alerts/:id/resolve - Resolve alert
router.put('/:id/resolve', alertsController_1.resolveAlert);
exports.default = router;
//# sourceMappingURL=alerts.js.map