"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const router = (0, express_1.Router)();
// Rotas públicas
router.post('/login', authController_1.authValidators.login, authController_1.login);
// Rotas protegidas
router.get('/profile', auth_1.authMiddleware, authController_1.getProfile);
router.get('/verify', auth_1.authMiddleware, authController_1.verifyToken);
// Rotas de admin (SUPERADMIN pode criar usuários para qualquer tenant)
router.post('/register', auth_1.authMiddleware, tenant_1.superAdminOnly, authController_1.authValidators.register, authController_1.register);
exports.default = router;
//# sourceMappingURL=auth.js.map