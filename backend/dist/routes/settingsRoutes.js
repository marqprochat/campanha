"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_1 = require("../controllers/settingsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/settings/public - Buscar configurações públicas (sem auth)
router.get('/public', settingsController_1.getPublicSettings);
// GET /api/settings/public/metadata - Buscar metadados para crawlers (WhatsApp, Facebook, etc.)
router.get('/public/metadata', settingsController_1.getMetadata);
// GET /api/settings - Buscar configurações (protegida)
router.get('/', auth_1.authMiddleware, settingsController_1.getSettings);
// PUT /api/settings - Atualizar configurações (protegida)
router.put('/', auth_1.authMiddleware, settingsController_1.settingsValidation, settingsController_1.updateSettings);
// POST /api/settings/logo - Upload de logo (protegida)
router.post('/logo', auth_1.authMiddleware, settingsController_1.uploadLogo);
// DELETE /api/settings/logo - Remover logo (protegida)
router.delete('/logo', auth_1.authMiddleware, settingsController_1.removeLogo);
// POST /api/settings/favicon - Upload de favicon (protegida)
router.post('/favicon', auth_1.authMiddleware, settingsController_1.uploadFavicon);
// DELETE /api/settings/favicon - Remover favicon (protegida)
router.delete('/favicon', auth_1.authMiddleware, settingsController_1.removeFavicon);
// POST /api/settings/icon - Upload de ícone geral (protegida)
router.post('/icon', auth_1.authMiddleware, settingsController_1.uploadIcon);
// DELETE /api/settings/icon - Remover ícone geral (protegida)
router.delete('/icon', auth_1.authMiddleware, settingsController_1.removeIcon);
exports.default = router;
//# sourceMappingURL=settingsRoutes.js.map